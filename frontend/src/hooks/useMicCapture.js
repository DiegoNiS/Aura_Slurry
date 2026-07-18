/**
 * useMicCapture — Microphone audio capture hook
 *
 * Captures audio from the user's microphone via getUserMedia.
 * Resamples to 16kHz mono PCM Int16 per the frozen contract (Doc 2 §4.2).
 * Sends binary chunks (~250ms) via WebSocket to /ws/audio.
 *
 * Satisfies: RF-01 (captura en vivo), RF-01b (stream continuo de chunks)
 */
import { useRef, useCallback, useState } from 'react';
import { AUDIO_CONFIG, WS_ENDPOINTS } from '../utils/constants';

export default function useMicCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const wsRef = useRef(null);

  /**
   * Convert Float32 audio samples to Int16 PCM buffer.
   * This is what the backend expects per the frozen contract.
   */
  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array.buffer;
  };

  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request mic access
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

      // Create AudioContext at 16kHz (browser will resample automatically)
      const audioContext = new AudioContext({
        sampleRate: AUDIO_CONFIG.sampleRate,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Calculate buffer size for ~250ms chunks at 16kHz
      const bufferSize = Math.pow(2, Math.ceil(Math.log2(
        AUDIO_CONFIG.sampleRate * AUDIO_CONFIG.chunkDuration
      )));

      // Use ScriptProcessorNode for maximum browser compatibility
      // (AudioWorkletNode is preferred but requires separate file)
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      // Open WebSocket for audio streaming
      const ws = new WebSocket(WS_ENDPOINTS.audio);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[useMicCapture] WebSocket /ws/audio connected');
      };

      ws.onerror = () => {
        console.warn('[useMicCapture] WebSocket /ws/audio error — backend may not be running');
      };

      // Process audio data and send as PCM Int16
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Convert to Int16 PCM
        const pcmBuffer = float32ToInt16(inputData);

        // Send binary data if WS is open
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(pcmBuffer);
        }
      };

      // Connect the pipeline
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
    } catch (err) {
      setError(err.message || 'No se pudo acceder al micrófono');
      console.error('[useMicCapture] Error:', err);
    }
  }, []);

  const stopCapture = useCallback(() => {
    // Disconnect audio processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsCapturing(false);
  }, []);

  const toggleCapture = useCallback(() => {
    if (isCapturing) {
      stopCapture();
    } else {
      startCapture();
    }
  }, [isCapturing, startCapture, stopCapture]);

  return {
    isCapturing,
    error,
    startCapture,
    stopCapture,
    toggleCapture,
  };
}
