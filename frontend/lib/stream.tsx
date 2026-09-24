"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ScoredTxn } from "./types";
import { api } from "./api";

type Status = "connecting" | "open" | "closed";

interface StreamCtx {
  txns: ScoredTxn[];
  status: Status;
  paused: boolean;
  setPaused: (b: boolean) => void;
  clear: () => void;
}

const WS_URL =
  process.env.NEXT_PUBLIC_WS ?? "ws://localhost:8000/ws/stream";

const Ctx = createContext<StreamCtx>({
  txns: [],
  status: "connecting",
  paused: false,
  setPaused: () => {},
  clear: () => {},
});

export function StreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [txns, setTxns] = useState<ScoredTxn[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const [paused, setPaused] = useState(false);

  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const queue = useRef<ScoredTxn[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    // Load existing transactions from the database
    const loadExistingTransactions = async () => {
      try {
        const existing = await api.transactions(300);

        if (!stopped) {
          setTxns(existing);
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
      }
    };

    loadExistingTransactions();

    const connect = () => {
      setStatus("connecting");

      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        retry = 0;
        setStatus("open");
        console.log("WebSocket connected");
      };

      ws.onmessage = (e) => {
        if (pausedRef.current) return;

        try {
          const txn = JSON.parse(e.data) as ScoredTxn;
          queue.current.push(txn);
        } catch {
          console.error("Invalid WebSocket message");
        }
      };

      ws.onclose = () => {
        setStatus("closed");

        if (!stopped) {
          timer = setTimeout(
            connect,
            Math.min(1000 * 2 ** retry++, 10000)
          );
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    const flush = setInterval(() => {
      if (!queue.current.length) return;

      const batch = queue.current.reverse();
      queue.current = [];

      setTxns((prev) => [...batch, ...prev].slice(0, 300));
    }, 250);

    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(flush);
      ws?.close();
    };
  }, []);

  const clear = useCallback(() => {
    setTxns([]);
  }, []);

  return (
    <Ctx.Provider
      value={{
        txns,
        status,
        paused,
        setPaused,
        clear,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStream = () => useContext(Ctx);
