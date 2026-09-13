using System.IO.Compression;
using FarmaciaEliseu.Api.Data;
using FarmaciaEliseu.Api.Services;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Permite rodar como Serviço do Windows (sc.exe create ...). Quando não está
// rodando como serviço (ex.: "dotnet run" em desenvolvimento), isso não tem
// nenhum efeito.
builder.Host.UseWindowsService();

const string FrontendCorsPolicy = "FrontendCorsPolicy";

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<FarmaciaContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("FarmaciaEliseu")));

builder.Services.AddSingleton<CupomService>();

// Comprime as respostas (JSON da API e os arquivos do front). Nivel "Fastest"
// de proposito: o servidor da farmacia nao e potente, e o ganho de tamanho do
// nivel maximo nao compensa o gasto de CPU.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    // Gzip primeiro de propósito: medido neste banco, no nível "Fastest" o gzip
    // comprime melhor que o brotli (2,6 MB contra 3,7 MB na lista de produtos).
    options.Providers.Add<GzipCompressionProvider>();
    options.Providers.Add<BrotliCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        // App de uso interno na rede local da farmácia (não exposto à internet).
        // Libera qualquer origem porque cada PC acessa o front pelo IP do
        // servidor na rede (ex.: http://192.168.x.x:5080), não só localhost.
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Antes de tudo que gera resposta (controllers e arquivos estaticos).
app.UseResponseCompression();

app.UseCors(FrontendCorsPolicy);

app.UseAuthorization();

app.MapControllers();

// Serve o front-end (React) já buildado, direto da pasta wwwroot — assim o
// mesmo serviço/processo atende a API e a tela, num único endereço/porta.
// wwwroot é gerado a partir de frontend/dist automaticamente no "dotnet
// publish" (ver target BuildFrontend no .csproj). Em desenvolvimento local
// continua-se usando "npm run dev" (Vite) normalmente, isso aqui só entra
// em uso quando o backend publicado roda sozinho como serviço.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();
