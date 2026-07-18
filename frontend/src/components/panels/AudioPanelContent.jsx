/**
 * AudioPanelContent — capture chain configuration.
 * Contract params are fixed (16 kHz mono PCM); gain & device are tunable.
 */
import { useState } from 'react';
import { Box, Typography, Slider, Switch } from '@mui/material';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import useSignalStore from '../../stores/useSignalStore';
import { COLORS, AUDIO_CONFIG } from '../../utils/constants';
import { PanelBody, SectionLabel, Field } from '../common/PanelBits';
import WaveformChart from '../signal/WaveformChart';

export default function AudioPanelContent() {
  const [gain, setGain] = useState(60);
  const db = useSignalStore((s) => s.db);

  return (
    <PanelBody>
      <Box sx={{ borderRadius: 1.5, border: `1px solid ${COLORS.border.subtle}`, p: 1, backgroundColor: '#080B10' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <GraphicEqIcon sx={{ fontSize: 15, color: COLORS.accent.cyan }} />
          <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monitor de entrada</Typography>
        </Box>
        <WaveformChart height={70} />
      </Box>

      <Box>
        <SectionLabel>Contrato de captura (fijo)</SectionLabel>
        <Field label="Frecuencia de muestreo" value={`${AUDIO_CONFIG.sampleRate / 1000} kHz`} mono />
        <Field label="Canales" value="Mono (1)" mono />
        <Field label="Formato" value="PCM Int16" mono />
        <Field label="Tamaño de chunk" value={`${AUDIO_CONFIG.chunkDuration * 1000} ms`} mono />
        <Field label="Ventana de análisis" value="1.0 s" mono />
        <Field label="Nivel actual" value={`${db} dB`} mono color={COLORS.accent.cyan} />
      </Box>

      <Box>
        <SectionLabel>Ganancia de entrada</SectionLabel>
        <Box sx={{ px: 1, mt: 0.5 }}>
          <Slider value={gain} onChange={(_, v) => setGain(v)} min={0} max={100} size="small" sx={{ color: COLORS.accent.cyan }} valueLabelDisplay="auto" />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.74rem', color: COLORS.text.secondary }}>Cancelación de eco / AGC</Typography>
        <Switch size="small" />
      </Box>
      <Typography sx={{ fontSize: '0.62rem', color: COLORS.text.muted, lineHeight: 1.6 }}>
        AGC y supresión de ruido del navegador se mantienen <strong>desactivados</strong> para no alterar la firma acústica antes del modelo.
      </Typography>
    </PanelBody>
  );
}
