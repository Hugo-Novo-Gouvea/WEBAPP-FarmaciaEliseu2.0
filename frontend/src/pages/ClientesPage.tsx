import { CrudPage, type ColumnConfig, type FieldConfig } from '../components/CrudPage'
import { clientesApi } from '../api/clientes'
import type { Cliente, ClienteInput } from '../types/Cliente'

const columns: ColumnConfig<Cliente>[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'cpf', label: 'CPF' },
  { key: 'celular', label: 'Celular' },
  { key: 'endereco', label: 'Endereço' },
]

const fields: FieldConfig<ClienteInput>[] = [
  { key: 'nome', label: 'Nome', type: 'text', required: true },
  { key: 'endereco', label: 'Endereço', type: 'text' },
  { key: 'rg', label: 'RG', type: 'text' },
  { key: 'cpf', label: 'CPF', type: 'text' },
  { key: 'telefone', label: 'Telefone', type: 'text' },
  { key: 'celular', label: 'Celular', type: 'text' },
  { key: 'codigoFichario', label: 'Código Fichário', type: 'number' },
]

const emptyInput: ClienteInput = {
  nome: '',
  endereco: '',
  rg: '',
  cpf: '',
  telefone: '',
  celular: '',
  codigoFichario: null,
}

const toInput = (item: Cliente): ClienteInput => ({
  nome: item.nome ?? '',
  endereco: item.endereco ?? '',
  rg: item.rg ?? '',
  cpf: item.cpf ?? '',
  telefone: item.telefone ?? '',
  celular: item.celular ?? '',
  codigoFichario: item.codigoFichario,
})

export function ClientesPage() {
  return (
    <CrudPage<Cliente, ClienteInput>
      title="Clientes"
      idKey="clientesId"
      columns={columns}
      fields={fields}
      api={clientesApi}
      emptyInput={emptyInput}
      toInput={toInput}
      searchKey="nome"
    />
  )
}
