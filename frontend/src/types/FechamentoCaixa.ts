export interface ResumoValor {
  quantidade: number
  total: number
}

export interface FechamentoPorFuncionario {
  funcionariosNome: string | null
  quantidade: number
  total: number
}

export interface FechamentoCaixa {
  data: string
  vendasNoDia: ResumoValor
  recebidoEmDinheiroNoDia: ResumoValor
  pendenteDoDia: ResumoValor
  recebidoDeDividasAntigas: ResumoValor
  porFuncionario: FechamentoPorFuncionario[]
}
