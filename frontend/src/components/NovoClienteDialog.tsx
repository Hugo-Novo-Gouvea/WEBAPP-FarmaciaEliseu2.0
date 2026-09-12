import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { clientesApi } from '../api/clientes'
import type { Cliente } from '../types/Cliente'
import { getErrorMessage } from '../utils/errors'

interface NovoClienteDialogProps {
  open: boolean
  onClose: () => void
  onCriado: (cliente: Cliente) => void
}

export function NovoClienteDialog({ open, onClose, onCriado }: NovoClienteDialogProps) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [celular, setCelular] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cpf, setCpf] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const reset = () => {
    setNome('')
    setTelefone('')
    setCelular('')
    setEndereco('')
    setCpf('')
    setErro(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSalvar = async () => {
    if (!nome.trim()) {
      setErro('Informe o nome do cliente.')
      return
    }

    setSalvando(true)
    setErro(null)
    try {
      const cliente = await clientesApi.create({
        nome: nome.trim(),
        telefone: telefone || null,
        celular: celular || null,
        endereco: endereco || null,
        cpf: cpf || null,
      })
      onCriado(cliente)
      reset()
    } catch (err) {
      setErro(getErrorMessage(err, 'Não foi possível cadastrar o cliente.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Novo cliente</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {erro && <Alert severity="error">{erro}</Alert>}
        <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus fullWidth />
        <TextField label="Celular" value={celular} onChange={(e) => setCelular(e.target.value)} fullWidth />
        <TextField label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} fullWidth />
        <TextField label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} fullWidth />
        <TextField label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSalvar} disabled={salvando}>
          Cadastrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
