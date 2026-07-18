"""
generar_casos_prueba.py — Suite de audios de prueba para el aplicativo.

Genera en demo_assets/casos/ todos los escenarios de prueba y VALIDA cada
uno contra el modelo real, imprimiendo el resultado esperado (sin calibrar
y con calibración usando 03_ruido_planta.wav).

Uso:
    python generar_casos_prueba.py --data ..\\dataset\\pump
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 16000
AQUI = Path(__file__).parent
CASOS = AQUI / "casos"

sys.path.insert(0, str(AQUI.parent / "modelo"))
import senal  # noqa: E402
from generar_demo_largo import cargar_mono, fallas_detectables, tramo  # noqa: E402


def guardar(nombre: str, audio: np.ndarray) -> Path:
    ruta = CASOS / nombre
    sf.write(ruta, np.clip(audio, -1.0, 1.0).astype(np.float32), SR, subtype="PCM_16")
    return ruta


def clasificar(ruta: Path, perfil=None) -> str:
    audio, _ = sf.read(ruta, dtype="float32")
    n = SR
    senal.reiniciar_suavizado()
    rs = [senal.clasificar_ventana(audio[i : i + n], perfil)
          for i in range(0, len(audio) - n + 1, n)]
    hs = int(np.mean([r["health_score"] for r in rs]))
    return f"{rs[-1]['estado']:11} (hs≈{hs})"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Ruta a pump/ de MIMII")
    args = parser.parse_args()

    CASOS.mkdir(exist_ok=True)
    rng = np.random.default_rng(7)
    raiz = Path(args.data) / "id_00"
    normales = sorted((raiz / "normal").glob("*.wav"))
    anomalos = fallas_detectables(sorted((raiz / "abnormal").glob("*.wav")))

    normal_30 = tramo(normales, 30, rng)
    falla_30 = tramo(anomalos, 30, rng)

    # Ruido REAL del dataset: otra bomba de la MISMA fábrica (id_02) —
    # el escenario real de varias máquinas sonando a la vez.
    otras = sorted((Path(args.data) / "id_02" / "normal").glob("*.wav"))
    vecina_30 = tramo(otras, 30, rng) if otras else np.zeros(30 * SR, np.float32)

    # Ruido industrial SIMULADO de banda ancha (chancadora/ventilación):
    # el modelo NO lo tolera sin calibrar → demuestra la calibración.
    r = cargar_mono(AQUI / "ruido_mina.wav")
    mina_30 = np.tile(r, int(np.ceil(30 * SR / len(r))))[: 30 * SR]

    print("Generando casos…\n")
    # (nombre, audio, perfil para la columna CON calibrar, descripción)
    casos = [
        # ── grupo A: 100% data real del dataset MIMII ──
        ("01_normal_limpio.wav", normal_30, None,
         "REAL — bomba sana: verde siempre"),
        ("02_falla_limpia.wav", falla_30, None,
         "REAL — bomba con falla: rojo siempre"),
        ("03_bomba_vecina.wav", vecina_30[: 15 * SR], "vecina",
         "REAL — otra bomba de la planta (id_02): para calibrar el caso 04"),
        ("04_normal_con_vecina.wav", np.clip(normal_30 + 2.5 * vecina_30, -1, 1), "vecina",
         "REAL — sana + bomba vecina FUERTE: robustez (sin falsa alarma grave)"),
        ("05_falla_con_vecina.wav", np.clip(falla_30 + 1.5 * vecina_30, -1, 1), "vecina",
         "REAL — falla + bomba vecina: rojo igual"),
        ("06_transicion_normal_falla.wav",
         np.concatenate([tramo(normales, 15, rng), tramo(anomalos, 15, rng)]), None,
         "REAL — 15s sana → 15s falla: ver el semáforo girar en vivo"),
        # ── grupo B: bomba real + ruido industrial simulado ──
        ("07_ruido_mina.wav", mina_30[: 15 * SR], "mina",
         "SIMULADO — ruido de mina banda ancha: para CALIBRAR el caso 08"),
        ("08_normal_con_ruido_mina.wav", normal_30 + 0.8 * mina_30, "mina",
         "MIXTO — sana + ruido mina: FALSAS ALARMAS sin calibrar; verde con calibrar"),
        ("09_falla_con_ruido_mina.wav", falla_30 + 0.8 * mina_30, "mina",
         "MIXTO — falla + ruido mina: rojo, calibrado o no"),
        ("10_silencio.wav", rng.normal(0, 0.002, 10 * SR).astype(np.float32), None,
         "BORDE — silencio de sala (no es una bomba: esperar ámbar/rojo)"),
    ]

    rutas = {n: guardar(n, a) for n, a, _, _ in casos}
    perfiles = {
        "vecina": senal.calibrar_ruido(cargar_mono(rutas["03_bomba_vecina.wav"])[: SR * 5]),
        "mina": senal.calibrar_ruido(cargar_mono(rutas["07_ruido_mina.wav"])[: SR * 5]),
        None: None,
    }

    print(f"{'archivo':34} | {'SIN calibrar':20} | {'CON calibrar':20} | qué demuestra")
    print("-" * 130)
    for nombre, _, perfil_key, descripcion in casos:
        sin_cal = clasificar(rutas[nombre])
        con_cal = clasificar(rutas[nombre], perfiles[perfil_key]) if perfil_key else "—"
        print(f"{nombre:34} | {sin_cal:20} | {con_cal:20} | {descripcion}")

    print(f"\n{len(casos)} casos en {CASOS}")
    print("Demo de calibración: subir 08 (falsas alarmas) → calibrar con 07 → subir 08 otra vez (verde).")
    print("Demo de robustez REAL: subir 04 → el sistema no llora falsas alarmas con otra bomba al lado.")


if __name__ == "__main__":
    main()
