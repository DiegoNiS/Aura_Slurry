/**
 * SensorsPanelContent — per-sensor detail.
 * The acoustic mic is the real sensor (16 kHz mono); the rest are
 * placeholders showing how additional IIoT channels will slot in.
 */
import { Box, Typography, Chip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import VibrationIcon from '@mui/icons-material/Vibration';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SpeedIcon from '@mui/icons-material/Speed';
import useSignalStore from '../../stores/useSignalStore';
import { COLORS, AUDIO_CONFIG } from '../../utils/constants';
import { PanelBody } from '../common/PanelBits';

function SensorRow({ icon, name, value, unit, ok = true, live = false, note }) {
  const color = ok ? COLORS.status.normal : COLORS.status.warning;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 1.5, backgroundColor: `${COLORS.bg.surface}80`, border: `1px solid ${COLORS.border.subtle}` }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${COLORS.accent.cyan}12`, color: COLORS.accent.cyan }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: COLORS.text.primary }}>{name}</Typography>
        <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted }}>{note}</Typography>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '1rem', fontWeight: 700, color: COLORS.text.primary }}>
          {value} <span style={{ fontSize: '0.6em', color: COLORS.text.muted }}>{unit}</span>
        </Typography>
        <Chip label={live ? 'EN VIVO' : ok ? 'OK' : 'PENDIENTE'} size="small" sx={{ height: 15, fontSize: '0.5rem', fontWeight: 700, backgroundColor: `${live ? COLORS.status.critical : color}1E`, color: live ? COLORS.status.critical : color }} />
      </Box>
    </Box>
  );
}

export default function SensorsPanelContent() {
  const db = useSignalStore((s) => s.db);
  const dominantFreq = useSignalStore((s) => s.dominantFreq);

  return (
    <PanelBody sx={{ gap: 1 }}>
      <SensorRow icon={<MicIcon sx={{ fontSize: 18 }} />} name="Micrófono acústico" value={db} unit="dB" live note={`PCM ${AUDIO_CONFIG.sampleRate / 1000} kHz · mono · f₀ ${dominantFreq} Hz`} />
      <SensorRow icon={<VibrationIcon sx={{ fontSize: 18 }} />} name="Acelerómetro (vibración)" value="—" unit="mm/s" ok={false} note="Canal IIoT futuro · rodamiento" />
      <SensorRow icon={<ThermostatIcon sx={{ fontSize: 18 }} />} name="Temperatura carcasa" value="—" unit="°C" ok={false} note="Canal IIoT futuro · sello mecánico" />
      <SensorRow icon={<WaterDropIcon sx={{ fontSize: 18 }} />} name="Caudal de pulpa" value="—" unit="m³/h" ok={false} note="Canal IIoT futuro · descarga" />
      <SensorRow icon={<SpeedIcon sx={{ fontSize: 18 }} />} name="Velocidad de eje" value="—" unit="rpm" ok={false} note="Canal IIoT futuro · motor" />
      <Typography sx={{ fontSize: '0.62rem', color: COLORS.text.muted, mt: 0.5, lineHeight: 1.6 }}>
        La arquitectura de sensores es extensible: cada canal nuevo se registra como una fila y alimenta el mismo pipeline de fusión.
      </Typography>
    </PanelBody>
  );
}
