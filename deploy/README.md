# Implantação em produção (Serviços do Windows)

Este guia deixa o sistema rodando sozinho todo dia — sem precisar abrir
terminal nenhum, reiniciando automaticamente se travar ou se o computador
reiniciar. Todos os scripts abaixo são PowerShell (`.ps1`).

Existem **duas máquinas diferentes** envolvidas:

- **O "servidor"**: o único computador que roda o banco PostgreSQL + o
  backend (API e a tela). Só precisa ser feito nessa máquina.
- **Cada estação de venda**: todo computador que tem uma impressora térmica
  conectada precisa do agente de impressão. Inclui o próprio servidor, se
  ele também vender.

## 1. No servidor (banco + backend)

### 1.1. Publicar

Da raiz do repositório:

```powershell
deploy\publish.ps1
```

Isso builda o backend (.NET) **e** o front-end (React) juntos — o backend
publicado já serve a tela sozinho, num único processo/porta (5080). Também
publica o print-agent (útil se este servidor também for vender). Tudo vai
para `C:\FarmaciaEliseu\`.

### 1.2. Configurar a senha do banco (uma vez só)

```powershell
copy backend\FarmaciaEliseu.Api\appsettings.Production.json.example C:\FarmaciaEliseu\backend\appsettings.Production.json
notepad C:\FarmaciaEliseu\backend\appsettings.Production.json
```

Troque `COLOQUE_A_SENHA_AQUI` pela senha real do PostgreSQL. Esse arquivo
fica só nesta máquina — nunca é enviado pro git (já está no `.gitignore`).

### 1.3. Criar o Serviço do Windows do backend

Como **Administrador**:

```powershell
deploy\install-backend-service.ps1
```

Confirma que funcionou abrindo `http://localhost:5080` (ou pelo IP da rede,
tipo `http://192.168.x.x:5080`, de outro computador).

### 1.4. Backup automático do banco (uma vez só a configuração)

```powershell
deploy\configurar-pgpass.ps1     # pede a senha do banco uma vez, guarda localmente
deploy\install-backup-task.ps1   # agenda o backup diário (23:30 por padrão)
```

Os backups ficam em `C:\FarmaciaEliseu\backups\` (mantém os últimos 30 dias
por padrão). Pra testar na hora: `Start-ScheduledTask -TaskName FarmaciaEliseuBackupBanco`.

## 2. Em cada estação com impressora térmica

1. Configure a impressora térmica como **impressora padrão** do Windows
   nessa máquina.
2. Se for uma máquina diferente do servidor: copie a pasta
   `C:\FarmaciaEliseu\print-agent` (gerada no passo 1.1) pra essa máquina, no
   mesmo caminho. Ou rode `deploy\publish.ps1` direto nela, se tiver o
   repositório clonado lá também.
3. Como **Administrador**:
   ```powershell
   deploy\install-print-agent-service.ps1
   ```
4. Confirme abrindo `http://localhost:9123/status` **nessa mesma máquina** —
   deve responder com o nome da impressora padrão detectada.

## 3. Acessando o sistema no dia a dia

Depois de tudo isso, qualquer computador da rede acessa o sistema pelo
navegador em `http://<IP-do-servidor>:5080` — não precisa mais rodar
`npm run dev` nem `dotnet run` em lugar nenhum.

## Atualizando o sistema depois (nova versão do código)

```powershell
deploy\publish.ps1
Restart-Service FarmaciaEliseuBackend
```

Se o print-agent também mudou, publique e reinicie o serviço dele também em
cada estação (`Restart-Service FarmaciaEliseuPrintAgent`).

## Scripts desta pasta

| Script | Onde rodar | Precisa Administrador? |
|---|---|---|
| `publish.ps1` | Servidor (e cada estação, se publicar localmente) | Não |
| `install-backend-service.ps1` | Só no servidor | Sim |
| `install-print-agent-service.ps1` | Cada estação com impressora | Sim |
| `configurar-pgpass.ps1` | Só no servidor, uma vez | Sim |
| `install-backup-task.ps1` | Só no servidor, uma vez | Sim |
| `backup-database.ps1` | Chamado automaticamente pela tarefa agendada | Não |
| `uninstall-services.ps1` | Onde precisar desinstalar/reinstalar | Sim |

## Verificando se está tudo rodando

```powershell
Get-Service FarmaciaEliseuBackend       # no servidor
Get-Service FarmaciaEliseuPrintAgent    # em cada estação com impressora
Get-ScheduledTask FarmaciaEliseuBackupBanco   # no servidor
```

Logs de erro dos serviços aparecem no **Visualizador de Eventos do Windows**
(Log de Aplicativos).
