using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Mapping;
using FarmaciaEliseu.Api.Models;
using FarmaciaEliseu.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Controllers;

// Consulta movimentos (vendas) e seus itens a partir dos dados ja existentes no
// banco. A unica escrita feita aqui e "marcar como pago", que so atualiza
// data_pagamento/valor_pago do proprio movimento (nunca cria/exclui nada). A
// criacao de novas vendas fica no VendasController.
[ApiController]
[Route("api/[controller]")]
public class MovimentosController : ControllerBase
{
    private readonly FarmaciaContext _context;
    private readonly CupomService _cupomService;

    public MovimentosController(FarmaciaContext context, CupomService cupomService)
    {
        _context = context;
        _cupomService = cupomService;
    }

    // A tabela de movimentos e muito grande (dezenas de milhares de linhas), entao
    // a paginacao e a busca sao feitas no banco em vez de trazer tudo para o front.
    private async Task<PagedResult<MovimentoDto>> BuscarPaginado(
        IQueryable<Movimento> baseQuery, int page, int pageSize, string? search, bool maisAntigosPrimeiro = false)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = baseQuery;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var termoComoCodigo = int.TryParse(term, out var codigo) ? codigo : (int?)null;

            query = query.Where(m =>
                (m.ClientesNome != null && EF.Functions.ILike(m.ClientesNome, $"%{term}%")) ||
                (m.FuncionariosNome != null && EF.Functions.ILike(m.FuncionariosNome, $"%{term}%")) ||
                (termoComoCodigo != null && m.CodigoMovimento == termoComoCodigo));
        }

        var totalCount = await query.CountAsync();
        var ordenada = maisAntigosPrimeiro
            ? query.OrderBy(m => m.DataVenda)
            : query.OrderByDescending(m => m.DataVenda);
        var movimentos = await ordenada
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<MovimentoDto>(movimentos.Select(MovimentoMapper.ToDto), totalCount);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<MovimentoDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null)
    {
        return Ok(await BuscarPaginado(_context.Movimentos, page, pageSize, search));
    }

    // Contas a receber: por pedido explicito, considera "em aberto" apenas os
    // movimentos com data_pagamento NULL (a data sentinela legada de 1901-01-01
    // fica de fora dessa regra por enquanto).
    [HttpGet("pendentes")]
    public async Task<ActionResult<PagedResult<MovimentoDto>>> GetPendentes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null)
    {
        var baseQuery = _context.Movimentos.Where(m => m.DataPagamento == null);
        return Ok(await BuscarPaginado(baseQuery, page, pageSize, search));
    }

    // Cobrança: contas ainda em aberto (data_pagamento NULL) e vendidas há mais
    // de X dias — mesma regra do Contas a Receber, só que filtrando por idade
    // da dívida e mostrando as mais antigas primeiro.
    [HttpGet("cobranca")]
    public async Task<ActionResult<PagedResult<MovimentoDto>>> GetCobranca(
        [FromQuery] int dias = 30,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null)
    {
        dias = Math.Max(dias, 0);
        var limite = DateTime.Now.Date.AddDays(-dias);

        var baseQuery = _context.Movimentos.Where(m => m.DataPagamento == null && m.DataVenda <= limite);
        return Ok(await BuscarPaginado(baseQuery, page, pageSize, search, maisAntigosPrimeiro: true));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MovimentoDetalheDto>> GetById(int id)
    {
        var movimento = await _context.Movimentos.FirstOrDefaultAsync(m => m.MovimentosId == id);
        if (movimento is null) return NotFound();

        var itens = await _context.ItensPorMovimento
            .Where(i => i.MovimentosId == id)
            .OrderBy(i => i.ProdutosDescricao)
            .ToListAsync();

        return Ok(MovimentoMapper.ToDetalheDto(movimento, itens));
    }

    // Gera o cupom em ESC/POS (Base64) deste movimento, para os pontos de
    // impressao no front (Movimentacao, Vender e Contas a Receber).
    [HttpGet("{id:int}/cupom")]
    public async Task<ActionResult<CupomDto>> GetCupom(int id)
    {
        var movimento = await _context.Movimentos.FirstOrDefaultAsync(m => m.MovimentosId == id);
        if (movimento is null) return NotFound();

        var itens = await _context.ItensPorMovimento
            .Where(i => i.MovimentosId == id)
            .OrderBy(i => i.ProdutosDescricao)
            .ToListAsync();

        int? codigoFichario = null;
        if (movimento.ClientesId != null)
        {
            codigoFichario = await _context.Clientes
                .Where(c => c.ClientesId == movimento.ClientesId)
                .Select(c => c.CodigoFichario)
                .FirstOrDefaultAsync();
        }

        var detalhe = MovimentoMapper.ToDetalheDto(movimento, itens);
        var base64 = _cupomService.GerarBase64Venda(detalhe, codigoFichario);

        return Ok(new CupomDto(base64));
    }

    // Faz o "só marca se ainda não tiver sido marcado" como uma única
    // operação atômica no banco (ExecuteUpdateAsync com WHERE data_pagamento
    // IS NULL), em vez de ler-depois-gravar — isso evita que duas pessoas
    // marcando o mesmo movimento como pago ao mesmo tempo (ex.: em dois
    // computadores) gerem qualquer inconsistência: só a primeira consegue,
    // a segunda recebe um erro claro de conflito.
    [HttpPost("{id:int}/marcar-pago")]
    public async Task<ActionResult<MovimentoDto>> MarcarComoPago(int id)
    {
        var agora = DateTime.Now;

        var linhasAfetadas = await _context.Movimentos
            .Where(m => m.MovimentosId == id && m.DataPagamento == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(m => m.DataPagamento, agora)
                .SetProperty(m => m.ValorPago, m => m.ValorTotal)
                .SetProperty(m => m.DataUltimoRegistro, agora));

        if (linhasAfetadas == 0)
        {
            var existe = await _context.Movimentos.AnyAsync(m => m.MovimentosId == id);
            if (!existe) return NotFound();

            return Conflict("Este movimento já está marcado como pago (talvez por outra pessoa agora mesmo).");
        }

        var movimento = await _context.Movimentos.FirstAsync(m => m.MovimentosId == id);
        return Ok(MovimentoMapper.ToDto(movimento));
    }

    // Cancela uma venda: soft delete do movimento e de todos os itens dele
    // (nunca DELETE FROM). O movimento cancelado some de todas as telas
    // (Movimentação, Contas a Receber, Cobrança, Dashboard) porque essas
    // consultas já filtram deletado = false.
    [HttpPost("{id:int}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        var linhasAfetadas = await _context.Movimentos
            .Where(m => m.MovimentosId == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(m => m.Deletado, true)
                .SetProperty(m => m.DataUltimoRegistro, DateTime.Now));

        if (linhasAfetadas == 0)
        {
            await transaction.RollbackAsync();
            return NotFound();
        }

        await _context.ItensPorMovimento
            .Where(i => i.MovimentosId == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(i => i.Deletado, true));

        await transaction.CommitAsync();

        return NoContent();
    }
}
