"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function usePoll<T>(fn: () => Promise<T>, ms: number) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, ms);
    return () => clearInterval(id);
  }, [load, ms]);

  return { data, error, refresh: load };
}