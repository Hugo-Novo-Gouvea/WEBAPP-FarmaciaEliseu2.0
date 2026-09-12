import { apiClient } from './client'
import type { Movimento, MovimentoDetalhe } from '../types/Movimento'
import type { PagedResult } from '../types/PagedResult'

export const movimentosApi = {
  getAll: (params: { page: number; pageSize: number; search?: string }) =>
    apiClient.get<PagedResult<Movimento>>('/movimentos', { params }).then((r) => r.data),
  getPendentes: (params: { page: number; pageSize: number; search?: string }) =>
    apiClient.get<PagedResult<Movimento>>('/movimentos/pendentes', { params }).then((r) => r.data),
  getCobranca: (params: { dias: number; page: number; pageSize: number; search?: string }) =>
    apiClient.get<PagedResult<Movimento>>('/movimentos/cobranca', { params }).then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<MovimentoDetalhe>(`/movimentos/${id}`).then((r) => r.data),
  marcarComoPago: (id: number) =>
    apiClient.post<Movimento>(`/movimentos/${id}/marcar-pago`).then((r) => r.data),
  getCupom: (id: number) =>
    apiClient.get<{ base64: string }>(`/movimentos/${id}/cupom`).then((r) => r.data.base64),
  cancelar: (id: number) => apiClient.post(`/movimentos/${id}/cancelar`),
}
