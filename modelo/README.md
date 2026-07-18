# Módulo Modelo / Señal — Integrante 1

Algoritmia de audio: el "cerebro" del sistema como **funciones puras** (no sabe nada de web).

> **Idioma del contrato: INGLÉS.** El 2026-07-18 el equipo estandarizó el contrato en inglés para que
> **frontend, backend y modelo** sean compatibles. Esto **reemplaza** las claves en español del
> `README.md` raíz §1. Concretamente: `estado→status`, `confianza→confidence`, `alerta→alert`
> (y estados `ADVERTENCIA→WARNING`, `FALLA→FAILURE`). `health_score` no cambia.

---

## Archivos esperados

- `senal.py` — implementa el contrato (abajo): `calibrate_noise()` y `classify_window()`.
- `entrenar.py` — script de entrenamiento reproducible sobre MIMII `pump` (canal 1, 16 kHz).
- `modelo.joblib` — Random Forest serializado (usar `joblib.dump(..., compress=3)` para pocos MB).
- `notebooks/` — exploración, matriz de confusión, prueba A/B de sustracción espectral.

## 🧊 Contrato Python (INGLÉS) — el backend depende de esto

`backend/main.py` importa estas dos funciones y **lee las claves en inglés**. El stub actual
(`backend/mock_model.py`) ya cumple este contrato; tu `senal.py` real debe devolver lo mismo.

```python
def calibrate_noise(audio_bytes_or_array) -> NoiseProfile:
    """Devuelve un perfil de ruido (lo que necesite la sustracción espectral)."""
    ...

def classify_window(audio_array, noise_profile=None) -> dict:
    # DEBE devolver exactamente estas claves, en inglés:
    return {
        "status": "NORMAL" | "WARNING" | "FAILURE",  # enum en inglés
        "health_score": int,      # 0-100
        "confidence": float,      # 0.0-1.0 (prob. de la clase predicha)
        "alert": str | None       # p.ej. "Possible cavitation/wear" o None
    }
```

### Umbrales (sea `p` = probabilidad de "normal")

| Condición          | `status`  |
|--------------------|-----------|
| `p ≥ 0.75`         | `NORMAL`  |
| `0.45 ≤ p < 0.75`  | `WARNING` |
| `p < 0.45`         | `FAILURE` |

`health_score = round(p * 100)`.

> ⚠️ Si prefieres mantener nombres en español dentro de `senal.py`, **no** expongas esas claves:
> traduce al inglés en el `return` de `classify_window`. El backend **no** hace la traducción por ti
> (lee `result["status"]`, `result["confidence"]`, `result["alert"]` directamente).

---

## Pipeline

```
WAV/chunk → canal 1 → 16 kHz
          → (sustracción espectral si hay noise_profile)
          → MFCC (n_mfcc=20, media+std)
          → Random Forest → predict_proba
          → status + health_score + confidence + alert
```

## Dataset

[MIMII](https://zenodo.org/record/3384388) (Hitachi), subconjunto `pump`, canal 1, 16 kHz.

## Librerías sugeridas

- `librosa` (MFCC, STFT), `soundfile`, `numpy`, `scikit-learn` (RandomForest), `joblib` — ya en `requirements.txt`.
- Opcionales para subir calidad: `noisereduce` (sustracción espectral lista), `imbalanced-learn`
  (MIMII está desbalanceado hacia "normal"), `audiomentations` (augmentación con ruido de planta),
  `matplotlib`/`seaborn` (matriz de confusión en los notebooks).

## Checklist de integración

- [ ] `classify_window` devuelve las 4 claves en inglés con los tipos correctos.
- [ ] `status` usa el enum `NORMAL | WARNING | FAILURE` (nunca español).
- [ ] `calibrate_noise` acepta bytes o array y devuelve un perfil usable por la sustracción espectral.
- [ ] Reemplazar `backend/mock_model.py` por `import` de `senal.py` en `backend/main.py`.
- [ ] Verificar de extremo a extremo: mic → `/ws/audio` → `classify_window` → `/ws/status` → dashboard.
