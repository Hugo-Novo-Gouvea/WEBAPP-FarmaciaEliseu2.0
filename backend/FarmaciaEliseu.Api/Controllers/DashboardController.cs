using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.DTOs;
using FarmaciaEliseu.Api.Mapping;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Controllers;

// Resumo para a tela inicial: numeros de hoje e as vendas mais recentes.
// Somente leitura.
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly FarmaciaContext _context;

    public DashboardController(FarmaciaContext context)
    {
        _context = context;
    }

    [HttpGet("resumo")]
    public async Task<ActionResult<DashboardResumoDto>> GetResumo()
    {
        var hoje = DateTime.Today;
        var amanha = hoje.AddDays(1);

        var vendasHoje = _context.Movimentos.Where(m => m.DataVenda >= hoje && m.DataVenda < amanha);
        var vendasHojeCount = await vendasHoje.CountAsync();
        var vendasHojeTotal = await vendasHoje.SumAsync(m => (decimal?)m.ValorTotal) ?? 0;

        var fiadoAberto = _context.Movimentos.Where(m => m.DataPagamento == null);
        var fiadoAbertoCount = await fiadoAberto.CountAsync();
        var fiadoAbertoTotal = await fiadoAberto.SumAsync(m => (decimal?)m.ValorTotal) ?? 0;

        var ultimasVendas = await _context.Movimentos
            .AsNoTracking()
            .OrderByDescending(m => m.DataVenda)
            .Take(5)
            .ToListAsync();

        var dto = new DashboardResumoDto(
            vendasHojeCount,
            vendasHojeTotal,
            fiadoAbertoCount,
            fiadoAbertoTotal,
            ultimasVendas.Select(MovimentoMapper.ToDto));

        return Ok(dto);
    }

    // Fechamento de caixa de um dia: total vendido, quanto entrou em dinheiro
    // na hora, quanto ficou pendente (fiado) das vendas do dia, quanto foi
    // recebido no dia de dívidas de dias anteriores, e um resumo por
    // funcionário. Somente leitura — não altera nada.
    [HttpGet("fechamento")]
    public async Task<ActionResult<FechamentoCaixaDto>> GetFechamento([FromQuery] DateTime? data = null)
    {
        var dia = (data ?? DateTime.Today).Date;
        var proximoDia = dia.AddDays(1);

        var vendasNoDia = _context.Movimentos.Where(m => m.DataVenda >= dia && m.DataVenda < proximoDia);
        var vendasNoDiaCount = await vendasNoDia.CountAsync();
        var vendasNoDiaTotal = await vendasNoDia.SumAsync(m => (decimal?)m.ValorTotal) ?? 0;

        // "Dinheiro" grava data_pagamento no mesmo instante de data_venda; como
        // já está restrito às vendas do dia, basta checar que foi pago.
        var recebidoDinheiro = vendasNoDia.Where(m => m.DataPagamento != null);
        var recebidoDinheiroCount = await recebidoDinheiro.CountAsync();
        var recebidoDinheiroTotal = await recebidoDinheiro.SumAsync(m => (decimal?)m.ValorTotal) ?? 0;

        var pendenteDoDia = vendasNoDia.Where(m => m.DataPagamento == null);
        var pendenteCount = await pendenteDoDia.CountAsync();
        var pendenteTotal = await pendenteDoDia.SumAsync(m => (decimal?)m.ValorTotal) ?? 0;

        var recebidoDividasAntigas = _context.Movimentos
            .Where(m => m.DataPagamento >= dia && m.DataPagamento < proximoDia && m.DataVenda < dia);
        var recebidoAntigasCount = await recebidoDividasAntigas.CountAsync();
        var recebidoAntigasTotal = await recebidoDividasAntigas.SumAsync(m => (decimal?)m.ValorTotal) ?? 0;

        var agrupadoPorFuncionario = await vendasNoDia
            .GroupBy(m => m.FuncionariosNome)
            .Select(g => new { FuncionariosNome = g.Key, Quantidade = g.Count(), Total = g.Sum(m => m.ValorTotal ?? 0) })
            .ToListAsync();

        var porFuncionario = agrupadoPorFuncionario
            .Select(g => new FechamentoPorFuncionarioDto(g.FuncionariosNome, g.Quantidade, g.Total))
            .OrderByDescending(x => x.Total)
            .ToList();

        var dto = new FechamentoCaixaDto(
            dia,
            new ResumoValorDto(vendasNoDiaCount, vendasNoDiaTotal),
            new ResumoValorDto(recebidoDinheiroCount, recebidoDinheiroTotal),
            new ResumoValorDto(pendenteCount, pendenteTotal),
            new ResumoValorDto(recebidoAntigasCount, recebidoAntigasTotal),
            porFuncionario);

        return Ok(dto);
    }
}
