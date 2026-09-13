# =====================================================================
#  FARMACIA DO ELISEU - AGENTE DE IMPRESSAO
#  Rode este arquivo COMO ADMINISTRADOR em CADA computador que tem uma
#  impressora termica ligada nele (inclusive no proprio servidor, se ele
#  tambem vender).
#  ANTES DE RODAR: deixe a impressora termica como impressora PADRAO do
#  Windows nesta maquina.
# =====================================================================
param(
    [string]$Destino = "C:\FarmaciaEliseu"
)

$ErrorActionPreference = "Stop"
$origem = $PSScriptRoot

function Titulo($t) {
    Write-Host ""
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host " $t" -ForegroundColor Cyan
    Write-Host "=============================================================" -ForegroundColor Cyan
}
function Bom($t)   { Write-Host "  OK  $t" -ForegroundColor Green }
function Aviso($t) { Write-Host "  !!  $t" -ForegroundColor Yellow }

Titulo "AGENTE DE IMPRESSAO - INSTALACAO NESTE COMPUTADOR"

$souAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
            ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $souAdmin) {
    Write-Host ""
    Write-Host "  PARE: precisa ser executado como ADMINISTRADOR." -ForegroundColor Red
    Read-Host "Pressione ENTER para fechar"
    exit 1
}

# --- Impressora padrao ---------------------------------------------------
Titulo "1/3  Conferindo a impressora padrao"
$padrao = Get-CimInstance -ClassName Win32_Printer -ErrorAction SilentlyContinue |
          Where-Object { $_.Default -eq $true } | Select-Object -First 1
if ($padrao) {
    Bom "Impressora padrao: $($padrao.Name)"
    Aviso "Confirme que essa e mesmo a impressora TERMICA de cupom."
} else {
    Aviso "Nao ha impressora padrao definida no Windows desta maquina."
    Aviso "Abra 'Dispositivos e Impressoras', clique com o botao direito na"
    Aviso "impressora termica e escolha 'Definir como impressora padrao'."
    $continuar = Read-Host "  Continuar mesmo assim? (S/N)"
    if ($continuar -ne "S" -and $continuar -ne "s") { exit 1 }
}

# --- Copia -----------------------------------------------------------------
Titulo "2/3  Copiando o agente para $Destino"
$origemAgente = Join-Path $origem "print-agent"
if (-not (Test-Path (Join-Path $origemAgente "FarmaciaEliseu.PrintAgent.exe"))) {
    $aninhado = Join-Path $origem "FarmaciaEliseu-Instalacao\print-agent\FarmaciaEliseu.PrintAgent.exe"
    if (Test-Path $aninhado) {
        Write-Host ""
        Write-Host "  Achei os arquivos numa pasta DENTRO desta. Rode este aqui:" -ForegroundColor Yellow
        Write-Host "    $origem\FarmaciaEliseu-Instalacao\instalar-impressora.ps1" -ForegroundColor White
        Write-Host ""
        Read-Host "Pressione ENTER para fechar"
        exit 1
    }
    throw "Nao encontrei a pasta print-agent aqui. O instalar-impressora.ps1 precisa estar no MESMO lugar que a pasta 'print-agent'."
}
if (Get-Service -Name "FarmaciaEliseuPrintAgent" -ErrorAction SilentlyContinue) {
    Stop-Service -Name "FarmaciaEliseuPrintAgent" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
New-Item -ItemType Directory -Path $Destino -Force | Out-Null
Copy-Item $origemAgente -Destination $Destino -Recurse -Force
Bom "Agente copiado."

# --- Servico ---------------------------------------------------------------
Titulo "3/3  Criando o servico do Windows"
$nome = "FarmaciaEliseuPrintAgent"
$exe = Join-Path $Destino "print-agent\FarmaciaEliseu.PrintAgent.exe"

if (Get-Service -Name $nome -ErrorAction SilentlyContinue) {
    Stop-Service -Name $nome -Force -ErrorAction SilentlyContinue
    sc.exe delete $nome | Out-Null
    Start-Sleep -Seconds 3
}
New-Service -Name $nome -BinaryPathName "`"$exe`"" `
    -DisplayName "Farmacia Eliseu - Agente de Impressao" `
    -Description "Recebe o cupom do navegador e manda para a impressora deste computador (porta 9123)." `
    -StartupType Automatic | Out-Null
sc.exe failure $nome reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null
Start-Service -Name $nome
Bom "Servico criado e iniciado."

# --- Teste -----------------------------------------------------------------
Titulo "CONFERINDO SE FUNCIONOU"
$funcionou = $false
$resposta = ""
foreach ($tentativa in 1..8) {
    Start-Sleep -Seconds 3
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:9123/status" -UseBasicParsing -TimeoutSec 8
        if ($r.StatusCode -eq 200) { $funcionou = $true; $resposta = $r.Content; break }
    } catch { }
}

Write-Host ""
if ($funcionou) {
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host " DEU CERTO! O agente de impressao esta no ar." -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host "  Resposta do agente: $resposta" -ForegroundColor White
    Write-Host ""
    Write-Host "  Confira acima se a impressora que aparece e a termica." -ForegroundColor Gray
    Write-Host "  Se nao for, troque a impressora padrao do Windows e rode:" -ForegroundColor Gray
    Write-Host "    Restart-Service FarmaciaEliseuPrintAgent" -ForegroundColor White
} else {
    Write-Host "  O agente nao respondeu em http://localhost:9123/status" -ForegroundColor Red
    Write-Host "  Verifique com: Get-Service FarmaciaEliseuPrintAgent" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Pressione ENTER para fechar"
