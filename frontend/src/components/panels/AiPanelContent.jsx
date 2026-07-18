/**
 * AiPanelContent — inference engine status & configuration.
 * Model metadata, decision thresholds, live confidence gauge, and
 * (visual) toggles that the backend/model team can wire later.
 */
import { Box, Typography, Switch, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, THRESHOLDS, colorFromScore } from '../../utils/constants';
import { PanelBody, SectionLabel, Field } from '../common/PanelBits';
import RadialGauge from '../common/RadialGauge';
import auraBody from '../../assets/aura-body.png';

export default function AiPanelContent() {
  const modelName = usePumpStore((s) => s.modelName);
  const modelLoaded = usePumpStore((s) => s.modelLoaded);
  const confidence = usePumpStore((s) => s.confidence);
  const latency = usePumpStore((s) => s.lastInferenceMs);
  const healthScore = usePumpStore((s) => s.healthScore);
  const recommendation = usePumpStore((s) => s.recommendation);

  return (
    <PanelBody>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        <RadialGauge value={confidence * 100} unit="%" label="Confianza" color={colorFromScore(healthScore)} />
        <RadialGauge value={latency} max={200} unit="ms" label="Latencia" color={COLORS.accent.cyan} />
      </Box>

      <Box>
        <SectionLabel>AURI — asistente de confiabilidad (Gemini)</SectionLabel>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 0.5 }}>
          <Box
            component="img"
            src={auraBody}
            alt="AURI"
            sx={{ width: 72, flexShrink: 0, filter: 'drop-shadow(0 4px 10px rgba(53,198,244,0.3))' }}
          />
          <Typography sx={{ fontSize: '0.76rem', color: recommendation ? COLORS.text.primary : COLORS.text.muted, lineHeight: 1.45 }}>
            {recommendation || 'Aún no hay recomendación — se genera al cambiar el estado de la bomba.'}
          </Typography>
        </Box>
      </Box>

      <Box>
        <SectionLabel>Modelo</SectionLabel>
        <Field label="Arquitectura" value={modelName} />
        <Field label="Estado" value={modelLoaded ? 'Cargado' : 'No disponible'} color={modelLoaded ? COLORS.status.normal : COLORS.status.critical} />
        <Field label="Features" value="MFCC · n=20 (media+std)" mono />
        <Field label="Ventana" value="1.0 s @ 16 kHz" mono />
        <Field label="Dataset" value="MIMII · pump · ch.1" />
      </Box>

      <Box>
        <SectionLabel>Umbrales de decisión (p = prob. normal)</SectionLabel>
        <Field label="Normal" value={`p ≥ ${THRESHOLDS.NORMAL_MIN}`} color={COLORS.status.normal} mono />
        <Field label="Advertencia" value={`${THRESHOLDS.WARNING_MIN} ≤ p < ${THRESHOLDS.NORMAL_MIN}`} color={COLORS.status.warning} mono />
        <Field label="Falla" value={`p < ${THRESHOLDS.WARNING_MIN}`} color={COLORS.status.critical} mono />
      </Box>

      <Box>
        <SectionLabel>Ajustes</SectionLabel>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
          <Typography sx={{ fontSize: '0.74rem', color: COLORS.text.secondary }}>Inferencia en vivo</Typography>
          <Switch defaultChecked size="small" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
          <Typography sx={{ fontSize: '0.74rem', color: COLORS.text.secondary }}>Suavizado (media móvil 5)</Typography>
          <Switch defaultChecked size="small" />
        </Box>
      </Box>

      <Button variant="outlined" startIcon={<RefreshIcon />} size="small" sx={{ alignSelf: 'flex-start', borderColor: COLORS.border.default, color: COLORS.text.secondary }}>
        Recargar modelo
      </Button>
    </PanelBody>
  );
}
