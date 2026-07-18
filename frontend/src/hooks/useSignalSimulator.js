/**
 * useSignalSimulator — Client-side acoustic frame generator
 *
 * Produces plausible DSP frames (waveform, FFT, metrics) at ~12 fps and
 * pushes them into useSignalStore via ingest(). The signal character is
 * coupled to the pump status so a FAILURE visibly roughens the waveform,
 * broadens the spectrum and raises the anomaly score.
 *
 * REPLACE-WITH-BACKEND: delete this hook and feed useSignalStore.ingest()
 * from a /ws/audio-features stream emitting the same fields.
 */
import { useEffect, useRef } from 'react';
import useSignalStore from '../stores/useSignalStore';
import usePumpStore from '../stores/usePumpStore';
import { AUDIO_CONFIG, STATUS } from '../utils/constants';

const N = AUDIO_CONFIG.waveformSamples;
const BINS = AUDIO_CONFIG.fftBins;
const NYQUIST = AUDIO_CONFIG.sampleRate / 2;

export default function useSignalSimulator({ fps = 12 } = {}) {
  const ingest = useSignalStore((s) => s.ingest);
  const tRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const { status, healthScore } = usePumpStore.getState();
      tRef.current += 1;
      const t = tRef.current;

      // Severity 0 (healthy) .. 1 (failing)
      const sev =
        status === STATUS.FAILURE ? 1 : status === STATUS.WARNING ? 0.5 : 0.12;
      const noiseAmp = 0.05 + sev * 0.5;
      const baseFreq = 0.18 + sev * 0.05;

      // ── Waveform (time domain) ──────────────────────────────────
      const waveform = new Array(N);
      for (let i = 0; i < N; i++) {
        const carrier = Math.sin((i + t * 4) * baseFreq) * (0.55 - sev * 0.15);
        const harmonic = Math.sin((i + t * 4) * baseFreq * 2.7) * 0.18 * (1 + sev);
        const grit = (Math.random() * 2 - 1) * noiseAmp;
        // occasional impulsive knocks when failing (cavitation-like)
        const knock = sev > 0.6 && Math.random() > 0.985 ? (Math.random() * 2 - 1) : 0;
        waveform[i] = Math.max(-1, Math.min(1, carrier + harmonic + grit + knock));
      }

      // ── Spectrum (magnitude per bin) ────────────────────────────
      const spectrum = new Array(BINS);
      const dominantBin = Math.round(BINS * (0.14 + sev * 0.03));
      let peakBin = dominantBin;
      let peakVal = 0;
      let energyAcc = 0;
      for (let b = 0; b < BINS; b++) {
        const d = b - dominantBin;
        const fundamental = Math.exp(-(d * d) / (6 + sev * 4)) * (0.9 - sev * 0.15);
        // broadband energy rises with severity (spectral spreading)
        const broadband = sev * 0.4 * Math.exp(-b / (BINS * (0.5 + sev)));
        const fl7 = Math.exp(-Math.pow(b - BINS * 0.55, 2) / 30) * sev * 0.5; // high-band fault line
        const jitter = Math.random() * 0.06;
        const v = Math.min(1, fundamental + broadband + fl7 + jitter);
        spectrum[b] = v;
        energyAcc += v * v;
        if (v > peakVal) {
          peakVal = v;
          peakBin = b;
        }
      }

      // ── Scalar metrics ──────────────────────────────────────────
      const rms = Math.sqrt(waveform.reduce((a, v) => a + v * v, 0) / N);
      const db = Math.round(20 * Math.log10(rms + 1e-4));
      const amplitude = Math.max(...waveform.map(Math.abs));
      const energy = Math.min(1, energyAcc / BINS);
      const dominantFreq = Math.round((dominantBin / BINS) * NYQUIST);
      const peakFreq = Math.round((peakBin / BINS) * NYQUIST);
      const noiseFloor = Math.round(-70 + sev * 20);
      const stability = Math.round(Math.max(0, Math.min(100, healthScore - sev * 10 + (Math.random() * 6 - 3))));
      const anomalyScore = Math.round(Math.max(0, Math.min(100, sev * 82 + (Math.random() * 12 - 6))));

      ingest({
        waveform,
        spectrum,
        rms,
        db,
        amplitude,
        energy,
        dominantFreq,
        peakFreq,
        minFreq: 60 + Math.round(sev * 40),
        noiseFloor,
        stability,
        anomalyScore,
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [ingest, fps]);
}
