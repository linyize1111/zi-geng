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
          .select(
            "id, term, zhuyin, short_def, long_def, usage_context, part_of_speech, difficulty, category, tags, daily_example, literary_example",
          )
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
          .select(
            "id, name, one_liner, purpose, bad_example, good_example, breakdown, exercise, tags",
          )
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
          .select("id, title, body, category, suggested_words, suggested_minutes, tags")
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
          .select("id, title, body, minutes_min, minutes_max, tags, difficulty")
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

function shufflePick<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = a;
  }
  return copy.slice(0, n);
}

/**
 * Client-side unlimited replace (updates own zg_daily_plans).
 * Does not depend on zg_replace_daily_slot daily caps — those stay broken until SQL is applied.
 */
async function replaceDailySlotClient(slot: DailySlot, timezone: string): Promise<DailyPlanBundle> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const bundle = await fetchOrCreateDailyPlan(timezone);
  const plan = bundle.plan;
  const used = replacementUsed(plan, slot);
  const nextReps = { ...plan.replacements, [slot]: used + 1 };

  const { data: settings } = await client
    .from("zg_user_settings")
    .select("daily_mode, daily_vocab_count")
    .eq("user_id", plan.user_id)
    .maybeSingle();

  let vocabN = settings?.daily_vocab_count ?? 7;
  const mode = settings?.daily_mode ?? "standard";
  if (mode === "light") vocabN = Math.min(vocabN, 3);
  if (mode === "deep") vocabN = Math.max(vocabN, 10);

  const patch: Record<string, unknown> = {
    replacements: nextReps,
    updated_at: new Date().toISOString(),
  };

  if (slot === "vocabulary") {
    const { data, error } = await client
      .from("zg_vocabulary_cards")
      .select("id, category, tags")
      .eq("status", "active");
    if (error) throw error;
    const rows = data ?? [];
    if (!rows.length) throw new Error("詞庫是空的，請先匯入詞彙");
    const avoid = new Set(plan.vocabulary_ids ?? []);
    type Row = { id: string; category?: string | null; tags?: string[] | null };
    const isIdiom = (r: Row) => {
      const tags = r.tags ?? [];
      return r.category === "成語" || tags.includes("成語") || tags.includes("教育部成語典");
    };
    const isThemed = (r: Row) => {
      const tags = r.tags ?? [];
      return (
        tags.includes("主題詞庫") ||
        tags.includes("寫作者詞庫") ||
        String(r.category ?? "").includes("情緒") ||
        String(r.category ?? "").includes("動詞") ||
        String(r.category ?? "").includes("感官")
      );
    };
    const themed = rows.filter((r) => isThemed(r as Row) && !isIdiom(r as Row));
    const literary = rows.filter((r) => !isIdiom(r as Row) && !isThemed(r as Row));
    const idioms = rows.filter((r) => isIdiom(r as Row));

    const pickFrom = (pool: typeof rows, n: number, used: Set<string>) => {
      const free = pool.map((r) => r.id as string).filter((id) => !used.has(id) && !avoid.has(id));
      const base =
        free.length >= n ? free : pool.map((r) => r.id as string).filter((id) => !used.has(id));
      return shufflePick(base, Math.min(n, base.length));
    };

    // Mix: ~45% themed writer banks, ~40% other literary, ~15% idioms; diversify categories
    const nTheme = Math.min(themed.length, Math.max(1, Math.round(vocabN * 0.45)));
    const nIdiom = Math.min(idioms.length, Math.max(0, Math.round(vocabN * 0.15)));
    const nLit = Math.max(0, vocabN - nTheme - nIdiom);

    const used = new Set<string>();
    const pickedTheme = pickFrom(themed, nTheme, used);
    pickedTheme.forEach((id) => used.add(id));
    const pickedLit = pickFrom(literary.length ? literary : rows, nLit, used);
    pickedLit.forEach((id) => used.add(id));
    const pickedIdi = pickFrom(idioms, nIdiom, used);
    pickedIdi.forEach((id) => used.add(id));

    let picked = [...pickedTheme, ...pickedLit, ...pickedIdi];

    // Category diversity: if too many share same category prefix, reshuffle extras from unused
    const catKey = (id: string) => {
      const row = rows.find((r) => r.id === id);
      return String(row?.category ?? "其他").split("・")[0] ?? "其他";
    };
    const counts = new Map<string, number>();
    for (const id of picked) counts.set(catKey(id), (counts.get(catKey(id)) ?? 0) + 1);
    const overloaded = [...counts.entries()].filter(([, n]) => n >= 3).map(([k]) => k);
    if (overloaded.length && picked.length >= 3) {
      const rest = rows
        .map((r) => r.id as string)
        .filter((id) => !used.has(id) && !overloaded.includes(catKey(id)));
      if (rest.length) {
        const swapOut = picked.filter((id) => overloaded.includes(catKey(id))).slice(1);
        const swapIn = shufflePick(rest, Math.min(swapOut.length, rest.length));
        picked = picked.filter((id) => !swapOut.slice(0, swapIn.length).includes(id));
        picked = [...picked, ...swapIn];
      }
    }

    if (picked.length < vocabN) {
      const more = rows.map((r) => r.id as string).filter((id) => !picked.includes(id));
      picked = [...picked, ...shufflePick(more, vocabN - picked.length)];
    }
    patch.vocabulary_ids = shufflePick(picked, Math.min(vocabN, picked.length));
  } else if (slot === "quote") {
    const { data, error } = await client
      .from("zg_quotes")
      .select("id, author_name, display_quote, copyright_status, verification_status")
      .eq("status", "active")
      .in("verification_status", ["verified_primary", "verified_secondary"]);
    if (error) throw error;
    const usable = (data ?? []).filter(
      (q) =>
        q.copyright_status !== "internal_test" &&
        q.author_name !== "開發測試內容" &&
        q.author_name !== "字耕" &&
        !String(q.display_quote).includes("開發測試"),
    );
    const ids = usable.filter((q) => q.id !== plan.quote_id).map((q) => q.id as string);
    const fallback = usable.map((q) => q.id as string);
    const pick = shufflePick(ids.length ? ids : fallback, 1)[0];
    if (!pick) throw new Error("尚無名言可換，請先匯入多主題名言");
    patch.quote_id = pick;
  } else if (slot === "craft") {
    const { data, error } = await client.from("zg_craft_cards").select("id").eq("status", "active");
    if (error) throw error;
    const ids = (data ?? []).map((r) => r.id as string).filter((id) => id !== plan.craft_id);
    const pool = ids.length ? ids : (data ?? []).map((r) => r.id as string);
    const pick = shufflePick(pool, 1)[0];
    if (!pick) throw new Error("尚無寫作技巧可換");
    patch.craft_id = pick;
  } else if (slot === "prompt") {
    const { data, error } = await client
      .from("zg_writing_prompts")
      .select("id")
      .eq("status", "active");
    if (error) throw error;
    const ids = (data ?? [])
      .map((r) => r.id as string)
      .filter((id) => id !== plan.writing_prompt_id);
    const pool = ids.length ? ids : (data ?? []).map((r) => r.id as string);
    const pick = shufflePick(pool, 1)[0];
    if (!pick) throw new Error("尚無寫作題目可換");
    patch.writing_prompt_id = pick;
  } else {
    const { data, error } = await client
      .from("zg_novel_task_templates")
      .select("id")
      .eq("status", "active");
    if (error) throw error;
    const ids = (data ?? [])
      .map((r) => r.id as string)
      .filter((id) => id !== plan.novel_task_template_id);
    const pool = ids.length ? ids : (data ?? []).map((r) => r.id as string);
    const pick = shufflePick(pool, 1)[0];
    if (!pick) throw new Error("尚無小說任務可換");
    patch.novel_task_template_id = pick;
  }

  const { data: updated, error: upErr } = await client
    .from("zg_daily_plans")
    .update(patch)
    .eq("id", plan.id)
    .select("*")
    .single();
  if (upErr) throw upErr;
  return hydratePlan(updated as DailyPlan);
}

export async function replaceDailySlot(
  slot: DailySlot,
  timezone = "Asia/Taipei",
): Promise<DailyPlanBundle> {
  // Prefer client-side replace so refresh works even if DB RPC still has daily caps
  // (Pages deploy / SQL apply may lag). Fall back to RPC only if client path fails hard.
  try {
    return await replaceDailySlotClient(slot, timezone);
  } catch (clientErr) {
    const client = getSupabaseClient();
    if (!client) throw clientErr;
    const { data: plan, error } = await client
      .rpc("zg_replace_daily_slot", { p_slot: slot, p_timezone: timezone })
      .single();
    if (error) throw clientErr;
    return hydratePlan(plan as DailyPlan);
  }
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
        category: "場景描寫",
        suggested_words: 150,
        suggested_minutes: 15,
      },
      novelTask: {
        id: "mock-novel",
        title: "區分「想要」與「需要」",
        body: "為主角各寫一句想要與需要，兩者必須不同。",
        minutes_min: 5,
        minutes_max: 15,
        tags: ["階段:角色", "角色", "動機"],
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
        category: "動作描寫",
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
