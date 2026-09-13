# Backup diario do banco FarmaciaEliseu. Chamado sozinho pela tarefa
# agendada criada pelo instalar-servidor.ps1 - voce nao precisa rodar isso
# na mao (mas pode, para testar).
# Gera um arquivo .backup (formato "custom" do pg_dump, restauravel com
# pg_restore) e apaga os que tiverem mais de $DiasParaManter dias.
param(
    [string]$PastaBackups = "C:\FarmaciaEliseu\backups",
    [string]$Banco = "FarmaciaEliseu",
    [string]$Usuario = "postgres",
    [int]$DiasParaManter = 30,
    [string]$PgDumpExe = ""
)

$ErrorActionPreference = "Stop"

# Acha o pg_dump sozinho, qualquer que seja a versao instalada do PostgreSQL.
if ([string]::IsNullOrWhiteSpace($PgDumpExe)) {
    $candidatos = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Filter "pg_dump.exe" -Recurse -ErrorAction SilentlyContinue |
                  Sort-Object FullName -Descending
    if ($candidatos) {
        $PgDumpExe = $candidatos[0].FullName
    } else {
        throw "Nao encontrei o pg_dump.exe. Passe o caminho com -PgDumpExe."
    }
}

if (-not (Test-Path $PastaBackups)) {
    New-Item -ItemType Directory -Path $PastaBackups -Force | Out-Null
}

$dataHora = Get-Date -Format "yyyy-MM-dd_HHmmss"
$arquivo = Join-Path $PastaBackups "farmaciaeliseu_$dataHora.backup"

Write-Host "Usando: $PgDumpExe"
Write-Host "Fazendo backup de '$Banco' para $arquivo ..."
& $PgDumpExe -U $Usuario -h localhost -F c -f $arquivo $Banco

if ($LASTEXITCODE -ne 0) {
    throw "pg_dump falhou (codigo $LASTEXITCODE). A senha guardada (pgpass.conf) pode estar errada."
}

$tamanhoMB = [math]::Round((Get-Item $arquivo).Length / 1MB, 2)
Write-Host "Backup concluido: $arquivo ($tamanhoMB MB)"

$limite = (Get-Date).AddDays(-$DiasParaManter)
Get-ChildItem -Path $PastaBackups -Filter "farmaciaeliseu_*.backup" |
    Where-Object { $_.LastWriteTime -lt $limite } |
    ForEach-Object {
        Write-Host "Removendo backup antigo: $($_.Name)"
        Remove-Item $_.FullName -Force
    }
