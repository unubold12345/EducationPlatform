// Kana → romaji (modified Hepburn, long vowels written double: コーヒー → koohii, as typed on a keyboard).
// Used at build time for deck words and kana charts, and by tests. Pure and client-safe.

const BASE: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko", が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so", ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to", だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho", ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo", ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo", や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro", わ: "wa", ゐ: "i", ゑ: "e", を: "o", ん: "n", ゔ: "vu",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o", ゃ: "ya", ゅ: "yu", ょ: "yo", ゎ: "wa",
};
// Two-kana sounds: the small ゃゅょ, and the katakana-only combinations for loanwords (written in hiragana here).
const PAIRS: Record<string, string> = {
  しゃ: "sha", しゅ: "shu", しょ: "sho", しぇ: "she", ちゃ: "cha", ちゅ: "chu", ちょ: "cho", ちぇ: "che",
  じゃ: "ja", じゅ: "ju", じょ: "jo", じぇ: "je", ぢゃ: "ja", ぢゅ: "ju", ぢょ: "jo",
  ふぁ: "fa", ふぃ: "fi", ふぇ: "fe", ふぉ: "fo", てぃ: "ti", でぃ: "di", とぅ: "tu", どぅ: "du",
  うぃ: "wi", うぇ: "we", うぉ: "wo", ゔぁ: "va", ゔぃ: "vi", ゔぇ: "ve", ゔぉ: "vo", つぁ: "tsa", いぇ: "ye",
};
for (const head of ["き", "ぎ", "に", "ひ", "び", "ぴ", "み", "り"]) {
  const stem = BASE[head].slice(0, -1);
  PAIRS[head + "ゃ"] = stem + "ya"; PAIRS[head + "ゅ"] = stem + "yu"; PAIRS[head + "ょ"] = stem + "yo";
}

/** Katakana to hiragana; the long-vowel mark ー and other characters stay as they are. */
export const toHiragana = (text: string) => text.replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));

export function kanaToRomaji(kana: string): string {
  const text = toHiragana(kana);
  let out = "";
  let double = false;
  for (let index = 0; index < text.length; index++) {
    const pair = PAIRS[text.slice(index, index + 2)];
    const char = text[index];
    let piece = pair ?? BASE[char];
    if (pair) index++;
    if (char === "っ") { double = true; continue; }
    if (char === "ー") { const vowel = out.match(/[aeiou]$/)?.[0]; out += vowel ?? ""; continue; }
    if (piece === undefined) { out += char; double = false; continue; }
    // ん before a vowel or y is written n' (kin'en); っ doubles the next consonant (ch → tch).
    if (piece === "n" && /^[aeiouy]/.test((PAIRS[text.slice(index + 1, index + 3)] ?? BASE[text[index + 1]] ?? ""))) piece = "n'";
    if (double) { piece = (piece.startsWith("ch") ? "t" : piece[0]) + piece; double = false; }
    out += piece;
  }
  return out;
}

/** Other spellings a learner may type for the same kana (Nihon-shiki and IME input): shi/si, tsu/tu, fu/hu, ji/zi… */
export function romajiVariants(romaji: string): string[] {
  const swaps: [RegExp, string][] = [[/shi/g, "si"], [/chi/g, "ti"], [/tsu/g, "tu"], [/fu/g, "hu"], [/ji/g, "zi"], [/sh/g, "sy"], [/ch/g, "ty"], [/j(?=[aueo])/g, "zy"], [/n'/g, "nn"], [/n'/g, "n"]];
  const found = new Set<string>();
  for (const [pattern, replacement] of swaps) { const value = romaji.replace(pattern, replacement); if (value !== romaji) found.add(value); }
  return [...found];
}
