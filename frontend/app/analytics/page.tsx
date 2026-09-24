"use client";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Kpi } from "@/components/ui";
import { api } from "@/lib/api";
import { BLOCK_T, REVIEW_T } from "@/lib/format";
import { usePoll } from "@/lib/usePoll";

const tip = {
  contentStyle: { background: "#0f172a", border: "1px solid #1e293b" },
};

export default function Analytics() {
  const { data: m } = usePoll(api.metrics, 3000);
  const { data: txns } = usePoll(() => api.transactions(500), 5000);
  const [th, setTh] = useState(REVIEW_T);

  const all = txns ?? [];
  const curve = useMemo(
    () =>
      Array.from({ length: 21 }, (_, k) => {
        const x = +(k * 0.05).toFixed(2);
        return { th: x, flagged: all.filter((t) => t.risk_score >= x).length };
      }),
    [all]
  );
  const flagged = all.filter((t) => t.risk_score >= th).length;
  const byChannel = Object.entries(m?.by_channel ?? {}).map(([channel, count]) => ({
    channel,
    count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="ALLOW"
          value={all.filter((t) => t.decision === "ALLOW").length}
          tone="good"
          sub="last 500 txns"
        />
        <Kpi
          label="REVIEW"
          value={all.filter((t) => t.decision === "REVIEW").length}
          tone="warn"
        />
        <Kpi
          label="BLOCK"
          value={all.filter((t) => t.decision === "BLOCK").length}
          tone="bad"
        />
        <Kpi label="Avg latency" value={m ? `${m.avg_latency_ms} ms` : "–"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Transactions by channel">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byChannel}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="channel" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip {...tip} />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Alert volume vs review threshold">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="th"
                  type="number"
                  domain={[0, 1]}
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip {...tip} />
                <ReferenceLine x={th} stroke="#f59e0b" />
                <ReferenceLine x={BLOCK_T} stroke="#ef4444" strokeDasharray="4 4" />
                <Line
                  dataKey="flagged"
                  stroke="#38bdf8"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <label className="mt-3 block text-sm text-slate-300">
            Threshold: <b>{th.toFixed(2)}</b> → <b>{flagged}</b> of {all.length} transactions
            flagged
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={th}
              onChange={(e) => setTh(+e.target.value)}
              className="mt-2 w-full"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Adjusting this simulates operational analyst workload tradeoffs: lower thresholds
            increase alert sensitivity; higher thresholds reduce operational backlog.
          </p>
        </Card>
      </div>
    </div>
  );
}