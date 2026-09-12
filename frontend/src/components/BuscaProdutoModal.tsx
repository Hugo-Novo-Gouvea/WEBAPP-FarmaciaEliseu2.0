import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import type { Produto } from '../types/Produto'
import { formatMoney } from '../utils/format'

interface BuscaProdutoModalProps {
  open: boolean
  termo: string
  resultados: Produto[]
  loading: boolean
  onClose: () => void
  onSelect: (produto: Produto) => void
}

export function BuscaProdutoModal({ open, termo, resultados, loading, onClose, onSelect }: BuscaProdutoModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Resultados para "{termo}"</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading && (
          <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 4 }} />
        )}

        {!loading && resultados.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            Nenhum produto encontrado.
          </Typography>
        )}

        {!loading && resultados.length > 0 && (
          <List disablePadding>
            {resultados.map((produto) => (
              <ListItemButton key={produto.produtosId} onClick={() => onSelect(produto)} divider>
                <ListItemText
                  primary={produto.descricao}
                  secondary={`Código: ${produto.codigoProduto ?? '-'} · ${formatMoney(produto.precoVenda)}`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}
