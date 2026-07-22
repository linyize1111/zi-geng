export type JpVocab = {
  id: string;
  word: string;
  reading: string;
  meaningZh: string;
  note?: string;
};

export type JpGrammar = {
  id: string;
  title: string;
  pattern: string;
  meaningZh: string;
  example: string;
  exampleZh: string;
};

/** Beginner seed — static, no CMS. */
export const BEGINNER_VOCAB: JpVocab[] = [
  { id: "v-watashi", word: "私", reading: "わたし", meaningZh: "我", note: "禮貌場合常用" },
  {
    id: "v-anata",
    word: "あなた",
    reading: "あなた",
    meaningZh: "你",
    note: "口語可省略，避免過度使用",
  },
  { id: "v-desu", word: "です", reading: "です", meaningZh: "是（丁寧形）" },
  { id: "v-arigatou", word: "ありがとう", reading: "ありがとう", meaningZh: "謝謝" },
  { id: "v-sumimasen", word: "すみません", reading: "すみません", meaningZh: "對不起／勞駕" },
  { id: "v-ohayou", word: "おはよう", reading: "おはよう", meaningZh: "早安（熟人）" },
  { id: "v-konnichiwa", word: "こんにちは", reading: "こんにちは", meaningZh: "你好（白天）" },
  { id: "v-konbanwa", word: "こんばんは", reading: "こんばんは", meaningZh: "晚安／晚上好" },
  { id: "v-hai", word: "はい", reading: "はい", meaningZh: "是／好的" },
  { id: "v-iie", word: "いいえ", reading: "いいえ", meaningZh: "不是／不用" },
  { id: "v-taberu", word: "食べる", reading: "たべる", meaningZh: "吃" },
  { id: "v-nomu", word: "飲む", reading: "のむ", meaningZh: "喝" },
  { id: "v-iku", word: "行く", reading: "いく", meaningZh: "去" },
  { id: "v-kuru", word: "来る", reading: "くる", meaningZh: "來" },
  { id: "v-miru", word: "見る", reading: "みる", meaningZh: "看" },
  { id: "v-kaku", word: "書く", reading: "かく", meaningZh: "寫" },
  { id: "v-yomu", word: "読む", reading: "よむ", meaningZh: "讀" },
  { id: "v-hon", word: "本", reading: "ほん", meaningZh: "書" },
  { id: "v-mizu", word: "水", reading: "みず", meaningZh: "水" },
  { id: "v-tomodachi", word: "友達", reading: "ともだち", meaningZh: "朋友" },
];

export const BEGINNER_GRAMMAR: JpGrammar[] = [
  {
    id: "g-desu",
    title: "名詞句・です",
    pattern: "N です",
    meaningZh: "表示「是…」（丁寧）",
    example: "私は学生です。",
    exampleZh: "我是學生。",
  },
  {
    id: "g-wa",
    title: "主題の「は」",
    pattern: "N は …",
    meaningZh: "標出主題（讀作「わ」）",
    example: "これは本です。",
    exampleZh: "這是書。",
  },
  {
    id: "g-no",
    title: "所有の「の」",
    pattern: "N1 の N2",
    meaningZh: "的／所屬",
    example: "私の本です。",
    exampleZh: "是我的書。",
  },
  {
    id: "g-ka",
    title: "疑問の「か」",
    pattern: "…か。",
    meaningZh: "疑問句結尾",
    example: "学生ですか。",
    exampleZh: "是學生嗎？",
  },
  {
    id: "g-masu",
    title: "動詞丁寧形・ます",
    pattern: "V-ます",
    meaningZh: "動詞的禮貌形",
    example: "本を読みます。",
    exampleZh: "讀書。",
  },
  {
    id: "g-wo",
    title: "目的語の「を」",
    pattern: "N を V",
    meaningZh: "標出動作對象",
    example: "水を飲みます。",
    exampleZh: "喝水。",
  },
  {
    id: "g-ni-iku",
    title: "行き先の「に」",
    pattern: "場所 に 行きます",
    meaningZh: "去某處",
    example: "学校に行きます。",
    exampleZh: "去學校。",
  },
  {
    id: "g-janai",
    title: "否定・じゃないです",
    pattern: "N じゃないです",
    meaningZh: "不是…（口語丁寧）",
    example: "学生じゃないです。",
    exampleZh: "不是學生。",
  },
];
