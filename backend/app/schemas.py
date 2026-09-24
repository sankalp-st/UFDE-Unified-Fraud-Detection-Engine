import uuid

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class TxnIn(BaseModel):
    txn_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])

    account_id: str

    channel: Literal["UPI", "CARD", "NETBANKING", "ATM"]

    txn_type: Literal["PAYMENT", "TRANSFER", "CASH_OUT", "CASH_IN", "DEBIT"]

    amount: float = Field(gt=0)

    old_balance_orig: float = Field(ge=0)

    new_balance_orig: float = Field(ge=0)

    old_balance_dest: float = Field(0.0, ge=0)

    new_balance_dest: float = Field(0.0, ge=0)

    beneficiary_id: str

    device_id: str

    ip: str

    lat: float

    lon: float

    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class ScoreOut(BaseModel):
    txn_id: str
    risk_score: float
    decision: Literal["ALLOW", "REVIEW", "BLOCK"]
    reasons: list[str]
    latency_ms: float
    model_scores: dict[str, float]


class AlertAction(BaseModel):
    action: Literal["confirm_fraud", "false_positive", "escalate"]


class SimConfig(BaseModel):
    rate: float = Field(3.0, gt=0, le=50)
    fraud_rate: float = Field(0.05, ge=0, le=1)