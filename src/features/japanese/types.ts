export type JapaneseProgress = {
  id: string;
  userId: string;
  kanaId: string;
  seen: number;
  correct: number;
  streak: number;
  lastPracticedAt: string;
};
