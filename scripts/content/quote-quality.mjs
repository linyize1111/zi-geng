/**
 * Reject encyclopedia bios / topic intros mistaken as quotes.
 * Keep classical verse that happens to contain 是／為／指／生於.
 */

const BIO_HEAD_RE =
  /^(?:[\u4e00-\u9fffA-Za-z·．.\s]{1,24}(?:（[^）]+）|\([^)]+\))?\s*[，,]?\s*)?(?:是一位|是一个|是一個|是一名|為一[位名個个]|乃一[位名]|指的是|生於\d|卒於\d|出生於|本名|原名|字[曰為]|號曰|又名|亦名)/u;

const BIO_YEARS_RE =
  /^[\u4e00-\u9fffA-Za-z·．.\s]{1,20}[（(][^）)]{4,40}[）)].{0,8}(?:名|字|人|思想家|教育家|作家|詩人|小說家)/;

const BIO_BODY_RE =
  /小說家|散文家|詩人|作家|文學家|劇作家|思想家|哲學家|出生於|逝世於|代表作|主要作品|英文名|英语：|英語：|维基百科|維基百科|是指|或称|或稱|是一位|是一个|是一個|屬於心理學|属于心理学/;

const TOPIC_AS_AUTHOR = new Set(
  `
寫作 文學 時間 孤獨 勇氣 愛情 自由 真理 自然 死亡 希望 失敗 記憶 沉默 旅行 藝術
教育 友誼 青春 戰爭 正義 命運 夢想 家庭 金錢 權力 恐懼 悔恨 寬恕 智慧 詩歌 小說
戲劇 音樂 美 醜 善 惡 信仰 懷疑
`
    .split(/\s+/)
    .filter(Boolean),
);

/**
 * @param {{ display_quote?: string, author_name?: string, work_title?: string }} card
 */
export function isLikelyBioNotQuote(card) {
  const quote = String(card.display_quote ?? "").trim();
  const author = String(card.author_name ?? "").trim();
  if (!quote || quote.length < 4) return true;
  if (TOPIC_AS_AUTHOR.has(author)) return true;
  if (BIO_YEARS_RE.test(quote)) return true;
  if (BIO_HEAD_RE.test(quote)) return true;
  // Author-name lead-in + profession encyclopedic sentence
  if (
    author &&
    quote.startsWith(author) &&
    BIO_BODY_RE.test(quote) &&
    quote.length >= 16 &&
    !/[「『""]/.test(quote)
  ) {
    return true;
  }
  // "X是…作家／詩人" without needing author_name match
  if (
    /^[\u4e00-\u9fffA-Za-z·．.]{1,16}是[\u4e00-\u9fff]{0,12}(?:著名)?(?:現代|当代|当代)?(?:中國|中国)?(?:現代)?(?:著名)?(?:作家|詩人|小說家|散文家|文學家)/.test(
      quote,
    )
  ) {
    return true;
  }
  // Long encyclopedic blob without quotation marks
  if (quote.length >= 60 && BIO_BODY_RE.test(quote) && !/[「『""]/.test(quote)) {
    // Classical couplets can be long; require bio markers denser than one hit
    const hits = (quote.match(BIO_BODY_RE) || []).length;
    if (hits >= 2 || /生於|卒於|出生於|逝世於|英语：|英語：/.test(quote)) return true;
  }
  return false;
}

/**
 * @param {{ display_quote?: string, author_name?: string }} card
 */
export function passesQuoteGate(card) {
  const quote = String(card.display_quote ?? "").trim();
  const author = String(card.author_name ?? "").trim();
  if (!quote || !author) return false;
  if (isLikelyBioNotQuote(card)) return false;
  if (quote.length > 280) return false;
  return true;
}

/**
 * @template {{ display_quote?: string, author_name?: string }} T
 * @param {T[]} cards
 */
export function filterQuoteCards(cards) {
  return (cards ?? []).filter(passesQuoteGate);
}
