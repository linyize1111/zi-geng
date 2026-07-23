export type JapaneseProgress = {
  id: string;
  userId: string;
  kanaId: string;
  seen: number;
  correct: number;
  streak: number;
  lastPracticedAt: string;
};

/** One practice answer; used for accurate weekly review counts. */
export type JapanesePracticeEvent = {
  id: string;
  userId: string;
  kanaId: string;
  correct: boolean;
  practicedAt: string;
};
