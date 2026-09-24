RULES = [
    (
        "velocity_burst",
        lambda t, c: c["cnt_1m"] >= 5,
        0.6,
        lambda t, c: f"{c['cnt_1m']} transactions within 1 minute",
    ),
    (
        "amount_spike",
        lambda t, c: c["history"] >= 3 and c["amount_ratio"] >= 10,
        0.5,
        lambda t, c: (
            f"Amount {c['amount_ratio']:.0f}x above this account's average"
        ),
    ),
    (
        "new_device_large",
        lambda t, c: c["new_device"] and t.amount >= 20000,
        0.5,
        lambda t, c: "Large transaction from a previously unseen device",
    ),
    (
        "cross_channel",
        lambda t, c: c["channels_10m"] >= 3,
        0.5,
        lambda t, c: (
            f"{c['channels_10m']} different channels used within 10 minutes"
        ),
    ),
    (
        "impossible_travel",
        lambda t, c: c["km_since_last"] > 100 and c["speed_kmh"] > 900,
        0.7,
        lambda t, c: (
            f"Impossible travel: {c['km_since_last']:.0f} km since last"
            " transaction"
        ),
    ),
    (
        "mule_beneficiary",
        lambda t, c: c["accounts_per_beneficiary"] >= 4,
        0.6,
        lambda t, c: (
            f"{c['accounts_per_beneficiary']} accounts paid the same"
            " beneficiary in 10 minutes"
        ),
    ),
    (
        "shared_device",
        lambda t, c: c["accounts_per_device"] >= 3,
        0.4,
        lambda t, c: f"Device shared by {c['accounts_per_device']} accounts",
    ),
]


def evaluate(t, ctx: dict) -> tuple[float, list[str]]:
  score, reasons = 0.0, []
  for _, cond, w, msg in RULES:
    if cond(t, ctx):
      score += w
      reasons.append(msg(t, ctx))
  return min(score, 1.0), reasons