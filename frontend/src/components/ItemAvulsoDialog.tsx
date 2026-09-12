import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'

interface ItemAvulsoDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (descricao: string, quantidade: number, valor: number) => void
}

export function ItemAvulsoDialog({ open, onClose, onConfirm }: ItemAvulsoDialogProps) {
  const [descricao, setDescricao] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [valor, setValor] = useState('')

  const reset = () => {
    setDescricao('')
    setQuantidade('1')
    setValor('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleConfirm = () => {
    const quantidadeNum = Number(quantidade)
    const valorNum = Number(valor)
    if (!descricao.trim() || quantidadeNum <= 0 || valorNum < 0) return

    onConfirm(descricao.trim(), quantidadeNum, valorNum)
    reset()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Item avulso</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          autoFocus
          fullWidth
        />
        <TextField
          label="Quantidade"
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          fullWidth
        />
        <TextField
          label="Valor unitário (R$)"
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
