namespace FarmaciaEliseu.Api.DTOs;

public record FuncionarioDto(
    int FuncionariosId,
    string? Nome,
    string? CodigoAntigo,
    DateTime DataCadastro,
    DateTime DataUltimoRegistro
);

public record FuncionarioCreateDto(
    string Nome,
    string? CodigoAntigo
);

public record FuncionarioUpdateDto(
    string Nome,
    string? CodigoAntigo
);
