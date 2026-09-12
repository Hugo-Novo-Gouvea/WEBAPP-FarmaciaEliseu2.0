import type { ItemCarrinho } from '../types/Venda'

// Valor bruto da linha (sem desconto).
export function calcularBrutoItem(item: ItemCarrinho): number {
  return item.quantidade * item.precoUnitario
}

// Desconto em R$ aplicado na linha (percentual ou fixo, nunca negativo nem
// maior que o próprio bruto).
export function calcularDescontoItem(item: ItemCarrinho): number {
  const bruto = calcularBrutoItem(item)
  if (item.descontoTipo === 'percentual') {
    return Math.min(bruto, bruto * (item.descontoValor / 100))
  }
  if (item.descontoTipo === 'fixo') {
    return Math.min(bruto, Math.max(0, item.descontoValor))
  }
  return 0
}

// Valor final da linha, já com o desconto aplicado.
export function calcularTotalItem(item: ItemCarrinho): number {
  return calcularBrutoItem(item) - calcularDescontoItem(item)
}
