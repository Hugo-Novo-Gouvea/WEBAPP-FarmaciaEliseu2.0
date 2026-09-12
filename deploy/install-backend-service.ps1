# Cria o Serviço do Windows do backend (API + tela). Rode como
# Administrador, só na máquina "servidor" (a que tem o PostgreSQL). Rode
# deploy\publish.ps1 antes disso, e confirme que existe
# C:\FarmaciaEliseu\backend\appsettings.Production.json com a senha do
# banco preenchida.
param(
    [string]$CaminhoExe = "C:\FarmaciaEliseu\backend\FarmaciaEliseu.Api.exe",
    [string]$NomeServico = "FarmaciaEliseuBackend"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $CaminhoExe)) {
    throw "Não encontrei $CaminhoExe. Rode deploy\publish.ps1 primeiro."
}

$configProducao = Join-Path (Split-Path $CaminhoExe) "appsettings.Production.json"
if (-not (Test-Path $configProducao)) {
    throw "Não encontrei $configProducao. Copie appsettings.Production.json.example para lá e preencha a senha do banco antes de criar o serviço."
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
    -DisplayName "Farmacia Eliseu - Backend" `
    -Description "API + tela da Farmacia Eliseu (porta 5080)." `
    -StartupType Automatic

# Reinicia sozinho se travar ou cair (até 3 tentativas, 5s entre elas).
sc.exe failure $NomeServico reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null

Start-Service -Name $NomeServico

Write-Host ""
Write-Host "Serviço '$NomeServico' criado e iniciado." -ForegroundColor Green
Write-Host "Acesse http://localhost:5080 (ou pelo IP da rede, ex.: http://192.168.x.x:5080) para testar." -ForegroundColor Green
Write-Host "Para ver o status: Get-Service $NomeServico" -ForegroundColor Gray
Write-Host "Para ver logs: Visualizador de Eventos do Windows > Log de Aplicativos." -ForegroundColor Gray
