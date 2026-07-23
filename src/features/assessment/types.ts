export type AssessmentBand = "vocab" | "classical" | "critique" | "scene";

export type AssessmentSection =
  | "rhetoric"
  | "word_choice"
  | "quote_source"
  | "classical_reading"
  | "critique_lexicon"
  | "scene_rewrite";

export type AssessmentQuestion = {
  id: string;
  section: AssessmentSection;
  band: AssessmentBand;
  prompt: string;
  /** Optional passage / context above choices */
  passage?: string;
  choices: [string, string, string, string];
  /** 0–3 index into choices */
  answer: 0 | 1 | 2 | 3;
  explain: string;
};

export type AssessmentAnswers = Record<string, number>;

export type BandScore = {
  band: AssessmentBand;
  label: string;
  correct: number;
  total: number;
  percent: number;
  level: "起步" | "穩固" | "進階" | "洗練";
};

export type AssessmentProfile = {
  overallPercent: number;
  bands: BandScore[];
  guidance: string[];
};

export type AssessmentAttempt = {
  id: string;
  userId: string;
  answers: AssessmentAnswers;
  profile: AssessmentProfile;
  completedAt: string;
  questionCount: number;
  correctCount: number;
};

export const BAND_LABELS: Record<AssessmentBand, string> = {
  vocab: "詞彙精準",
  classical: "古典素養",
  critique: "評論用語",
  scene: "場面描寫",
};

export const SECTION_LABELS: Record<AssessmentSection, string> = {
  rhetoric: "修辭辨異",
  word_choice: "詞語對照",
  quote_source: "名句出處",
  classical_reading: "文言閱讀",
  critique_lexicon: "評論用語",
  scene_rewrite: "場面改寫",
};
