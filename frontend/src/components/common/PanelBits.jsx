/**
 * PanelBits — small shared building blocks for floating-panel content.
 */
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../utils/constants';

export function PanelBody({ children, sx = {} }) {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
      {children}
    </Box>
  );
}

export function SectionLabel({ children }) {
  return (
    <Typography
      sx={{
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: COLORS.text.muted,
      }}
    >
      {children}
    </Typography>
  );
}

export function Field({ label, value, color = COLORS.text.primary, mono = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 0.85,
        borderBottom: `1px solid ${COLORS.border.subtle}`,
      }}
    >
      <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.secondary }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: mono ? '0.78rem' : '0.74rem',
          color,
          fontWeight: 600,
          fontFamily: mono ? '"Rajdhani", monospace' : 'inherit',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function Callout({ children, color = COLORS.accent.blue }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        backgroundColor: `${color}0F`,
        border: `1px solid ${color}33`,
      }}
    >
      <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.secondary, lineHeight: 1.6 }}>
        {children}
      </Typography>
    </Box>
  );
}
