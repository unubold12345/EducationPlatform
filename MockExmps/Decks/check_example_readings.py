"""Flag JLPT example sentences whose drafted reading differs a lot from pykakasi's reading of the sentence.

    uv run --with pykakasi python MockExmps/Decks/check_example_readings.py

pykakasi misreads some kanji, so small differences are expected; a low similarity usually means the drafted reading
skipped or replaced a word (2026-11-18 found ガスの火 read as がすのがす). For a person to check, never applied.
"""
import json
from difflib import SequenceMatcher
from pathlib import Path

import pykakasi

HERE = Path(__file__).resolve().parent
kks = pykakasi.kakasi()
hira = lambda text: "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text)
strip = lambda text: "".join(c for c in hira(text) if "ぁ" <= c <= "ゖ" or c == "ー")
flagged = 0
for deck in ["jlpt-n5", "jlpt-n4"]:
    for lesson_id, lesson in sorted(json.loads((HERE / f"{deck}.json").read_text(encoding="utf-8"))["lessons"].items()):
        for word in lesson["words"]:
            guess = strip("".join(item["hira"] for item in kks.convert(word["example"])))
            given = strip(word["exampleReading"])
            ratio = SequenceMatcher(None, guess, given).ratio()
            if ratio < 0.8:
                flagged += 1
                print(f"{deck}/{lesson_id} {ratio:.2f} {word['example']} | draft {word['exampleReading']} | pykakasi {guess}")
print(flagged, "flagged")
