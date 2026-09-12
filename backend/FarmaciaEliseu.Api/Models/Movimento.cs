namespace FarmaciaEliseu.Api.Models;

public class Movimento
{
    public int MovimentosId { get; set; }
    public int? CodigoMovimento { get; set; }
    public int? ClientesId { get; set; }
    public string? ClientesNome { get; set; }
    public int? FuncionariosId { get; set; }
    public string? FuncionariosNome { get; set; }
    public decimal? ValorTotal { get; set; }
    public decimal? DescontoTotal { get; set; }
    public decimal? ValorPago { get; set; }
    public DateTime? DataVenda { get; set; }
    public DateTime? DataPagamento { get; set; }
    public DateTime DataCadastro { get; set; }
    public DateTime DataUltimoRegistro { get; set; }
    public bool Deletado { get; set; }
}
