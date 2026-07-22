import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { PageLoading, PageState } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  createChapter,
  createCharacter,
  createScene,
  listChapters,
  listCharacters,
  listScenes,
  softDeleteChapter,
  softDeleteCharacter,
  softDeleteScene,
  updateChapter,
  updateCharacter,
  updateScene,
} from "@/features/novels/entity-store";
import { getNovel } from "@/features/novels/project-store";
import type { NovelChapter, NovelCharacter, NovelScene } from "@/features/novels/types";
import { novelDetailPath, routes } from "@/routes/paths";
import { cn } from "@/lib/utils";

type EntityKind = "characters" | "chapters" | "scenes";

function kindFromPath(pathname: string): EntityKind {
  if (pathname.includes("/chapters")) return "chapters";
  if (pathname.includes("/scenes")) return "scenes";
  return "characters";
}

const LABELS: Record<EntityKind, { title: string; add: string; empty: string }> = {
  characters: { title: "角色", add: "新增角色", empty: "尚未建立角色。" },
  chapters: { title: "章節", add: "新增章節", empty: "尚未建立章節。" },
  scenes: { title: "場景", add: "新增場景", empty: "尚未建立場景。" },
};

export default function NovelEntitiesPage() {
  const { projectId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const userId = auth.user?.id;
  const kind = kindFromPath(location.pathname);
  const labels = LABELS[kind];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const projectQuery = useQuery({
    queryKey: ["novel-project", userId, projectId],
    enabled: Boolean(userId && projectId),
    queryFn: () => getNovel(userId!, projectId!),
  });

  const charactersQuery = useQuery({
    queryKey: ["novel-entities", "characters", userId, projectId],
    enabled: Boolean(userId && projectId && kind === "characters"),
    queryFn: () => listCharacters(userId!, projectId!),
  });

  const chaptersQuery = useQuery({
    queryKey: ["novel-entities", "chapters", userId, projectId],
    enabled: Boolean(userId && projectId && (kind === "chapters" || kind === "scenes")),
    queryFn: () => listChapters(userId!, projectId!),
  });

  const scenesQuery = useQuery({
    queryKey: ["novel-entities", "scenes", userId, projectId],
    enabled: Boolean(userId && projectId && kind === "scenes"),
    queryFn: () => listScenes(userId!, projectId!),
  });

  const listLoading =
    (kind === "characters" && charactersQuery.isLoading) ||
    (kind === "chapters" && chaptersQuery.isLoading) ||
    (kind === "scenes" && scenesQuery.isLoading);

  const rows: Array<{ id: string; label: string }> =
    kind === "characters"
      ? (charactersQuery.data ?? []).map((r) => ({ id: r.id, label: r.name }))
      : kind === "chapters"
        ? (chaptersQuery.data ?? []).map((r) => ({ id: r.id, label: r.title }))
        : (scenesQuery.data ?? []).map((r) => ({ id: r.id, label: r.title }));

  useEffect(() => {
    setSelectedId(null);
  }, [kind, projectId]);

  useEffect(() => {
    if (!selectedId && rows.length) setSelectedId(rows[0]!.id);
  }, [rows, selectedId]);

  const createMutation = useMutation({
    mutationFn: async (): Promise<{ id: string }> => {
      if (kind === "characters") return createCharacter(userId!, projectId!);
      if (kind === "chapters") return createChapter(userId!, projectId!);
      return createScene(userId!, projectId!);
    },
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: ["novel-entities", kind, userId, projectId] });
      setSelectedId(row.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (kind === "characters") return softDeleteCharacter(userId!, id);
      if (kind === "chapters") return softDeleteChapter(userId!, id);
      return softDeleteScene(userId!, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["novel-entities", kind, userId, projectId] });
      setSelectedId(null);
    },
  });

  if (auth.status === "loading" || projectQuery.isLoading || listLoading) {
    return <PageLoading label={`載入${labels.title}…`} />;
  }

  if (!userId || !projectId) {
    return (
      <PageState title="無效的專案" actionLabel="回列表" onAction={() => navigate(routes.novels)} />
    );
  }

  if (!projectQuery.data) {
    return (
      <PageState title="找不到專案" actionLabel="回列表" onAction={() => navigate(routes.novels)} />
    );
  }

  const selectedCharacter =
    kind === "characters"
      ? ((charactersQuery.data ?? []).find((r) => r.id === selectedId) ?? null)
      : null;
  const selectedChapter =
    kind === "chapters"
      ? ((chaptersQuery.data ?? []).find((r) => r.id === selectedId) ?? null)
      : null;
  const selectedScene =
    kind === "scenes" ? ((scenesQuery.data ?? []).find((r) => r.id === selectedId) ?? null) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={novelDetailPath(projectId)}
          className="text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
        >
          ← {projectQuery.data.title || "創作計畫"}
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="小說實體">
        {(
          [
            ["characters", `/novels/${projectId}/characters`],
            ["chapters", `/novels/${projectId}/chapters`],
            ["scenes", `/novels/${projectId}/scenes`],
          ] as const
        ).map(([k, to]) => (
          <Link
            key={k}
            to={to}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              kind === k
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] text-[var(--color-ink-muted)]",
            )}
          >
            {LABELS[k].title}
          </Link>
        ))}
        <Link
          to={novelDetailPath(projectId)}
          className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)]"
        >
          創作計畫
        </Link>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sans)] text-2xl tracking-wide">
            {labels.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">本機清單；雲端同步稍後接上。</p>
        </div>
        <Button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {labels.add}
        </Button>
      </header>

      {rows.length === 0 ? (
        <PageState title={labels.empty} description="先新增一筆，再慢慢補細節。" />
      ) : (
        <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
          <ul className="space-y-1">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm",
                    selectedId === r.id
                      ? "bg-[var(--color-accent-soft)]"
                      : "text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)]/50",
                  )}
                  onClick={() => setSelectedId(r.id)}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>

          {selectedCharacter ? (
            <CharacterEditor
              key={selectedCharacter.id}
              userId={userId}
              row={selectedCharacter}
              onDelete={() => deleteMutation.mutate(selectedCharacter.id)}
            />
          ) : null}
          {selectedChapter ? (
            <ChapterEditor
              key={selectedChapter.id}
              userId={userId}
              row={selectedChapter}
              onDelete={() => deleteMutation.mutate(selectedChapter.id)}
            />
          ) : null}
          {selectedScene ? (
            <SceneEditor
              key={selectedScene.id}
              userId={userId}
              row={selectedScene}
              chapters={chaptersQuery.data ?? []}
              onDelete={() => deleteMutation.mutate(selectedScene.id)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function CharacterEditor({
  userId,
  row,
  onDelete,
}: {
  userId: string;
  row: NovelCharacter;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(row.name);
  const [role, setRole] = useState(row.role);
  const [notes, setNotes] = useState(row.notes);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void updateCharacter(userId, row.id, { name, role, notes }).then(() => {
        void queryClient.invalidateQueries({
          queryKey: ["novel-entities", "characters", userId, row.projectId],
        });
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [name, role, notes, userId, row.id, row.projectId, queryClient]);

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
      <input
        className="w-full border-0 bg-transparent text-xl outline-none"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="角色名"
      />
      <input
        className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="定位（主角／對手…）"
      />
      <textarea
        className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm"
        rows={8}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="欲望、秘密、聲音樣本…"
      />
      <Button type="button" variant="outline" onClick={onDelete}>
        刪除
      </Button>
    </div>
  );
}

function ChapterEditor({
  userId,
  row,
  onDelete,
}: {
  userId: string;
  row: NovelChapter;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(row.title);
  const [synopsis, setSynopsis] = useState(row.synopsis);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void updateChapter(userId, row.id, { title, synopsis }).then(() => {
        void queryClient.invalidateQueries({
          queryKey: ["novel-entities", "chapters", userId, row.projectId],
        });
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [title, synopsis, userId, row.id, row.projectId, queryClient]);

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
      <input
        className="w-full border-0 bg-transparent text-xl outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="章名"
      />
      <textarea
        className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm"
        rows={10}
        value={synopsis}
        onChange={(e) => setSynopsis(e.target.value)}
        placeholder="本章摘要／目標…"
      />
      <Button type="button" variant="outline" onClick={onDelete}>
        刪除
      </Button>
    </div>
  );
}

function SceneEditor({
  userId,
  row,
  chapters,
  onDelete,
}: {
  userId: string;
  row: NovelScene;
  chapters: NovelChapter[];
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(row.title);
  const [goal, setGoal] = useState(row.goal);
  const [bodyMd, setBodyMd] = useState(row.bodyMd);
  const [chapterId, setChapterId] = useState(row.chapterId);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void updateScene(userId, row.id, { title, goal, bodyMd, chapterId }).then(() => {
        void queryClient.invalidateQueries({
          queryKey: ["novel-entities", "scenes", userId, row.projectId],
        });
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [title, goal, bodyMd, chapterId, userId, row.id, row.projectId, queryClient]);

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
      <input
        className="w-full border-0 bg-transparent text-xl outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="場景名"
      />
      <select
        className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        value={chapterId ?? ""}
        onChange={(e) => setChapterId(e.target.value || null)}
      >
        <option value="">（未歸章）</option>
        {chapters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <input
        className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="這場要達成什麼？"
      />
      <textarea
        className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm leading-relaxed"
        rows={12}
        value={bodyMd}
        onChange={(e) => setBodyMd(e.target.value)}
        placeholder="場景正文（Markdown）…"
      />
      <Button type="button" variant="outline" onClick={onDelete}>
        刪除
      </Button>
    </div>
  );
}
