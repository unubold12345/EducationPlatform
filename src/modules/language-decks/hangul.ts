// Hangul for the TOPIK Workshop (Workshop → TOPIK): syllable (de)composition, the learner chart's letters, and a
// pronunciation-based romanization. Pure and client-safe; scripts/build-topik-decks.mjs imports it too.
//
// romanize() writes Revised Romanization letters (the official Korean system, 2000) after the main sound changes inside
// a word: linking a final consonant into a following vowel, the seven final sounds, nasalization, ㄹ→ㄴ, ㄴ+ㄹ→ㄹㄹ,
// aspiration with ㅎ and palatalization (같이 → gachi). Like Revised Romanization it does not mark tensification
// (읽다 → ikda), and it applies the rules across the syllables of a written word, so a compound such as 맛없다 reads
// "maseopda" where the standard pronunciation is [마덥따]. The decks show the dictionary pronunciation in Hangul next to it,
// and scripts/build-topik-decks.mjs romanizes such words from a respelling in the draft (`sounds`: 마덦다 → madeopda).

const BASE = 0xac00, LAST = 0xd7a3;
export const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;
export const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"] as const;
export const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;

const ROMAN_INITIAL: Record<string, string> = {
  "ㄱ": "g", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "d", "ㄸ": "tt", "ㄹ": "r", "ㅁ": "m", "ㅂ": "b", "ㅃ": "pp", "ㅅ": "s", "ㅆ": "ss", "ㅇ": "",
  "ㅈ": "j", "ㅉ": "jj", "ㅊ": "ch", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "h",
};
const ROMAN_VOWEL: Record<string, string> = {
  "ㅏ": "a", "ㅐ": "ae", "ㅑ": "ya", "ㅒ": "yae", "ㅓ": "eo", "ㅔ": "e", "ㅕ": "yeo", "ㅖ": "ye", "ㅗ": "o", "ㅘ": "wa", "ㅙ": "wae", "ㅚ": "oe",
  "ㅛ": "yo", "ㅜ": "u", "ㅝ": "wo", "ㅞ": "we", "ㅟ": "wi", "ㅠ": "yu", "ㅡ": "eu", "ㅢ": "ui", "ㅣ": "i",
};
const ROMAN_FINAL: Record<string, string> = { "": "", "ㄱ": "k", "ㄴ": "n", "ㄷ": "t", "ㄹ": "l", "ㅁ": "m", "ㅂ": "p", "ㅇ": "ng" };
/** The seven sounds a final consonant can have before a consonant or at the end of a word. */
const NEUTRAL: Record<string, string> = {
  "": "", "ㄱ": "ㄱ", "ㄲ": "ㄱ", "ㅋ": "ㄱ", "ㄳ": "ㄱ", "ㄺ": "ㄱ", "ㄴ": "ㄴ", "ㄵ": "ㄴ", "ㄶ": "ㄴ",
  "ㄷ": "ㄷ", "ㅅ": "ㄷ", "ㅆ": "ㄷ", "ㅈ": "ㄷ", "ㅊ": "ㄷ", "ㅌ": "ㄷ", "ㅎ": "ㄷ",
  "ㄹ": "ㄹ", "ㄼ": "ㄹ", "ㄽ": "ㄹ", "ㄾ": "ㄹ", "ㅀ": "ㄹ", "ㅁ": "ㅁ", "ㄻ": "ㅁ", "ㅂ": "ㅂ", "ㅍ": "ㅂ", "ㅄ": "ㅂ", "ㄿ": "ㅂ", "ㅇ": "ㅇ",
};
/** A double final: the part that stays and the part that links into a following vowel. */
const SPLIT: Record<string, [string, string]> = {
  "ㄳ": ["ㄱ", "ㅅ"], "ㄵ": ["ㄴ", "ㅈ"], "ㄺ": ["ㄹ", "ㄱ"], "ㄻ": ["ㄹ", "ㅁ"], "ㄼ": ["ㄹ", "ㅂ"], "ㄽ": ["ㄹ", "ㅅ"], "ㄾ": ["ㄹ", "ㅌ"], "ㄿ": ["ㄹ", "ㅍ"], "ㅄ": ["ㅂ", "ㅅ"],
};
const NASAL: Record<string, string> = { "ㄱ": "ㅇ", "ㄷ": "ㄴ", "ㅂ": "ㅁ" };
const ASPIRATE: Record<string, string> = { "ㄱ": "ㅋ", "ㄷ": "ㅌ", "ㅈ": "ㅊ", "ㅂ": "ㅍ" };

export type Syllable = { initial: string; vowel: string; final: string };

export const isSyllable = (char: string) => { const code = char.codePointAt(0) ?? 0; return code >= BASE && code <= LAST; };

export function decompose(char: string): Syllable | null {
  if (!isSyllable(char)) return null;
  const index = char.codePointAt(0)! - BASE;
  return { initial: INITIALS[Math.floor(index / 588)], vowel: VOWELS[Math.floor((index % 588) / 28)], final: FINALS[index % 28] };
}

export function compose({ initial, vowel, final }: Syllable): string {
  const i = INITIALS.indexOf(initial as (typeof INITIALS)[number]), v = VOWELS.indexOf(vowel as (typeof VOWELS)[number]), f = FINALS.indexOf(final as (typeof FINALS)[number]);
  if (i < 0 || v < 0 || f < 0) throw new Error(`not a syllable: ${initial}${vowel}${final}`);
  return String.fromCodePoint(BASE + i * 588 + v * 28 + f);
}

/** The sound changes between two syllables of a word, applied in place: `a`'s final meets `b`'s initial. */
function link(a: Syllable, b: Syllable, word: string) {
  const t = a.final, l = b.initial;
  if (!t) return;
  // Palatalization: ㄷ/ㅌ + 이 → 지/치 (같이 → 가치, 굳이 → 구지); ㄷ + 히 → 치 (닫히다 → 다치다).
  if (b.vowel === "ㅣ" && ((l === "ㅇ" && (t === "ㄷ" || t === "ㅌ" || t === "ㄾ")) || (l === "ㅎ" && t === "ㄷ"))) {
    a.final = t === "ㄾ" ? "ㄹ" : ""; b.initial = t === "ㄷ" && l === "ㅇ" ? "ㅈ" : "ㅊ"; return;
  }
  if (l === "ㅇ") {
    // Linking into a vowel: the final (or a double final's second part) becomes the next initial; ㅎ goes silent.
    if (t === "ㅇ") return;
    if (t === "ㅎ") { a.final = ""; return; }
    if (t === "ㄶ") { a.final = ""; b.initial = "ㄴ"; return; }
    if (t === "ㅀ") { a.final = ""; b.initial = "ㄹ"; return; }
    if (SPLIT[t]) { a.final = SPLIT[t][0]; b.initial = SPLIT[t][1]; return; }
    a.final = ""; b.initial = t; return;
  }
  if (l === "ㅎ") {
    // Aspiration: ㄱ/ㄷ/ㅂ/ㅈ + ㅎ → ㅋ/ㅌ/ㅍ/ㅊ (축하 → 추카, 입학 → 이팍, 앉히다 → 안치다).
    const [stay, last] = SPLIT[t] ?? ["", t];
    const sound = last === "ㅈ" || last === "ㅊ" ? "ㅈ" : NEUTRAL[last];
    if (ASPIRATE[sound]) { a.final = stay; b.initial = ASPIRATE[sound]; return; }
    a.final = NEUTRAL[t]; return;
  }
  if (t === "ㅎ" || t === "ㄶ" || t === "ㅀ") {
    // ㅎ before a consonant: 좋다 → 조타, 좋습니다 → 조씀니다, 놓는 → 논는, 싫네 → 실레.
    const stay = t === "ㅎ" ? "" : t === "ㄶ" ? "ㄴ" : "ㄹ";
    if (l === "ㄱ" || l === "ㄷ" || l === "ㅈ") { a.final = stay; b.initial = ASPIRATE[l]; return; }
    if (l === "ㅅ") { a.final = stay; b.initial = "ㅆ"; return; }
    if (l === "ㄴ") { a.final = stay || "ㄴ"; if (stay === "ㄹ") b.initial = "ㄹ"; return; }
    a.final = stay || "ㄷ"; return;
  }
  // The seven final sounds; ㄺ before ㄱ keeps ㄹ (읽고 → 일고), 밟- keeps ㅂ (밟다 → 밥다).
  a.final = t === "ㄺ" && l === "ㄱ" ? "ㄹ" : t === "ㄼ" && word.startsWith("밟") ? "ㅂ" : NEUTRAL[t];
  if (l === "ㄴ" || l === "ㅁ") a.final = NASAL[a.final] ?? a.final;                  // 합니다 → 함니다, 먹는 → 멍는
  if (l === "ㄹ") {
    if (a.final === "ㄴ") a.final = "ㄹ";                                                // 신라 → 실라
    else if (a.final !== "ㄹ") { b.initial = "ㄴ"; a.final = NASAL[a.final] ?? a.final; } // 종로 → 종노, 독립 → 동닙
  }
  if (a.final === "ㄹ" && b.initial === "ㄴ") b.initial = "ㄹ";                         // 설날 → 설랄
}

/** A run of Hangul syllables after the sound changes, final consonants not yet reduced. */
function sounded(word: string): Syllable[] {
  const syllables = [...word].map(char => decompose(char)!);
  for (let index = 0; index < syllables.length - 1; index++) link(syllables[index], syllables[index + 1], word);
  return syllables;
}

/** The pronunciation in Hangul as these rules give it (no tensification): 한국어 → 한구거, 합니다 → 함니다. */
export function pronounce(text: string): string {
  return text.replace(/[가-힣]+/g, word => sounded(word).map(syllable => compose({ ...syllable, final: NEUTRAL[syllable.final] })).join(""));
}

/** Pronunciation-based romanization in Revised Romanization letters: 한국어 → hangugeo, 읽어요 → ilgeoyo, 같이 → gachi. */
export function romanize(text: string): string {
  return text.replace(/[가-힣]+/g, word => {
    const syllables = sounded(word);
    return syllables.map((syllable, index) => {
      const before = syllables[index - 1];
      const initial = syllable.initial === "ㄹ" && before && NEUTRAL[before.final] === "ㄹ" ? "l" : ROMAN_INITIAL[syllable.initial];
      return initial + ROMAN_VOWEL[syllable.vowel] + ROMAN_FINAL[NEUTRAL[syllable.final]];
    }).join("");
  }).toLowerCase();
}

// --- The learner chart (Workshop → TOPIK → Hangul) ----------------------------------------------------------------

export const BASIC_VOWELS = ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"] as const;
export const COMPOUND_VOWELS = ["ㅐ", "ㅒ", "ㅔ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"] as const;
export const BASIC_CONSONANTS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;
export const TENSE_CONSONANTS = ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"] as const;

/** A letter's romanization at the start of a syllable, and as a final when that differs: ㄱ → "g / k", ㅇ → "– / ng". */
export function letterRoman(letter: string): string {
  if (ROMAN_VOWEL[letter]) return ROMAN_VOWEL[letter];
  const start = ROMAN_INITIAL[letter] || "–";
  const end = (FINALS as readonly string[]).includes(letter) ? ROMAN_FINAL[NEUTRAL[letter]] : "";
  return end && end !== start ? `${start} / ${end}` : start;
}
