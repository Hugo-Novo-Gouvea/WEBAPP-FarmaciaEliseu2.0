using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FuncionariosController : ControllerBase
{
    private readonly FarmaciaContext _context;

    public FuncionariosController(FarmaciaContext context)
    {
        _context = context;
    }

    private static FuncionarioDto ToDto(Funcionario f) => new(
        f.FuncionariosId, f.Nome, f.CodigoAntigo, f.DataCadastro, f.DataUltimoRegistro);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FuncionarioDto>>> GetAll()
    {
        var funcionarios = await _context.Funcionarios
            .AsNoTracking()
            .OrderBy(f => f.Nome)
            .ToListAsync();
        return Ok(funcionarios.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<FuncionarioDto>> GetById(int id)
    {
        var funcionario = await _context.Funcionarios.AsNoTracking().FirstOrDefaultAsync(f => f.FuncionariosId == id);
        if (funcionario is null) return NotFound();
        return Ok(ToDto(funcionario));
    }

    [HttpPost]
    public async Task<ActionResult<FuncionarioDto>> Create(FuncionarioCreateDto dto)
    {
        var now = DateTime.Now;
        var funcionario = new Funcionario
        {
            Nome = dto.Nome,
            CodigoAntigo = dto.CodigoAntigo,
            DataCadastro = now,
            DataUltimoRegistro = now,
            Deletado = false
        };

        _context.Funcionarios.Add(funcionario);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = funcionario.FuncionariosId }, ToDto(funcionario));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, FuncionarioUpdateDto dto)
    {
        var funcionario = await _context.Funcionarios.FirstOrDefaultAsync(f => f.FuncionariosId == id);
        if (funcionario is null) return NotFound();

        funcionario.Nome = dto.Nome;
        funcionario.CodigoAntigo = dto.CodigoAntigo;
        funcionario.DataUltimoRegistro = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(ToDto(funcionario));
    }

    // Soft delete: apenas marca "deletado = true". Nunca executa DELETE FROM.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var funcionario = await _context.Funcionarios.FirstOrDefaultAsync(f => f.FuncionariosId == id);
        if (funcionario is null) return NotFound();

        funcionario.Deletado = true;
        funcionario.DataUltimoRegistro = DateTime.Now;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
