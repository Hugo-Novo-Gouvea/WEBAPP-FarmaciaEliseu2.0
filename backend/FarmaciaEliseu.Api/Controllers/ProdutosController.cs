using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProdutosController : ControllerBase
{
    private readonly FarmaciaContext _context;

    public ProdutosController(FarmaciaContext context)
    {
        _context = context;
    }

    private static ProdutoDto ToDto(Produto p) => new(
        p.ProdutosId, p.Descricao, p.UnidadeMedida, p.PrecoCompra, p.PrecoVenda,
        p.Localizacao, p.Laboratorio, p.Principio, p.Generico, p.CodigoProduto,
        p.CodigoBarras, p.DataCadastro, p.DataUltimoRegistro);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProdutoDto>>> GetAll()
    {
        var produtos = await _context.Produtos
            .OrderBy(p => p.Descricao)
            .ToListAsync();
        return Ok(produtos.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProdutoDto>> GetById(int id)
    {
        var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.ProdutosId == id);
        if (produto is null) return NotFound();
        return Ok(ToDto(produto));
    }

    // Suporte ao PDV: busca por codigo de barras exato (leitor/digitacao) ou por
    // nome (quando a pessoa digita o remedio em vez do codigo). A tabela tem ~59 mil
    // produtos, entao nao da para trazer tudo para o front como nas outras telas.
    [HttpGet("buscar")]
    public async Task<ActionResult> Buscar([FromQuery] string? codigoBarras, [FromQuery] string? nome)
    {
        if (!string.IsNullOrWhiteSpace(codigoBarras))
        {
            var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.CodigoBarras == codigoBarras);
            if (produto is null) return NotFound();
            return Ok(ToDto(produto));
        }

        if (!string.IsNullOrWhiteSpace(nome))
        {
            var termo = nome.Trim();
            var produtos = await _context.Produtos
                .Where(p => p.Descricao != null && EF.Functions.ILike(p.Descricao, $"%{termo}%"))
                .OrderBy(p => p.Descricao)
                .Take(20)
                .ToListAsync();
            return Ok(produtos.Select(ToDto));
        }

        return BadRequest("Informe codigoBarras ou nome para buscar.");
    }

    [HttpPost]
    public async Task<ActionResult<ProdutoDto>> Create(ProdutoCreateDto dto)
    {
        var now = DateTime.Now;
        var produto = new Produto
        {
            Descricao = dto.Descricao,
            UnidadeMedida = dto.UnidadeMedida,
            PrecoCompra = dto.PrecoCompra,
            PrecoVenda = dto.PrecoVenda,
            Localizacao = dto.Localizacao,
            Laboratorio = dto.Laboratorio,
            Principio = dto.Principio,
            Generico = dto.Generico,
            CodigoProduto = dto.CodigoProduto,
            CodigoBarras = dto.CodigoBarras,
            DataCadastro = now,
            DataUltimoRegistro = now,
            Deletado = false
        };

        _context.Produtos.Add(produto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = produto.ProdutosId }, ToDto(produto));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ProdutoUpdateDto dto)
    {
        var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.ProdutosId == id);
        if (produto is null) return NotFound();

        produto.Descricao = dto.Descricao;
        produto.UnidadeMedida = dto.UnidadeMedida;
        produto.PrecoCompra = dto.PrecoCompra;
        produto.PrecoVenda = dto.PrecoVenda;
        produto.Localizacao = dto.Localizacao;
        produto.Laboratorio = dto.Laboratorio;
        produto.Principio = dto.Principio;
        produto.Generico = dto.Generico;
        produto.CodigoProduto = dto.CodigoProduto;
        produto.CodigoBarras = dto.CodigoBarras;
        produto.DataUltimoRegistro = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(ToDto(produto));
    }

    // Soft delete: apenas marca "deletado = true". Nunca executa DELETE FROM.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.ProdutosId == id);
        if (produto is null) return NotFound();

        produto.Deletado = true;
        produto.DataUltimoRegistro = DateTime.Now;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
