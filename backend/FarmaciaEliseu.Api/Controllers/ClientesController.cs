using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly FarmaciaContext _context;

    public ClientesController(FarmaciaContext context)
    {
        _context = context;
    }

    private static ClienteDto ToDto(Cliente c) => new(
        c.ClientesId, c.Nome, c.Endereco, c.Rg, c.Cpf, c.Telefone, c.Celular,
        c.DataNascimento, c.CodigoFichario, c.DataCadastro, c.DataUltimoRegistro);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> GetAll()
    {
        var clientes = await _context.Clientes
            .AsNoTracking()
            .OrderBy(c => c.Nome)
            .ToListAsync();
        return Ok(clientes.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteDto>> GetById(int id)
    {
        var cliente = await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.ClientesId == id);
        if (cliente is null) return NotFound();
        return Ok(ToDto(cliente));
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Create(ClienteCreateDto dto)
    {
        var now = DateTime.Now;
        var cliente = new Cliente
        {
            Nome = dto.Nome,
            Endereco = dto.Endereco,
            Rg = dto.Rg,
            Cpf = dto.Cpf,
            Telefone = dto.Telefone,
            Celular = dto.Celular,
            DataNascimento = dto.DataNascimento,
            CodigoFichario = dto.CodigoFichario,
            DataCadastro = now,
            DataUltimoRegistro = now,
            Deletado = false
        };

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = cliente.ClientesId }, ToDto(cliente));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ClienteUpdateDto dto)
    {
        var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.ClientesId == id);
        if (cliente is null) return NotFound();

        cliente.Nome = dto.Nome;
        cliente.Endereco = dto.Endereco;
        cliente.Rg = dto.Rg;
        cliente.Cpf = dto.Cpf;
        cliente.Telefone = dto.Telefone;
        cliente.Celular = dto.Celular;
        cliente.DataNascimento = dto.DataNascimento;
        cliente.CodigoFichario = dto.CodigoFichario;
        cliente.DataUltimoRegistro = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(ToDto(cliente));
    }

    // Soft delete: apenas marca "deletado = true". Nunca executa DELETE FROM.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.ClientesId == id);
        if (cliente is null) return NotFound();

        cliente.Deletado = true;
        cliente.DataUltimoRegistro = DateTime.Now;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
