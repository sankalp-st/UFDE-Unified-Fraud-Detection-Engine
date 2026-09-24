"use client";
import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { clock, inr } from "@/lib/format";
import type { AlertAction, ScoredTxn } from "@/lib/types";
import { DecisionBadge, RiskBar } from "./ui";

interface Props {
  txn: ScoredTxn | null;
  onClose: () => void;
  onActed?: () => void;
}

export default function TxnDrawer({ txn, onClose, onActed }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!txn) return null;

  const act = async (a: AlertAction) => {
    if (!txn.alert_id) return;
    setBusy(true);
    setErr(null);
    try {
      await api.actOnAlert(txn.alert_id, a);
      onActed?.();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, string][] = [
    ["Time", clock(txn.timestamp)],
    ["Amount", inr(txn.amount)],
    ["Channel", `${txn.channel} · ${txn.txn_type}`],
    ["Beneficiary", txn.beneficiary_id],
    ["Device", txn.device_id],
    ["IP", txn.ip],
    ["Location", `${txn.lat.toFixed(2)}, ${txn.lon.toFixed(2)}`],
    ["Scored in", `${txn.latency_ms} ms`],
  ];

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-950 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-500">Transaction {txn.txn_id}</div>
            <div className="mt-1 flex items-center gap-2">
              <DecisionBadge d={txn.decision} />
              <Link href={`/entities/${txn.account_id}`} className="text-sm text-sky-400 hover:underline">
                {txn.account_id} →
              </Link>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">Risk score</div>
          <RiskBar score={txn.risk_score} wide />
        </div>

        {txn.model_scores && (
          <div className="mt-5 space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-400">Detector breakdown</div>
            {(
              [
                ["XGBoost (supervised model)", txn.model_scores.xgb],
                ["Isolation Forest (anomaly)", txn.model_scores.iso],
                ["Rule engine (velocity/geo/device)", txn.model_scores.rules],
              ] as const
            ).map(([label, v]) => (
              <div key={label}>
                <div className="mb-0.5 text-xs text-slate-400">{label}</div>
                <RiskBar score={v} wide />
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Why it was flagged</div>
          {txn.reasons.length ? (
            <ul className="space-y-1.5">
              {txn.reasons.map((r) => (
                <li key={r} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-slate-200">
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No risk signals: transaction looks normal.</p>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-slate-500">{k}</dt>
              <dd className="text-slate-200">{v}</dd>
            </div>
          ))}
        </dl>

        {txn.alert_id ? (
          <div className="mt-6 grid grid-cols-3 gap-2">
            <button
              disabled={busy}
              onClick={() => act("confirm_fraud")}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50"
            >
              Confirm fraud
            </button>
            <button
              disabled={busy}
              onClick={() => act("false_positive")}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              False positive
            </button>
            <button
              disabled={busy}
              onClick={() => act("escalate")}
              className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600 disabled:opacity-50"
            >
              Escalate
            </button>
          </div>
        ) : null}
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      </aside>
    </>
  );
}