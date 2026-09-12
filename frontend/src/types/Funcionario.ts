export interface Funcionario {
  funcionariosId: number
  nome: string | null
  codigoAntigo: string | null
  dataCadastro: string
  dataUltimoRegistro: string
}

export interface FuncionarioInput {
  nome: string
  codigoAntigo?: string | null
}
