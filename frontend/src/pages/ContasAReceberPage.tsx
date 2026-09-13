import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
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
import { clientesApi } from '../api/clientes'
import { funcionariosApi } from '../api/funcionarios'
import type { ItemPendente } from '../types/ItemReceber'
import type { Cliente } from '../types/Cliente'
import type { Funcionario } from '../types/Funcionario'
import { formatDateTime, formatMoney } from '../utils/format'
import { getErrorMessage } from '../utils/errors'

export function ContasAReceberPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cliente, setCliente] = useState<Cliente | null>(null)

  const [items, setItems] = useState<ItemPendente[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [processando, setProcessando] = useState(false)

  const [restoAberto, setRestoAberto] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioId, setFuncionarioId] = useState<number | ''>('')
  const [valorPagoInput, setValorPagoInput] = useState('')

  useEffect(() => {
    clientesApi.getAll().then(setClientes)
    funcionariosApi.getAll().then(setFuncionarios)
  }, [])

  const carregar = () => {
    if (!cliente) {
      setItems([])
      setTotalCount(0)
      return
    }
    setLoading(true)
    itensReceberApi
      .getAll({ page: page + 1, pageSize: rowsPerPage, clientesId: cliente.clientesId })
      .then((result) => {
        setItems(result.items)
        setTotalCount(result.totalCount)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar os itens em aberto.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setSelecionados(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente, page, rowsPerPage])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, [cliente, page, rowsPerPage])

  const itensSelecionados = items.filter((item) => selecionados.has(item.ipmId))
  const totalSelecionado = itensSelecionados.reduce((soma, item) => soma + (item.precoTotalDiaVenda ?? 0), 0)
  const totalDaPagina = items.reduce((soma, item) => soma + (item.precoTotalDiaVenda ?? 0), 0)

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

  const alternarTodos = () => {
    setSelecionados((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((item) => item.ipmId)),
    )
  }

  const abaterSelecionados = async () => {
    if (selecionados.size === 0) return
    const confirmado = window.confirm(
      `Confirma a baixa de ${selecionados.size} item(ns) totalizando ${formatMoney(totalSelecionado)}?`,
    )
    if (!confirmado) return

    setProcessando(true)
    try {
      await itensReceberApi.quitar({ ipmIds: Array.from(selecionados), valorPago: totalSelecionado })
      setSucesso(`${selecionados.size} item(ns) baixado(s) com sucesso.`)
      setSelecionados(new Set())
      carregar()
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível dar baixa nos itens selecionados.'))
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
          `Itens baixados. Restante de ${formatMoney(resultado.valorRestante)} lançado como "Resto de Conta" (movimento #${resultado.novoMovimentoId}).`,
        )
      } else {
        setSucesso('Itens baixados — valor pago cobriu o total selecionado.')
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
      <Typography variant="h5" sx={{ mb: 2 }}>
        Contas a Receber
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Cliente
        </Typography>
        <Autocomplete
          options={clientes}
          getOptionLabel={(c) => c.nome ?? ''}
          isOptionEqualToValue={(a, b) => a.clientesId === b.clientesId}
          value={cliente}
          onChange={(_, valor) => {
            setCliente(valor)
            setPage(0)
          }}
          renderInput={(params) => <TextField {...params} placeholder="Informe o nome do cliente..." />}
          size="small"
          sx={{ maxWidth: 520 }}
        />
      </Paper>

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

      {!cliente && (
        <Alert severity="info">
          Informe o nome do cliente acima para ver os itens em aberto dele.
        </Alert>
      )}

      {cliente && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {loading
              ? 'Carregando itens em aberto...'
              : `${totalCount} item(ns) em aberto · soma da página: ${formatMoney(totalDaPagina)}`}
          </Typography>

          <TableContainer component={Paper}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={items.length > 0 && selecionados.size === items.length}
                      indeterminate={selecionados.size > 0 && selecionados.size < items.length}
                      onChange={alternarTodos}
                      disabled={items.length === 0}
                      slotProps={{ input: { 'aria-label': 'selecionar todos' } }}
                    />
                  </TableCell>
                  <TableCell>Movimento</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Qtd.</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Data da Venda</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Enquanto carrega, não mostra as linhas antigas: elas podem ser
                    de outro cliente e seriam selecionáveis por engano. */}
                {!loading &&
                  items.map((item) => (
                    <TableRow
                      key={item.ipmId}
                      hover
                      selected={selecionados.has(item.ipmId)}
                      onClick={() => alternarSelecao(item)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selecionados.has(item.ipmId)} />
                      </TableCell>
                      <TableCell>{item.codigoMovimento ?? item.movimentosId}</TableCell>
                      <TableCell>{item.produtosDescricao}</TableCell>
                      <TableCell align="right">{item.quantidade}</TableCell>
                      <TableCell align="right">{formatMoney(item.precoTotalDiaVenda)}</TableCell>
                      <TableCell>{formatDateTime(item.dataVenda)}</TableCell>
                    </TableRow>
                  ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum item em aberto para este cliente.
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
              gap: 3,
              mt: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {selecionados.size} item(ns) selecionado(s)
            </Typography>
            <Typography variant="h6">Valor: {formatMoney(totalSelecionado)}</Typography>
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
              Dar Baixa
            </Button>
          </Box>
        </>
      )}

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
