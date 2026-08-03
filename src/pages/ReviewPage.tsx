import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { listFavorites } from "@/features/favorites/api";
import { weekPracticeCount } from "@/features/japanese/progress-store";
import { listNovels } from "@/features/novels/project-store";
import { listDrafts, weekWordsWritten } from "@/features/writing/draft-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";

function startOfWeekIso(d = new Date()): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start.toISOString();
}

function endOfWeekLabel(startIso: string): string {
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric" });
  return `${fmt.format(start)}–${fmt.format(end)}`;
}

type StudyWeekStats = {
  knowledgeShown: number;
  craftShown: number;
  vocabShown: number;
  tooEasy: number;
  wantMore: number;
  good: number;
  knowledgeTitles: string[];
  craftNames: string[];
};

type WeekStats = {
  draftTouched: number;
  wordsWritten: number;
  novelTouched: number;
  favorites: number | null;
  japaneseAnswers: number;
  study: StudyWeekStats | null;
};

async function loadStudyWeekStats(
  userId: string,
  sinceIso: string,
): Promise<StudyWeekStats | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("zg_study_events")
    .select("content_type, content_id, event_type, meta, created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .limit(500);
  if (error) {
    console.warn("study events week", error.message);
    return null;
  }
  const rows = data ?? [];
  const knowledgeIds = new Set<string>();
  const craftIds = new Set<string>();
  let knowledgeShown = 0;
  let craftShown = 0;
  let vocabShown = 0;
  let tooEasy = 0;
  let wantMore = 0;
  let good = 0;
  for (const r of rows) {
    if (r.event_type === "shown" && r.content_type === "knowledge") {
      knowledgeShown += 1;
      knowledgeIds.add(r.content_id);
    }
    if (r.event_type === "shown" && r.content_type === "craft") {
      craftShown += 1;
      craftIds.add(r.content_id);
    }
    if (r.event_type === "shown" && r.content_type === "vocabulary") vocabShown += 1;
    if (r.event_type === "too_easy") tooEasy += 1;
    if (r.event_type === "want_more") wantMore += 1;
    if (r.event_type === "good") good += 1;
  }

  let knowledgeTitles: string[] = [];
  let craftNames: string[] = [];
  if (knowledgeIds.size) {
    const { data: ks } = await client
      .from("zg_knowledge_cards")
      .select("id, title")
      .in("id", [...knowledgeIds].slice(0, 20));
    knowledgeTitles = (ks ?? []).map((k) => k.title as string);
  }
  if (craftIds.size) {
    const { data: cs } = await client
      .from("zg_craft_cards")
      .select("id, name")
      .in("id", [...craftIds].slice(0, 20));
    craftNames = (cs ?? []).map((c) => c.name as string);
  }

  return {
    knowledgeShown,
    craftShown,
    vocabShown,
    tooEasy,
    wantMore,
    good,
    knowledgeTitles,
    craftNames,
  };
}

async function loadWeekStats(userId: string, useMock: boolean): Promise<WeekStats> {
  const since = startOfWeekIso();
  const drafts = await listDrafts(userId);
  const weekDrafts = drafts.filter((d) => d.updatedAt >= since);
  const novels = await listNovels(userId);
  const weekNovels = novels.filter((n) => n.updatedAt >= since);
  let favorites: number | null = null;
  if (!useMock) {
    try {
      const favs = await listFavorites(userId);
      favorites = favs.filter((f) => f.created_at >= since).length;
    } catch {
      favorites = null;
    }
  }
  const [japaneseAnswers, wordsWritten, study] = await Promise.all([
    weekPracticeCount(userId, since),
    weekWordsWritten(userId, since),
    useMock ? Promise.resolve(null) : loadStudyWeekStats(userId, since),
  ]);
  return {
    draftTouched: weekDrafts.length,
    wordsWritten,
    novelTouched: weekNovels.length,
    favorites,
    japaneseAnswers,
    study,
  };
}

function StatRow({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  to?: string;
}) {
  const body = (
    <div className="flex items-baseline justify-between gap-3 py-3">
      <div>
        <p className="text-sm">{label}</p>
        {hint ? <p className="text-xs text-[var(--color-ink-muted)]">{hint}</p> : null}
      </div>
      <p className="font-[family-name:var(--font-sans)] text-2xl tabular-nums tracking-wide">
        {value}
      </p>
    </div>
  );
  if (!to) return body;
  return (
    <Link
      to={to}
      className="block border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-accent-soft)]/40"
    >
      {body}
    </Link>
  );
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReviewPage() {
  const auth = useAuth();
  const useMock = env.useMockAdapter || auth.usingMock;
  const since = startOfWeekIso();

  const query = useQuery({
    queryKey: ["weekly-review", auth.user?.id, since.slice(0, 10)],
    enabled: Boolean(auth.user?.id),
    queryFn: () => loadWeekStats(auth.user!.id, useMock),
  });

  if (auth.status === "loading" || query.isLoading) {
    return <PageLoading label="整理本週回顧…" />;
  }

  if (!auth.user) {
    return <PageState title="請先登入" description="回顧彙整本機寫作、小說與日文練習。" />;
  }

  if (query.isError) {
    return (
      <PageState
        tone="error"
        title="無法載入回顧"
        description={query.error instanceof Error ? query.error.message : "請稍後重試"}
        actionLabel="重試"
        onAction={() => void query.refetch()}
      />
    );
  }

  const stats = query.data!;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">回顧</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          本週（週一至週日）{endOfWeekLabel(since)} · 不排名
        </p>
      </header>

      <section className="rounded-lg border border-[var(--color-line)] px-4">
        <StatRow
          label="動過的寫作草稿"
          value={String(stats.draftTouched)}
          hint={`本週新增字數 ${stats.wordsWritten}（存檔時正增量；升級前記錄無法回推）`}
          to={routes.write}
        />
        <StatRow label="動過的小說專案" value={String(stats.novelTouched)} to={routes.novels} />
        <StatRow
          label="日文練習作答"
          value={String(stats.japaneseAnswers)}
          hint="本週實際作答次數"
          to={routes.japanese}
        />
        <StatRow
          label="本週新增收藏"
          value={stats.favorites == null ? "—" : String(stats.favorites)}
          hint={stats.favorites == null ? "Mock／離線時略過" : undefined}
          to={routes.favorites}
        />
      </section>

      {stats.study ? (
        <section className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">
            學習事件（本週）
          </h2>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li>國學卡出現 {stats.study.knowledgeShown} 次</li>
            <li>技法課出現 {stats.study.craftShown} 次</li>
            <li>詞彙出現 {stats.study.vocabShown} 次</li>
            <li>
              回饋：很好 {stats.study.good} · 想多看 {stats.study.wantMore} · 太簡單{" "}
              {stats.study.tooEasy}
            </li>
          </ul>
          {stats.study.knowledgeTitles.length ? (
            <div>
              <p className="text-xs text-[var(--color-ink-muted)]">看過的國學</p>
              <p className="mt-1 text-sm">{stats.study.knowledgeTitles.join("、")}</p>
            </div>
          ) : null}
          {stats.study.craftNames.length ? (
            <div>
              <p className="text-xs text-[var(--color-ink-muted)]">練過的技法</p>
              <p className="mt-1 text-sm">{stats.study.craftNames.join("、")}</p>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="text-xs text-[var(--color-ink-muted)]">
          學習事件統計需先在 Supabase 執行 Phase 1 SQL；未執行時僅顯示本機摘要。
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadJson(`zi-geng-week-${since.slice(0, 10)}.json`, {
              exported_at: new Date().toISOString(),
              week_start: since,
              stats,
            })
          }
        >
          匯出本週摘要 JSON
        </Button>
      </div>

      <p className="text-sm text-[var(--color-ink-muted)]">
        想繼續耕耘？從
        <Link className="mx-1 underline-offset-4 hover:underline" to={routes.today}>
          今日
        </Link>
        、
        <Link className="mx-1 underline-offset-4 hover:underline" to={routes.write}>
          寫作
        </Link>
        或
        <Link className="mx-1 underline-offset-4 hover:underline" to={routes.assessment}>
          評量
        </Link>
        接著做即可。
      </p>
    </div>
  );
}
