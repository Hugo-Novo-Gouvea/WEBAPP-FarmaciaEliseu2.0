namespace FarmaciaEliseu.Api.DTOs;

// Um item de venda ainda nao quitado (individualmente), junto com dados do
// movimento a que pertence — para a tela de "abater itens" do Contas a Receber.
public record ItemPendenteDto(
    int IpmId,
    int MovimentosId,
    int? CodigoMovimento,
    int? ClientesId,
    string? ClientesNome,
    string? ProdutosDescricao,
    string? ProdutosCodigoProduto,
    int? Quantidade,
    decimal? PrecoTotalDiaVenda,
    DateTime? DataVenda
);

public record QuitarItensInputDto(
    List<int> IpmIds,
    decimal ValorPago,
    int? FuncionariosId
);

public record QuitarItensResultDto(
    int ItensQuitados,
    decimal ValorTotalSelecionado,
    decimal ValorPago,
    decimal ValorRestante,
    int? NovoMovimentoId
);
