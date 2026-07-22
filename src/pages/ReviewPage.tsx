import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { listFavorites } from "@/features/favorites/api";
import { weekPracticeCount } from "@/features/japanese/progress-store";
import { listNovels } from "@/features/novels/project-store";
import { listDrafts } from "@/features/writing/draft-store";
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

type WeekStats = {
  draftTouched: number;
  wordsWritten: number;
  novelTouched: number;
  favorites: number | null;
  japaneseAnswers: number;
};

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
  const japaneseAnswers = await weekPracticeCount(userId, since);
  return {
    draftTouched: weekDrafts.length,
    wordsWritten: weekDrafts.reduce((s, d) => s + d.wordCount, 0),
    novelTouched: weekNovels.length,
    favorites,
    japaneseAnswers,
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
          本週（週一至週日）{endOfWeekLabel(since)} · 僅本機摘要，不排名
        </p>
      </header>

      <section className="rounded-lg border border-[var(--color-line)] px-4">
        <StatRow
          label="動過的寫作草稿"
          value={String(stats.draftTouched)}
          hint={`本週草稿字數合計約 ${stats.wordsWritten}`}
          to={routes.write}
        />
        <StatRow label="動過的小說專案" value={String(stats.novelTouched)} to={routes.novels} />
        <StatRow
          label="日文練習作答"
          value={String(stats.japaneseAnswers)}
          hint="五十音辨音累計次數"
          to={routes.japanese}
        />
        <StatRow
          label="本週新增收藏"
          value={stats.favorites == null ? "—" : String(stats.favorites)}
          hint={stats.favorites == null ? "Mock／離線時略過" : undefined}
          to={routes.favorites}
        />
      </section>

      <p className="text-sm text-[var(--color-ink-muted)]">
        想繼續耕耘？從
        <Link className="mx-1 underline-offset-4 hover:underline" to={routes.today}>
          今日
        </Link>
        或
        <Link className="mx-1 underline-offset-4 hover:underline" to={routes.write}>
          寫作
        </Link>
        接著做即可。
      </p>
    </div>
  );
}
