/**
 * Shared vocab quality gate: writing craft + 國學 literacy.
 * Reject school basics, plain fillers, and specialist junk.
 */
export const BASIC_TERMS = new Set(
  `
半日 整日 全日 半載 半世 半途 半天 一日 兩日 三日 五日 十日 一月 一年 一時 一刻
比較 因為 所以 但是 然後 可以 什麼 怎麼 為什麼 已經 還是 或者 如果 雖然 不過
東西 事情 地方 時候 樣子 問題 辦法 意思 感覺 想法 朋友 老師 學生 孩子 大人
漂亮 高興 快樂 傷心 生氣 害怕 喜歡 討厭 好看 好聽 好吃 好美 好慘 好難
上課 下課 上班 下班 吃飯 睡覺 走路 跑步 說話 看書 寫字
肥皂 教授 縣令 大將 官廳 團扇 織女 盯 挪 蹭 幾乎 竟然
空白 堆積 普通 一般 非常 十分 很多 不少 一些 一點 一下 一樣 一直 一定
開始 結束 完成 進行 發生 出現 變成 成為 得到 拿出 起來 下去 過來 回去
開心 難過 舒服 難受 簡單 複雜 容易 困難 重要 主要 基本 特別 其實 當然
今天 明天 昨天 早上 中午 晚上 現在 以前 以後 剛才 後來 最後
這裡 那裡 哪裡 這個 那個 哪個 這些 那些 自己 別人 大家 我們 他們
看見 聽到 知道 覺得 認為 希望 想要 需要 應該 可能 必須 不要 不能
走路 跑路 吃飯 喝水 睡覺 起床 洗手 洗澡 穿衣 脫衣 開門 關門
媽媽 爸爸 哥哥 弟弟 姐姐 妹妹 爺爺 奶奶 叔叔 阿姨
學校 教室 作業 考試 分數 成績 課本 鉛筆 橡皮 書包
電腦 手機 網路 上網 遊戲 電影 電視 音樂 照片
天氣 下雨 下雪 颳風 太陽 月亮 星星 花草 樹木 動物
紅色 黃色 藍色 綠色 白色 黑色 顏色 大小 長短 高矮
很快 很慢 很好 很壞 很大 很小 很多 很少 很高 很低
真的 假的 對的 錯的 新的 舊的 好的 壞的
幫忙 參加 離開 回來 出去 進來 上去 下來
告訴 回答 問話 說話 聊天 打電話 發訊息
買東西 賣東西 付錢 找錢 便宜 貴
開心 快樂 高興 傷感 憂鬱 悲傷 憤怒 害怕 緊張 放鬆
漂亮 美麗 好看 醜陋 可愛 帥氣
乾淨 骯髒 整齊 凌亂 安靜 吵鬧
暖和 寒冷 炎熱 涼爽 潮濕 乾燥
疲倦 睏 餓 渴 飽 痛
工作 休息 玩 學習 讀書 寫作練習
原因 結果 過程 目的 方法 態度 心情 感覺 想法 意見
內容 標題 句子 段落 文章 作文 日記
名詞 動詞 形容詞 副詞 主語 謂語
第一 第二 第三 第四 第五 第六 第七 第八 第九 第十
一次 兩次 三次 一遍 兩遍 三遍
一會兒 一下子 一點點 差不多 大概 或許 也許
總是 常常 經常 有時 偶爾 從不 沒有 不是
而且 並且 另外 此外 於是 因此 從而 以便
雖然 但是 可是 然而 不過 否則 不然
如果 要是 假如 只要 只有 無論 不管
因為 由於 既然 所以 因此
把 被 讓 給 對 從 向 往 在 到 跟 和 與 或
之 乎 者 也 矣 焉 哉
`
    .split(/\s+/)
    .filter(Boolean),
);

/** Alone-too-plain: fine in compounds, weak as standalone craft vocab */
export const PLAIN_ALONE_TERMS = new Set(
  `
空白 堆積 普通 一般 漂亮 美麗 好看 開心 快樂 高興 難過 傷心
簡單 複雜 容易 困難 重要 特別 非常 十分 很多 不少
乾淨 骯髒 安靜 吵鬧 暖和 寒冷 清楚 模糊 正確 錯誤
開始 結束 完成 進行 發生 出現 變成 得到
感覺 想法 意思 問題 辦法 事情 東西 地方 時候 樣子
很好 很美 很慘 很難 很快 很慢 很大 很小
走 跑 看 聽 說 想 吃 喝 睡 坐 站 來 去
`
    .split(/\s+/)
    .filter(Boolean),
);

export const BASIC_TERM_RE =
  /^[一二三四五六七八九十半整全上下前後左右]+[日天年月日歲時分秒]$|^第[一二三四五六七八九十百]+|^很[\u4e00-\u9fff]{1,2}$|^好[\u4e00-\u9fff]{1,2}$|^真[\u4e00-\u9fff]{1,2}$/;

export const JUNK_TERM_RE = /蒙衝|艨艟|斗艦|鬥艦|肥皂|縣令|令正|未入流|方士/;

export const JUNK_DEF_RE =
  /戰船|蒙衝|鬥艦|艨艟|兵器名|武器名|古兵器|鳥名|蟲名|魚名|獸名|草名|藥名|花名|樹名|礦物|化學|元素|化合物|縣名|地名|山名|水名|星名|宿名|卦名|貨幣名|度量衡|單位名|姓。$|二一四部首|阿拉伯數字|清潔用品|洗滌|職官名。?古代|明清稱凡未入|肥皂莢/;

export const LITERARY_HINT_RE =
  /文言|書面|文語|比喻|修辭|文學|典雅|婉辭|敬辭|謙辭|舊時|典故|語本|語出|《詩|《書|《易|《禮|《春|《論|《孟|《莊|《史|《漢|唐．|宋．|元．|明．|清．|心情|神色|態度|猶豫|徘徊|感嘆|意境|氣韻|文采|措辭|筆觸|意象|對仗|擬人|通感|反諷|諷刺|典故/;

/** Everyday school / spoken defs that rarely elevate 文筆 */
export const BASIC_DEF_RE =
  /^[^\u4e00-\u9fff]{0,4}(一種)?(很)?(普通|常見|基本)?(的)?(意思是|指|表示)?[「『]?[\u4e00-\u9fff]{1,6}[」』]?[。．]?$|國小|小學|日常生活中常用|口語中常說|基本詞彙|常用詞/;

/**
 * @param {string} term
 * @param {string} [def]
 * @returns {boolean} true = keep
 */
export function passesWritingLiteracyGate(term, def = "") {
  const t = String(term ?? "").trim();
  const d = String(def ?? "");
  if (!t || t.length > 12) return false;
  if (BASIC_TERMS.has(t) || PLAIN_ALONE_TERMS.has(t) || BASIC_TERM_RE.test(t)) return false;
  if (JUNK_TERM_RE.test(t)) return false;
  if (d && JUNK_DEF_RE.test(d)) return false;
  if (d && BASIC_DEF_RE.test(d.trim()) && !LITERARY_HINT_RE.test(d)) return false;
  // Prefer Han literary surface
  if (!/[\u4e00-\u9fff]/.test(t)) return false;
  // Single Latin/digit heavy titles
  if (/[A-Za-z0-9]{3,}/.test(t)) return false;
  // Single-char only if literary-hinted
  if (t.length === 1 && !LITERARY_HINT_RE.test(d)) return false;
  return true;
}

/**
 * Soft score for ranking (higher = better for this product).
 * @param {string} term
 * @param {string} def
 */
export function writingLiteracyScore(term, def = "") {
  if (!passesWritingLiteracyGate(term, def)) return -999;
  let s = 10;
  if (LITERARY_HINT_RE.test(def)) s += 20;
  if (/語本|語出|典出|典故/.test(def)) s += 12;
  if (/比喻|修辭|意象|通感|反諷|婉辭|敬辭/.test(def)) s += 10;
  if (term.length >= 2 && term.length <= 4) s += 6;
  if (term.length === 1) s -= 8;
  if (/職官|官名|縣名|地名/.test(def)) s -= 25;
  if (PLAIN_ALONE_TERMS.has(term)) s -= 40;
  // Boost contrast / craft-ish surfaces
  if (/然$|焉$|乎$|矣$|哉$/.test(term)) s += 4;
  if (/^[^\s]{2,4}[然如若似]/.test(term)) s += 3;
  return s;
}

/**
 * @template {{term?: string, short_def?: string, long_def?: string}} T
 * @param {T[]} cards
 * @param {{ minScore?: number }} [opts]
 */
export function filterVocabCards(cards, opts = {}) {
  const minScore = opts.minScore ?? 0;
  const seen = new Set();
  const out = [];
  for (const c of cards) {
    const term = String(c.term ?? "").trim();
    const def = `${c.short_def ?? ""} ${c.long_def ?? ""}`;
    if (!passesWritingLiteracyGate(term, def)) continue;
    const score = writingLiteracyScore(term, def);
    if (score < minScore) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    out.push(c);
  }
  return out;
}

/**
 * @template {{term?: string, short_def?: string, long_def?: string}} T
 * @param {T[]} cards
 */
export function rankVocabCards(cards) {
  return [...cards].sort((a, b) => {
    const da = `${a.short_def ?? ""} ${a.long_def ?? ""}`;
    const db = `${b.short_def ?? ""} ${b.long_def ?? ""}`;
    return writingLiteracyScore(b.term ?? "", db) - writingLiteracyScore(a.term ?? "", da);
  });
}
