import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { PageLoading, PageState } from "@/components/common/PageState";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import { createMockDailyPlanBundle, fetchOrCreateDailyPlan } from "@/features/daily-plan/api";
import { createDraft } from "@/features/writing/draft-store";
import { env } from "@/lib/env";
import { routes, writeDetailPath } from "@/routes/paths";

export default function TodayPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [startingWrite, setStartingWrite] = useState(false);
  const [startWriteError, setStartWriteError] = useState<string | null>(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Taipei";

  const query = useQuery({
    queryKey: ["daily-plan", auth.user?.id, timezone],
    enabled: auth.status === "authenticated",
    queryFn: async () => {
      if (env.useMockAdapter || auth.usingMock) return createMockDailyPlanBundle();
      return fetchOrCreateDailyPlan(timezone);
    },
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
    return <PageState title="尚無今日內容" description="請確認已匯入 seed，或稍後再試。" />;
  }

  const doneHints = [
    data.quote ? "名言" : null,
    data.vocabulary.length ? `詞彙 ×${data.vocabulary.length}` : null,
    data.craft ? "技巧" : null,
    data.prompt ? "寫作" : null,
    data.novelTask ? "小說" : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">今日</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {auth.user ? `${auth.user.name} · ` : ""}
          {data.plan.local_date}（{data.plan.timezone}）
          {env.useMockAdapter || auth.usingMock ? " · Mock" : ""}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          今日項目：{doneHints.length ? doneHints.join("、") : "內容不足，請先匯入 seed"}
        </p>
      </header>

      {data.quote ? (
        <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] p-5">
          <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">名言</p>
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
        <PageState title="今日尚無名言" description="請確認已有 verified 且 active 的名言資料。" />
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-sans)] text-xl">詞彙</h2>
          <Link to={routes.learnVocabulary} className="text-sm underline-offset-4 hover:underline">
            全部詞彙
          </Link>
        </div>
        {data.vocabulary.length ? (
          <ul className="grid gap-3 sm:grid-cols-3">
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
          <PageState title="今日尚無詞彙" description="請先執行開發 seed 或匯入詞彙。" />
        )}
      </section>

      {data.craft ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">寫作技巧</p>
          <h2 className="mt-2 text-xl">{data.craft.name}</h2>
          <p className="mt-2 text-sm">{data.craft.one_liner}</p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{data.craft.purpose}</p>
        </section>
      ) : null}

      {data.prompt ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">寫作題目</p>
          <h2 className="mt-2 text-xl">{data.prompt.title}</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{data.prompt.body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={startingWrite || !auth.user}
              onClick={() => {
                if (!auth.user || !data.prompt) return;
                setStartWriteError(null);
                setStartingWrite(true);
                void createDraft({
                  userId: auth.user.id,
                  title: data.prompt.title,
                  promptId: data.prompt.id,
                  promptTitle: data.prompt.title,
                })
                  .then((draft) => navigate(writeDetailPath(draft.id)))
                  .catch((err: unknown) => {
                    setStartWriteError(err instanceof Error ? err.message : "無法建立草稿");
                  })
                  .finally(() => setStartingWrite(false));
              }}
            >
              {startingWrite ? "建立中…" : "開始寫作"}
            </Button>
            {startWriteError ? (
              <span className="text-sm text-[var(--color-danger)]">{startWriteError}</span>
            ) : null}
          </div>
        </section>
      ) : null}

      {data.novelTask ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">小說任務</p>
          <h2 className="mt-2 text-xl">{data.novelTask.title}</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{data.novelTask.body}</p>
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            約 {data.novelTask.minutes_min}–{data.novelTask.minutes_max} 分鐘
          </p>
        </section>
      ) : null}

      <section className="rounded-lg border border-dashed border-[var(--color-line)] p-5 text-sm text-[var(--color-ink-muted)]">
        日文區稍後於 Phase 6 接入。若今日卡片全空，請在 SQL Editor 執行
        `supabase/seed/dev_content_seed.sql`。
      </section>
    </div>
  );
}
