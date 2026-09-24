"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import TxnDrawer from "@/components/TxnDrawer";
import { Card, Chip, DecisionBadge, Kpi, RiskBar } from "@/components/ui";
import { api } from "@/lib/api";
import { clock, inr } from "@/lib/format";
import type { ScoredTxn } from "@/lib/types";
import { usePoll } from "@/lib/usePoll";

export default function EntityPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { data, error } = usePoll(() => api.entity(id), 3000);
  const [sel, setSel] = useState<ScoredTxn | null>(null);

  if (error?.startsWith("404")) {
    return (
      <p className="py-20 text-center text-slate-400">
        No transactions found for <b>{id}</b> yet.
      </p>
    );
  }
  if (!data) return <p className="py-20 text-center text-slate-500">Loading…</p>;

  const path = [...data.timeline]
    .reverse()
    .slice(-8)
    .map((t) => t.channel)
    .join(" → ");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Account {data.account_id}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Recent txns" value={data.timeline.length} />
        <Kpi label="Flagged" value={data.flagged} tone={data.flagged ? "bad" : "good"} />
        <Kpi
          label="Channels used"
          value={data.channels.length}
          tone={data.channels.length >= 3 ? "warn" : "default"}
        />
        <Kpi
          label="Devices seen"
          value={data.devices.length}
          tone={data.devices.length > 1 ? "warn" : "default"}
        />
      </div>

      <Card title="Cross-channel path (oldest → newest)">
        <p className="font-mono text-sm text-sky-300">{path || "No channels recorded"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.channels.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {data.devices.map((d) => (
            <Chip key={d}>📱 {d}</Chip>
          ))}
        </div>
      </Card>

      <Card title="Timeline">
        <ol className="relative ml-2 border-l border-slate-800">
          {data.timeline.map((t) => (
            <li
              key={t.txn_id}
              onClick={() => setSel(t)}
              className="ml-4 cursor-pointer pb-4 hover:opacity-90"
            >
              <span
                className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                  t.decision === "BLOCK"
                    ? "bg-red-500"
                    : t.decision === "REVIEW"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="tabular-nums text-slate-500">{clock(t.timestamp)}</span>
                <span className="font-medium">{t.channel}</span>
                <span className="text-slate-400">{t.txn_type}</span>
                <span className="tabular-nums">{inr(t.amount)}</span>
                <DecisionBadge d={t.decision} />
                <RiskBar score={t.risk_score} />
              </div>
              {t.reasons[0] && (
                <div className="mt-0.5 text-xs text-slate-500">↳ {t.reasons[0]}</div>
              )}
            </li>
          ))}
        </ol>
      </Card>
      <TxnDrawer txn={sel} onClose={() => setSel(null)} />
    </div>
  );
}