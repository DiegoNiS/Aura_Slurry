from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import asyncio
import io

from ws_manager import manager
from mock_model import calibrar_ruido, clasificar_ventana

app = FastAPI(title="Aura-Slurry Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción especificar los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estado global (en un MVP sin base de datos)
app_state = {
    "perfil_ruido": None,
    "calibrado": False
}

# Constantes de audio
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2  # Int16
WINDOW_SECONDS = 1
WINDOW_SIZE_BYTES = SAMPLE_RATE * BYTES_PER_SAMPLE * WINDOW_SECONDS

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/calibrar")
async def calibrar(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    # Simular la llamada a senal.py
    perfil = calibrar_ruido(audio_bytes)
    
    app_state["perfil_ruido"] = perfil
    app_state["calibrado"] = True
    
    # Notificar a los clientes que el sistema ha sido calibrado
    await manager.broadcast_json({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "estado": "CALIBRANDO",
        "health_score": 100,
        "confianza": 1.0,
        "alerta": None,
        "calibrado": True
    })
    
    return {"calibrado": True, "segundos": len(audio_bytes) / (SAMPLE_RATE * BYTES_PER_SAMPLE)}

@app.delete("/api/calibrar")
async def limpiar_calibracion():
    app_state["perfil_ruido"] = None
    app_state["calibrado"] = False
    return {"calibrado": False}

@app.websocket("/ws/estado")
async def websocket_estado(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Mantenemos la conexión abierta, los broadcasts se hacen desde la ingesta
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/audio")
async def websocket_audio(websocket: WebSocket):
    await websocket.accept()
    buffer = bytearray()
    
    try:
        while True:
            data = await websocket.receive_bytes()
            buffer.extend(data)
            
            # Si tenemos suficiente audio para una ventana, procesamos
            if len(buffer) >= WINDOW_SIZE_BYTES:
                ventana = buffer[:WINDOW_SIZE_BYTES]
                # Eliminamos la ventana procesada del buffer
                buffer = buffer[WINDOW_SIZE_BYTES:]
                
                # Clasificamos la ventana
                resultado = clasificar_ventana(ventana, app_state["perfil_ruido"])
                
                # Armamos el payload final del contrato
                payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "estado": resultado["estado"],
                    "health_score": resultado["health_score"],
                    "confianza": resultado["confianza"],
                    "alerta": resultado["alerta"],
                    "calibrado": app_state["calibrado"]
                }
                
                # Emitimos el estado a todos los clientes conectados a /ws/estado
                await manager.broadcast_json(payload)
                
    except WebSocketDisconnect:
        print("Cliente de audio desconectado")

@app.post("/api/audio")
async def upload_audio_respaldo(file: UploadFile = File(...)):
    """
    Modo de respaldo: recibe un archivo WAV completo y simula su streaming.
    """
    audio_bytes = await file.read()
    
    # Procesamiento en segundo plano simple (para MVP)
    async def process_file(data: bytes):
        offset = 0
        while offset + WINDOW_SIZE_BYTES <= len(data):
            ventana = data[offset:offset+WINDOW_SIZE_BYTES]
            offset += WINDOW_SIZE_BYTES
            
            resultado = clasificar_ventana(ventana, app_state["perfil_ruido"])
            payload = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "estado": resultado["estado"],
                "health_score": resultado["health_score"],
                "confianza": resultado["confianza"],
                "alerta": resultado["alerta"],
                "calibrado": app_state["calibrado"]
            }
            await manager.broadcast_json(payload)
            # Simular paso del tiempo real (1 segundo)
            await asyncio.sleep(WINDOW_SECONDS)
            
    # Lanza la tarea en background
    asyncio.create_task(process_file(audio_bytes))
    return {"message": "Streaming de archivo iniciado"}
