// Agente local de impressão: um programinha (print-agent/) que roda em cada
// computador, escuta em localhost e manda os bytes ESC/POS para a impressora
// térmica instalada naquele PC. O navegador não tem como enviar bytes crus
// para uma impressora sozinho, por isso esse intermediário é necessário.
const AGENTE_URL = 'http://localhost:9123'

export async function imprimirViaAgente(base64: string): Promise<void> {
  let resposta: Response
  try {
    resposta = await fetch(`${AGENTE_URL}/imprimir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64 }),
    })
  } catch {
    throw new Error(
      'Não foi possível conectar ao agente de impressão. Verifique se ele está rodando neste computador (print-agent).',
    )
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const mensagem = corpo?.erro || corpo?.detail || corpo?.title
    throw new Error(mensagem || 'Falha ao imprimir.')
  }
}
