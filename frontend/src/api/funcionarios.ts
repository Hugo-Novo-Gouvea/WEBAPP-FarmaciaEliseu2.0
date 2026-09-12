import { apiClient } from './client'
import type { Funcionario, FuncionarioInput } from '../types/Funcionario'

export const funcionariosApi = {
  getAll: () => apiClient.get<Funcionario[]>('/funcionarios').then((r) => r.data),
  getById: (id: number) => apiClient.get<Funcionario>(`/funcionarios/${id}`).then((r) => r.data),
  create: (data: FuncionarioInput) =>
    apiClient.post<Funcionario>('/funcionarios', data).then((r) => r.data),
  update: (id: number, data: FuncionarioInput) =>
    apiClient.put<Funcionario>(`/funcionarios/${id}`, data).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/funcionarios/${id}`),
}
