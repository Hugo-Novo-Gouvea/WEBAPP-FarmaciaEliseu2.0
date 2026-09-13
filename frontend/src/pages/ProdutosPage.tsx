import { CrudPage, type ColumnConfig, type FieldConfig } from '../components/CrudPage'
import { produtosApi } from '../api/produtos'
import type { Produto, ProdutoInput } from '../types/Produto'
import { formatMoney } from '../utils/format'

const columns: ColumnConfig<Produto>[] = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'codigoProduto', label: 'Código' },
  { key: 'precoVenda', label: 'Preço Venda', format: formatMoney },
  { key: 'laboratorio', label: 'Laboratório' },
]

// precoCompra saiu da tela (informação antiga que não é mais usada). Cadastro
// novo grava 0; na edição o valor que já existe no banco é preservado.
const fields: FieldConfig<ProdutoInput>[] = [
  { key: 'descricao', label: 'Descrição', type: 'text', required: true },
  { key: 'precoVenda', label: 'Preço de Venda', type: 'number', required: true, format: formatMoney },
  { key: 'codigoBarras', label: 'Código de Barras', type: 'text', required: true },
  { key: 'unidadeMedida', label: 'Unidade de Medida', type: 'text' },
  { key: 'localizacao', label: 'Localização', type: 'text' },
  { key: 'laboratorio', label: 'Laboratório', type: 'text' },
  { key: 'principio', label: 'Princípio Ativo', type: 'text' },
  { key: 'generico', label: 'Genérico', type: 'text' },
  { key: 'codigoProduto', label: 'Código do Produto', type: 'text' },
]

const emptyInput: ProdutoInput = {
  descricao: '',
  unidadeMedida: '',
  precoCompra: 0,
  precoVenda: null,
  localizacao: '',
  laboratorio: '',
  principio: '',
  generico: '',
  codigoProduto: '',
  codigoBarras: '',
}

const toInput = (item: Produto): ProdutoInput => ({
  descricao: item.descricao ?? '',
  unidadeMedida: item.unidadeMedida ?? '',
  precoCompra: item.precoCompra ?? 0,
  precoVenda: item.precoVenda,
  localizacao: item.localizacao ?? '',
  laboratorio: item.laboratorio ?? '',
  principio: item.principio ?? '',
  generico: item.generico ?? '',
  codigoProduto: item.codigoProduto ?? '',
  codigoBarras: item.codigoBarras ?? '',
})

export function ProdutosPage() {
  return (
    <CrudPage<Produto, ProdutoInput>
      title="Produtos"
      idKey="produtosId"
      columns={columns}
      fields={fields}
      api={produtosApi}
      emptyInput={emptyInput}
      toInput={toInput}
      searchKey="descricao"
    />
  )
}
