import { createTheme } from '@mui/material/styles'

// Paleta de farmácia: vermelho escurecido, porém com mais saturação/brilho
// (não chapado), e branco suave (levemente quente, não branco puro), com
// texto em cinza-escuro em vez de preto puro para reduzir o contraste agressivo.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#BD2828',
      light: '#D14747',
      dark: '#7E1B1B',
      contrastText: '#FBF4F2',
    },
    secondary: {
      main: '#C9A9A0',
    },
    background: {
      default: '#FAF5F2',
      paper: '#FFFDFB',
    },
    text: {
      primary: '#3B2E2C',
      secondary: '#6E5C58',
    },
    divider: '#E7DAD5',
    error: {
      main: '#B3453E',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#BD2828',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F3E7E3',
        },
      },
    },
  },
})
