// The kana charts for Workshop → JLPT → Kana (2026-11-18). Each chart row is a lesson whose `cells` keep the
// chart's columns (null = empty cell), so the page can draw the classic table and the cards/quiz can study a row.
// Romaji, accepted spellings and ids are added by scripts/build-language-decks.mjs.

const row = (id, title, section, cells) => ({ id, title, section, cells });
const HIRAGANA = [
  row("a", "a", "basic", ["あ", "い", "う", "え", "お"]),
  row("k", "k", "basic", ["か", "き", "く", "け", "こ"]),
  row("s", "s", "basic", ["さ", "し", "す", "せ", "そ"]),
  row("t", "t", "basic", ["た", "ち", "つ", "て", "と"]),
  row("n", "n", "basic", ["な", "に", "ぬ", "ね", "の"]),
  row("h", "h", "basic", ["は", "ひ", "ふ", "へ", "ほ"]),
  row("m", "m", "basic", ["ま", "み", "む", "め", "も"]),
  row("y", "y", "basic", ["や", null, "ゆ", null, "よ"]),
  row("r", "r", "basic", ["ら", "り", "る", "れ", "ろ"]),
  row("w", "w", "basic", ["わ", null, null, null, "を"]),
  row("nn", "n", "basic", ["ん", null, null, null, null]),
  row("g", "g", "voiced", ["が", "ぎ", "ぐ", "げ", "ご"]),
  row("z", "z", "voiced", ["ざ", "じ", "ず", "ぜ", "ぞ"]),
  row("d", "d", "voiced", ["だ", "ぢ", "づ", "で", "ど"]),
  row("b", "b", "voiced", ["ば", "び", "ぶ", "べ", "ぼ"]),
  row("p", "p", "voiced", ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]),
  ...[["ky", "き"], ["sh", "し"], ["ch", "ち"], ["ny", "に"], ["hy", "ひ"], ["my", "み"], ["ry", "り"], ["gy", "ぎ"], ["j", "じ"], ["by", "び"], ["py", "ぴ"]]
    .map(([id, head]) => row(id, id, "combo", [head + "ゃ", head + "ゅ", head + "ょ"])),
];
const toKatakana = text => text.replace(/[ぁ-ゖ]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60));

export const KANA_SCRIPTS = [
  { id: "kana-hiragana", title: "Хирагана", rows: HIRAGANA,
    // Pairs learners mix up; the page's "Адилхан" button quizzes these.
    lookalikes: ["あ", "お", "ぬ", "め", "ね", "れ", "わ", "さ", "ち", "は", "ほ", "る", "ろ", "い", "り", "き", "け"] },
  { id: "kana-katakana", title: "Катакана", rows: HIRAGANA.map(item => ({ ...item, cells: item.cells.map(cell => cell && toKatakana(cell)) })),
    lookalikes: ["シ", "ツ", "ソ", "ン", "ク", "ケ", "タ", "ウ", "ワ", "フ", "ノ", "メ", "ス", "ヌ", "チ", "テ", "コ", "ユ", "マ", "ア"] },
];
