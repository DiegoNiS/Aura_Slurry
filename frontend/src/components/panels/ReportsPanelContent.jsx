/**
 * ReportsPanelContent — reportes de incidente generados por la IA hacia
 * la minera (feedback mentor). Se generan automáticamente cuando el
 * equipo supera el umbral de alertas sostenidas; si hay SMTP configurado
 * en el backend, también se envían por correo.
 */
import { useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MonitorIcon from '@mui/icons-material/Monitor';
import dayjs from 'dayjs';
import usePumpStore from '../../stores/usePumpStore';
import { getReports } from '../../services/api';
import { COLORS } from '../../utils/constants';
import { PanelBody } from '../common/PanelBits';
import auraBody from '../../assets/aura-body.png';

const MotionBox = motion.create(Box);

export default function ReportsPanelContent() {
  const reports = usePumpStore((s) => s.reports);
  const setReports = usePumpStore((s) => s.setReports);

  useEffect(() => {
    getReports()
      .then((data) => setReports(data.reports || []))
      .catch(() => {}); // backend offline — se muestran los del WS
  }, [setReports]);

  return (
    <PanelBody sx={{ gap: 1 }}>
      <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.secondary, lineHeight: 1.45 }}>
        Cuando un equipo supera el umbral de alertas sostenidas, AURI genera un
        reporte de incidente para la gerencia de mantenimiento de la minera
        {' '}(y lo envía por correo si el servicio está configurado).
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <AnimatePresence>
          {reports.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Box component="img" src={auraBody} alt="" sx={{ width: 56, opacity: 0.6, mb: 1 }} />
              <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.muted }}>
                Sin incidentes reportados — el equipo opera con normalidad.
              </Typography>
            </Box>
          ) : (
            reports.map((r, i) => (
              <MotionBox
                key={r.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                sx={{
                  borderRadius: 1.5,
                  border: `1px solid ${COLORS.border.default}`,
                  borderLeft: `3px solid ${COLORS.status.critical}`,
                  backgroundColor: `${COLORS.bg.surface}90`,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.75, borderBottom: `1px solid ${COLORS.border.subtle}` }}>
                  <Typography sx={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 700, color: COLORS.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.subject}
                  </Typography>
                  <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.66rem', color: COLORS.text.muted, flexShrink: 0 }}>
                    {dayjs(r.timestamp).format('HH:mm')}
                  </Typography>
                  <Chip
                    icon={r.emailed ? <MarkEmailReadIcon sx={{ fontSize: 13 }} /> : <MonitorIcon sx={{ fontSize: 13 }} />}
                    label={r.emailed ? 'ENVIADO' : 'DASHBOARD'}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.52rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      color: r.emailed ? COLORS.status.normal : COLORS.accent.blue,
                      backgroundColor: r.emailed ? `${COLORS.status.normal}18` : `${COLORS.accent.blue}18`,
                    }}
                  />
                </Box>
                <Typography sx={{ p: 1.25, fontSize: '0.72rem', color: COLORS.text.secondary, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {r.body}
                </Typography>
              </MotionBox>
            ))
          )}
        </AnimatePresence>
      </Box>
    </PanelBody>
  );
}
