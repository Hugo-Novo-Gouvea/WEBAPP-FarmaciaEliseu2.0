import { apiClient } from './client'
import type { ItemPendente, QuitarItensInput, QuitarItensResult } from '../types/ItemReceber'
import type { PagedResult } from '../types/PagedResult'

export const itensReceberApi = {
  getAll: (params: { page: number; pageSize: number; search?: string; clientesId?: number }) =>
    apiClient.get<PagedResult<ItemPendente>>('/itensreceber', { params }).then((r) => r.data),
  quitar: (data: QuitarItensInput) =>
    apiClient.post<QuitarItensResult>('/itensreceber/quitar', data).then((r) => r.data),
}
