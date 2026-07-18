# Módulo Backend / Integración — Integrante 2

Servicio en tiempo real: orquesta el modelo y lo expone por red (FastAPI + uvicorn).

## Archivos esperados

- `main.py` — FastAPI: WebSockets `/ws/audio` (ingesta mic en vivo, primario) y `/ws/estado` (salida), REST `/api/audio` (WAV respaldo), `/api/calibrar`, `/api/health`. CORS habilitado.
- `ws_manager.py` — gestor de conexiones WebSocket.

## Correr

```bash
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

Arrancar con el **mock** de `clasificar_ventana` (contrato en README raíz) para no esperar al módulo modelo.
