import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  CraftCard,
  DailyPlan,
  DailyPlanBundle,
  NovelTask,
  QuoteCard,
  VocabCard,
  WritingPrompt,
} from "@/features/daily-plan/types";

export async function fetchOrCreateDailyPlan(timezone = "Asia/Taipei"): Promise<DailyPlanBundle> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const { data: plan, error } = await client
    .rpc("zg_get_or_create_daily_plan", { p_timezone: timezone })
    .single();

  if (error) throw error;
  const daily = plan as DailyPlan;

  const [quote, vocabulary, craft, prompt, novelTask] = await Promise.all([
    daily.quote_id
      ? client
          .from("zg_quotes")
          .select("id, display_quote, author_name, work_title, short_analysis, verification_status")
          .eq("id", daily.quote_id)
          .maybeSingle()
          .then((r) => {
            if (r.error) throw r.error;
            return r.data as QuoteCard | null;
          })
      : Promise.resolve(null),
    daily.vocabulary_ids?.length
      ? client
          .from("zg_vocabulary_cards")
          .select("id, term, zhuyin, short_def, difficulty, category")
          .in("id", daily.vocabulary_ids)
          .then((r) => {
            if (r.error) throw r.error;
            const rows = (r.data ?? []) as VocabCard[];
            const order = new Map(daily.vocabulary_ids.map((id, i) => [id, i]));
            return [...rows].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
          })
      : Promise.resolve([] as VocabCard[]),
    daily.craft_id
      ? client
          .from("zg_craft_cards")
          .select("id, name, one_liner, purpose")
          .eq("id", daily.craft_id)
          .maybeSingle()
          .then((r) => {
            if (r.error) throw r.error;
            return r.data as CraftCard | null;
          })
      : Promise.resolve(null),
    daily.writing_prompt_id
      ? client
          .from("zg_writing_prompts")
          .select("id, title, body, suggested_words, suggested_minutes")
          .eq("id", daily.writing_prompt_id)
          .maybeSingle()
          .then((r) => {
            if (r.error) throw r.error;
            return r.data as WritingPrompt | null;
          })
      : Promise.resolve(null),
    daily.novel_task_template_id
      ? client
          .from("zg_novel_task_templates")
          .select("id, title, body, minutes_min, minutes_max")
          .eq("id", daily.novel_task_template_id)
          .maybeSingle()
          .then((r) => {
            if (r.error) throw r.error;
            return r.data as NovelTask | null;
          })
      : Promise.resolve(null),
  ]);

  return { plan: daily, quote, vocabulary, craft, prompt, novelTask };
}

export function createMockDailyPlanBundle(): DailyPlanBundle {
  return {
    plan: {
      id: "mock-plan",
      user_id: "mock-user",
      local_date: new Date().toISOString().slice(0, 10),
      timezone: "Asia/Taipei",
      quote_id: "mock-quote",
      vocabulary_ids: ["mock-v1"],
      craft_id: "mock-craft",
      writing_prompt_id: "mock-prompt",
      novel_task_template_id: "mock-novel",
      japanese_payload: {},
      completion: {},
      replacements: {},
    },
    quote: {
      id: "mock-quote",
      display_quote: "【開發測試】把句子寫短，把意思寫深。",
      author_name: "開發測試內容",
      work_title: "字耕 Mock",
      short_analysis: "Mock 模式：未連線真實資料庫。",
      verification_status: "verified_secondary",
    },
    vocabulary: [
      {
        id: "mock-v1",
        term: "澄澈",
        zhuyin: "ㄔㄥˊ ㄔㄜˋ",
        short_def: "清澈透明；心境清明。",
        difficulty: 3,
        category: "文學詞彙",
      },
    ],
    craft: {
      id: "mock-craft",
      name: "以動作寫情緒",
      one_liner: "少寫「很傷心」，多寫身體與行為。",
      purpose: "讓情緒可被看見。",
    },
    prompt: {
      id: "mock-prompt",
      title: "無人的教室",
      body: "描寫放學後的教室，不要直接寫「安靜」。",
      suggested_words: 150,
      suggested_minutes: 15,
    },
    novelTask: {
      id: "mock-novel",
      title: "區分「想要」與「需要」",
      body: "為主角各寫一句想要與需要，兩者必須不同。",
      minutes_min: 5,
      minutes_max: 15,
    },
  };
}
