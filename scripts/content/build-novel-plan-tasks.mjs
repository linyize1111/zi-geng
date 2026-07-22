/**
 * Novel creative-plan task bank (system curriculum).
 * Phases: concept → world → characters → plot → scenes → draft → revise
 * Outline slot is reserved in the app until the user pastes their outline.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));

/** @type {Array<{title:string, body:string, phase:string, min:number, max:number, difficulty:number, tags?:string[]}>} */
const RAW = [
  // —— 0 構思／前提（等大綱前也能做） ——
  {
    title: "一句話故事（logline）",
    body: "用一句話寫：誰、想要什麼、遇到什麼障礙、若不成功會失去什麼。先用你目前的構思，大綱細節之後再補。",
    phase: "concept",
    min: 5,
    max: 12,
    difficulty: 2,
    tags: ["構思", "logline", "計畫系統"],
  },
  {
    title: "主題句（可改版）",
    body: "寫一句你這本小說想追問的主題（不是標語）。例如「當忠誠與真相衝突時，人如何自處」。允許之後大綱進來再改。",
    phase: "concept",
    min: 5,
    max: 10,
    difficulty: 2,
    tags: ["構思", "主題", "計畫系統"],
  },
  {
    title: "類型與讀者約定",
    body: "寫下：類型（或混搭）、你承諾給讀者的閱讀體驗、你拒絕提供的東西（例如不賣萌、不開金手指）。",
    phase: "concept",
    min: 8,
    max: 15,
    difficulty: 2,
    tags: ["構思", "類型", "計畫系統"],
  },
  {
    title: "核心衝突一頁紙",
    body: "半頁內寫清：外在衝突、內在衝突、兩者如何互相加劇。大綱未定也可先寫「目前想像版」。",
    phase: "concept",
    min: 10,
    max: 20,
    difficulty: 3,
    tags: ["構思", "衝突", "計畫系統"],
  },
  {
    title: "不可妥協的設定",
    body: "列出 3–5 條你寫這本時「絕對不改」的底線（世界規則、角色底線、主題底線）。其餘標成可調。",
    phase: "concept",
    min: 8,
    max: 15,
    difficulty: 3,
    tags: ["構思", "約束", "計畫系統"],
  },

  // —— 1 世界 ——
  {
    title: "世界的壓力來源",
    body: "寫這個世界／社會如何對主角施壓：制度、氣候、資訊、階級、禁忌……選兩項寫具體機制。",
    phase: "world",
    min: 10,
    max: 18,
    difficulty: 3,
    tags: ["世界", "壓力", "計畫系統"],
  },
  {
    title: "日常與例外",
    body: "各寫一段：這個世界「普通的一天」與「規則被打破的一天」。對照要清楚。",
    phase: "world",
    min: 12,
    max: 20,
    difficulty: 3,
    tags: ["世界", "日常", "計畫系統"],
  },
  {
    title: "資訊落差地圖",
    body: "誰知道什麼、誰被蒙在鼓裡？畫三層：主角知道、讀者知道、配角知道。標出你打算何時揭開。",
    phase: "world",
    min: 10,
    max: 18,
    difficulty: 4,
    tags: ["世界", "資訊", "計畫系統"],
  },

  // —— 2 角色 ——
  {
    title: "區分「想要」與「需要」",
    body: "主角：表面想要（want）vs 真正需要（need）。各一句，並寫它們如何互相打架。",
    phase: "characters",
    min: 8,
    max: 15,
    difficulty: 2,
    tags: ["角色", "動機", "計畫系統"],
  },
  {
    title: "對手的合理理由",
    body: "寫對手／阻礙者為什麼「以自己的道德」是對的。禁止卡通邪惡。",
    phase: "characters",
    min: 10,
    max: 18,
    difficulty: 3,
    tags: ["角色", "衝突", "計畫系統"],
  },
  {
    title: "秘密的保管者",
    body: "誰知道主角的秘密、誰不該知道、洩漏會失去什麼。三句即可。",
    phase: "characters",
    min: 5,
    max: 12,
    difficulty: 2,
    tags: ["角色", "秘密", "計畫系統"],
  },
  {
    title: "配角的獨立欲望",
    body: "選一個重要配角：寫出與主角無關時他仍會追求的事。避免工具人。",
    phase: "characters",
    min: 8,
    max: 15,
    difficulty: 3,
    tags: ["角色", "配角", "計畫系統"],
  },
  {
    title: "關係的權力斜率",
    body: "選一對關係。寫開場誰較有權力、中段如何翻轉、結尾權力落在哪。各用一個行為證明。",
    phase: "characters",
    min: 10,
    max: 18,
    difficulty: 4,
    tags: ["角色", "關係", "計畫系統"],
  },
  {
    title: "角色聲音樣本",
    body: "同一句訊息（例如「我們需要談談」），用主角與對手各說一次，語氣必須可辨識。",
    phase: "characters",
    min: 8,
    max: 14,
    difficulty: 3,
    tags: ["角色", "對話", "計畫系統"],
  },

  // —— 3 情節 ——
  {
    title: "不可逆的小事件",
    body: "設計一個看起來很小、卻讓故事無法回到原點的事件。寫清「不可逆」在哪。",
    phase: "plot",
    min: 8,
    max: 15,
    difficulty: 3,
    tags: ["情節", "轉折", "計畫系統"],
  },
  {
    title: "三幕骨架（暫定）",
    body: "用條列：第一幕結束點、中點逆轉、低谷、結局承諾。大綱未到可標「待你的大綱覆寫」。",
    phase: "plot",
    min: 12,
    max: 20,
    difficulty: 3,
    tags: ["情節", "結構", "計畫系統", "待大綱"],
  },
  {
    title: "結局的代價",
    body: "假設收在「成功」。寫角色付出且無法挽回的代價。若你的結局不是成功，改寫「得到的代價」。",
    phase: "plot",
    min: 8,
    max: 18,
    difficulty: 3,
    tags: ["情節", "結局", "計畫系統"],
  },
  {
    title: "假結局與真結局",
    body: "寫一個讀者可能以為結束的「假結局」，再寫真正的收束如何更深一層。",
    phase: "plot",
    min: 10,
    max: 18,
    difficulty: 4,
    tags: ["情節", "結局", "計畫系統"],
  },
  {
    title: "因果鏈檢查",
    body: "列出五個關鍵事件，用箭頭寫「因為 A 所以 B」。斷掉的地方就是大綱要補的洞。",
    phase: "plot",
    min: 12,
    max: 22,
    difficulty: 4,
    tags: ["情節", "因果", "計畫系統", "待大綱"],
  },

  // —— 4 場景 ——
  {
    title: "場景的利害",
    body: "為下一個場景寫：角色想得到什麼、最怕失去什麼、現場障礙是什麼。",
    phase: "scenes",
    min: 8,
    max: 15,
    difficulty: 3,
    tags: ["場景", "衝突", "計畫系統"],
  },
  {
    title: "入場與出場",
    body: "選一場戲：第一句如何抓住利害，最後一句如何改變關係狀態（比開場更糟或更好）。",
    phase: "scenes",
    min: 10,
    max: 18,
    difficulty: 3,
    tags: ["場景", "節奏", "計畫系統"],
  },
  {
    title: "場景功能標籤",
    body: "為三個預定場景各貼標籤：推進情節／揭示角色／世界展示／主題回聲。每場最多兩個主功能。",
    phase: "scenes",
    min: 8,
    max: 15,
    difficulty: 3,
    tags: ["場景", "結構", "計畫系統"],
  },
  {
    title: "感官錨點清單",
    body: "為下一個重要場景選一個主導感官（視／聽／觸／嗅／味），寫三個具體錨點。",
    phase: "scenes",
    min: 5,
    max: 12,
    difficulty: 2,
    tags: ["場景", "感官", "計畫系統"],
  },

  // —— 5 草稿節奏 ——
  {
    title: "今日只寫一場",
    body: "選定一場（可暫定名稱）。只完成該場草稿，不修前文。寫完標註字數與未解問題。",
    phase: "draft",
    min: 15,
    max: 40,
    difficulty: 2,
    tags: ["草稿", "聚焦", "計畫系統"],
  },
  {
    title: "對話場：潛台詞優先",
    body: "寫一場以對話為主的戲。每句對白至少服務：權力／隱瞞／試探之一。",
    phase: "draft",
    min: 15,
    max: 30,
    difficulty: 3,
    tags: ["草稿", "對話", "計畫系統"],
  },
  {
    title: "過渡章壓縮",
    body: "把原本想寫成一章的過渡，壓成 300 字以內，只保留因果與情緒位移。",
    phase: "draft",
    min: 10,
    max: 20,
    difficulty: 3,
    tags: ["草稿", "節奏", "計畫系統"],
  },
  {
    title: "開場鉤子三稿",
    body: "同一開場寫三個不同第一段（各 ≤120 字）。選一個最能建立利害的，其餘存檔。",
    phase: "draft",
    min: 15,
    max: 25,
    difficulty: 3,
    tags: ["草稿", "開場", "計畫系統"],
  },

  // —— 6 修訂 ——
  {
    title: "主題回聲檢查",
    body: "重讀最近寫的一場：標出與主題相關的物件／對白／行為。沒有則補一處「輕回聲」，勿說教。",
    phase: "revise",
    min: 12,
    max: 22,
    difficulty: 3,
    tags: ["修訂", "主題", "計畫系統"],
  },
  {
    title: "刪除最愛的一段",
    body: "找出你最喜歡但故事不需要的一段。剪下到廢稿區，並寫一句：為什麼刪了更好。",
    phase: "revise",
    min: 10,
    max: 18,
    difficulty: 4,
    tags: ["修訂", "刪減", "計畫系統"],
  },
  {
    title: "動機一致性掃描",
    body: "列主角三次關鍵選擇。檢查是否符合理動機（want/need）。不符則改選擇或改動機。",
    phase: "revise",
    min: 12,
    max: 20,
    difficulty: 4,
    tags: ["修訂", "動機", "計畫系統"],
  },
  {
    title: "讀者問題清單",
    body: "假設敏銳讀者會問的五個問題。標哪些你打算揭、哪些永遠不揭、哪些其實你自己也不知道（待大綱）。",
    phase: "revise",
    min: 10,
    max: 18,
    difficulty: 3,
    tags: ["修訂", "讀者", "計畫系統", "待大綱"],
  },

  // —— 保留區提示任務 ——
  {
    title: "【保留】貼上你的大綱後再做",
    body: "此任務等你把完整／分段大綱貼進小說專案的「大綱（保留區）」後再執行：用大綱覆寫三幕骨架，並標出與現有構思衝突的三點。",
    phase: "concept",
    min: 15,
    max: 30,
    difficulty: 3,
    tags: ["構思", "待大綱", "保留", "計畫系統"],
  },
];

const PHASE_LABEL = {
  concept: "構思",
  world: "世界",
  characters: "角色",
  plot: "情節",
  scenes: "場景",
  draft: "草稿",
  revise: "修訂",
};

const cards = RAW.map((r) => ({
  status: "active",
  title: r.title,
  body: r.body,
  minutes_min: r.min,
  minutes_max: r.max,
  difficulty: r.difficulty,
  tags: Array.from(new Set([...(r.tags ?? []), `階段:${PHASE_LABEL[r.phase] ?? r.phase}`, `phase:${r.phase}`])),
  source: {
    kind: "zi-geng-novel-plan",
    version: 1,
    phase: r.phase,
    phase_label: PHASE_LABEL[r.phase] ?? r.phase,
  },
}));

const payload = {
  version: 1,
  count: cards.length,
  phases: Object.entries(PHASE_LABEL).map(([id, label]) => ({ id, label })),
  note: "大綱正文由使用者稍後提供；任務庫先建立系統節奏，專案內保留 outlineDraft。",
  cards,
};

writeFileSync(join(__dir, "seed-novel-plan-tasks.json"), JSON.stringify(payload, null, 2), "utf8");
const pub = join(__dir, "../../public/content");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "seed-novel-plan-tasks.json"), JSON.stringify(payload), "utf8");
console.log("novel plan tasks", cards.length);
