using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Models;

namespace FarmaciaEliseu.Api.Mapping;

public static class MovimentoMapper
{
    public static MovimentoDto ToDto(Movimento m) => new(
        m.MovimentosId, m.CodigoMovimento, m.ClientesNome, m.FuncionariosNome,
        m.ValorTotal, m.DescontoTotal, m.ValorPago, m.DataVenda, m.DataPagamento);

    public static ItemMovimentoDto ToItemDto(ItemPorMovimento i) => new(
        i.IpmId, i.ProdutosDescricao, i.ProdutosCodigoProduto, i.Quantidade,
        i.PrecoUnitarioDiaVenda, i.PrecoTotalDiaVenda, i.PrecoUnitarioAtual,
        i.PrecoTotalAtual, i.DataPagamentoItem);

    public static MovimentoDetalheDto ToDetalheDto(Movimento m, IEnumerable<ItemPorMovimento> itens) => new(
        m.MovimentosId, m.CodigoMovimento, m.ClientesNome, m.FuncionariosNome,
        m.ValorTotal, m.DescontoTotal, m.ValorPago, m.DataVenda, m.DataPagamento,
        itens.Select(ToItemDto));
}
