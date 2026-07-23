import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading } from "@/components/common/PageState";
import { ASSESSMENT_QUESTIONS, ASSESSMENT_VERSION } from "@/features/assessment/questions";
import { latestAssessmentAttempt, saveAssessmentAttempt } from "@/features/assessment/store";
import {
  SECTION_LABELS,
  type AssessmentAnswers,
  type AssessmentAttempt,
  type AssessmentSection,
} from "@/features/assessment/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { routes } from "@/routes/paths";

const SECTIONS = Array.from(
  new Set(ASSESSMENT_QUESTIONS.map((q) => q.section)),
) as AssessmentSection[];

type Phase = "intro" | "quiz" | "result";

function ProfileView({ attempt }: { attempt: AssessmentAttempt }) {
  const { profile } = attempt;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4">
        <p className="text-sm text-[var(--color-ink-muted)]">綜合得分</p>
        <p className="mt-1 font-[family-name:var(--font-sans)] text-4xl tracking-wide">
          {profile.overallPercent}
          <span className="ml-1 text-lg text-[var(--color-ink-muted)]">分</span>
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {attempt.correctCount}/{attempt.questionCount} 題 · 結果存於本機
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {profile.bands.map((b) => (
          <li key={b.band} className="rounded-lg border border-[var(--color-line)] px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{b.label}</span>
              <span className="text-xs text-[var(--color-ink-muted)]">{b.level}</span>
            </div>
            <p className="mt-1 text-2xl tabular-nums">{b.percent}%</p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {b.correct}/{b.total}
            </p>
          </li>
        ))}
      </ul>
      <section className="space-y-2 rounded-lg border border-[var(--color-line)] p-4">
        <h2 className="text-sm font-medium">給你的學習指引</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {profile.guidance.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <p className="pt-2 text-sm">
          <Link className="underline-offset-4 hover:underline" to={routes.learnVocabulary}>
            去詞彙
          </Link>
          {" · "}
          <Link className="underline-offset-4 hover:underline" to={routes.learnQuotes}>
            去名言
          </Link>
          {" · "}
          <Link className="underline-offset-4 hover:underline" to={routes.learnCraft}>
            去寫作技巧
          </Link>
        </p>
      </section>
    </div>
  );
}

export default function AssessmentPage() {
  const auth = useAuth();
  const userId = auth.user?.id ?? "local";
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [result, setResult] = useState<AssessmentAttempt | null>(null);

  const latestQuery = useQuery({
    queryKey: ["assessment-latest", userId],
    queryFn: () => latestAssessmentAttempt(userId),
  });

  const saveMutation = useMutation({
    mutationFn: (a: AssessmentAnswers) => saveAssessmentAttempt(userId, a),
    onSuccess: (attempt) => {
      setResult(attempt);
      setPhase("result");
      void queryClient.invalidateQueries({ queryKey: ["assessment-latest", userId] });
    },
  });

  const bySection = useMemo(() => {
    const map = new Map<AssessmentSection, number>();
    for (const s of SECTIONS) map.set(s, 0);
    for (const q of ASSESSMENT_QUESTIONS) {
      map.set(q.section, (map.get(q.section) ?? 0) + 1);
    }
    return map;
  }, []);

  const flat = ASSESSMENT_QUESTIONS;
  const current = flat[index];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / flat.length) * 100);

  function startFresh() {
    setAnswers({});
    setIndex(0);
    setResult(null);
    setPhase("quiz");
  }

  function selectChoice(choiceIndex: number) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: choiceIndex }));
  }

  function goNext() {
    if (!current) return;
    if (answers[current.id] === undefined) return;
    if (index >= flat.length - 1) {
      saveMutation.mutate(answers);
      return;
    }
    setIndex((i) => Math.min(i + 1, flat.length - 1));
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  if (latestQuery.isLoading && phase === "intro") {
    return <PageLoading label="載入評量…" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">
          人文／文筆評量
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {flat.length} 題 · 六區段 · 結果存本機 · 無付費牆 · v{ASSESSMENT_VERSION}
        </p>
      </header>

      {phase === "intro" ? (
        <div className="space-y-4">
          <section className="space-y-2 rounded-lg border border-[var(--color-line)] p-4 text-sm text-[var(--color-ink-muted)]">
            <p>不清楚自己程度時，用這份評量定位：詞彙精準、古典、評論、場面描寫。</p>
            <ul className="list-disc pl-5">
              {SECTIONS.map((s) => (
                <li key={s}>
                  {SECTION_LABELS[s]}（{bySection.get(s) ?? 0} 題）
                </li>
              ))}
            </ul>
            <p>約 20–35 分鐘；可上下題，最後一題送出後計分。答案不上傳伺服器。</p>
          </section>
          {latestQuery.data ? (
            <div className="space-y-3">
              <h2 className="text-sm font-medium">上次結果</h2>
              <ProfileView attempt={latestQuery.data} />
            </div>
          ) : null}
          <Button type="button" onClick={startFresh}>
            {latestQuery.data ? "重新評量" : "開始評量"}
          </Button>
          <p className="text-sm">
            <Link className="underline-offset-4 hover:underline" to={routes.learn}>
              回學習首頁
            </Link>
            {" · "}
            <Link className="underline-offset-4 hover:underline" to={routes.settings}>
              設定
            </Link>
          </p>
        </div>
      ) : null}

      {phase === "quiz" && current ? (
        <div className="space-y-4">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
            <div
              className="h-full bg-[var(--color-accent)] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {SECTION_LABELS[current.section]} · {index + 1}/{flat.length}
          </p>
          {current.passage ? (
            <blockquote className="border-l-2 border-[var(--color-line)] pl-3 text-sm italic">
              {current.passage}
            </blockquote>
          ) : null}
          <h2 className="text-lg leading-relaxed">{current.prompt}</h2>
          <ul className="space-y-2">
            {current.choices.map((choice, i) => {
              const selected = answers[current.id] === i;
              return (
                <li key={`${current.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => selectChoice(i)}
                    className={
                      selected
                        ? "w-full rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-3 text-left text-sm"
                        : "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-4 py-3 text-left text-sm hover:border-[var(--color-accent)]"
                    }
                  >
                    <span className="mr-2 text-[var(--color-ink-muted)]">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {choice}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={index === 0} onClick={goPrev}>
              上一題
            </Button>
            <Button
              type="button"
              disabled={answers[current.id] === undefined || saveMutation.isPending}
              onClick={goNext}
            >
              {index >= flat.length - 1
                ? saveMutation.isPending
                  ? "儲存中…"
                  : "完成並看結果"
                : "下一題"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPhase("intro")}>
              暫停回首
            </Button>
          </div>
          {saveMutation.isError ? (
            <p className="text-sm text-[var(--color-danger)]">儲存失敗，請再試一次。</p>
          ) : null}
        </div>
      ) : null}

      {phase === "result" && result ? (
        <div className="space-y-4">
          <ProfileView attempt={result} />
          <details className="rounded-lg border border-[var(--color-line)] p-4 text-sm">
            <summary className="cursor-pointer font-medium">逐題解析（可展開）</summary>
            <ul className="mt-3 space-y-3">
              {flat.map((q) => {
                const picked = result.answers[q.id];
                const ok = picked === q.answer;
                return (
                  <li key={q.id} className="border-t border-[var(--color-line)] pt-3">
                    <p className="font-medium">
                      {ok ? "○" : "×"} {q.prompt}
                    </p>
                    <p className="mt-1 text-[var(--color-ink-muted)]">
                      你的答案：{picked !== undefined ? q.choices[picked] : "（未答）"}
                    </p>
                    {!ok ? (
                      <p className="text-[var(--color-ink-muted)]">參考：{q.choices[q.answer]}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{q.explain}</p>
                  </li>
                );
              })}
            </ul>
          </details>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={startFresh}>
              再測一次
            </Button>
            <Button type="button" variant="outline" onClick={() => setPhase("intro")}>
              回評量首頁
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
