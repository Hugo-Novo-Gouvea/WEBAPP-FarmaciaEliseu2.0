import { apiClient } from './client'
import type { MovimentoDetalhe } from '../types/Movimento'
import type { VendaInput } from '../types/Venda'

export const vendasApi = {
  criar: (venda: VendaInput) =>
    apiClient.post<MovimentoDetalhe>('/vendas', venda).then((r) => r.data),
}
