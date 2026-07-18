"""
signal_processing.py — Adaptador INGLÉS del módulo modelo (frontera con el backend).

`backend/main.py` importa de aquí `calibrate_noise` y `classify_window`.
Toda la algoritmia vive en `senal.py` (mismos parámetros que el entrenamiento:
n_fft=1024, hop=256, MFCC 20 media+std, suavizado de 5 ventanas). Este archivo
solo decodifica la entrada (bytes WAV / bytes PCM Int16 / arrays) y traduce
las claves del contrato español→inglés.
"""
from __future__ import annotations

import io

import librosa
import numpy as np
import soundfile as sf

try:
    from . import senal  # importado como paquete: modelo.signal_processing
except ImportError:
    import senal  # importado directo desde la carpeta modelo/

SAMPLE_RATE = senal.SR

_STATUS_EN = {"NORMAL": "NORMAL", "ADVERTENCIA": "WARNING", "FALLA": "FAILURE"}


def _decode(audio) -> np.ndarray:
    """Normaliza cualquier entrada a float32 mono 16 kHz.

    Acepta: bytes de un archivo WAV completo (con header RIFF, cualquier
    subtipo/canales/sr), bytes PCM Int16 crudos (chunks del mic en vivo),
    o np.ndarray directo.
    """
    if isinstance(audio, (bytes, bytearray, memoryview)):
        data = bytes(audio)
        if data[:4] == b"RIFF":
            arr, sr = sf.read(io.BytesIO(data), dtype="float32", always_2d=True)
            arr = arr[:, 0]
            if sr != SAMPLE_RATE:
                arr = librosa.resample(arr, orig_sr=sr, target_sr=SAMPLE_RATE)
            return arr
        # PCM Int16 crudo: descartar el byte impar residual si lo hubiera
        if len(data) % 2:
            data = data[:-1]
        return np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
    return senal._a_float_mono(audio)


def wav_bytes_to_pcm16(data: bytes) -> bytes:
    """Bytes de archivo WAV → bytes PCM Int16 mono 16 kHz (para ventanear)."""
    arr = _decode(data)
    return (np.clip(arr, -1.0, 1.0) * 32767).astype(np.int16).tobytes()


def reset_smoothing() -> None:
    """Limpia la media móvil del health score (llamar al cambiar de fuente)."""
    senal.reiniciar_suavizado()


def calibrate_noise(audio_bytes_or_array):
    """Perfil de ruido (espectro de magnitud promedio) desde WAV/PCM/array."""
    return senal.calibrar_ruido(_decode(audio_bytes_or_array))


def signal_features(audio_bytes_or_array) -> dict:
    """Features REALES de la señal para las visualizaciones del dashboard.

    Devuelve el frame que consume useSignalStore.ingest() en el frontend:
    waveform (128 pts), spectrum (48 bins 0..1), rms, db, dominantFreq,
    peakFreq, minFreq, energy, noiseFloor, amplitude, stability.
    (anomalyScore lo agrega el backend desde el health score del modelo.)
    """
    audio = _decode(audio_bytes_or_array)
    if audio.size < senal.N_FFT:
        audio = np.pad(audio, (0, senal.N_FFT - audio.size))

    # ── forma de onda: 128 puntos conservando picos (con signo) ──
    bordes = np.linspace(0, audio.size, 129).astype(int)
    waveform = []
    for i in range(128):
        seg = audio[bordes[i]: bordes[i + 1]]
        waveform.append(float(seg[np.argmax(np.abs(seg))]) if seg.size else 0.0)
    # escala visual estable: no amplificar el silencio
    pico = max(0.05, max(abs(v) for v in waveform))
    waveform = [round(v / pico, 3) for v in waveform]

    # ── espectro: STFT → magnitud media → 48 bins comprimidos ──
    stft = librosa.stft(audio, n_fft=senal.N_FFT, hop_length=senal.HOP)
    mag = np.abs(stft)
    perfil = mag.mean(axis=1)  # (513,) magnitud media por frecuencia
    freqs = np.linspace(0, senal.SR / 2, perfil.size)
    grupos = np.array_split(perfil, 48)
    esp = np.array([g.mean() for g in grupos])
    esp_max = esp.max() + 1e-9
    spectrum = [round(float(v), 3) for v in np.sqrt(esp / esp_max)]

    # ── métricas escalares ──
    rms = float(np.sqrt(np.mean(audio**2)))
    db = round(20 * np.log10(rms + 1e-9), 1)
    relevante = perfil > 0.1 * perfil.max()
    dominant = float(freqs[1:][np.argmax(perfil[1:])])  # sin el bin DC
    peak = float(freqs[relevante].max()) if relevante.any() else dominant
    fmin = float(freqs[relevante].min()) if relevante.any() else 0.0
    noise_floor = round(20 * np.log10(np.percentile(perfil, 10) / esp_max + 1e-9), 1)

    # estabilidad: qué tan constante es la energía entre frames (0-100)
    rms_frames = np.sqrt((mag**2).mean(axis=0))
    variacion = float(rms_frames.std() / (rms_frames.mean() + 1e-9))
    stability = int(np.clip(100 * (1 - variacion), 0, 100))

    return {
        "waveform": waveform,
        "spectrum": spectrum,
        "rms": round(rms, 4),
        "db": db,
        "dominantFreq": int(dominant),
        "peakFreq": int(peak),
        "minFreq": int(fmin),
        "energy": round(min(1.0, rms * 8), 3),
        "noiseFloor": noise_floor,
        "amplitude": round(float(np.abs(audio).max()), 3),
        "stability": stability,
    }


def classify_window(audio_bytes_or_array, noise_profile=None) -> dict:
    """Clasifica una ventana y devuelve el contrato en inglés.

    { "status": NORMAL|WARNING|FAILURE, "health_score": int,
      "confidence": float, "alert": str|None }
    """
    try:
        r = senal.clasificar_ventana(_decode(audio_bytes_or_array), noise_profile)
    except FileNotFoundError:
        return {
            "status": "WARNING",
            "health_score": 50,
            "confidence": 0.0,
            "alert": "Model not loaded (modelo.joblib missing — run entrenar.py)",
        }
    status_en = _STATUS_EN[r["estado"]]
    alert_msg = None
    
    if status_en == "FAILURE":
        alert_msg = "🚨 CRÍTICO: Posible cavitación o desgaste severo detectado. Se sugiere inspección física inmediata."
    elif status_en == "WARNING":
        alert_msg = "⚠️ ADVERTENCIA: Firma acústica fuera de lo normal. Fluctuaciones menores detectadas."

    return {
        "status": status_en,
        "health_score": r["health_score"],
        "confidence": r["confianza"],
        "alert": alert_msg,
    }
