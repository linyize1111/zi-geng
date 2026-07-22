import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { PageLoading, PageState } from "@/components/common/PageState";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  createMockDailyPlanBundle,
  fetchOrCreateDailyPlan,
  replaceDailySlot,
  replaceMockDailySlot,
  type DailySlot,
} from "@/features/daily-plan/api";
import { createDraft } from "@/features/writing/draft-store";
import { env } from "@/lib/env";
import { routes, writeDetailPath } from "@/routes/paths";

function RefreshButton({
  slot,
  label,
  busy,
  onRefresh,
}: {
  slot: DailySlot;
  label: string;
  busy: boolean;
  onRefresh: (slot: DailySlot) => void;
}) {
  return (
    <Button type="button" variant="outline" disabled={busy} onClick={() => onRefresh(slot)}>
      {label}
    </Button>
  );
}

export default function TodayPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Taipei";
  const useMock = env.useMockAdapter || auth.usingMock;

  const query = useQuery({
    queryKey: ["daily-plan", auth.user?.id, timezone],
    enabled: auth.status === "authenticated",
    queryFn: async () => {
      if (useMock) return createMockDailyPlanBundle();
      return fetchOrCreateDailyPlan(timezone);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (slot: DailySlot) => {
      if (useMock) return replaceMockDailySlot(slot);
      return replaceDailySlot(slot, timezone);
    },
    onSuccess: (bundle) => {
      queryClient.setQueryData(["daily-plan", auth.user?.id, timezone], bundle);
    },
  });

  const startWriteMutation = useMutation({
    mutationFn: async () => {
      if (!auth.user || !query.data?.prompt) throw new Error("尚無寫作題目");
      return createDraft({
        userId: auth.user.id,
        title: query.data.prompt.title,
        promptId: query.data.prompt.id,
        promptTitle: query.data.prompt.title,
      });
    },
    onSuccess: (draft) => navigate(writeDetailPath(draft.id)),
  });

  if (auth.status === "loading" || query.isLoading) {
    return <PageLoading label="準備今日內容…" />;
  }

  if (query.isError) {
    return (
      <PageState
        tone="error"
        title="無法載入今日計畫"
        description={query.error instanceof Error ? query.error.message : "請稍後重試"}
        actionLabel="重試"
        onAction={() => void query.refetch()}
      />
    );
  }

  const data = query.data;
  if (!data) {
    return <PageState title="尚無今日內容" description="請稍後再試，或到內容管理匯入詞庫。" />;
  }

  const refreshError =
    refreshMutation.error instanceof Error
      ? refreshMutation.error.message
      : refreshMutation.isError
        ? "刷新失敗"
        : null;

  const onRefresh = (slot: DailySlot) => {
    refreshMutation.mutate(slot);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">今日</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {auth.user ? `${auth.user.name} · ` : ""}
          {data.plan.local_date}（{data.plan.timezone}）{useMock ? " · Mock" : ""}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          今日詞彙 {data.vocabulary.length} 個。可隨時「換一批」重抽；詞庫不足時請到內容管理匯入。
        </p>
        {refreshError ? <p className="text-sm text-[var(--color-danger)]">{refreshError}</p> : null}
      </header>

      {data.quote ? (
        <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">名言</p>
            <RefreshButton
              slot="quote"
              label="換一則"
              busy={refreshMutation.isPending}
              onRefresh={onRefresh}
            />
          </div>
          <blockquote className="mt-3 font-[family-name:var(--font-sans)] text-xl leading-relaxed">
            {data.quote.display_quote}
          </blockquote>
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
            {data.quote.author_name}
            {data.quote.work_title ? ` · ${data.quote.work_title}` : ""}
          </p>
          {data.quote.short_analysis ? (
            <p className="mt-3 text-sm leading-relaxed">{data.quote.short_analysis}</p>
          ) : null}
        </section>
      ) : (
        <PageState title="今日尚無名言" description="庫中尚無可抽的寫作箴言；稍後再試或換一批其他區塊。" />
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-sans)] text-xl">詞彙</h2>
          <div className="flex flex-wrap items-center gap-3">
            <RefreshButton
              slot="vocabulary"
              label="換一批"
              busy={refreshMutation.isPending}
              onRefresh={onRefresh}
            />
            <Link
              to={routes.learnVocabulary}
              className="text-sm underline-offset-4 hover:underline"
            >
              全部詞彙
            </Link>
          </div>
        </div>
        {data.vocabulary.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.vocabulary.map((v) => (
              <li key={v.id} className="rounded-lg border border-[var(--color-line)] p-4">
                <p className="text-lg">{v.term}</p>
                {v.zhuyin ? (
                  <p className="text-xs text-[var(--color-ink-muted)]">{v.zhuyin}</p>
                ) : null}
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{v.short_def}</p>
              </li>
            ))}
          </ul>
        ) : (
          <PageState title="今日尚無詞彙" description="請到「內容管理」匯入文學詞庫後再試。" />
        )}
      </section>

      {data.craft ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">寫作技巧</p>
            <RefreshButton
              slot="craft"
              label="換一個"
              busy={refreshMutation.isPending}
              onRefresh={onRefresh}
            />
          </div>
          <h2 className="mt-2 text-xl">{data.craft.name}</h2>
          <p className="mt-2 text-sm">{data.craft.one_liner}</p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{data.craft.purpose}</p>
        </section>
      ) : null}

      {data.prompt ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">寫作題目</p>
            <RefreshButton
              slot="prompt"
              label="換一題"
              busy={refreshMutation.isPending}
              onRefresh={onRefresh}
            />
          </div>
          <h2 className="mt-2 text-xl">{data.prompt.title}</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{data.prompt.body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={startWriteMutation.isPending || !auth.user}
              onClick={() => startWriteMutation.mutate()}
            >
              {startWriteMutation.isPending ? "建立中…" : "開始寫作"}
            </Button>
            {startWriteMutation.isError ? (
              <span className="text-sm text-[var(--color-danger)]">
                {startWriteMutation.error instanceof Error
                  ? startWriteMutation.error.message
                  : "無法建立草稿"}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {data.novelTask ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">小說任務</p>
            <RefreshButton
              slot="novel"
              label="換一個"
              busy={refreshMutation.isPending}
              onRefresh={onRefresh}
            />
          </div>
          <h2 className="mt-2 text-xl">{data.novelTask.title}</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{data.novelTask.body}</p>
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            約 {data.novelTask.minutes_min}–{data.novelTask.minutes_max} 分鐘
          </p>
        </section>
      ) : null}
    </div>
  );
}
