/**
 * useSignalStore — Acoustic signal metrics
 *
 * Holds everything the DSP/model layer will eventually stream:
 *   - waveform: Float array (time domain, normalized -1..1)
 *   - spectrum: Float array (FFT magnitude per bin, 0..1)
 *   - spectrogram: rolling matrix of spectrum columns (0..1)
 *   - scalar metrics: rms, db, dominantFreq, peakFreq, minFreq, energy,
 *     noiseFloor, amplitude, stability, anomalyScore
 *   - powerHistory / anomalyHistory: sparkline buffers
 *
 * TODAY the values are produced by useSignalSimulator (client-side).
 * TO GO LIVE: call `ingest(payload)` from a /ws/audio-features handler
 * with the same field names — no component changes required.
 */
import { create } from 'zustand';
import { AUDIO_CONFIG } from '../utils/constants';

const zeros = (n) => new Array(n).fill(0);
const SPARK = 40;

const useSignalStore = create((set, get) => ({
  waveform: zeros(AUDIO_CONFIG.waveformSamples),
  spectrum: zeros(AUDIO_CONFIG.fftBins),
  spectrogram: Array.from({ length: AUDIO_CONFIG.spectrogramCols }, () =>
    zeros(AUDIO_CONFIG.fftBins)
  ),

  rms: 0.12,
  db: -42,
  dominantFreq: 620,
  peakFreq: 3200,
  minFreq: 80,
  energy: 0.34,
  noiseFloor: -68,
  amplitude: 0.28,
  stability: 92, // 0..100 (higher = steadier signal)
  anomalyScore: 6, // 0..100 (higher = more anomalous)

  powerHistory: zeros(SPARK),
  anomalyHistory: zeros(SPARK),
  rmsHistory: zeros(SPARK),

  /**
   * Ingest a full or partial signal frame. Shape mirrors the future
   * backend audio-features contract; unknown keys are ignored.
   */
  ingest: (frame) => {
    const s = get();
    const next = { ...frame };

    if (frame.spectrum) {
      const cols = [...s.spectrogram.slice(1), frame.spectrum];
      next.spectrogram = cols;
    }
    if (frame.energy != null) {
      next.powerHistory = [...s.powerHistory.slice(1), frame.energy];
    }
    if (frame.anomalyScore != null) {
      next.anomalyHistory = [...s.anomalyHistory.slice(1), frame.anomalyScore / 100];
    }
    if (frame.rms != null) {
      next.rmsHistory = [...s.rmsHistory.slice(1), frame.rms];
    }
    set(next);
  },
}));

export default useSignalStore;
