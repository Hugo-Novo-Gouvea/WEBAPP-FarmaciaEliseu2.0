import { useState } from 'react'
import { movimentosApi } from '../api/movimentos'
import type { MovimentoDetalhe } from '../types/Movimento'
import { getErrorMessage } from '../utils/errors'

export function useMovimentoDetalhe(onError?: (message: string) => void) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detalhe, setDetalhe] = useState<MovimentoDetalhe | null>(null)
  const [loading, setLoading] = useState(false)

  const openDetalhe = (id: number) => {
    setSelectedId(id)
    setDetalhe(null)
    setLoading(true)
    movimentosApi
      .getById(id)
      .then(setDetalhe)
      .catch((err) => onError?.(getErrorMessage(err, 'Não foi possível carregar os itens do movimento.')))
      .finally(() => setLoading(false))
  }

  const closeDetalhe = () => setSelectedId(null)

  return { selectedId, detalhe, loading, openDetalhe, closeDetalhe }
}
