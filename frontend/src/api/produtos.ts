import { apiClient } from './client'
import type { Produto, ProdutoInput } from '../types/Produto'

export const produtosApi = {
  getAll: () => apiClient.get<Produto[]>('/produtos').then((r) => r.data),
  getById: (id: number) => apiClient.get<Produto>(`/produtos/${id}`).then((r) => r.data),
  create: (data: ProdutoInput) => apiClient.post<Produto>('/produtos', data).then((r) => r.data),
  update: (id: number, data: ProdutoInput) =>
    apiClient.put<Produto>(`/produtos/${id}`, data).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/produtos/${id}`),
  buscarPorCodigoBarras: (codigoBarras: string) =>
    apiClient
      .get<Produto>('/produtos/buscar', { params: { codigoBarras } })
      .then((r) => r.data)
      .catch((err) => {
        if (err?.response?.status === 404) return null
        throw err
      }),
  buscarPorNome: (nome: string) =>
    apiClient.get<Produto[]>('/produtos/buscar', { params: { nome } }).then((r) => r.data),
}
