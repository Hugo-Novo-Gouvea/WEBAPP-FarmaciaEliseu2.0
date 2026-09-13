import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import { getErrorMessage } from '../utils/errors'

type FieldType = 'text' | 'number' | 'date'

export interface FieldConfig<TInput> {
  key: keyof TInput
  label: string
  type: FieldType
  required?: boolean
  /** Só afeta a exibição na tela de detalhes, não o formulário de edição. */
  format?: (value: TInput[keyof TInput]) => string
}

export interface ColumnConfig<T> {
  key: keyof T
  label: string
  format?: (value: T[keyof T]) => string
}

export interface CrudApi<T, TInput> {
  getAll: () => Promise<T[]>
  create: (data: TInput) => Promise<T>
  update: (id: number, data: TInput) => Promise<T>
  remove: (id: number) => Promise<unknown>
}

interface CrudPageProps<T, TInput> {
  title: string
  idKey: keyof T
  columns: ColumnConfig<T>[]
  fields: FieldConfig<TInput>[]
  api: CrudApi<T, TInput>
  emptyInput: TInput
  toInput: (item: T) => TInput
  searchKey?: keyof T
}

export function CrudPage<T extends object, TInput extends object>({
  title,
  idKey,
  columns,
  fields,
  api,
  emptyInput,
  toInput,
  searchKey,
}: CrudPageProps<T, TInput>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formValues, setFormValues] = useState<TInput>(emptyInput)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [visualizando, setVisualizando] = useState<T | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getAll()
      setItems(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível carregar os dados.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setFormValues(emptyInput)
    setErroForm(null)
    setDialogOpen(true)
  }

  const openEdit = (item: T) => {
    setEditingId(Number(item[idKey]))
    setFormValues(toInput(item))
    setErroForm(null)
    setDialogOpen(true)
  }

  const closeDialog = () => setDialogOpen(false)

  const handleFieldChange = (key: keyof TInput, type: FieldType, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: type === 'number' ? (value === '' ? null : Number(value)) : value,
    }))
  }

  const handleSave = async () => {
    const faltando = fields
      .filter((field) => field.required)
      .filter((field) => {
        const valor = formValues[field.key]
        return valor === null || valor === undefined || String(valor).trim() === ''
      })

    if (faltando.length > 0) {
      setErroForm(`Preencha: ${faltando.map((f) => f.label).join(', ')}.`)
      return
    }
    setErroForm(null)

    setSaving(true)
    try {
      if (editingId === null) {
        await api.create(formValues)
      } else {
        await api.update(editingId, formValues)
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível salvar o registro.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: T) => {
    const confirmed = window.confirm('Deseja realmente excluir este registro?')
    if (!confirmed) return
    try {
      await api.remove(Number(item[idKey]))
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível excluir o registro.'))
    }
  }

  // Na tela de detalhes, reaproveita o format já declarado na coluna
  // equivalente (ex.: dinheiro) quando o próprio campo não declara um.
  const formatDaColuna = new Map(
    columns.filter((col) => col.format).map((col) => [String(col.key), col.format!]),
  )

  const valorExibido = (field: FieldConfig<TInput>, valor: TInput[keyof TInput]) => {
    if (valor === null || valor === undefined || valor === '') return '-'
    if (field.format) return field.format(valor)
    const formatColuna = formatDaColuna.get(String(field.key))
    return formatColuna ? formatColuna(valor as unknown as T[keyof T]) : String(valor)
  }

  const filteredItems = searchKey
    ? items.filter((item) =>
        String(item[searchKey] ?? '')
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : items

  const pagedItems = filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">{title}</Typography>
        {searchKey && (
          <TextField
            size="small"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            sx={{ flexGrow: 1, minWidth: 160, maxWidth: 320 }}
          />
        )}
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Novo
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={String(col.key)}>{col.label}</TableCell>
              ))}
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedItems.map((item) => (
              <TableRow
                key={String(item[idKey])}
                hover
                onClick={() => setVisualizando(item)}
                sx={{ cursor: 'pointer' }}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.format ? col.format(item[col.key]) : String(item[col.key] ?? '')}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(item)
                    }}
                    aria-label="editar"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item)
                    }}
                    aria-label="excluir"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredItems.length}
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

      <Dialog open={visualizando !== null} onClose={() => setVisualizando(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Detalhes
          <IconButton onClick={() => setVisualizando(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {visualizando && (
            <Grid container spacing={2}>
              {fields.map((field) => {
                const valores = toInput(visualizando)
                return (
                  <Grid key={String(field.key)} size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {field.label}
                    </Typography>
                    <Typography>{valorExibido(field, valores[field.key])}</Typography>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap' }}>
          <Button
            startIcon={<EditIcon />}
            onClick={() => {
              const item = visualizando!
              setVisualizando(null)
              openEdit(item)
            }}
          >
            Editar
          </Button>
          <Button variant="contained" onClick={() => setVisualizando(null)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingId === null ? `Novo registro` : `Editar registro`}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {erroForm && <Alert severity="warning">{erroForm}</Alert>}
          {fields.map((field) => (
            <TextField
              key={String(field.key)}
              label={field.label}
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              required={field.required}
              value={(formValues[field.key] ?? '') as string | number}
              onChange={(e) => handleFieldChange(field.key, field.type, e.target.value)}
              slotProps={field.type === 'date' ? { inputLabel: { shrink: true } } : undefined}
              fullWidth
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
