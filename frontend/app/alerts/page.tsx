"use client";
import { useState } from "react";
import TxnDrawer from "@/components/TxnDrawer";
import { Card, DecisionBadge, RiskBar } from "@/components/ui";
import { api } from "@/lib/api";
import { clock, inr } from "@/lib/format";
import type { Alert, AlertAction } from "@/lib/types";
import { usePoll } from "@/lib/usePoll";

const TABS = ["open", "confirmed", "dismissed", "escalated"] as const;

export default function AlertsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("open");
  const { data, error, refresh } = usePoll(() => api.alerts(tab), 3000);
  const [sel, setSel] = useState<Alert | null>(null);

  const quick = async (a: Alert, action: AlertAction) => {
    await api.actOnAlert(a.id, action);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${
              tab === t ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">Could not load alerts: {error}</p>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((a) => (
          <Card key={a.id} className="cursor-pointer hover:border-slate-600">
            <div onClick={() => setSel(a)}>
              <div className="flex items-center justify-between">
                <DecisionBadge d={a.txn.decision} />
                <span className="text-xs text-slate-500">{clock(a.txn.timestamp)}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-medium">{a.txn.account_id}</span>
                <span className="tabular-nums">{inr(a.txn.amount)}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {a.txn.channel} · {a.txn.txn_type}
              </div>
              <div className="mt-2">
                <RiskBar score={a.risk_score} wide />
              </div>
              <ul className="mt-3 list-disc space-y-0.5 pl-4 text-xs text-slate-400">
                {a.reasons.slice(0, 3).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            {tab === "open" && (
              <div className="mt-3 flex gap-2 text-xs">
                <button
                  onClick={() => quick(a, "confirm_fraud")}
                  className="rounded bg-red-600 px-2 py-1 hover:bg-red-500"
                >
                  Fraud
                </button>
                <button
                  onClick={() => quick(a, "false_positive")}
                  className="rounded bg-emerald-600 px-2 py-1 hover:bg-emerald-500"
                >
                  Legit
                </button>
                <button
                  onClick={() => quick(a, "escalate")}
                  className="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
                >
                  Escalate
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {data && !data.length && (
        <p className="py-16 text-center text-slate-500">No {tab} alerts</p>
      )}

      <TxnDrawer
        txn={sel ? { ...sel.txn, alert_id: tab === "open" ? sel.id : null } : null}
        onClose={() => setSel(null)}
        onActed={refresh}
      />
    </div>
  );
}