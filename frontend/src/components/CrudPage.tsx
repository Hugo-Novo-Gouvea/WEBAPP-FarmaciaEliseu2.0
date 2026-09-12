import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { getErrorMessage } from '../utils/errors'

type FieldType = 'text' | 'number' | 'date'

export interface FieldConfig<TInput> {
  key: keyof TInput
  label: string
  type: FieldType
  required?: boolean
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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

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
    setDialogOpen(true)
  }

  const openEdit = (item: T) => {
    setEditingId(Number(item[idKey]))
    setFormValues(toInput(item))
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
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
            sx={{ flexGrow: 1, maxWidth: 320 }}
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
        <Table size="small">
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
              <TableRow key={String(item[idKey])}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.format ? col.format(item[col.key]) : String(item[col.key] ?? '')}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(item)} aria-label="editar">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(item)} aria-label="excluir">
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

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingId === null ? `Novo registro` : `Editar registro`}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
