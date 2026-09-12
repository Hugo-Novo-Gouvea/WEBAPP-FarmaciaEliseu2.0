using FarmaciaEliseu.PrintAgent;

// Agente local de impressão: roda em cada computador (Windows), escuta em
// localhost e recebe do navegador os bytes ESC/POS (Base64) para mandar
// direto para a impressora térmica instalada naquele PC. Sem isso, o
// navegador nao tem como enviar bytes crus para uma impressora.
var builder = WebApplication.CreateBuilder(args);

// Permite rodar como Serviço do Windows (sc.exe create ...) — assim o
// agente inicia sozinho com o computador e reinicia se travar, sem
// precisar de ninguém logado. Sem efeito quando rodado via "dotnet run".
builder.Host.UseWindowsService();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();
app.UseCors();

app.MapGet("/status", () =>
{
    var impressora = RawPrinterHelper.ObterImpressoraPadrao();
    return Results.Ok(new { ok = true, impressoraPadrao = impressora });
});

app.MapPost("/imprimir", (ImprimirRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Base64))
    {
        return Results.BadRequest(new { ok = false, erro = "Campo 'base64' é obrigatório." });
    }

    var impressora = string.IsNullOrWhiteSpace(req.Impressora)
        ? RawPrinterHelper.ObterImpressoraPadrao()
        : req.Impressora;

    if (string.IsNullOrWhiteSpace(impressora))
    {
        return Results.Problem("Nenhuma impressora padrão configurada neste computador.");
    }

    try
    {
        var bytes = Convert.FromBase64String(req.Base64);
        RawPrinterHelper.SendBytesToPrinter(impressora, bytes);
        return Results.Ok(new { ok = true, impressora });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.Run("http://localhost:9123");

record ImprimirRequest(string Base64, string? Impressora);
