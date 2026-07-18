# Módulo Modelo / Señal — Integrante 1

Algoritmia de audio: el "cerebro" del sistema como **funciones puras** (no sabe nada de web).

## Archivos esperados

- `entrenar.py` — script de entrenamiento reproducible sobre MIMII `pump` (canal 1, 16 kHz).
- `senal.py` — implementa el contrato congelado (ver README raíz): `calibrar_ruido()` y `clasificar_ventana()`.
- `modelo.joblib` — Random Forest serializado (usar `compress=3` para mantenerlo en pocos MB).
- `notebooks/` — exploración, matriz de confusión, prueba A/B de sustracción espectral.

## Pipeline

WAV/chunk → canal 1 → 16 kHz → (sustracción espectral si hay perfil) → MFCC (`n_mfcc=20`, media+std) → Random Forest → `predict_proba` → estado + health score.
