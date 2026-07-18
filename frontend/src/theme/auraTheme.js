/**
 * Aura-Slurry — MUI Theme (Dark Industrial SCADA)
 *
 * Designed to evoke Siemens/ABB/Schneider control room aesthetics.
 * Typography: Inter (body) + Rajdhani (numerical displays/HMI).
 * No default MUI colors leak through — every surface is overridden.
 */
import { createTheme, alpha } from '@mui/material/styles';
import { COLORS } from '../utils/constants';

const auraTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.accent.cyan,
      light: '#4DD0E1',
      dark: '#0097A7',
      contrastText: '#0B0F14',
    },
    secondary: {
      main: COLORS.accent.purple,
      light: '#B388FF',
      dark: '#651FFF',
    },
    error: {
      main: COLORS.status.critical,
    },
    warning: {
      main: COLORS.status.warning,
    },
    success: {
      main: COLORS.status.normal,
    },
    info: {
      main: COLORS.accent.blue,
    },
    background: {
      default: COLORS.bg.primary,
      paper: COLORS.bg.card,
    },
    text: {
      primary: COLORS.text.primary,
      secondary: COLORS.text.secondary,
      disabled: COLORS.text.disabled,
    },
    divider: COLORS.border.default,
    action: {
      hover: alpha(COLORS.text.primary, 0.04),
      selected: alpha(COLORS.accent.cyan, 0.08),
      disabled: alpha(COLORS.text.primary, 0.26),
      disabledBackground: alpha(COLORS.text.primary, 0.12),
    },
  },

  typography: {
    fontFamily: '"Inter", "IBM Plex Sans", "Roboto", sans-serif',
    // HMI / numerical display font
    h1: {
      fontFamily: '"Rajdhani", "Share Tech Mono", monospace',
      fontWeight: 700,
      fontSize: '3.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
    },
    h2: {
      fontFamily: '"Rajdhani", monospace',
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Rajdhani", monospace',
      fontWeight: 600,
      fontSize: '2rem',
    },
    h4: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0.02em',
    },
    h5: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
    },
    h6: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '0.875rem',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
      color: COLORS.text.secondary,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: COLORS.text.muted,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.8125rem',
      color: COLORS.text.secondary,
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.6875rem',
      color: COLORS.text.muted,
      letterSpacing: '0.04em',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '0.8125rem',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    },
    // Custom variant for large numeric displays (gauge, health score)
    hmi: {
      fontFamily: '"Rajdhani", monospace',
      fontWeight: 700,
      fontSize: '4rem',
      lineHeight: 1,
      letterSpacing: '-0.02em',
    },
  },

  shape: {
    borderRadius: 8,
  },

  shadows: [
    'none',
    `0 1px 2px ${alpha('#000', 0.3)}`,
    `0 2px 4px ${alpha('#000', 0.3)}`,
    `0 4px 8px ${alpha('#000', 0.35)}`,
    `0 6px 12px ${alpha('#000', 0.35)}`,
    `0 8px 16px ${alpha('#000', 0.4)}`,
    `0 12px 24px ${alpha('#000', 0.4)}`,
    `0 16px 32px ${alpha('#000', 0.45)}`,
    `0 20px 40px ${alpha('#000', 0.45)}`,
    // rest filled with same deep shadow
    ...Array(16).fill(`0 24px 48px ${alpha('#000', 0.5)}`),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          backgroundColor: COLORS.bg.primary,
          backgroundImage: `radial-gradient(ellipse at 50% 0%, ${alpha(COLORS.accent.blue, 0.03)} 0%, transparent 60%)`,
          minHeight: '100vh',
        },
        '*::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: COLORS.border.default,
          borderRadius: 3,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: COLORS.border.hover,
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: COLORS.bg.card,
          border: `1px solid ${COLORS.border.default}`,
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: COLORS.bg.card,
          border: `1px solid ${COLORS.border.default}`,
          backgroundImage: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: COLORS.border.hover,
            boxShadow: `0 4px 20px ${alpha('#000', 0.3)}`,
          },
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: COLORS.border.default,
          '&:hover': {
            borderColor: COLORS.accent.cyan,
            backgroundColor: alpha(COLORS.accent.cyan, 0.06),
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.6875rem',
          letterSpacing: '0.05em',
          borderRadius: 4,
          height: 24,
        },
        outlined: {
          borderColor: COLORS.border.default,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLORS.bg.elevated,
          border: `1px solid ${COLORS.border.default}`,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 12px',
        },
        arrow: {
          color: COLORS.bg.elevated,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: COLORS.border.subtle,
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: COLORS.text.secondary,
          transition: 'color 0.2s ease, background-color 0.2s ease',
          '&:hover': {
            color: COLORS.text.primary,
            backgroundColor: alpha(COLORS.text.primary, 0.06),
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.border.subtle}`,
          padding: '10px 16px',
          fontSize: '0.8125rem',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.text.muted,
          backgroundColor: COLORS.bg.surface,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.bg.surface,
          border: `1px solid ${COLORS.border.default}`,
          backgroundImage: 'none',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.bg.surface,
          borderRadius: 4,
          height: 6,
        },
      },
    },
  },
});

export default auraTheme;
