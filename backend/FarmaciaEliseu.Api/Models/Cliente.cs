namespace FarmaciaEliseu.Api.Models;

public class Cliente
{
    public int ClientesId { get; set; }
    public string? Nome { get; set; }
    public string? Endereco { get; set; }
    public string? Rg { get; set; }
    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
    public DateTime? DataNascimento { get; set; }
    public int? CodigoFichario { get; set; }
    public DateTime DataCadastro { get; set; }
    public DateTime DataUltimoRegistro { get; set; }
    public bool Deletado { get; set; }
}
