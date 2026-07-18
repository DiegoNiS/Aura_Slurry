from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_json(self, message: dict):
        # Iterar sobre una COPIA: mutar la lista dentro del for salta clientes
        # cuando hay desconexiones concurrentes (auditoría 2026-07-18, #1).
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for connection in dead:
            if connection in self.active_connections:
                self.active_connections.remove(connection)

# Global instance to be used in main.py
manager = ConnectionManager()
