# Aura-Slurry — Documento 2: Diseño y Arquitectura (SDD)

**Fase:** 2 de 3 — *Definir CÓMO se construye.*
Este documento traduce los requisitos del Documento 1 en una arquitectura concreta, contratos de datos y decisiones técnicas. Los **contratos de la Sección 4 son la interfaz sagrada entre los 3 integrantes**: congélalos temprano para trabajar en paralelo sin bloquearse.

---

## 1. Arquitectura general

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (Integrante 3)                    │
│   React + Material UI (tema SCADA oscuro) + Recharts          │
│   Semáforo · Gauge health · Gráfico temporal · Botón Calibrar │
└───────────────▲───────────────────────────┬──────────────────┘
                │ WS estado (salida en vivo) │ WS audio (mic en vivo, primario)
                │                            │ REST (WAV respaldo / calibrar)
                │                            ▼
┌───────────────┴──────────────────────────────────────────────┐
│                     BACKEND (Integrante 2)                     │
│   FastAPI · WebSocket manager · orquestación del pipeline     │
│   Endpoints REST · buffer de audio · perfil de ruido en sesión│
└───────────────▲───────────────────────────┬──────────────────┘
                │ llama a funciones puras     │
                │                            ▼
┌───────────────┴──────────────────────────────────────────────┐
│                 MODELO / SEÑAL (Integrante 1)                  │
│   librosa (sustracción espectral + MFCC)                      │
│   scikit-learn Random Forest · modelo.joblib · inferencia     │
└──────────────────────────────────────────────────────────────┘
```

**Principio de desacoplamiento:** el Módulo 1 expone **funciones puras** (audio → features → predicción) que no saben nada de web. El Módulo 2 las orquesta y las expone por red. El Módulo 3 solo consume JSON. Nadie necesita esperar a nadie para empezar.

---

## 2. Stack tecnológico

| Capa | Tecnología | Responsable |
|------|-----------|-------------|
| Procesamiento de señal | Python 3.10+, `librosa`, `numpy`, `soundfile` | Integrante 1 |
| Modelo | `scikit-learn` (RandomForestClassifier), `joblib` | Integrante 1 |
| Backend | `FastAPI`, `uvicorn`, `websockets`, `python-multipart` | Integrante 2 |
| Frontend | `React` (Vite), `Material UI`, `Recharts` | Integrante 3 |
| Repo / entrega | GitHub, README, `requirements.txt` | Los 3 |

---

## 3. Modelo de datos y pipeline de señal (detalle Módulo 1)

### 3.1 Estructura del dataset MIMII (subconjunto pump)
```
pump/
├── id_00/  ├── normal/  (WAV 10s, 16kHz, 8 canales → usar canal 1)
│           └── abnormal/
├── id_02/  ...
├── id_04/  ...
└── id_06/  ...
```
- Etiquetas reales: **binarias** (`normal`=0, `abnormal`=1).
- Anomalías reales en `pump`: fuga (leakage), contaminación, obstrucción (clogging).
- Recomendación: empezar con **un solo `id` y SNR 6 dB** (más limpio) para tener modelo funcionando rápido; luego ampliar.

### 3.2 Pipeline de features
1. Cargar WAV, tomar canal 1, resamplear a 16 kHz si aplica.
2. Segmentar en ventanas de 1–2 s.
3. (En vivo) aplicar sustracción espectral con el perfil de ruido calibrado.
4. Extraer MFCCs (`n_mfcc=20` sugerido) por ventana → agregar con media y desviación estándar → **vector de features de tamaño fijo**.
5. Alimentar el Random Forest → `predict_proba`.

### 3.3 Sustracción espectral (corazón del diferenciador)
- Calibración: promediar el espectro de magnitud (STFT) de los N segundos de "ruido de mina" → `perfil_ruido`.
- Inferencia: por cada ventana, restar `perfil_ruido` del espectro de magnitud, rectificar (clip a 0), reconstruir señal antes de extraer MFCC.
- Si no hay perfil calibrado → se omite el paso (audio pasa directo). Así el sistema nunca se rompe por falta de calibración.

### 3.4 Mapeo a estados de UI (decisión C-2 del Doc 1)
Sea `p = probabilidad de "normal"`:
- `p ≥ 0.75` → **NORMAL** (verde)
- `0.45 ≤ p < 0.75` → **ADVERTENCIA** (amarillo)  *(zona de umbral configurable)*
- `p < 0.45` → **FALLA** (rojo)

`health_score = round(p * 100)`, suavizado con media móvil de las últimas ~5 ventanas.

---

## 4. Contratos de interfaz (CONGELAR TEMPRANO — interfaz entre los 3)

### 4.1 Módulo 1 → Módulo 2 (contrato Python)
```python
# señal.py — funciones puras que el backend importará
def calibrar_ruido(audio_bytes_o_array) -> PerfilRuido: ...
def clasificar_ventana(audio_array, perfil_ruido=None) -> dict:
    # devuelve exactamente:
    return {
        "estado": "NORMAL" | "ADVERTENCIA" | "FALLA",
        "health_score": int,      # 0-100
        "confianza": float,       # 0.0-1.0 (prob de la clase predicha)
        "alerta": str | None      # p.ej. "Posible cavitación/desgaste" o None
    }
```

### 4.2 Módulo 2 → Módulo 3 (contrato de red)

**WebSocket** `ws://<host>/ws/estado` — mensajes emitidos en streaming:
```json
{
  "timestamp": "2026-07-18T10:30:00.000Z",
  "estado": "FALLA",
  "health_score": 22,
  "confianza": 0.91,
  "alerta": "Posible cavitación/desgaste",
  "calibrado": true,
  "recommendation": "Detener el motor inmediatamente y purgar la bomba para evitar cavitación severa."
}
```

**WebSocket de ingesta (modo primario — RF-01)** `ws://<host>/ws/audio` — el navegador envía el audio del micrófono en vivo:
- Mensajes **binarios**: chunks PCM Int16, **mono, 16 kHz** (~250 ms por chunk sugerido). El frontend captura con `getUserMedia` + `AudioWorklet` y remuestrea a 16 kHz antes de enviar.
- El backend bufferiza los chunks, arma ventanas de 1–2 s y las pasa al pipeline de inferencia de forma continua.
- Mientras `/ws/audio` está activo, el sistema clasifica en tiempo real sin intervención del usuario; el resultado sale por `/ws/estado`.

**REST (modo respaldo + calibración)**
```
POST /api/audio         (multipart: WAV pregrabado, RESPALDO) → inicia streaming sobre ese audio
POST /api/calibrar      (multipart: WAV de ruido)          → { "calibrado": true, "segundos": N }
DELETE /api/calibrar                                        → { "calibrado": false }
GET  /api/health                                           → { "status": "ok" }
```

> **Regla de oro:** si cambia un nombre de campo aquí, se avisa a los 3 antes de tocar código. Este contrato es la única dependencia dura entre integrantes.

---

## 5. Diseño de la interfaz (Módulo 3)

Layout tipo panel de control industrial, tema oscuro:

```
┌────────────────────────────────────────────────────────┐
│  AURA-SLURRY   ·   Bomba de pulpa #1        ● CALIBRADO │
├──────────────┬─────────────────────────────────────────┤
│              │                                          │
│   SEMÁFORO   │        GAUGE  HEALTH SCORE  (0-100)      │
│   ● ● ●      │              [ 22 ]                       │
│              │                                          │
├──────────────┴─────────────────────────────────────────┤
│   GRÁFICO TEMPORAL del health score (Recharts)          │
│   100 ┤▁▁▁▂▃▅▇▇▆▄▂▁  ← caída al introducir falla        │
├─────────────────────────────────────────────────────────┤
│  [ 🔴 MONITOREO EN VIVO ]  [ 🎙 CALIBRAR RUIDO ]  [ ▶ WAV ]│
├─────────────────────────────────────────────────────────┤
│  PANEL DE ALERTAS                                        │
│  🔴 10:30:00 — Posible cavitación/desgaste detectada     │
└─────────────────────────────────────────────────────────┘
```

Estados visuales: `NORMAL` verde, `ADVERTENCIA` ámbar, `FALLA` rojo pulsante, `CALIBRANDO` azul con spinner.

---

## 6. Estrategia de integración y blindaje de demo

- **Datos de respaldo:** grabar/descargar con anticipación: (a) WAV normal, (b) WAV de falla, (c) WAV de ruido de mina (p. ej. audio de planta de YouTube). Guardar en `/demo_assets/`.
- **Mock temprano:** Integrante 3 arranca contra un WebSocket falso que emite estados random, sin esperar al backend real. Integrante 2 arranca contra una función `clasificar_ventana` mock que devuelve el contrato antes de que el modelo real exista.
- **Orden de integración:** primero cablear el contrato (mensajes falsos fluyendo end-to-end) → luego reemplazar mocks por implementación real módulo por módulo.
- **Escenario de demo guionizado (en vivo):** micrófono captando la "bomba" en vivo → normal (verde) → introducir falla (rojo) → calibrar ruido → mostrar estabilización. Ensayarlo. Si el micrófono falla el día del evento, se repite el mismo guion con los WAV de respaldo (`POST /api/audio`).

---

## 7. Estructura de carpetas del repo

```
aura-slurry/
├── README.md
├── requirements.txt
├── modelo/                  # Integrante 1
│   ├── entrenar.py
│   ├── senal.py             # calibrar_ruido, clasificar_ventana (contrato 4.1)
│   ├── modelo.joblib
│   └── notebooks/           # exploración, matriz de confusión
├── backend/                 # Integrante 2
│   ├── main.py              # FastAPI + WebSocket + REST
│   └── ws_manager.py
├── frontend/                # Integrante 3
│   └── src/ (React + MUI)
└── demo_assets/             # WAVs de respaldo (los 3)
```
