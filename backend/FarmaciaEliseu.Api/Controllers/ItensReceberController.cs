using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Controllers;

// Quitação por item (não pela venda inteira): permite marcar itens
// específicos de diferentes vendas em aberto como pagos, e opcionalmente
// lançar um único item novo "RESTO DE CONTA" com a diferença quando o valor
// pago for menor que o total dos itens selecionados.
[ApiController]
[Route("api/[controller]")]
public class ItensReceberController : ControllerBase
{
    private const int ProdutoAvulsoId = 1;

    private readonly FarmaciaContext _context;

    public ItensReceberController(FarmaciaContext context)
    {
        _context = context;
    }

    // Item ainda em aberto = nao quitado individualmente (data_pagamento_item
    // nulo) E a venda a que pertence tambem ainda esta em aberto (data_pagamento
    // nula) — se a venda inteira ja foi paga pelo Contas a Receber "clássico",
    // os itens dela nao aparecem mais aqui.
    [HttpGet]
    public async Task<ActionResult<PagedResult<ItemPendenteDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] int? clientesId = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query =
            (from item in _context.ItensPorMovimento
             join mov in _context.Movimentos on item.MovimentosId equals mov.MovimentosId
             where item.DataPagamentoItem == null && mov.DataPagamento == null
             select new { item, mov }).AsNoTracking();

        if (clientesId is not null)
        {
            query = query.Where(x => x.mov.ClientesId == clientesId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                (x.mov.ClientesNome != null && EF.Functions.ILike(x.mov.ClientesNome, $"%{term}%")) ||
                (x.item.ProdutosDescricao != null && EF.Functions.ILike(x.item.ProdutosDescricao, $"%{term}%")));
        }

        var totalCount = await query.CountAsync();
        var pagina = await query
            .OrderByDescending(x => x.mov.DataVenda)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var itens = pagina.Select(x => new ItemPendenteDto(
            x.item.IpmId, x.mov.MovimentosId, x.mov.CodigoMovimento, x.mov.ClientesId, x.mov.ClientesNome,
            x.item.ProdutosDescricao, x.item.ProdutosCodigoProduto, x.item.Quantidade,
            x.item.PrecoTotalDiaVenda, x.mov.DataVenda));

        return Ok(new PagedResult<ItemPendenteDto>(itens, totalCount));
    }

    // Assim como em MarcarComoPago, a "reivindicação" dos itens (primeiro
    // passo abaixo) é uma operação atômica no banco com WHERE
    // data_pagamento_item IS NULL: se duas pessoas selecionarem os mesmos
    // itens e clicarem em Abater/Resto de Conta ao mesmo tempo, só a
    // primeira consegue reivindicar todos — a segunda recebe um conflito
    // claro em vez de duplicar a quitação ou criar dois "resto de conta".
    [HttpPost("quitar")]
    public async Task<ActionResult<QuitarItensResultDto>> Quitar(QuitarItensInputDto dto)
    {
        if (dto.IpmIds is null || dto.IpmIds.Count == 0)
        {
            return BadRequest("Selecione ao menos um item.");
        }

        if (dto.ValorPago <= 0)
        {
            return BadRequest("O valor pago deve ser maior que zero.");
        }

        var idsUnicos = dto.IpmIds.Distinct().ToList();
        var agora = DateTime.Now;

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var itensReivindicados = await _context.ItensPorMovimento
            .Where(i => idsUnicos.Contains(i.IpmId) && i.DataPagamentoItem == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(i => i.DataPagamentoItem, agora));

        if (itensReivindicados != idsUnicos.Count)
        {
            await transaction.RollbackAsync();
            return Conflict(
                "Algum item selecionado não foi encontrado ou já foi quitado (talvez por outra pessoa agora mesmo). Atualize a lista e tente novamente.");
        }

        var itens = await _context.ItensPorMovimento
            .AsNoTracking()
            .Where(i => idsUnicos.Contains(i.IpmId))
            .ToListAsync();

        var movimentosIds = itens.Select(i => i.MovimentosId!.Value).Distinct().ToList();
        // Estes SIM ficam rastreados: são alterados mais abaixo (fecham o
        // movimento quando todos os itens dele foram quitados) e salvos.
        var movimentos = await _context.Movimentos
            .Where(m => movimentosIds.Contains(m.MovimentosId))
            .ToListAsync();

        var clientesIds = movimentos.Select(m => m.ClientesId).Distinct().ToList();
        if (clientesIds.Count > 1)
        {
            await transaction.RollbackAsync();
            return BadRequest("Os itens selecionados pertencem a clientes diferentes.");
        }

        var valorTotalSelecionado = itens.Sum(i => i.PrecoTotalDiaVenda ?? 0);
        if (dto.ValorPago > valorTotalSelecionado)
        {
            await transaction.RollbackAsync();
            return BadRequest("O valor pago não pode ser maior que o total dos itens selecionados.");
        }

        var valorRestante = valorTotalSelecionado - dto.ValorPago;

        Funcionario? funcionario = null;
        if (valorRestante > 0)
        {
            if (dto.FuncionariosId is null)
            {
                await transaction.RollbackAsync();
                return BadRequest("Informe o funcionário responsável para lançar o resto de conta.");
            }

            funcionario = await _context.Funcionarios.AsNoTracking().FirstOrDefaultAsync(f => f.FuncionariosId == dto.FuncionariosId);
            if (funcionario is null)
            {
                await transaction.RollbackAsync();
                return BadRequest("Funcionário não encontrado.");
            }
        }

        int? novoMovimentoId = null;

        if (valorRestante > 0)
        {
            var clienteId = clientesIds[0];
            var cliente = clienteId != null
                ? await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.ClientesId == clienteId)
                : null;

            var novoMovimento = new Movimento
            {
                CodigoMovimento = 0,
                ClientesId = clienteId,
                ClientesNome = cliente?.Nome ?? movimentos[0].ClientesNome,
                FuncionariosId = funcionario!.FuncionariosId,
                FuncionariosNome = funcionario.Nome,
                ValorTotal = valorRestante,
                DescontoTotal = 0,
                ValorPago = 0,
                DataVenda = agora,
                DataPagamento = null,
                DataCadastro = agora,
                DataUltimoRegistro = agora,
                Deletado = false
            };
            _context.Movimentos.Add(novoMovimento);
            await _context.SaveChangesAsync();

            _context.ItensPorMovimento.Add(new ItemPorMovimento
            {
                MovimentosId = novoMovimento.MovimentosId,
                ProdutosId = ProdutoAvulsoId,
                ProdutosDescricao = "RESTO DE CONTA",
                ProdutosCodigoProduto = null,
                Quantidade = 1,
                PrecoUnitarioDiaVenda = valorRestante,
                PrecoTotalDiaVenda = valorRestante,
                PrecoUnitarioAtual = valorRestante,
                PrecoTotalAtual = valorRestante,
                DataCadastro = agora,
                Deletado = false,
                DataPagamentoItem = null
            });

            novoMovimentoId = novoMovimento.MovimentosId;
        }

        // Fecha automaticamente, no nivel do movimento, qualquer venda cujos
        // itens (nao excluidos) estejam TODOS quitados agora — mantem o Contas
        // a Receber "clássico" (por movimento) consistente com a quitação por item.
        foreach (var movimentoId in movimentosIds)
        {
            var itensDoMovimento = await _context.ItensPorMovimento
                .AsNoTracking()
                .Where(i => i.MovimentosId == movimentoId)
                .ToListAsync();

            if (itensDoMovimento.Count > 0 && itensDoMovimento.All(i => i.DataPagamentoItem != null))
            {
                var movimento = movimentos.First(m => m.MovimentosId == movimentoId);
                movimento.DataPagamento = agora;
                movimento.ValorPago = movimento.ValorTotal;
                movimento.DataUltimoRegistro = agora;
            }
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new QuitarItensResultDto(
            itens.Count, valorTotalSelecionado, dto.ValorPago, Math.Max(valorRestante, 0), novoMovimentoId));
    }
}
