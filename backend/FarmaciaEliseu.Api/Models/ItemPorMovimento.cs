namespace FarmaciaEliseu.Api.Models;

public class ItemPorMovimento
{
    public int IpmId { get; set; }
    public int? MovimentosId { get; set; }
    public int? ProdutosId { get; set; }
    public string? ProdutosDescricao { get; set; }
    public string? ProdutosCodigoProduto { get; set; }
    public int? Quantidade { get; set; }
    public decimal? PrecoUnitarioDiaVenda { get; set; }
    public decimal? PrecoTotalDiaVenda { get; set; }
    public decimal? PrecoUnitarioAtual { get; set; }
    public decimal? PrecoTotalAtual { get; set; }
    public DateTime DataCadastro { get; set; }
    public bool Deletado { get; set; }
    public DateTime? DataPagamentoItem { get; set; }
}
