export interface ItemPendente {
  ipmId: number
  movimentosId: number
  codigoMovimento: number | null
  clientesId: number | null
  clientesNome: string | null
  produtosDescricao: string | null
  produtosCodigoProduto: string | null
  quantidade: number | null
  precoTotalDiaVenda: number | null
  dataVenda: string | null
}

export interface QuitarItensInput {
  ipmIds: number[]
  valorPago: number
  funcionariosId?: number | null
}

export interface QuitarItensResult {
  itensQuitados: number
  valorTotalSelecionado: number
  valorPago: number
  valorRestante: number
  novoMovimentoId: number | null
}
