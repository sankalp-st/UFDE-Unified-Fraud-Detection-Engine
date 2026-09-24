from datetime import datetime, timezone
import json
from typing import Optional

from app import config
from sqlmodel import create_engine, Field, SQLModel

engine = create_engine(
    config.DB_URL,
    connect_args={"check_same_thread": False}
)


def _now():
    return datetime.now(timezone.utc)


class Txn(SQLModel, table=True):
    txn_id: str = Field(primary_key=True)
    account_id: str = Field(index=True)
    channel: str = Field(index=True)
    txn_type: str
    amount: float
    beneficiary_id: str
    device_id: str
    ip: str
    lat: float
    lon: float
    ts: datetime = Field(index=True)
    risk_score: float
    decision: str = Field(index=True)
    latency_ms: float
    reasons: str = "[]"
    model_scores: str = "{}"


class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    txn_id: str = Field(index=True)
    risk_score: float
    status: str = Field(default="open", index=True)
    reasons: str = "[]"
    created_at: datetime = Field(default_factory=_now)


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    alert_id: int = Field(index=True)
    label: str
    ts: datetime = Field(default_factory=_now)


def init_db():
    SQLModel.metadata.create_all(engine)

    # SQLite schema migration for existing databases
    if config.DB_URL.startswith("sqlite:///"):
        import sqlite3

        db_path = config.DB_URL.replace("sqlite:///", "", 1)

        conn = sqlite3.connect(db_path)

        columns = {
            row[1]
            for row in conn.execute("PRAGMA table_info(txn)").fetchall()
        }

        if "model_scores" not in columns:
            conn.execute(
                "ALTER TABLE txn ADD COLUMN model_scores VARCHAR"
            )
            conn.commit()

        conn.close()