/**
 * WaveformChart — time-domain oscilloscope (Canvas).
 * Colour follows pump status; a soft mirrored glow gives an HMI feel.
 */
import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import useSignalStore from '../../stores/useSignalStore';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, colorFromScore } from '../../utils/constants';

export default function WaveformChart({ height = 96 }) {
  const canvasRef = useRef(null);
  const waveform = useSignalStore((s) => s.waveform);
  const healthScore = usePumpStore((s) => s.healthScore);

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

    const color = colorFromScore(healthScore);
    const mid = h / 2;

    // baseline grid
    ctx.strokeStyle = COLORS.signal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    if (!waveform.length) return;
    const stepX = w / (waveform.length - 1);

    // glow pass
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    waveform.forEach((v, i) => {
      const x = i * stepX;
      const y = mid - v * (mid - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }, [waveform, healthScore]);

  return (
    <Box sx={{ width: '100%', height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </Box>
  );
}
