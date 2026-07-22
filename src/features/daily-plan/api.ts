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

export type DailySlot = "vocabulary" | "quote" | "craft" | "prompt" | "novel";

export function replacementUsed(plan: DailyPlan, slot: DailySlot): number {
  const raw = plan.replacements?.[slot];
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function isUsableQuote(quote: QuoteCard | null): quote is QuoteCard {
  if (!quote) return false;
  if (quote.author_name === "開發測試內容") return false;
  if (quote.display_quote.includes("開發測試")) return false;
  return true;
}

async function hydratePlan(daily: DailyPlan): Promise<DailyPlanBundle> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const [quote, vocabulary, craft, prompt, novelTask] = await Promise.all([
    daily.quote_id
      ? client
          .from("zg_quotes")
          .select(
            "id, display_quote, author_name, work_title, section_title, original_quote, author_bio, publication_year, translator_name, bibliography_url, short_analysis, deep_analysis, context, writing_insight, counterpoint, themes, verification_status, copyright_status",
          )
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

  return {
    plan: daily,
    quote: isUsableQuote(quote) ? quote : null,
    vocabulary,
    craft,
    prompt,
    novelTask,
  };
}

export async function fetchOrCreateDailyPlan(timezone = "Asia/Taipei"): Promise<DailyPlanBundle> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const { data: plan, error } = await client
    .rpc("zg_get_or_create_daily_plan", { p_timezone: timezone })
    .single();

  if (error) throw error;
  return hydratePlan(plan as DailyPlan);
}

export async function replaceDailySlot(
  slot: DailySlot,
  timezone = "Asia/Taipei",
): Promise<DailyPlanBundle> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const { data: plan, error } = await client
    .rpc("zg_replace_daily_slot", { p_slot: slot, p_timezone: timezone })
    .single();

  if (error) throw error;
  return hydratePlan(plan as DailyPlan);
}

const MOCK_VOCAB: VocabCard[] = [
  {
    id: "mock-v1",
    term: "澄澈",
    zhuyin: "ㄔㄥˊ ㄔㄜˋ",
    short_def: "清澈透明；心境清明。",
    difficulty: 3,
    category: "文學詞彙",
  },
  {
    id: "mock-v2",
    term: "氤氳",
    zhuyin: "ㄧㄣ ㄩㄣ",
    short_def: "煙氣或水氣瀰漫的樣子。",
    difficulty: 4,
    category: "文學詞彙",
  },
  {
    id: "mock-v3",
    term: "逡巡",
    zhuyin: "ㄑㄩㄣ ㄒㄩㄣˊ",
    short_def: "有所顧忌而徘徊不前。",
    difficulty: 4,
    category: "動作描寫",
  },
  {
    id: "mock-v4",
    term: "斑駁",
    zhuyin: "ㄅㄢ ㄅㄛˊ",
    short_def: "顏色深淺不一、痕跡錯落。",
    difficulty: 3,
    category: "文學詞彙",
  },
  {
    id: "mock-v5",
    term: "凜冽",
    zhuyin: "ㄌㄧㄣˇ ㄌㄧㄝˋ",
    short_def: "寒冷刺骨；也可形容神色嚴峻。",
    difficulty: 3,
    category: "文學詞彙",
  },
  {
    id: "mock-v6",
    term: "囁嚅",
    zhuyin: "ㄋㄧㄝˋ ㄖㄨˊ",
    short_def: "想說又不敢大聲說。",
    difficulty: 4,
    category: "動作描寫",
  },
  {
    id: "mock-v7",
    term: "疏離",
    zhuyin: "ㄕㄨ ㄌㄧˊ",
    short_def: "有距離、不親密。",
    difficulty: 3,
    category: "文學詞彙",
  },
];

let mockBundle: DailyPlanBundle | null = null;

export function createMockDailyPlanBundle(): DailyPlanBundle {
  if (!mockBundle) {
    mockBundle = {
      plan: {
        id: "mock-plan",
        user_id: "mock-user",
        local_date: new Date().toISOString().slice(0, 10),
        timezone: "Asia/Taipei",
        quote_id: "mock-quote",
        vocabulary_ids: MOCK_VOCAB.map((v) => v.id),
        craft_id: "mock-craft",
        writing_prompt_id: "mock-prompt",
        novel_task_template_id: "mock-novel",
        japanese_payload: {},
        completion: {},
        replacements: {},
      },
      quote: {
        id: "mock-quote",
        display_quote: "把句子寫短，把意思寫深。",
        author_name: "字耕",
        work_title: "寫作箴言",
        short_analysis: "離線示範：長度不是密度。",
        verification_status: "verified_secondary",
      },
      vocabulary: [...MOCK_VOCAB],
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
  return mockBundle;
}

export function replaceMockDailySlot(slot: DailySlot): DailyPlanBundle {
  const current = createMockDailyPlanBundle();
  const used = replacementUsed(current.plan, slot);
  const nextReps = { ...current.plan.replacements, [slot]: used + 1 };
  if (slot === "vocabulary") {
    const rotated = [...MOCK_VOCAB.slice(2), ...MOCK_VOCAB.slice(0, 2)];
    mockBundle = {
      ...current,
      plan: {
        ...current.plan,
        vocabulary_ids: rotated.map((v) => v.id),
        replacements: nextReps,
      },
      vocabulary: rotated,
    };
  } else if (slot === "quote") {
    mockBundle = {
      ...current,
      plan: { ...current.plan, quote_id: "mock-quote-2", replacements: nextReps },
      quote: {
        id: "mock-quote-2",
        display_quote: "細節比形容詞更靠近真實。",
        author_name: "字耕",
        work_title: "寫作箴言",
        short_analysis: "可觀察細節往往比空泛形容更有說服力。",
        verification_status: "verified_secondary",
      },
    };
  } else if (slot === "craft") {
    mockBundle = {
      ...current,
      plan: { ...current.plan, craft_id: "mock-craft-2", replacements: nextReps },
      craft: {
        id: "mock-craft-2",
        name: "刪除解釋句",
        one_liner: "信任讀者，少寫「這表示他……」。",
        purpose: "避免把潛台詞講破。",
      },
    };
  } else if (slot === "prompt") {
    mockBundle = {
      ...current,
      plan: { ...current.plan, writing_prompt_id: "mock-prompt-2", replacements: nextReps },
      prompt: {
        id: "mock-prompt-2",
        title: "晚歸的鑰匙",
        body: "寫一個人回家開門的三十秒。",
        suggested_words: 120,
        suggested_minutes: 12,
      },
    };
  } else {
    mockBundle = {
      ...current,
      plan: {
        ...current.plan,
        novel_task_template_id: "mock-novel-2",
        replacements: nextReps,
      },
      novelTask: {
        id: "mock-novel-2",
        title: "不可逆的小事件",
        body: "設計一個無法撤回的小事件，並寫出它如何改變關係。",
        minutes_min: 10,
        minutes_max: 20,
      },
    };
  }
  return mockBundle!;
}
