/**
 * ConnectionIndicator — WebSocket connection status badge
 *
 * Small dot + label showing real-time connection state.
 * Green = connected, red = disconnected, yellow = connecting.
 */
import { Box, Typography, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';

export default function ConnectionIndicator({ isConnected, label }) {
  const color = isConnected ? COLORS.status.normal : COLORS.status.critical;
  const statusText = isConnected ? 'Conectado' : 'Desconectado';

  return (
    <Tooltip title={`WebSocket: ${statusText}`} arrow>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          backgroundColor: `${color}10`,
          border: `1px solid ${color}30`,
          cursor: 'default',
        }}
      >
        <motion.div
          animate={{
            scale: isConnected ? [1, 1.3, 1] : 1,
            opacity: isConnected ? [0.7, 1, 0.7] : 0.5,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: isConnected ? `0 0 6px ${color}` : 'none',
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color,
            fontWeight: 600,
            fontSize: '0.625rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label || statusText}
        </Typography>
      </Box>
    </Tooltip>
  );
}
