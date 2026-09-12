import { CrudPage, type ColumnConfig, type FieldConfig } from '../components/CrudPage'
import { funcionariosApi } from '../api/funcionarios'
import type { Funcionario, FuncionarioInput } from '../types/Funcionario'

const columns: ColumnConfig<Funcionario>[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'codigoAntigo', label: 'Código Antigo' },
]

const fields: FieldConfig<FuncionarioInput>[] = [
  { key: 'nome', label: 'Nome', type: 'text', required: true },
  { key: 'codigoAntigo', label: 'Código Antigo', type: 'text' },
]

const emptyInput: FuncionarioInput = {
  nome: '',
  codigoAntigo: '',
}

const toInput = (item: Funcionario): FuncionarioInput => ({
  nome: item.nome ?? '',
  codigoAntigo: item.codigoAntigo ?? '',
})

export function FuncionariosPage() {
  return (
    <CrudPage<Funcionario, FuncionarioInput>
      title="Funcionários"
      idKey="funcionariosId"
      columns={columns}
      fields={fields}
      api={funcionariosApi}
      emptyInput={emptyInput}
      toInput={toInput}
      searchKey="nome"
    />
  )
}
