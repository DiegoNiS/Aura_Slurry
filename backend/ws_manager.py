import asyncio

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
        """Broadcast concurrente con timeout por cliente.

        - Envíos en paralelo (gather) sobre una copia de la lista: mutar
          durante la iteración saltaba clientes (auditoría #1).
        - Timeout de 2 s por cliente: una conexión zombie (p.ej. celular con
          pantalla bloqueada que mantiene el TCP abierto) bloqueaba el await
          indefinidamente y congelaba los mensajes para TODOS los clientes.
        """
        async def enviar(conn):
            try:
                await asyncio.wait_for(conn.send_json(message), timeout=2.0)
                return None
            except Exception:
                return conn  # muerta o atascada → se elimina

        resultados = await asyncio.gather(
            *(enviar(c) for c in list(self.active_connections))
        )
        for muerta in filter(None, resultados):
            if muerta in self.active_connections:
                self.active_connections.remove(muerta)

# Global instance to be used in main.py
manager = ConnectionManager()
