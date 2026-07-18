/**
 * useMicCapture — Microphone audio capture hook (100% REAL DATA)
 *
 * Captures audio from the user's microphone via getUserMedia.
 * Resamples to 16kHz mono PCM Int16 per the frozen contract (Doc 2 §4.2).
 * Sends binary chunks (~250ms) via WebSocket to /ws/audio.
 * Extacts real-time DSP metrics (waveform, spectrum) and pushes them to useSignalStore.
 */
import { useRef, useCallback, useState } from 'react';
import { AUDIO_CONFIG, WS_ENDPOINTS } from '../utils/constants';
import useSignalStore from '../stores/useSignalStore';

export default function useMicCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const wsRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array.buffer;
  };

  const processRealTimeDSP = useCallback(() => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    
    // Waveform
    const timeData = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeData);
    
    // Resample waveform for UI (e.g. 128 samples)
    const stepW = Math.max(1, Math.floor(timeData.length / AUDIO_CONFIG.waveformSamples));
    const waveform = new Array(AUDIO_CONFIG.waveformSamples);
    let rmsAcc = 0;
    let amplitude = 0;
    for (let i = 0; i < AUDIO_CONFIG.waveformSamples; i++) {
      const val = timeData[i * stepW] || 0;
      waveform[i] = val;
    }
    
    // Process full timeData for metrics
    for (let i = 0; i < timeData.length; i++) {
      rmsAcc += timeData[i] * timeData[i];
      if (Math.abs(timeData[i]) > amplitude) amplitude = Math.abs(timeData[i]);
    }
    const rms = Math.sqrt(rmsAcc / timeData.length);
    const db = Math.round(20 * Math.log10(Math.max(rms, 1e-5)));

    // Spectrum
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);
    
    const stepF = Math.max(1, Math.floor(freqData.length / AUDIO_CONFIG.fftBins));
    const spectrum = new Array(AUDIO_CONFIG.fftBins);
    let energyAcc = 0;
    let peakVal = 0;
    let peakBin = 0;
    
    for (let i = 0; i < AUDIO_CONFIG.fftBins; i++) {
      const val = (freqData[i * stepF] || 0) / 255.0; // normalize 0..1
      spectrum[i] = val;
      energyAcc += val * val;
      if (val > peakVal) {
        peakVal = val;
        peakBin = i * stepF;
      }
    }
    
    const energy = Math.min(1, energyAcc / AUDIO_CONFIG.fftBins);
    const nyquist = AUDIO_CONFIG.sampleRate / 2;
    const dominantFreq = Math.round((peakBin / freqData.length) * nyquist);

    // Push real data to UI
    useSignalStore.getState().ingest({
      waveform,
      spectrum,
      rms,
      db,
      amplitude,
      energy,
      dominantFreq,
      peakFreq: dominantFreq,
      noiseFloor: Math.round(-80 + energy * 20),
    });

    rafRef.current = requestAnimationFrame(processRealTimeDSP);
  }, []);

  const startCapture = useCallback(async () => {
    try {
      setError(null);
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

      const audioContext = new AudioContext({ sampleRate: AUDIO_CONFIG.sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Setup AnalyserNode for Real UI Data
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const bufferSize = Math.pow(2, Math.ceil(Math.log2(
        AUDIO_CONFIG.sampleRate * AUDIO_CONFIG.chunkDuration
      )));
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      const ws = new WebSocket(WS_ENDPOINTS.audio);
      wsRef.current = ws;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmBuffer = float32ToInt16(inputData);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(pcmBuffer);
        }
      };

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
      
      // Start Real DSP Loop
      rafRef.current = requestAnimationFrame(processRealTimeDSP);

    } catch (err) {
      setError(err.message || 'No se pudo acceder al micrófono');
      console.error('[useMicCapture] Error:', err);
    }
  }, [processRealTimeDSP]);

  const stopCapture = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Flatline the charts when stopped
    useSignalStore.getState().ingest({
      waveform: new Array(AUDIO_CONFIG.waveformSamples).fill(0),
      spectrum: new Array(AUDIO_CONFIG.fftBins).fill(0),
      rms: 0, db: -100, amplitude: 0, energy: 0, dominantFreq: 0, peakFreq: 0, noiseFloor: -100
    });

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
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

  return { isCapturing, error, startCapture, stopCapture, toggleCapture };
}
