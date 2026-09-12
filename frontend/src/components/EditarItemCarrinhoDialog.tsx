import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import type { ItemCarrinho, TipoDesconto } from '../types/Venda'
import { calcularBrutoItem, calcularDescontoItem, calcularTotalItem } from '../utils/carrinho'
import { formatMoney } from '../utils/format'

interface EditarItemCarrinhoDialogProps {
  item: ItemCarrinho | null
  onClose: () => void
  onConfirmar: (chave: string, alteracoes: Partial<ItemCarrinho>) => void
}

export function EditarItemCarrinhoDialog({ item, onClose, onConfirmar }: EditarItemCarrinhoDialogProps) {
  const [quantidade, setQuantidade] = useState('1')
  const [precoUnitario, setPrecoUnitario] = useState('0')
  const [descontoTipo, setDescontoTipo] = useState<TipoDesconto>('nenhum')
  const [descontoValor, setDescontoValor] = useState('0')

  useEffect(() => {
    if (item) {
      setQuantidade(String(item.quantidade))
      setPrecoUnitario(String(item.precoUnitario))
      setDescontoTipo(item.descontoTipo)
      setDescontoValor(String(item.descontoValor))
    }
  }, [item])

  if (!item) return null

  const preview: ItemCarrinho = {
    ...item,
    quantidade: Math.max(1, Number(quantidade) || 1),
    precoUnitario: Math.max(0, Number(precoUnitario) || 0),
    descontoTipo,
    descontoValor: Math.max(0, Number(descontoValor) || 0),
  }

  const handleConfirmar = () => {
    onConfirmar(item.chave, {
      quantidade: preview.quantidade,
      precoUnitario: preview.precoUnitario,
      descontoTipo: preview.descontoTipo,
      descontoValor: preview.descontoTipo === 'nenhum' ? 0 : preview.descontoValor,
    })
  }

  return (
    <Dialog open={item !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar item</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {item.descricao}
        </Typography>

        <TextField
          label="Quantidade"
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          fullWidth
        />
        <TextField
          label="Preço unitário (R$)"
          type="number"
          value={precoUnitario}
          onChange={(e) => setPrecoUnitario(e.target.value)}
          fullWidth
        />
        <TextField
          select
          label="Desconto"
          value={descontoTipo}
          onChange={(e) => setDescontoTipo(e.target.value as TipoDesconto)}
          fullWidth
        >
          <MenuItem value="nenhum">Sem desconto</MenuItem>
          <MenuItem value="percentual">Percentual (%)</MenuItem>
          <MenuItem value="fixo">Valor fixo (R$)</MenuItem>
        </TextField>
        {descontoTipo !== 'nenhum' && (
          <TextField
            label={descontoTipo === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'}
            type="number"
            value={descontoValor}
            onChange={(e) => setDescontoValor(e.target.value)}
            fullWidth
          />
        )}

        <Typography variant="body2" color="text.secondary">
          Bruto: {formatMoney(calcularBrutoItem(preview))}
          {calcularDescontoItem(preview) > 0 && <> · Desconto: -{formatMoney(calcularDescontoItem(preview))}</>}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Total: {formatMoney(calcularTotalItem(preview))}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirmar}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
