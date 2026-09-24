"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { useStream } from "@/lib/stream";
import { usePoll } from "@/lib/usePoll";

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { status } = useStream();
  const { data: m } = usePoll(api.metrics, 3000);
  const [acct, setAcct] = useState("");

  const link = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={clsx(
        "rounded-md px-3 py-1.5 text-sm",
        path === href ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
      )}
    >
      {label}
      {!!badge && (
        <span className="ml-2 rounded-full bg-red-500 px-1.5 text-xs text-white">
          {badge}
        </span>
      )}
    </Link>
  );

  const dot = {
    open: "bg-emerald-400",
    connecting: "bg-amber-400",
    closed: "bg-red-500",
  }[status];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2">
        <span className="mr-4 font-semibold tracking-tight">🛡️ UFDE</span>
        {link("/", "Live Monitor")}
        {link("/alerts", "Alerts", m?.open_alerts)}
        {link("/analytics", "Analytics")}
        <form
          className="ml-auto flex items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (acct.trim()) router.push(`/entities/${acct.trim()}`);
          }}
        >
          <input
            value={acct}
            onChange={(e) => setAcct(e.target.value)}
            placeholder="Go to account, e.g. A0042"
            className="w-56 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm outline-none focus:border-slate-600"
          />
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={clsx("h-2 w-2 rounded-full", dot)} /> {status}
          </span>
        </form>
      </div>
    </header>
  );
}