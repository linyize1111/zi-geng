export type KanaScript = "hiragana" | "katakana";

export type KanaEntry = {
  id: string;
  script: KanaScript;
  char: string;
  romaji: string;
  row: string;
};

/** Gojūon (basic 46) — no dakuten / yōon in v1 drill set. */
const HIRA: [string, string, string][] = [
  ["あ", "a", "あ行"],
  ["い", "i", "あ行"],
  ["う", "u", "あ行"],
  ["え", "e", "あ行"],
  ["お", "o", "あ行"],
  ["か", "ka", "か行"],
  ["き", "ki", "か行"],
  ["く", "ku", "か行"],
  ["け", "ke", "か行"],
  ["こ", "ko", "か行"],
  ["さ", "sa", "さ行"],
  ["し", "shi", "さ行"],
  ["す", "su", "さ行"],
  ["せ", "se", "さ行"],
  ["そ", "so", "さ行"],
  ["た", "ta", "た行"],
  ["ち", "chi", "た行"],
  ["つ", "tsu", "た行"],
  ["て", "te", "た行"],
  ["と", "to", "た行"],
  ["な", "na", "な行"],
  ["に", "ni", "な行"],
  ["ぬ", "nu", "な行"],
  ["ね", "ne", "な行"],
  ["の", "no", "な行"],
  ["は", "ha", "は行"],
  ["ひ", "hi", "は行"],
  ["ふ", "fu", "は行"],
  ["へ", "he", "は行"],
  ["ほ", "ho", "は行"],
  ["ま", "ma", "ま行"],
  ["み", "mi", "ま行"],
  ["む", "mu", "ま行"],
  ["め", "me", "ま行"],
  ["も", "mo", "ま行"],
  ["や", "ya", "や行"],
  ["ゆ", "yu", "や行"],
  ["よ", "yo", "や行"],
  ["ら", "ra", "ら行"],
  ["り", "ri", "ら行"],
  ["る", "ru", "ら行"],
  ["れ", "re", "ら行"],
  ["ろ", "ro", "ら行"],
  ["わ", "wa", "わ行"],
  ["を", "wo", "わ行"],
  ["ん", "n", "ん"],
];

const KATA: [string, string, string][] = [
  ["ア", "a", "ア行"],
  ["イ", "i", "ア行"],
  ["ウ", "u", "ア行"],
  ["エ", "e", "ア行"],
  ["オ", "o", "ア行"],
  ["カ", "ka", "カ行"],
  ["キ", "ki", "カ行"],
  ["ク", "ku", "カ行"],
  ["ケ", "ke", "カ行"],
  ["コ", "ko", "カ行"],
  ["サ", "sa", "サ行"],
  ["シ", "shi", "サ行"],
  ["ス", "su", "サ行"],
  ["セ", "se", "サ行"],
  ["ソ", "so", "サ行"],
  ["タ", "ta", "タ行"],
  ["チ", "chi", "タ行"],
  ["ツ", "tsu", "タ行"],
  ["テ", "te", "タ行"],
  ["ト", "to", "タ行"],
  ["ナ", "na", "ナ行"],
  ["ニ", "ni", "ナ行"],
  ["ヌ", "nu", "ナ行"],
  ["ネ", "ne", "ナ行"],
  ["ノ", "no", "ナ行"],
  ["ハ", "ha", "ハ行"],
  ["ヒ", "hi", "ハ行"],
  ["フ", "fu", "ハ行"],
  ["ヘ", "he", "ハ行"],
  ["ホ", "ho", "ハ行"],
  ["マ", "ma", "マ行"],
  ["ミ", "mi", "マ行"],
  ["ム", "mu", "マ行"],
  ["メ", "me", "マ行"],
  ["モ", "mo", "マ行"],
  ["ヤ", "ya", "ヤ行"],
  ["ユ", "yu", "ヤ行"],
  ["ヨ", "yo", "ヤ行"],
  ["ラ", "ra", "ラ行"],
  ["リ", "ri", "ラ行"],
  ["ル", "ru", "ラ行"],
  ["レ", "re", "ラ行"],
  ["ロ", "ro", "ラ行"],
  ["ワ", "wa", "ワ行"],
  ["ヲ", "wo", "ワ行"],
  ["ン", "n", "ン"],
];

function build(script: KanaScript, rows: [string, string, string][]): KanaEntry[] {
  return rows.map(([char, romaji, row]) => ({
    id: `${script}-${romaji}-${char}`,
    script,
    char,
    romaji,
    row,
  }));
}

export const HIRAGANA: KanaEntry[] = build("hiragana", HIRA);
export const KATAKANA: KanaEntry[] = build("katakana", KATA);
export const ALL_KANA: KanaEntry[] = [...HIRAGANA, ...KATAKANA];

export function kanaByScript(script: KanaScript): KanaEntry[] {
  return script === "hiragana" ? HIRAGANA : KATAKANA;
}

export function findKana(id: string): KanaEntry | undefined {
  return ALL_KANA.find((k) => k.id === id);
}
