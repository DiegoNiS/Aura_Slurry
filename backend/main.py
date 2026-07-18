from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import asyncio
import io

from ws_manager import manager
from mock_model import calibrate_noise, classify_window

app = FastAPI(title="Aura-Slurry Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state (for an MVP without a database)
app_state = {
    "noise_profile": None,
    "calibrated": False
}

# Audio constants
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2  # Int16
WINDOW_SECONDS = 1
WINDOW_SIZE_BYTES = SAMPLE_RATE * BYTES_PER_SAMPLE * WINDOW_SECONDS

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/calibrate")
async def calibrate(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    # Call signal_processing (mocked for now)
    profile = calibrate_noise(audio_bytes)
    
    app_state["noise_profile"] = profile
    app_state["calibrated"] = True
    
    # Notify clients that the system has been calibrated
    await manager.broadcast_json({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "CALIBRATING",
        "health_score": 100,
        "confidence": 1.0,
        "alert": None,
        "calibrated": True
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
            # Keep connection open, broadcasts are done from the ingestion endpoint
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
            
            # If we have enough audio for a window, process it
            if len(buffer) >= WINDOW_SIZE_BYTES:
                window = buffer[:WINDOW_SIZE_BYTES]
                # Remove the processed window from the buffer
                buffer = buffer[WINDOW_SIZE_BYTES:]
                
                # Classify the window
                result = classify_window(window, app_state["noise_profile"])
                
                # Build the final payload based on the contract
                payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": result["status"],
                    "health_score": result["health_score"],
                    "confidence": result["confidence"],
                    "alert": result["alert"],
                    "calibrated": app_state["calibrated"]
                }
                
                # Broadcast the state to all connected clients on /ws/status
                await manager.broadcast_json(payload)
                
    except WebSocketDisconnect:
        print("Audio client disconnected")

@app.post("/api/audio")
async def upload_fallback_audio(file: UploadFile = File(...)):
    """
    Fallback mode: receives a full WAV file and simulates its streaming.
    """
    audio_bytes = await file.read()
    
    # Simple background processing (for MVP)
    async def process_file(data: bytes):
        offset = 0
        while offset + WINDOW_SIZE_BYTES <= len(data):
            window = data[offset:offset+WINDOW_SIZE_BYTES]
            offset += WINDOW_SIZE_BYTES
            
            result = classify_window(window, app_state["noise_profile"])
            payload = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": result["status"],
                "health_score": result["health_score"],
                "confidence": result["confidence"],
                "alert": result["alert"],
                "calibrated": app_state["calibrated"]
            }
            await manager.broadcast_json(payload)
            # Simulate real time passing (1 second)
            await asyncio.sleep(WINDOW_SECONDS)
            
    # Launch the background task
    asyncio.create_task(process_file(audio_bytes))
    return {"message": "File streaming started"}
