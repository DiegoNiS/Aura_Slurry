/**
 * HealthGauge — circular pump-health indicator (0-100).
 * MUI X <Gauge/> arc + large Rajdhani center readout + confidence bar.
 * Reads `healthScore` / `confidence` / `status` (English contract).
 */
import { Box, Typography } from '@mui/material';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { motion } from 'framer-motion';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, colorFromScore } from '../../utils/constants';
import AnimatedNumber from '../common/AnimatedNumber';

export default function HealthGauge({ size = 168 }) {
  const healthScore = usePumpStore((s) => s.healthScore);
  const confidence = usePumpStore((s) => s.confidence);
  const color = colorFromScore(healthScore);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: size, height: size * 0.82 }}>
        <Gauge
          value={healthScore}
          startAngle={-110}
          endAngle={110}
          innerRadius="70%"
          outerRadius="100%"
          cornerRadius="50%"
          sx={{
            width: '100%',
            height: '100%',
            [`& .${gaugeClasses.valueArc}`]: {
              fill: color,
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: 'fill 0.5s ease',
            },
            [`& .${gaugeClasses.referenceArc}`]: { fill: COLORS.bg.surface },
            [`& .${gaugeClasses.valueText}`]: { display: 'none' },
          }}
        />
        <Box sx={{ position: 'absolute', top: '52%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <motion.div key={Math.round(healthScore / 5)} initial={{ scale: 1.08, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontWeight: 700, fontSize: '2.6rem', lineHeight: 1, color, textShadow: `0 0 18px ${color}44`, fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={healthScore} />
            </Typography>
          </motion.div>
          <Typography sx={{ fontSize: '0.55rem', color: COLORS.text.muted, letterSpacing: '0.14em', mt: -0.3 }}>
            HEALTH SCORE
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted }}>Confianza IA</Typography>
        <Box sx={{ width: 72, height: 4, borderRadius: 2, backgroundColor: COLORS.bg.surface, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${confidence * 100}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', backgroundColor: color, borderRadius: 2 }} />
        </Box>
        <Typography sx={{ fontSize: '0.66rem', color, fontWeight: 700, fontFamily: '"Rajdhani", monospace' }}>
          {Math.round(confidence * 100)}%
        </Typography>
      </Box>
    </Box>
  );
}
