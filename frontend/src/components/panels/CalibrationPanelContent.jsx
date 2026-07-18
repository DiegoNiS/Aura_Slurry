/**
 * CalibrationPanelContent — noise calibration workflow.
 * Records ambient noise from the mic and POSTs it to /api/calibrate
 * (via useCalibration). Shows a circular countdown and success state.
 */
import { useRef, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import usePumpStore from '../../stores/usePumpStore';
import useCalibration from '../../hooks/useCalibration';
import { calibrateNoise } from '../../services/api';
import { COLORS, AUDIO_CONFIG } from '../../utils/constants';
import { PanelBody, Callout } from '../common/PanelBits';

export default function CalibrationPanelContent() {
  const calibrated = usePumpStore((s) => s.calibrated);
  const { isCalibrating, progress, error, startCalibration, resetCalibration } = useCalibration();
  const duration = AUDIO_CONFIG.calibrationDuration;
  const remaining = Math.ceil(duration * (1 - progress / 100));

  // Calibración subiendo un WAV de ruido (alternativa al micrófono)
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleUploadCalibration = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permitir volver a elegir el mismo archivo
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await calibrateNoise(file);
      usePumpStore.setState({ calibrado: true });
    } catch {
      setUploadError('No se pudo calibrar con ese archivo (¿es un WAV válido?)');
    } finally {
      setUploading(false);
    }
  };

  return (
    <PanelBody sx={{ alignItems: 'stretch', gap: 2.5 }}>
      <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: calibrated ? `${COLORS.status.normal}0C` : `${COLORS.status.warning}0C`, border: `1px solid ${(calibrated ? COLORS.status.normal : COLORS.status.warning)}33`, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: calibrated ? COLORS.status.normal : COLORS.status.warning, boxShadow: `0 0 8px ${calibrated ? COLORS.status.normal : COLORS.status.warning}` }} />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: COLORS.text.primary }}>
          {calibrated ? 'Calibración activa' : 'Sin calibrar'}
        </Typography>
      </Box>

      <Callout>
        Captura el <strong>perfil de ruido ambiental</strong> de la planta durante {duration}s. El backend lo usa para aplicar <strong>sustracción espectral</strong> y aislar la firma acústica de la bomba del ruido de fondo.
      </Callout>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 1 }}>
        {isCalibrating ? (
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={progress} size={150} thickness={3} sx={{ color: COLORS.accent.blue, filter: `drop-shadow(0 0 10px ${COLORS.accent.blue}44)` }} />
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <MicIcon sx={{ fontSize: 30, color: COLORS.accent.blue }} />
              </motion.div>
              <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontSize: '1.8rem', fontWeight: 700, color: COLORS.accent.blue }}>{remaining}s</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted }}>Capturando…</Typography>
            </Box>
          </Box>
        ) : calibrated ? (
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }} style={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: COLORS.status.normal, filter: `drop-shadow(0 0 16px ${COLORS.status.normal}55)` }} />
            <Typography sx={{ mt: 1, color: COLORS.status.normal, fontWeight: 600, fontSize: '0.9rem' }}>Perfil almacenado</Typography>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => startCalibration()} sx={{ width: 170, height: 170, borderRadius: '50%', border: `2px solid ${COLORS.accent.blue}`, display: 'flex', flexDirection: 'column', gap: 1, '&:hover': { borderColor: COLORS.accent.cyan, backgroundColor: `${COLORS.accent.blue}10`, boxShadow: `0 0 34px ${COLORS.accent.blue}22` } }}>
              <MicIcon sx={{ fontSize: 34, color: COLORS.accent.blue }} />
              <Typography sx={{ color: COLORS.text.primary, fontWeight: 600, textTransform: 'none', fontSize: '0.72rem', lineHeight: 1.3 }}>
                Capturar Ruido<br />Ambiental ({duration}s)
              </Typography>
            </Button>
          </motion.div>
        )}

        {error && <Typography sx={{ fontSize: '0.68rem', color: COLORS.status.critical, textAlign: 'center' }}>{error}</Typography>}

        {/* alternativa: subir un WAV con el ruido de la planta */}
        {!isCalibrating && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Button
              startIcon={uploading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <UploadFileIcon />}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              size="small"
              sx={{ color: COLORS.accent.blue, border: `1px solid ${COLORS.accent.blue}55`, px: 2, textTransform: 'none', '&:hover': { backgroundColor: `${COLORS.accent.blue}12` } }}
            >
              {uploading ? 'Calibrando…' : 'O subir WAV de ruido'}
            </Button>
            <Typography sx={{ fontSize: '0.58rem', color: COLORS.text.muted, textAlign: 'center' }}>
              p. ej. demo_assets/casos/03_bomba_vecina.wav o 07_ruido_mina.wav
            </Typography>
            {uploadError && (
              <Typography sx={{ fontSize: '0.64rem', color: COLORS.status.critical }}>{uploadError}</Typography>
            )}
            <input ref={fileRef} type="file" accept=".wav,audio/wav" onChange={handleUploadCalibration} style={{ display: 'none' }} />
          </Box>
        )}
      </Box>

      {calibrated && !isCalibrating && (
        <Button startIcon={<DeleteOutlineIcon />} onClick={resetCalibration} sx={{ color: COLORS.text.muted, alignSelf: 'center', '&:hover': { color: COLORS.status.critical } }}>
          Limpiar calibración
        </Button>
      )}
    </PanelBody>
  );
}
