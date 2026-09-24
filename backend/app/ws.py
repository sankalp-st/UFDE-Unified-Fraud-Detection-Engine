from fastapi import WebSocket


class Manager:

    def __init__(self):
        self.clients: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.clients.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.clients:
            self.clients.remove(ws)

    async def broadcast(self, data: dict):
        for ws in list(self.clients):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(ws)


manager = Manager()