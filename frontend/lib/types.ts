export type Decision = "ALLOW" | "REVIEW" | "BLOCK";
export type Channel = "UPI" | "CARD" | "NETBANKING" | "ATM";
export type AlertAction = "confirm_fraud" | "false_positive" | "escalate";

export interface ModelScores {
  xgb: number;
  iso: number;
  rules: number;
}

export interface ScoredTxn {
  txn_id: string;
  account_id: string;
  channel: Channel;
  txn_type: string;
  amount: number;
  beneficiary_id: string;
  device_id: string;
  ip: string;
  lat: number;
  lon: number;
  timestamp: string;
  risk_score: number;
  decision: Decision;
  reasons: string[];
  latency_ms: number;
  model_scores?: ModelScores;
  alert_id?: number | null;
}

export interface Alert {
  id: number;
  txn_id: string;
  risk_score: number;
  status: "open" | "confirmed" | "dismissed" | "escalated";
  reasons: string[];
  created_at: string;
  txn: ScoredTxn;
}

export interface Metrics {
  total: number;
  flagged: number;
  flag_rate: number;
  open_alerts: number;
  avg_latency_ms: number;
  by_channel: Record<string, number>;
}

export interface Entity {
  account_id: string;
  channels: string[];
  devices: string[];
  flagged: number;
  timeline: ScoredTxn[];
}