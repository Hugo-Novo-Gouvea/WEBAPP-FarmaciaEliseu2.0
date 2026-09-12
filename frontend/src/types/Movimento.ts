export interface Movimento {
  movimentosId: number
  codigoMovimento: number | null
  clientesNome: string | null
  funcionariosNome: string | null
  valorTotal: number | null
  descontoTotal: number | null
  valorPago: number | null
  dataVenda: string | null
  dataPagamento: string | null
}

export interface ItemMovimento {
  ipmId: number
  produtosDescricao: string | null
  produtosCodigoProduto: string | null
  quantidade: number | null
  precoUnitarioDiaVenda: number | null
  precoTotalDiaVenda: number | null
  precoUnitarioAtual: number | null
  precoTotalAtual: number | null
  dataPagamentoItem: string | null
}

export interface MovimentoDetalhe extends Movimento {
  itens: ItemMovimento[]
}
