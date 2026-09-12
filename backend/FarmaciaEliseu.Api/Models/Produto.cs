namespace FarmaciaEliseu.Api.Models;

public class Produto
{
    public int ProdutosId { get; set; }
    public string? Descricao { get; set; }
    public string? UnidadeMedida { get; set; }
    public decimal? PrecoCompra { get; set; }
    public decimal? PrecoVenda { get; set; }
    public string? Localizacao { get; set; }
    public string? Laboratorio { get; set; }
    public string? Principio { get; set; }
    public string? Generico { get; set; }
    public string? CodigoProduto { get; set; }
    public string? CodigoBarras { get; set; }
    public DateTime DataCadastro { get; set; }
    public DateTime DataUltimoRegistro { get; set; }
    public bool Deletado { get; set; }
}
