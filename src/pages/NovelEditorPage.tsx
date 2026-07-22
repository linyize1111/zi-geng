import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { getNovel, updateNovel } from "@/features/novels/project-store";
import {
  NOVEL_PLAN_PHASES,
  type NovelCreativePlan,
  type NovelPlanPhase,
} from "@/features/novels/types";
import { novelChaptersPath, novelCharactersPath, novelScenesPath, routes } from "@/routes/paths";

function Field({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">{label}</span>
      {hint ? <p className="text-xs text-[var(--color-ink-muted)]">{hint}</p> : null}
      <textarea
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm leading-relaxed outline-none"
        style={{ minHeight: `${rows * 1.5}rem` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function NovelEditorPage() {
  const { projectId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = auth.user?.id;

  const query = useQuery({
    queryKey: ["novel-project", userId, projectId],
    enabled: Boolean(userId && projectId),
    queryFn: () => getNovel(userId!, projectId!),
  });

  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<NovelCreativePlan | null>(null);

  useEffect(() => {
    if (query.data) {
      setTitle(query.data.title);
      setPremise(query.data.premise);
      setNotes(query.data.notes);
      setPlan(query.data.plan);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateNovel(userId!, projectId!, {
        title,
        premise,
        notes,
        plan: plan ?? undefined,
      }),
    onSuccess: (row) => {
      queryClient.setQueryData(["novel-project", userId, projectId], row);
      void queryClient.invalidateQueries({ queryKey: ["novel-projects", userId] });
    },
  });

  useEffect(() => {
    if (!query.data || !userId || !projectId || !plan) return;
    const same =
      title === query.data.title &&
      premise === query.data.premise &&
      notes === query.data.notes &&
      JSON.stringify(plan) === JSON.stringify(query.data.plan);
    if (same) return;
    const t = window.setTimeout(() => saveMutation.mutate(), 450);
    return () => window.clearTimeout(t);
  }, [title, premise, notes, plan, query.data, userId, projectId]);

  function patchPlan(partial: Partial<NovelCreativePlan>) {
    setPlan((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  if (auth.status === "loading" || query.isLoading) {
    return <PageLoading label="載入專案…" />;
  }

  if (!userId || !projectId) {
    return (
      <PageState title="無效的專案" actionLabel="回列表" onAction={() => navigate(routes.novels)} />
    );
  }

  if (!query.data || !plan) {
    return (
      <PageState title="找不到專案" actionLabel="回列表" onAction={() => navigate(routes.novels)} />
    );
  }

  const outlineLabel =
    plan.outlineStatus === "reserved"
      ? "大綱（保留區・待你貼上）"
      : plan.outlineStatus === "locked"
        ? "大綱（已鎖定）"
        : "大綱（草稿中）";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={routes.novels}
          className="text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
        >
          ← 小說列表
        </Link>
        <p className="text-xs text-[var(--color-ink-muted)]">
          {saveMutation.isPending
            ? "儲存中…"
            : saveMutation.isSuccess
              ? "已自動儲存（本機）"
              : "僅本機"}
        </p>
      </div>

      <input
        className="w-full border-0 bg-transparent font-[family-name:var(--font-sans)] text-3xl outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="書名"
      />

      <nav className="flex flex-wrap gap-2" aria-label="小說工作台">
        <span className="rounded-md border border-[var(--color-ink)] bg-[var(--color-ink)] px-3 py-1.5 text-sm text-[var(--color-paper)]">
          創作計畫
        </span>
        <Link
          to={novelCharactersPath(projectId)}
          className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)]"
        >
          角色
        </Link>
        <Link
          to={novelChaptersPath(projectId)}
          className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)]"
        >
          章節
        </Link>
        <Link
          to={novelScenesPath(projectId)}
          className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)]"
        >
          場景
        </Link>
      </nav>

      <section className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
        <p className="text-xs tracking-widest text-[var(--color-ink-muted)]">創作計畫系統</p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          以你目前的構思為基準推進；完整大綱可稍後貼入保留區。今日的「小說任務」會依階段題庫抽題。
        </p>
        <div className="flex flex-wrap gap-2">
          {NOVEL_PLAN_PHASES.map((ph) => {
            const active = plan.currentPhase === ph.id;
            return (
              <button
                key={ph.id}
                type="button"
                title={ph.hint}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  active
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
                }`}
                onClick={() => patchPlan({ currentPhase: ph.id as NovelPlanPhase })}
              >
                {ph.label}
              </button>
            );
          })}
        </div>
      </section>

      <Field
        label={outlineLabel}
        hint="先留空即可。你之後把大綱傳給我或直接貼在這裡，再回頭跑「待大綱」任務覆寫情節骨架。"
        value={plan.outlineDraft}
        onChange={(v) => patchPlan({ outlineDraft: v })}
        rows={8}
        placeholder="（保留）章節大綱、時間線、卷結構……稍後再貼"
      />

      <Field
        label="前提／一句話故事"
        value={premise}
        onChange={setPremise}
        rows={3}
        placeholder="這本小說在講什麼？"
      />

      <Field
        label="Logline（可與前提分開精煉）"
        value={plan.logline}
        onChange={(v) => patchPlan({ logline: v })}
        rows={2}
        placeholder="誰・想要・障礙・代價"
      />

      <Field
        label="主題句"
        value={plan.theme}
        onChange={(v) => patchPlan({ theme: v })}
        rows={2}
        placeholder="這本想追問的問題（可改版）"
      />

      <Field
        label="類型與讀者約定"
        value={plan.genrePromise}
        onChange={(v) => patchPlan({ genrePromise: v })}
        rows={3}
        placeholder="類型、承諾的體驗、拒絕提供的東西"
      />

      <Field
        label="世界筆記"
        value={plan.worldNotes}
        onChange={(v) => patchPlan({ worldNotes: v })}
        rows={5}
        placeholder="壓力來源、規則、資訊落差…"
      />

      <Field
        label="角色筆記"
        value={plan.characterNotes}
        onChange={(v) => patchPlan({ characterNotes: v })}
        rows={5}
        placeholder="want/need、對手、秘密、聲音樣本…"
      />

      <Field
        label="情節節點（暫定・待大綱覆寫）"
        value={plan.plotBeats}
        onChange={(v) => patchPlan({ plotBeats: v })}
        rows={6}
        placeholder="三幕、中點、低谷、結局代價…"
      />

      <Field
        label="未解問題"
        value={plan.openQuestions}
        onChange={(v) => patchPlan({ openQuestions: v })}
        rows={4}
        placeholder="等大綱或寫作過程中冒出來的洞"
      />

      <Field
        label="自由筆記"
        value={notes}
        onChange={setNotes}
        rows={6}
        placeholder="雜記、靈感、廢稿摘句…"
      />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(routes.novels)}>
          完成
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(routes.today)}>
          回今日做小說任務
        </Button>
      </div>
    </div>
  );
}
