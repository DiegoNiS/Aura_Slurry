/**
 * HealthChart — real-time health-score area chart (Recharts).
 * Rolling window from the store; reference lines at 75 (normal) / 45 (failure).
 * Reads history points shaped { time, value, status }.
 */
import { Box, Typography } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, CHART_CONFIG, colorFromScore } from '../../utils/constants';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;
  const color = colorFromScore(d.value);
  return (
    <Box sx={{ backgroundColor: COLORS.bg.surface, border: `1px solid ${COLORS.border.default}`, borderRadius: 1.5, p: 1.25, minWidth: 120 }}>
      <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted, display: 'block', mb: 0.5 }}>
        {dayjs(d.time).format('HH:mm:ss')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 6px ${color}`, alignSelf: 'center' }} />
        <Typography sx={{ fontFamily: '"Rajdhani", monospace', fontWeight: 700, fontSize: '1.1rem', color }}>{d.value}</Typography>
        <Typography sx={{ fontSize: '0.6rem', color: COLORS.text.muted }}>/100</Typography>
      </Box>
    </Box>
  );
}

export default function HealthChart({ height = '100%' }) {
  const healthHistory = usePumpStore((s) => s.healthHistory);
  const areaColor = colorFromScore(healthHistory[healthHistory.length - 1]?.value ?? 90);

  const data = healthHistory.map((p) => ({ ...p, label: dayjs(p.time).format('HH:mm:ss') }));

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaColor} stopOpacity={0.32} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.subtle} vertical={false} />
          <XAxis dataKey="label" stroke={COLORS.text.muted} tick={{ fontSize: 9, fill: COLORS.text.muted }} tickLine={false} axisLine={{ stroke: COLORS.border.subtle }} interval="preserveStartEnd" minTickGap={40} />
          <YAxis domain={[0, 100]} stroke={COLORS.text.muted} tick={{ fontSize: 9, fill: COLORS.text.muted, fontFamily: '"Rajdhani", monospace' }} tickLine={false} axisLine={false} ticks={[0, 45, 75, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={CHART_CONFIG.referenceLines.normalZone} stroke={COLORS.status.normal} strokeDasharray="6 4" strokeOpacity={0.35} />
          <ReferenceLine y={CHART_CONFIG.referenceLines.dangerZone} stroke={COLORS.status.critical} strokeDasharray="6 4" strokeOpacity={0.35} />
          <Area type="monotone" dataKey="value" stroke={areaColor} strokeWidth={2} fill="url(#healthGrad)" dot={false} activeDot={{ r: 4, stroke: areaColor, strokeWidth: 2, fill: COLORS.bg.primary }} animationDuration={300} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
