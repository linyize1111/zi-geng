import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading } from "@/components/common/PageState";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/features/auth/AuthProvider";
import { buildDailyReminderIcs, downloadIcs } from "@/features/settings/ics";
import { readLocalReminderTime, writeLocalReminderTime } from "@/features/settings/local-reminder";
import {
  fetchUserSettings,
  upsertUserSettings,
  type UserSettings,
} from "@/features/settings/user-settings-api";
import { AUTH_STORAGE_KEY } from "@/lib/auth-keys";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";

const MODE_LABELS: Record<UserSettings["daily_mode"], string> = {
  light: "輕量（詞彙最多 3）",
  standard: "標準（預設 7 詞）",
  deep: "深入（至少 10 詞）",
};

export default function SettingsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const useMock = env.useMockAdapter || auth.usingMock;
  const [localReminder, setLocalReminder] = useState(readLocalReminderTime);

  const settingsQuery = useQuery({
    queryKey: ["user-settings", auth.user?.id],
    enabled: auth.status === "authenticated" && Boolean(auth.user) && !useMock,
    queryFn: () => fetchUserSettings(auth.user!.id),
  });

  const saveMutation = useMutation({
    mutationFn: (
      patch: Partial<
        Pick<
          UserSettings,
          "daily_mode" | "daily_vocab_count" | "japanese_enabled" | "reminder_time"
        >
      >,
    ) => upsertUserSettings(auth.user!.id, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(["user-settings", auth.user?.id], data);
    },
  });

  const settings = settingsQuery.data ?? {
    user_id: auth.user?.id ?? "",
    daily_mode: "standard" as const,
    daily_vocab_count: 7,
    japanese_enabled: true,
    reminder_time: "09:00" as string | null,
  };

  const reminderDisplay = useMock ? localReminder : (settings.reminder_time ?? "09:00").slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">更多／設定</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">主題、每日份量、日文與提醒</p>
      </header>

      <section className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
        <h2 className="text-sm font-medium">帳號</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {auth.user ? `${auth.user.name} 〈${auth.user.email}〉` : "未登入"}
          {auth.membership?.isOwner ? " · Owner" : auth.membership?.isMember ? " · Member" : ""}
        </p>
        <Button type="button" variant="outline" onClick={() => void auth.signOut()}>
          登出（只清除字耕 session）
        </Button>
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
        <h2 className="text-sm font-medium">外觀</h2>
        <ThemeToggle />
      </section>

      <section className="space-y-4 rounded-lg border border-[var(--color-line)] p-4">
        <h2 className="text-sm font-medium">每日學習</h2>
        {useMock ? (
          <p className="text-sm text-[var(--color-ink-muted)]">Mock 模式不寫入遠端設定。</p>
        ) : settingsQuery.isLoading ? (
          <PageLoading label="載入設定…" />
        ) : (
          <>
            <label className="block space-y-2 text-sm">
              <span>模式</span>
              <select
                className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
                value={settings.daily_mode}
                disabled={saveMutation.isPending}
                onChange={(e) =>
                  saveMutation.mutate({
                    daily_mode: e.target.value as UserSettings["daily_mode"],
                  })
                }
              >
                {(Object.keys(MODE_LABELS) as UserSettings["daily_mode"][]).map((mode) => (
                  <option key={mode} value={mode}>
                    {MODE_LABELS[mode]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm">
              <span>每日詞彙數：{settings.daily_vocab_count}</span>
              <input
                type="range"
                min={3}
                max={15}
                step={1}
                value={settings.daily_vocab_count}
                disabled={saveMutation.isPending}
                className="w-full"
                onChange={(e) => saveMutation.mutate({ daily_vocab_count: Number(e.target.value) })}
              />
              <span className="text-xs text-[var(--color-ink-muted)]">
                變更後，請在「今日」按「換一批」才會套用到今天的詞彙。
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.japanese_enabled}
                disabled={saveMutation.isPending}
                onChange={(e) => saveMutation.mutate({ japanese_enabled: e.target.checked })}
              />
              <span>啟用日文初學區（側欄顯示）</span>
            </label>
            {saveMutation.isError ? (
              <p className="text-sm text-[var(--color-danger)]">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "儲存失敗"}
              </p>
            ) : null}
            {saveMutation.isSuccess ? (
              <p className="text-xs text-[var(--color-ink-muted)]">已儲存。</p>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
        <h2 className="text-sm font-medium">每日提醒（ICS）</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          下載行事曆檔，匯入手機／電腦日曆即可每日提醒；不需推播權限。
          {useMock ? " Mock 模式會把時間存在本機。" : ""}
        </p>
        <label className="block space-y-2 text-sm">
          <span>提醒時間</span>
          <input
            type="time"
            className="w-full max-w-[12rem] rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
            value={reminderDisplay}
            disabled={!useMock && saveMutation.isPending}
            onChange={(e) => {
              const v = e.target.value;
              if (useMock) {
                const next = (v || "09:00").slice(0, 5);
                setLocalReminder(next);
                writeLocalReminderTime(next);
                return;
              }
              saveMutation.mutate({ reminder_time: v || null });
            }}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const ics = buildDailyReminderIcs({ timeHHMM: reminderDisplay });
            downloadIcs("zi-geng-daily-reminder.ics", ics);
            if (useMock) {
              writeLocalReminderTime(reminderDisplay);
            } else if (auth.user) {
              saveMutation.mutate({ reminder_time: reminderDisplay });
            }
          }}
        >
          下載 .ics
        </Button>
      </section>

      <section className="space-y-2 rounded-lg border border-[var(--color-line)] p-4 text-sm text-[var(--color-ink-muted)]">
        <p>Auth storage key：{AUTH_STORAGE_KEY}</p>
        <p>Base path：{env.appBasePath}</p>
        <p>Mock adapter：{auth.usingMock ? "開啟（僅開發）" : "關閉"}</p>
        <p>安裝到主畫面：用瀏覽器「加到主畫面／安裝應用程式」。iOS Safari → 分享 → 加入主畫面。</p>
      </section>

      <ul className="space-y-2 text-sm">
        <li>
          <Link className="underline-offset-4 hover:underline" to={routes.favorites}>
            收藏
          </Link>
        </li>
        <li>
          <Link className="underline-offset-4 hover:underline" to={routes.japanese}>
            日文
          </Link>
        </li>
        <li>
          <Link className="underline-offset-4 hover:underline" to={routes.review}>
            回顧
          </Link>
        </li>
        {auth.membership?.isOwner ? (
          <li>
            <Link className="underline-offset-4 hover:underline" to={routes.ownerContent}>
              內容管理（Owner）
            </Link>
          </li>
        ) : null}
        <li>
          <a className="underline-offset-4 hover:underline" href={env.mainSiteUrl}>
            回到公開網站
          </a>
        </li>
      </ul>
    </div>
  );
}
