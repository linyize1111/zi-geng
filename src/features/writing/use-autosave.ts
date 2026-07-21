import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type UseAutosaveOptions<T> = {
  value: T;
  enabled: boolean;
  delayMs?: number;
  save: (value: T) => Promise<void>;
  serialize?: (value: T) => string;
};

function defaultSerialize<T>(value: T): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * Debounced local autosave (~400ms). Call flush() on blur / visibilitychange.
 */
export function useAutosave<T>({
  value,
  enabled,
  delayMs = 400,
  save,
  serialize = defaultSerialize,
}: UseAutosaveOptions<T>): {
  status: AutosaveStatus;
  error: string | null;
  flush: () => Promise<void>;
  markClean: (snapshot: T) => void;
} {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const latestRef = useRef(value);
  const savedKeyRef = useRef(serialize(value));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  const serializeRef = useRef(serialize);
  const enabledRef = useRef(enabled);
  const savingRef = useRef(false);

  latestRef.current = value;
  saveRef.current = save;
  serializeRef.current = serialize;
  enabledRef.current = enabled;

  const flush = useCallback(async () => {
    if (!enabledRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const key = serializeRef.current(latestRef.current);
    if (key === savedKeyRef.current) {
      setStatus((s) => (s === "dirty" || s === "saving" ? "saved" : s));
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    setError(null);
    const snapshot = latestRef.current;
    try {
      await saveRef.current(snapshot);
      savedKeyRef.current = serializeRef.current(snapshot);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      savingRef.current = false;
      if (serializeRef.current(latestRef.current) !== savedKeyRef.current) {
        setStatus("dirty");
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const key = serialize(value);
    if (key === savedKeyRef.current) return;
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush();
    }, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, delayMs, serialize, flush]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("visibilitychange", onVis);
    return () => window.removeEventListener("visibilitychange", onVis);
  }, [flush]);

  const markClean = useCallback((snapshot: T) => {
    latestRef.current = snapshot;
    savedKeyRef.current = serializeRef.current(snapshot);
    setStatus("saved");
    setError(null);
  }, []);

  return {
    status,
    error,
    flush,
    markClean,
  };
}
