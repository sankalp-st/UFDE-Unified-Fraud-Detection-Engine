from contextlib import asynccontextmanager
from app import config
from app.api.routes import router
from app.db import init_db
from app.schemas import TxnIn
from app.services.scorer import Scorer
from app.services.store import FeatureStore
from app.state import state
from app.ws import manager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
  init_db()
  state.store = FeatureStore()
  state.scorer = Scorer(state.store)

  # Warm-up inference and TreeExplainer
  dummy = TxnIn(
      account_id="WARMUP",
      channel="UPI",
      txn_type="PAYMENT",
      amount=100.0,
      old_balance_orig=1000.0,
      new_balance_orig=900.0,
      beneficiary_id="BW",
      device_id="DW",
      ip="127.0.0.1",
      lat=12.97,
      lon=77.59,
  )
  state.scorer.score(dummy)

  yield
  if state.sim_task:
    state.sim_task.cancel()


app = FastAPI(title="UFDE: Unified Fraud Detection Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
  return {"status": "ok"}


@app.websocket("/ws/stream")
async def stream(ws: WebSocket):
  await manager.connect(ws)
  try:
    while True:
      await ws.receive_text()
  except WebSocketDisconnect:
    manager.disconnect(ws)