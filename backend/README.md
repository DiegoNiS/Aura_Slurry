# Módulo Backend / Integración — Integrante 2

Servicio en tiempo real: orquesta el modelo y lo expone por red (FastAPI + uvicorn + WebSockets).

> **Idioma del contrato: INGLÉS.** El 2026-07-18 el equipo estandarizó el contrato de red en inglés
> para que **frontend, backend y modelo** sean compatibles. Esto **reemplaza** el contrato en español
> "congelado" del `README.md` raíz §4. La UI del frontend sigue en español; solo el formato de red es inglés.

---

## Archivos

- `main.py` — App FastAPI: WebSockets, REST y el generador mock de respaldo. CORS habilitado.
- `ws_manager.py` — `ConnectionManager`: registro de conexiones y `broadcast_json()` a todos los clientes.
- `mock_model.py` — **stub** de `calibrate_noise()` / `classify_window()` mientras llega el módulo modelo real.

## Correr

```bash
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

Arranca con el **mock** activo: aunque el módulo modelo no esté listo, `main.py` emite datos cada
segundo por `/ws/status` para desbloquear al frontend.

---

## 🧊 Contrato de red (INGLÉS — fuente de verdad)

### WebSocket de estado (salida) — `ws://<host>/ws/status`

El backend emite en streaming, en continuo, este objeto JSON:

```json
{
  "timestamp": "2026-07-18T10:30:00.000Z",
  "status": "FAILURE",
  "health_score": 22,
  "confidence": 0.91,
  "alert": "Possible cavitation/wear",
  "calibrated": true
}
```

| Campo          | Tipo                                      | Notas                                   |
|----------------|-------------------------------------------|-----------------------------------------|
| `timestamp`    | string ISO-8601 (UTC)                     | `datetime.now(timezone.utc).isoformat()`|
| `status`       | `NORMAL \| WARNING \| FAILURE \| CALIBRATING` | enum en inglés                       |
| `health_score` | int 0–100                                 | `round(p * 100)`                        |
| `confidence`   | float 0.0–1.0                             | prob. de la clase predicha              |
| `alert`        | string \| null                            | mensaje de alerta o `null`              |
| `calibrated`   | bool                                      | ¿hay perfil de ruido activo?            |

> El cliente (frontend) valida la forma con `timestamp`, `status` y `health_score` presentes; mensajes
> que no cumplan se ignoran. No es necesario que el frontend envíe nada por este socket.

### WebSocket de ingesta (modo primario) — `ws://<host>/ws/audio`

- El navegador envía el micrófono en vivo: **mensajes binarios** = chunks PCM **Int16, mono, 16 kHz**.
- El backend bufferiza, arma ventanas de 1 s (`WINDOW_SIZE_BYTES = 16000 * 2 * 1`), clasifica cada
  ventana y hace `broadcast_json()` del resultado a `/ws/status`.
- Lock de concurrencia: solo una fuente de audio a la vez (`app_state["processing_audio"]`). Si ya hay
  una activa, el socket se cierra con código `1008`.

### REST

```
GET    /api/health                                   → { "status": "ok" }
POST   /api/audio      (multipart: WAV pregrabado)   → inicia streaming simulado sobre ese audio (RESPALDO)
POST   /api/calibrate  (multipart: WAV de ruido)     → { "calibrated": true, "seconds": N }
DELETE /api/calibrate                                → { "calibrated": false }
```

### Umbrales de estado (p = probabilidad de "normal")

| Condición          | `status`  | Color   |
|--------------------|-----------|---------|
| `p ≥ 0.75`         | `NORMAL`  | 🟢 verde |
| `0.45 ≤ p < 0.75`  | `WARNING` | 🟡 ámbar |
| `p < 0.45`         | `FAILURE` | 🔴 rojo  |

`health_score = round(p * 100)` (el frontend aplica suavizado de media móvil ~5 ventanas para el gauge).

---

## 🔗 Contrato con el módulo modelo (Python, en proceso) — LEER

`main.py` llama a `classify_window(...)` y lee las claves **en inglés**:

```python
result = classify_window(window, app_state["noise_profile"])
payload = {
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "status":       result["status"],      # "NORMAL" | "WARNING" | "FAILURE"
    "health_score": result["health_score"],
    "confidence":   result["confidence"],
    "alert":        result["alert"],
    "calibrated":   app_state["calibrated"],
}
```

⚠️ El `README.md` raíz §1 todavía describe la firma del modelo con claves **en español**
(`estado / confianza / alerta`). Para lograr compatibilidad **front + back + modelo**, el
`modelo/senal.py` real debe devolver claves **en inglés** (`status / confidence / alert`), tal como ya
lo hace `mock_model.py`. Alternativa: mapear español→inglés en el punto de llamada de `classify_window`.
Ver `modelo/README.md`.

Firma esperada de las funciones del modelo:

```python
def calibrate_noise(audio_bytes_or_array) -> NoiseProfile: ...

def classify_window(audio_array, noise_profile=None) -> dict:
    return {
        "status": "NORMAL" | "WARNING" | "FAILURE",
        "health_score": int,     # 0-100
        "confidence": float,     # 0.0-1.0
        "alert": str | None
    }
```

---

## Estado actual

- ✅ WebSockets `/ws/status` y `/ws/audio` operativos.
- ✅ REST `/api/health`, `/api/audio`, `/api/calibrate` (POST/DELETE).
- ✅ Generador mock (1 Hz) para desarrollo del frontend sin modelo real.
- ⏳ Integrar `modelo/senal.py` real (reemplazar `mock_model.py`) respetando las claves en inglés.

## Próximos pasos sugeridos

- Serializar payloads con `orjson` (varias emisiones por segundo).
- Config por entorno con `pydantic-settings` (host, puerto, orígenes CORS, umbrales).
- Tests de rutas y WebSockets con `pytest` + `httpx` (TestClient de FastAPI).
- Logging estructurado con `loguru` para depurar buffers de audio y desconexiones.
