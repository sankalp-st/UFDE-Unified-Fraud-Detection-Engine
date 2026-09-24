import type {
  Alert,
  AlertAction,
  Entity,
  Metrics,
  ScoredTxn,
} from "./types";

const API =
  process.env.NEXT_PUBLIC_API ?? "http://localhost:8000";

async function req<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const r = await fetch(`${API}/api/v1${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!r.ok) {
    throw new Error(`${r.status} ${await r.text()}`);
  }

  return r.json();
}

export const api = {
  metrics: () => req<Metrics>("/metrics"),

  alerts: (status = "open") =>
    req<Alert[]>(`/alerts?status=${status}`),

  actOnAlert: (id: number, action: AlertAction) =>
    req(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),

  entity: (id: string) =>
    req<Entity>(`/entities/${encodeURIComponent(id)}`),

  transactions: (limit = 500) =>
    req<ScoredTxn[]>(`/transactions?limit=${limit}`),

  simStart: (rate: number, fraud_rate: number) =>
    req("/simulate/start", {
      method: "POST",
      body: JSON.stringify({
        rate,
        fraud_rate,
      }),
    }),

  simStop: () =>
    req("/simulate/stop", {
      method: "POST",
    }),

  inject: (scenario: string) =>
    req(`/simulate/inject/${scenario}`, {
      method: "POST",
    }),

  reset: () =>
    req("/reset", {
      method: "POST",
    }),
};