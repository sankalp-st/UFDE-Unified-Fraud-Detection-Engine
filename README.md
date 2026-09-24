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
