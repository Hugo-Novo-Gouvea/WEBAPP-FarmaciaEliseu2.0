import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import PaidIcon from '@mui/icons-material/Paid'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import { dashboardApi } from '../api/dashboard'
import type { DashboardResumo } from '../types/Dashboard'
import { formatDateTime, formatMoney } from '../utils/format'
import { getErrorMessage } from '../utils/errors'
import { StatCard } from '../components/StatCard'

export function Home() {
  const navigate = useNavigate()
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    dashboardApi
      .getResumo()
      .then(setResumo)
      .catch((err) => setErro(getErrorMessage(err, 'Não foi possível carregar o resumo.')))
  }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">Início</Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PointOfSaleIcon />}
          onClick={() => navigate('/vender')}
        >
          Nova Venda
        </Button>
      </Box>

      {erro && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <StatCard
          icon={<PaidIcon />}
          label="Vendas hoje"
          valor={resumo ? formatMoney(resumo.vendasHojeTotal) : '—'}
          legenda={resumo ? `${resumo.vendasHojeCount} venda(s)` : 'Carregando...'}
        />
        <StatCard
          icon={<RequestQuoteIcon />}
          label="Fiado em aberto"
          valor={resumo ? formatMoney(resumo.fiadoAbertoTotal) : '—'}
          legenda={resumo ? `${resumo.fiadoAbertoCount} conta(s) pendente(s)` : 'Carregando...'}
        />
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Últimas vendas
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small" sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Funcionário</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Pagamento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resumo?.ultimasVendas.map((m) => (
              <TableRow key={m.movimentosId} hover>
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
              </TableRow>
            ))}
            {resumo && resumo.ultimasVendas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhuma venda registrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
