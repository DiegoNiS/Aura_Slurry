/**
 * PredictionsPanelContent — live model output: predicted class, per-class
 * probabilities and a rolling list of recent inferences.
 */
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, STATUS, STATUS_COLOR_MAP, colorFromScore } from '../../utils/constants';
import { PanelBody, SectionLabel } from '../common/PanelBits';

// Synthesize a 3-class distribution from status + confidence (until the
// model streams full predict_proba). Sums to 1.
function distribution(status, confidence) {
  const rest = (1 - confidence) / 2;
  const base = { [STATUS.NORMAL]: rest, [STATUS.WARNING]: rest, [STATUS.FAILURE]: rest };
  base[status] = confidence;
  return base;
}

const CLASS_META = [
  { key: STATUS.NORMAL, label: 'Normal', color: COLORS.status.normal },
  { key: STATUS.WARNING, label: 'Advertencia', color: COLORS.status.warning },
  { key: STATUS.FAILURE, label: 'Falla', color: COLORS.status.critical },
];

export default function PredictionsPanelContent() {
  const status = usePumpStore((s) => s.status);
  const confidence = usePumpStore((s) => s.confidence);
  const history = usePumpStore((s) => s.healthHistory);
  const info = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[STATUS.NORMAL];
  const dist = distribution(status, confidence);

  const recent = [...history].slice(-8).reverse();

  return (
    <PanelBody>
      {/* current prediction */}
      <Box sx={{ p: 1.75, borderRadius: 1.5, backgroundColor: `${info.main}0F`, border: `1px solid ${info.main}33`, textAlign: 'center' }}>
        <SectionLabel>Predicción actual</SectionLabel>
        <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '1.8rem', fontWeight: 700, color: info.main, lineHeight: 1.2 }}>
          {info.label.toUpperCase()}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: COLORS.text.secondary }}>
          Probabilidad {Math.round(confidence * 100)}% · riesgo {info.risk}
        </Typography>
      </Box>

      {/* class probabilities */}
      <Box>
        <SectionLabel>Distribución de clases (predict_proba)</SectionLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          {CLASS_META.map((c) => {
            const p = dist[c.key] || 0;
            return (
              <Box key={c.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '0.68rem', color: COLORS.text.secondary, minWidth: 82 }}>{c.label}</Typography>
                <Box sx={{ flex: 1, height: 8, borderRadius: 1, backgroundColor: COLORS.bg.surface, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${p * 100}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}55` }} />
                </Box>
                <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.72rem', fontWeight: 700, color: c.color, minWidth: 38, textAlign: 'right' }}>
                  {Math.round(p * 100)}%
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* recent inferences */}
      <Box>
        <SectionLabel>Inferencias recientes</SectionLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
          {recent.map((h, i) => {
            const c = colorFromScore(h.value);
            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.6, borderBottom: `1px solid ${COLORS.border.subtle}` }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c, boxShadow: `0 0 6px ${c}` }} />
                <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.68rem', color: COLORS.text.muted, minWidth: 58 }}>
                  {dayjs(h.time).format('HH:mm:ss')}
                </Typography>
                <Typography sx={{ flex: 1, fontSize: '0.68rem', color: COLORS.text.secondary }}>{h.status}</Typography>
                <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.74rem', fontWeight: 700, color: c }}>{h.value}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </PanelBody>
  );
}
