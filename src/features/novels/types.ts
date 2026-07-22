export type NovelPlanPhase =
  | "concept"
  | "world"
  | "characters"
  | "plot"
  | "scenes"
  | "draft"
  | "revise";

export const NOVEL_PLAN_PHASES: { id: NovelPlanPhase; label: string; hint: string }[] = [
  { id: "concept", label: "構思", hint: "logline、主題、類型約定" },
  { id: "world", label: "世界", hint: "壓力、日常、資訊落差" },
  { id: "characters", label: "角色", hint: "欲望、對手、秘密、聲音" },
  { id: "plot", label: "情節", hint: "轉折、三幕、代價（待大綱覆寫）" },
  { id: "scenes", label: "場景", hint: "利害、進出場、感官錨" },
  { id: "draft", label: "草稿", hint: "單場推進、對話、開場" },
  { id: "revise", label: "修訂", hint: "主題回聲、刪減、動機" },
];

/** Local creative-plan workbook; outline body reserved until user pastes it. */
export type NovelCreativePlan = {
  /** Reserved zone: paste full / partial outline later */
  outlineDraft: string;
  outlineStatus: "reserved" | "draft" | "locked";
  logline: string;
  theme: string;
  genrePromise: string;
  worldNotes: string;
  characterNotes: string;
  plotBeats: string;
  openQuestions: string;
  currentPhase: NovelPlanPhase;
};

export function emptyCreativePlan(): NovelCreativePlan {
  return {
    outlineDraft: "",
    outlineStatus: "reserved",
    logline: "",
    theme: "",
    genrePromise: "",
    worldNotes: "",
    characterNotes: "",
    plotBeats: "",
    openQuestions: "",
    currentPhase: "concept",
  };
}

export type NovelProject = {
  id: string;
  userId: string;
  title: string;
  premise: string;
  notes: string;
  plan: NovelCreativePlan;
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
  plan?: Partial<NovelCreativePlan>;
};
