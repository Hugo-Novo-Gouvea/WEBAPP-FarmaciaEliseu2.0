export interface Cliente {
  clientesId: number
  nome: string | null
  endereco: string | null
  rg: string | null
  cpf: string | null
  telefone: string | null
  celular: string | null
  dataNascimento: string | null
  codigoFichario: number | null
  dataCadastro: string
  dataUltimoRegistro: string
}

export interface ClienteInput {
  nome: string
  endereco?: string | null
  rg?: string | null
  cpf?: string | null
  telefone?: string | null
  celular?: string | null
  dataNascimento?: string | null
  codigoFichario?: number | null
}
