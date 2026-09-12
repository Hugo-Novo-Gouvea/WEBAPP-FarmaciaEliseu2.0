import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { movimentosApi } from '../api/movimentos'
import type { Movimento } from '../types/Movimento'
import { formatDateTime, formatMoney } from '../utils/format'
import { useMovimentoDetalhe } from '../hooks/useMovimentoDetalhe'
import { MovimentoDetalheDialog } from '../components/MovimentoDetalheDialog'
import { AbaterItensSection } from '../components/AbaterItensSection'
import { perguntarEImprimir } from '../printing/perguntarEImprimir'
import { getErrorMessage } from '../utils/errors'

// A busca digitada só dispara a chamada à API depois desse intervalo sem teclas
// novas, para não fazer uma requisição a cada caractere.
const SEARCH_DEBOUNCE_MS = 400

export function ContasAReceberPage() {
  const [aba, setAba] = useState<'venda' | 'item'>('venda')
  const [items, setItems] = useState<Movimento[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [marcandoPagoId, setMarcandoPagoId] = useState<number | null>(null)

  const { selectedId, detalhe, loading: detalheLoading, openDetalhe, closeDetalhe } =
    useMovimentoDetalhe(setError)

  const carregar = () => {
    setLoading(true)
    movimentosApi
      .getPendentes({ page: page + 1, pageSize: rowsPerPage, search: search || undefined })
      .then((result) => {
        setItems(result.items)
        setTotalCount(result.totalCount)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar as contas a receber.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, [page, rowsPerPage, search])

  const marcarComoPago = async (id: number) => {
    const confirmado = window.confirm('Confirma que este movimento foi pago?')
    if (!confirmado) return

    setMarcandoPagoId(id)
    try {
      await movimentosApi.marcarComoPago(id)
      closeDetalhe()
      carregar()
      await perguntarEImprimir(id)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível marcar o movimento como pago.'))
      carregar()
    } finally {
      setMarcandoPagoId(null)
    }
  }

  const totalPendente = items.reduce((soma, m) => soma + (m.valorTotal ?? 0), 0)

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Contas a Receber
      </Typography>

      <Tabs value={aba} onChange={(_, valor) => setAba(valor)} sx={{ mb: 2 }}>
        <Tab value="venda" label="Por Venda" />
        <Tab value="item" label="Abater Itens" />
      </Tabs>

      {aba === 'item' && <AbaterItensSection />}

      {aba === 'venda' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar por cliente, funcionário ou código..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 360 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {totalCount} movimento(s) em aberto nesta página · soma da página: {formatMoney(totalPendente)}
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Funcionário</TableCell>
              <TableCell>Data da Venda</TableCell>
              <TableCell align="right">Valor em Aberto</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((m) => (
              <TableRow key={m.movimentosId} hover>
                <TableCell>{m.codigoMovimento ?? m.movimentosId}</TableCell>
                <TableCell>{m.clientesNome}</TableCell>
                <TableCell>{m.funcionariosNome}</TableCell>
                <TableCell>{formatDateTime(m.dataVenda)}</TableCell>
                <TableCell align="right">{formatMoney(m.valorTotal)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDetalhe(m.movimentosId)} aria-label="ver itens">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => marcarComoPago(m.movimentosId)}
                    disabled={marcandoPagoId === m.movimentosId}
                    aria-label="marcar como pago"
                    title="Marcar como pago"
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhuma conta em aberto encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setPage(0)
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Linhas por página"
            />
          </TableContainer>

          <MovimentoDetalheDialog
            selectedId={selectedId}
            detalhe={detalhe}
            loading={detalheLoading}
            onClose={closeDetalhe}
            onCancelado={carregar}
            actions={
              selectedId !== null && (
                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => marcarComoPago(selectedId)}
                  disabled={marcandoPagoId === selectedId}
                >
                  Marcar como pago
                </Button>
              )
            }
          />
        </>
      )}
    </Box>
  )
}
