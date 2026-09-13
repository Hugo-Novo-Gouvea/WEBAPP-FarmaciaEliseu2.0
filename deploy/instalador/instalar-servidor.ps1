# =====================================================================
#  FARMACIA DO ELISEU - INSTALACAO NO SERVIDOR
#  Rode este arquivo com o botao direito > "Executar com o PowerShell"
#  OU num PowerShell aberto COMO ADMINISTRADOR.
#  Faz tudo: copia o programa, pede a senha do banco, cria o servico do
#  Windows, libera a porta no firewall e agenda o backup diario.
# =====================================================================
param(
    [string]$Destino = "C:\FarmaciaEliseu",
    [string]$HoraDoBackup = "23:30",
    [switch]$PularBackup
)

$ErrorActionPreference = "Stop"
$origem = $PSScriptRoot

function Titulo($texto) {
    Write-Host ""
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host " $texto" -ForegroundColor Cyan
    Write-Host "=============================================================" -ForegroundColor Cyan
}
function Passo($texto) { Write-Host "  -> $texto" -ForegroundColor Gray }
function Bom($texto)   { Write-Host "  OK  $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "  !!  $texto" -ForegroundColor Yellow }

Titulo "FARMACIA DO ELISEU - INSTALACAO NO SERVIDOR"

# --- 0. Precisa ser Administrador ---------------------------------------
$souAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
            ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $souAdmin) {
    Write-Host ""
    Write-Host "  PARE: este script precisa ser executado como ADMINISTRADOR." -ForegroundColor Red
    Write-Host "  Feche esta janela, clique com o botao DIREITO no PowerShell," -ForegroundColor Red
    Write-Host "  escolha 'Executar como administrador', e rode de novo." -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para fechar"
    exit 1
}
Bom "Rodando como Administrador."

# --- 1. Confere se os arquivos do programa estao aqui --------------------
Titulo "1/7  Conferindo os arquivos do pendrive"
$exeBackend = Join-Path $origem "backend\FarmaciaEliseu.Api.exe"
if (-not (Test-Path $exeBackend)) {
    # Caso classico: o "Extrair tudo" do Windows criou uma pasta dentro da outra.
    $aninhado = Join-Path $origem "FarmaciaEliseu-Instalacao\backend\FarmaciaEliseu.Api.exe"
    if (Test-Path $aninhado) {
        Write-Host ""
        Write-Host "  Achei os arquivos numa pasta DENTRO desta." -ForegroundColor Yellow
        Write-Host "  Rode o instalador que esta aqui:" -ForegroundColor Yellow
        Write-Host "    $origem\FarmaciaEliseu-Instalacao\instalar-servidor.ps1" -ForegroundColor White
        Write-Host ""
        Read-Host "Pressione ENTER para fechar"
        exit 1
    }
    throw "Nao encontrei $exeBackend. Confirme que descompactou a pasta INTEIRA e que o instalar-servidor.ps1 esta no MESMO lugar que as pastas 'backend' e 'print-agent'."
}
Bom "Programa encontrado."

# --- 2. Confere o PostgreSQL ---------------------------------------------
Titulo "2/7  Conferindo o PostgreSQL"
$servicoPg = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($servicoPg) {
    Bom "Servico do PostgreSQL encontrado: $($servicoPg.Name) (status: $($servicoPg.Status))"
    if ($servicoPg.Status -ne "Running") {
        Aviso "O PostgreSQL nao esta rodando. Tentando iniciar..."
        Start-Service -Name $servicoPg.Name
        Start-Sleep -Seconds 5
    }
} else {
    Aviso "Nao achei um servico chamado 'postgresql*' nesta maquina."
    Aviso "Se o banco estiver em OUTRO computador, tudo bem - voce vai informar o"
    Aviso "endereco dele daqui a pouco. Se deveria estar aqui, pare e verifique."
    $continuar = Read-Host "  Continuar mesmo assim? (S/N)"
    if ($continuar -ne "S" -and $continuar -ne "s") { exit 1 }
}

# --- 3. Copia o programa --------------------------------------------------
Titulo "3/7  Copiando o programa para $Destino"
$servicoAntigo = Get-Service -Name "FarmaciaEliseuBackend" -ErrorAction SilentlyContinue
if ($servicoAntigo -and $servicoAntigo.Status -eq "Running") {
    Passo "Ja existe uma instalacao rodando. Parando para poder substituir..."
    Stop-Service -Name "FarmaciaEliseuBackend" -Force
    Start-Sleep -Seconds 3
}

# Guarda a configuracao existente (senha do banco) para nao perder numa atualizacao
$configExistente = Join-Path $Destino "backend\appsettings.Production.json"
$configSalva = $null
if (Test-Path $configExistente) {
    $configSalva = Get-Content $configExistente -Raw
    Passo "Configuracao do banco ja existe aqui - vou reaproveitar."
}

New-Item -ItemType Directory -Path $Destino -Force | Out-Null
Passo "Copiando o sistema (pode demorar 1-2 minutos)..."
Copy-Item (Join-Path $origem "backend")     -Destination $Destino -Recurse -Force
Copy-Item (Join-Path $origem "print-agent") -Destination $Destino -Recurse -Force
Copy-Item (Join-Path $origem "backup-database.ps1") -Destination $Destino -Force
Bom "Programa copiado."

# --- 4. Senha do banco ----------------------------------------------------
Titulo "4/7  Configurando o acesso ao banco de dados"
$arquivoConfig = Join-Path $Destino "backend\appsettings.Production.json"

if ($configSalva) {
    $configSalva | Set-Content -Path $arquivoConfig -Encoding utf8
    Bom "Reaproveitada a configuracao que ja existia."
    $usuarioPg = "postgres"
    $senhaPg = $null
} else {
    Write-Host ""
    Write-Host "  Informe os dados de acesso ao PostgreSQL." -ForegroundColor White
    Write-Host "  (Se o banco esta nesta mesma maquina, aceite os padroes com ENTER.)" -ForegroundColor Gray
    Write-Host ""
    $hostPg = Read-Host "  Endereco do banco [localhost]"
    if ([string]::IsNullOrWhiteSpace($hostPg)) { $hostPg = "localhost" }
    $portaPg = Read-Host "  Porta [5432]"
    if ([string]::IsNullOrWhiteSpace($portaPg)) { $portaPg = "5432" }
    $usuarioPg = Read-Host "  Usuario [postgres]"
    if ([string]::IsNullOrWhiteSpace($usuarioPg)) { $usuarioPg = "postgres" }

    $senhaSegura = Read-Host "  Senha do usuario '$usuarioPg'" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura)
    $senhaPg = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

    $conexao = "Host=$hostPg;Port=$portaPg;Database=FarmaciaEliseu;Username=$usuarioPg;Password=$senhaPg"
    $json = [ordered]@{ ConnectionStrings = [ordered]@{ FarmaciaEliseu = $conexao } } | ConvertTo-Json -Depth 3
    $json | Set-Content -Path $arquivoConfig -Encoding utf8
    Bom "Configuracao gravada em $arquivoConfig"
    Passo "Esse arquivo fica SO nesta maquina. A senha nunca sai daqui."
}

# --- 5. Cria o servico do Windows ----------------------------------------
Titulo "5/7  Criando o servico do Windows"
$nomeServico = "FarmaciaEliseuBackend"
$exeInstalado = Join-Path $Destino "backend\FarmaciaEliseu.Api.exe"

if (Get-Service -Name $nomeServico -ErrorAction SilentlyContinue) {
    Passo "Removendo o servico antigo para recriar..."
    Stop-Service -Name $nomeServico -Force -ErrorAction SilentlyContinue
    sc.exe delete $nomeServico | Out-Null
    Start-Sleep -Seconds 3
}

New-Service -Name $nomeServico `
    -BinaryPathName "`"$exeInstalado`"" `
    -DisplayName "Farmacia Eliseu - Sistema" `
    -Description "Sistema da Farmacia do Eliseu (tela + API), porta 5080." `
    -StartupType Automatic | Out-Null

# Reinicia sozinho se travar ou cair
sc.exe failure $nomeServico reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null
Start-Service -Name $nomeServico
Bom "Servico criado e iniciado (inicia sozinho com o Windows)."

# --- 6. Firewall ----------------------------------------------------------
Titulo "6/7  Liberando a porta 5080 no Firewall do Windows"
$regra = Get-NetFirewallRule -DisplayName "Farmacia Eliseu (5080)" -ErrorAction SilentlyContinue
if ($regra) {
    Bom "Regra de firewall ja existia."
} else {
    New-NetFirewallRule -DisplayName "Farmacia Eliseu (5080)" -Direction Inbound `
        -Protocol TCP -LocalPort 5080 -Action Allow -Profile Any | Out-Null
    Bom "Porta 5080 liberada (os outros computadores da rede ja conseguem acessar)."
}

# --- 7. Backup automatico -------------------------------------------------
Titulo "7/7  Backup automatico do banco"
if ($PularBackup) {
    Aviso "Pulado (voce usou -PularBackup)."
} elseif ($null -eq $senhaPg) {
    Aviso "Reaproveitei a senha que ja estava configurada, entao nao pedi de novo."
    if (Get-ScheduledTask -TaskName "FarmaciaEliseuBackupBanco" -ErrorAction SilentlyContinue) {
        Bom "A tarefa de backup ja existe e continua agendada."
    } else {
        Aviso "A tarefa de backup ainda NAO existe nesta maquina."
        Aviso "Para criar, apague o arquivo abaixo e rode este instalador de novo"
        Aviso "(ele vai pedir a senha do banco outra vez):"
        Aviso "  $arquivoConfig"
    }
} else {
    # Guarda a senha localmente para o pg_dump rodar sozinho de madrugada
    $linhaPgpass = "localhost:5432:FarmaciaEliseu:${usuarioPg}:${senhaPg}"
    foreach ($base in @($env:APPDATA, "C:\Windows\System32\config\systemprofile\AppData\Roaming")) {
        try {
            $pasta = Join-Path $base "postgresql"
            if (-not (Test-Path $pasta)) { New-Item -ItemType Directory -Path $pasta -Force | Out-Null }
            $linhaPgpass | Out-File -FilePath (Join-Path $pasta "pgpass.conf") -Encoding ascii -NoNewline
        } catch {
            Aviso "Nao consegui gravar a credencial em $base ($_)"
        }
    }

    $tarefa = "FarmaciaEliseuBackupBanco"
    $scriptBackup = Join-Path $Destino "backup-database.ps1"
    $acao = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptBackup`""
    $gatilho = New-ScheduledTaskTrigger -Daily -At $HoraDoBackup
    $config = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)
    Register-ScheduledTask -TaskName $tarefa -Action $acao -Trigger $gatilho -Settings $config `
        -Description "Backup diario do banco FarmaciaEliseu" -User "SYSTEM" -RunLevel Highest -Force | Out-Null
    Bom "Backup agendado todo dia as $HoraDoBackup, em $Destino\backups."
}

# --- Teste final ----------------------------------------------------------
Titulo "CONFERINDO SE FUNCIONOU"
Passo "Esperando o sistema subir..."
$funcionou = $false
foreach ($tentativa in 1..12) {
    Start-Sleep -Seconds 5
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5080/api/funcionarios" -UseBasicParsing -TimeoutSec 10
        if ($r.StatusCode -eq 200) { $funcionou = $true; break }
    } catch {
        Passo "ainda subindo... (tentativa $tentativa de 12)"
    }
}

Write-Host ""
if ($funcionou) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
           Select-Object -First 1).IPAddress

    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host " DEU CERTO! O sistema esta no ar e conversando com o banco." -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Neste servidor:            http://localhost:5080" -ForegroundColor White
    Write-Host "  Nos outros computadores:   http://${ip}:5080" -ForegroundColor White
    Write-Host ""
    Write-Host "  Anote esse segundo endereco - e o que os vendedores usam." -ForegroundColor Gray
    Write-Host "  Vale a pena salvar como favorito no navegador de cada PC." -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Se algum computador tiver impressora termica, rode NELE o" -ForegroundColor Gray
    Write-Host "  instalar-impressora.ps1 (esta no pendrive)." -ForegroundColor Gray
} else {
    Write-Host "=============================================================" -ForegroundColor Red
    Write-Host " O servico subiu, mas nao respondeu." -ForegroundColor Red
    Write-Host "=============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Quase sempre e a SENHA DO BANCO errada." -ForegroundColor Yellow
    Write-Host "  Para corrigir, edite este arquivo e ajuste a senha:" -ForegroundColor Yellow
    Write-Host "    $arquivoConfig" -ForegroundColor White
    Write-Host "  Depois rode:  Restart-Service FarmaciaEliseuBackend" -ForegroundColor White
    Write-Host ""
    Write-Host "  Para ver o erro exato: abra o 'Visualizador de Eventos' do" -ForegroundColor Gray
    Write-Host "  Windows > Logs do Windows > Aplicativo." -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione ENTER para fechar"
