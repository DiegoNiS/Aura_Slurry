"""
generar_demo_largo.py — Construye demo_largo.wav: un audio continuo (~3 min)
que simula la vida de la bomba en tiempo real para la demo.

Arco narrativo (al subirlo por POST /api/audio, 1 ventana = 1 segundo):
    0:00–1:00  bomba NORMAL estable (verde)
    1:00–1:30  entra ruido de planta sobre bomba sana → falsas alarmas si NO
               está calibrado (aquí se pulsa "Calibrar" en la demo)
    1:30–2:30  aparece la FALLA real (rojo, alertas)
    2:30–3:00  vuelve a NORMAL (mantenimiento realizado)

Uso:
    python generar_demo_largo.py --data ..\\dataset\\pump
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 16000
AQUI = Path(__file__).parent


def cargar_mono(ruta: Path) -> np.ndarray:
    audio, _ = sf.read(ruta, dtype="float32", always_2d=True)
    return audio[:, 0]


def tramo(archivos: list[Path], segundos: int, rng) -> np.ndarray:
    """Concatena WAVs (elegidos al azar) hasta cubrir la duración pedida."""
    piezas, total = [], 0
    while total < segundos * SR:
        piezas.append(cargar_mono(archivos[rng.integers(0, len(archivos))]))
        total += len(piezas[-1])
    return np.concatenate(piezas)[: segundos * SR]


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera demo_largo.wav")
    parser.add_argument("--data", required=True, help="Ruta a la carpeta pump/ de MIMII")
    parser.add_argument("--id", default="id_00")
    args = parser.parse_args()

    rng = np.random.default_rng(42)
    raiz = Path(args.data) / args.id
    normales = sorted((raiz / "normal").glob("*.wav"))
    anomalos = sorted((raiz / "abnormal").glob("*.wav"))
    if not normales or not anomalos:
        raise SystemExit(f"No hay WAVs en {raiz}")

    ruido = cargar_mono(AQUI / "ruido_mina.wav")

    # tramos del guion
    t_normal = tramo(normales, 60, rng)
    t_sana_ruido = tramo(normales, 30, rng)
    t_falla = tramo(anomalos, 60, rng)
    t_final = tramo(normales, 30, rng)

    ruido_loop = np.tile(ruido, int(np.ceil(30 * SR / len(ruido))))[: 30 * SR]
    t_sana_ruido = t_sana_ruido + 0.6 * ruido_loop

    audio = np.concatenate([t_normal, t_sana_ruido, t_falla, t_final])
    audio = np.clip(audio / np.abs(audio).max() * 0.9, -1.0, 1.0)

    salida = AQUI / "demo_largo.wav"
    sf.write(salida, audio, SR, subtype="PCM_16")
    mb = salida.stat().st_size / 1e6
    print(f"{salida} generado: {len(audio)/SR:.0f}s, {mb:.1f} MB")
    print("Guion: 0-60s NORMAL | 60-90s sana+ruido (calibrar aquí) | 90-150s FALLA | 150-180s NORMAL")


if __name__ == "__main__":
    main()
