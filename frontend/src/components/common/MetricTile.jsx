/**
 * MetricTile — compact KPI cell (label · animated value · unit · trend).
 * Optional sparkline and delta arrow. Reused across dashboard + panels.
 */
import { Box, Typography } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { COLORS } from '../../utils/constants';
import AnimatedNumber from './AnimatedNumber';
import Sparkline from './Sparkline';

export default function MetricTile({
  label,
  value,
  unit,
  decimals = 0,
  color = COLORS.text.primary,
  accent = COLORS.accent.cyan,
  icon,
  spark,
  trend, // 'up' | 'down' | undefined
  animate = true,
  raw = false, // render value verbatim (string) instead of AnimatedNumber
}) {
  const TrendIcon = trend === 'up' ? ArrowDropUpIcon : ArrowDropDownIcon;

  return (
    <Box
      sx={{
        position: 'relative',
        p: 1.25,
        borderRadius: 1.5,
        backgroundColor: `${COLORS.bg.surface}99`,
        border: `1px solid ${COLORS.border.subtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.4,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        '&:hover': { borderColor: COLORS.border.hover, transform: 'translateY(-1px)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {icon && <Box sx={{ color: accent, display: 'flex', fontSize: 14 }}>{icon}</Box>}
        <Typography
          sx={{
            fontSize: '0.6rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: COLORS.text.muted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4, minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: '"Rajdhani", monospace',
              fontWeight: 700,
              fontSize: '1.5rem',
              lineHeight: 1,
              color,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {raw
            ? value
            : animate
              ? <AnimatedNumber value={value} decimals={decimals} />
              : typeof value === 'number'
                ? value.toFixed(decimals)
                : value}
          </Typography>
          {unit && (
            <Typography sx={{ fontSize: '0.65rem', color: COLORS.text.muted, fontWeight: 500 }}>
              {unit}
            </Typography>
          )}
          {trend && (
            <TrendIcon
              sx={{
                fontSize: 18,
                color: trend === 'up' ? COLORS.status.normal : COLORS.status.critical,
              }}
            />
          )}
        </Box>
        {spark && <Sparkline data={spark} color={accent} width={64} height={26} />}
      </Box>
    </Box>
  );
}
