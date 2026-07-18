"""
preparar_assets.py — Genera los WAVs de respaldo de la demo (T0.4).

Toma archivos del dataset MIMII y produce en demo_assets/:
    normal.wav           bomba operando normal (mono, 16 kHz, canal 1)
    falla.wav            bomba con anomalía
    ruido_mina.wav       ruido de planta (real si se pasa --ruido, sintético si no)
    falla_con_ruido.wav  mezcla falla + ruido (para la prueba A/B y la demo)

Uso (tras descargar el dataset):
    python preparar_assets.py --data ..\\dataset\\pump
    python preparar_assets.py --data ..\\dataset\\pump --ruido mi_ruido_real.wav
"""
from __future__ import annotations

import argparse
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

SR = 16000
AQUI = Path(__file__).parent


def cargar_mono_16k(ruta: Path) -> np.ndarray:
    audio, sr = sf.read(ruta, dtype="float32", always_2d=True)
    audio = audio[:, 0]
    if sr != SR:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SR)
    return audio


def ruido_sintetico(segundos: int = 10) -> np.ndarray:
    """Placeholder de ruido de planta: rumble grave + banda ancha + zumbido 50 Hz.

    Sirve para ensayar la demo hasta conseguir una grabación real
    (p. ej. audio de planta concentradora de YouTube).
    """
    rng = np.random.default_rng(7)
    n = SR * segundos
    t = np.arange(n) / SR
    blanco = rng.normal(0, 1, n)
    # rumble: ruido blanco filtrado paso-bajo (media móvil ancha)
    rumble = np.convolve(blanco, np.ones(400) / 400, mode="same")
    rumble /= np.abs(rumble).max()
    zumbido = 0.2 * np.sin(2 * np.pi * 50 * t) + 0.1 * np.sin(2 * np.pi * 150 * t)
    ruido = 0.6 * rumble + zumbido + 0.15 * blanco / np.abs(blanco).max()
    return (0.5 * ruido / np.abs(ruido).max()).astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera los WAVs de demo_assets")
    parser.add_argument("--data", required=True, help="Ruta a la carpeta pump/ de MIMII")
    parser.add_argument("--id", default="id_00", help="ID de bomba a usar")
    parser.add_argument("--ruido", default=None, help="WAV de ruido de planta real (opcional)")
    parser.add_argument("--ganancia", type=float, default=1.5, help="Volumen del ruido en la mezcla")
    args = parser.parse_args()

    raiz = Path(args.data) / args.id
    normales = sorted((raiz / "normal").glob("*.wav"))
    anomalos = sorted((raiz / "abnormal").glob("*.wav"))
    if not normales or not anomalos:
        raise SystemExit(f"No hay WAVs en {raiz}. ¿Dataset descomprimido?")

    normal = cargar_mono_16k(normales[0])
    falla = cargar_mono_16k(anomalos[0])

    if args.ruido:
        ruido = cargar_mono_16k(Path(args.ruido))
        if len(ruido) < len(falla):
            ruido = np.tile(ruido, int(np.ceil(len(falla) / len(ruido))))
        ruido = ruido[: len(falla)]
        origen = f"real ({args.ruido})"
    else:
        ruido = ruido_sintetico(int(len(falla) / SR))
        origen = "sintético (placeholder — reemplazar con grabación real)"

    mezcla = falla + args.ganancia * ruido[: len(falla)]
    mezcla = (mezcla / np.abs(mezcla).max() * 0.9).astype(np.float32)

    sf.write(AQUI / "normal.wav", normal, SR)
    sf.write(AQUI / "falla.wav", falla, SR)
    sf.write(AQUI / "ruido_mina.wav", ruido, SR)
    sf.write(AQUI / "falla_con_ruido.wav", mezcla, SR)

    print(f"Assets generados en {AQUI} (fuente: {args.id}, ruido {origen}):")
    for nombre in ("normal.wav", "falla.wav", "ruido_mina.wav", "falla_con_ruido.wav"):
        kb = (AQUI / nombre).stat().st_size // 1024
        print(f"  {nombre:24} {kb:>6} KB")


if __name__ == "__main__":
    main()
