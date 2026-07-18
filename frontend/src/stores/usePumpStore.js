/**
 * Aura-Slurry — Zustand Store (pump health)
 *
 * Consumes the English wire contract from /ws/status:
 *   { timestamp, status, health_score, confidence, alert, calibrated }
 *
 * Internal state uses English names to match the contract 1:1.
 * Includes a mock generator so the dashboard runs standalone.
 */
import { create } from 'zustand';
import { STATUS, CHART_CONFIG } from '../utils/constants';

const usePumpStore = create((set, get) => ({
  // ─── Live data (mirrors /ws/status) ───────────────────────────────
  status: STATUS.NORMAL,
  healthScore: 88,
  confidence: 0.94,
  alert: null,
  calibrated: false,
  recommendation: null, // texto de Gemini generado por el backend
  timestamp: new Date().toISOString(),

  // ─── Derived / history ────────────────────────────────────────────
  healthHistory: [],
  alerts: [],
  reports: [], // reportes de incidente hacia la minera (más reciente primero)

  // ─── UI / session state ───────────────────────────────────────────
  isLive: false,
  isCalibrating: false,
  calibrationProgress: 0,
  wsConnected: false,
  inputMode: 'idle', // 'idle' | 'live' | 'file'
  fileProgress: null, // { position, duration } en segundos (modo archivo)

  // Model telemetry (populated from contract + local timing) ─────────
  lastInferenceMs: 42,
  modelLoaded: true,
  modelName: 'RandomForest · MFCC-20',

  mockIntervalId: null,

  // ─── Ingest a contract message ────────────────────────────────────
  updateFromWs: (data, meta = {}) => {
    const { healthHistory, alerts } = get();

    const point = {
      time: data.timestamp,
      value: data.health_score,
      status: data.status,
    };
    const updatedHistory = [
      ...healthHistory.slice(-(CHART_CONFIG.maxDataPoints - 1)),
      point,
    ];

    const updatedAlerts = data.alert
      ? [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: data.timestamp,
            status: data.status,
            message: data.alert,
            confidence: data.confidence,
            healthScore: data.health_score,
          },
          ...alerts,
        ].slice(0, 100)
      : alerts;

    set({
      status: data.status,
      healthScore: data.health_score,
      confidence: data.confidence,
      alert: data.alert,
      calibrated: data.calibrated,
      timestamp: data.timestamp,
      healthHistory: updatedHistory,
      alerts: updatedAlerts,
      ...(meta.inferenceMs != null ? { lastInferenceMs: meta.inferenceMs } : {}),
      // metadata REAL del procesamiento (medida por el backend por ventana)
      ...(data.inference_ms != null ? { lastInferenceMs: data.inference_ms } : {}),
      ...(data.model_loaded != null ? { modelLoaded: data.model_loaded } : {}),
      // recomendación IA (Gemini) generada por el backend — auditoría #3
      ...(data.recommendation !== undefined ? { recommendation: data.recommendation } : {}),
      // reporte de incidente nuevo (dedupe por id)
      ...(data.report && !get().reports.some((r) => r.id === data.report.id)
        ? { reports: [data.report, ...get().reports].slice(0, 20) }
        : {}),
      // visibilidad de la fuente: en modo archivo el backend manda el
      // segundo que está procesando y la duración total
      ...(data.source === 'file' && data.file_duration
        ? {
            inputMode: 'file',
            fileProgress: { position: data.file_position, duration: data.file_duration },
          }
        : {}),
      ...(data.source === 'live' ? { inputMode: 'live', fileProgress: null } : {}),
    });
  },

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setIsLive: (live) => set({ isLive: live, inputMode: live ? 'live' : 'idle' }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setIsCalibrating: (v) => set({ isCalibrating: v }),
  setCalibrationProgress: (p) => set({ calibrationProgress: p }),
  clearAlerts: () => set({ alerts: [] }),
  setCalibrated: (v) => set({ calibrated: v }),
  setReports: (reports) => set({ reports }),

  // ─── Mock generator (offline development) ─────────────────────────
  startMockSimulation: () => {
    if (get().mockIntervalId) return;

    let phase = 0; // 0 normal · 1 degrading · 2 critical · 3 recovering
    let tick = 0;

    const id = setInterval(() => {
      tick++;
      if (tick % 14 === 0) phase = (phase + 1) % 4;

      let healthScore;
      let status;
      let alert;
      let confidence;

      switch (phase) {
        case 1:
          healthScore = 50 + Math.floor(Math.random() * 25);
          status = healthScore >= 75 ? STATUS.NORMAL : STATUS.WARNING;
          alert = status === STATUS.WARNING ? 'Variación acústica detectada' : null;
          confidence = 0.55 + Math.random() * 0.25;
          break;
        case 2:
          healthScore = 15 + Math.floor(Math.random() * 30);
          status = healthScore < 45 ? STATUS.FAILURE : STATUS.WARNING;
          alert = status === STATUS.FAILURE ? 'Posible cavitación/desgaste' : 'Vibración anómala';
          confidence = 0.7 + Math.random() * 0.25;
          break;
        case 3:
          healthScore = 60 + Math.floor(Math.random() * 25);
          status = healthScore >= 75 ? STATUS.NORMAL : STATUS.WARNING;
          alert = null;
          confidence = 0.65 + Math.random() * 0.3;
          break;
        default:
          healthScore = 80 + Math.floor(Math.random() * 16);
          status = STATUS.NORMAL;
          alert = null;
          confidence = 0.82 + Math.random() * 0.16;
      }

      get().updateFromWs(
        {
          timestamp: new Date().toISOString(),
          status,
          health_score: healthScore,
          confidence: parseFloat(confidence.toFixed(2)),
          alert,
          calibrated: get().calibrated,
        },
        { inferenceMs: 28 + Math.floor(Math.random() * 40) }
      );
    }, 1500);

    set({ mockIntervalId: id, wsConnected: true, inputMode: get().inputMode });
  },

  stopMockSimulation: () => {
    const { mockIntervalId } = get();
    if (mockIntervalId) {
      clearInterval(mockIntervalId);
      set({ mockIntervalId: null });
    }
  },
}));

export default usePumpStore;
