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
    return {
        "status": _STATUS_EN[r["estado"]],
        "health_score": r["health_score"],
        "confidence": r["confianza"],
        "alert": "Possible cavitation/wear detected" if r["alerta"] else None,
    }
