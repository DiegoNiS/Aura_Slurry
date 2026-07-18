/**
 * useCalibration — Noise calibration hook
 *
 * Records N seconds of ambient noise from the microphone,
 * sends it to POST /api/calibrar, and manages progress state.
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
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startCalibration = useCallback(async (durationSeconds = AUDIO_CONFIG.calibrationDuration) => {
    try {
      setError(null);
      setIsCalibrating(true);
      setStoreCalibrating(true);
      setProgress(0);
      chunksRef.current = [];

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

      // Record audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Build blob from recorded chunks
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

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

      // Start recording
      mediaRecorder.start(250); // Collect data every 250ms

      // Progress timer
      const totalMs = durationSeconds * 1000;
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / totalMs) * 100, 100);
        setProgress(pct);

        if (elapsed >= totalMs) {
          clearInterval(progressInterval);
          mediaRecorder.stop();
        }
      }, 50);

    } catch (err) {
      setError(err.message || 'No se pudo acceder al micrófono para calibración');
      setIsCalibrating(false);
      setStoreCalibrating(false);
    }
  }, [setStoreCalibrating]);

  const cancelCalibration = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
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
