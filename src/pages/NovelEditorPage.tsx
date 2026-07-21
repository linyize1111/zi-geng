import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { getNovel, updateNovel } from "@/features/novels/project-store";
import { routes } from "@/routes/paths";

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

  useEffect(() => {
    if (query.data) {
      setTitle(query.data.title);
      setPremise(query.data.premise);
      setNotes(query.data.notes);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateNovel(userId!, projectId!, { title, premise, notes }),
    onSuccess: (row) => {
      queryClient.setQueryData(["novel-project", userId, projectId], row);
      void queryClient.invalidateQueries({ queryKey: ["novel-projects", userId] });
    },
  });

  useEffect(() => {
    if (!query.data || !userId || !projectId) return;
    if (
      title === query.data.title &&
      premise === query.data.premise &&
      notes === query.data.notes
    ) {
      return;
    }
    const t = window.setTimeout(() => saveMutation.mutate(), 400);
    return () => window.clearTimeout(t);
    // autosave on field change
  }, [title, premise, notes, query.data, userId, projectId]);

  if (auth.status === "loading" || query.isLoading) {
    return <PageLoading label="載入專案…" />;
  }

  if (!userId || !projectId) {
    return (
      <PageState title="無效的專案" actionLabel="回列表" onAction={() => navigate(routes.novels)} />
    );
  }

  if (!query.data) {
    return (
      <PageState title="找不到專案" actionLabel="回列表" onAction={() => navigate(routes.novels)} />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
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

      <label className="block space-y-2">
        <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">
          前提／一句話故事
        </span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm leading-relaxed outline-none"
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          placeholder="這本小說在講什麼？"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs tracking-widest text-[var(--color-ink-muted)]">筆記</span>
        <textarea
          className="min-h-64 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm leading-relaxed outline-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="人物、世界觀、未解問題…"
        />
      </label>

      <Button type="button" variant="outline" onClick={() => navigate(routes.novels)}>
        完成
      </Button>
    </div>
  );
}
