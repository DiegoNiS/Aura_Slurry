"""
entrenar.py — Entrena el Random Forest de Aura-Slurry sobre MIMII pump.

Uso:
    python entrenar.py --data <ruta>/pump            # usa id_00 por defecto
    python entrenar.py --data <ruta>/pump --ids id_00 id_02

Espera la estructura MIMII:
    <data>/id_00/normal/*.wav      (10 s, 16 kHz, 8 canales → se usa canal 1)
    <data>/id_00/abnormal/*.wav

Genera:
    modelo.joblib   (Random Forest serializado, compress=3)
    metrics.txt     (accuracy, matriz de confusión, reporte — material del pitch)
"""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import librosa
import numpy as np
import soundfile as sf
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from senal import SR, VENTANA_S, extraer_features

MUESTRAS_VENTANA = int(SR * VENTANA_S)


def cargar_wav_canal1(ruta: Path) -> np.ndarray:
    """Lee un WAV, toma el canal 1 y garantiza 16 kHz (T1.1)."""
    audio, sr = sf.read(ruta, dtype="float32", always_2d=True)
    audio = audio[:, 0]
    if sr != SR:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SR)
    return audio


def ventanear(audio: np.ndarray) -> list[np.ndarray]:
    """Segmenta en ventanas fijas de VENTANA_S segundos (RF-05)."""
    return [
        audio[i : i + MUESTRAS_VENTANA]
        for i in range(0, len(audio) - MUESTRAS_VENTANA + 1, MUESTRAS_VENTANA)
    ]


def features_de_archivos(archivos: list[Path], etiqueta: int):
    """WAV → ventanas → vectores MFCC. Devuelve (X, y) del conjunto."""
    X, y = [], []
    for i, ruta in enumerate(archivos):
        for ventana in ventanear(cargar_wav_canal1(ruta)):
            X.append(extraer_features(ventana))
            y.append(etiqueta)
        if (i + 1) % 100 == 0:
            print(f"    {i + 1}/{len(archivos)} archivos procesados…")
    return X, y


def main() -> None:
    parser = argparse.ArgumentParser(description="Entrena el RF de Aura-Slurry")
    parser.add_argument("--data", required=True, help="Ruta a la carpeta pump/ de MIMII")
    parser.add_argument("--ids", nargs="+", default=["id_00"], help="IDs de bomba a usar")
    parser.add_argument("--out", default=None, help="Ruta de salida del modelo.joblib")
    args = parser.parse_args()

    raiz = Path(args.data)
    salida = Path(args.out) if args.out else Path(__file__).parent / "modelo.joblib"

    # 1. Inventario de archivos por etiqueta (0=normal, 1=abnormal)
    normales, anomalos = [], []
    for id_bomba in args.ids:
        normales += sorted((raiz / id_bomba / "normal").glob("*.wav"))
        anomalos += sorted((raiz / id_bomba / "abnormal").glob("*.wav"))
    if not normales or not anomalos:
        raise SystemExit(
            f"No se encontraron WAVs en {raiz}/{args.ids}. "
            "¿Descargaste y descomprimiste 6_dB_pump.zip?"
        )
    print(f"Archivos: {len(normales)} normales, {len(anomalos)} anómalos ({args.ids})")

    # 2. Split por ARCHIVO (no por ventana) para evitar fuga de información
    #    entre train y test: las 5 ventanas de un mismo WAV van juntas.
    archivos = normales + anomalos
    etiquetas = [0] * len(normales) + [1] * len(anomalos)
    arch_train, arch_test, y_arch_train, y_arch_test = train_test_split(
        archivos, etiquetas, test_size=0.2, stratify=etiquetas, random_state=42
    )

    print("Extrayendo features de entrenamiento…")
    X_train, y_train = [], []
    for etiqueta in (0, 1):
        subset = [a for a, e in zip(arch_train, y_arch_train) if e == etiqueta]
        X, y = features_de_archivos(subset, etiqueta)
        X_train += X
        y_train += y

    print("Extrayendo features de test…")
    X_test, y_test = [], []
    for etiqueta in (0, 1):
        subset = [a for a, e in zip(arch_test, y_arch_test) if e == etiqueta]
        X, y = features_de_archivos(subset, etiqueta)
        X_test += X
        y_test += y

    X_train, y_train = np.array(X_train), np.array(y_train)
    X_test, y_test = np.array(X_test), np.array(y_test)
    print(f"Ventanas: {len(y_train)} train / {len(y_test)} test")

    # 3. Entrenar (C-3): balanced por el desbalance ~7:1 normal/abnormal;
    #    max_depth acotado mantiene el .joblib en pocos MB.
    modelo = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
    )
    modelo.fit(X_train, y_train)

    # 4. Evaluar (T1.4 — material del pitch)
    y_pred = modelo.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    matriz = confusion_matrix(y_test, y_pred)
    reporte = classification_report(y_test, y_pred, target_names=["normal", "abnormal"])

    resumen = (
        f"Aura-Slurry — evaluación del modelo (ids={args.ids}, ventana={VENTANA_S}s)\n"
        f"Ventanas: {len(y_train)} train / {len(y_test)} test (split por archivo)\n\n"
        f"Accuracy: {acc:.4f}\n\n"
        f"Matriz de confusión (filas=real, columnas=predicho) [normal, abnormal]:\n"
        f"{matriz}\n\n{reporte}"
    )
    print("\n" + resumen)
    (salida.parent / "metrics.txt").write_text(resumen, encoding="utf-8")

    # 5. Serializar (T1.5)
    joblib.dump(modelo, salida, compress=3)
    mb = salida.stat().st_size / 1e6
    print(f"Modelo guardado en {salida} ({mb:.1f} MB)")


if __name__ == "__main__":
    main()
