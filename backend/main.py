from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import asyncio
import io
import random
import time
from dotenv import load_dotenv

from ws_manager import manager
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from modelo.signal_processing import (
    calibrate_noise,
    classify_window,
    reset_smoothing,
    wav_bytes_to_pcm16,
)
from ai_recommender import get_pump_recommendation_async

# Load env variables (for Gemini API Key)
load_dotenv()

app = FastAPI(title="Aura-Slurry Backend")

# CORS: wildcard + credentials es inválido según la spec (auditoría #2).
# No usamos cookies ni credenciales → credentials en False hace válido el "*".
# En producción: lista explícita de orígenes vía variable de entorno.
app.add_middleware(
    CORSMiddleware,
    # Origen configurable para el deploy (Render) — default "*" para la demo
    # local. credentials=False: wildcard+credentials es inválido (auditoría)
    # y no usamos cookies.
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state (for an MVP without a database)
app_state = {
    "noise_profile": None,
    "calibrated": False,
    "processing_audio": False,  # Concurrency lock
    "current_recommendation": None,
    "last_status": None,
    "last_recommendation_time": 0.0
}

# MOCK_WHEN_IDLE=0 desactiva el generador mock (para demo/pruebas reales,
# donde no debe haber datos inventados cuando no fluye audio)
MOCK_WHEN_IDLE = os.getenv("MOCK_WHEN_IDLE", "1") == "1"

# Audio constants
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2  # Int16
WINDOW_SECONDS = 1
WINDOW_SIZE_BYTES = SAMPLE_RATE * BYTES_PER_SAMPLE * WINDOW_SECONDS
MAX_UPLOAD_BYTES = 60 * 1024 * 1024  # ~60 MB ≈ 30 min de WAV 16k mono (anti-DoS)


async def leer_upload_validado(file: UploadFile) -> bytes:
    """Lee un archivo subido con validación básica (auditoría #5)."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Archivo demasiado grande (máx {MAX_UPLOAD_BYTES // 1024 // 1024} MB)",
        )
    return data
RECOMMENDATION_COOLDOWN_SECONDS = 30 * 60  # 30 minutes

async def trigger_recommendation_if_needed(status: str, health_score: int, alert: str):
    """
    Checks if a new recommendation should be generated.
    Triggers generation asynchronously if status changed or cooldown passed.
    """
    current_time = time.time()
    time_since_last = current_time - app_state["last_recommendation_time"]
    
    if status != app_state["last_status"] or time_since_last >= RECOMMENDATION_COOLDOWN_SECONDS:
        # Update trackers immediately to prevent spamming
        app_state["last_status"] = status
        app_state["last_recommendation_time"] = current_time
        
        # Fire and forget the LLM call
        async def fetch_and_update():
            recommendation = await get_pump_recommendation_async(status, health_score, alert)
            app_state["current_recommendation"] = recommendation
            
        asyncio.create_task(fetch_and_update())

async def build_and_broadcast_payload(result: dict, extra: dict | None = None):
    """
    Builds the final contract payload and sends it.
    Also manages the recommendation trigger. `extra` permite adjuntar
    metadatos de la fuente (p.ej. progreso del archivo en modo respaldo).
    """
    await trigger_recommendation_if_needed(
        result["status"],
        result["health_score"],
        result["alert"]
    )

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": result["status"],
        "health_score": result["health_score"],
        "confidence": result["confidence"],
        "alert": result["alert"],
        "calibrated": app_state["calibrated"],
        "recommendation": app_state["current_recommendation"],
        **(extra or {}),
    }
    app_state["last_result"] = result
    await manager.broadcast_json(payload)

@app.on_event("startup")
async def startup_event():
    # Warmup: cargar modelo.joblib e inicializar librosa con una ventana de
    # silencio. Sin esto, la PRIMERA clasificación real paga ~10 s de carga
    # perezosa bloqueando el event loop (mal momento en plena demo).
    import numpy as np

    loop = asyncio.get_running_loop()
    silencio = np.zeros(SAMPLE_RATE, dtype=np.int16).tobytes()
    await loop.run_in_executor(None, classify_window, silencio, None)
    print("Warmup del modelo completado")

    # Start the background task to emit mock data when idle
    asyncio.create_task(mock_data_generator())

async def mock_data_generator():
    """
    Emits mock data every second if no real audio is being processed.
    This unblocks the frontend development so they can see live updates.
    """
    while True:
        if MOCK_WHEN_IDLE and not app_state["processing_audio"]:
            p = random.uniform(0.7, 1.0)
            status = "NORMAL" if p >= 0.75 else "WARNING"
            result = {
                "status": status,
                "health_score": int(p * 100),
                "confidence": p,
                "alert": None
            }
            await build_and_broadcast_payload(result)
        await asyncio.sleep(WINDOW_SECONDS)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/calibrate")
async def calibrate(file: UploadFile = File(...)):
    audio_bytes = await leer_upload_validado(file)
    try:
        profile = calibrate_noise(audio_bytes)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Audio de calibración inválido (se espera WAV o PCM Int16 16 kHz)",
        )

    app_state["noise_profile"] = profile
    app_state["calibrated"] = True
    
    # Notify clients that the system has been calibrated
    await manager.broadcast_json({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "CALIBRATING",
        "health_score": 100,
        "confidence": 1.0,
        "alert": None,
        "calibrated": True,
        "recommendation": "Calibrating background noise profile..."
    })

    # Mensaje de cierre: sin esto, si no fluye audio después, el dashboard
    # se queda mostrando CALIBRATING para siempre (es el último mensaje).
    # Se emite el último estado real conocido (o NORMAL si aún no hubo audio).
    last = app_state.get("last_result") or {
        "status": "NORMAL",
        "health_score": 100,
        "confidence": 1.0,
        "alert": None,
    }
    await manager.broadcast_json({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": last["status"],
        "health_score": last["health_score"],
        "confidence": last["confidence"],
        "alert": last["alert"],
        "calibrated": True,
        "recommendation": "Perfil de ruido calibrado. Listo para monitorear.",
    })

    return {"calibrated": True, "seconds": len(audio_bytes) / (SAMPLE_RATE * BYTES_PER_SAMPLE)}

@app.delete("/api/calibrate")
async def clear_calibration():
    app_state["noise_profile"] = None
    app_state["calibrated"] = False
    return {"calibrated": False}

@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open, broadcasts are done from the ingestion endpoint or mock generator
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/audio")
async def websocket_audio(websocket: WebSocket):
    await websocket.accept()
    
    if app_state["processing_audio"]:
        await websocket.close(code=1008, reason="Already processing audio from another source")
        return
        
    app_state["processing_audio"] = True
    reset_smoothing()  # nueva fuente de audio → limpiar media móvil
    buffer = bytearray()

    try:
        while True:
            data = await websocket.receive_bytes()
            buffer.extend(data)
            
            # If we have enough audio for a window, process it
            if len(buffer) >= WINDOW_SIZE_BYTES:
                window = buffer[:WINDOW_SIZE_BYTES]
                # Remove the processed window from the buffer
                buffer = buffer[WINDOW_SIZE_BYTES:]
                
                # Classify the window
                result = classify_window(window, app_state["noise_profile"])

                # Build and broadcast payload
                await build_and_broadcast_payload(result, extra={"source": "live"})
                
    except WebSocketDisconnect:
        print("Audio client disconnected")
    finally:
        app_state["processing_audio"] = False

@app.post("/api/audio")
async def upload_fallback_audio(file: UploadFile = File(...)):
    """
    Fallback mode: receives a full WAV file and simulates its streaming.
    """
    if app_state["processing_audio"]:
        raise HTTPException(status_code=409, detail="Already processing audio from another source")
        
    app_state["processing_audio"] = True
    try:
        raw = await leer_upload_validado(file)
        # Decodificar el WAV (header, subtipo float/int, canales, sr) a PCM
        # Int16 mono 16 kHz — ventanear el archivo crudo corrompería el audio.
        audio_bytes = wav_bytes_to_pcm16(raw)
    except HTTPException:
        app_state["processing_audio"] = False
        raise
    except Exception:
        app_state["processing_audio"] = False
        raise HTTPException(status_code=400, detail="Archivo de audio inválido (se espera WAV)")
    reset_smoothing()

    # Simple background processing (for MVP)
    async def process_file(data: bytes):
        # progreso visible en el dashboard: 1 ventana = 1 segundo de audio
        total_s = len(data) // WINDOW_SIZE_BYTES * WINDOW_SECONDS
        try:
            offset = 0
            position_s = 0
            while offset + WINDOW_SIZE_BYTES <= len(data):
                window = data[offset:offset+WINDOW_SIZE_BYTES]
                offset += WINDOW_SIZE_BYTES
                position_s += WINDOW_SECONDS

                result = classify_window(window, app_state["noise_profile"])
                await build_and_broadcast_payload(result, extra={
                    "source": "file",
                    "file_position": position_s,
                    "file_duration": total_s,
                })

                # Simulate real time passing (1 second)
                await asyncio.sleep(WINDOW_SECONDS)
        finally:
            app_state["processing_audio"] = False
            
    # Launch the background task
    asyncio.create_task(process_file(audio_bytes))
    return {"message": "File streaming started"}

# ── Servir el dashboard compilado (frontend/dist) desde el propio backend ──
# Permite abrir la app en http://<ip-laptop>:8000 sin depender del puerto de
# Vite (útil para el celular: el firewall ya permite a Python en la red).
# Se monta al final para no tapar /api/* ni /ws/*.
_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_DIST):
    import mimetypes

    from fastapi.staticfiles import StaticFiles

    # En Windows el registro puede mapear .js a text/plain y el navegador
    # rechaza los módulos ES con ese MIME — forzar los tipos correctos.
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("text/css", ".css")
    mimetypes.add_type("image/svg+xml", ".svg")

    app.mount("/", StaticFiles(directory=_DIST, html=True), name="dashboard")
