import { apiClient } from './client'
import type { Cliente, ClienteInput } from '../types/Cliente'

export const clientesApi = {
  getAll: () => apiClient.get<Cliente[]>('/clientes').then((r) => r.data),
  getById: (id: number) => apiClient.get<Cliente>(`/clientes/${id}`).then((r) => r.data),
  create: (data: ClienteInput) => apiClient.post<Cliente>('/clientes', data).then((r) => r.data),
  update: (id: number, data: ClienteInput) =>
    apiClient.put<Cliente>(`/clientes/${id}`, data).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/clientes/${id}`),
}
