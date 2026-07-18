/**
 * PumpSchematic — Vector blueprint of the slurry pump.
 *
 * Technical schematic (volute casing, impeller, suction, discharge,
 * bearing assembly, motor). The component whose acoustic signature is
 * degrading is highlighted and pulses:
 *   WARNING → bearing housing (amber)
 *   FAILURE → impeller / volute (red)
 * A rotating impeller conveys "running"; rotation slows as health drops.
 */
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, STATUS, STATUS_COLOR_MAP, MACHINE } from '../../utils/constants';

function Hotspot({ x, y, label, color, active }) {
  if (!active) return null;
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={26}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        initial={{ opacity: 0.2, scale: 0.7 }}
        animate={{ opacity: [0.15, 0.5, 0.15], scale: [0.8, 1.25, 0.8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      <rect x={x + 22} y={y - 20} width={132} height={20} rx={4} fill={`${color}22`} stroke={`${color}66`} />
      <text x={x + 28} y={y - 6} fill={color} fontSize="9" fontFamily="Rajdhani, monospace" fontWeight="700" letterSpacing="0.5">
        {label}
      </text>
    </g>
  );
}

export default function PumpSchematic() {
  const status = usePumpStore((s) => s.status);
  const healthScore = usePumpStore((s) => s.healthScore);
  const info = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[STATUS.NORMAL];

  const isFailure = status === STATUS.FAILURE;
  const isWarning = status === STATUS.WARNING;
  const stroke = COLORS.border.hover;
  const line = COLORS.accent.blue;

  // rotation speed scales with health (stops if critically low)
  const spin = Math.max(2, 14 - (healthScore / 100) * 12);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
      <Box
        component="svg"
        viewBox="0 0 520 300"
        preserveAspectRatio="xMidYMid meet"
        sx={{ width: '100%', height: '100%' }}
      >
        {/* blueprint grid */}
        <defs>
          <pattern id="schematic-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0V26" fill="none" stroke={COLORS.signal.grid} strokeWidth="1" />
          </pattern>
          <radialGradient id="impellerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isFailure ? COLORS.status.critical : COLORS.accent.cyan} stopOpacity="0.35" />
            <stop offset="100%" stopColor={isFailure ? COLORS.status.critical : COLORS.accent.cyan} stopOpacity="0.02" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="520" height="300" fill="url(#schematic-grid)" opacity="0.5" />

        {/* discharge pipe (top) */}
        <path d="M188 78 L188 24 L226 24" fill="none" stroke={stroke} strokeWidth="2" />
        <path d="M188 78 L188 24 L226 24" fill="none" stroke={line} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <text x="232" y="28" fill={COLORS.text.muted} fontSize="8" fontFamily="Rajdhani, monospace">DESCARGA</text>

        {/* suction pipe (left) */}
        <path d="M70 150 L118 150" fill="none" stroke={stroke} strokeWidth="2" />
        <text x="58" y="140" fill={COLORS.text.muted} fontSize="8" fontFamily="Rajdhani, monospace">SUCCIÓN</text>

        {/* volute casing */}
        <circle cx="176" cy="150" r="62" fill={isFailure ? `${COLORS.status.critical}0D` : `${COLORS.bg.surface}`} stroke={isFailure ? COLORS.status.critical : stroke} strokeWidth="2" />
        <circle cx="176" cy="150" r="62" fill="url(#impellerGrad)" />

        {/* impeller (rotating) */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: spin, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '176px 150px' }}
        >
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            const bladeColor = isFailure ? COLORS.status.critical : COLORS.accent.cyan;
            return (
              <path
                key={i}
                d="M176 150 q 14 -20 40 -14 q -22 10 -40 14 Z"
                fill={`${bladeColor}55`}
                stroke={bladeColor}
                strokeWidth="1"
                transform={`rotate(${(a * 180) / Math.PI} 176 150)`}
              />
            );
          })}
          <circle cx="176" cy="150" r="10" fill={COLORS.bg.elevated} stroke={isFailure ? COLORS.status.critical : COLORS.accent.cyan} strokeWidth="1.5" />
        </motion.g>

        {/* shaft */}
        <rect x="238" y="145" width="70" height="10" rx="2" fill={COLORS.bg.elevated} stroke={isWarning ? COLORS.status.warning : stroke} strokeWidth="1.5" />

        {/* bearing housing */}
        <rect x="248" y="132" width="34" height="36" rx="3" fill={isWarning ? `${COLORS.status.warning}12` : COLORS.bg.surface} stroke={isWarning ? COLORS.status.warning : stroke} strokeWidth="2" />
        <line x1="256" y1="132" x2="256" y2="168" stroke={stroke} strokeWidth="1" />
        <line x1="266" y1="132" x2="266" y2="168" stroke={stroke} strokeWidth="1" />
        <line x1="276" y1="132" x2="276" y2="168" stroke={stroke} strokeWidth="1" />

        {/* motor */}
        <rect x="312" y="118" width="150" height="64" rx="6" fill={COLORS.bg.surface} stroke={stroke} strokeWidth="2" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={324 + i * 15} y1="124" x2={324 + i * 15} y2="176" stroke={stroke} strokeWidth="1" opacity="0.5" />
        ))}
        <text x="387" y="200" textAnchor="middle" fill={COLORS.text.muted} fontSize="8" fontFamily="Rajdhani, monospace">MOTOR {MACHINE.ratedPower} kW</text>

        {/* base */}
        <rect x="118" y="216" width="360" height="10" rx="2" fill={COLORS.bg.elevated} stroke={stroke} strokeWidth="1" />
        <path d="M150 226 l-10 22 M300 226 l0 22 M450 226 l10 22" stroke={stroke} strokeWidth="2" fill="none" />

        {/* hotspots */}
        <Hotspot x={176} y={150} label="IMPULSOR · CAVITACIÓN" color={COLORS.status.critical} active={isFailure} />
        <Hotspot x={265} y={150} label="RODAMIENTO · VIBRACIÓN" color={COLORS.status.warning} active={isWarning} />
      </Box>

      {/* footer label */}
      <Box
        sx={{
          position: 'absolute',
          left: 12,
          bottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: info.main, boxShadow: `0 0 8px ${info.main}` }} />
        <Typography sx={{ fontSize: '0.62rem', color: COLORS.text.secondary, fontWeight: 600, letterSpacing: '0.05em' }}>
          {MACHINE.model} · {healthScore >= 45 ? 'EN MARCHA' : 'RIESGO DE PARO'}
        </Typography>
      </Box>
    </Box>
  );
}
