/**
 * NoisePanelContent — spectral-subtraction / noise-gate configuration.
 * Live spectrum monitor + calibration state + threshold controls.
 */
import { useState } from 'react';
import { Box, Typography, Slider, Switch } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import usePumpStore from '../../stores/usePumpStore';
import useSignalStore from '../../stores/useSignalStore';
import { COLORS } from '../../utils/constants';
import { PanelBody, SectionLabel, Field, Callout } from '../common/PanelBits';
import SpectrumChart from '../signal/SpectrumChart';

export default function NoisePanelContent() {
  const calibrated = usePumpStore((s) => s.calibrated);
  const noiseFloor = useSignalStore((s) => s.noiseFloor);
  const [threshold, setThreshold] = useState(-55);
  const [subtraction, setSubtraction] = useState(true);

  return (
    <PanelBody>
      <Box sx={{ borderRadius: 1.5, border: `1px solid ${COLORS.border.subtle}`, p: 1, backgroundColor: '#080B10' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <FilterAltIcon sx={{ fontSize: 15, color: COLORS.accent.purple }} />
          <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Espectro en vivo</Typography>
        </Box>
        <SpectrumChart height={90} />
      </Box>

      <Callout color={calibrated ? COLORS.status.normal : COLORS.status.warning}>
        {calibrated
          ? 'Perfil de ruido aplicado. La sustracción espectral está aislando la firma de la bomba del ruido de planta.'
          : 'Sin perfil de ruido. Calibra para habilitar la sustracción espectral y mejorar la relación señal/ruido.'}
      </Callout>

      <Box>
        <SectionLabel>Parámetros</SectionLabel>
        <Field label="Sustracción espectral" value={subtraction ? 'Activa' : 'Inactiva'} color={subtraction ? COLORS.status.normal : COLORS.text.muted} />
        <Field label="Ruido de fondo medido" value={`${noiseFloor} dB`} mono />
        <Field label="Umbral de gate" value={`${threshold} dB`} mono color={COLORS.accent.purple} />
      </Box>

      <Box>
        <SectionLabel>Umbral de gate (dB)</SectionLabel>
        <Box sx={{ px: 1, mt: 0.5 }}>
          <Slider value={threshold} onChange={(_, v) => setThreshold(v)} min={-80} max={-20} size="small" sx={{ color: COLORS.accent.purple }} valueLabelDisplay="auto" />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.74rem', color: COLORS.text.secondary }}>Habilitar sustracción espectral</Typography>
        <Switch checked={subtraction} onChange={(e) => setSubtraction(e.target.checked)} size="small" />
      </Box>
    </PanelBody>
  );
}
