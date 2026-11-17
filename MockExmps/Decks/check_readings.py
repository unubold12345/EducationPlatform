"""Cross-check the drafted deck readings against independent dictionaries.

    uv run --with pykakasi --with pypinyin python MockExmps/Decks/check_readings.py

JLPT: the hiragana reading of each term vs pykakasi. HSK: the pinyin of each term vs pypinyin (tone marks; spacing
and case ignored). A mismatch is not always an error (pykakasi picks one reading of a kanji; 一/不 tone sandhi), so the
list is for a person to look at, never applied automatically. Also flags examples that do not contain the term.
"""
import json
import sys
import unicodedata
from pathlib import Path

import pykakasi
from pypinyin import Style, pinyin

HERE = Path(__file__).resolve().parent
kks = pykakasi.kakasi()


def kata_to_hira(text: str) -> str:
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text)


def norm_pinyin(text: str) -> str:
    return unicodedata.normalize("NFC", text).lower().replace(" ", "").replace("'", "").replace("·", "")


def plain(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if not unicodedata.combining(c))


issues = 0
for deck in ["jlpt-n5", "jlpt-n4", "hsk-1", "hsk-2"]:
    data = json.loads((HERE / f"{deck}.json").read_text(encoding="utf-8"))
    for lesson_id, lesson in sorted(data["lessons"].items()):
        for word in lesson["words"]:
            term, reading = word["term"], word["reading"]
            if deck.startswith("jlpt"):
                expected = kata_to_hira("".join(item["hira"] for item in kks.convert(term)))
                given = kata_to_hira(reading)
                if expected != given:
                    issues += 1
                    print(f"{deck}/{lesson_id} READING {term}: draft {reading} | pykakasi {expected}")
            else:
                expected = norm_pinyin("".join(s[0] for s in pinyin(term, style=Style.TONE)))
                given = norm_pinyin(reading)
                if expected != given:
                    kind = "TONE" if plain(expected) == plain(given) else "READING"
                    issues += 1
                    print(f"{deck}/{lesson_id} {kind} {term}: draft {reading} | pypinyin {expected}")
            if term not in word["example"]:
                print(f"{deck}/{lesson_id} EXAMPLE-NO-TERM {term}: {word['example']}")
print(f"{issues} reading differences", file=sys.stderr)
