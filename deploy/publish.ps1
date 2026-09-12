# Publica o backend (API + tela) e o agente de impressão para
# C:\FarmaciaEliseu\. Rode isso sempre que atualizar o código, antes de
# (re)iniciar os serviços. Não precisa ser Administrador para publicar.
param(
    [string]$DestinoBase = "C:\FarmaciaEliseu"
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot

Write-Host "Publicando backend (API + tela) ..." -ForegroundColor Cyan
dotnet publish "$raiz\backend\FarmaciaEliseu.Api\FarmaciaEliseu.Api.csproj" -c Release -o "$DestinoBase\backend"
if ($LASTEXITCODE -ne 0) { throw "Falha ao publicar o backend." }

Write-Host "Publicando o agente de impressão ..." -ForegroundColor Cyan
dotnet publish "$raiz\print-agent\FarmaciaEliseu.PrintAgent\FarmaciaEliseu.PrintAgent.csproj" -c Release -o "$DestinoBase\print-agent"
if ($LASTEXITCODE -ne 0) { throw "Falha ao publicar o agente de impressão." }

Write-Host ""
Write-Host "Publicado em:" -ForegroundColor Green
Write-Host "  Backend:      $DestinoBase\backend"
Write-Host "  Print-agent:  $DestinoBase\print-agent"
Write-Host ""

$producaoConfig = Join-Path "$DestinoBase\backend" "appsettings.Production.json"
if (-not (Test-Path $producaoConfig)) {
    Write-Host "ATENÇÃO: $producaoConfig não existe ainda." -ForegroundColor Yellow
    Write-Host "Copie backend\FarmaciaEliseu.Api\appsettings.Production.json.example para lá" -ForegroundColor Yellow
    Write-Host "e preencha a senha real do banco (só precisa fazer isso uma vez)." -ForegroundColor Yellow
}
