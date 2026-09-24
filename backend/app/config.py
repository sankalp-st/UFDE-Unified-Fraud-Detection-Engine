import os

MODEL_PATH = os.getenv("MODEL_PATH", "ml/artifacts/model.joblib")
DB_URL = os.getenv("DB_URL", "sqlite:///ufde.db")

# Ensemble weights
W_XGB = 0.60
W_ISO = 0.25
W_RULE = 0.15

# Decision thresholds
REVIEW_T = 0.40
BLOCK_T = 0.75

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")