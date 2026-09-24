"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import SimulatorPanel from "@/components/SimulatorPanel";
import TxnDrawer from "@/components/TxnDrawer";
import { Card, DecisionBadge, Kpi, RiskBar } from "@/components/ui";
import { api } from "@/lib/api";
import { BLOCK_T, REVIEW_T, clock, inr } from "@/lib/format";
import { useStream } from "@/lib/stream";
import type { ScoredTxn } from "@/lib/types";
import { usePoll } from "@/lib/usePoll";

const CHANNELS = ["ALL", "UPI", "CARD", "NETBANKING", "ATM"];

export default function LiveMonitor() {
  const { txns, paused, setPaused, clear } = useStream();
  const { data: m } = usePoll(api.metrics, 2000);
  const [sel, setSel] = useState<ScoredTxn | null>(null);
  const [channel, setChannel] = useState("ALL");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const rows = useMemo(
    () =>
      txns
        .filter(
          (t) =>
            (channel === "ALL" || t.channel === channel) &&
            (!flaggedOnly || t.decision !== "ALLOW")
        )
        .slice(0, 50),
    [txns, channel, flaggedOnly]
  );

  const series = useMemo(
    () =>
      txns
        .slice(0, 60)
        .reverse()
        .map((t, i) => ({ i, risk: t.risk_score })),
    [txns]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Transactions" value={m?.total.toLocaleString() ?? "–"} />
          <Kpi
            label="Flag rate"
            value={m ? `${(m.flag_rate * 100).toFixed(1)}%` : "–"}
            tone="warn"
            sub="REVIEW + BLOCK"
          />
          <Kpi label="Open alerts" value={m?.open_alerts ?? "–"} tone="bad" />
          <Kpi
            label="Avg latency"
            value={m ? `${m.avg_latency_ms} ms` : "–"}
            tone="good"
            sub="target p95 < 200 ms"
          />
        </div>

        <Card title="Risk score: last 60 transactions">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <YAxis domain={[0, 1]} stroke="#64748b" fontSize={11} width={30} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }}
                />
                <ReferenceLine y={REVIEW_T} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={BLOCK_T} stroke="#ef4444" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#38bdf8"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Live transactions"
          right={
            <div className="flex items-center gap-2 text-xs">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
              >
                {CHANNELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-slate-400">
                <input
                  type="checkbox"
                  checked={flaggedOnly}
                  onChange={(e) => setFlaggedOnly(e.target.checked)}
                />{" "}
                flagged only
              </label>
              <button
                onClick={() => setPaused(!paused)}
                className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
              >
                {paused ? "▶ Resume" : "⏸ Pause"}
              </button>
              <button
                onClick={clear}
                className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
              >
                Clear
              </button>

              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Reset UFDE? This will delete all transactions, alerts, and feedback."
                  );

                  if (!confirmed) return;

                  try {
                    await api.reset();
                    clear();
                    window.location.reload();
                  } catch (error) {
                    console.error("Reset failed:", error);
                    window.alert("Reset failed. Make sure the backend is running.");
                  }
                }}
                className="rounded border border-red-500/40 px-2 py-1 text-red-400 hover:bg-red-500/10"
              >
                Reset
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Time</th>
                  <th>Account</th>
                  <th>Channel</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th className="pl-4">Risk</th>
                  <th>Decision</th>
                  <th>Top reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.txn_id}
                    onClick={() => setSel(t)}
                    className={`cursor-pointer border-t border-slate-800/60 hover:bg-slate-800/40 ${t.decision === "BLOCK"
                        ? "bg-red-500/5"
                        : t.decision === "REVIEW"
                          ? "bg-amber-500/5"
                          : ""
                      }`}
                  >
                    <td className="py-1.5 tabular-nums text-slate-400">
                      {clock(t.timestamp)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/entities/${t.account_id}`}
                        className="text-sky-400 hover:underline"
                      >
                        {t.account_id}
                      </Link>
                    </td>
                    <td>{t.channel}</td>
                    <td className="text-slate-400">{t.txn_type}</td>
                    <td className="text-right tabular-nums">{inr(t.amount)}</td>
                    <td className="pl-4">
                      <RiskBar score={t.risk_score} />
                    </td>
                    <td>
                      <DecisionBadge d={t.decision} />
                    </td>
                    <td className="max-w-[260px] truncate text-slate-400">
                      {t.reasons[0] ?? "-"}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No transactions yet. Press <b>Start</b> in the simulator panel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <SimulatorPanel />
        <Card title="Legend">
          <ul className="space-y-1 text-xs text-slate-400">
            <li>
              <DecisionBadge d="ALLOW" /> &nbsp;score &lt; {REVIEW_T}
            </li>
            <li>
              <DecisionBadge d="REVIEW" /> &nbsp;{REVIEW_T} – {BLOCK_T}: analyst review / step-up
            </li>
            <li>
              <DecisionBadge d="BLOCK" /> &nbsp;≥ {BLOCK_T}: hold transaction
            </li>
          </ul>
        </Card>
      </div>

      <TxnDrawer txn={sel} onClose={() => setSel(null)} />
    </div>
  );
}