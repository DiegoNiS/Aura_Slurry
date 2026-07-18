/**
 * SpectrumChart — FFT magnitude bars (Canvas).
 * Dominant-frequency marker; gradient bars from accent → transparent.
 */
import { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import useSignalStore from '../../stores/useSignalStore';
import { COLORS, AUDIO_CONFIG } from '../../utils/constants';

export default function SpectrumChart({ height = 110 }) {
  const canvasRef = useRef(null);
  const spectrum = useSignalStore((s) => s.spectrum);
  const dominantFreq = useSignalStore((s) => s.dominantFreq);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const n = spectrum.length;
    if (!n) return;
    const gap = 1.5;
    const barW = (w - gap * (n - 1)) / n;

    let peakIdx = 0;
    let peakVal = 0;
    spectrum.forEach((v, i) => {
      if (v > peakVal) {
        peakVal = v;
        peakIdx = i;
      }
    });

    spectrum.forEach((v, i) => {
      const bh = Math.max(1, v * (h - 6));
      const x = i * (barW + gap);
      const y = h - bh;
      const isPeak = i === peakIdx;
      const grad = ctx.createLinearGradient(0, y, 0, h);
      const c = isPeak ? COLORS.accent.cyan : COLORS.signal.spectrum;
      grad.addColorStop(0, c);
      grad.addColorStop(1, `${c}22`);
      ctx.fillStyle = grad;
      if (isPeak) {
        ctx.shadowColor = c;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x, y, barW, bh);
    });
    ctx.shadowBlur = 0;
  }, [spectrum]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <Box
        sx={{
          position: 'absolute',
          bottom: 2,
          left: 2,
          right: 2,
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <Typography sx={{ fontSize: '0.55rem', color: COLORS.text.muted, fontFamily: '"Rajdhani", monospace' }}>
          0 Hz
        </Typography>
        <Typography sx={{ fontSize: '0.55rem', color: COLORS.accent.cyan, fontFamily: '"Rajdhani", monospace' }}>
          f₀ ≈ {dominantFreq} Hz
        </Typography>
        <Typography sx={{ fontSize: '0.55rem', color: COLORS.text.muted, fontFamily: '"Rajdhani", monospace' }}>
          {AUDIO_CONFIG.sampleRate / 2} Hz
        </Typography>
      </Box>
    </Box>
  );
}
