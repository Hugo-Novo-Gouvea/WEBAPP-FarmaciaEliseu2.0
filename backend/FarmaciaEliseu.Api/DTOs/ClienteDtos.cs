namespace FarmaciaEliseu.Api.DTOs;

public record ClienteDto(
    int ClientesId,
    string? Nome,
    string? Endereco,
    string? Rg,
    string? Cpf,
    string? Telefone,
    string? Celular,
    DateTime? DataNascimento,
    int? CodigoFichario,
    DateTime DataCadastro,
    DateTime DataUltimoRegistro
);

public record ClienteCreateDto(
    string Nome,
    string? Endereco,
    string? Rg,
    string? Cpf,
    string? Telefone,
    string? Celular,
    DateTime? DataNascimento,
    int? CodigoFichario
);

public record ClienteUpdateDto(
    string Nome,
    string? Endereco,
    string? Rg,
    string? Cpf,
    string? Telefone,
    string? Celular,
    DateTime? DataNascimento,
    int? CodigoFichario
);
