import json

from app.db import Alert, engine, Txn
from app.state import state
from app.ws import manager
from sqlmodel import Session


async def process(t) -> dict:
    res = state.scorer.score(t)
    state.store.update(t)

    alert_id = None

    with Session(engine) as s:
        s.add(
            Txn(
                txn_id=t.txn_id,
                account_id=t.account_id,
                channel=t.channel,
                txn_type=t.txn_type,
                amount=t.amount,
                beneficiary_id=t.beneficiary_id,
                device_id=t.device_id,
                ip=t.ip,
                lat=t.lat,
                lon=t.lon,
                ts=t.timestamp,
                risk_score=res["risk_score"],
                decision=res["decision"],
                latency_ms=res["latency_ms"],
                reasons=json.dumps(res["reasons"]),
                model_scores=json.dumps(res["model_scores"]),
            )
        )

        if res["decision"] != "ALLOW":
            a = Alert(
                txn_id=t.txn_id,
                risk_score=res["risk_score"],
                reasons=json.dumps(res["reasons"]),
            )
            s.add(a)
            s.flush()
            alert_id = a.id

        s.commit()

    payload = {
        **t.model_dump(mode="json"),
        **res,
        "alert_id": alert_id,
    }

    await manager.broadcast(payload)
    return payload