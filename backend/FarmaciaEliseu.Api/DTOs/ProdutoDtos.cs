namespace FarmaciaEliseu.Api.DTOs;

public record ProdutoDto(
    int ProdutosId,
    string? Descricao,
    string? UnidadeMedida,
    decimal? PrecoCompra,
    decimal? PrecoVenda,
    string? Localizacao,
    string? Laboratorio,
    string? Principio,
    string? Generico,
    string? CodigoProduto,
    string? CodigoBarras,
    DateTime DataCadastro,
    DateTime DataUltimoRegistro
);

public record ProdutoCreateDto(
    string Descricao,
    string? UnidadeMedida,
    decimal? PrecoCompra,
    decimal? PrecoVenda,
    string? Localizacao,
    string? Laboratorio,
    string? Principio,
    string? Generico,
    string? CodigoProduto,
    string? CodigoBarras
);

public record ProdutoUpdateDto(
    string Descricao,
    string? UnidadeMedida,
    decimal? PrecoCompra,
    decimal? PrecoVenda,
    string? Localizacao,
    string? Laboratorio,
    string? Principio,
    string? Generico,
    string? CodigoProduto,
    string? CodigoBarras
);
