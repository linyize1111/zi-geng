import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { env } from "@/lib/env";

export function SyncStatus() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div
      className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]"
      aria-live="polite"
    >
      {online ? (
        <Wifi className="size-3.5" aria-hidden />
      ) : (
        <WifiOff className="size-3.5" aria-hidden />
      )}
      <span>{online ? "已連線" : "離線"}</span>
      {env.useMockAdapter ? (
        <span className="rounded bg-[var(--color-accent-soft)] px-1.5">Mock</span>
      ) : null}
    </div>
  );
}
