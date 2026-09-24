import clsx from "clsx";
import type { Decision } from "@/lib/types";
import { BLOCK_T, REVIEW_T } from "@/lib/format";

export function Card({
  title,
  right,
  children,
  className,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-slate-800 bg-slate-900/60 p-4", className)}>
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "warn" | "bad" | "good";
}) {
  const color = {
    default: "text-slate-100",
    warn: "text-amber-400",
    bad: "text-red-400",
    good: "text-emerald-400",
  }[tone];

  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={clsx("mt-1 text-2xl font-semibold tabular-nums", color)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}

const BADGE: Record<Decision, string> = {
  ALLOW: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  REVIEW: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  BLOCK: "bg-red-500/15 text-red-400 ring-red-500/30",
};

export function DecisionBadge({ d }: { d: Decision }) {
  return (
    <span className={clsx("rounded px-2 py-0.5 text-xs font-medium ring-1", BADGE[d])}>
      {d}
    </span>
  );
}

export function RiskBar({
  score,
  wide = false,
}: {
  score?: number | null;
  wide?: boolean;
}) {
  const safeScore = Number(score ?? 0);

  const color =
    safeScore >= BLOCK_T
      ? "bg-red-500"
      : safeScore >= REVIEW_T
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          "h-1.5 rounded bg-slate-800",
          wide ? "w-full" : "w-20"
        )}
      >
        <div
          className={clsx("h-1.5 rounded", color)}
          style={{
            width: `${Math.min(Math.max(safeScore * 100, 0), 100)}%`,
          }}
        />
      </div>

      <span className="text-xs tabular-nums text-slate-400">
        {safeScore.toFixed(2)}
      </span>
    </div>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
      {children}
    </span>
  );
}