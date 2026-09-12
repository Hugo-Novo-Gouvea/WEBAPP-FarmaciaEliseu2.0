namespace FarmaciaEliseu.Api.DTOs;

public record PagedResult<T>(IEnumerable<T> Items, int TotalCount);
