// Pinyin tone marks and the tone drill's answer choices (Workshop → HSK → Pinyin). Pure and client-safe.

const MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à"], e: ["ē", "é", "ě", "è"], i: ["ī", "í", "ǐ", "ì"], o: ["ō", "ó", "ǒ", "ò"], u: ["ū", "ú", "ǔ", "ù"], ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

/** The syllable with its tone mark: on a or e, else on the o of "ou", else on the last vowel. Tone 5 (neutral) has none. */
export function markTone(base: string, tone: number): string {
  if (tone < 1 || tone > 4) return base;
  const at = base.includes("a") ? base.indexOf("a") : base.includes("e") ? base.indexOf("e") : base.includes("ou") ? base.indexOf("o")
    : Math.max(...["i", "o", "u", "ü"].map(vowel => base.lastIndexOf(vowel)));
  if (at < 0) return base;
  return base.slice(0, at) + MARKS[base[at]][tone - 1] + base.slice(at + 1);
}

export type Syllable = { base: string; tone: number };
export const spellTones = (syllables: readonly Syllable[]) => syllables.map(item => markTone(item.base, item.tone)).join(" ");

/**
 * Four choices for "which tones did you hear": the right one and three that change one syllable's tone (two syllables
 * when a short word has too few one-change variants). Neutral syllables stay neutral, as a learner cannot hear a mark there.
 */
export function toneChoices(syllables: readonly Syllable[], random: () => number = Math.random): { options: string[]; answer: number } {
  const right = spellTones(syllables);
  const variants = new Set<string>();
  const change = (count: number) => {
    for (let guard = 0; guard < 60 && variants.size < 3; guard++) {
      const next = syllables.map(item => ({ ...item }));
      const toned = next.map((item, index) => item.tone === 5 ? -1 : index).filter(index => index >= 0);
      if (!toned.length) return;
      for (let step = 0; step < count; step++) {
        const index = toned[Math.floor(random() * toned.length)];
        const others = [1, 2, 3, 4].filter(tone => tone !== syllables[index].tone);
        next[index].tone = others[Math.floor(random() * others.length)];
      }
      const spelled = spellTones(next);
      if (spelled !== right) variants.add(spelled);
    }
  };
  change(1);
  if (variants.size < 3) change(2);
  const options = [right, ...[...variants].slice(0, 3)];
  for (let index = options.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [options[index], options[swap]] = [options[swap], options[index]];
  }
  return { options, answer: options.indexOf(right) };
}
