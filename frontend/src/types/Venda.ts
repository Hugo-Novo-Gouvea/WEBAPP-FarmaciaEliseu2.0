export type FormaPagamento = 'dinheiro' | 'marcar'
export type TipoDesconto = 'nenhum' | 'percentual' | 'fixo'

export interface ItemCarrinho {
  chave: string
  produtosId: number
  descricao: string
  codigoProduto: string | null
  quantidade: number
  precoUnitario: number
  descontoTipo: TipoDesconto
  descontoValor: number
}

export interface VendaItemInput {
  produtosId: number
  descricaoAvulso?: string | null
  quantidade: number
  precoUnitario: number
}

export interface VendaInput {
  clientesId: number
  funcionariosId: number
  formaPagamento: FormaPagamento
  itens: VendaItemInput[]
  descontoTotal?: number
}
