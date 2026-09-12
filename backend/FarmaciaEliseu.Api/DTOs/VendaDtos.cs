namespace FarmaciaEliseu.Api.DTOs;

public record VendaItemInputDto(
    int ProdutosId,
    string? DescricaoAvulso,
    int Quantidade,
    decimal PrecoUnitario
);

public record VendaInputDto(
    int ClientesId,
    int FuncionariosId,
    string FormaPagamento,
    List<VendaItemInputDto> Itens,
    decimal DescontoTotal = 0
);
