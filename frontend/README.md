# Módulo Frontend — Integrante 3

Dashboard SCADA en tiempo real: React (Vite) + Material UI (tema oscuro industrial) + Recharts.

## Inicializar

```bash
npm create vite@latest . -- --template react
npm install @mui/material @emotion/react @emotion/styled recharts
npm run dev
```

## Componentes (Doc 2 §5)

- Semáforo (verde/ámbar/rojo) sincronizado con `estado` del WS `/ws/estado`.
- Gauge de health score (0–100) + gráfico temporal (Recharts).
- Panel de alertas con timestamp.
- Botones: **Monitoreo en Vivo** (getUserMedia → chunks PCM 16 kHz por `/ws/audio`), **Calibrar Ruido de Mina**, **Cargar Audio** (respaldo).
- Indicadores: CALIBRADO / NO CALIBRADO · EN VIVO / RESPALDO · estado CALIBRANDO (azul + spinner).

Arrancar contra el WebSocket **mock** del backend (datos random) — no esperar al pipeline real.
