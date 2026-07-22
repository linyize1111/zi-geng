export type DailyPlan = {
  id: string;
  user_id: string;
  local_date: string;
  timezone: string;
  quote_id: string | null;
  vocabulary_ids: string[];
  craft_id: string | null;
  writing_prompt_id: string | null;
  novel_task_template_id: string | null;
  japanese_payload: Record<string, unknown>;
  completion: Record<string, unknown>;
  replacements: Record<string, unknown>;
};

export type QuoteCard = {
  id: string;
  display_quote: string;
  author_name: string;
  work_title: string;
  section_title?: string | null;
  original_quote?: string | null;
  author_bio?: string;
  publication_year?: number | null;
  translator_name?: string | null;
  bibliography_url?: string | null;
  short_analysis: string;
  deep_analysis?: string;
  context?: string;
  writing_insight?: string;
  counterpoint?: string;
  themes?: string[];
  verification_status: string;
  copyright_status?: string;
};

export type VocabCard = {
  id: string;
  term: string;
  zhuyin: string | null;
  short_def: string;
  difficulty: number;
  category: string | null;
};

export type CraftCard = {
  id: string;
  name: string;
  one_liner: string;
  purpose: string;
};

export type WritingPrompt = {
  id: string;
  title: string;
  body: string;
  suggested_words: number | null;
  suggested_minutes: number | null;
};

export type NovelTask = {
  id: string;
  title: string;
  body: string;
  minutes_min: number;
  minutes_max: number;
};

export type DailyPlanBundle = {
  plan: DailyPlan;
  quote: QuoteCard | null;
  vocabulary: VocabCard[];
  craft: CraftCard | null;
  prompt: WritingPrompt | null;
  novelTask: NovelTask | null;
};
