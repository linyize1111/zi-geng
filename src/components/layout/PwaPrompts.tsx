import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/common/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function hasUnsyncedDraftFlag(): boolean {
  try {
    return sessionStorage.getItem("zi-geng-unsynced-draft") === "1";
  } catch {
    return false;
  }
}

export function PwaPrompts() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  });

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  return (
    <>
      {installEvent ? (
        <div className="fixed inset-x-3 bottom-20 z-50 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-sm md:bottom-4 md:left-auto md:right-4 md:w-80">
          <p className="text-sm">可將字耕安裝到主畫面，方便每日開啟。</p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              onClick={async () => {
                await installEvent.prompt();
                setInstallEvent(null);
              }}
            >
              安裝
            </Button>
            <Button type="button" variant="ghost" onClick={() => setInstallEvent(null)}>
              稍後
            </Button>
          </div>
        </div>
      ) : null}

      {needRefresh ? (
        <div className="fixed inset-x-3 top-3 z-50 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-sm md:left-auto md:right-4 md:w-96">
          <p className="text-sm">已有新版本可用。</p>
          {hasUnsyncedDraftFlag() ? (
            <p className="mt-1 text-xs text-[var(--color-danger)]">
              偵測到未同步草稿，請先儲存或同步後再更新，以免遺失內容。
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              disabled={hasUnsyncedDraftFlag()}
              onClick={() => updateServiceWorker(true)}
            >
              更新
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNeedRefresh(false)}>
              稍後
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
