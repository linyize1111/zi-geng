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
import { CardFeedback } from "@/features/study/CardFeedback";
import { normalizeCraftName, normalizeTerm, quoteNormalizedKey } from "@/features/study/normalize";
import { FavoriteToggle } from "@/features/favorites/FavoriteToggle";
import { OwnerRemoveCardButton } from "@/features/content/OwnerRemoveCardButton";
import { createDraft } from "@/features/writing/draft-store";
import { getSupabaseClient } from "@/lib/supabase/client";
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

function refreshErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (/replacement limit/i.test(raw)) {
    return "資料庫仍有舊的刷新上限。請在 Supabase 執行 APPLY_REFRESH_UNLIMITED_ONLY.sql 後再試。";
  }
  if (/no alternative content/i.test(raw)) {
    return "可抽內容太少，換不到新的。請到內容管理匯入詞庫／名言後再換。";
  }
  return raw || "刷新失敗";
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

  const poolQuery = useQuery({
    queryKey: ["content-pool-counts", auth.user?.id],
    enabled: auth.status === "authenticated" && !useMock,
    queryFn: async () => {
      const client = getSupabaseClient();
      if (!client) return { vocab: 0, quotes: 0 };
      const [v, q] = await Promise.all([
        client
          .from("zg_vocabulary_cards")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        client
          .from("zg_quotes")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);
      return { vocab: v.count ?? 0, quotes: q.count ?? 0 };
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

  const refreshError = refreshMutation.isError ? refreshErrorMessage(refreshMutation.error) : null;

  const onRefresh = (slot: DailySlot) => {
    refreshMutation.mutate(slot);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">今日</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {auth.user ? `${auth.user.name} · ` : ""}
          {data.plan.local_date}（{data.plan.timezone}）{useMock ? " · 離線示範" : ""}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          依你的時間隨意換卡；想留著複習就按「收藏」。完整庫存在詞彙／名言頁，不限今日這幾張。
        </p>
        {poolQuery.data ? (
          <p className="text-sm text-[var(--color-ink-muted)]">
            詞庫目前 <strong className="text-[var(--color-ink)]">{poolQuery.data.vocab}</strong>{" "}
            詞、名言 <strong className="text-[var(--color-ink)]">{poolQuery.data.quotes}</strong>{" "}
            則。
            {poolQuery.data.vocab < 50 ? (
              <>
                {" "}
                太少了——請到{" "}
                <Link to={routes.ownerContent} className="underline-offset-4 hover:underline">
                  內容管理
                </Link>{" "}
                匯入，或在 Supabase 跑灌庫 SQL。
              </>
            ) : (
              <>
                {" "}
                完整列表見{" "}
                <Link to={routes.learnVocabulary} className="underline-offset-4 hover:underline">
                  詞彙
                </Link>
                。
              </>
            )}
          </p>
        ) : null}
        {refreshError ? <p className="text-sm text-[var(--color-danger)]">{refreshError}</p> : null}
      </header>

      {data.quote ? (
        <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">名言</p>
            <div className="flex flex-wrap gap-2">
              <FavoriteToggle type="quote" contentId={data.quote.id} compact />
              <OwnerRemoveCardButton
                kind="quote"
                contentId={data.quote.id}
                compact
                onRemoved={() => onRefresh("quote")}
              />
              <RefreshButton
                slot="quote"
                label="換一則"
                busy={refreshMutation.isPending}
                onRefresh={onRefresh}
              />
            </div>
          </div>
          <blockquote className="mt-3 font-[family-name:var(--font-sans)] text-xl leading-relaxed">
            {data.quote.display_quote}
          </blockquote>
          {data.quote.original_quote ? (
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              原文：{data.quote.original_quote}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
            {data.quote.author_name}
            {data.quote.work_title ? ` · ${data.quote.work_title}` : ""}
            {data.quote.section_title ? ` · ${data.quote.section_title}` : ""}
            {data.quote.publication_year ? ` · ${data.quote.publication_year}` : ""}
          </p>
          {data.quote.translator_name ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              譯：{data.quote.translator_name}
            </p>
          ) : null}
          {data.quote.author_bio ? (
            <p className="mt-2 text-sm leading-relaxed">{data.quote.author_bio}</p>
          ) : null}
          {data.quote.short_analysis ? (
            <p className="mt-3 text-sm leading-relaxed">{data.quote.short_analysis}</p>
          ) : null}
          {data.quote.writing_insight ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
              寫作啟發：{data.quote.writing_insight}
            </p>
          ) : null}
          {data.quote.bibliography_url ? (
            <a
              href={data.quote.bibliography_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs underline-offset-4 hover:underline"
            >
              來源連結
            </a>
          ) : null}
          <div className="mt-3">
            <Link
              to={`${routes.learnQuotes}/${data.quote.id}`}
              className="text-sm underline-offset-4 hover:underline"
            >
              看完整解析
            </Link>
          </div>
          <CardFeedback
            contentType="quote"
            contentId={data.quote.id}
            normalizedKey={quoteNormalizedKey(data.quote.display_quote)}
            localDate={data.plan.local_date}
          />
        </section>
      ) : (
        <PageState
          title="今日尚無名言"
          description="庫中尚無可抽的名言；請到內容管理匯入多來源名言。"
        />
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-sans)] text-xl">
            詞彙（{data.vocabulary.length}）
          </h2>
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
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg">{v.term}</p>
                    {v.zhuyin ? (
                      <p className="text-xs text-[var(--color-ink-muted)]">{v.zhuyin}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <FavoriteToggle type="vocabulary" contentId={v.id} compact />
                    <OwnerRemoveCardButton
                      kind="vocabulary"
                      contentId={v.id}
                      compact
                      onRemoved={() => onRefresh("vocabulary")}
                    />
                  </div>
                </div>
                {v.category ? (
                  <p className="mt-1 text-[10px] tracking-wide text-[var(--color-ink-muted)]">
                    {v.category}
                    {v.part_of_speech ? ` · ${v.part_of_speech}` : ""}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{v.short_def}</p>
                {v.daily_example ? (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink)]">
                    例：{v.daily_example}
                  </p>
                ) : null}
                <CardFeedback
                  contentType="vocabulary"
                  contentId={v.id}
                  normalizedKey={normalizeTerm(v.term)}
                  localDate={data.plan.local_date}
                />
                <Link
                  to={`${routes.learnVocabulary}/${v.id}`}
                  className="mt-2 inline-block text-xs underline-offset-4 hover:underline"
                >
                  詳情
                </Link>
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
            <div className="flex flex-wrap gap-2">
              <FavoriteToggle type="craft" contentId={data.craft.id} compact />
              <OwnerRemoveCardButton
                kind="craft"
                contentId={data.craft.id}
                compact
                onRemoved={() => onRefresh("craft")}
              />
              <RefreshButton
                slot="craft"
                label="換一個"
                busy={refreshMutation.isPending}
                onRefresh={onRefresh}
              />
            </div>
          </div>
          <h2 className="mt-2 text-xl">{data.craft.name}</h2>
          <p className="mt-2 text-sm">{data.craft.one_liner}</p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{data.craft.purpose}</p>
          {data.craft.bad_example || data.craft.good_example ? (
            <div className="mt-3 space-y-2 text-sm">
              {data.craft.bad_example ? (
                <p>
                  <span className="text-xs text-[var(--color-ink-muted)]">弱例　</span>
                  {data.craft.bad_example}
                </p>
              ) : null}
              {data.craft.good_example ? (
                <p>
                  <span className="text-xs text-[var(--color-ink-muted)]">強例　</span>
                  {data.craft.good_example}
                </p>
              ) : null}
            </div>
          ) : null}
          {data.craft.exercise ? (
            <p className="mt-3 text-sm">
              <span className="text-xs text-[var(--color-ink-muted)]">練習　</span>
              {data.craft.exercise}
            </p>
          ) : null}
          <CardFeedback
            contentType="craft"
            contentId={data.craft.id}
            normalizedKey={normalizeCraftName(data.craft.name)}
            localDate={data.plan.local_date}
          />
        </section>
      ) : null}

      {data.prompt ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">寫作題目</p>
            <div className="flex flex-wrap gap-2">
              <FavoriteToggle type="prompt" contentId={data.prompt.id} compact />
              <OwnerRemoveCardButton
                kind="prompt"
                contentId={data.prompt.id}
                compact
                onRemoved={() => onRefresh("prompt")}
              />
              <RefreshButton
                slot="prompt"
                label="換一題"
                busy={refreshMutation.isPending}
                onRefresh={onRefresh}
              />
            </div>
          </div>
          <h2 className="mt-2 text-xl">{data.prompt.title}</h2>
          {data.prompt.category ? (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{data.prompt.category}</p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{data.prompt.body}</p>
          {(data.prompt.suggested_words || data.prompt.suggested_minutes) && (
            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
              {data.prompt.suggested_words ? `約 ${data.prompt.suggested_words} 字` : null}
              {data.prompt.suggested_words && data.prompt.suggested_minutes ? " · " : null}
              {data.prompt.suggested_minutes ? `約 ${data.prompt.suggested_minutes} 分鐘` : null}
            </p>
          )}
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
          <CardFeedback
            contentType="prompt"
            contentId={data.prompt.id}
            normalizedKey={normalizeTerm(data.prompt.title)}
            localDate={data.plan.local_date}
          />
        </section>
      ) : null}

      {data.novelTask ? (
        <section className="rounded-lg border border-[var(--color-line)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">小說任務</p>
            <div className="flex flex-wrap gap-2">
              <OwnerRemoveCardButton
                kind="novel_task"
                contentId={data.novelTask.id}
                compact
                onRemoved={() => onRefresh("novel")}
              />
              <RefreshButton
                slot="novel"
                label="換一個"
                busy={refreshMutation.isPending}
                onRefresh={onRefresh}
              />
            </div>
          </div>
          <h2 className="mt-2 text-xl">{data.novelTask.title}</h2>
          {data.novelTask.tags?.length ? (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {data.novelTask.tags
                .filter((t) => t.startsWith("階段:") || t === "待大綱" || t === "保留")
                .join(" · ") || data.novelTask.tags.slice(0, 3).join(" · ")}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{data.novelTask.body}</p>
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            約 {data.novelTask.minutes_min}–{data.novelTask.minutes_max} 分鐘 ·
            完成後可記在「小說」專案的創作計畫
          </p>
        </section>
      ) : null}
    </div>
  );
}
