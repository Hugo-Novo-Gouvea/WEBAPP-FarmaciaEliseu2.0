# Remove os serviços do Windows criados por install-backend-service.ps1 e
# install-print-agent-service.ps1 (útil antes de reinstalar/atualizar, ou
# para desfazer). Rode como Administrador.
param(
    [string[]]$Servicos = @("FarmaciaEliseuBackend", "FarmaciaEliseuPrintAgent")
)

$ErrorActionPreference = "Stop"

foreach ($nome in $Servicos) {
    $servico = Get-Service -Name $nome -ErrorAction SilentlyContinue
    if ($servico) {
        Write-Host "Parando e removendo '$nome'..." -ForegroundColor Yellow
        Stop-Service -Name $nome -Force -ErrorAction SilentlyContinue
        sc.exe delete $nome | Out-Null
        Write-Host "Removido." -ForegroundColor Green
    } else {
        Write-Host "'$nome' não estava instalado." -ForegroundColor Gray
    }
}
