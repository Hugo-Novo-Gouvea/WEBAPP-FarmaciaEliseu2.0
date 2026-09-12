export interface Produto {
  produtosId: number
  descricao: string | null
  unidadeMedida: string | null
  precoCompra: number | null
  precoVenda: number | null
  localizacao: string | null
  laboratorio: string | null
  principio: string | null
  generico: string | null
  codigoProduto: string | null
  codigoBarras: string | null
  dataCadastro: string
  dataUltimoRegistro: string
}

export interface ProdutoInput {
  descricao: string
  unidadeMedida?: string | null
  precoCompra?: number | null
  precoVenda?: number | null
  localizacao?: string | null
  laboratorio?: string | null
  principio?: string | null
  generico?: string | null
  codigoProduto?: string | null
  codigoBarras?: string | null
}
