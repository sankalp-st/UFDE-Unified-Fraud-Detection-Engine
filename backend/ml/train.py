from pathlib import Path
import sys
from app.services.features import build_features, FEATURES
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import average_precision_score, confusion_matrix, precision_recall_curve
from xgboost import XGBClassifier

CSV = Path(sys.argv[1] if len(sys.argv) > 1 else "data/paysim.csv")
OUT = Path("ml/artifacts")
OUT.mkdir(parents=True, exist_ok=True)

print(f"Loading data from {CSV}...")
df = pd.read_csv(CSV).rename(
    columns={
        "type": "txn_type",
        "oldbalanceOrg": "old_balance_orig",
        "newbalanceOrig": "new_balance_orig",
        "oldbalanceDest": "old_balance_dest",
        "newbalanceDest": "new_balance_dest",
        "isFraud": "y",
    }
)
df["hour"] = df["step"] % 24

# Balance classes: retain all fraud cases, sample legitimate transactions
legit_count = min(600_000, len(df[df.y == 0]))
df = pd.concat([df[df.y == 1], df[df.y == 0].sample(legit_count, random_state=42)])
df = df.sort_values("step").reset_index(drop=True)

# Time-based train/test split (80/20)
cut = int(len(df) * 0.8)
train, test = df.iloc[:cut], df.iloc[cut:]
Xtr, ytr = build_features(train), train.y
Xte, yte = build_features(test), test.y

pos = max(int(ytr.sum()), 1)
neg = len(ytr) - pos

print("Training XGBoost Classifier...")
xgb = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=neg / pos,
    eval_metric="aucpr",
    tree_method="hist",
    n_jobs=-1,
    random_state=42,
)
xgb.fit(Xtr, ytr, eval_set=[(Xte, yte)], verbose=50)

p = xgb.predict_proba(Xte)[:, 1]
print("XGB PR-AUC:", round(float(average_precision_score(yte, p)), 4))
prec, rec, _ = precision_recall_curve(yte, p)
ok = rec[prec >= 0.90]
print("Recall @ Precision >= 0.90:", round(float(ok.max()), 4) if len(ok) else "n/a")
print("Confusion Matrix @ 0.5 threshold:\n", confusion_matrix(yte, (p >= 0.5).astype(int)))

print("Fitting Isolation Forest on legitimate transactions...")
iso = IsolationForest(
    n_estimators=200, contamination=0.01, random_state=42, n_jobs=-1
)
iso.fit(Xtr[ytr == 0])

raw_tr = -iso.score_samples(Xtr[ytr == 0])
lo, hi = np.percentile(raw_tr, [1, 99])

artifact_path = OUT / "model.joblib"
joblib.dump(
    {
        "xgb": xgb,
        "iso": iso,
        "lo": float(lo),
        "hi": float(hi),
        "features": FEATURES,
    },
    artifact_path,
)
print(f"Artifact successfully saved to {artifact_path}")