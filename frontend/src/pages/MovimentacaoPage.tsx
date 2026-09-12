import { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { movimentosApi } from '../api/movimentos'
import type { Movimento } from '../types/Movimento'
import { formatDateTime, formatMoney } from '../utils/format'
import { useMovimentoDetalhe } from '../hooks/useMovimentoDetalhe'
import { MovimentoDetalheDialog } from '../components/MovimentoDetalheDialog'
import { getErrorMessage } from '../utils/errors'

// A busca digitada só dispara a chamada à API depois desse intervalo sem teclas
// novas, para não fazer uma requisição a cada caractere.
const SEARCH_DEBOUNCE_MS = 400

export function MovimentacaoPage() {
  const [items, setItems] = useState<Movimento[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const { selectedId, detalhe, loading: detalheLoading, openDetalhe, closeDetalhe } =
    useMovimentoDetalhe(setError)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const carregar = () => {
    setLoading(true)
    movimentosApi
      .getAll({ page: page + 1, pageSize: rowsPerPage, search: search || undefined })
      .then((result) => {
        setItems(result.items)
        setTotalCount(result.totalCount)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar os movimentos.')))
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, [page, rowsPerPage, search])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="h5">Movimentação</Typography>
        <TextField
          size="small"
          placeholder="Buscar por cliente, funcionário ou código..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 360 }}
        />
      </Box>

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
              <TableCell align="right">Valor Total</TableCell>
              <TableCell>Pagamento</TableCell>
              <TableCell align="right">Detalhes</TableCell>
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
                <TableCell>
                  {m.dataPagamento ? (
                    <Chip label="Pago" color="success" size="small" variant="outlined" />
                  ) : (
                    <Chip label="Pendente" color="warning" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDetalhe(m.movimentosId)} aria-label="ver itens">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum movimento encontrado.
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
      />
    </Box>
  )
}
