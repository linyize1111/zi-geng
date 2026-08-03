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
  knowledge_id?: string | null;
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
  long_def?: string | null;
  usage_context?: string | null;
  part_of_speech?: string | null;
  difficulty: number;
  category: string | null;
  tags?: string[] | null;
  daily_example?: string | null;
  literary_example?: string | null;
};

export type CraftCard = {
  id: string;
  name: string;
  one_liner: string;
  purpose: string;
  bad_example?: string | null;
  good_example?: string | null;
  breakdown?: string | null;
  exercise?: string | null;
  tags?: string[] | null;
  module?: string | null;
  lesson_order?: number | null;
  hook?: string | null;
  concept?: string | null;
  paragraph_demo?: string | null;
  breakdown_steps?: string[] | null;
  quick_drill?: string | null;
  deeper_drill?: string | null;
};

export type WritingPrompt = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  suggested_words: number | null;
  suggested_minutes: number | null;
  tags?: string[] | null;
};

export type NovelTask = {
  id: string;
  title: string;
  body: string;
  minutes_min: number;
  minutes_max: number;
  tags?: string[] | null;
  difficulty?: number | null;
};

export type KnowledgeCard = {
  id: string;
  series: string;
  topic_key: string;
  title: string;
  hook: string;
  story_md?: string | null;
  reading_time_sec?: number | null;
  difficulty?: number | null;
  writing_use?: string | null;
};

export type DailyPlanBundle = {
  plan: DailyPlan;
  quote: QuoteCard | null;
  vocabulary: VocabCard[];
  craft: CraftCard | null;
  prompt: WritingPrompt | null;
  novelTask: NovelTask | null;
  knowledge: KnowledgeCard | null;
};
