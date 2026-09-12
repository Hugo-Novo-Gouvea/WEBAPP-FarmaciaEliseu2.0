import type { Movimento } from './Movimento'

export interface DashboardResumo {
  vendasHojeCount: number
  vendasHojeTotal: number
  fiadoAbertoCount: number
  fiadoAbertoTotal: number
  ultimasVendas: Movimento[]
}
