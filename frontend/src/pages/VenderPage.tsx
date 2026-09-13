import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import { clientesApi } from '../api/clientes'
import { funcionariosApi } from '../api/funcionarios'
import { produtosApi } from '../api/produtos'
import { vendasApi } from '../api/vendas'
import type { Cliente } from '../types/Cliente'
import type { Funcionario } from '../types/Funcionario'
import type { Produto } from '../types/Produto'
import type { FormaPagamento, ItemCarrinho } from '../types/Venda'
import { formatMoney } from '../utils/format'
import { getErrorMessage } from '../utils/errors'
import { calcularDescontoItem, calcularTotalItem } from '../utils/carrinho'
import { BuscaProdutoModal } from '../components/BuscaProdutoModal'
import { ItemAvulsoDialog } from '../components/ItemAvulsoDialog'
import { EditarItemCarrinhoDialog } from '../components/EditarItemCarrinhoDialog'
import { NovoClienteDialog } from '../components/NovoClienteDialog'
import { perguntarEImprimir } from '../printing/perguntarEImprimir'

const CLIENTE_AVULSO_ID = 1
const PRODUTO_AVULSO_ID = 1

let proximaChave = 1

export function VenderPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro')
  const [informarValor, setInformarValor] = useState<'sim' | 'nao'>('sim')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [funcionarioId, setFuncionarioId] = useState<number | ''>('')

  const [codigoBarras, setCodigoBarras] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [chaveEditando, setChaveEditando] = useState<string | null>(null)

  const [buscaAberta, setBuscaAberta] = useState(false)
  const [buscaTermo, setBuscaTermo] = useState('')
  const [buscaResultados, setBuscaResultados] = useState<Produto[]>([])
  const [buscaLoading, setBuscaLoading] = useState(false)

  const [itemAvulsoAberto, setItemAvulsoAberto] = useState(false)
  const [novoClienteAberto, setNovoClienteAberto] = useState(false)

  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [finalizando, setFinalizando] = useState(false)

  const codigoBarrasRef = useRef<HTMLInputElement>(null)

  // Começa sem cliente selecionado de propósito: se já viesse preenchido, é
  // fácil esquecer de trocar e lançar a venda no cliente errado.
  useEffect(() => {
    clientesApi.getAll().then(setClientes)
    funcionariosApi.getAll().then(setFuncionarios)
  }, [])

  const clienteAvulso = clientes.find((c) => c.clientesId === CLIENTE_AVULSO_ID) ?? null

  const adicionarAoCarrinho = (produto: Produto, qtd: number) => {
    setCarrinho((prev) => {
      const existente = prev.find((item) => item.produtosId === produto.produtosId)
      if (existente) {
        return prev.map((item) =>
          item.chave === existente.chave ? { ...item, quantidade: item.quantidade + qtd } : item,
        )
      }
      return [
        ...prev,
        {
          chave: String(proximaChave++),
          produtosId: produto.produtosId,
          descricao: produto.descricao ?? '',
          codigoProduto: produto.codigoProduto,
          quantidade: qtd,
          precoUnitario: produto.precoVenda ?? 0,
          descontoTipo: 'nenhum',
          descontoValor: 0,
        },
      ]
    })
  }

  const adicionarItemAvulso = (descricao: string, qtd: number, valor: number) => {
    setCarrinho((prev) => [
      ...prev,
      {
        chave: String(proximaChave++),
        produtosId: PRODUTO_AVULSO_ID,
        descricao,
        codigoProduto: null,
        quantidade: qtd,
        precoUnitario: valor,
        descontoTipo: 'nenhum',
        descontoValor: 0,
      },
    ])
    setItemAvulsoAberto(false)
  }

  const removerDoCarrinho = (chave: string) => {
    setCarrinho((prev) => prev.filter((item) => item.chave !== chave))
  }

  const salvarEdicaoItem = (chave: string, alteracoes: Partial<ItemCarrinho>) => {
    setCarrinho((prev) => prev.map((item) => (item.chave === chave ? { ...item, ...alteracoes } : item)))
    setChaveEditando(null)
  }

  const itemEmEdicao = carrinho.find((item) => item.chave === chaveEditando) ?? null

  const handleClienteCriado = (cliente: Cliente) => {
    setClientes((prev) => [...prev, cliente])
    setClienteSelecionado(cliente)
    setNovoClienteAberto(false)
  }

  const handleCodigoBarrasKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const termo = codigoBarras.trim()
    if (!termo) return

    const qtd = Math.max(1, Number(quantidade) || 1)

    const porCodigoBarras = await produtosApi.buscarPorCodigoBarras(termo)
    if (porCodigoBarras) {
      adicionarAoCarrinho(porCodigoBarras, qtd)
      setCodigoBarras('')
      setQuantidade('1')
      codigoBarrasRef.current?.focus()
      return
    }

    setBuscaLoading(true)
    setBuscaTermo(termo)
    setBuscaAberta(true)
    try {
      const resultados = await produtosApi.buscarPorNome(termo)
      setBuscaResultados(resultados)
    } finally {
      setBuscaLoading(false)
    }
  }

  const handleSelecionarBusca = (produto: Produto) => {
    const qtd = Math.max(1, Number(quantidade) || 1)
    adicionarAoCarrinho(produto, qtd)
    setBuscaAberta(false)
    setCodigoBarras('')
    setQuantidade('1')
    codigoBarrasRef.current?.focus()
  }

  const total = carrinho.reduce((soma, item) => soma + calcularTotalItem(item), 0)
  const descontoTotalGeral = carrinho.reduce((soma, item) => soma + calcularDescontoItem(item), 0)

  const finalizarVenda = async () => {
    setErro(null)

    if (!clienteSelecionado) {
      setErro('Selecione um cliente.')
      return
    }
    if (!funcionarioId) {
      setErro('Selecione um funcionário.')
      return
    }
    if (carrinho.length === 0) {
      setErro('Adicione ao menos um produto à venda.')
      return
    }

    setFinalizando(true)
    try {
      const resultado = await vendasApi.criar({
        clientesId: clienteSelecionado.clientesId,
        funcionariosId: Number(funcionarioId),
        formaPagamento,
        descontoTotal: descontoTotalGeral,
        itens: carrinho.map((item) => ({
          produtosId: item.produtosId,
          descricaoAvulso: item.produtosId === PRODUTO_AVULSO_ID ? item.descricao : undefined,
          quantidade: item.quantidade,
          // Preço unitário já líquido de desconto, para o total gravado
          // (quantidade * precoUnitario) bater com o valor cobrado de fato.
          precoUnitario: calcularTotalItem(item) / item.quantidade,
        })),
      })

      setSucesso(`Venda registrada (movimento #${resultado.movimentosId}) — total ${formatMoney(resultado.valorTotal)}.`)
      setCarrinho([])
      setClienteSelecionado(null)
      setFuncionarioId('')
      setFormaPagamento('dinheiro')

      await perguntarEImprimir(resultado.movimentosId, informarValor === 'sim')
      setInformarValor('sim')
    } catch (err) {
      setErro(getErrorMessage(err, 'Não foi possível finalizar a venda.'))
    } finally {
      setFinalizando(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Vender
      </Typography>

      {erro && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Paper sx={{ p: 2, flex: '1 1 220px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Forma de pagamento
          </Typography>
          <RadioGroup
            row
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
          >
            <FormControlLabel value="dinheiro" control={<Radio />} label="Dinheiro" />
            <FormControlLabel value="marcar" control={<Radio />} label="Marcar" />
          </RadioGroup>
        </Paper>

        <Paper sx={{ p: 2, flex: '1 1 220px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Informar valor
          </Typography>
          <RadioGroup
            row
            value={informarValor}
            onChange={(e) => setInformarValor(e.target.value as 'sim' | 'nao')}
          >
            <FormControlLabel value="sim" control={<Radio />} label="Sim" />
            <FormControlLabel value="nao" control={<Radio />} label="Não" />
          </RadioGroup>
          <Typography variant="caption" color="text.secondary">
            Define se os valores saem impressos no cupom.
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: '2 1 320px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Cliente
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Autocomplete
              options={clientes}
              getOptionLabel={(c) => c.nome ?? ''}
              isOptionEqualToValue={(a, b) => a.clientesId === b.clientesId}
              value={clienteSelecionado}
              onChange={(_, value) => setClienteSelecionado(value)}
              renderInput={(params) => <TextField {...params} placeholder="Buscar cliente cadastrado..." />}
              sx={{ flexGrow: 1, minWidth: 0 }}
              size="small"
            />
            <Chip
              label="Avulso"
              onClick={() => setClienteSelecionado(clienteAvulso)}
              color={clienteSelecionado?.clientesId === CLIENTE_AVULSO_ID ? 'primary' : 'default'}
              variant={clienteSelecionado?.clientesId === CLIENTE_AVULSO_ID ? 'filled' : 'outlined'}
            />
            <IconButton
              size="small"
              onClick={() => setNovoClienteAberto(true)}
              aria-label="novo cliente"
              title="Cadastrar novo cliente"
            >
              <PersonAddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, flex: '1 1 220px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Funcionário
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="funcionario-label">Funcionário</InputLabel>
            <Select
              labelId="funcionario-label"
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
        </Paper>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Produtos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Qtd."
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                codigoBarrasRef.current?.focus()
              }
            }}
            size="small"
            sx={{ width: 100 }}
          />
          <TextField
            inputRef={codigoBarrasRef}
            label="Código de barras ou nome do produto"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            onKeyDown={handleCodigoBarrasKeyDown}
            size="small"
            sx={{ flexGrow: 1, minWidth: 180 }}
            autoFocus
          />
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setItemAvulsoAberto(true)}>
            Item avulso
          </Button>
        </Box>

        <TableContainer>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell>Código</TableCell>
                <TableCell align="right">Qtd.</TableCell>
                <TableCell align="right">Unitário</TableCell>
                <TableCell align="right">Desconto</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carrinho.map((item) => {
                const desconto = calcularDescontoItem(item)
                return (
                  <TableRow key={item.chave}>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell>{item.codigoProduto ?? '-'}</TableCell>
                    <TableCell align="right">{item.quantidade}</TableCell>
                    <TableCell align="right">{formatMoney(item.precoUnitario)}</TableCell>
                    <TableCell align="right">{desconto > 0 ? `-${formatMoney(desconto)}` : '-'}</TableCell>
                    <TableCell align="right">{formatMoney(calcularTotalItem(item))}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setChaveEditando(item.chave)} aria-label="editar item">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => removerDoCarrinho(item.chave)} aria-label="remover">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
              {carrinho.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhum produto adicionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        {descontoTotalGeral > 0 && (
          <Typography variant="body2" color="text.secondary">
            Desconto total: -{formatMoney(descontoTotalGeral)}
          </Typography>
        )}
        <Typography variant="h6">Total: {formatMoney(total)}</Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PointOfSaleIcon />}
          onClick={finalizarVenda}
          disabled={finalizando}
        >
          Finalizar Venda
        </Button>
      </Box>

      <BuscaProdutoModal
        open={buscaAberta}
        termo={buscaTermo}
        resultados={buscaResultados}
        loading={buscaLoading}
        onClose={() => setBuscaAberta(false)}
        onSelect={handleSelecionarBusca}
      />

      <ItemAvulsoDialog
        open={itemAvulsoAberto}
        onClose={() => setItemAvulsoAberto(false)}
        onConfirm={adicionarItemAvulso}
      />

      <EditarItemCarrinhoDialog
        item={itemEmEdicao}
        onClose={() => setChaveEditando(null)}
        onConfirmar={salvarEdicaoItem}
      />

      <NovoClienteDialog
        open={novoClienteAberto}
        onClose={() => setNovoClienteAberto(false)}
        onCriado={handleClienteCriado}
      />

      <Snackbar open={sucesso !== null} autoHideDuration={5000} onClose={() => setSucesso(null)}>
        <Alert severity="success" onClose={() => setSucesso(null)}>
          {sucesso}
        </Alert>
      </Snackbar>
    </Box>
  )
}
