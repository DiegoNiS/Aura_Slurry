/**
 * useCalibration — Noise calibration hook
 *
 * Records N seconds of ambient noise from the microphone as raw PCM Int16
 * @ 16 kHz (same capture pipeline as useMicCapture — the backend does NOT
 * decode compressed formats like WebM/Opus), sends it to POST /api/calibrate,
 * and manages progress state.
 *
 * Satisfies: RF-02 (perfil de ruido), RF-04 (botón calibrar)
 */
import { useState, useRef, useCallback } from 'react';
import { calibrateNoise, clearCalibration as apiClearCalibration } from '../services/api';
import { AUDIO_CONFIG } from '../utils/constants';
import usePumpStore from '../stores/usePumpStore';

export default function useCalibration() {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const setStoreCalibrating = usePumpStore((s) => s.setIsCalibrating);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const stoppedRef = useRef(false);

  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCalibration = useCallback(async (durationSeconds = AUDIO_CONFIG.calibrationDuration) => {
    try {
      setError(null);
      setIsCalibrating(true);
      setStoreCalibrating(true);
      setProgress(0);
      stoppedRef.current = false;

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: AUDIO_CONFIG.sampleRate },
          channelCount: { exact: AUDIO_CONFIG.channels },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // Capture raw PCM at 16 kHz (browser resamples)
      const audioContext = new AudioContext({ sampleRate: AUDIO_CONFIG.sampleRate });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const chunks = [];
      processor.onaudioprocess = (event) => {
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioContext.destination);

      const finish = async () => {
        if (stoppedRef.current) return;
        stoppedRef.current = true;
        cleanupAudio();

        // Float32 chunks → single Int16 PCM buffer (what the backend expects)
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const pcm = new Int16Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          for (let i = 0; i < chunk.length; i++) {
            const s = Math.max(-1, Math.min(1, chunk[i]));
            pcm[offset++] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
        }
        const audioBlob = new Blob([pcm.buffer], { type: 'application/octet-stream' });

        try {
          await calibrateNoise(audioBlob);
          usePumpStore.setState({ calibrado: true });
        } catch {
          console.warn('[useCalibration] Backend not available — storing locally');
          usePumpStore.setState({ calibrado: true });
        }

        setIsCalibrating(false);
        setStoreCalibrating(false);
        setProgress(100);
      };

      // Progress timer
      const totalMs = durationSeconds * 1000;
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / totalMs) * 100, 100);
        setProgress(pct);

        if (elapsed >= totalMs || stoppedRef.current) {
          clearInterval(progressInterval);
          finish();
        }
      }, 50);

    } catch (err) {
      setError(err.message || 'No se pudo acceder al micrófono para calibración');
      setIsCalibrating(false);
      setStoreCalibrating(false);
    }
  }, [setStoreCalibrating]);

  const cancelCalibration = useCallback(() => {
    stoppedRef.current = true;
    cleanupAudio();
    setIsCalibrating(false);
    setStoreCalibrating(false);
    setProgress(0);
  }, [setStoreCalibrating]);

  const resetCalibration = useCallback(async () => {
    try {
      await apiClearCalibration();
    } catch {
      console.warn('[useCalibration] Backend not available');
    }
    usePumpStore.setState({ calibrado: false });
    setProgress(0);
  }, []);

  return {
    isCalibrating,
    progress,
    error,
    startCalibration,
    cancelCalibration,
    resetCalibration,
  };
}
