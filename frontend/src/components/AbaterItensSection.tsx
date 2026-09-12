import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { itensReceberApi } from '../api/itensReceber'
import { funcionariosApi } from '../api/funcionarios'
import type { ItemPendente } from '../types/ItemReceber'
import type { Funcionario } from '../types/Funcionario'
import { formatDateTime, formatMoney } from '../utils/format'
import { getErrorMessage } from '../utils/errors'

const SEARCH_DEBOUNCE_MS = 400

export function AbaterItensSection() {
  const [items, setItems] = useState<ItemPendente[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [processando, setProcessando] = useState(false)

  const [restoAberto, setRestoAberto] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioId, setFuncionarioId] = useState<number | ''>('')
  const [valorPagoInput, setValorPagoInput] = useState('')

  const carregar = () => {
    setLoading(true)
    itensReceberApi
      .getAll({ page: page + 1, pageSize: rowsPerPage, search: search || undefined })
      .then((result) => {
        setItems(result.items)
        setTotalCount(result.totalCount)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar os itens em aberto.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    funcionariosApi.getAll().then(setFuncionarios)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
      setSelecionados(new Set())
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setSelecionados(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, [page, rowsPerPage, search])

  const itensSelecionados = items.filter((item) => selecionados.has(item.ipmId))
  const clienteSelecionadoId = itensSelecionados[0]?.clientesId ?? null
  const totalSelecionado = itensSelecionados.reduce((soma, item) => soma + (item.precoTotalDiaVenda ?? 0), 0)

  const alternarSelecao = (item: ItemPendente) => {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(item.ipmId)) {
        novo.delete(item.ipmId)
      } else {
        novo.add(item.ipmId)
      }
      return novo
    })
  }

  const abaterSelecionados = async () => {
    if (selecionados.size === 0) return
    const confirmado = window.confirm(
      `Confirma a quitação de ${selecionados.size} item(ns) totalizando ${formatMoney(totalSelecionado)}?`,
    )
    if (!confirmado) return

    setProcessando(true)
    try {
      await itensReceberApi.quitar({ ipmIds: Array.from(selecionados), valorPago: totalSelecionado })
      setSucesso(`${selecionados.size} item(ns) quitado(s) com sucesso.`)
      setSelecionados(new Set())
      carregar()
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível quitar os itens selecionados.'))
      carregar()
    } finally {
      setProcessando(false)
    }
  }

  const abrirRestoDeConta = () => {
    if (selecionados.size === 0) return
    setFuncionarioId('')
    setValorPagoInput('')
    setRestoAberto(true)
  }

  const confirmarRestoDeConta = async () => {
    const valorPago = Number(valorPagoInput)
    if (!valorPago || valorPago <= 0) {
      setError('Informe quanto foi pago.')
      return
    }
    if (valorPago > totalSelecionado) {
      setError('O valor pago não pode ser maior que o total selecionado.')
      return
    }
    if (valorPago < totalSelecionado && !funcionarioId) {
      setError('Selecione o funcionário responsável.')
      return
    }

    setProcessando(true)
    try {
      const resultado = await itensReceberApi.quitar({
        ipmIds: Array.from(selecionados),
        valorPago,
        funcionariosId: funcionarioId || null,
      })
      setRestoAberto(false)
      setSelecionados(new Set())
      carregar()
      if (resultado.novoMovimentoId) {
        setSucesso(
          `Itens quitados. Restante de ${formatMoney(resultado.valorRestante)} lançado como "Resto de Conta" (movimento #${resultado.novoMovimentoId}).`,
        )
      } else {
        setSucesso('Itens quitados — valor pago cobriu o total selecionado.')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível processar o resto de conta.'))
      carregar()
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Selecione os itens que o cliente decidiu pagar (pode ser de vendas diferentes, desde que do mesmo
          cliente) e quite ou lance o resto de conta.
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar por cliente ou produto..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 320 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {sucesso && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSucesso(null)}>
          {sucesso}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Movimento</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Produto</TableCell>
              <TableCell align="right">Qtd.</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Data da Venda</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const bloqueadoPorCliente =
                clienteSelecionadoId !== null && item.clientesId !== clienteSelecionadoId
              return (
                <TableRow key={item.ipmId} hover selected={selecionados.has(item.ipmId)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selecionados.has(item.ipmId)}
                      onChange={() => alternarSelecao(item)}
                      disabled={bloqueadoPorCliente}
                    />
                  </TableCell>
                  <TableCell>{item.codigoMovimento ?? item.movimentosId}</TableCell>
                  <TableCell>{item.clientesNome}</TableCell>
                  <TableCell>{item.produtosDescricao}</TableCell>
                  <TableCell align="right">{item.quantidade}</TableCell>
                  <TableCell align="right">{formatMoney(item.precoTotalDiaVenda)}</TableCell>
                  <TableCell>{formatDateTime(item.dataVenda)}</TableCell>
                </TableRow>
              )
            })}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum item em aberto encontrado.
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

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2,
          mt: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body1">
          {selecionados.size} item(ns) selecionado(s) · total {formatMoney(totalSelecionado)}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ReceiptLongIcon />}
          onClick={abrirRestoDeConta}
          disabled={selecionados.size === 0 || processando}
        >
          Resto de Conta
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon />}
          onClick={abaterSelecionados}
          disabled={selecionados.size === 0 || processando}
        >
          Abater
        </Button>
      </Box>

      <Dialog open={restoAberto} onClose={() => setRestoAberto(false)} fullWidth maxWidth="xs">
        <DialogTitle>Resto de Conta</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Total selecionado: <strong>{formatMoney(totalSelecionado)}</strong>
          </Typography>
          <TextField
            label="Quanto foi pago?"
            type="number"
            value={valorPagoInput}
            onChange={(e) => setValorPagoInput(e.target.value)}
            autoFocus
            fullWidth
          />
          <FormControl fullWidth size="small">
            <InputLabel id="resto-funcionario-label">Funcionário</InputLabel>
            <Select
              labelId="resto-funcionario-label"
              label="Funcionário"
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value as number)}
            >
              {funcionarios.map((f) => (
                <MenuItem key={f.funcionariosId} value={f.funcionariosId}>
                  {f.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {Number(valorPagoInput) > 0 && Number(valorPagoInput) < totalSelecionado && (
            <Typography variant="body2" color="text.secondary">
              Restante a lançar como "Resto de Conta":{' '}
              <strong>{formatMoney(totalSelecionado - Number(valorPagoInput))}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarRestoDeConta} disabled={processando}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
