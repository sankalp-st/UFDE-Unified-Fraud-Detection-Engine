import asyncio
import json
from app.db import Alert, engine, Feedback, Txn
from app.schemas import AlertAction, ScoreOut, SimConfig, TxnIn
from app.services.pipeline import process
from app.state import state
from fastapi import APIRouter, HTTPException
from simulator.generator import Sim
from sqlmodel import func, select, Session

router = APIRouter(prefix="/api/v1")


@router.post("/score", response_model=ScoreOut)
async def score(t: TxnIn):
  return await process(t)


def _txn_out(r: Txn) -> dict:
    d = r.model_dump()
    d["timestamp"] = d.pop("ts")
    d["reasons"] = json.loads(r.reasons)
    d["model_scores"] = json.loads(r.model_scores)
    return d


@router.get("/transactions")
def transactions(
    channel: str | None = None,
    decision: str | None = None,
    limit: int = 100,
):
    with Session(engine) as s:
        q = (
            select(Txn)
            .order_by(Txn.ts.desc())
            .limit(min(limit, 500))
        )

        if channel:
            q = q.where(Txn.channel == channel)

        if decision:
            q = q.where(Txn.decision == decision)

        return [_txn_out(r) for r in s.exec(q)]


@router.get("/alerts")
def alerts(status: str = "open", limit: int = 100):
    with Session(engine) as s:
        q = (
            select(Alert, Txn)
            .join(Txn, Txn.txn_id == Alert.txn_id)
            .where(Alert.status == status)
            .order_by(Alert.risk_score.desc())
            .limit(limit)
        )

        return [
            {
                **a.model_dump(),
                "reasons": json.loads(a.reasons),
                "txn": _txn_out(t),
            }
            for a, t in s.exec(q)
        ]


@router.patch("/alerts/{alert_id}")
def act(alert_id: int, body: AlertAction):
  status_map = {
      "confirm_fraud": "confirmed",
      "false_positive": "dismissed",
      "escalate": "escalated",
  }
  status = status_map[body.action]
  with Session(engine) as s:
    a = s.get(Alert, alert_id)
    if not a:
      raise HTTPException(404, "alert not found")
    a.status = status
    s.add(a)
    if body.action != "escalate":
      s.add(
          Feedback(
              alert_id=alert_id,
              label="fraud" if body.action == "confirm_fraud" else "legit",
          )
      )
    s.commit()
    return {"id": alert_id, "status": status}


@router.get("/entities/{account_id}")
def entity(account_id: str):
    with Session(engine) as s:
        rows = list(
            s.exec(
                select(Txn)
                .where(Txn.account_id == account_id)
                .order_by(Txn.ts.desc())
                .limit(50)
            )
        )

    if not rows:
        raise HTTPException(404, "no transactions for account")

    return {
        "account_id": account_id,
        "channels": sorted({r.channel for r in rows}),
        "devices": sorted({r.device_id for r in rows}),
        "flagged": sum(r.decision != "ALLOW" for r in rows),
        "timeline": [_txn_out(r) for r in rows],
    }


@router.get("/metrics")
def metrics():
  with Session(engine) as s:
    total = s.exec(select(func.count()).select_from(Txn)).one()
    flagged = s.exec(
        select(func.count()).select_from(Txn).where(Txn.decision != "ALLOW")
    ).one()
    open_alerts = s.exec(
        select(func.count()).select_from(Alert).where(Alert.status == "open")
    ).one()
    avg_lat = s.exec(select(func.avg(Txn.latency_ms))).one() or 0.0
    by_ch = s.exec(
        select(Txn.channel, func.count()).group_by(Txn.channel)
    ).all()
  return {
      "total": total,
      "flagged": flagged,
      "flag_rate": round(flagged / total, 4) if total else 0.0,
      "open_alerts": open_alerts,
      "avg_latency_ms": round(float(avg_lat), 2),
      "by_channel": {c: n for c, n in by_ch},
  }

@router.post("/reset")
async def reset():
    # Stop running simulator
    if state.sim_task and not state.sim_task.done():
        state.sim_task.cancel()

        try:
            await state.sim_task
        except asyncio.CancelledError:
            pass

    state.sim_task = None
    state.sim = None

    # Delete database records
    with Session(engine) as s:
        feedback_rows = list(s.exec(select(Feedback)))
        for row in feedback_rows:
            s.delete(row)

        alert_rows = list(s.exec(select(Alert)))
        for row in alert_rows:
            s.delete(row)

        txn_rows = list(s.exec(select(Txn)))
        for row in txn_rows:
            s.delete(row)

        s.commit()

    return {
        "status": "reset",
        "transactions_deleted": len(txn_rows),
        "alerts_deleted": len(alert_rows),
        "feedback_deleted": len(feedback_rows),
    }

@router.post("/simulate/start")
async def sim_start(cfg: SimConfig):
  if state.sim_task and not state.sim_task.done():
    raise HTTPException(409, "simulator already running")
  state.sim = Sim(process)
  state.sim.warm_up(state.store)
  state.sim_task = asyncio.create_task(state.sim.run(cfg.rate, cfg.fraud_rate))
  return {"status": "started", **cfg.model_dump()}


@router.post("/simulate/stop")
async def sim_stop():
  if state.sim_task:
    state.sim_task.cancel()
  return {"status": "stopped"}


@router.post("/simulate/inject/{scenario}")
async def inject(scenario: str):
  if state.sim is None:
    state.sim = Sim(process)
    state.sim.warm_up(state.store)
  fn = state.sim.scenarios.get(scenario)
  if not fn:
    raise HTTPException(
        404, f"unknown scenario; choose from {list(state.sim.scenarios)}"
    )
  asyncio.create_task(fn())
  return {"status": "injected", "scenario": scenario}