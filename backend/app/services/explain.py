import numpy as np


def _reason(name: str, row) -> str | None:
  if name.startswith("type_"):
    return f"High-risk transaction type: {name[5:]}"
  return {
      "err_orig": "Sender balance does not reconcile with the amount",
      "err_dest": "Receiver balance change does not match the amount",
      "orig_ratio": f"Transfer is {row['orig_ratio']:.0%} of sender's balance",
      "dest_zero": "Receiver account shows zero balance (mule pattern)",
      "amount": "Unusually large amount",
      "log_amount": "Unusually large amount",
      "hour": f"Unusual hour of day ({int(row['hour']):02d}:00)",
  }.get(name)


def shap_reasons(explainer, X, k: int = 3) -> list[str]:
  raw_values = explainer.shap_values(X)
  # Handle shap versions returning [neg_class, pos_class] arrays
  sv = raw_values[1][0] if isinstance(raw_values, list) else raw_values[0]

  out = []
  for i in np.argsort(-sv)[:k]:
    if sv[i] <= 0:
      break
    msg = _reason(X.columns[i], X.iloc[0])
    if msg and msg not in out:
      out.append(msg)
  return out