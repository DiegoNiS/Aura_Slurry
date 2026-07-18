/**
 * StatusBar — bottom telemetry strip (SCADA footer).
 * Compact, always-visible readouts: input source, sample rate, latency,
 * dominant frequency, anomaly, uptime.
 */
import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import usePumpStore from '../../stores/usePumpStore';
import useSignalStore from '../../stores/useSignalStore';
import { COLORS, AUDIO_CONFIG, STATUS_COLOR_MAP, STATUS } from '../../utils/constants';

function Cell({ label, value, color = COLORS.text.secondary }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
      <Typography sx={{ fontSize: '0.56rem', color: COLORS.text.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.62rem', color, fontWeight: 700, fontFamily: '"Rajdhani", monospace', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function StatusBar() {
  const status = usePumpStore((s) => s.status);
  const inputMode = usePumpStore((s) => s.inputMode);
  const wsConnected = usePumpStore((s) => s.wsConnected);
  const latency = usePumpStore((s) => s.lastInferenceMs);
  const dominantFreq = useSignalStore((s) => s.dominantFreq);
  const anomalyScore = useSignalStore((s) => s.anomalyScore);
  const info = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[STATUS.NORMAL];

  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(Math.floor(uptime / 3600)).padStart(2, '0');
  const mm = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
  const ss = String(uptime % 60).padStart(2, '0');

  return (
    <Box
      sx={{
        height: 26,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        px: 2,
        overflowX: 'auto',
        backgroundColor: COLORS.bg.card,
        borderTop: `1px solid ${COLORS.border.default}`,
        zIndex: 30,
      }}
    >
      <Cell label="Fuente" value={inputMode === 'live' ? 'MIC 16kHz' : inputMode === 'file' ? 'WAV' : 'SIM'} color={COLORS.accent.cyan} />
      <Cell label="fs" value={`${AUDIO_CONFIG.sampleRate / 1000} kHz`} />
      <Cell label="Enlace" value={wsConnected ? 'ACTIVO' : 'RECONEXIÓN'} color={wsConnected ? COLORS.status.normal : COLORS.status.warning} />
      <Cell label="Inferencia" value={`${latency} ms`} color={COLORS.accent.blue} />
      <Cell label="f₀" value={`${dominantFreq} Hz`} />
      <Cell label="Anomalía" value={`${anomalyScore}%`} color={anomalyScore > 60 ? COLORS.status.critical : anomalyScore > 30 ? COLORS.status.warning : COLORS.status.normal} />
      <Box sx={{ flex: 1 }} />
      <Cell label="Estado" value={info.label.toUpperCase()} color={info.main} />
      <Cell label="Uptime" value={`${hh}:${mm}:${ss}`} />
    </Box>
  );
}
