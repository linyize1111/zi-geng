import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { VocabListItem } from "@/features/learn/api";
import { routes } from "@/routes/paths";

const RANDOM_BATCH = 12;

export type ThemeSeriesMeta = {
  id: string;
  title: string;
  family: string;
  blurb: string;
  category: string;
  terms: string[];
  count: number;
};

type ThemeSeriesFile = {
  series?: ThemeSeriesMeta[];
  cards?: Array<{
    term: string;
    zhuyin?: string | null;
    short_def?: string;
    long_def?: string;
    usage_context?: string;
    daily_example?: string;
    literary_example?: string;
    category?: string;
  }>;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function seriesAssetUrl() {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}content/seed-theme-series.json`;
}

type Mode = "browse" | "random" | "themes";

export function VocabStudyPanel({
  pool,
  mode,
  onModeChange,
}: {
  pool: VocabListItem[];
  mode: Mode;
  onModeChange: (m: Mode) => void;
}) {
  const [seed, setSeed] = useState(0);
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);

  const seriesQuery = useQuery({
    queryKey: ["theme-series-file"],
    queryFn: async (): Promise<ThemeSeriesFile> => {
      const res = await fetch(seriesAssetUrl());
      if (!res.ok) return { series: [], cards: [] };
      return (await res.json()) as ThemeSeriesFile;
    },
    staleTime: 60_000,
  });

  const randomCards = useMemo(() => {
    void seed;
    if (pool.length === 0) return [] as VocabListItem[];
    return shuffle(pool).slice(0, Math.min(RANDOM_BATCH, pool.length));
  }, [pool, seed]);

  const seriesList = seriesQuery.data?.series ?? [];
  const seriesCards = seriesQuery.data?.cards ?? [];
  const activeSeries = seriesList.find((s) => s.id === activeSeriesId) ?? null;
  const activeTerms = useMemo(() => {
    if (!activeSeries) return [];
    const want = new Set(activeSeries.terms);
    return seriesCards.filter((c) => want.has(c.term));
  }, [activeSeries, seriesCards]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["browse", "瀏覽列表"],
            ["random", `隨機 ${RANDOM_BATCH} 張`],
            ["themes", "主題系列"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-md border px-3 py-1.5 text-sm ${
              mode === id
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
            }`}
            onClick={() => {
              onModeChange(id);
              if (id === "themes") setActiveSeriesId(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "random" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--color-ink-muted)]">
              從目前篩選結果抽 {randomCards.length} 張（可再篩大類／小類後刷新）。
            </p>
            <button
              type="button"
              className="rounded-md border border-[var(--color-line)] px-3 py-1 text-sm"
              onClick={() => setSeed((n) => n + 1)}
            >
              換一批
            </button>
          </div>
          <ul className="space-y-3">
            {randomCards.map((row) => (
              <li key={row.id} className="rounded-lg border border-[var(--color-line)] p-4">
                <Link to={`${routes.learnVocabulary}/${row.id}`} className="block hover:opacity-90">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xl">{row.term}</p>
                    {row.category ? (
                      <p className="text-[10px] text-[var(--color-ink-muted)]">{row.category}</p>
                    ) : null}
                  </div>
                  {row.zhuyin ? (
                    <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{row.zhuyin}</p>
                  ) : null}
                  <p className="mt-2 text-sm leading-relaxed">{row.short_def}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === "themes" ? (
        <div className="space-y-4">
          {!activeSeries ? (
            <>
              <p className="text-sm text-[var(--color-ink-muted)]">
                對照學習：同一主題下列出 XX／XX／XX，並寫清異同。適合寫作取材。
              </p>
              {seriesQuery.isLoading ? (
                <p className="text-sm text-[var(--color-ink-muted)]">載入主題卡…</p>
              ) : seriesList.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-muted)]">
                  尚無主題系列檔，請重新建置內容。
                </p>
              ) : (
                <ul className="space-y-3">
                  {seriesList.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="w-full rounded-lg border border-[var(--color-line)] p-4 text-left hover:bg-[var(--color-paper-2)]"
                        onClick={() => setActiveSeriesId(s.id)}
                      >
                        <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                          {s.family} · {s.count} 詞
                        </p>
                        <p className="mt-1 text-lg">{s.title}</p>
                        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{s.blurb}</p>
                        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
                          {s.terms.join("／")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                className="text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
                onClick={() => setActiveSeriesId(null)}
              >
                ← 全部主題系列
              </button>
              <header className="space-y-2">
                <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                  {activeSeries.family}
                </p>
                <h2 className="font-[family-name:var(--font-sans)] text-2xl">
                  {activeSeries.title}
                </h2>
                <p className="leading-relaxed text-[var(--color-ink-muted)]">
                  {activeSeries.blurb}
                </p>
                <p className="text-sm">
                  本組：<span className="tracking-wide">{activeSeries.terms.join("／")}</span>
                </p>
              </header>
              <ul className="space-y-4">
                {activeTerms.map((c) => (
                  <li
                    key={c.term}
                    className="border-t border-[var(--color-line)] pt-4 first:border-t-0 first:pt-0"
                  >
                    <p className="text-xl">{c.term}</p>
                    {c.zhuyin ? (
                      <p className="text-xs text-[var(--color-ink-muted)]">{c.zhuyin}</p>
                    ) : null}
                    <p className="mt-2 leading-relaxed">{c.short_def}</p>
                    {c.long_def ? (
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                        {c.long_def}
                      </p>
                    ) : null}
                    {c.usage_context ? (
                      <p className="mt-2 text-sm">
                        <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                          用法　
                        </span>
                        {c.usage_context}
                      </p>
                    ) : null}
                    {c.daily_example ? (
                      <p className="mt-1 text-sm">
                        <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                          日常例　
                        </span>
                        {c.daily_example}
                      </p>
                    ) : null}
                    {c.literary_example ? (
                      <p className="mt-1 text-sm">
                        <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">
                          書面例　
                        </span>
                        {c.literary_example}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
