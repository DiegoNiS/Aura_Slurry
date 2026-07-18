/**
 * AlertsPanelContent — scrollable alert log (FAILURE / WARNING events).
 */
import { Box, Typography, Chip, IconButton, Tooltip, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import dayjs from 'dayjs';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, STATUS } from '../../utils/constants';
import { PanelBody } from '../common/PanelBits';

const MotionBox = motion.create(Box);

function severity(status) {
  if (status === STATUS.FAILURE) return { icon: <ErrorIcon sx={{ fontSize: 16 }} />, color: COLORS.status.critical, label: 'CRÍTICO' };
  if (status === STATUS.WARNING) return { icon: <WarningAmberIcon sx={{ fontSize: 16 }} />, color: COLORS.status.warning, label: 'ADVERTENCIA' };
  return { icon: <InfoOutlinedIcon sx={{ fontSize: 16 }} />, color: COLORS.accent.blue, label: 'INFO' };
}

export default function AlertsPanelContent() {
  const alerts = usePumpStore((s) => s.alerts);
  const clearAlerts = usePumpStore((s) => s.clearAlerts);

  return (
    <PanelBody sx={{ gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.secondary }}>
            {alerts.length} evento{alerts.length === 1 ? '' : 's'} registrado{alerts.length === 1 ? '' : 's'}
          </Typography>
        </Box>
        {alerts.length > 0 && (
          <Tooltip title="Limpiar registro" arrow>
            <IconButton size="small" onClick={clearAlerts}>
              <DeleteSweepIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <AnimatePresence>
          {alerts.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.muted }}>
                Sin alertas — sistema operando normalmente
              </Typography>
            </Box>
          ) : (
            alerts.slice(0, 40).map((a, i) => {
              const s = severity(a.status);
              return (
                <MotionBox
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    p: 1,
                    borderRadius: 1,
                    borderLeft: `3px solid ${s.color}`,
                    backgroundColor: a.status === STATUS.FAILURE ? `${COLORS.status.critical}0C` : `${COLORS.bg.surface}80`,
                  }}
                >
                  <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                  <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.7rem', fontWeight: 600, color: COLORS.text.muted, minWidth: 58 }}>
                    {dayjs(a.timestamp).format('HH:mm:ss')}
                  </Typography>
                  <Typography sx={{ flex: 1, fontSize: '0.74rem', color: COLORS.text.primary }}>{a.message}</Typography>
                  <Chip label={s.label} size="small" sx={{ backgroundColor: `${s.color}22`, color: s.color, fontWeight: 700, fontSize: '0.55rem', height: 18 }} />
                </MotionBox>
              );
            })
          )}
        </AnimatePresence>
      </Box>

      {alerts.length > 0 && (
        <Button size="small" onClick={clearAlerts} startIcon={<DeleteSweepIcon />} sx={{ mt: 1, color: COLORS.text.muted, alignSelf: 'flex-start', '&:hover': { color: COLORS.status.critical } }}>
          Limpiar todo
        </Button>
      )}
    </PanelBody>
  );
}
