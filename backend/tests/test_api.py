from app.main import app
from fastapi.testclient import TestClient

LEGIT = {
    "account_id": "T1",
    "channel": "UPI",
    "txn_type": "PAYMENT",
    "amount": 900,
    "old_balance_orig": 40000,
    "new_balance_orig": 39100,
    "beneficiary_id": "B1",
    "device_id": "D1",
    "ip": "1.1.1.1",
    "lat": 12.97,
    "lon": 77.59,
}

FRAUD = {
    **LEGIT,
    "account_id": "T2",
    "channel": "NETBANKING",
    "txn_type": "TRANSFER",
    "amount": 90000,
    "old_balance_orig": 90000,
    "new_balance_orig": 0,
    "beneficiary_id": "MULE",
    "device_id": "D2",
}


def test_score_paths():
  with TestClient(app) as c:
    r_legit = c.post("/api/v1/score", json=LEGIT).json()
    assert r_legit["decision"] == "ALLOW"

    r_fraud = c.post("/api/v1/score", json=FRAUD).json()
    assert r_fraud["decision"] in ("REVIEW", "BLOCK")
    assert len(r_fraud["reasons"]) > 0


def test_validation():
  with TestClient(app) as c:
    res = c.post("/api/v1/score", json={**LEGIT, "amount": -5})
    assert res.status_code == 422