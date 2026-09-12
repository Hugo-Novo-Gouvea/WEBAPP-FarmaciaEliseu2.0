# Agenda o backup diário do banco no Agendador de Tarefas do Windows. Rode
# como Administrador, na máquina que tem o PostgreSQL. Rode
# deploy\configurar-pgpass.ps1 antes (uma vez só).
param(
    [string]$Hora = "23:30",
    [string]$NomeTarefa = "FarmaciaEliseuBackupBanco"
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$scriptBackup = Join-Path $raiz "deploy\backup-database.ps1"

if (-not (Test-Path $scriptBackup)) {
    throw "Não encontrei $scriptBackup."
}

$acao = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptBackup`""
$gatilho = New-ScheduledTaskTrigger -Daily -At $Hora
$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask -TaskName $NomeTarefa -Action $acao -Trigger $gatilho -Settings $config `
    -Description "Backup diário do banco FarmaciaEliseu" -User "SYSTEM" -RunLevel Highest -Force | Out-Null

Write-Host "Tarefa '$NomeTarefa' agendada para rodar todo dia às $Hora (mesmo sem ninguém logado)." -ForegroundColor Green
Write-Host "Pra testar agora: Start-ScheduledTask -TaskName '$NomeTarefa'" -ForegroundColor Gray
Write-Host "Pra ver o histórico: abra o Agendador de Tarefas do Windows e procure '$NomeTarefa'." -ForegroundColor Gray
