# UFDE — Unified Fraud Detection Engine

UFDE (Unified Fraud Detection Engine) is a real-time fraud detection and transaction monitoring system built using **FastAPI, Next.js, machine learning, SQLite, and Docker**.

The system analyzes financial transactions, calculates a risk score using multiple detection techniques, classifies transactions as `ALLOW`, `REVIEW`, or `BLOCK`, and provides a real-time fraud monitoring dashboard.

---

## 🚀 Features

- Real-time transaction scoring
- Fraud risk scoring from 0 to 1
- Transaction decisions:
  - `ALLOW`
  - `REVIEW`
  - `BLOCK`
- Machine learning based fraud detection
- XGBoost classification
- Isolation Forest anomaly detection
- Rule-based fraud detection
- Combined risk scoring
- Real-time transaction streaming using WebSockets
- Live fraud monitoring dashboard
- Transaction filtering by channel
- Flagged transaction filtering
- Fraud alert management
- Alert actions:
  - Confirm fraud
  - False positive
  - Escalate
- Account/entity transaction timeline
- Transaction metrics and statistics
- Transaction simulator
- Fraud scenario injection
- SQLite persistent storage
- Dockerized frontend and backend
- Docker Compose setup for the complete application

---

## 🏗️ Architecture

```text
                         UFDE
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
       Next.js Frontend          FastAPI Backend
          Port 3000                 Port 8000
             │                         │
             │ HTTP API               │
             ├────────────────────────►│
             │                         │
             │ WebSocket              │
             ◄────────────────────────┤
             │                         │
             │                    Fraud Engine
             │                         │
             │              ┌──────────┼──────────┐
             │              │          │          │
             │           XGBoost   Isolation   Rules
             │                       Forest
             │              │          │          │
             │              └──────────┼──────────┘
             │                         │
             │                         ▼
             │                   Risk Score
             │                         │
             │              ┌──────────┼──────────┐
             │              │          │          │
             │            ALLOW      REVIEW     BLOCK
             │                         │
             │                         ▼
             │                    SQLite DB
             │
             └──────── Real-time Dashboard
🛠️ Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Recharts
Lucide React
Backend
Python 3.11
FastAPI
Uvicorn
SQLModel
SQLite
WebSockets
Machine Learning
Scikit-learn
XGBoost
NumPy
Pandas
SHAP
Joblib
DevOps
Docker
Docker Compose
📁 Project Structure
UFDE_Project/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── services/
│   │   │   ├── features.py
│   │   │   ├── pipeline.py
│   │   │   ├── scorer.py
│   │   │   └── store.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── state.py
│   │   └── ws.py
│   │
│   ├── ml/
│   │   ├── artifacts/
│   │   │   └── model.joblib
│   │   └── train.py
│   │
│   ├── simulator/
│   │   └── generator.py
│   │
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pytest.ini
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
⚙️ Running with Docker

Docker Compose is the recommended way to run the complete application.

Requirements

Install:

Docker Desktop
Git

You do not need to manually install Python packages or Node dependencies when using Docker.

1. Clone the repository
git clone https://github.com/sankalp-st/UFDE-Unified-Fraud-Detection-Engine.git
cd UFDE-Unified-Fraud-Detection-Engine
2. Start the application
docker compose up --build

Docker Compose will:

Build the FastAPI backend image
Build the Next.js frontend image
Install backend Python dependencies
Install frontend Node dependencies
Start the backend
Start the frontend
Create/connect the SQLite database volume
Start the WebSocket server
3. Open the application

Frontend:

http://localhost:3000

Backend:

http://localhost:8000

FastAPI Swagger documentation:

http://localhost:8000/docs
🐳 Docker Services

The application consists of two Docker containers.

Backend
Container: ufde_project-backend-1
Port: 8000

Runs:

FastAPI
Uvicorn
ML models
SQLite
WebSocket server
Frontend
Container: ufde_project-frontend-1
Port: 3000

Runs:

Next.js
React
TypeScript
🧠 Fraud Detection Pipeline

A transaction is processed through multiple detection layers.

Transaction
     │
     ▼
Feature Engineering
     │
     ├───────────────┐
     ▼               ▼
 XGBoost       Isolation Forest
     │               │
     └───────┬───────┘
             │
             ▼
       Rule Engine
             │
             ▼
      Risk Aggregation
             │
             ▼
       Final Risk Score
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     ALLOW REVIEW BLOCK

The scoring configuration currently uses:

XGBoost weight:        0.60
Isolation Forest:      0.25
Rule engine:           0.15

Decision thresholds:

Risk < 0.40       → ALLOW

0.40 - 0.74       → REVIEW

Risk >= 0.75      → BLOCK
📊 Machine Learning

UFDE combines supervised and unsupervised detection.

XGBoost

XGBoost provides supervised fraud classification based on transaction features.

Isolation Forest

Isolation Forest detects unusual transaction patterns and anomalies.

Rule Engine

Additional transaction-level rules contribute to the final risk score.

The final risk score combines the outputs of these detection mechanisms.

🔌 API Endpoints

Base URL:

http://localhost:8000/api/v1
Score a transaction
POST /score

Example:

{
  "account_id": "ACC1001",
  "channel": "UPI",
  "txn_type": "PAYMENT",
  "amount": 450.0,
  "old_balance_orig": 5000.0,
  "new_balance_orig": 4550.0,
  "old_balance_dest": 1000.0,
  "new_balance_dest": 1450.0,
  "beneficiary_id": "BEN1001",
  "device_id": "DEV1001",
  "ip": "192.168.1.10",
  "lat": 12.9716,
  "lon": 77.5946
}
Get transactions
GET /transactions

Example:

GET /api/v1/transactions?limit=100

Optional filters:

channel
decision
limit
Get alerts
GET /alerts

Example:

GET /api/v1/alerts?status=open
Take action on an alert
PATCH /alerts/{alert_id}

Actions:

confirm_fraud
false_positive
escalate

Example:

{
  "action": "confirm_fraud"
}
Get account/entity information
GET /entities/{account_id}

Returns transaction history and entity information.

Get system metrics
GET /metrics

Provides metrics such as:

Total transactions
Flagged transactions
Flag rate
Open alerts
Average latency
Channel distribution
Reset system
POST /reset

Resets stored transactions, alerts, and feedback.

Start simulator
POST /simulate/start

Example:

{
  "rate": 3,
  "fraud_rate": 0.05
}
Stop simulator
POST /simulate/stop
Inject fraud scenario
POST /simulate/inject/{scenario}
🔴 Real-Time Streaming

UFDE uses WebSockets for real-time transaction updates.

WebSocket endpoint:

ws://localhost:8000/ws/stream

When a transaction is scored, the backend broadcasts the result to connected dashboard clients.

This allows the dashboard to update without continuously refreshing the page.

🗄️ Database

UFDE uses SQLite for transaction persistence.

Inside Docker, the database is stored at:

/data/ufde.db

Docker Compose uses a named volume:

ufde-data

This allows the database to persist even when the backend container is recreated.

To stop the application while keeping the database:

docker compose down

To remove the containers and database volume:

docker compose down -v

Warning: docker compose down -v deletes the Docker volume containing the SQLite database.

💻 Local Development

Docker is recommended for running the complete application, but the backend can also be run directly using Python.

Backend

Go to the backend:

cd backend

Create a virtual environment:

python -m venv .venv

Activate it on Windows PowerShell:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Run FastAPI:

python -m uvicorn app.main:app --reload --port 8000
Frontend

Go to the frontend:

cd frontend

Install dependencies:

npm install

Run Next.js:

npm run dev

Open:

http://localhost:3000
🤖 Model Training

The training dataset is intentionally excluded from Git because the raw dataset can be very large.

The training dataset should be placed at:

backend/data/paysim.csv

The training script can be executed from the backend directory:

python -m ml.train data\paysim.csv

The trained model is saved to:

backend/ml/artifacts/model.joblib
🔐 Environment Variables

The backend database URL can be configured using:

DB_URL

Docker Compose currently uses:

DB_URL=sqlite:////data/ufde.db

Frontend API configuration:

NEXT_PUBLIC_API=http://localhost:8000

Frontend WebSocket configuration:

NEXT_PUBLIC_WS=ws://localhost:8000/ws/stream

Do not commit sensitive .env files or credentials to GitHub.

🧪 Testing

Backend tests can be executed with:

cd backend
pytest

For TypeScript checking:

cd frontend
npx tsc --noEmit
📦 Git & Dependencies

Installed dependencies are not committed to Git.

The repository uses:

backend/requirements.txt

for Python dependencies and:

frontend/package.json
frontend/package-lock.json

for frontend dependencies.

The following directories are excluded through .gitignore:

.venv/
node_modules/
.next/
__pycache__/

The large PaySim dataset is also excluded:

backend/data/
🐳 Docker Images

The project can be packaged into two Docker images:

UFDE Backend
    ↓
FastAPI + ML + SQLite

UFDE Frontend
    ↓
Next.js + React

The images can be published to Docker Hub and then pulled on another machine.

🔄 Complete Docker Workflow
Developer
    │
    ▼
docker compose up --build
    │
    ├───────────────┐
    ▼               ▼
Backend Image    Frontend Image
    │               │
    ▼               ▼
Backend          Frontend
:8000            :3000
    │               │
    └───────┬───────┘
            ▼
       UFDE Dashboard
📌 Future Improvements

Possible future improvements include:

PostgreSQL support
Redis-based event streaming
Authentication and RBAC
Model monitoring
Automated model retraining
Advanced SHAP explanations
Distributed deployment
Prometheus/Grafana monitoring
Alembic database migrations
Cloud deployment
CI/CD pipeline
👨‍💻 Author

Sankalp Tripathi

B.Tech — Computer Science and Business Systems

Nitte Meenakshi Institute of Technology, Bengaluru

⭐ Project

UFDE — Unified Fraud Detection Engine

Built as a real-time machine-learning powered fraud detection and transaction monitoring system.


### One important thing before you push

Because you just had the **470 MB `paysim.csv`** problem, make sure this is in your `.gitignore`:

```gitignore
backend/data/

And your repository should not contain:

backend/.venv/
backend/data/paysim.csv
frontend/node_modules/
frontend/.next/

Your README can be committed normally:

git add README.md
git commit -m "Add project documentation"
git push

This README also explains the Docker workflow, so someone cloning your repository can understand that they only need Docker to run the complete UFDE stack.
