# =====================================================================
#  FARMACIA DO ELISEU - DESINSTALAR
#  Remove os servicos do Windows, a tarefa de backup e a regra de
#  firewall criados pelo instalador. Rode COMO ADMINISTRADOR.
#
#  NAO mexe no banco de dados e NAO apaga a pasta C:\FarmaciaEliseu
#  (onde ficam os backups). Se quiser apagar tambem, use -ApagarPasta.
# =====================================================================
param(
    [string]$Destino = "C:\FarmaciaEliseu",
    [switch]$ApagarPasta
)

$ErrorActionPreference = "Stop"

$souAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
            ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $souAdmin) {
    Write-Host "PARE: precisa ser executado como ADMINISTRADOR." -ForegroundColor Red
    Read-Host "Pressione ENTER para fechar"
    exit 1
}

foreach ($nome in @("FarmaciaEliseuBackend", "FarmaciaEliseuPrintAgent")) {
    if (Get-Service -Name $nome -ErrorAction SilentlyContinue) {
        Write-Host "Removendo servico '$nome'..." -ForegroundColor Yellow
        Stop-Service -Name $nome -Force -ErrorAction SilentlyContinue
        sc.exe delete $nome | Out-Null
        Write-Host "  removido." -ForegroundColor Green
    } else {
        Write-Host "Servico '$nome' nao estava instalado." -ForegroundColor Gray
    }
}

if (Get-ScheduledTask -TaskName "FarmaciaEliseuBackupBanco" -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName "FarmaciaEliseuBackupBanco" -Confirm:$false
    Write-Host "Tarefa de backup removida." -ForegroundColor Green
}

$regra = Get-NetFirewallRule -DisplayName "Farmacia Eliseu (5080)" -ErrorAction SilentlyContinue
if ($regra) {
    Remove-NetFirewallRule -DisplayName "Farmacia Eliseu (5080)"
    Write-Host "Regra de firewall removida." -ForegroundColor Green
}

if ($ApagarPasta) {
    Write-Host ""
    Write-Host "ATENCAO: isso vai apagar $Destino, INCLUSIVE OS BACKUPS do banco." -ForegroundColor Red
    $c = Read-Host "Digite APAGAR para confirmar"
    if ($c -eq "APAGAR") {
        Remove-Item $Destino -Recurse -Force
        Write-Host "Pasta apagada." -ForegroundColor Green
    } else {
        Write-Host "Cancelado - a pasta foi mantida." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "A pasta $Destino foi mantida (os backups do banco estao la)." -ForegroundColor Gray
}

Write-Host ""
Write-Host "O banco de dados NAO foi alterado." -ForegroundColor Green
Read-Host "Pressione ENTER para fechar"
