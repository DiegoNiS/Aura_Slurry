/**
 * ControlRoomLayout — the single-view industrial control center.
 *
 * Fills exactly the viewport (no page scroll on desktop). A fixed icon
 * rail, a telemetry top bar and a status footer frame a 3-column control
 * grid. Secondary features open as floating panels (PanelHost) instead of
 * navigating. Live data comes from /ws/status (useAuraWebSocket) with a
 * mock fallback; the acoustic signal is driven by useSignalSimulator.
 */
import { useEffect } from 'react';
import { Box } from '@mui/material';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import GridOnIcon from '@mui/icons-material/GridOn';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

import usePumpStore from '../../stores/usePumpStore';
import useSignalStore from '../../stores/useSignalStore';
import useAuraWebSocket from '../../hooks/useAuraWebSocket';
import useSignalSimulator from '../../hooks/useSignalSimulator';

import { COLORS } from '../../utils/constants';
import BlueprintBackground from './BlueprintBackground';
import IconRail from './IconRail';
import TelemetryTopBar from './TelemetryTopBar';
import StatusBar from './StatusBar';
import Panel from '../common/Panel';
import PanelHost from '../panels/PanelHost';

import StatusSemaphore from '../dashboard/StatusSemaphore';
import HealthGauge from '../dashboard/HealthGauge';
import AiStatusCard from '../dashboard/AiStatusCard';
import PumpSchematic from '../dashboard/PumpSchematic';
import HealthChart from '../dashboard/HealthChart';
import WaveformChart from '../signal/WaveformChart';
import SpectrumChart from '../signal/SpectrumChart';
import Spectrogram from '../signal/Spectrogram';
import SignalMeters from '../signal/SignalMeters';
import RadialGauge from '../common/RadialGauge';

function DiagnosticRadials() {
  const stability = useSignalStore((s) => s.stability);
  const anomaly = useSignalStore((s) => s.anomalyScore);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
      <RadialGauge value={stability} label="Estabilidad" unit="%" color={COLORS.status.normal} size={84} animateValue={false} />
      <RadialGauge value={anomaly} label="Anomalía" unit="%" color={anomaly > 60 ? COLORS.status.critical : anomaly > 30 ? COLORS.status.warning : COLORS.accent.cyan} size={84} animateValue={false} />
    </Box>
  );
}

export default function ControlRoomLayout() {
  const startMockSimulation = usePumpStore((s) => s.startMockSimulation);
  const stopMockSimulation = usePumpStore((s) => s.stopMockSimulation);

  // Live telemetry (falls back to mock) + acoustic signal generator
  useAuraWebSocket();
  useSignalSimulator({ fps: 8 });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usePumpStore.getState().wsConnected) startMockSimulation();
    }, 2000);
    return () => {
      clearTimeout(timer);
      stopMockSimulation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        // dvh evita el corte por la barra del navegador en móvil
        '@supports (height: 100dvh)': { height: '100dvh' },
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: COLORS.bg.primary,
      }}
    >
      <BlueprintBackground />

      <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex' }}>
        <IconRail />

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <TelemetryTopBar />

          {/* Control grid */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              gap: 1.5,
              p: 1.5,
              // en móvil el riel es barra inferior fija: dejarle espacio
              pb: { xs: '62px', md: 1.5 },
              overflow: { xs: 'auto', lg: 'hidden' },
              flexDirection: { xs: 'column', lg: 'row' },
            }}
          >
            {/* LEFT — vitals */}
            <Box sx={{ width: { xs: '100%', lg: 320 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: { xs: 'auto', lg: 0 } }}>
              <Panel title="Estado del Activo" icon={<HealthAndSafetyIcon fontSize="inherit" />} sx={{ flex: '0 0 auto' }} dense>
                <StatusSemaphore />
              </Panel>
              <Panel title="Salud de la Bomba" icon={<MonitorHeartIcon fontSize="inherit" />} accent={COLORS.status.normal} sx={{ flex: 1, minHeight: 190 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <HealthGauge />
                </Box>
              </Panel>
              <Panel title="Inteligencia Artificial" icon={<MonitorHeartIcon fontSize="inherit" />} accent={COLORS.accent.purple} sx={{ flex: '0 0 auto' }} dense>
                <AiStatusCard />
              </Panel>
            </Box>

            {/* CENTER — machine + trend */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: { xs: 'auto', lg: 0 } }}>
              <Panel title="Esquema de la Bomba de Pulpa" icon={<PrecisionManufacturingIcon fontSize="inherit" />} sx={{ flex: 1.5, minHeight: 240 }}>
                <PumpSchematic />
              </Panel>
              <Panel title="Health Score — Tiempo Real" icon={<ShowChartIcon fontSize="inherit" />} sx={{ flex: 1, minHeight: 180 }}>
                <HealthChart />
              </Panel>
            </Box>

            {/* RIGHT — acoustic signal */}
            <Box sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: { xs: 'auto', lg: 0 }, overflowY: { lg: 'auto' } }}>
              <Panel title="Firma Acústica" icon={<GraphicEqIcon fontSize="inherit" />} accent={COLORS.accent.cyan} sx={{ flex: '0 0 auto' }} dense>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <WaveformChart height={78} />
                  <SpectrumChart height={92} />
                </Box>
              </Panel>
              <Panel title="Métricas de Señal" icon={<ShowChartIcon fontSize="inherit" />} accent={COLORS.accent.purple} sx={{ flex: '0 0 auto' }} dense>
                <SignalMeters />
              </Panel>
              <Panel title="Espectrograma" icon={<GridOnIcon fontSize="inherit" />} accent={COLORS.accent.amber} sx={{ flex: '0 0 auto' }} dense>
                <Spectrogram height={110} />
              </Panel>
              <Panel title="Diagnóstico de Señal" icon={<MonitorHeartIcon fontSize="inherit" />} sx={{ flex: '0 0 auto' }} dense>
                <DiagnosticRadials />
              </Panel>
            </Box>
          </Box>

          <StatusBar />
        </Box>
      </Box>

      {/* Floating inspector panels (no navigation) */}
      <PanelHost />
    </Box>
  );
}
