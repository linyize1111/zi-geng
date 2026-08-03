/**
 * Template + curated snippets → knowledge candidate cards (no AI).
 * node scripts/content/build-knowledge-candidates.mjs
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreKnowledgeCard, shouldAutoActivate, shouldQuarantine } from "./quality-score.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const topicsPath = join(__dir, "generated/knowledge-topic-candidates.json");
if (!existsSync(topicsPath)) {
  console.error("Run discover-knowledge-topics.mjs first");
  process.exit(1);
}
const { topics } = JSON.parse(readFileSync(topicsPath, "utf8"));

/** @type {Record<string, { hook: string; story: string; facts: {label:string;value:string}[]; writing: string; why: string }>} */
const SNIPPETS = {
  紗: {
    hook: "紗不是只是『薄布』，它常暗示視線可以被穿過。",
    story:
      "寫衣裝時，紗多半帶來透、輕、曖昧。窗紗、紗帷、夏夜的衣料，重點常是「看得見又看不全」。若你要華麗壓場，紗通常不是首選；若要若隱若現、簾後對話、熱氣中的輕，紗比錦準。和羅相比，紗更口語、更日常；羅更文言、更古典。",
    facts: [
      { label: "質地", value: "輕薄、可透光" },
      { label: "語氣", value: "曖昧、夏夜、簾後" },
      { label: "對照", value: "紗透／錦密" },
    ],
    writing: "不要只寫『漂亮衣服』，用紗決定讀者能看見多少。",
    why: "衣料詞能同時寫階級、季節與視線。",
  },
  羅: {
    hook: "羅跟紗都薄，但羅更像把時間往文言推半寸。",
    story:
      "羅袖、羅帷常見於古典敘事。它同樣疏薄，語感卻比紗更文、更舊。寫現代對白時硬塞『羅』會突兀；寫懷古、夢境、戲曲感場面，羅比紗更對味。重點不是考證織法，而是你要的距離：要近用紗，要遠用羅。",
    facts: [
      { label: "語域", value: "偏文言" },
      { label: "常見", value: "羅袖、羅帷" },
      { label: "對照", value: "羅古／紗常" },
    ],
    writing: "選羅＝選一種略遠的語感，不只是選布。",
    why: "同義近義的衣料詞，差在語氣距離。",
  },
  錦: {
    hook: "錦是被看見的義務：密、重、亮。",
    story:
      "錦衣、錦緞常帶儀式與排場。它和紗對讀時最清楚：一個要透，一個要壓場。寫宴會、官場、對比『舊麻／錦衣』，錦很有用。小心別堆成廣告詞；讓錦出現在需要『不得不華麗』的壓力裡。",
    facts: [
      { label: "質地", value: "密、有紋、偏重" },
      { label: "場合", value: "儀式、排場" },
      { label: "對照", value: "錦密／紗透" },
    ],
    writing: "用錦寫壓力，不只寫美。",
    why: "華麗也可以是一種社會義務。",
  },
  弱冠: {
    hook: "弱冠不是『很弱』，而是約二十歲加冠。",
    story:
      "古代男子二十歲行冠禮，稱弱冠。它常出現在傳記開頭，標記『進入成人世界』。寫作時可用它暗示年齡而不直寫數字；也可用來對照『未冠』的少年氣。別把它當貶義詞。",
    facts: [
      { label: "約略年齡", value: "二十歲上下" },
      { label: "對象", value: "男子加冠" },
      { label: "用法", value: "傳記、文言敘事" },
    ],
    writing: "用弱冠標人生門檻，比寫『二十歲那年』更有層次。",
    why: "年齡稱謂是壓縮時間的古典工具。",
  },
  而立: {
    hook: "而立＝三十，重點是『該站住了』的社會期待。",
    story:
      "語出《論語》『三十而立』。它不只報年齡，也常帶『該有所成立』的壓力。寫角色焦慮、家族催促、自我期許，而立比『三十歲』多一層文化重量。也可反用：而立之年卻立不住。",
    facts: [
      { label: "年齡", value: "約三十" },
      { label: "出處", value: "《論語》" },
      { label: "語氣", value: "期待／壓力" },
    ],
    writing: "而立適合寫『社會時鐘』，不只寫歲數。",
    why: "古典年齡詞常常同時是價值判斷。",
  },
  唐宋八大家: {
    hook: "唐宋八大家比較像古文運動的名片，不是人氣排行榜。",
    story:
      "韓愈、柳宗元推古文，反對過度華麗的駢儷風；宋代歐陽脩與三蘇、王安石、曾鞏延續這條路，後來被合稱唐宋八大家。你不必一次背完生平。先記：這名單談的是『文章要不要只追求漂亮形式』。寫評論或小說裡的讀書人，提到它，常常是在站隊『內容與氣骨』。",
    facts: [
      { label: "唐代", value: "韓愈、柳宗元" },
      { label: "宋代", value: "歐陽脩、三蘇、王安石、曾鞏" },
      { label: "核心", value: "古文運動／反空華麗" },
    ],
    writing: "用它當文化座標，不要當百科條目背完。",
    why: "文學史名詞要服務理解與寫作，不是炫耀。",
  },
  折柳: {
    hook: "折柳＝送別，柳與『留』諧音。",
    story:
      "古典詩裡折柳送行極常見。重點不是植物學，而是離別儀式：折一枝，等於把『留』說不出口的話交給物象。現代寫作可化用：車站的一截綠枝、窗台上被掰斷的葉，讓送別不必直說『我會想你』。",
    facts: [
      { label: "主題", value: "送別" },
      { label: "關鍵", value: "柳／留諧音" },
      { label: "用法", value: "意象寄情" },
    ],
    writing: "讓物件完成告別，少寫口號式不捨。",
    why: "古典意象是現成的情感壓縮檔。",
  },
  賦比興: {
    hook: "賦比興是三種靠近世界的方式：直說、比喻、起興。",
    story:
      "賦是直接鋪陳；比是明喻／對應；興是先言他物再引出正題。寫作時你不必考試默寫定義，但可以自問：這段是在『講清楚』、在『拿另一物來照』，還是在『先晃一下旁邊的風景再拐回心事』？三種節奏不同，混用時最怕三種同時喊最大聲。",
    facts: [
      { label: "賦", value: "直陳" },
      { label: "比", value: "比喻對應" },
      { label: "興", value: "他物起情" },
    ],
    writing: "修辭選擇＝讀者進入情緒的路徑選擇。",
    why: "文體修辭詞能幫你設計段落節奏。",
  },
  白描: {
    hook: "白描：少形容詞，讓動作與物件自己說話。",
    story:
      "白描不是沒有感情，而是不急著命名感情。『他很悲傷』是解釋；『他把杯子放回原位，又拿起來』是白描。它跟工筆／渲染不同：一個減，一個加。適合對話、緊張場面、不想煽情卻想讓人難受的時刻。",
    facts: [
      { label: "做法", value: "動作／物件先行" },
      { label: "避免", value: "情緒標籤堆疊" },
      { label: "對照", value: "白描減／渲染加" },
    ],
    writing: "先刪解釋句，看畫面還在不在。",
    why: "文筆課的核心往往是『少說一點』。",
  },
  進士: {
    hook: "進士是科舉終點之一，不是現代『研究生』的翻譯。",
    story:
      "通過殿試者稱進士，社會地位與仕途想像與此緊扣。寫歷史或戲說古代，進士常代表家族翻身、壓力來源、婚姻籌碼。別把它和秀才、舉人混成同一級；層級差，劇烈衝突才站得住。",
    facts: [
      { label: "大致層級", value: "科舉較高階功名" },
      { label: "常見戲碼", value: "翻身／聯姻／黨爭" },
      { label: "對照", value: "秀才＜舉人＜進士（簡化）" },
    ],
    writing: "功名詞要寫出結構壓力，不要只當頭銜貼紙。",
    why: "制度詞能驅動情節。",
  },
  足下: {
    hook: "足下是敬稱對方，不是『腳底下』的字面。",
    story:
      "書信與對話裡，足下用來尊稱對方。它帶距離與禮。現代小說若人物滿口足下，要嘛在仿古，要嘛在諷刺。可與『閣下』對讀：場合與時代感略有不同，但都在標『我抬高你』。",
    facts: [
      { label: "功能", value: "敬稱對方" },
      { label: "語域", value: "書信／文言對話" },
      { label: "風險", value: "現代口語會出戲" },
    ],
    writing: "稱謂決定權力距離，選錯會整段垮掉。",
    why: "稱謂是人際關係的速記。",
  },
  子時: {
    hook: "子時約夜半，是一天重新起算的縫。",
    story:
      "十二時辰裡，子時大約 23–1 點。古典敘事用子時，常不是精準鐘點，而是『最深的夜』。寫密謀、失眠、守歲、變盤，子時比『半夜』多一點曆法氣味。也不必每次都註解換算，語境夠就不說破。",
    facts: [
      { label: "約略", value: "23 時至 1 時" },
      { label: "語氣", value: "深夜、轉換" },
      { label: "用法", value: "氣氛錨點" },
    ],
    writing: "時辰詞用來定『夜的深度』，不必當鐘錶。",
    why: "時間詞也能寫氣氛。",
  },
};

function buildCard(t) {
  const sn = SNIPPETS[t.topic_key];
  if (!sn) {
    // generic fallback — lower score, likely quarantine/candidate
    const hook = `${t.topic_key} 值得寫作者放進工具列，而不是只放進考古題。`;
    const story = `${t.topic_key} 出現在${t.seriesTitle ?? t.series}脈絡裡時，重點通常不是背定義，而是它能幫你完成什麼表達任務：定年紀、定質地、定儀式，或定文化站隊。先問「我若不用這個詞，會少掉哪一層意思？」再決定要不要用。本卡為模板草稿，建議對照辭典後再升 active。`;
    const card = {
      status: "candidate",
      series: t.series,
      topic_key: t.topic_key,
      title: String(t.title_hint ?? t.topic_key).slice(0, 15),
      hook: hook.slice(0, 40),
      story_md: story,
      facts: [
        { label: "系列", value: t.seriesTitle ?? t.series },
        { label: "關鍵", value: t.topic_key },
        { label: "狀態", value: "模板草稿" },
      ],
      glossary: [{ term: t.topic_key, explanation: "見辭典；本卡僅作寫作入口。" }],
      examples: [],
      quiz: [
        {
          question: `使用「${t.topic_key}」時，最該先想什麼？`,
          answer: "它多提供了哪一層意思（語氣／制度／質地）",
          options: ["拼音怎麼念", "它多提供了哪一層意思（語氣／制度／質地）", "要不要加粗體"],
        },
      ],
      why_it_matters: "工具詞要服務場面，不要服務炫耀。",
      writing_use: `寫作時把「${t.topic_key}」當選擇，不當裝飾。`,
      reading_time_sec: 75,
      difficulty: 3,
      source_refs: [
        { source_key: "manual_curated", note: "template draft" },
        { source_key: "moe_revised_dict", note: "請核對釋義" },
      ],
      tags: [t.seriesTitle ?? t.series, "國學小專欄", "candidate"],
      source: { kind: "knowledge-template", topic: t.topic_key },
    };
    const scored = scoreKnowledgeCard(card);
    card.quality_score = scored.quality_score;
    card.quality_flags = scored.quality_flags;
    if (shouldQuarantine(card.quality_score, card.quality_flags)) card.status = "quarantine";
    else if (shouldAutoActivate(card.quality_score, card.quality_flags)) card.status = "active";
    return card;
  }

  const card = {
    status: "candidate",
    series: t.series,
    topic_key: t.topic_key,
    title: `${t.topic_key}`.slice(0, 15),
    hook: sn.hook.slice(0, 40),
    story_md: sn.story,
    facts: sn.facts,
    glossary: [{ term: t.topic_key, explanation: sn.facts[0]?.value ?? "" }],
    examples: [],
    quiz: [
      {
        question: `「${t.topic_key}」對寫作最有用的是？`,
        answer: sn.why,
        options: [sn.why, "用來填字數", "一定要出現在開頭"],
      },
    ],
    why_it_matters: sn.why,
    writing_use: sn.writing,
    reading_time_sec: 90,
    difficulty: 3,
    source_refs: (t.source_keys ?? ["manual_curated"]).map((source_key) => ({
      source_key,
      note: "curated snippet",
    })),
    tags: [t.seriesTitle ?? t.series, "國學小專欄"],
    source: { kind: "knowledge-curated", topic: t.topic_key },
  };
  const scored = scoreKnowledgeCard(card);
  card.quality_score = scored.quality_score;
  card.quality_flags = scored.quality_flags;
  if (shouldQuarantine(card.quality_score, card.quality_flags)) card.status = "quarantine";
  else if (shouldAutoActivate(card.quality_score, card.quality_flags)) card.status = "active";
  else card.status = "candidate";
  return card;
}

const WEEKLY_CAP = 20;
const cards = topics.slice(0, WEEKLY_CAP).map(buildCard);
const autoActive = cards.filter((c) => c.status === "active").slice(0, 8);
for (const c of cards) {
  if (c.status === "active" && !autoActive.includes(c)) c.status = "candidate";
}

const payload = {
  version: 1,
  generated_at: new Date().toISOString(),
  count: cards.length,
  mix: {
    active: cards.filter((c) => c.status === "active").length,
    candidate: cards.filter((c) => c.status === "candidate").length,
    quarantine: cards.filter((c) => c.status === "quarantine").length,
  },
  cards,
};

const genDir = join(__dir, "generated");
mkdirSync(genDir, { recursive: true });
writeFileSync(
  join(genDir, "seed-knowledge-candidates.json"),
  JSON.stringify(payload, null, 2),
  "utf8",
);
const pub = join(__dir, "../../public/content");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "seed-knowledge-candidates.json"), JSON.stringify(payload), "utf8");
console.log("knowledge candidates", payload.mix, "total", cards.length);
