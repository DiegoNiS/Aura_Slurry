/**
 * Aura-Slurry — Constants & Design Tokens
 * Single source of truth for colors, thresholds, API config and the panel registry.
 *
 * NETWORK CONTRACT — English (aligned with backend/main.py + mock_model.py):
 *   WS   ws://<host>/ws/status   → { timestamp, status, health_score, confidence, alert, calibrated }
 *   WS   ws://<host>/ws/audio    → binary PCM Int16, mono, 16 kHz
 *   POST /api/audio              → stream a pre-recorded WAV (fallback)
 *   POST /api/calibrate          → { calibrated: true, seconds: N }
 *   DELETE /api/calibrate        → { calibrated: false }
 *   GET  /api/health             → { status: "ok" }
 *   status ∈ NORMAL | WARNING | FAILURE | CALIBRATING
 *
 * UI copy stays in Spanish (operator-facing); only the wire format is English.
 */

// ─── API & WebSocket Configuration ─────────────────────────────────
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const WS_ENDPOINTS = {
  status: `${WS_BASE_URL}/ws/status`,
  audio: `${WS_BASE_URL}/ws/audio`,
};

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  audio: `${API_BASE_URL}/api/audio`,
  calibrate: `${API_BASE_URL}/api/calibrate`,
};

// ─── Frozen Contract: State Thresholds (Doc 2 §3.4) ────────────────
// p = probability of "normal"
// p ≥ 0.75 → NORMAL | 0.45 ≤ p < 0.75 → WARNING | p < 0.45 → FAILURE
export const THRESHOLDS = {
  NORMAL_MIN: 0.75,
  WARNING_MIN: 0.45,
};

// ─── Status Enum ────────────────────────────────────────────────────
export const STATUS = {
  NORMAL: 'NORMAL',
  WARNING: 'WARNING',
  FAILURE: 'FAILURE',
  CALIBRATING: 'CALIBRATING',
};

// ─── Color Palette — Industrial SCADA Theme ─────────────────────────
export const COLORS = {
  bg: {
    primary: '#0A0E13',
    card: '#101822',
    surface: '#16202D',
    elevated: '#1C2836',
  },
  border: {
    default: '#26333F',
    subtle: '#1B2530',
    hover: '#38495A',
  },
  text: {
    primary: '#EAF1F7',
    secondary: '#9AA9B8',
    muted: '#63748A',
    disabled: '#465768',
  },
  status: {
    normal: '#12E29B',
    normalDim: 'rgba(18, 226, 155, 0.14)',
    normalGlow: 'rgba(18, 226, 155, 0.42)',

    warning: '#FFC13B',
    warningDim: 'rgba(255, 193, 59, 0.14)',
    warningGlow: 'rgba(255, 193, 59, 0.42)',

    critical: '#FF4D5E',
    criticalDim: 'rgba(255, 77, 94, 0.14)',
    criticalGlow: 'rgba(255, 77, 94, 0.42)',

    calibrating: '#35C6F4',
    calibratingDim: 'rgba(53, 198, 244, 0.14)',
    calibratingGlow: 'rgba(53, 198, 244, 0.42)',
  },
  accent: {
    blue: '#35C6F4',
    cyan: '#22E3E0',
    purple: '#8A7CFF',
    amber: '#FFC13B',
  },
  signal: {
    wave: '#22E3E0',
    spectrum: '#8A7CFF',
    grid: 'rgba(120, 150, 175, 0.10)',
  },
};

// ─── Status → Presentation (labels Spanish, keyed by English enum) ──
export const STATUS_COLOR_MAP = {
  [STATUS.NORMAL]: {
    main: COLORS.status.normal,
    dim: COLORS.status.normalDim,
    glow: COLORS.status.normalGlow,
    label: 'Normal',
    description: 'Operación dentro de parámetros nominales',
    risk: 'Bajo',
  },
  [STATUS.WARNING]: {
    main: COLORS.status.warning,
    dim: COLORS.status.warningDim,
    glow: COLORS.status.warningGlow,
    label: 'Advertencia',
    description: 'Anomalía acústica detectada — vigilancia aumentada',
    risk: 'Medio',
  },
  [STATUS.FAILURE]: {
    main: COLORS.status.critical,
    dim: COLORS.status.criticalDim,
    glow: COLORS.status.criticalGlow,
    label: 'Falla Crítica',
    description: 'Firma de falla detectada — acción inmediata',
    risk: 'Alto',
  },
  [STATUS.CALIBRATING]: {
    main: COLORS.status.calibrating,
    dim: COLORS.status.calibratingDim,
    glow: COLORS.status.calibratingGlow,
    label: 'Calibrando',
    description: 'Capturando perfil de ruido ambiental…',
    risk: '—',
  },
};

export function statusFromScore(score) {
  if (score >= 75) return STATUS.NORMAL;
  if (score >= 45) return STATUS.WARNING;
  return STATUS.FAILURE;
}

export function colorFromScore(score) {
  if (score >= 75) return COLORS.status.normal;
  if (score >= 45) return COLORS.status.warning;
  return COLORS.status.critical;
}

// ─── Chart Configuration ────────────────────────────────────────────
export const CHART_CONFIG = {
  maxDataPoints: 60,
  referenceLines: {
    normalZone: 75,
    dangerZone: 45,
  },
};

// ─── Audio Configuration ────────────────────────────────────────────
export const AUDIO_CONFIG = {
  sampleRate: 16000, // 16 kHz mono
  channels: 1,
  chunkDuration: 0.25, // 250 ms per chunk
  calibrationDuration: 10,
  fftBins: 48,
  waveformSamples: 128,
  spectrogramCols: 64,
};

// ─── Machine metadata (single asset today, list-ready for many) ─────
export const MACHINE = {
  id: 'PUMP-01',
  name: 'Bomba de Pulpa #1',
  model: 'Warman® AH 8/6',
  line: 'Línea de Molienda A',
  location: 'Planta Concentradora — Nivel 2',
  serial: 'WAH-8642-2401',
  ratedRpm: 1180,
  ratedPower: 315, // kW
  impeller: '5 álabes · Alta cromo',
};

// ─── Floating Panel Registry ────────────────────────────────────────
// Everything opens as a floating panel — no page navigation.
export const PANEL_IDS = {
  CALIBRATION: 'calibration',
  ALERTS: 'alerts',
  HISTORY: 'history',
  PREDICTIONS: 'predictions',
  LOGS: 'logs',
  MACHINE: 'machine',
  AUDIO: 'audio',
  NOISE: 'noise',
  AI: 'ai',
  SENSORS: 'sensors',
  MAINTENANCE: 'maintenance',
};

export const PANELS = [
  { id: PANEL_IDS.CALIBRATION, title: 'Calibración de Ruido', icon: 'Tune', group: 'ops', width: 400 },
  { id: PANEL_IDS.ALERTS, title: 'Registro de Alertas', icon: 'NotificationsActive', group: 'ops', width: 460 },
  { id: PANEL_IDS.PREDICTIONS, title: 'Predicciones del Modelo', icon: 'Insights', group: 'ops', width: 460 },
  { id: PANEL_IDS.HISTORY, title: 'Análisis Histórico', icon: 'Timeline', group: 'ops', width: 560 },
  { id: PANEL_IDS.SENSORS, title: 'Detalle de Sensores', icon: 'Sensors', group: 'asset', width: 460 },
  { id: PANEL_IDS.MACHINE, title: 'Información de Máquina', icon: 'Precision', group: 'asset', width: 440 },
  { id: PANEL_IDS.MAINTENANCE, title: 'Historial de Mantenimiento', icon: 'Build', group: 'asset', width: 520 },
  { id: PANEL_IDS.AUDIO, title: 'Configuración de Audio', icon: 'GraphicEq', group: 'config', width: 420 },
  { id: PANEL_IDS.NOISE, title: 'Umbral de Ruido', icon: 'FilterAlt', group: 'config', width: 420 },
  { id: PANEL_IDS.AI, title: 'Configuración de IA', icon: 'Psychology', group: 'config', width: 440 },
  { id: PANEL_IDS.LOGS, title: 'Logs del Sistema', icon: 'Terminal', group: 'config', width: 560 },
];
