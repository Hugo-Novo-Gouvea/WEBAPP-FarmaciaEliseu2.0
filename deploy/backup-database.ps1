# Faz um backup do banco FarmaciaEliseu (pg_dump em formato "custom",
# fácil de restaurar com pg_restore) e apaga backups com mais de
# $DiasParaManter dias. Precisa que deploy\configurar-pgpass.ps1 já tenha
# sido rodado uma vez nesta máquina (senão pg_dump vai pedir senha e
# travar, já que ninguém estará digitando nada quando isso rodar sozinho
# de madrugada).
param(
    [string]$PgDumpExe = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
    [string]$PastaBackups = "C:\FarmaciaEliseu\backups",
    [string]$Banco = "FarmaciaEliseu",
    [string]$Usuario = "postgres",
    [int]$DiasParaManter = 30
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $PgDumpExe)) {
    throw "pg_dump não encontrado em $PgDumpExe. Ajuste o parâmetro -PgDumpExe (confira a versão instalada do PostgreSQL)."
}

if (-not (Test-Path $PastaBackups)) {
    New-Item -ItemType Directory -Path $PastaBackups -Force | Out-Null
}

$dataHora = Get-Date -Format "yyyy-MM-dd_HHmmss"
$arquivo = Join-Path $PastaBackups "farmaciaeliseu_$dataHora.backup"

Write-Host "Fazendo backup de '$Banco' para $arquivo ..."
& $PgDumpExe -U $Usuario -h localhost -F c -f $arquivo $Banco

if ($LASTEXITCODE -ne 0) {
    throw "pg_dump falhou (código $LASTEXITCODE). Confira se deploy\configurar-pgpass.ps1 já foi rodado."
}

$tamanhoMB = [math]::Round((Get-Item $arquivo).Length / 1MB, 2)
Write-Host "Backup concluído: $arquivo ($tamanhoMB MB)"

# Remove backups mais antigos que $DiasParaManter dias.
$limite = (Get-Date).AddDays(-$DiasParaManter)
Get-ChildItem -Path $PastaBackups -Filter "farmaciaeliseu_*.backup" |
    Where-Object { $_.LastWriteTime -lt $limite } |
    ForEach-Object {
        Write-Host "Removendo backup antigo: $($_.Name)"
        Remove-Item $_.FullName -Force
    }
