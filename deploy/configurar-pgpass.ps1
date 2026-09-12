# Rode UMA VEZ SÓ, como Administrador, na máquina que tem o PostgreSQL —
# guarda a senha do banco localmente (nesta máquina, nunca no git) para o
# backup automático conseguir se conectar sem pedir senha toda vez.
# Grava tanto no seu perfil de usuário quanto no perfil da conta SYSTEM,
# porque a tarefa agendada de backup roda como SYSTEM.
param(
    [string]$Servidor = "localhost",
    [string]$Porta = "5432",
    [string]$Banco = "FarmaciaEliseu",
    [string]$Usuario = "postgres"
)

$ErrorActionPreference = "Stop"

$senhaSegura = Read-Host "Senha do PostgreSQL para o usuário '$Usuario'" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura)
$senha = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$linha = "${Servidor}:${Porta}:${Banco}:${Usuario}:${senha}"

function Gravar-Pgpass([string]$pastaBase) {
    $pastaPg = Join-Path $pastaBase "postgresql"
    if (-not (Test-Path $pastaPg)) {
        New-Item -ItemType Directory -Path $pastaPg -Force | Out-Null
    }
    $arquivo = Join-Path $pastaPg "pgpass.conf"
    $linha | Out-File -FilePath $arquivo -Encoding ascii -NoNewline
    return $arquivo
}

$arquivoUsuario = Gravar-Pgpass $env:APPDATA
Write-Host "Gravado em: $arquivoUsuario" -ForegroundColor Green

$perfilSystem = "C:\Windows\System32\config\systemprofile\AppData\Roaming"
try {
    $arquivoSystem = Gravar-Pgpass $perfilSystem
    Write-Host "Gravado em: $arquivoSystem (usado pela tarefa agendada, que roda como SYSTEM)" -ForegroundColor Green
} catch {
    Write-Host "Não consegui gravar no perfil do SYSTEM (rode como Administrador). $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pronto. Agora deploy\backup-database.ps1 e a tarefa agendada" -ForegroundColor Green
Write-Host "conseguem se conectar ao banco sem pedir senha." -ForegroundColor Green
