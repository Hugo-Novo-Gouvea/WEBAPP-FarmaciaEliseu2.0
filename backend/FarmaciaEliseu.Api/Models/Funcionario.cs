namespace FarmaciaEliseu.Api.Models;

public class Funcionario
{
    public int FuncionariosId { get; set; }
    public string? Nome { get; set; }
    public string? CodigoAntigo { get; set; }
    public DateTime DataCadastro { get; set; }
    public DateTime DataUltimoRegistro { get; set; }
    public bool Deletado { get; set; }
}
