/**
 * StatusSemaphore — pump status traffic light (hero indicator).
 * Active light pulses; FAILURE pulses aggressively; CALIBRATING shows a spinner.
 * Reads `status` (English wire contract) from the store.
 */
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import usePumpStore from '../../stores/usePumpStore';
import { STATUS, STATUS_COLOR_MAP, COLORS } from '../../utils/constants';

const LIGHT = 34;
const lights = [
  { status: STATUS.NORMAL, color: COLORS.status.normal },
  { status: STATUS.WARNING, color: COLORS.status.warning },
  { status: STATUS.FAILURE, color: COLORS.status.critical },
];

function Light({ color, active, critical }) {
  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.22, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: critical ? 0.7 : 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: LIGHT + 14,
              height: LIGHT + 14,
              borderRadius: '50%',
              boxShadow: `0 0 22px 6px ${color}`,
            }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={{
          backgroundColor: active ? color : 'rgba(255,255,255,0.05)',
          boxShadow: active ? `0 0 16px 3px ${color}, inset 0 -3px 9px rgba(0,0,0,0.35)` : 'inset 0 -3px 9px rgba(0,0,0,0.35)',
        }}
        transition={{ duration: 0.4 }}
        style={{
          width: LIGHT,
          height: LIGHT,
          borderRadius: '50%',
          border: `2px solid ${active ? color : 'rgba(255,255,255,0.09)'}`,
          zIndex: 1,
        }}
      />
    </Box>
  );
}

export default function StatusSemaphore() {
  const status = usePumpStore((s) => s.status);
  const isCalibrating = usePumpStore((s) => s.isCalibrating);
  const current = isCalibrating ? STATUS.CALIBRATING : status;
  const info = STATUS_COLOR_MAP[current];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          p: 1.5,
          borderRadius: 3,
          backgroundColor: 'rgba(0,0,0,0.4)',
          border: `1px solid ${COLORS.border.default}`,
        }}
      >
        <AnimatePresence>
          {isCalibrating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.55)',
                borderRadius: 12,
                zIndex: 5,
              }}
            >
              <CircularProgress size={30} sx={{ color: COLORS.status.calibrating }} />
            </motion.div>
          )}
        </AnimatePresence>
        {lights.map((l) => (
          <Light key={l.status} color={l.color} active={!isCalibrating && status === l.status} critical={l.status === STATUS.FAILURE} />
        ))}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Estado del activo
        </Typography>
        <motion.div key={current} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.1, color: info?.main, letterSpacing: '0.02em' }}>
            {info?.label?.toUpperCase()}
          </Typography>
        </motion.div>
        <Typography sx={{ fontSize: '0.66rem', color: COLORS.text.secondary, mt: 0.5, lineHeight: 1.4, maxWidth: 180 }}>
          {info?.description}
        </Typography>
      </Box>
    </Box>
  );
}
