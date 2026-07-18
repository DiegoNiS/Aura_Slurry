/**
 * MaintenancePanelContent — maintenance history timeline (sample records).
 * Static demo data today; ready to be fed from a CMMS / backend endpoint.
 */
import { Box, Typography, Chip } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import { COLORS } from '../../utils/constants';
import { PanelBody, SectionLabel, Field } from '../common/PanelBits';

const RECORDS = [
  { date: '2026-07-02', type: 'Preventivo', color: COLORS.status.normal, title: 'Cambio de sello mecánico', tech: 'J. Quispe', note: 'Sello y camisa reemplazados. Torque verificado.' },
  { date: '2026-06-15', type: 'Inspección', color: COLORS.accent.blue, title: 'Análisis de vibración', tech: 'M. Flores', note: 'Rodamiento lado motor con desgaste incipiente.' },
  { date: '2026-05-28', type: 'Correctivo', color: COLORS.status.warning, title: 'Ajuste de impulsor', tech: 'J. Quispe', note: 'Holgura de impulsor recalibrada por cavitación leve.' },
  { date: '2026-04-10', type: 'Preventivo', color: COLORS.status.normal, title: 'Engrase de rodamientos', tech: 'A. Mamani', note: 'Lubricación programada. Sin observaciones.' },
];

export default function MaintenancePanelContent() {
  return (
    <PanelBody>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        <Field label="MTBF" value="128 d" mono />
        <Field label="Últ. servicio" value="16 d" mono />
        <Field label="Próximo" value="14 d" mono color={COLORS.status.warning} />
      </Box>

      <Box>
        <SectionLabel>Historial de intervenciones</SectionLabel>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {RECORDS.map((r, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.25, p: 1.25, borderRadius: 1.5, backgroundColor: `${COLORS.bg.surface}80`, border: `1px solid ${COLORS.border.subtle}`, borderLeft: `3px solid ${r.color}` }}>
              <Box sx={{ width: 30, height: 30, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${r.color}15`, color: r.color, flexShrink: 0 }}>
                <BuildIcon sx={{ fontSize: 15 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: COLORS.text.primary }}>{r.title}</Typography>
                  <Chip label={r.type} size="small" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, backgroundColor: `${r.color}1E`, color: r.color }} />
                </Box>
                <Typography sx={{ fontSize: '0.64rem', color: COLORS.text.secondary, mt: 0.25 }}>{r.note}</Typography>
                <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.6rem', color: COLORS.text.muted, mt: 0.25 }}>{r.date} · {r.tech}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </PanelBody>
  );
}
