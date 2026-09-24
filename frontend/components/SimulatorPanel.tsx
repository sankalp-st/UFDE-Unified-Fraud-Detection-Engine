"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "./ui";

const SCENARIOS: [string, string][] = [
  ["ato", "Account takeover"],
  ["velocity", "Velocity burst"],
  ["cross_channel", "Cross-channel cash-out"],
  ["travel", "Impossible travel"],
  ["mule_ring", "Mule ring"],
];

export default function SimulatorPanel() {
  const [rate, setRate] = useState(3);
  const [fraud, setFraud] = useState(5);
  const [msg, setMsg] = useState("");

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      setMsg(label);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <Card title="Simulator">
      <label className="block text-xs text-slate-400">
        Rate: {rate} txn/s
        <input
          type="range"
          min={1}
          max={20}
          value={rate}
          onChange={(e) => setRate(+e.target.value)}
          className="mt-1 w-full"
        />
      </label>
      <label className="mt-3 block text-xs text-slate-400">
        Background fraud: {fraud}%
        <input
          type="range"
          min={0}
          max={30}
          value={fraud}
          onChange={(e) => setFraud(+e.target.value)}
          className="mt-1 w-full"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => run("Started", () => api.simStart(rate, fraud / 100))}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
        >
          Start
        </button>
        <button
          onClick={() => run("Stopped", () => api.simStop())}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600"
        >
          Stop
        </button>
      </div>

      <div className="mt-5 text-xs uppercase tracking-wide text-slate-400">
        Inject fraud scenario
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {SCENARIOS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => run(`Injected: ${label}`, () => api.inject(key))}
            className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-left text-sm text-red-300 hover:bg-red-500/20"
          >
            ⚡ {label}
          </button>
        ))}
      </div>
      {msg && <p className="mt-3 text-xs text-slate-500">{msg}</p>}
    </Card>
  );
}