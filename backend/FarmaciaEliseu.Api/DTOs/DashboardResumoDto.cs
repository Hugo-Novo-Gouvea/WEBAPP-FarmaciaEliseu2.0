namespace FarmaciaEliseu.Api.DTOs;

public record DashboardResumoDto(
    int VendasHojeCount,
    decimal VendasHojeTotal,
    int FiadoAbertoCount,
    decimal FiadoAbertoTotal,
    IEnumerable<MovimentoDto> UltimasVendas
);
