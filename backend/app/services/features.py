import numpy as np
import pandas as pd


TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]

FEATURES = [
    "amount",
    "log_amount",
    "hour",
    "orig_ratio",
    "err_orig",
    "err_dest",
    "dest_zero",
] + [f"type_{t}" for t in TYPES]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build uniform model features from raw transaction fields."""

    o = pd.DataFrame(index=df.index)

    o["amount"] = df["amount"]
    o["log_amount"] = np.log1p(df["amount"])
    o["hour"] = df["hour"]

    # Share of balance transferred
    o["orig_ratio"] = df["amount"] / (df["old_balance_orig"] + 1)

    # Arithmetic balance validation
    o["err_orig"] = (
        df["new_balance_orig"]
        + df["amount"]
        - df["old_balance_orig"]
    )

    o["err_dest"] = (
        df["old_balance_dest"]
        + df["amount"]
        - df["new_balance_dest"]
    )

    # Destination mule indicator
    o["dest_zero"] = (
        (df["old_balance_dest"] == 0)
        & (df["new_balance_dest"] == 0)
    ).astype(int)

    # Transaction type one-hot encoding
    for t in TYPES:
        o[f"type_{t}"] = (df["txn_type"] == t).astype(int)

    return o[FEATURES]