namespace FarmaciaEliseu.Api.DTOs;

public record MovimentoDto(
    int MovimentosId,
    int? CodigoMovimento,
    string? ClientesNome,
    string? FuncionariosNome,
    decimal? ValorTotal,
    decimal? DescontoTotal,
    decimal? ValorPago,
    DateTime? DataVenda,
    DateTime? DataPagamento
);

public record ItemMovimentoDto(
    int IpmId,
    string? ProdutosDescricao,
    string? ProdutosCodigoProduto,
    int? Quantidade,
    decimal? PrecoUnitarioDiaVenda,
    decimal? PrecoTotalDiaVenda,
    decimal? PrecoUnitarioAtual,
    decimal? PrecoTotalAtual,
    DateTime? DataPagamentoItem
);

public record MovimentoDetalheDto(
    int MovimentosId,
    int? CodigoMovimento,
    string? ClientesNome,
    string? FuncionariosNome,
    decimal? ValorTotal,
    decimal? DescontoTotal,
    decimal? ValorPago,
    DateTime? DataVenda,
    DateTime? DataPagamento,
    IEnumerable<ItemMovimentoDto> Itens
);
