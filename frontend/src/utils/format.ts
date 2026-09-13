// Vírgula separando reais de centavos, sem separador de milhar.
export const formatMoney = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === ''
    ? ''
    : `R$ ${Number(value).toFixed(2).replace('.', ',')}`

export const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('pt-BR') : ''

export const diasEmAberto = (dataVenda: string | null | undefined) => {
  if (!dataVenda) return null
  const diffMs = Date.now() - new Date(dataVenda).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}
