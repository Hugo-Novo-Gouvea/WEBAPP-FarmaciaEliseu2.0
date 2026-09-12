# Cria o Serviço do Windows do agente de impressão. Rode como
# Administrador, em CADA computador que tem uma impressora térmica
# conectada. Antes disso: rode deploy\publish.ps1 (ou copie a pasta
# print-agent publicada de outra máquina pra cá) e configure a impressora
# térmica como impressora PADRÃO do Windows nesta máquina.
param(
    [string]$CaminhoExe = "C:\FarmaciaEliseu\print-agent\FarmaciaEliseu.PrintAgent.exe",
    [string]$NomeServico = "FarmaciaEliseuPrintAgent"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $CaminhoExe)) {
    throw "Não encontrei $CaminhoExe. Rode deploy\publish.ps1 (ou copie a pasta print-agent publicada pra esta máquina)."
}

$existente = Get-Service -Name $NomeServico -ErrorAction SilentlyContinue
if ($existente) {
    Write-Host "Serviço '$NomeServico' já existe, removendo para recriar..." -ForegroundColor Yellow
    Stop-Service -Name $NomeServico -Force -ErrorAction SilentlyContinue
    sc.exe delete $NomeServico | Out-Null
    Start-Sleep -Seconds 2
}

New-Service -Name $NomeServico `
    -BinaryPathName "`"$CaminhoExe`"" `
    -DisplayName "Farmacia Eliseu - Agente de Impressao" `
    -Description "Recebe o cupom do navegador e manda pra impressora deste computador (porta 9123)." `
    -StartupType Automatic

sc.exe failure $NomeServico reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null

Start-Service -Name $NomeServico

Write-Host ""
Write-Host "Serviço '$NomeServico' criado e iniciado." -ForegroundColor Green
Write-Host "IMPORTANTE: confirme que a impressora térmica está configurada como" -ForegroundColor Yellow
Write-Host "impressora PADRÃO do Windows nesta máquina (Painel de Controle > Dispositivos e Impressoras)." -ForegroundColor Yellow
Write-Host "Teste abrindo http://localhost:9123/status neste computador." -ForegroundColor Green
