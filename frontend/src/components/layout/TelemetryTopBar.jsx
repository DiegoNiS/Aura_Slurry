/**
 * TelemetryTopBar — top command strip.
 * Asset identity · live status pill · input-mode & calibration badges ·
 * connection · clock · primary actions (Live / Calibrate / Upload WAV).
 */
import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, Divider, Button, Tooltip, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import SensorsIcon from '@mui/icons-material/Sensors';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import TuneIcon from '@mui/icons-material/Tune';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import dayjs from 'dayjs';
import usePumpStore from '../../stores/usePumpStore';
import useUiStore from '../../stores/useUiStore';
import useMicCapture from '../../hooks/useMicCapture';
import { uploadAudio } from '../../services/api';
import ConnectionIndicator from '../common/ConnectionIndicator';
import { COLORS, STATUS_COLOR_MAP, STATUS, MACHINE, PANEL_IDS } from '../../utils/constants';

const MotionButton = motion.create(Button);

export default function TelemetryTopBar() {
  const status = usePumpStore((s) => s.status);
  const calibrated = usePumpStore((s) => s.calibrated);
  const wsConnected = usePumpStore((s) => s.wsConnected);
  const inputMode = usePumpStore((s) => s.inputMode);
  const fileProgress = usePumpStore((s) => s.fileProgress);
  const isLive = usePumpStore((s) => s.isLive);
  const setIsLive = usePumpStore((s) => s.setIsLive);
  const setInputMode = usePumpStore((s) => s.setInputMode);
  const openPanel = useUiStore((s) => s.openPanel);
  const { toggleCapture } = useMicCapture();
  const fileRef = useRef(null);

  const [clock, setClock] = useState(dayjs().format('HH:mm:ss'));
  const info = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[STATUS.NORMAL];

  useEffect(() => {
    const t = setInterval(() => setClock(dayjs().format('HH:mm:ss')), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLive = () => {
    toggleCapture();
    setIsLive(!isLive);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputMode('file');
    try {
      await uploadAudio(file);
    } catch {
      // backend offline — mock keeps running
    }
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;
  const fileActive = inputMode === 'file' && fileProgress && fileProgress.duration > 0;

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 'auto', md: 52 },
        flexShrink: 0,
        display: 'flex',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.25, md: 2 },
        py: { xs: 0.75, md: 0 },
        gap: { xs: 0.75, md: 1.5 },
        backgroundColor: COLORS.bg.card,
        borderBottom: `1px solid ${COLORS.border.default}`,
        zIndex: 30,
      }}
    >
      {/* identity */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${COLORS.accent.cyan}15`, border: `1px solid ${COLORS.accent.cyan}30`, flexShrink: 0 }}>
          <SensorsIcon sx={{ fontSize: 17, color: COLORS.accent.cyan }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', color: COLORS.text.primary, lineHeight: 1.1 }}>
            AURA-SLURRY
          </Typography>
          <Typography sx={{ fontSize: '0.56rem', color: COLORS.text.muted, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            {MACHINE.name} · {MACHINE.line}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Chip
          label={info.label.toUpperCase()}
          size="small"
          sx={{ backgroundColor: `${info.main}1E`, color: info.main, fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.06em', borderRadius: 1, height: 22, border: `1px solid ${info.main}40` }}
        />
      </Box>

      {/* actions + status */}
      <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', gap: 1, rowGap: 0.75 }}>
        {inputMode !== 'idle' && (
          <Chip
            label={
              inputMode === 'live'
                ? '● EN VIVO'
                : fileProgress
                  ? fileProgress.position >= fileProgress.duration
                    ? '✓ ARCHIVO COMPLETADO'
                    : `● ARCHIVO ${fmtTime(fileProgress.position)} / ${fmtTime(fileProgress.duration)}`
                  : '● RESPALDO'
            }
            size="small"
            sx={{ backgroundColor: inputMode === 'live' ? `${COLORS.status.critical}15` : `${COLORS.accent.blue}15`, color: inputMode === 'live' ? COLORS.status.critical : COLORS.accent.blue, fontWeight: 700, fontSize: '0.56rem', height: 22, borderRadius: 1, fontVariantNumeric: 'tabular-nums' }}
          />
        )}
        <Chip
          label={calibrated ? '✓ CALIBRADO' : '— SIN CALIBRAR'}
          size="small"
          sx={{ backgroundColor: calibrated ? `${COLORS.status.normal}15` : `${COLORS.text.muted}10`, color: calibrated ? COLORS.status.normal : COLORS.text.muted, fontWeight: 600, fontSize: '0.56rem', height: 22, borderRadius: 1 }}
        />
        <ConnectionIndicator isConnected={wsConnected} />
        <Divider orientation="vertical" flexItem sx={{ mx: 0.25, display: { xs: 'none', md: 'block' } }} />

        <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontFamily: '"Rajdhani", monospace', fontSize: '1rem', fontWeight: 600, color: COLORS.text.primary, letterSpacing: '0.05em', minWidth: 62, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
          {clock}
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.25, display: { xs: 'none', md: 'block' } }} />

        {/* primary controls */}
        <MotionButton
          whileTap={{ scale: 0.96 }}
          onClick={handleLive}
          size="small"
          startIcon={isLive ? <StopCircleIcon /> : <MicIcon />}
          sx={{
            height: 30,
            px: 1.5,
            fontSize: '0.62rem',
            color: isLive ? '#fff' : COLORS.text.primary,
            backgroundColor: isLive ? COLORS.status.critical : 'transparent',
            border: `1px solid ${isLive ? COLORS.status.critical : COLORS.border.default}`,
            ...(isLive && { boxShadow: `0 0 16px ${COLORS.status.critical}44` }),
            '&:hover': { backgroundColor: isLive ? COLORS.status.critical : `${COLORS.status.critical}15`, borderColor: COLORS.status.critical },
          }}
        >
          {isLive ? 'Detener' : 'En Vivo'}
        </MotionButton>

        <Tooltip title="Calibrar ruido de mina" arrow>
          <MotionButton
            whileTap={{ scale: 0.96 }}
            onClick={() => openPanel(PANEL_IDS.CALIBRATION)}
            size="small"
            startIcon={<TuneIcon />}
            sx={{ height: 30, px: 1.5, fontSize: '0.62rem', color: COLORS.accent.blue, border: `1px solid ${COLORS.accent.blue}55`, '&:hover': { backgroundColor: `${COLORS.accent.blue}15` } }}
          >
            Calibrar
          </MotionButton>
        </Tooltip>

        <Tooltip title="Cargar WAV (respaldo)" arrow>
          <MotionButton
            whileTap={{ scale: 0.96 }}
            onClick={() => fileRef.current?.click()}
            size="small"
            sx={{ height: 30, minWidth: 30, px: 1, color: COLORS.text.secondary, border: `1px solid ${COLORS.border.default}`, '&:hover': { borderColor: COLORS.accent.cyan, color: COLORS.accent.cyan } }}
          >
            <UploadFileIcon sx={{ fontSize: 17 }} />
          </MotionButton>
        </Tooltip>
        <input ref={fileRef} type="file" accept=".wav,audio/wav" onChange={handleUpload} style={{ display: 'none' }} />
      </Box>

      {/* progreso del archivo en reproducción (segundo procesado / total) */}
      {fileActive && fileProgress.position < fileProgress.duration && (
        <LinearProgress
          variant="determinate"
          value={(fileProgress.position / fileProgress.duration) * 100}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: `${COLORS.accent.blue}22`,
            '& .MuiLinearProgress-bar': { backgroundColor: COLORS.accent.blue },
          }}
        />
      )}
    </Box>
  );
}
