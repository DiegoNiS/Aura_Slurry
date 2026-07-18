/**
 * FloatingPanel — Docked inspector window.
 *
 * Panels dock along the right edge, tiled side-by-side (position supplied
 * by PanelHost as `rightOffset`) so they never overlap each other and never
 * leave the viewport (useUiStore caps concurrency). Each spans the full
 * content height, slides in/out cleanly, and closes with × or Esc. The
 * focused panel sits on top; clicking any panel brings it forward.
 */
import { useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { COLORS } from '../../utils/constants';

const TOPBAR = 52;
const STATUSBAR = 26;
const MARGIN = 14;
const MOBILE_RAIL = 54; // barra de iconos inferior en móvil

export default function FloatingPanel({
  panel,
  icon,
  rightOffset = MARGIN,
  focused,
  onClose,
  onFocus,
  children,
}) {
  const width = panel.width || 440;
  // En móvil el panel es una hoja inferior a casi pantalla completa
  // (el tiling lateral de escritorio no cabe en un celular).
  const isMobile = useMediaQuery('(max-width:900px)');

  useEffect(() => {
    if (!focused) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(panel.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused, onClose, panel.id]);

  const desktopStyle = {
    top: TOPBAR + MARGIN,
    right: rightOffset,
    width,
    maxWidth: `calc(100vw - ${72 + MARGIN}px)`,
    height: `calc(100vh - ${TOPBAR + STATUSBAR + MARGIN * 2}px)`,
  };
  const mobileStyle = {
    bottom: MOBILE_RAIL + 6,
    left: 8,
    right: 8,
    width: 'auto',
    maxHeight: `calc(100vh - ${TOPBAR + MOBILE_RAIL + 20}px)`,
    height: '72vh',
  };

  return (
    <motion.div
      onPointerDown={() => onFocus(panel.id)}
      initial={isMobile ? { y: 40, opacity: 0 } : { x: 28, opacity: 0 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
      exit={isMobile ? { y: 40, opacity: 0 } : { x: 28, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      style={{
        position: 'fixed',
        ...(isMobile ? mobileStyle : desktopStyle),
        zIndex: focused ? 1400 : 1320,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 12,
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${COLORS.bg.elevated}FA, ${COLORS.bg.surface}FA)`,
        border: `1px solid ${focused ? `${COLORS.accent.cyan}66` : COLORS.border.default}`,
        boxShadow: focused
          ? `0 24px 70px rgba(0,0,0,0.62), 0 0 0 1px ${COLORS.accent.cyan}14`
          : '0 16px 44px rgba(0,0,0,0.52)',
      }}
    >
      {/* Title bar */}
      <Box
        onPointerDown={() => onFocus(panel.id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.75,
          py: 1.1,
          borderBottom: `1px solid ${COLORS.border.subtle}`,
          backgroundColor: `${COLORS.bg.card}CC`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {icon && <Box sx={{ color: COLORS.accent.cyan, display: 'flex', fontSize: 17 }}>{icon}</Box>}
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: COLORS.text.primary,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {panel.title}
          </Typography>
        </Box>
        <Tooltip title="Cerrar (Esc)" arrow>
          <IconButton size="small" onClick={() => onClose(panel.id)}>
            <CloseIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </Box>
    </motion.div>
  );
}
