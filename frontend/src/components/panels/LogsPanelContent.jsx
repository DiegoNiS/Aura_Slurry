/**
 * LogsPanelContent — system console.
 * Streams synthetic log lines derived from live store activity (status
 * transitions, alerts, calibration). Monospace, newest at the bottom,
 * auto-scrolls. Replace the deriver with real backend logs later.
 */
import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS, STATUS } from '../../utils/constants';

const LEVELS = {
  INFO: COLORS.accent.blue,
  WARN: COLORS.status.warning,
  ERROR: COLORS.status.critical,
  OK: COLORS.status.normal,
};

export default function LogsPanelContent() {
  const status = usePumpStore((s) => s.status);
  const calibrated = usePumpStore((s) => s.calibrated);
  const wsConnected = usePumpStore((s) => s.wsConnected);
  const [lines, setLines] = useState(() => [
    { t: new Date().toISOString(), lvl: 'INFO', msg: 'Aura-Slurry control room inicializado' },
    { t: new Date().toISOString(), lvl: 'INFO', msg: 'Suscrito a ws://localhost:8000/ws/status' },
  ]);
  const prev = useRef({ status, calibrated, wsConnected });
  const endRef = useRef(null);

  useEffect(() => {
    const p = prev.current;
    const push = (lvl, msg) => setLines((l) => [...l.slice(-120), { t: new Date().toISOString(), lvl, msg }]);

    if (status !== p.status) {
      const lvl = status === STATUS.FAILURE ? 'ERROR' : status === STATUS.WARNING ? 'WARN' : 'OK';
      push(lvl, `Transición de estado → ${status}`);
    }
    if (calibrated !== p.calibrated) push(calibrated ? 'OK' : 'INFO', calibrated ? 'Perfil de ruido aplicado (sustracción espectral ON)' : 'Calibración eliminada');
    if (wsConnected !== p.wsConnected) push(wsConnected ? 'OK' : 'WARN', wsConnected ? 'Enlace de telemetría ACTIVO' : 'Enlace perdido — reintentando');

    prev.current = { status, calibrated, wsConnected };
  }, [status, calibrated, wsConnected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          fontFamily: '"Share Tech Mono", "Rajdhani", monospace',
          fontSize: '0.7rem',
          lineHeight: 1.7,
          backgroundColor: '#070A0E',
          border: `1px solid ${COLORS.border.subtle}`,
          borderRadius: 1,
          p: 1.25,
        }}
      >
        {lines.map((l, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, whiteSpace: 'pre-wrap' }}>
            <span style={{ color: COLORS.text.muted }}>{dayjs(l.t).format('HH:mm:ss')}</span>
            <span style={{ color: LEVELS[l.lvl], fontWeight: 700, minWidth: 42 }}>{l.lvl}</span>
            <span style={{ color: COLORS.text.secondary }}>{l.msg}</span>
          </Box>
        ))}
        <div ref={endRef} />
      </Box>
      <Typography sx={{ fontSize: '0.58rem', color: COLORS.text.muted, mt: 0.75 }}>
        {lines.length} líneas · buffer 120 · fuente: eventos de estado en vivo
      </Typography>
    </Box>
  );
}
