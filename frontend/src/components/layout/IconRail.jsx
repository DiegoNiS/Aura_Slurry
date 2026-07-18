/**
 * IconRail — fixed left rail. Every item opens a floating panel; the app
 * never navigates. Active (open) items get an accent bar + tint. The
 * alerts item shows a live count badge.
 */
import { Box, Tooltip, Badge, Typography } from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import TuneIcon from '@mui/icons-material/Tune';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BuildIcon from '@mui/icons-material/Build';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TerminalIcon from '@mui/icons-material/Terminal';
import usePumpStore from '../../stores/usePumpStore';
import useUiStore from '../../stores/useUiStore';
import { COLORS, PANELS } from '../../utils/constants';

export const RAIL_WIDTH = 56;

const ICONS = {
  Tune: TuneIcon,
  NotificationsActive: NotificationsActiveIcon,
  Insights: InsightsIcon,
  Timeline: TimelineIcon,
  Sensors: SensorsIcon,
  Precision: PrecisionManufacturingIcon,
  Build: BuildIcon,
  GraphicEq: GraphicEqIcon,
  FilterAlt: FilterAltIcon,
  Psychology: PsychologyIcon,
  Terminal: TerminalIcon,
};

const GROUPS = ['ops', 'asset', 'config'];

function RailItem({ panel, active, badge, onClick }) {
  const Icon = ICONS[panel.icon] || TuneIcon;
  return (
    <Tooltip title={panel.title} placement="right" arrow>
      <Box
        onClick={onClick}
        sx={{
          position: 'relative',
          width: 40,
          height: 40,
          mx: 'auto',
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: active ? COLORS.accent.cyan : COLORS.text.secondary,
          backgroundColor: active ? `${COLORS.accent.cyan}12` : 'transparent',
          transition: 'all 0.18s ease',
          '&:hover': { color: COLORS.text.primary, backgroundColor: `${COLORS.text.primary}0A` },
          '&::before': active
            ? { content: '""', position: 'absolute', left: -8, top: '25%', height: '50%', width: 3, borderRadius: '0 2px 2px 0', backgroundColor: COLORS.accent.cyan }
            : {},
        }}
      >
        <Badge
          badgeContent={badge}
          color="error"
          overlap="circular"
          sx={{ '& .MuiBadge-badge': { fontSize: '0.55rem', height: 15, minWidth: 15, fontWeight: 700 } }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Badge>
      </Box>
    </Tooltip>
  );
}

export default function IconRail() {
  const togglePanel = useUiStore((s) => s.togglePanel);
  const openPanels = useUiStore((s) => s.openPanels);
  const alertCount = usePumpStore((s) => s.alerts.length);

  return (
    <Box
      component="nav"
      sx={{
        width: RAIL_WIDTH,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1.5,
        gap: 1,
        backgroundColor: COLORS.bg.card,
        borderRight: `1px solid ${COLORS.border.default}`,
        zIndex: 20,
      }}
    >
      {/* brand mark */}
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${COLORS.accent.cyan}18`,
          border: `1px solid ${COLORS.accent.cyan}40`,
          mb: 0.5,
        }}
      >
        <SensorsIcon sx={{ fontSize: 18, color: COLORS.accent.cyan }} />
      </Box>

      {GROUPS.map((group, gi) => (
        <Box key={group} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
          {gi > 0 && <Box sx={{ height: 1, backgroundColor: COLORS.border.subtle, mx: 1.5, my: 0.5 }} />}
          {PANELS.filter((p) => p.group === group).map((p) => (
            <RailItem
              key={p.id}
              panel={p}
              active={openPanels.includes(p.id)}
              badge={p.id === 'alerts' ? alertCount : 0}
              onClick={() => togglePanel(p.id)}
            />
          ))}
        </Box>
      ))}

      <Box sx={{ flex: 1 }} />
      <Typography sx={{ fontSize: '0.5rem', color: COLORS.text.muted, textAlign: 'center', letterSpacing: '0.05em' }}>
        v2.0
      </Typography>
    </Box>
  );
}
