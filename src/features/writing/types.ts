export type WritingSyncStatus = "local-only" | "pending" | "synced" | "conflict" | "error";

export type WritingVisibility = "private" | "draft" | "ready";

/** Local writing draft (IndexedDB). Cloud sync arrives later in Phase 4. */
export type WritingDraft = {
  id: string;
  userId: string;
  promptId: string | null;
  promptTitle: string | null;
  title: string;
  contentMd: string;
  contentPlain: string;
  category: string;
  tags: string[];
  visibility: WritingVisibility;
  wordCount: number;
  revision: number;
  syncStatus: WritingSyncStatus;
  publishedArticleId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDraftInput = {
  userId: string;
  title?: string;
  contentMd?: string;
  promptId?: string | null;
  promptTitle?: string | null;
  category?: string;
  tags?: string[];
};

export type UpdateDraftInput = {
  title?: string;
  contentMd?: string;
  category?: string;
  tags?: string[];
  visibility?: WritingVisibility;
};
