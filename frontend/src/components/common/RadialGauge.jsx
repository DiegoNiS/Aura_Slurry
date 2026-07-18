/**
 * RadialGauge — SVG progress ring with a centered HMI readout.
 * Generic 0..max indicator (stability, anomaly, confidence, …).
 */
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../utils/constants';
import AnimatedNumber from './AnimatedNumber';

export default function RadialGauge({
  value = 0,
  max = 100,
  size = 92,
  thickness = 7,
  color = COLORS.accent.cyan,
  label,
  unit = '',
  decimals = 0,
  animateValue = true,
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = c * (1 - pct);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.bg.surface} strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease',
              filter: `drop-shadow(0 0 5px ${color}88)`,
            }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Rajdhani", monospace',
              fontWeight: 700,
              fontSize: size > 80 ? '1.5rem' : '1.15rem',
              lineHeight: 1,
              color,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {animateValue ? <AnimatedNumber value={value} decimals={decimals} /> : Number(value).toFixed(decimals)}
            {unit && <span style={{ fontSize: '0.6em', marginLeft: 1 }}>{unit}</span>}
          </Typography>
        </Box>
      </Box>
      {label && (
        <Typography
          sx={{
            fontSize: '0.58rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: COLORS.text.muted,
            textAlign: 'center',
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}
