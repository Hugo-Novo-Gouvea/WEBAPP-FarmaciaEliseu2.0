namespace FarmaciaEliseu.Api.DTOs;

public record ResumoValorDto(int Quantidade, decimal Total);

public record FechamentoPorFuncionarioDto(string? FuncionariosNome, int Quantidade, decimal Total);

public record FechamentoCaixaDto(
    DateTime Data,
    ResumoValorDto VendasNoDia,
    ResumoValorDto RecebidoEmDinheiroNoDia,
    ResumoValorDto PendenteDoDia,
    ResumoValorDto RecebidoDeDividasAntigas,
    IEnumerable<FechamentoPorFuncionarioDto> PorFuncionario
);
