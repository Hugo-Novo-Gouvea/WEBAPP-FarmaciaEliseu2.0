import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import PaidIcon from '@mui/icons-material/Paid'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import HistoryIcon from '@mui/icons-material/History'
import { dashboardApi } from '../api/dashboard'
import type { FechamentoCaixa } from '../types/FechamentoCaixa'
import { formatMoney } from '../utils/format'
import { getErrorMessage } from '../utils/errors'
import { StatCard } from '../components/StatCard'

function hojeIso(): string {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function FechamentoCaixaPage() {
  const [data, setData] = useState(hojeIso())
  const [fechamento, setFechamento] = useState<FechamentoCaixa | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    dashboardApi
      .getFechamento(data)
      .then((resultado) => {
        setFechamento(resultado)
        setErro(null)
      })
      .catch((err) => setErro(getErrorMessage(err, 'Não foi possível carregar o fechamento de caixa.')))
      .finally(() => setLoading(false))
  }, [data])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Fechamento de Caixa</Typography>
        <TextField
          label="Dia"
          type="date"
          size="small"
          value={data}
          onChange={(e) => setData(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      {erro && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <StatCard
          icon={<PointOfSaleIcon />}
          label="Vendas no dia"
          valor={fechamento ? formatMoney(fechamento.vendasNoDia.total) : '—'}
          legenda={fechamento ? `${fechamento.vendasNoDia.quantidade} venda(s)` : loading ? 'Carregando...' : '-'}
        />
        <StatCard
          icon={<PaidIcon />}
          label="Recebido em dinheiro"
          valor={fechamento ? formatMoney(fechamento.recebidoEmDinheiroNoDia.total) : '—'}
          legenda={
            fechamento ? `${fechamento.recebidoEmDinheiroNoDia.quantidade} venda(s)` : loading ? 'Carregando...' : '-'
          }
        />
        <StatCard
          icon={<RequestQuoteIcon />}
          label="Ficou pendente (fiado)"
          valor={fechamento ? formatMoney(fechamento.pendenteDoDia.total) : '—'}
          legenda={fechamento ? `${fechamento.pendenteDoDia.quantidade} venda(s)` : loading ? 'Carregando...' : '-'}
        />
        <StatCard
          icon={<HistoryIcon />}
          label="Recebido de dívidas antigas"
          valor={fechamento ? formatMoney(fechamento.recebidoDeDividasAntigas.total) : '—'}
          legenda={
            fechamento
              ? `${fechamento.recebidoDeDividasAntigas.quantidade} conta(s)`
              : loading
                ? 'Carregando...'
                : '-'
          }
        />
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Por funcionário
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small" sx={{ minWidth: 360 }}>
          <TableHead>
            <TableRow>
              <TableCell>Funcionário</TableCell>
              <TableCell align="right">Vendas</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fechamento?.porFuncionario.map((f) => (
              <TableRow key={f.funcionariosNome ?? '-'} hover>
                <TableCell>{f.funcionariosNome || '-'}</TableCell>
                <TableCell align="right">{f.quantidade}</TableCell>
                <TableCell align="right">{formatMoney(f.total)}</TableCell>
              </TableRow>
            ))}
            {fechamento && fechamento.porFuncionario.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Nenhuma venda neste dia.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
