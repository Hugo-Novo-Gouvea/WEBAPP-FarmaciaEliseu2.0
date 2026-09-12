import { apiClient } from './client'
import type { DashboardResumo } from '../types/Dashboard'
import type { FechamentoCaixa } from '../types/FechamentoCaixa'

export const dashboardApi = {
  getResumo: () => apiClient.get<DashboardResumo>('/dashboard/resumo').then((r) => r.data),
  getFechamento: (data?: string) =>
    apiClient.get<FechamentoCaixa>('/dashboard/fechamento', { params: data ? { data } : {} }).then((r) => r.data),
}
