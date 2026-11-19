"""Pinyin workshop data (Workshop → HSK → Pinyin, 2026-11-18).

    uv run --with pypinyin python MockExmps/Decks/build_pinyin.py           # build from the draft
    uv run --with pypinyin python MockExmps/Decks/build_pinyin.py --draft   # also ask DeepSeek for missing example characters

Writes MockExmps/Decks/pinyin.json (offline, reviewable); scripts/build-language-decks.mjs publishes it.
- The chart: initials × finals in four groups, spelled with the y/w and ü rules; a cell exists only for a real syllable
  (one that some character is read as, per pypinyin).
- One common example character per syllable, so a cell can be played aloud (browser speech reads characters, not
  pinyin). Drafted by DeepSeek, kept only when pypinyin confirms the character has that reading.
- Tone-drill words: every HSK 1/2 deck word split into syllables with tones (5 = neutral), from the deck's pinyin.
"""
import json
import os
import sys
import unicodedata
import urllib.request
from pathlib import Path

from pypinyin import Style, pinyin

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE / "pinyin.json"

INITIALS = ["", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s"]
GROUPS = {
    "a": ["a", "o", "e", "-i", "er", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong"],
    "i": ["i", "ia", "ie", "iao", "iu", "ian", "in", "iang", "ing", "iong"],
    "u": ["u", "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng"],
    "ü": ["ü", "üe", "üan", "ün"],
}
ZERO = {"i": "yi", "ia": "ya", "ie": "ye", "iao": "yao", "iu": "you", "ian": "yan", "in": "yin", "iang": "yang", "ing": "ying", "iong": "yong",
        "u": "wu", "ua": "wa", "uo": "wo", "uai": "wai", "ui": "wei", "uan": "wan", "un": "wen", "uang": "wang", "ueng": "weng",
        "ü": "yu", "üe": "yue", "üan": "yuan", "ün": "yun"}
# Real but rare readings no beginner chart shows (no common character): left out of the chart.
RARE = {"fiao", "rua", "nun", "len", "tei", "eng", "ei", "zhei"}
TONE_MARKS = {"̄": 1, "́": 2, "̌": 3, "̀": 4}


def spell(initial: str, final: str) -> str | None:
    if final == "-i":
        return initial + "i" if initial in {"zh", "ch", "sh", "r", "z", "c", "s"} else None
    if final == "ueng":
        return "weng" if initial == "" else None
    if initial == "":
        return ZERO.get(final, final)
    # zh ch sh r z c s take only the "-i" final; j q x take ü (written u), never u itself.
    if final.startswith("i") and initial in {"zh", "ch", "sh", "r", "z", "c", "s"}:
        return None
    if final.startswith("u") and initial in {"j", "q", "x"}:
        return None
    if final.startswith("ü") and initial in {"j", "q", "x"}:
        return initial + "u" + final[1:]
    return initial + final


def split_tone(syllable: str) -> tuple[str, int]:
    """'lǚ' → ('lü', 3); a syllable without a mark is the neutral tone, 5."""
    decomposed = unicodedata.normalize("NFD", syllable)
    tone = next((TONE_MARKS[c] for c in decomposed if c in TONE_MARKS), 5)
    base = unicodedata.normalize("NFC", "".join(c for c in decomposed if c not in TONE_MARKS))
    return base, tone


def readings(char: str) -> set[str]:
    return {unicodedata.normalize("NFC", r) for r in pinyin(char, style=Style.TONE, heteronym=True)[0]}


# Every syllable some character is read as.
valid: set[str] = set()
for code in range(0x4E00, 0x9FA6):
    for reading in readings(chr(code)):
        if reading and reading.isalpha():
            valid.add(split_tone(reading)[0])
in_chart = valid - RARE

chart = {group: [{"initial": initial or "∅", "cells": [(s if (s := spell(initial, final)) in in_chart else None) for final in finals]} for initial in INITIALS]
         for group, finals in GROUPS.items()}
for group in chart:
    chart[group] = [row for row in chart[group] if any(row["cells"])]
syllables = sorted({cell for rows in chart.values() for row in rows for cell in row["cells"] if cell})

draft = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
examples: dict = draft.get("examples", {})


def deepseek(batch: list[str]) -> dict:
    key = next((line.split("=", 1)[1].strip().strip('"') for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines() if line.startswith("DEEPSEEK_API_KEY=")), "")
    body = {
        "model": os.environ.get("DEEPSEEK_MODEL", "deepseek-flash"), "thinking": {"type": "disabled"}, "max_tokens": 8000,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "For each Mandarin pinyin syllable (no tone), give ONE very common simplified character read as that syllable, "
             "its pinyin with the tone mark, and a short Mongolian (Cyrillic) meaning. Prefer characters a beginner knows. "
             'Return ONE JSON object: {"syllable":{"char":"…","pinyin":"…","meaning":"…"}, …} with every syllable given.'},
            {"role": "user", "content": " ".join(batch)},
        ],
    }
    # Logged in the AI usage log (scripts/lib/ai_call.py), like every paid call.
    sys.path.insert(0, str(ROOT / "scripts" / "lib"))
    from ai_call import ai_post_json
    data = ai_post_json("deepseek", "https://api.deepseek.com/chat/completions", body, key, source="script:build_pinyin.py")
    return json.loads(data["choices"][0]["message"]["content"])


if "--draft" in sys.argv:
    for attempt in range(3):
        missing = [s for s in syllables if s not in examples]
        if not missing:
            break
        for start in range(0, len(missing), 80):
            batch = missing[start:start + 80]
            for syllable, entry in deepseek(batch).items():
                syllable = unicodedata.normalize("NFC", syllable)
                if syllable not in batch or not isinstance(entry, dict):
                    continue
                char, toned = str(entry.get("char", "")), unicodedata.normalize("NFC", str(entry.get("pinyin", "")))
                if len(char) == 1 and toned in readings(char) and split_tone(toned)[0] == syllable:
                    examples[syllable] = {"char": char, "pinyin": toned, "meaning": str(entry.get("meaning", "")).strip()}
            print(f"attempt {attempt + 1}: {len(examples)}/{len(syllables)} syllables have a checked example", file=sys.stderr)

# Fallback: any character pypinyin reads as the syllable (rare syllables only; no meaning).
for syllable in syllables:
    if syllable not in examples:
        for code in range(0x4E00, 0x9FA6):
            hit = next((r for r in readings(chr(code)) if split_tone(r)[0] == syllable), None)
            if hit:
                examples[syllable] = {"char": chr(code), "pinyin": hit, "meaning": ""}
                break


def split_word(term: str, toned: str) -> list[tuple[str, int]] | None:
    text = unicodedata.normalize("NFC", toned.lower()).replace(" ", "").replace("'", "").replace("-", "")
    count = len(term)

    # Pinyin writes an apostrophe before a later syllable that starts with a, e or o, so a split without one is tried
    # first: kěnéng is kě·néng, not kěn·éng (2026-11-19). Words whose reading lost the apostrophe (nǚér) fall back.
    def walk(rest: str, left: int, strict: bool, first: bool = True):
        if not rest:
            return [] if left == 0 else None
        if left == 0:
            return None
        for size in range(min(6, len(rest)), 0, -1):
            piece = rest[:size]
            base, tone = split_tone(piece)
            if base in valid and not (strict and not first and base[0] in "aeo"):
                tail = walk(rest[size:], left - 1, strict, False)
                if tail is not None:
                    return [(base, tone)] + tail
        return None
    return walk(text, count, True) or walk(text, count, False)


drill = []
for deck in ["hsk-1", "hsk-2"]:
    data = json.loads((ROOT / "assets" / "language-decks" / f"{deck}.json").read_text(encoding="utf-8"))
    for lesson in data["lessons"]:
        for word in lesson["words"]:
            parts = split_word(word["term"], word["reading"])
            if not parts and "儿" in word["term"] and word["reading"].endswith("r"):
                continue  # erhua (哪儿 nǎr): one written syllable fewer than characters
            if parts:
                drill.append({"id": word["id"], "deck": deck, "term": word["term"], "meaning": word["meaning"], "syllables": [{"base": b, "tone": t} for b, t in parts]})
            else:
                print(f"skip {word['term']} {word['reading']}", file=sys.stderr)

OUT.write_text(json.dumps({"note": "Pinyin chart, example characters (DeepSeek, checked against pypinyin) and tone-drill words.",
                           "groups": {g: GROUPS[g] for g in GROUPS}, "chart": chart, "examples": {s: examples[s] for s in syllables}, "drill": drill},
                          ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"{len(syllables)} syllables in the chart, {sum(1 for s in syllables if examples[s]['meaning'])} with a checked common example; {len(drill)} drill words", file=sys.stderr)
