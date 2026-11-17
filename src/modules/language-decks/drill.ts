// The Workshop quiz engine (owner request 2026-11-18: "a quiz maker like Duolingo" for Kana and the JLPT/HSK decks; the
// Pinyin tone drill runs on it too). Pure and client-safe: it turns study items into a list of short exercises; the
// session UI (drill-session.tsx) asks them one by one and saves one grade per item through the deck review route.
import { isDue, isWeak, type Studied } from "../vocabulary/study.ts";
import type { DeckProgress, LanguageDeck } from "./catalog.ts";
import { spellTones, toneChoices, type Syllable } from "./tones.ts";

/** One thing to learn: a kana (meaning = romaji) or a deck word (meaning = Mongolian). */
export type DrillItem = {
  id: string;
  term: string;
  meaning: string;
  /** Kana or pinyin of a word; null for kana and when the reading is the term itself. */
  reading: string | null;
  /** Typed answers that count (kana: romaji spellings; JLPT words: kana and romaji; HSK words: pinyin). */
  typed: readonly string[];
  example: string | null;
  exampleMeaning: string | null;
  syllables: readonly Syllable[] | null;
  /** Lesson or chart row: distractors come from the same group first. */
  group: string;
  state: Studied | null;
};

export const DRILL_KINDS = ["meaning", "term", "listen", "match", "type", "build", "cloze", "tone"] as const;
export type DrillKind = (typeof DRILL_KINDS)[number];
export type DrillFocus = "smart" | "new" | "weak" | "all";
export type DrillDomain = "kana" | "jlpt" | "hsk" | "tones";

export type DrillOption = { text: string; sub: string | null };
export type Exercise =
  | { kind: "meaning" | "term" | "listen" | "cloze" | "tone"; key: string; itemId: string; prompt: string; sub: string | null; speak: string | null; options: DrillOption[]; answer: number }
  | { kind: "type"; key: string; itemId: string; prompt: string; sub: string | null; speak: string | null; accepted: string[]; shown: string }
  | { kind: "build"; key: string; itemId: string; prompt: string; sub: string | null; speak: string | null; tiles: string[]; answer: string[]; joiner: string }
  | { kind: "match"; key: string; itemIds: string[]; left: { id: string; text: string }[]; right: { id: string; text: string }[] };

type Random = () => number;
const shuffle = <T,>(list: readonly T[], random: Random) => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

/** Which items a session asks, in order. smart: due, then new, then weak, then the rest. */
export function pickTargets(items: readonly DrillItem[], focus: DrillFocus, count: number, now: number, random: Random = Math.random): DrillItem[] {
  const band = (item: DrillItem) => {
    const state = item.state;
    if (focus === "all") return 0;
    if (focus === "new") return !state || state.box === 0 ? 0 : 1;
    if (focus === "weak") return state && (isWeak(state) || (state.box > 0 && state.box <= 2)) ? 0 : 1;
    return state && isDue(state, now) ? 0 : !state || state.box === 0 ? 1 : isWeak(state) ? 2 : 3;
  };
  return shuffle(items, random).map(item => ({ item, band: band(item) })).sort((a, b) => a.band - b.band).slice(0, count).map(entry => entry.item);
}

/** Japanese reading split into tiles: a small ゃゅょ… joins the kana before it. */
export function morae(kana: string): string[] {
  const out: string[] = [];
  for (const char of kana) {
    if (/[ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ]/.test(char) && out.length) out[out.length - 1] += char;
    else out.push(char);
  }
  return out;
}

/** Lenient comparison for typed answers: case, spaces, apostrophes, hyphens and tone marks do not matter; v = ü. */
export function normalizeTyped(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\s'’\-.,!?。、]/g, "").replace(/v/g, "u");
}
export const typedMatches = (typed: string, accepted: readonly string[]) => {
  const value = normalizeTyped(typed);
  return value.length > 0 && accepted.some(answer => normalizeTyped(answer) === value);
};

const INSTRUCTIONS: Record<DrillDomain, Partial<Record<DrillKind, string>>> = {
  kana: { meaning: "Энэ үсгийг юу гэж уншдаг вэ?", term: "Энэ дуудлагын үсгийг сонго", listen: "Сонссон үсгээ сонго", match: "Хосыг нь ол", type: "Romaji-гаар бич" },
  jlpt: { meaning: "Энэ үг юу гэсэн утгатай вэ?", term: "Энэ утгатай үгийг сонго", listen: "Сонссон үгээ сонго", match: "Хосыг нь ол", type: "Дуудлагыг нь бич (romaji эсвэл кана)",
    build: "Дуудлагыг нь хэсгүүдээр бүрдүүл", cloze: "Өгүүлбэрийн хоосон зайг нөх" },
  hsk: { meaning: "Энэ үг юу гэсэн утгатай вэ?", term: "Энэ утгатай үгийг сонго", listen: "Сонссон үгээ сонго", match: "Хосыг нь ол", type: "Pinyin-ээр бич (аялгуугүй ч болно)",
    build: "Үгийг ханзаар нь бүрдүүл", cloze: "Өгүүлбэрийн хоосон зайг нөх" },
  tones: { tone: "Зөв аялгууг сонго" },
};
export const instruction = (domain: DrillDomain, kind: DrillKind) => INSTRUCTIONS[domain][kind] ?? "";

/** Which exercise kinds a domain offers; listening only with a voice for the language. */
export function domainKinds(domain: DrillDomain, voiced: boolean): DrillKind[] {
  const kinds: DrillKind[] = domain === "tones" ? ["tone"] : domain === "kana" ? ["meaning", "term", "listen", "match", "type"] : ["meaning", "term", "listen", "match", "type", "build", "cloze"];
  return voiced ? kinds : kinds.filter(kind => kind !== "listen");
}

// Easier kinds while a word is new, recall-heavy kinds once it is known (Duolingo's order: recognise, then produce).
const WEIGHT: Record<DrillKind, [number, number, number]> = {
  meaning: [4, 2, 1], term: [3, 2, 1], listen: [2, 2, 2], match: [0, 0, 0], type: [0.5, 2, 3], build: [1, 2, 2], cloze: [0.5, 2, 3], tone: [1, 1, 1],
};

type Options = { domain: DrillDomain; kinds: readonly DrillKind[]; random?: Random; showReading?: boolean; lookalikes?: readonly string[] };

/**
 * The session: one exercise per target, and a "match the pairs" round after every fifth when chosen. `pool` is every item
 * of the deck or chart, for distractors.
 */
export function buildDrill(targets: readonly DrillItem[], pool: readonly DrillItem[], options: Options): Exercise[] {
  const random = options.random ?? Math.random;
  const { domain } = options;
  const kinds = options.kinds.filter(kind => DRILL_KINDS.includes(kind));
  const confusable = new Set(options.lookalikes ?? []);
  const exercises: Exercise[] = [];
  let serial = 0;
  const key = () => "x" + ++serial;

  // Three wrong answers: same group first (and kana look-alikes), then the whole pool; never a duplicate text.
  const distractors = (item: DrillItem, text: (candidate: DrillItem) => string) => {
    const right = text(item);
    const seen = new Set([right]);
    const near = pool.filter(candidate => candidate.id !== item.id && (candidate.group === item.group || (confusable.has(candidate.id) && confusable.has(item.id))));
    const far = pool.filter(candidate => candidate.id !== item.id && !near.includes(candidate));
    const picked: DrillItem[] = [];
    for (const candidate of [...shuffle(near, random), ...shuffle(far, random)]) {
      const value = text(candidate);
      if (seen.has(value)) continue;
      seen.add(value); picked.push(candidate);
      if (picked.length === 3) break;
    }
    return picked;
  };
  const choice = (kind: "meaning" | "term" | "listen" | "cloze", item: DrillItem, prompt: string, sub: string | null, speak: string | null): Exercise | null => {
    const toMeaning = kind === "meaning";
    const label = (candidate: DrillItem): DrillOption => toMeaning ? { text: candidate.meaning, sub: null }
      : { text: candidate.term, sub: options.showReading && candidate.reading && candidate.reading !== candidate.term ? candidate.reading : null };
    const wrong = distractors(item, candidate => toMeaning ? candidate.meaning : candidate.term);
    if (wrong.length < 3) return null;
    const list = shuffle([item, ...wrong], random);
    return { kind, key: key(), itemId: item.id, prompt, sub, speak, options: list.map(label), answer: list.indexOf(item) };
  };
  const sentenceGap = (item: DrillItem) => {
    if (!item.example || item.example.split(item.term).length !== 2) return null;
    return item.example.replace(item.term, "＿＿");
  };
  const buildable = (item: DrillItem) => {
    if (domain === "jlpt") { const parts = morae(item.reading ?? item.term); return /^[぀-ヿー]+$/.test(item.reading ?? item.term) && parts.length >= 2 && parts.length <= 7; }
    if (domain === "hsk") return [...item.term].length >= 2 && [...item.term].length <= 5;
    return false;
  };
  const fits = (kind: DrillKind, item: DrillItem) => kind === "cloze" ? sentenceGap(item) !== null : kind === "build" ? buildable(item)
    : kind === "tone" ? Boolean(item.syllables?.length) : kind === "type" ? item.typed.length > 0 : kind !== "match";

  const make = (kind: DrillKind, item: DrillItem): Exercise | null => {
    const reading = options.showReading && item.reading && item.reading !== item.term ? item.reading : null;
    switch (kind) {
      case "meaning": return choice("meaning", item, item.term, reading, item.term);
      case "term": return choice("term", item, item.meaning, null, null);
      case "listen": return choice("listen", item, "", null, item.term);
      case "cloze": return choice("cloze", item, sentenceGap(item)!, item.exampleMeaning, null);
      case "type": return { kind, key: key(), itemId: item.id, prompt: domain === "kana" ? item.term : item.term, sub: domain === "kana" ? null : item.meaning,
        speak: item.term, accepted: [...item.typed], shown: domain === "kana" ? item.meaning : item.reading ?? item.term };
      case "build": {
        const answer = domain === "jlpt" ? morae(item.reading ?? item.term) : [...item.term];
        const spare = shuffle(pool.filter(candidate => candidate.id !== item.id), random).flatMap(candidate => domain === "jlpt" ? morae(candidate.reading ?? candidate.term) : [...candidate.term])
          .filter(part => !answer.includes(part) && (domain === "jlpt" ? /^[぀-ヿー]+$/.test(part) : true));
        const extra = [...new Set(spare)].slice(0, answer.length <= 3 ? 3 : 4);
        const kanaOnly = domain === "jlpt" && (item.reading ?? item.term) === item.term;
        return { kind, key: key(), itemId: item.id, prompt: domain === "hsk" || kanaOnly ? item.meaning : item.term,
          sub: domain === "hsk" ? (options.showReading ? item.reading : null) : kanaOnly ? null : item.meaning,
          speak: item.term, tiles: shuffle([...answer, ...extra], random), answer, joiner: "" };
      }
      case "tone": {
        const { options: spelled, answer } = toneChoices(item.syllables ?? [], random);
        return { kind, key: key(), itemId: item.id, prompt: item.term, sub: item.meaning, speak: item.term, options: spelled.map(text => ({ text, sub: null })), answer };
      }
      default: return null;
    }
  };

  const solo = kinds.filter(kind => kind !== "match");
  targets.forEach((item, index) => {
    const band = !item.state || item.state.box <= 1 ? 0 : item.state.box <= 3 ? 1 : 2;
    const able = solo.filter(kind => fits(kind, item));
    let made: Exercise | null = null;
    // Weighted pick among the kinds that fit; fall back to a plain choice.
    const total = able.reduce((sum, kind) => sum + WEIGHT[kind][band], 0);
    let roll = random() * total;
    const ordered = [...able.filter(kind => { roll -= WEIGHT[kind][band]; return roll < 0; }).slice(0, 1), ...shuffle(able, random), "meaning" as DrillKind, "term" as DrillKind];
    for (const kind of ordered) { if (domain === "tones" && kind !== "tone") continue; made = make(kind, item); if (made) break; }
    if (made) exercises.push(made);
    // A pairs round after every fifth item, with five recent items whose texts are all different.
    if (kinds.includes("match") && (index + 1) % 5 === 0) {
      const recent = targets.slice(Math.max(0, index - 4), index + 1);
      const unique = recent.filter((candidate, at) => recent.findIndex(other => other.meaning === candidate.meaning || other.term === candidate.term) === at);
      if (unique.length >= 3) {
        exercises.push({ kind: "match", key: key(), itemIds: unique.map(entry => entry.id),
          left: shuffle(unique.map(entry => ({ id: entry.id, text: entry.term })), random), right: shuffle(unique.map(entry => ({ id: entry.id, text: entry.meaning })), random) });
      }
    }
  });
  return exercises;
}

/** The right answer as text, for the feedback bar. */
export function rightAnswer(exercise: Exercise): string {
  if (exercise.kind === "type") return exercise.shown;
  if (exercise.kind === "build") return exercise.answer.join(exercise.joiner);
  if (exercise.kind === "match") return "";
  const option = exercise.options[exercise.answer];
  return option.sub ? `${option.text} (${option.sub})` : option.text;
}

export const toneText = (item: Pick<DrillItem, "syllables">) => spellTones(item.syllables ?? []);

/** A deck, kana chart or tone drill as quiz items. Kana: the romaji is the meaning. Tones: the reading is the toned pinyin. */
export function deckDrillItems(deck: LanguageDeck, progress: Record<string, DeckProgress>): DrillItem[] {
  return deck.lessons.flatMap(lesson => lesson.words.map(word => {
    const base = { id: word.id, term: word.term, meaning: word.meaning, example: word.example || null, exampleMeaning: word.exampleMeaning || null,
      syllables: word.syllables ?? null, group: lesson.id, state: progress[word.id] ?? null };
    if (deck.kind === "kana") return { ...base, reading: null, typed: word.answers ?? [word.meaning] };
    if (deck.kind === "tones") return { ...base, reading: spellTones(word.syllables ?? []), typed: [] };
    return { ...base, reading: word.reading && word.reading !== word.term ? word.reading : null,
      typed: deck.exam === "jlpt" ? [word.reading, ...(word.answers ?? [])] : [word.reading] };
  }));
}
