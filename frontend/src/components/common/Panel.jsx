/**
 * Panel — Standard dashboard section container.
 *
 * Glassmorphism surface + labelled header (eyebrow + optional right slot).
 * Content area flexes and can scroll internally (SCADA panels never grow
 * the page). Reusable across the whole control room.
 */
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../utils/constants';

export default function Panel({
  title,
  icon,
  accent = COLORS.accent.cyan,
  right,
  children,
  dense = false,
  scroll = false,
  sx = {},
  bodySx = {},
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        borderRadius: 2,
        backgroundColor: `${COLORS.bg.card}F2`,
        border: `1px solid ${COLORS.border.default}`,
        overflow: 'hidden',
        ...sx,
      }}
    >
      {title && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.75,
            py: 1.1,
            borderBottom: `1px solid ${COLORS.border.subtle}`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {icon && (
              <Box sx={{ color: accent, display: 'flex', fontSize: 16 }}>{icon}</Box>
            )}
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
                color: COLORS.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </Typography>
          </Box>
          {right}
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          p: dense ? 1.25 : 1.75,
          overflowY: scroll ? 'auto' : 'hidden',
          overflowX: 'hidden',
          ...bodySx,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
