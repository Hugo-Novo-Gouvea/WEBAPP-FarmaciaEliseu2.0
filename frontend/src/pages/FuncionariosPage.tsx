import { CrudPage, type ColumnConfig, type FieldConfig } from '../components/CrudPage'
import { funcionariosApi } from '../api/funcionarios'
import type { Funcionario, FuncionarioInput } from '../types/Funcionario'

const columns: ColumnConfig<Funcionario>[] = [{ key: 'nome', label: 'Nome' }]

const fields: FieldConfig<FuncionarioInput>[] = [
  { key: 'nome', label: 'Nome', type: 'text', required: true },
]

// codigoAntigo saiu da tela (dado do sistema antigo). Cadastro novo grava 0;
// na edição o valor que já existe no banco é preservado.
const emptyInput: FuncionarioInput = {
  nome: '',
  codigoAntigo: '0',
}

const toInput = (item: Funcionario): FuncionarioInput => ({
  nome: item.nome ?? '',
  codigoAntigo: item.codigoAntigo ?? '0',
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
