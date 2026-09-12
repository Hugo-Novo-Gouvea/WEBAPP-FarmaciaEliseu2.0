# Agente de impressão (print-agent)

Programa pequeno que precisa rodar em **cada computador** que tem uma impressora
térmica conectada. Ele escuta em `http://localhost:9123` e recebe do navegador
os bytes ESC/POS (em Base64) da venda, mandando direto para a impressora
instalada no Windows daquele PC.

Sem esse agente, o navegador não tem como enviar bytes crus para a impressora
(não existe API para isso em JavaScript).

## Por que existe

- Gratuito, sem serviço externo, sem dependência paga (ao contrário de soluções
  como QZ Tray, que cobram para impressão silenciosa).
- Cada PC só imprime na impressora que está configurada nele mesmo — o backend
  central nunca sabe nem precisa saber qual impressora existe em qual máquina.

## Como rodar (em cada estação) — em produção, como Serviço do Windows

1. Configure a impressora térmica como **impressora padrão** do Windows nessa
   máquina (Painel de Controle → Dispositivos e Impressoras).
2. Publique e instale como serviço (roda sozinho, inicia com o Windows,
   reinicia se travar) — veja **`deploy/README.md`** na raiz do repositório
   para o passo a passo completo. Resumo:
   ```
   deploy\publish.ps1
   deploy\install-print-agent-service.ps1   # como Administrador
   ```
3. Confirme que está funcionando abrindo `http://localhost:9123/status` no
   navegador daquele PC — deve responder com o nome da impressora padrão
   detectada.

Para desenvolvimento local (sem instalar serviço), `dotnet run` dentro de
`print-agent/FarmaciaEliseu.PrintAgent` continua funcionando normalmente.

## Endpoints

- `GET /status` — retorna `{ ok: true, impressoraPadrao: "..." }`.
- `POST /imprimir` — corpo `{ "base64": "..." }` (opcionalmente `"impressora": "Nome"`
  para usar uma impressora específica em vez da padrão). Envia os bytes via
  impressão RAW do Windows (`winspool.drv`).

## Limitações conhecidas

- Só funciona em Windows (usa a API de impressão nativa do Windows).
- Só imprime formato RAW/ESC/POS — não é para impressoras comuns (A4).
- Não testado ainda com uma impressora térmica física de verdade neste
  ambiente de desenvolvimento; validado com o simulador "Microsoft Print to
  PDF" (confirma que o fluxo todo — HTTP, CORS, chamada Win32 — funciona sem
  travar; falta confirmar a impressão em papel real numa estação com a
  impressora conectada).
