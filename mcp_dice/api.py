from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from .dice import roll, RollResult


class RollRequest(BaseModel):
    expression: str
    seed: str | None = None


app = FastAPI()


@app.post("/roll")
async def post_roll(req: RollRequest) -> RollResult:
    return roll(req.expression, req.seed)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    try:
        while True:
            expr = await ws.receive_text()
            result = roll(expr)
            await ws.send_json(result.__dict__)
    except WebSocketDisconnect:
        pass
