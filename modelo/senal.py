"""
senal.py — Módulo 1 (Modelo/Señal) de Aura-Slurry.

Funciones puras del contrato congelado (ver README raíz, sección Contratos).
No sabe nada de web: el audio entra como np.ndarray (o bytes PCM Int16),
sale un dict con estado / health_score / confianza / alerta.

El backend (Integrante 2) importa:
    from modelo.senal import calibrar_ruido, clasificar_ventana
"""
from __future__ import annotations

from collections import deque
from pathlib import Path

import joblib
import librosa
import numpy as np

# ── Parámetros del pipeline (mismos valores en entrenamiento e inferencia) ──
SR = 16000               # frecuencia de muestreo de trabajo (MIMII)
N_MFCC = 20
N_FFT = 1024
HOP = 256
VENTANA_S = 2.0          # segundos por ventana de inferencia
UMBRAL_NORMAL = 0.75     # p_normal ≥ → NORMAL
UMBRAL_FALLA = 0.45      # p_normal <  → FALLA
VENTANAS_SUAVIZADO = 5   # media móvil del health score (evita parpadeo)

# El perfil de ruido es el espectro de magnitud promedio: shape (N_FFT//2 + 1,)
PerfilRuido = np.ndarray

_RUTA_MODELO = Path(__file__).parent / "modelo.joblib"
_modelo = None
_historial_p: deque = deque(maxlen=VENTANAS_SUAVIZADO)


# ─────────────────────────── utilidades internas ───────────────────────────

def _a_float_mono(audio) -> np.ndarray:
    """Normaliza cualquier entrada a float32 mono en [-1, 1].

    Acepta int16 (chunks PCM del micrófono en vivo), float, y multicanal
    (toma el canal 1, como en MIMII).
    """
    audio = np.asarray(audio)
    if audio.dtype == np.int16:
        audio = audio.astype(np.float32) / 32768.0
    audio = audio.astype(np.float32)
    if audio.ndim > 1:
        # (frames, canales) o (canales, frames) → canal 1
        audio = audio[:, 0] if audio.shape[0] >= audio.shape[1] else audio[0]
    return audio


def extraer_features(audio: np.ndarray) -> np.ndarray:
    """MFCC (n_mfcc=20) → media + desviación estándar por coeficiente.

    Devuelve un vector fijo de 40 features (RF-06). Se usa idéntico en
    entrenamiento (entrenar.py) e inferencia.
    """
    mfcc = librosa.feature.mfcc(
        y=audio, sr=SR, n_mfcc=N_MFCC, n_fft=N_FFT, hop_length=HOP
    )
    return np.concatenate([mfcc.mean(axis=1), mfcc.std(axis=1)])


def cargar_modelo(ruta=None):
    """Carga (o recarga) modelo.joblib. El backend puede llamarla al arrancar."""
    global _modelo
    _modelo = joblib.load(ruta or _RUTA_MODELO)
    return _modelo


def reiniciar_suavizado() -> None:
    """Limpia la media móvil. Llamar al cambiar de fuente de audio."""
    _historial_p.clear()


# ──────────────── sustracción espectral (RF-02 / RF-03) ────────────────────

def calibrar_ruido(audio) -> PerfilRuido:
    """Promedia el espectro de magnitud del ruido de planta → perfil (RF-02)."""
    audio = _a_float_mono(audio)
    stft = librosa.stft(audio, n_fft=N_FFT, hop_length=HOP)
    return np.abs(stft).mean(axis=1)


def _sustraer_ruido(audio: np.ndarray, perfil: PerfilRuido) -> np.ndarray:
    """Resta el perfil del espectro, rectifica y reconstruye la señal (RF-03)."""
    stft = librosa.stft(audio, n_fft=N_FFT, hop_length=HOP)
    mag, fase = np.abs(stft), np.angle(stft)
    mag_limpia = np.clip(mag - perfil[:, None], 0.0, None)
    return librosa.istft(
        mag_limpia * np.exp(1j * fase), hop_length=HOP, length=len(audio)
    )


# ───────────────────── inferencia (contrato 4.1) ───────────────────────────

def clasificar_ventana(audio_array, perfil_ruido: PerfilRuido | None = None) -> dict:
    """Clasifica una ventana de audio y devuelve el dict del contrato.

    Si perfil_ruido es None el paso de sustracción se omite y el pipeline
    funciona igual (T1.13): el sistema nunca se rompe por falta de calibración.
    """
    global _modelo
    if _modelo is None:
        cargar_modelo()

    audio = _a_float_mono(audio_array)
    if perfil_ruido is not None:
        audio = _sustraer_ruido(audio, perfil_ruido)

    feats = extraer_features(audio).reshape(1, -1)
    proba = _modelo.predict_proba(feats)[0]
    idx_normal = int(np.where(_modelo.classes_ == 0)[0][0])  # 0=normal, 1=abnormal
    p_normal = float(proba[idx_normal])

    _historial_p.append(p_normal)
    p_suave = float(np.mean(_historial_p))

    if p_suave >= UMBRAL_NORMAL:
        estado = "NORMAL"
    elif p_suave >= UMBRAL_FALLA:
        estado = "ADVERTENCIA"
    else:
        estado = "FALLA"

    return {
        "estado": estado,
        "health_score": int(round(p_suave * 100)),
        "confianza": round(float(max(p_normal, 1.0 - p_normal)), 3),
        "alerta": "Posible cavitación/desgaste" if estado == "FALLA" else None,
    }
