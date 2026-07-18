"""
prueba_ab.py — Prueba A/B de la sustracción espectral (T1.14).

Demuestra el diferenciador del pitch: clasificar un audio de falla MEZCLADO
con ruido de mina, primero SIN calibrar y luego CON el perfil de ruido.

Uso:
    python prueba_ab.py --falla ../demo_assets/falla.wav --ruido ../demo_assets/ruido_mina.wav
    python prueba_ab.py --falla f.wav --ruido r.wav --ganancia 2.0 --modelo otro.joblib
"""
from __future__ import annotations

import argparse

import librosa
import numpy as np
import soundfile as sf

import senal


def cargar_mono_16k(ruta: str) -> np.ndarray:
    audio, sr = sf.read(ruta, dtype="float32", always_2d=True)
    audio = audio[:, 0]
    if sr != senal.SR:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=senal.SR)
    return audio


def clasificar_todo(audio: np.ndarray, perfil=None) -> list[dict]:
    """Clasifica todas las ventanas completas de un audio, reiniciando el suavizado."""
    n = int(senal.SR * senal.VENTANA_S)
    senal.reiniciar_suavizado()
    return [
        senal.clasificar_ventana(audio[i : i + n], perfil_ruido=perfil)
        for i in range(0, len(audio) - n + 1, n)
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="A/B de calibración de ruido")
    parser.add_argument("--falla", required=True, help="WAV de bomba con falla")
    parser.add_argument("--ruido", required=True, help="WAV de ruido de mina/planta")
    parser.add_argument("--ganancia", type=float, default=1.5, help="Volumen del ruido en la mezcla")
    parser.add_argument("--modelo", default=None, help="Ruta a modelo.joblib (opcional)")
    args = parser.parse_args()

    if args.modelo:
        senal.cargar_modelo(args.modelo)

    falla = cargar_mono_16k(args.falla)
    ruido = cargar_mono_16k(args.ruido)

    # mezclar: repetir el ruido si es más corto que la falla
    if len(ruido) < len(falla):
        ruido = np.tile(ruido, int(np.ceil(len(falla) / len(ruido))))
    mezcla = falla + args.ganancia * ruido[: len(falla)]

    # el perfil se calibra con los primeros 3 s del ruido (como haría el operador)
    perfil = senal.calibrar_ruido(ruido[: senal.SR * 3])

    sin_cal = clasificar_todo(mezcla)
    con_cal = clasificar_todo(mezcla, perfil=perfil)

    print(f"\n{'ventana':>8} | {'SIN calibrar':^24} | {'CON calibrar':^24}")
    print("-" * 64)
    for i, (a, b) in enumerate(zip(sin_cal, con_cal)):
        print(
            f"{i:>8} | {a['estado']:>12} (hs={a['health_score']:>3}) "
            f"| {b['estado']:>12} (hs={b['health_score']:>3})"
        )

    hs_sin = np.mean([r["health_score"] for r in sin_cal])
    hs_con = np.mean([r["health_score"] for r in con_cal])
    fallas_sin = sum(r["estado"] == "FALLA" for r in sin_cal)
    fallas_con = sum(r["estado"] == "FALLA" for r in con_cal)
    print("-" * 64)
    print(f"Health score promedio:  sin={hs_sin:.0f}  con={hs_con:.0f}")
    print(f"Ventanas FALLA:         sin={fallas_sin}/{len(sin_cal)}  con={fallas_con}/{len(con_cal)}")
    print(
        "\nLectura esperada: con ruido de mina encima, el sistema SIN calibrar se "
        "confunde; CON el perfil calibrado la falla se detecta de forma estable."
    )


if __name__ == "__main__":
    main()
