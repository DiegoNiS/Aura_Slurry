/**
 * Spectrogram — rolling time-frequency heatmap (Canvas).
 * Columns scroll left→right over time; magnitude → viridis-ish ramp.
 */
import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import useSignalStore from '../../stores/useSignalStore';

// Compact perceptual ramp (dark navy → teal → amber → white)
function ramp(v) {
  const stops = [
    [10, 14, 26],
    [18, 70, 110],
    [20, 190, 170],
    [255, 193, 59],
    [255, 245, 235],
  ];
  const x = Math.max(0, Math.min(1, v)) * (stops.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const c = a.map((ch, k) => Math.round(ch + (b[k] - ch) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export default function Spectrogram({ height = 120 }) {
  const canvasRef = useRef(null);
  const spectrogram = useSignalStore((s) => s.spectrogram);

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

    const cols = spectrogram.length;
    if (!cols) return;
    const bins = spectrogram[0].length;
    const cw = w / cols;
    const ch = h / bins;

    spectrogram.forEach((col, ci) => {
      col.forEach((v, bi) => {
        ctx.fillStyle = ramp(v);
        // low freq at bottom
        ctx.fillRect(ci * cw, h - (bi + 1) * ch, cw + 0.5, ch + 0.5);
      });
    });
  }, [spectrogram]);

  return (
    <Box sx={{ width: '100%', height, borderRadius: 1, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </Box>
  );
}
