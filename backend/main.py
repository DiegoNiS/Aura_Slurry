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
    signal_features,
    wav_bytes_to_pcm16,
)


def features_para_ui(window, result: dict) -> dict:
    """Features reales de la señal para las gráficas del dashboard.
    anomalyScore viene del modelo: 100 - health score."""
    feats = signal_features(window)
    feats["anomalyScore"] = 100 - result["health_score"]
    return feats
from ai_recommender import get_pump_recommendation_async
from report_generator import build_incident, generate_incident_report, send_report_email

# Load env variables (for Gemini API Key)
load_dotenv()

app = FastAPI(title="Aura-Slurry Backend")

# CORS: wildcard + credentials es inválido según la spec (auditoría #2).
# No usamos cookies ni credenciales → credentials en False hace válido el "*".
# En producción: lista explícita de orígenes vía variable de entorno.
@app.middleware("http")
async def no_cache_html(request, call_next):
    """El index.html no debe cachearse: tras cada rebuild del frontend el
    navegador debe pedir el HTML nuevo (que referencia los JS con hash nuevo).
    Sin esto, los usuarios ven versiones viejas hasta borrar caché a mano."""
    response = await call_next(request)
    if response.headers.get("content-type", "").startswith("text/html"):
        response.headers["Cache-Control"] = "no-store"
    return response


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
    "last_recommendation_time": 0.0,
    # Reportes a la minera (feedback mentor): umbral de alertas → reporte IA
    "failure_times": [],       # timestamps de ventanas FAILURE recientes
    "reports": [],             # reportes generados (más reciente primero)
    "last_report_time": 0.0,
    "generating_report": False,
}

# Umbral de reporte: N ventanas FAILURE dentro de la ventana de observación
REPORT_FAILURE_THRESHOLD = int(os.getenv("REPORT_FAILURE_THRESHOLD", "8"))
REPORT_WINDOW_SECONDS = int(os.getenv("REPORT_WINDOW_SECONDS", "60"))
REPORT_COOLDOWN_SECONDS = int(os.getenv("REPORT_COOLDOWN_SECONDS", "180"))


async def evaluar_umbral_reporte(result: dict):
    """Si las FALLAS sostenidas superan el umbral, genera el reporte IA
    hacia la minera (y correo si hay SMTP) sin bloquear el loop de audio."""
    now = time.time()
    if result["status"] == "FAILURE":
        app_state["failure_times"].append(now)
    app_state["failure_times"] = [
        t for t in app_state["failure_times"] if now - t <= REPORT_WINDOW_SECONDS
    ]

    if (
        len(app_state["failure_times"]) >= REPORT_FAILURE_THRESHOLD
        and now - app_state["last_report_time"] >= REPORT_COOLDOWN_SECONDS
        and not app_state["generating_report"]
    ):
        app_state["last_report_time"] = now
        app_state["generating_report"] = True
        incident = build_incident(
            failure_count=len(app_state["failure_times"]),
            window_seconds=REPORT_WINDOW_SECONDS,
            threshold=REPORT_FAILURE_THRESHOLD,
            health_score=result["health_score"],
            alert=result["alert"],
        )

        async def generar_y_despachar():
            try:
                loop = asyncio.get_running_loop()
                report = await loop.run_in_executor(None, generate_incident_report, incident)
                emailed = await loop.run_in_executor(None, send_report_email, report)
                report.update({
                    "id": f"rep-{int(time.time())}",
                    "timestamp": incident["timestamp"],
                    "incident": incident,
                    "emailed": emailed,
                })
                app_state["reports"] = [report] + app_state["reports"][:19]
                print(f"Reporte generado: {report['subject']} (email: {emailed})")

                # Emitir de inmediato: Gemini tarda unos segundos y el audio
                # puede haber terminado — sin este broadcast el reporte no
                # llegaría al dashboard hasta el próximo mensaje de estado.
                last = app_state.get("last_result") or {
                    "status": "FAILURE",
                    "health_score": incident["health_score"],
                    "confidence": 1.0,
                    "alert": incident.get("alert"),
                }
                await manager.broadcast_json({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": last["status"],
                    "health_score": last["health_score"],
                    "confidence": last["confidence"],
                    "alert": last["alert"],
                    "calibrated": app_state["calibrated"],
                    "recommendation": app_state["current_recommendation"],
                    "report": report,
                })
            finally:
                app_state["generating_report"] = False

        asyncio.create_task(generar_y_despachar())

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
    
    # SAFETY: Bloqueo anti-spam (Debounce) para la API de Gemini (Límite: 5 RPM)
    if time_since_last < 30:
        return
    
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

    await evaluar_umbral_reporte(result)

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pump_id": "PUMP-01",  # 1 micrófono = 1 bomba (multi-bomba: roadmap)
        "status": result["status"],
        "health_score": result["health_score"],
        "confidence": result["confidence"],
        "alert": result["alert"],
        "calibrated": app_state["calibrated"],
        "recommendation": app_state["current_recommendation"],
        # último reporte a la minera (el frontend detecta ids nuevos)
        "report": app_state["reports"][0] if app_state["reports"] else None,
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


@app.get("/api/reports")
async def list_reports():
    """Historial de reportes de incidente generados hacia la minera."""
    return {"reports": app_state["reports"]}


@app.get("/api/pumps")
async def list_pumps():
    """Flota de bombas monitoreadas. Arquitectura: 1 micrófono = 1 bomba.

    Hoy hay una sola instalada; al agregar micrófonos, cada uno se registra
    aquí con su propio pump_id y el pipeline se instancia por bomba.
    """
    return {
        "pumps": [
            {
                "id": "PUMP-01",
                "name": "Bomba de Pulpa #1",
                "model": "Warman AH 8/6",
                "location": "Planta Concentradora — Línea de Molienda A",
                "online": True,
            }
        ]
    }

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
                await build_and_broadcast_payload(result, extra={
                    "source": "live",
                    "signal": features_para_ui(window, result),
                })
                
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
                    "signal": features_para_ui(window, result),
                })

                # Simulate real time passing (1 second)
                await asyncio.sleep(WINDOW_SECONDS)
        except Exception:
            # sin esto, un error en el task de fondo muere en silencio
            import traceback
            traceback.print_exc()
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
