import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { theme } from './theme'
import { Layout } from './layout/Layout'
import { Home } from './pages/Home'
import { ClientesPage } from './pages/ClientesPage'
import { FuncionariosPage } from './pages/FuncionariosPage'
import { ProdutosPage } from './pages/ProdutosPage'
import { VenderPage } from './pages/VenderPage'
import { MovimentacaoPage } from './pages/MovimentacaoPage'
import { ContasAReceberPage } from './pages/ContasAReceberPage'
import { CobrancaPage } from './pages/CobrancaPage'
import { FechamentoCaixaPage } from './pages/FechamentoCaixaPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="funcionarios" element={<FuncionariosPage />} />
            <Route path="produtos" element={<ProdutosPage />} />
            <Route path="vender" element={<VenderPage />} />
            <Route path="movimentacao" element={<MovimentacaoPage />} />
            <Route path="contas-a-receber" element={<ContasAReceberPage />} />
            <Route path="cobranca" element={<CobrancaPage />} />
            <Route path="fechamento-caixa" element={<FechamentoCaixaPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
