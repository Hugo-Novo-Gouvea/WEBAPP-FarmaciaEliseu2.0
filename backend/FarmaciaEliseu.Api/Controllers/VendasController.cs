using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Mapping;
using FarmaciaEliseu.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Controllers;

// PDV: cria um novo movimento (venda) com seus itens.
//
// A tabela "movimentos" nao tem uma coluna de forma de pagamento, entao ela e
// representada com as colunas que ja existem, do mesmo jeito que o Contas a
// Receber ja usa:
//   - "dinheiro" (pago na hora)  -> data_pagamento = agora, valor_pago = valor_total
//   - "marcar"   (fiado em aberto) -> data_pagamento = NULL, valor_pago = 0
[ApiController]
[Route("api/[controller]")]
public class VendasController : ControllerBase
{
    private const string FormaPagamentoDinheiro = "dinheiro";
    private const string FormaPagamentoMarcar = "marcar";

    private readonly FarmaciaContext _context;

    public VendasController(FarmaciaContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<MovimentoDetalheDto>> Criar(VendaInputDto dto)
    {
        if (dto.Itens is null || dto.Itens.Count == 0)
        {
            return BadRequest("A venda precisa ter pelo menos um item.");
        }

        var formaPagamento = dto.FormaPagamento?.Trim().ToLowerInvariant();
        if (formaPagamento != FormaPagamentoDinheiro && formaPagamento != FormaPagamentoMarcar)
        {
            return BadRequest("Forma de pagamento inválida. Use 'dinheiro' ou 'marcar'.");
        }

        if (dto.Itens.Any(i => i.Quantidade <= 0))
        {
            return BadRequest("A quantidade de cada item deve ser maior que zero.");
        }

        if (dto.Itens.Any(i => i.PrecoUnitario < 0))
        {
            return BadRequest("O preço de cada item não pode ser negativo.");
        }

        var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.ClientesId == dto.ClientesId);
        if (cliente is null) return BadRequest("Cliente não encontrado.");

        var funcionario = await _context.Funcionarios.FirstOrDefaultAsync(f => f.FuncionariosId == dto.FuncionariosId);
        if (funcionario is null) return BadRequest("Funcionário não encontrado.");

        var produtosIds = dto.Itens.Select(i => i.ProdutosId).Distinct().ToList();
        var produtos = await _context.Produtos.Where(p => produtosIds.Contains(p.ProdutosId)).ToListAsync();
        var produtosPorId = produtos.ToDictionary(p => p.ProdutosId);

        var idProdutoFaltando = produtosIds.FirstOrDefault(id => !produtosPorId.ContainsKey(id));
        if (idProdutoFaltando != 0)
        {
            return BadRequest($"Produto {idProdutoFaltando} não encontrado.");
        }

        var agora = DateTime.Now;
        var valorTotal = dto.Itens.Sum(i => i.Quantidade * i.PrecoUnitario);
        var pagoNaHora = formaPagamento == FormaPagamentoDinheiro;

        var movimento = new Movimento
        {
            CodigoMovimento = 0,
            ClientesId = cliente.ClientesId,
            ClientesNome = cliente.Nome,
            FuncionariosId = funcionario.FuncionariosId,
            FuncionariosNome = funcionario.Nome,
            ValorTotal = valorTotal,
            DescontoTotal = Math.Max(dto.DescontoTotal, 0),
            ValorPago = pagoNaHora ? valorTotal : 0,
            DataVenda = agora,
            DataPagamento = pagoNaHora ? agora : null,
            DataCadastro = agora,
            DataUltimoRegistro = agora,
            Deletado = false
        };

        await using var transaction = await _context.Database.BeginTransactionAsync();

        _context.Movimentos.Add(movimento);
        await _context.SaveChangesAsync();

        var itens = dto.Itens.Select(item =>
        {
            var produto = produtosPorId[item.ProdutosId];
            var precoTotal = item.Quantidade * item.PrecoUnitario;
            return new ItemPorMovimento
            {
                MovimentosId = movimento.MovimentosId,
                ProdutosId = produto.ProdutosId,
                ProdutosDescricao = string.IsNullOrWhiteSpace(item.DescricaoAvulso) ? produto.Descricao : item.DescricaoAvulso,
                ProdutosCodigoProduto = produto.CodigoProduto,
                Quantidade = item.Quantidade,
                PrecoUnitarioDiaVenda = item.PrecoUnitario,
                PrecoTotalDiaVenda = precoTotal,
                PrecoUnitarioAtual = item.PrecoUnitario,
                PrecoTotalAtual = precoTotal,
                DataCadastro = agora,
                Deletado = false,
                DataPagamentoItem = null
            };
        }).ToList();

        _context.ItensPorMovimento.AddRange(itens);
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return CreatedAtAction(
            "GetById",
            "Movimentos",
            new { id = movimento.MovimentosId },
            MovimentoMapper.ToDetalheDto(movimento, itens));
    }
}
