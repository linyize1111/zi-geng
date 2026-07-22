import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading } from "@/components/common/PageState";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/features/auth/AuthProvider";
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

  const settingsQuery = useQuery({
    queryKey: ["user-settings", auth.user?.id],
    enabled: auth.status === "authenticated" && Boolean(auth.user) && !useMock,
    queryFn: () => fetchUserSettings(auth.user!.id),
  });

  const saveMutation = useMutation({
    mutationFn: (patch: Partial<Pick<UserSettings, "daily_mode" | "daily_vocab_count">>) =>
      upsertUserSettings(auth.user!.id, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(["user-settings", auth.user?.id], data);
    },
  });

  const settings = settingsQuery.data ?? {
    user_id: auth.user?.id ?? "",
    daily_mode: "standard" as const,
    daily_vocab_count: 7,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">更多／設定</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">主題、每日份量與帳號</p>
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

      <section className="space-y-2 rounded-lg border border-[var(--color-line)] p-4 text-sm text-[var(--color-ink-muted)]">
        <p>Auth storage key：{AUTH_STORAGE_KEY}</p>
        <p>Base path：{env.appBasePath}</p>
        <p>Mock adapter：{auth.usingMock ? "開啟（僅開發）" : "關閉"}</p>
      </section>

      <ul className="space-y-2 text-sm">
        <li>
          <Link className="underline-offset-4 hover:underline" to={routes.favorites}>
            收藏
          </Link>
        </li>
        <li className="text-[var(--color-ink-muted)]">日文、回顧：即將推出</li>
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
