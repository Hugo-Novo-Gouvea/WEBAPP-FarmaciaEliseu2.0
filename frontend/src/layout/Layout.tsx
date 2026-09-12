import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Toolbar, Typography } from '@mui/material'
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

export function Layout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundImage: 'linear-gradient(165deg, #D14747 0%, #BD2828 35%, #7E1B1B 100%)',
            color: 'primary.contrastText',
            border: 'none',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Farmácia do Eliseu
          </Typography>
        </Toolbar>
        <List>
          <ListItemButton component={NavLink} to={homeItem.to} end sx={navItemSx}>
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
              <ListItemButton key={item.to} component={NavLink} to={item.to} sx={navItemSx}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        ))}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
