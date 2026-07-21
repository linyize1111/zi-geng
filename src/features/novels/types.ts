export type NovelProject = {
  id: string;
  userId: string;
  title: string;
  premise: string;
  notes: string;
  syncStatus: "local-only" | "pending" | "synced";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateNovelInput = {
  userId: string;
  title?: string;
  premise?: string;
};

export type UpdateNovelInput = {
  title?: string;
  premise?: string;
  notes?: string;
};
