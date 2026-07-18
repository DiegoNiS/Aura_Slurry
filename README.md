# Aura-Slurry 🎙️⛏️

**Mantenimiento predictivo acústico de bajo costo para bombas de pulpa en minería.**
Hackatón IA — FLIT 2026 (Arequipa).

Convierte un micrófono de bajo costo en un sensor de salud mecánica: captura el sonido de la bomba **en vivo**, aísla su firma acústica del ruido de planta (sustracción espectral) y clasifica su estado en tiempo real en un dashboard tipo SCADA.

## Estructura del proyecto

```
aura-slurry/
├── specs/           # Documentos SDD: requerimientos, diseño, tareas
├── modelo/          # Integrante 1 — señal y clasificador (librosa + Random Forest)
│   └── notebooks/   # exploración, matriz de confusión
├── backend/         # Integrante 2 — FastAPI + WebSockets + REST
├── frontend/        # Integrante 3 — React (Vite) + Material UI + Recharts
└── demo_assets/     # WAVs de respaldo: normal, falla, ruido de mina
```

## Cómo correr (se completará durante el desarrollo)

```bash
# Backend
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

---

## 🧊 Contratos de interfaz

> **⚠️ ACTUALIZACIÓN 2026-07-18: el contrato de red se estandarizó en INGLÉS**
> (`status/confidence/alert`, estados `NORMAL|WARNING|FAILURE|CALIBRATING`).
> La fuente de verdad es **`backend/README.md`**. La versión de abajo (español)
> queda como referencia histórica del diseño.
> Frontera del modelo: `modelo/signal_processing.py` (inglés) envuelve a `modelo/senal.py` (núcleo).

> **Regla de oro:** si cambia un nombre de campo aquí, se avisa a los 3 antes de tocar código.

### 1. Módulo Modelo → Backend (contrato Python, `modelo/senal.py`)

```python
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

### 2. Backend → Frontend (contrato de red)

**WebSocket de estado (salida)** `ws://<host>/ws/estado` — mensajes en streaming:

```json
{
  "timestamp": "2026-07-18T10:30:00.000Z",
  "estado": "FALLA",
  "health_score": 22,
  "confianza": 0.91,
  "alerta": "Posible cavitación/desgaste",
  "calibrado": true
}
```

**WebSocket de ingesta (modo primario)** `ws://<host>/ws/audio` — el navegador envía el micrófono en vivo:
- Mensajes **binarios**: chunks PCM Int16, **mono, 16 kHz** (~250 ms por chunk).
- El backend bufferiza, arma ventanas de 1–2 s y clasifica en continuo.

**REST (respaldo + calibración)**

```
POST   /api/audio      (multipart: WAV pregrabado, RESPALDO) → inicia streaming sobre ese audio
POST   /api/calibrar   (multipart: WAV de ruido)             → { "calibrado": true, "segundos": N }
DELETE /api/calibrar                                          → { "calibrado": false }
GET    /api/health                                            → { "status": "ok" }
```

### 3. Umbrales de estado (Doc 2 §3.4)

Sea `p = probabilidad de "normal"`:

| Condición | Estado | Color |
|---|---|---|
| `p ≥ 0.75` | NORMAL | 🟢 verde |
| `0.45 ≤ p < 0.75` | ADVERTENCIA | 🟡 ámbar |
| `p < 0.45` | FALLA | 🔴 rojo |

`health_score = round(p * 100)`, suavizado con media móvil de ~5 ventanas.

---

## Equipo

3 integrantes: Modelo/Señal · Backend/Integración · Frontend/Pitch.
Dataset: [MIMII](https://zenodo.org/record/3384388) (Hitachi), subconjunto `pump`, canal 1, 16 kHz.
