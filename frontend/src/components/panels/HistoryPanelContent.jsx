/**
 * HistoryPanelContent — historical analysis of the health signal.
 * Large trend chart + aggregate stats + time-in-state breakdown, all
 * derived from the rolling history buffer in the store.
 */
import { Box, Typography } from '@mui/material';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, STATUS, colorFromScore } from '../../utils/constants';
import { PanelBody, SectionLabel } from '../common/PanelBits';
import HealthChart from '../dashboard/HealthChart';
import MetricTile from '../common/MetricTile';

export default function HistoryPanelContent() {
  const history = usePumpStore((s) => s.healthHistory);
  const values = history.map((h) => h.value);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  const counts = history.reduce(
    (acc, h) => {
      acc[h.status] = (acc[h.status] || 0) + 1;
      return acc;
    },
    {}
  );
  const total = history.length || 1;
  const states = [
    { key: STATUS.NORMAL, label: 'Normal', color: COLORS.status.normal },
    { key: STATUS.WARNING, label: 'Advertencia', color: COLORS.status.warning },
    { key: STATUS.FAILURE, label: 'Falla', color: COLORS.status.critical },
  ];

  return (
    <PanelBody>
      <Box>
        <SectionLabel>Health score — ventana móvil ({history.length} lecturas)</SectionLabel>
        <Box sx={{ height: 180, mt: 1 }}>
          <HealthChart />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        <MetricTile label="Promedio" value={avg} accent={colorFromScore(avg)} color={colorFromScore(avg)} />
        <MetricTile label="Mínimo" value={min} accent={colorFromScore(min)} color={colorFromScore(min)} />
        <MetricTile label="Máximo" value={max} accent={colorFromScore(max)} color={colorFromScore(max)} />
      </Box>

      <Box>
        <SectionLabel>Tiempo en cada estado</SectionLabel>
        <Box sx={{ display: 'flex', height: 12, borderRadius: 1, overflow: 'hidden', mt: 1, backgroundColor: COLORS.bg.surface }}>
          {states.map((s) => {
            const pct = ((counts[s.key] || 0) / total) * 100;
            return pct > 0 ? <Box key={s.key} sx={{ width: `${pct}%`, backgroundColor: s.color }} /> : null;
          })}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          {states.map((s) => (
            <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
              <Typography sx={{ fontSize: '0.66rem', color: COLORS.text.secondary }}>
                {s.label} {Math.round(((counts[s.key] || 0) / total) * 100)}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </PanelBody>
  );
}
