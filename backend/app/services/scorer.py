import time
from app import config
from app.services.explain import shap_reasons
from app.services.features import build_features
from app.services.rules import evaluate
import joblib
import numpy as np
import pandas as pd
import shap


class Scorer:

  def __init__(self, store, path: str = config.MODEL_PATH):
    artifacts = joblib.load(path)
    self.xgb = artifacts["xgb"]
    self.iso = artifacts["iso"]
    self.lo = artifacts["lo"]
    self.hi = artifacts["hi"]
    self.store = store
    self.explainer = shap.TreeExplainer(self.xgb)

  @staticmethod
  def _row(t) -> pd.DataFrame:
    return pd.DataFrame([{
        "amount": t.amount,
        "txn_type": t.txn_type,
        "hour": t.timestamp.hour,
        "old_balance_orig": t.old_balance_orig,
        "new_balance_orig": t.new_balance_orig,
        "old_balance_dest": t.old_balance_dest,
        "new_balance_dest": t.new_balance_dest,
    }])

  def score(self, t) -> dict:
    t0 = time.perf_counter()
    ctx = self.store.compute(t)
    X = build_features(self._row(t))

    p_xgb = float(self.xgb.predict_proba(X)[0, 1])
    raw_iso = float(-self.iso.score_samples(X)[0])
    p_iso = float(
        np.clip((raw_iso - self.lo) / (self.hi - self.lo + 1e-9), 0.0, 1.0)
    )
    p_rule, reasons = evaluate(t, ctx)

    blend = config.W_XGB * p_xgb + config.W_ISO * p_iso + config.W_RULE * p_rule
    final = max(blend, p_rule, p_xgb)

    decision = (
        "BLOCK"
        if final >= config.BLOCK_T
        else "REVIEW" if final >= config.REVIEW_T else "ALLOW"
    )

    if final >= config.REVIEW_T:
      for r in shap_reasons(self.explainer, X):
        if r not in reasons:
          reasons.append(r)

    latency = round((time.perf_counter() - t0) * 1000, 2)
    return {
        "txn_id": t.txn_id,
        "risk_score": round(final, 4),
        "decision": decision,
        "reasons": reasons,
        "latency_ms": latency,
        "model_scores": {
            "xgb": round(p_xgb, 4),
            "iso": round(p_iso, 4),
            "rules": round(p_rule, 4),
        },
    }