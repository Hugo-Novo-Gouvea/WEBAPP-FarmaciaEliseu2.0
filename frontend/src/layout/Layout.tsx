import { useState } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import PeopleIcon from '@mui/icons-material/People'
import BadgeIcon from '@mui/icons-material/Badge'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { NavLink, Outlet } from 'react-router-dom'

const drawerWidth = 240

const homeItem = { to: '/', label: 'Início', icon: <HomeIcon /> }

const navGroups = [
  {
    title: 'Cadastros',
    items: [
      { to: '/clientes', label: 'Clientes', icon: <PeopleIcon /> },
      { to: '/funcionarios', label: 'Funcionários', icon: <BadgeIcon /> },
      { to: '/produtos', label: 'Produtos', icon: <Inventory2Icon /> },
    ],
  },
  {
    title: 'Vendas',
    items: [
      { to: '/vender', label: 'Vender', icon: <PointOfSaleIcon /> },
      { to: '/movimentacao', label: 'Movimentação', icon: <SwapHorizIcon /> },
      { to: '/contas-a-receber', label: 'Contas a Receber', icon: <RequestQuoteIcon /> },
      { to: '/cobranca', label: 'Cobrança', icon: <NotificationsActiveIcon /> },
      { to: '/fechamento-caixa', label: 'Fechamento de Caixa', icon: <AssessmentIcon /> },
    ],
  },
]

const navItemSx = {
  color: 'inherit',
  mx: 1,
  borderRadius: 1,
  '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 40, opacity: 0.85 },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  '&.active': {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
} as const

const drawerPaperSx = {
  width: drawerWidth,
  boxSizing: 'border-box',
  backgroundImage: 'linear-gradient(165deg, #D14747 0%, #BD2828 35%, #7E1B1B 100%)',
  color: 'primary.contrastText',
  border: 'none',
} as const

export function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = () => setMenuAberto(false)

  const conteudoMenu = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Farmácia do Eliseu
        </Typography>
      </Toolbar>
      <List>
        <ListItemButton component={NavLink} to={homeItem.to} end sx={navItemSx} onClick={fecharMenu}>
          <ListItemIcon>{homeItem.icon}</ListItemIcon>
          <ListItemText primary={homeItem.label} />
        </ListItemButton>
      </List>
      {navGroups.map((group) => (
        <List
          key={group.title}
          subheader={
            <ListSubheader
              component="div"
              sx={{
                backgroundColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '32px',
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {group.title}
            </ListSubheader>
          }
        >
          {group.items.map((item) => (
            <ListItemButton key={item.to} component={NavLink} to={item.to} sx={navItemSx} onClick={fecharMenu}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      ))}
    </>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ display: { xs: 'block', md: 'none' } }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMenuAberto(true)}
            aria-label="abrir menu"
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Farmácia do Eliseu
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={menuAberto}
        onClose={fecharMenu}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: drawerPaperSx,
        }}
      >
        {conteudoMenu}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: drawerPaperSx,
        }}
      >
        {conteudoMenu}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Sem isto o conteúdo (tabelas largas) estica o flex container em vez
          // de rolar dentro do próprio TableContainer, e a página inteira sai
          // maior que a tela no celular.
          minWidth: 0,
          p: { xs: 2, md: 3 },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />
        <Outlet />
      </Box>
    </Box>
  )
}
