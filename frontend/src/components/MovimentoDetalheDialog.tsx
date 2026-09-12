import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import CancelIcon from '@mui/icons-material/Cancel'
import type { MovimentoDetalhe } from '../types/Movimento'
import { formatDateTime, formatMoney } from '../utils/format'
import { perguntarEImprimir } from '../printing/perguntarEImprimir'
import { movimentosApi } from '../api/movimentos'
import { getErrorMessage } from '../utils/errors'

interface MovimentoDetalheDialogProps {
  selectedId: number | null
  detalhe: MovimentoDetalhe | null
  loading: boolean
  onClose: () => void
  onCancelado?: () => void
  actions?: ReactNode
}

export function MovimentoDetalheDialog({
  selectedId,
  detalhe,
  loading,
  onClose,
  onCancelado,
  actions,
}: MovimentoDetalheDialogProps) {
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState<string | null>(null)

  const cancelarVenda = async () => {
    if (selectedId === null) return
    const confirmado = window.confirm(
      'Tem certeza que deseja cancelar esta venda? Essa ação não pode ser desfeita.',
    )
    if (!confirmado) return

    setCancelando(true)
    setErroCancelar(null)
    try {
      await movimentosApi.cancelar(selectedId)
      onClose()
      onCancelado?.()
    } catch (err) {
      setErroCancelar(getErrorMessage(err, 'Não foi possível cancelar esta venda.'))
    } finally {
      setCancelando(false)
    }
  }

  return (
    <Dialog open={selectedId !== null} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Movimento {detalhe?.codigoMovimento ?? selectedId}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {erroCancelar && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErroCancelar(null)}>
            {erroCancelar}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && detalhe && (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Cliente
                </Typography>
                <Typography>{detalhe.clientesNome || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Funcionário
                </Typography>
                <Typography>{detalhe.funcionariosNome || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Data da Venda
                </Typography>
                <Typography>{formatDateTime(detalhe.dataVenda) || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Desconto Total
                </Typography>
                <Typography>{formatMoney(detalhe.descontoTotal)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Valor Total
                </Typography>
                <Typography sx={{ fontWeight: 'bold' }}>{formatMoney(detalhe.valorTotal)}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Itens do movimento
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell align="right">Qtd.</TableCell>
                    <TableCell align="right">Preço Unit. (na venda)</TableCell>
                    <TableCell align="right">Total (na venda)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalhe.itens.map((item) => (
                    <TableRow key={item.ipmId}>
                      <TableCell>{item.produtosDescricao}</TableCell>
                      <TableCell>{item.produtosCodigoProduto}</TableCell>
                      <TableCell align="right">{item.quantidade}</TableCell>
                      <TableCell align="right">{formatMoney(item.precoUnitarioDiaVenda)}</TableCell>
                      <TableCell align="right">{formatMoney(item.precoTotalDiaVenda)}</TableCell>
                    </TableRow>
                  ))}
                  {detalhe.itens.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Nenhum item encontrado para este movimento.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {selectedId !== null && (
          <Button
            color="error"
            startIcon={<CancelIcon />}
            onClick={cancelarVenda}
            disabled={cancelando || loading}
          >
            Cancelar Venda
          </Button>
        )}
        {selectedId !== null && (
          <Button startIcon={<PrintIcon />} onClick={() => perguntarEImprimir(selectedId)}>
            Imprimir
          </Button>
        )}
        {actions}
      </DialogActions>
    </Dialog>
  )
}
