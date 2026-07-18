/**
 * BlueprintBackground — ambient industrial backdrop (Canvas, static).
 *
 * Very low-opacity hexagonal mesh + topographic contour rings, evoking a
 * mine survey / CAD blueprint. Purely decorative, pointer-events: none,
 * sits behind all content. Redraws only on resize.
 */
import { useRef, useEffect } from 'react';
import { COLORS } from '../../utils/constants';

export default function BlueprintBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ── hexagonal mesh ──────────────────────────────────────────
      const R = 34;
      const hw = Math.sqrt(3) * R;
      ctx.strokeStyle = 'rgba(120, 150, 175, 0.05)';
      ctx.lineWidth = 1;
      for (let row = 0, y = 0; y < h + R; row++, y = row * R * 1.5) {
        const offset = row % 2 ? hw / 2 : 0;
        for (let x = -hw; x < w + hw; x += hw) {
          const cx = x + offset;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i + Math.PI / 6;
            const px = cx + R * Math.cos(a);
            const py = y + R * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      // ── topographic contour rings (mine survey feel) ────────────
      const drawContours = (ox, oy, base) => {
        ctx.strokeStyle = `${COLORS.accent.blue}0C`;
        for (let i = 1; i <= 7; i++) {
          ctx.beginPath();
          ctx.ellipse(ox, oy, base + i * 46, base * 0.7 + i * 32, -0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      };
      drawContours(w * 0.82, h * 0.12, 30);
      drawContours(w * 0.12, h * 0.9, 24);
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
