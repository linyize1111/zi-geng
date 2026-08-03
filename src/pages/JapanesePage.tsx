import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { BEGINNER_GRAMMAR, BEGINNER_VOCAB } from "@/features/japanese/beginner-content";
import { buildFiveMinutePlan, pickNextKana } from "@/features/japanese/five-minute";
import {
  kanaByRow,
  kanaByScript,
  kanaRowNames,
  type KanaEntry,
  type KanaScript,
} from "@/features/japanese/kana";
import { listProgress, recordAnswer } from "@/features/japanese/progress-store";
import { recordStudyEvent } from "@/features/study/events-api";
import { cn } from "@/lib/utils";
import { routes } from "@/routes/paths";

type Tab = "today" | "kana" | "drill" | "vocabulary" | "grammar";

function tabFromPath(pathname: string): Tab {
  if (pathname.includes("/vocabulary")) return "vocabulary";
  if (pathname.includes("/grammar")) return "grammar";
  if (pathname.includes("/kana")) return "kana";
  return "today";
}

function pickChoices(correct: KanaEntry, pool: KanaEntry[]): string[] {
  const others = pool
    .filter((k) => k.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((k) => k.romaji);
  return [...others, correct.romaji].sort(() => Math.random() - 0.5);
}

function KanaGrid({ script }: { script: KanaScript }) {
  const rows = useMemo(() => {
    const list = kanaByScript(script);
    const map = new Map<string, KanaEntry[]>();
    for (const k of list) {
      const arr = map.get(k.row) ?? [];
      arr.push(k);
      map.set(k.row, arr);
    }
    return [...map.entries()];
  }, [script]);

  return (
    <div className="space-y-4">
      {rows.map(([row, items]) => (
        <div key={row}>
          <p className="mb-2 text-xs tracking-widest text-[var(--color-ink-muted)]">{row}</p>
          <ul
            className={cn(
              "grid gap-2",
              items.length <= 3 ? "grid-cols-3 sm:grid-cols-3" : "grid-cols-5 sm:grid-cols-5",
            )}
          >
            {items.map((k) => (
              <li
                key={k.id}
                className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] py-3"
              >
                <span className="font-[family-name:var(--font-sans)] text-2xl">{k.char}</span>
                <span className="mt-1 text-xs text-[var(--color-ink-muted)]">{k.romaji}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FiveMinutePanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const dateKey = new Date().toISOString().slice(0, 10);
  const progressQuery = useQuery({
    queryKey: ["japanese-progress", userId],
    queryFn: () => listProgress(userId),
  });

  const plan = useMemo(() => {
    const progress = progressQuery.data ?? [];
    return buildFiveMinutePlan({
      kanaPool: kanaByScript("hiragana").filter((k) =>
        ["あ行", "か行", "さ行", "た行", "な行"].includes(k.row),
      ),
      vocabPool: BEGINNER_VOCAB,
      grammarPool: BEGINNER_GRAMMAR,
      progress,
      dateKey,
    });
  }, [progressQuery.data, dateKey]);

  const [quizIdx, setQuizIdx] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad">("idle");
  const [session, setSession] = useState({ asked: 0, correct: 0 });

  const quizPool = plan.kana;
  const current = quizPool[quizIdx % Math.max(1, quizPool.length)];
  const choices = useMemo(
    () => (current ? pickChoices(current, quizPool) : []),
    [current, quizPool, quizIdx],
  );

  const answerMutation = useMutation({
    mutationFn: async (payload: { kanaId: string; correct: boolean }) => {
      await recordAnswer(userId, payload.kanaId, payload.correct);
      await recordStudyEvent({
        contentType: "japanese",
        contentId: payload.kanaId,
        normalizedKey: payload.kanaId,
        eventType: payload.correct ? "completed" : "not_useful",
        meta: { kind: "japanese_kana", correct: payload.correct },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["japanese-progress", userId] });
    },
  });

  function onPick(romaji: string) {
    if (!current || feedback !== "idle") return;
    const ok = romaji === current.romaji;
    setFeedback(ok ? "ok" : "bad");
    setSession((s) => ({ asked: s.asked + 1, correct: s.correct + (ok ? 1 : 0) }));
    answerMutation.mutate({ kanaId: current.id, correct: ok });
  }

  function nextQuiz() {
    setFeedback("idle");
    setQuizIdx((i) => (i + 1) % Math.max(1, plan.quizSize));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-ink-muted)]">
        今日 5 分鐘：假名 5 → 詞彙 3 → 句型 1 → 小測 {plan.quizSize}。錯題會優先再出。
      </p>

      <section className="space-y-2">
        <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">今日假名</h2>
        <ul className="flex flex-wrap gap-2">
          {plan.kana.map((k) => (
            <li
              key={k.id}
              className="rounded-md border border-[var(--color-line)] px-3 py-2 text-center"
            >
              <span className="font-[family-name:var(--font-sans)] text-2xl">{k.char}</span>
              <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">{k.romaji}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">今日詞彙</h2>
        <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
          {plan.vocab.map((v) => (
            <li key={v.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-[family-name:var(--font-sans)] text-xl">{v.word}</span>
                <span className="text-sm text-[var(--color-ink-muted)]">{v.reading}</span>
              </div>
              <p className="text-sm">{v.meaningZh}</p>
            </li>
          ))}
        </ul>
      </section>

      {plan.grammar ? (
        <section className="rounded-lg border border-[var(--color-line)] p-4 space-y-2">
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">今日句型</h2>
          <p className="text-sm font-medium">{plan.grammar.title}</p>
          <p className="font-[family-name:var(--font-sans)] text-lg">{plan.grammar.pattern}</p>
          <p className="text-sm text-[var(--color-ink-muted)]">{plan.grammar.meaningZh}</p>
          <p className="text-sm">
            {plan.grammar.example}
            {plan.grammar.exampleZh ? (
              <span className="ml-2 text-[var(--color-ink-muted)]">
                （{plan.grammar.exampleZh}）
              </span>
            ) : null}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            造句模板：把句型裡的空位換成今天的詞彙再說一次。
          </p>
        </section>
      ) : null}

      {current ? (
        <section className="space-y-3">
          <h2 className="text-sm tracking-widest text-[var(--color-ink-muted)]">
            小測（錯題優先）{quizIdx + 1}/{plan.quizSize}
          </h2>
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-4 py-8 text-center">
            <p className="font-[family-name:var(--font-sans)] text-5xl">{current.char}</p>
            {feedback === "bad" ? (
              <p className="mt-2 text-sm text-[var(--color-danger)]">正解：{current.romaji}</p>
            ) : null}
            {feedback === "ok" ? (
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">正確</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                disabled={feedback !== "idle"}
                className="rounded-lg border border-[var(--color-line)] px-3 py-3 text-sm hover:bg-[var(--color-accent-soft)]"
                onClick={() => onPick(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {feedback !== "idle" ? (
            <Button type="button" onClick={nextQuiz}>
              下一題
            </Button>
          ) : null}
          <p className="text-sm text-[var(--color-ink-muted)]">
            本回合 {session.correct}/{session.asked}
          </p>
        </section>
      ) : null}
    </div>
  );
}

function DrillPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [script, setScript] = useState<KanaScript>("hiragana");
  const [row, setRow] = useState<string>("あ行");
  const rows = kanaRowNames(script);
  const pool = useMemo(() => {
    const byRow = kanaByRow(script, row);
    return byRow.length ? byRow : kanaByScript(script);
  }, [script, row]);

  const progressQuery = useQuery({
    queryKey: ["japanese-progress", userId],
    queryFn: () => listProgress(userId),
  });

  const [current, setCurrent] = useState<KanaEntry>(() => pool[0]!);
  const [choices, setChoices] = useState<string[]>(() => pickChoices(current, pool));
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad">("idle");
  const [session, setSession] = useState({ asked: 0, correct: 0 });

  const answerMutation = useMutation({
    mutationFn: (payload: { kanaId: string; correct: boolean }) =>
      recordAnswer(userId, payload.kanaId, payload.correct),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["japanese-progress", userId] });
    },
  });

  function nextCard(nextScript = script, nextRow = row) {
    const nextPool = (() => {
      const r = kanaByRow(nextScript, nextRow);
      return r.length ? r : kanaByScript(nextScript);
    })();
    const next = pickNextKana(nextPool, progressQuery.data ?? [], {
      avoidId: current.id,
      preferWrong: true,
    });
    setCurrent(next);
    setChoices(pickChoices(next, nextPool));
    setFeedback("idle");
  }

  function onPick(romaji: string) {
    if (feedback !== "idle") return;
    const ok = romaji === current.romaji;
    setFeedback(ok ? "ok" : "bad");
    setSession((s) => ({ asked: s.asked + 1, correct: s.correct + (ok ? 1 : 0) }));
    answerMutation.mutate({ kanaId: current.id, correct: ok });
  }

  const mastered =
    progressQuery.data?.filter((p) => p.seen >= 3 && p.correct / p.seen >= 0.8).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["hiragana", "katakana"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              script === s
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] text-[var(--color-ink-muted)]",
            )}
            onClick={() => {
              setScript(s);
              const first = kanaRowNames(s)[0] ?? "あ行";
              setRow(first);
              nextCard(s, first);
            }}
          >
            {s === "hiragana" ? "平假名" : "片假名"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <button
            key={r}
            type="button"
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs",
              row === r
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] text-[var(--color-ink-muted)]",
            )}
            onClick={() => {
              setRow(r);
              nextCard(script, r);
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--color-ink-muted)]">
        分行練；錯題優先重出。平假名熟了再混片假名。羅馬音只是輔助。
      </p>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-4 py-10 text-center">
        <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">選出羅馬音</p>
        <p className="mt-4 font-[family-name:var(--font-sans)] text-6xl tracking-wide">
          {current.char}
        </p>
        {feedback === "bad" ? (
          <p className="mt-3 text-sm text-[var(--color-danger)]">正解：{current.romaji}</p>
        ) : null}
        {feedback === "ok" ? (
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">正確</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {choices.map((c) => (
          <button
            key={c}
            type="button"
            disabled={feedback !== "idle"}
            className={cn(
              "rounded-lg border border-[var(--color-line)] px-3 py-3 text-sm hover:bg-[var(--color-accent-soft)]",
              feedback !== "idle" && c === current.romaji && "border-[var(--color-ink)]",
            )}
            onClick={() => onPick(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {feedback !== "idle" ? (
        <Button type="button" onClick={() => nextCard()}>
          下一題
        </Button>
      ) : null}

      <p className="text-sm text-[var(--color-ink-muted)]">
        本回合 {session.correct}/{session.asked}
        {progressQuery.data
          ? ` · 累計練習 ${progressQuery.data.length} 字 · 較熟 ${mastered}`
          : null}
      </p>
    </div>
  );
}

const tabs: { id: Tab; to: string; label: string }[] = [
  { id: "today", to: routes.japanese, label: "今日 5 分鐘" },
  { id: "kana", to: routes.japaneseKana, label: "五十音" },
  { id: "drill", to: `${routes.japanese}?mode=drill`, label: "分行練習" },
  { id: "vocabulary", to: routes.japaneseVocabulary, label: "詞彙" },
  { id: "grammar", to: routes.japaneseGrammar, label: "文法" },
];

export default function JapanesePage() {
  const auth = useAuth();
  const location = useLocation();
  const pathTab = tabFromPath(location.pathname);
  const [script, setScript] = useState<KanaScript>("hiragana");
  const search = new URLSearchParams(location.search);
  const tab: Tab =
    location.pathname === routes.japanese || location.pathname.endsWith("/japanese")
      ? search.get("mode") === "drill"
        ? "drill"
        : "today"
      : pathTab;

  if (auth.status === "loading") {
    return <PageLoading label="載入日文區…" />;
  }

  if (!auth.user) {
    return <PageState title="請先登入" description="五十音進度存在本機，需登入後使用。" />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">日文</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          先做「今日 5 分鐘」；分行練五十音，錯題優先。進度存在本機。
        </p>
      </header>

      <nav aria-label="日文分區" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.id}
            to={t.to}
            end={t.id === "today"}
            className={({ isActive }) =>
              cn(
                "rounded-md border px-3 py-1.5 text-sm",
                (t.id === "today" || t.id === "drill" ? tab === t.id : isActive)
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-muted)]",
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {tab === "today" ? <FiveMinutePanel userId={auth.user.id} /> : null}

      {tab === "kana" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["hiragana", "katakana"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm",
                  script === s
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-muted)]",
                )}
                onClick={() => setScript(s)}
              >
                {s === "hiragana" ? "平假名" : "片假名"}
              </button>
            ))}
          </div>
          <KanaGrid script={script} />
        </div>
      ) : null}

      {tab === "drill" ? <DrillPanel userId={auth.user.id} /> : null}

      {tab === "vocabulary" ? (
        <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
          {BEGINNER_VOCAB.map((v) => (
            <li key={v.id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-[family-name:var(--font-sans)] text-xl">{v.word}</span>
                <span className="text-sm text-[var(--color-ink-muted)]">{v.reading}</span>
              </div>
              <p className="text-sm">{v.meaningZh}</p>
              {v.note ? <p className="text-xs text-[var(--color-ink-muted)]">{v.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "grammar" ? (
        <ul className="space-y-3">
          {BEGINNER_GRAMMAR.map((g) => (
            <li key={g.id} className="space-y-2 rounded-lg border border-[var(--color-line)] p-4">
              <p className="text-sm font-medium">{g.title}</p>
              <p className="font-[family-name:var(--font-sans)] text-lg tracking-wide">
                {g.pattern}
              </p>
              <p className="text-sm text-[var(--color-ink-muted)]">{g.meaningZh}</p>
              <p className="text-sm">
                {g.example}
                <span className="ml-2 text-[var(--color-ink-muted)]">（{g.exampleZh}）</span>
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                造句模板：替換例句中的名詞／動詞再練一次。
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-[var(--color-ink-muted)]">
        含濁音・半濁音・拗音；音訊稍後再補。回今日？
        <Link className="ml-1 underline-offset-4 hover:underline" to={routes.today}>
          今日
        </Link>
      </p>
    </div>
  );
}
