import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'

interface StatCardProps {
  icon: ReactNode
  label: string
  valor: string
  legenda: string
}

export function StatCard({ icon, label, valor, legenda }: StatCardProps) {
  return (
    <Paper sx={{ p: 2.5, flex: '1 1 220px', display: 'flex', gap: 2, alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
          {valor}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {legenda}
        </Typography>
      </Box>
    </Paper>
  )
}
