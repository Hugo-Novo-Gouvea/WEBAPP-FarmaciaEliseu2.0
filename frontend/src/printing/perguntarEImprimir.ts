import { movimentosApi } from '../api/movimentos'
import { imprimirViaAgente } from './agente'
import { getErrorMessage } from '../utils/errors'

// Pergunta (confirm nativo do navegador) se quer imprimir o cupom deste
// movimento; se a pessoa confirmar, imprime e pergunta de novo, repetindo até
// ela cancelar. Usado nos 3 pontos de impressão: Movimentação, Vender e
// Contas a Receber.
export async function perguntarEImprimir(movimentosId: number, informarValor = true): Promise<void> {
  let querImprimir = window.confirm('Deseja imprimir o cupom?')

  while (querImprimir) {
    let base64: string
    try {
      base64 = await movimentosApi.getCupom(movimentosId, informarValor)
    } catch (err) {
      window.alert(getErrorMessage(err, 'Não foi possível gerar o cupom desta venda.'))
      return
    }

    try {
      await imprimirViaAgente(base64)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Não foi possível imprimir.'
      window.alert(mensagem)
      return
    }

    querImprimir = window.confirm('Deseja imprimir o cupom novamente?')
  }
}
