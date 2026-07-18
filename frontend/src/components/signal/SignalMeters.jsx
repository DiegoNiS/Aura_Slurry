/**
 * SignalMeters — grid of acoustic scalar readouts from useSignalStore.
 * Pure presentation; values already normalized by the store/simulator.
 */
import { Box } from '@mui/material';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BoltIcon from '@mui/icons-material/Bolt';
import WavesIcon from '@mui/icons-material/Waves';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import useSignalStore from '../../stores/useSignalStore';
import { COLORS } from '../../utils/constants';
import MetricTile from '../common/MetricTile';

export default function SignalMeters() {
  const s = useSignalStore();

  const tiles = [
    { label: 'Frec. dominante', value: s.dominantFreq, unit: 'Hz', icon: <GraphicEqIcon sx={{ fontSize: 14 }} />, accent: COLORS.accent.cyan, spark: undefined },
    { label: 'Nivel RMS', value: s.rms, decimals: 2, icon: <ShowChartIcon sx={{ fontSize: 14 }} />, accent: COLORS.accent.purple, spark: s.rmsHistory },
    { label: 'Nivel dB', value: s.db, unit: 'dB', icon: <VolumeUpIcon sx={{ fontSize: 14 }} />, accent: COLORS.accent.blue },
    { label: 'Energía señal', value: s.energy, decimals: 2, icon: <BoltIcon sx={{ fontSize: 14 }} />, accent: COLORS.accent.amber, spark: s.powerHistory },
    { label: 'Amplitud pico', value: s.amplitude, decimals: 2, icon: <WavesIcon sx={{ fontSize: 14 }} />, accent: COLORS.accent.cyan },
    { label: 'Ruido de fondo', value: s.noiseFloor, unit: 'dB', icon: <BlurOnIcon sx={{ fontSize: 14 }} />, accent: COLORS.text.muted },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1,
      }}
    >
      {tiles.map((t) => (
        <MetricTile key={t.label} {...t} animate={false} />
      ))}
    </Box>
  );
}
