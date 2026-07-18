/**
 * FleetView — dashboard general de la flota monitoreada.
 *
 * Arquitectura del producto: 1 micrófono instalado = 1 bomba monitoreada.
 * Esta vista lista todas las bombas con su estado en vivo; al hacer clic
 * se entra a la vista de detalle (ControlRoomLayout). Hoy hay una sola
 * bomba instalada — los slots punteados comunican la escalabilidad.
 */
import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import SensorsIcon from '@mui/icons-material/Sensors';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import usePumpStore from '../../stores/usePumpStore';
import useUiStore from '../../stores/useUiStore';
import useAuraWebSocket from '../../hooks/useAuraWebSocket';
import { COLORS, STATUS_COLOR_MAP, STATUS, MACHINE } from '../../utils/constants';
import BlueprintBackground from './BlueprintBackground';
import auraBody from '../../assets/aura-body.png';

const MotionBox = motion.create(Box);

function PumpCard({ onClick }) {
  const status = usePumpStore((s) => s.status);
  const healthScore = usePumpStore((s) => s.healthScore);
  const wsConnected = usePumpStore((s) => s.wsConnected);
  const info = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[STATUS.NORMAL];

  return (
    <MotionBox
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      sx={{
        cursor: 'pointer',
        width: 300,
        borderRadius: 2.5,
        border: `1px solid ${info.main}45`,
        backgroundColor: `${COLORS.bg.card}F2`,
        boxShadow: `0 10px 34px rgba(0,0,0,0.4), 0 0 22px ${info.main}18`,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.75, py: 1, borderBottom: `1px solid ${COLORS.border.subtle}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <SensorsIcon sx={{ fontSize: 15, color: COLORS.accent.cyan }} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: COLORS.text.primary }}>
            {MACHINE.id}
          </Typography>
        </Box>
        <Chip
          label={wsConnected ? '● EN LÍNEA' : '● SIN ENLACE'}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.52rem',
            fontWeight: 700,
            color: wsConnected ? COLORS.status.normal : COLORS.text.muted,
            backgroundColor: wsConnected ? `${COLORS.status.normal}16` : `${COLORS.text.muted}14`,
          }}
        />
      </Box>

      <Box sx={{ p: 1.75, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        {/* estado dominante */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${info.main}`,
            boxShadow: `0 0 18px ${info.main}55, inset 0 0 12px ${info.main}22`,
          }}
        >
          <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontWeight: 700, fontSize: '1.35rem', lineHeight: 1, color: info.main }}>
            {healthScore}
          </Typography>
          <Typography sx={{ fontSize: '0.42rem', color: COLORS.text.muted, letterSpacing: '0.1em' }}>HEALTH</Typography>
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: COLORS.text.primary, lineHeight: 1.2 }}>
            {MACHINE.name}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: COLORS.text.muted, mb: 0.5 }}>
            {MACHINE.model} · {MACHINE.line}
          </Typography>
          <Chip
            icon={<MonitorHeartIcon sx={{ fontSize: 12 }} />}
            label={info.label.toUpperCase()}
            size="small"
            sx={{ height: 20, fontSize: '0.56rem', fontWeight: 700, color: info.main, backgroundColor: `${info.main}1A`, border: `1px solid ${info.main}40` }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, px: 1.75, py: 0.75, borderTop: `1px solid ${COLORS.border.subtle}`, color: COLORS.accent.cyan }}>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Ver sala de control</Typography>
        <ArrowForwardIcon sx={{ fontSize: 13 }} />
      </Box>
    </MotionBox>
  );
}

function EmptySlot() {
  return (
    <Box
      sx={{
        width: 300,
        minHeight: 178,
        borderRadius: 2.5,
        border: `1.5px dashed ${COLORS.border.hover}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        color: COLORS.text.muted,
        opacity: 0.7,
      }}
    >
      <AddIcon sx={{ fontSize: 22 }} />
      <Typography sx={{ fontSize: '0.66rem', textAlign: 'center', px: 3, lineHeight: 1.5 }}>
        Punto de instalación disponible
        <br />
        (1 micrófono = 1 bomba monitoreada)
      </Typography>
    </Box>
  );
}

export default function FleetView() {
  const selectPump = useUiStore((s) => s.selectPump);
  useAuraWebSocket(); // estado en vivo también en la vista de flota

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        width: '100vw',
        overflow: 'auto',
        backgroundColor: COLORS.bg.primary,
      }}
    >
      <BlueprintBackground />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1080, mx: 'auto', px: 3, py: { xs: 3, md: 5 } }}>
        {/* encabezado */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 3, md: 4 } }}>
          <Box component="img" src={auraBody} alt="AURI" sx={{ width: 52, filter: 'drop-shadow(0 4px 12px rgba(53,198,244,0.3))' }} />
          <Box>
            <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, fontWeight: 700, letterSpacing: '0.12em', color: COLORS.text.primary }}>
              AURA-SLURRY · SUPERVISIÓN DE FLOTA
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.secondary }}>
              Monitoreo acústico predictivo · Planta Concentradora — 1 equipo en línea
            </Typography>
          </Box>
        </Box>

        {/* grilla de bombas */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <PumpCard onClick={() => selectPump(MACHINE.id)} />
          <EmptySlot />
          <EmptySlot />
        </Box>
      </Box>
    </Box>
  );
}
