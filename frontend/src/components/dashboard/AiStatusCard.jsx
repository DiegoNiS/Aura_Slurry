/**
 * AiStatusCard — compact live view of the inference engine.
 * Model, confidence, last inference latency, prediction, risk, anomaly.
 * Opens the full "Configuración de IA" panel on click.
 */
import { Box, Typography, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CircleIcon from '@mui/icons-material/Circle';
import usePumpStore from '../../stores/usePumpStore';
import useSignalStore from '../../stores/useSignalStore';
import useUiStore from '../../stores/useUiStore';
import { COLORS, STATUS_COLOR_MAP, STATUS, PANEL_IDS } from '../../utils/constants';
import AnimatedNumber from '../common/AnimatedNumber';

function Row({ label, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.3 }}>
      <Typography sx={{ fontSize: '0.64rem', color: COLORS.text.muted, letterSpacing: '0.04em' }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{children}</Box>
    </Box>
  );
}

export default function AiStatusCard() {
  const status = usePumpStore((s) => s.status);
  const confidence = usePumpStore((s) => s.confidence);
  const lastInferenceMs = usePumpStore((s) => s.lastInferenceMs);
  const modelLoaded = usePumpStore((s) => s.modelLoaded);
  const modelName = usePumpStore((s) => s.modelName);
  const anomalyScore = useSignalStore((s) => s.anomalyScore);
  const openPanel = useUiStore((s) => s.openPanel);

  const info = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[STATUS.NORMAL];

  return (
    <Box
      onClick={() => openPanel(PANEL_IDS.AI)}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        transition: 'opacity 0.2s ease',
        '&:hover': { opacity: 0.92 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PsychologyIcon sx={{ fontSize: 16, color: COLORS.accent.purple }} />
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: COLORS.text.secondary, textTransform: 'uppercase' }}>
            Motor de Inferencia
          </Typography>
        </Box>
        <Tooltip title={modelLoaded ? 'Modelo cargado' : 'Modelo no disponible'} arrow>
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ display: 'flex' }}>
            <CircleIcon sx={{ fontSize: 9, color: modelLoaded ? COLORS.status.normal : COLORS.status.critical }} />
          </motion.div>
        </Tooltip>
      </Box>

      <Row label="Modelo">
        <Typography sx={{ fontSize: '0.66rem', color: COLORS.text.primary, fontWeight: 600 }}>{modelName}</Typography>
      </Row>
      <Row label="Predicción">
        <Typography sx={{ fontSize: '0.72rem', color: info.main, fontWeight: 700, fontFamily: '"Rajdhani", monospace', letterSpacing: '0.04em' }}>
          {info.label.toUpperCase()}
        </Typography>
      </Row>
      <Row label="Probabilidad">
        <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.9rem', fontWeight: 700, color: COLORS.text.primary }}>
          <AnimatedNumber value={confidence * 100} />%
        </Typography>
      </Row>
      <Row label="Latencia">
        <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.9rem', fontWeight: 700, color: COLORS.accent.cyan }}>
          <AnimatedNumber value={lastInferenceMs} /> <span style={{ fontSize: '0.6em', color: COLORS.text.muted }}>ms</span>
        </Typography>
      </Row>
      <Row label="Anomalía">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: 96 }}>
          <Box sx={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.bg.surface, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${anomalyScore}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', backgroundColor: anomalyScore > 60 ? COLORS.status.critical : anomalyScore > 30 ? COLORS.status.warning : COLORS.status.normal }} />
          </Box>
          <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '0.7rem', fontWeight: 700, color: COLORS.text.secondary, minWidth: 22, textAlign: 'right' }}>
            {anomalyScore}
          </Typography>
        </Box>
      </Row>

    </Box>
  );
}
