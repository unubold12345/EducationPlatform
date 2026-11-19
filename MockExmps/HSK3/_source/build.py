"""Build the offline HSK 3.0 pack (HSK 1 and HSK 2, six forms each): compose, validate, draw or copy pictures, mock.json.

Usage (from the repository root):

    python -B MockExmps/HSK3/_source/build.py

No third-party dependencies. Forms 01-03 read the HSK 2.0 packs (MockExmps/HSK, MockExmps/HSK2) for the items HSK 3.0
keeps and content.py for what it adds; forms 04-06 are wholly new (forms456.py), their pictures drawn by scenes3.py.
scripts/language-decks/lists.mjs gives the HSK 3.0 word lists. Writes MockExmps/HSK3/<slug>/mock.json and images/,
MockExmps/HSK3/examples/, validation-report.json and manifest.json. The site copies are made afterwards by
scripts/build-hsk-mocks.mjs and the audio by scripts/generate-hsk3-audio.py.
"""

from __future__ import annotations

import copy
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import content as C  # noqa: E402
import forms456 as N  # noqa: E402
import scenes3  # noqa: E402

PACK = HERE.parent
ROOT = PACK.parents[1]
OLD = {1: ROOT / "MockExmps" / "HSK", 2: ROOT / "MockExmps" / "HSK2"}
DATE = "2026-11-19"
CJK = re.compile(r"[㐀-鿿]")
TONE = re.compile(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]")

# ---------------------------------------------------------------------------------------------------------------
# Words: the HSK 3.0 lists of the word decks, plus proper names and the few tokens a paper prints that the list
# implies (a measure word inside a listed word, the question marker of the recording).
# ---------------------------------------------------------------------------------------------------------------
LISTS = (ROOT / "scripts" / "language-decks" / "lists.mjs").read_text(encoding="utf-8")


def deck_terms(deck: str) -> list[str]:
    block = re.search(r'id: "%s".*?lessons: \[(.*?)\n    \],' % deck, LISTS, re.S).group(1)
    return [w for _, words in re.findall(r'\["([^"]+)", "([^"]+)"\]', block) for w in words.split()]


HSK1, HSK2 = deck_terms("hsk-1"), deck_terms("hsk-2")
PROPER = ["王月", "李月", "小王", "小李", "小红", "小明", "王", "李", "北京"]
# Tokens HSK 3.0 levels 1-2 imply without listing them alone: 杯 (杯子), the plural/aspect endings and verb results
# every level-1 text prints, and parts of listed compounds used on their own in reused 2.0 texts.
EXTRA = {1: ["杯", "没", "里边", "上边", "下边", "前边", "后边"], 2: ["杯", "没", "白", "红", "黑", "里边", "上边", "下边", "前边", "后边"]}
ALLOWED = {
    1: sorted(set(HSK1 + PROPER + EXTRA[1]), key=len, reverse=True),
    2: sorted(set(HSK1 + HSK2 + PROPER + EXTRA[2]), key=len, reverse=True),
}
TEXT_KEYS = {"text", "sentence", "question", "statement", "word", "phrase"}


def segment(text: str, level: int) -> list[str]:
    out, i = [], 0
    while i < len(text):
        if not CJK.match(text[i]):
            i += 1
            continue
        for word in ALLOWED[level]:
            if text.startswith(word, i):
                out.append(word)
                i += len(word)
                break
        else:
            out.append("?" + text[i])
            i += 1
    return out


# ---------------------------------------------------------------------------------------------------------------
# Part pages: Mongolian titles and notes shown on the site, the paper's Chinese task line, and the recording's.
# ---------------------------------------------------------------------------------------------------------------
PARTS = {
    1: {
        "L1": dict(id="hsk-l-1", layout="L2", title="第一部分 · Үг ба зураг", domain="听力一 · Үг, зураг", task="听录音，选择对应的图片。",
                   note="Нэг үгийг хоёр удаа сонсоно. Гурван зургаас тохирохыг сонгоно.", prompt="Сонссон үгэнд тохирох зургийг сонгоно уу.",
                   audio=("听录音，选择对应的图片。", "Tīng lùyīn, xuǎnzé duìyìng de túpiàn.")),
        "L2": dict(id="hsk-l-2", layout="L4", title="第二部分 · Үг сонгох", domain="听力二 · Өгүүлбэр, үг", task="听录音，选择正确的答案。",
                   note="Өгүүлбэрийг хоёр удаа сонсоно. Өгүүлбэрт хэлсэн үгийг гурван сонголтоос сонгоно.", prompt="Сонссон өгүүлбэрт хэлсэн үгийг сонгоно уу.",
                   audio=("听录音，选择正确的答案。", "Tīng lùyīn, xuǎnzé zhèngquè de dá'àn.")),
        "L3": dict(id="hsk-l-3", layout="L3", title="第三部分 · Яриа ба зураг", domain="听力三 · Яриа, зураг", task="听对话，选择相应的图片。",
                   note="Хоёр хүний богино яриаг хоёр удаа сонсоно. Зургаан зургаас тохирохыг сонгоно; нэг зураг илүү.", prompt="Сонссон яриад тохирох зургийг сонгоно уу.",
                   audio=("听对话，选择相应的图片。", "Tīng duìhuà, xuǎnzé xiāngyìng de túpiàn.")),
        "L4": dict(id="hsk-l-4", layout="L4", title="第四部分 · Хариулт сонгох", domain="听力四 · Богино асуулт", task="听录音，选择答案。",
                   note="Өгүүлбэр ба асуултыг хоёр удаа сонсоно. Асуулт бичигдээгүй; гурван хариултаас зөвийг сонгоно.", prompt="Сонссон асуултын хариултыг сонгоно уу.",
                   audio=("听录音，选择答案。", "Tīng lùyīn, xuǎnzé dá'àn.")),
        "R1": dict(id="hsk-r-1", layout="R2", title="第一部分 · Өгүүлбэр ба зураг", domain="阅读一 · Өгүүлбэр, зураг", task="选择相应的图片。",
                   note="Өгүүлбэр бүрт тохирох зургийг A–F-ээс сонгоно; нэг зураг илүү."),
        "R2": dict(id="hsk-r-2", layout="R3", title="第二部分 · Асуулт ба хариулт", domain="阅读二 · Асуулт, хариулт", task="选择相应的回答。",
                   note="Асуулт бүрт тохирох хариултыг A–F-ээс сонгоно; нэг хариулт илүү."),
        "R3": dict(id="hsk-r-3", layout="R4", title="第三部分 · Хоосон зай нөхөх", domain="阅读三 · Үг нөхөх", task="选词填空。",
                   note="Хоосон зайд тохирох үгийг A–F-ээс сонгоно; нэг үг илүү."),
        "R4": dict(id="hsk-r-4", layout="RQ", title="第四部分 · Текст ба асуулт", domain="阅读四 · Текст, асуулт", task="阅读短文，选择正确的答案。",
                   note="Богино текстийг уншаад ★ асуултын зөв хариултыг гурван сонголтоос сонгоно."),
    },
    2: {
        "L1": dict(id="hsk-l-1", layout="L2", title="第一部分 · Өгүүлбэр ба зураг", domain="听力一 · Өгүүлбэр, зураг", task="听录音，选择对应的图片。",
                   note="Өгүүлбэрийг хоёр удаа сонсоно. Гурван зургаас тохирохыг сонгоно.", prompt="Сонссон өгүүлбэрт тохирох зургийг сонгоно уу.",
                   audio=("听录音，选择对应的图片。", "Tīng lùyīn, xuǎnzé duìyìng de túpiàn.")),
        "L2a": dict(id="hsk-l-2a", layout="L3", title="第二部分 · Яриа ба зураг (6–10)", domain="听力二 · Яриа, зураг", task="听对话，选择相应的图片。",
                    note="Хоёр хүний яриаг хоёр удаа сонсоно. Тохирох зургийг сонгоно; нэг зураг жишээнд ашиглагдсан.", prompt="Сонссон яриад тохирох зургийг сонгоно уу.",
                    audio=("听对话，选择相应的图片。", "Tīng duìhuà, xuǎnzé xiāngyìng de túpiàn.")),
        "L2b": dict(id="hsk-l-2b", layout="L3", title="第二部分 · Яриа ба зураг (11–15)", domain="听力二 · Яриа, зураг", task="听对话，选择相应的图片。",
                    note="Хоёр хүний яриаг хоёр удаа сонсоно. Таван зураг тус бүр нэг удаа таарна.", prompt="Сонссон яриад тохирох зургийг сонгоно уу."),
        "L3": dict(id="hsk-l-3", layout="L4", title="第三部分 · Яриа ба асуулт", domain="听力三 · Яриа, асуулт", task="听对话，选择答案。",
                   note="Яриа ба асуултыг хоёр удаа сонсоно. Асуулт бичигдээгүй; гурван хариултаас зөвийг сонгоно.", prompt="Сонссон асуултын хариултыг сонгоно уу.",
                   audio=("听对话，选择答案。", "Tīng duìhuà, xuǎnzé dá'àn.")),
        "R1": dict(id="hsk-r-1", layout="R2", title="第一部分 · Өгүүлбэр ба зураг", domain="阅读一 · Өгүүлбэр, зураг", task="选择相应的图片。",
                   note="Өгүүлбэр бүрт тохирох зургийг сонгоно; нэг зураг жишээнд ашиглагдсан."),
        "R2": dict(id="hsk-r-2", layout="R4", title="第二部分 · Хоосон зай нөхөх", domain="阅读二 · Үг нөхөх", task="选词填空。",
                   note="Хоосон зайд тохирох үгийг сонгоно; нэг үг жишээнд ашиглагдсан."),
        "R3a": dict(id="hsk-r-3a", layout="R3", title="第三部分 · Өгүүлбэр холбох (36–40)", domain="阅读三 · Өгүүлбэр холбох", task="选择相应的句子。",
                    note="Өгүүлбэр бүрт тохирох өгүүлбэрийг A–F-ээс сонгоно; нэг нь жишээнд ашиглагдсан."),
        "R3b": dict(id="hsk-r-3b", layout="R3", title="第三部分 · Өгүүлбэр холбох (41–45)", domain="阅读三 · Өгүүлбэр холбох", task="选择相应的句子。",
                    note="Өгүүлбэр бүрт тохирох өгүүлбэрийг A–E-ээс сонгоно; тус бүр нэг удаа таарна."),
        "R4": dict(id="hsk-r-4", layout="RQ", title="第四部分 · Текст ба асуулт", domain="阅读四 · Текст, асуулт", task="阅读短文，选择正确的答案。",
                   note="Текстийг уншаад ★ асуултын зөв хариултыг гурван сонголтоос сонгоно."),
        "W1": dict(id="hsk-w-1", layout="W1", title="第一部分 · Ханзны бүрдэл", domain="书写一 · Бүрдэл сонгох", task="选择正确的部件，组成汉字。",
                   note="Үгийн нэг ханзны нэг хэсэг дутуу. Дутуу хэсгийг A–F-ээс сонгоно; нэг нь илүү."),
        "W2": dict(id="hsk-w-2", layout="W2", title="第二部分 · Ханз бичих", domain="书写二 · Ханз бичих", task="看拼音，写汉字。",
                   note="Хоосон зайд pinyin-д тохирох ханзыг бичнэ (хятад гарны оролт)."),
    },
}

# ---------------------------------------------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------------------------------------------


def fix_text(obj, problems: list[str], where: str, level: int):
    """Rewrite lines and swap words HSK 3.0 dropped (content.OVERRIDES, TEXT_FIXES) in reused texts and their pinyin."""
    if isinstance(obj, list):
        for index, value in enumerate(obj):
            fix_text(value, problems, f"{where}[{index}]", level)
        return
    if not isinstance(obj, dict):
        return
    for text_key, pinyin_key in (("sentence", "pinyin"), ("text", "pinyin"), ("question", "questionPinyin"), ("statement", "statementPinyin"), ("phrase", "pinyin"), ("word", "pinyin")):
        if text_key in obj and isinstance(obj[text_key], str):
            for old, new, new_pinyin in C.OVERRIDES[level]:
                if obj[text_key] == old:
                    obj[text_key], obj[pinyin_key] = new, new_pinyin
            for old, new, old_pinyins, new_pinyin in C.TEXT_FIXES[level]:
                if old in obj[text_key]:
                    obj[text_key] = obj[text_key].replace(old, new)
                    pinyin = obj.get(pinyin_key, "")
                    for variant in old_pinyins:
                        for form in (variant, variant[0].upper() + variant[1:]):
                            if form in pinyin:
                                pinyin = pinyin.replace(form, new_pinyin if form == variant else new_pinyin[0].upper() + new_pinyin[1:])
                                break
                        else:
                            continue
                        break
                    else:
                        problems.append(f"{where}: {old} replaced but its pinyin not found in “{obj.get(pinyin_key)}”")
                    obj[pinyin_key] = pinyin
    for key, value in obj.items():
        if isinstance(value, (dict, list)):
            fix_text(value, problems, f"{where}/{key}", level)


class Pictures:
    """Copies the reused 2.0 pictures into the pack; returns the reference written into mock.json."""

    def __init__(self, level: int, slug: str):
        self.level, self.slug = level, slug
        self.folder = PACK / slug / "images"
        self.folder.mkdir(parents=True, exist_ok=True)

    def __call__(self, entry: dict, label: str | None = None, source_form: Path | None = None) -> dict:
        image = entry["image"]
        name = image.split("/")[-1]
        if image.startswith("../examples/"):
            source = OLD[self.level if not entry.get("_hsk1") else 1] / "examples" / name
            target_name = f"hsk{1 if entry.get('_hsk1') else self.level}-{name}"
            target = PACK / "examples" / target_name
            target.parent.mkdir(parents=True, exist_ok=True)
            ref = f"../examples/{target_name}"
        else:
            source = source_form / image
            target = self.folder / name
            ref = f"images/{name}"
        if not target.exists() or target.read_bytes() != source.read_bytes():
            shutil.copyfile(source, target)
        return {**({"label": label} if label else {}), "image": ref, "alt": entry["alt"]}


def line(text: str, pinyin: str, label: str | None = None) -> dict:
    return {**({"label": label} if label else {}), "text": text, "pinyin": pinyin}


def choice_lines(options: list[dict]) -> list[dict]:
    return [line(option["text"], option["pinyin"], option["label"]) for option in options]


def turn(text: str, pinyin: str, role: str, speaker: str | None = None) -> dict:
    return {**({"speaker": speaker} if speaker else {}), "text": text, "pinyin": pinyin, "role": role}


def dialogue_turns(dialogue: list[dict]) -> list[dict]:
    return [turn(t["text"], t["pinyin"], "woman" if t["speaker"] == "女" else "man", t["speaker"]) for t in dialogue]


def question_turn(question: str, pinyin: str) -> dict:
    return turn("问：" + question, "Wèn: " + pinyin, "narrator")


# HSK 1 forms whose Listening 1 starts with the man: in form 01 the woman's 米饭 was heard as 逆算, and every word
# there scored better in the other voice (forced-alignment check, 2026-11-19).
OLD_L1_MAN_FIRST = {1}


def alternate(index: int) -> str:
    return "woman" if index % 2 == 0 else "man"


def make_set(level: int, key: str, items: list[dict], example: dict | None = None, **material) -> dict:
    meta = PARTS[level][key]
    return {"key": key, **meta, **{k: v for k, v in material.items() if v is not None}, **({"example": example} if example else {}), "items": items}


def renumber(item: dict, shift: int) -> dict:
    out = copy.deepcopy(item)
    out["n"] = item["n"] + shift
    return out


def labels(options: list[dict]) -> list[str]:
    return [option["label"] for option in options]


def text_answer(options: list[dict], answer: str) -> str:
    chosen = next(option for option in options if option["label"] == answer)
    return f"{answer} · {chosen['text']} ({chosen['pinyin']})"


# ---------------------------------------------------------------------------------------------------------------
# HSK 1
# ---------------------------------------------------------------------------------------------------------------


def compose_hsk1(number: int, problems: list[str]) -> dict:
    form_dir = OLD[1] / f"mock-{number:02}"
    old = json.loads((form_dir / "mock.json").read_text(encoding="utf-8"))
    fix_text(old, problems, f"hsk1-{number}", 1)
    slug = f"hsk1-mock-{number:02}"
    pic = Pictures(1, slug)
    L, R, ex = old["listening"], old["reading"], old["examples"]
    pics = lambda options: [pic(o, o["label"], form_dir) for o in options]  # noqa: E731

    # Listening 1: word -> three pictures (the 2.0 Listening 2 picture sets).
    l1 = []
    for index, (old_n, word, pinyin, answer) in enumerate(C.HSK1_L1[number]):
        source = next(item for item in L["part2"] if item["n"] == old_n)
        if answer not in labels(source["options"]):
            problems.append(f"{slug} L1 {word}: no picture {answer}")
        shown = next(o for o in source["options"] if o["label"] == answer)
        l1.append({"n": index + 1, "options": labels(source["options"]), "answer": answer, "answerDisplay": answer, "pictures": pics(source["options"]),
                   "turns": [turn(word, pinyin, alternate(index + (number in OLD_L1_MAN_FIRST)))], "explanation": f"The word is {word} ({pinyin}); {answer} shows {shown['alt'].lower()}."})
    sample = ex["listening"]["part2"]
    word, pinyin = C.HSK1_L1_EXAMPLE
    l1_example = {"pictures": pics(sample["options"]), "answer": sample["answer"], "turns": [turn(word, pinyin, "woman")]}

    # Listening 2: sentence -> the word it says (three printed words with pinyin).
    l2 = []
    for index, (sentence, pinyin, options, answer, why) in enumerate(C.HSK1_L2[number]):
        l2.append({"n": index + 6, "options": labels(options), "answer": answer, "answerDisplay": text_answer(options, answer), "choices": choice_lines(options),
                   "turns": [turn(sentence, pinyin, alternate(index))], "explanation": why})
    sentence, pinyin, options, answer, _ = C.HSK1_L2_EXAMPLE
    l2_example = {"choices": choice_lines(options), "answer": answer, "turns": [turn(sentence, pinyin, "woman")]}

    # Listening 3 and 4: unchanged from 2.0.
    l3_pictures = pics(L["part3"]["pictures"])
    l3 = [{"n": item["n"], "options": labels(L["part3"]["pictures"]), "answer": item["answer"], "answerDisplay": item["answer"],
           "turns": dialogue_turns(item["dialogue"]), "explanation": item["explanation"]} for item in L["part3"]["items"]]
    sample = ex["listening"]["part3"]
    answer_picture = next(p for p in sample["pictures"] if p["label"] == sample["answer"])
    l3_example = {"pictures": [pic(answer_picture, answer_picture["label"])],
                  "answer": sample["answer"], "turns": dialogue_turns(sample["dialogue"])}
    l4 = []
    for index, item in enumerate(L["part4"]):
        speaker = "woman" if "她" in item["question"] else "man" if "他" in item["question"] else alternate(index)
        l4.append({"n": item["n"], "options": labels(item["options"]), "answer": item["answer"], "answerDisplay": text_answer(item["options"], item["answer"]),
                   "choices": choice_lines(item["options"]), "turns": [turn(item["statement"], item["statementPinyin"], speaker), question_turn(item["question"], item["questionPinyin"])],
                   "explanation": item["explanation"]})
    sample = ex["listening"]["part4"]
    l4_example = {"choices": choice_lines(sample["options"]), "answer": sample["answer"],
                  "turns": [turn(sample["statement"], sample["statementPinyin"], "woman"), question_turn(sample["question"], sample["questionPinyin"])]}

    # Reading 1-3: the 2.0 Reading 2-4, five numbers earlier.
    r1_pictures = pics(R["part2"]["pictures"])
    r1 = [{"n": item["n"] - 5, "options": labels(R["part2"]["pictures"]), "answer": item["answer"], "answerDisplay": item["answer"],
           "line": line(item["sentence"], item["pinyin"]), "explanation": item["explanation"]} for item in R["part2"]["items"]]
    sample = ex["reading"]["part2"]
    answer_picture = next(p for p in sample["pictures"] if p["label"] == sample["answer"])
    r1_example = {"pictures": [pic(answer_picture, answer_picture["label"])],
                  "line": line(sample["sentence"], sample["pinyin"]), "answer": sample["answer"]}

    def bank(part: dict, sample: dict, text_key: str):
        options = part["options"]
        items = [{"n": item["n"] - 5, "options": labels(options), "answer": item["answer"],
                  "answerDisplay": f"{item['answer']} · {next(o for o in options if o['label'] == item['answer'])['text']}",
                  "line": line(item[text_key], item["pinyin"]), "explanation": item["explanation"]} for item in part["items"]]
        chosen = next(o for o in sample["options"] if o["label"] == sample["answer"])
        example = {"line": line(sample[text_key], sample["pinyin"]), "answerLine": line(chosen["text"], chosen["pinyin"], chosen["label"]), "answer": sample["answer"]}
        return choice_lines(options), items, example

    r2_choices, r2, r2_example = bank(R["part3"], ex["reading"]["part3"], "question")
    r3_choices, r3, r3_example = bank(R["part4"], ex["reading"]["part4"], "sentence")

    # Reading 4: short text and a starred question.
    r4 = [{"n": index + 36, "options": labels(options), "answer": answer, "answerDisplay": text_answer(options, answer), "line": line(text, pinyin),
           "statement": line(question, qpinyin), "choices": choice_lines(options), "explanation": why}
          for index, (text, pinyin, question, qpinyin, options, answer, why) in enumerate(C.HSK1_R4[number])]
    text, pinyin, question, qpinyin, options, answer, _ = C.HSK1_R4_EXAMPLE
    r4_example = {"line": line(text, pinyin), "statement": line(question, qpinyin), "choices": choice_lines(options), "answer": answer}

    return {
        "id": slug, "level": 1, "number": number, "title": old["title"], "titlePinyin": old["titlePinyin"], "titleEn": old["titleEn"], "theme": old["theme"],
        "stages": [
            {"id": "hsk-l", "sets": [make_set(1, "L1", l1, l1_example), make_set(1, "L2", l2, l2_example), make_set(1, "L3", l3, l3_example, pictures=l3_pictures), make_set(1, "L4", l4, l4_example)]},
            {"id": "hsk-r", "sets": [make_set(1, "R1", r1, r1_example, pictures=r1_pictures), make_set(1, "R2", r2, r2_example, choices=r2_choices),
                                     make_set(1, "R3", r3, r3_example, choices=r3_choices), make_set(1, "R4", r4, r4_example)]},
        ],
    }


# ---------------------------------------------------------------------------------------------------------------
# HSK 2
# ---------------------------------------------------------------------------------------------------------------


def compose_hsk2(number: int, problems: list[str]) -> dict:
    form_dir = OLD[2] / f"mock-{number:02}"
    old = json.loads((form_dir / "mock.json").read_text(encoding="utf-8"))
    fix_text(old, problems, f"hsk2-{number}", 2)
    slug = f"hsk2-mock-{number:02}"
    pic = Pictures(2, slug)
    L, R, ex = old["listening"], old["reading"], old["examples"]
    pics = lambda options: [pic(o, o["label"], form_dir) for o in options]  # noqa: E731
    by_n = {item["n"]: item for item in L["part1"]}

    # Listening 1: sentence -> three pictures (a √ sentence of 2.0 Listening 1 and two other pictures of the form).
    l1 = []
    for index, ((old_n, sentence, pinyin, wrong), answer) in enumerate(zip(C.HSK2_L1[number], C.HSK2_L1_KEYS[number])):
        source = by_n[old_n]
        if sentence is None and source["answer"] != "√":
            problems.append(f"{slug} L1: 2.0 item {old_n} is not a matching (√) sentence")
        entries = [source] + [by_n[n] for n in wrong]
        order = entries[1:]
        order.insert("ABC".index(answer), source)
        shown = [pic(entry, "ABC"[i], form_dir) for i, entry in enumerate(order)]
        text, reading = sentence or source["sentence"], pinyin or source["pinyin"]
        l1.append({"n": index + 1, "options": ["A", "B", "C"], "answer": answer, "answerDisplay": answer, "pictures": shown,
                   "turns": [turn(text, reading, alternate(index))], "explanation": f"The sentence says {text} ({reading}); {answer} shows {source['alt'][0].lower() + source['alt'][1:]}."})
    sample = ex["listening"]["part1"]
    first = {**sample}
    distractors = [{"image": "../examples/" + name, "alt": alt, "_hsk1": True} for name, alt in zip(C.HSK2_L1_EXAMPLE_DISTRACTORS, ["A computer", "A cat"])]
    l1_example = {"pictures": [pic(first, "A"), pic(distractors[0], "B"), pic(distractors[1], "C")], "answer": "A",
                  "turns": [turn(sample["sentence"], sample["pinyin"], "woman")]}

    # Listening 2: the two 2.0 dialogue sets, five numbers earlier.
    l2_sets = []
    for key, name in (("L2a", "setA"), ("L2b", "setB")):
        group = L["part2"][name]
        shown = pics(group["pictures"])
        items = [{"n": item["n"] - 5, "options": labels(group["pictures"]), "answer": item["answer"], "answerDisplay": item["answer"],
                  "turns": dialogue_turns(item["dialogue"]), "explanation": item["explanation"]} for item in group["items"]]
        example = None
        if group.get("example"):
            answer_picture = next(p for p in shown if p["label"] == group["example"]["answer"])
            example = {"pictures": [answer_picture], "answer": group["example"]["answer"], "turns": dialogue_turns(group["example"]["dialogue"])}
        l2_sets.append(make_set(2, key, items, example, pictures=shown))

    # Listening 3: the 2.0 Listening 3 dialogues and questions, five numbers earlier.
    l3 = [{"n": item["n"] - 5, "options": labels(item["options"]), "answer": item["answer"], "answerDisplay": text_answer(item["options"], item["answer"]),
           "choices": choice_lines(item["options"]), "turns": dialogue_turns(item["dialogue"]) + [question_turn(item["question"], item["questionPinyin"])],
           "explanation": item["explanation"]} for item in L["part3"]]
    sample = ex["listening"]["part3"]
    l3_example = {"choices": choice_lines(sample["options"]), "answer": sample["answer"],
                  "turns": dialogue_turns(sample["dialogue"]) + [question_turn(sample["question"], sample["questionPinyin"])]}

    # Reading 1: sentence -> picture (2.0 Reading 1), ten numbers earlier.
    r1_part = R["part1"]
    r1_pictures = pics(r1_part["pictures"])
    r1 = [{"n": item["n"] - 10, "options": labels(r1_part["pictures"]), "answer": item["answer"], "answerDisplay": item["answer"],
           "line": line(item["sentence"], item["pinyin"]), "explanation": item["explanation"]} for item in r1_part["items"]]
    r1_example = {"pictures": [p for p in r1_pictures if p["label"] == r1_part["example"]["answer"]], "line": line(r1_part["example"]["sentence"], r1_part["example"]["pinyin"]),
                  "answer": r1_part["example"]["answer"]}

    def bank(key: str, part: dict, shift: int):
        options = part["options"]
        items = [{"n": item["n"] + shift, "options": labels(options), "answer": item["answer"],
                  "answerDisplay": f"{item['answer']} · {next(o for o in options if o['label'] == item['answer'])['text']}",
                  "line": line(item["sentence"], item["pinyin"]), "explanation": item["explanation"]} for item in part["items"]]
        example = None
        if part.get("example"):
            chosen = next(o for o in options if o["label"] == part["example"]["answer"])
            example = {"line": line(part["example"]["sentence"], part["example"]["pinyin"]), "answerLine": line(chosen["text"], chosen["pinyin"], chosen["label"]), "answer": chosen["label"]}
        return make_set(2, key, items, example, choices=choice_lines(options))

    # Reading 4: the 2.0 Reading 3 texts with a starred question and three answers.
    texts = {item["n"]: item for item in R["part3"]}
    r4 = []
    for entry in C.HSK2_R4[number]:
        old_n, question, qpinyin, options, answer, why = entry[:6]
        text, pinyin = (entry[6], entry[7]) if len(entry) > 6 else (texts[old_n]["text"], texts[old_n]["pinyin"])
        r4.append({"n": old_n, "options": labels(options), "answer": answer, "answerDisplay": text_answer(options, answer), "line": line(text, pinyin),
                   "statement": line(question, qpinyin), "choices": choice_lines(options), "explanation": why})
    text, pinyin, question, qpinyin, options, answer, _ = C.HSK2_R4_EXAMPLE
    r4_example = {"line": line(text, pinyin), "statement": line(question, qpinyin), "choices": choice_lines(options), "answer": answer}

    # Writing 1: the missing component of one character (a shared bank of six components).
    spec = C.HSK2_W1[number]
    bank_lines = [{"label": "ABCDEF"[i], "text": component, "pinyin": ""} for i, component in enumerate(spec["bank"])]
    letter = {component: "ABCDEF"[i] for i, component in enumerate(spec["bank"])}
    compose = lambda word, pinyin, at, given, gap: {"word": word, "pinyin": pinyin, "at": at, "given": given, "gap": gap}  # noqa: E731
    w1 = [{"n": index + 51, "options": list("ABCDEF"), "answer": letter[component], "answerDisplay": f"{letter[component]} · {component} → {word[at]}",
           "compose": compose(word, pinyin, at, given, gap), "explanation": f"{component} + {given} = {word[at]}, as in {word} ({pinyin})."}
          for index, (word, pinyin, at, given, gap, component) in enumerate(spec["items"])]
    word, pinyin, at, given, gap, component = C.HSK2_W1_EXAMPLE
    w1_example = {"compose": compose(word, pinyin, at, given, gap), "answer": component}

    # Writing 2: write the character whose pinyin is printed in the gap.
    blank = lambda sentence, hint, pinyin: {"before": sentence.split("＿")[0], "after": sentence.split("＿")[1], "hint": hint, "pinyin": pinyin}  # noqa: E731
    w2 = [{"n": index + 56, "kind": "short", "options": [], "answer": answer, "answerDisplay": f"{answer} ({hint})", "blank": blank(sentence, hint, pinyin),
           "explanation": f"{sentence.replace('＿', answer)} ({pinyin})"} for index, (sentence, hint, answer, pinyin) in enumerate(C.HSK2_W2[number])]
    sentence, hint, answer, pinyin = C.HSK2_W2_EXAMPLE
    w2_example = {"blank": blank(sentence, hint, pinyin), "answer": answer}

    return {
        "id": slug, "level": 2, "number": number, "title": old["title"], "titlePinyin": old["titlePinyin"], "titleEn": old["titleEn"], "theme": old["theme"],
        "stages": [
            {"id": "hsk-l", "sets": [make_set(2, "L1", l1, l1_example), *l2_sets, make_set(2, "L3", l3, l3_example)]},
            {"id": "hsk-r", "sets": [make_set(2, "R1", r1, r1_example, pictures=r1_pictures), bank("R2", R["part2"], -10),
                                     bank("R3a", R["part4"]["setA"], -15), bank("R3b", R["part4"]["setB"], -15), make_set(2, "R4", r4, r4_example)]},
            {"id": "hsk-w", "sets": [make_set(2, "W1", w1, w1_example, choices=bank_lines), make_set(2, "W2", w2, w2_example)]},
        ],
    }


# ---------------------------------------------------------------------------------------------------------------
# Forms 04-06 (both levels): every item and picture new (forms456.py, scenes3.py)
# ---------------------------------------------------------------------------------------------------------------
NEW_FORMS = (4, 5, 6)
# In forms 04-06 every six-entry HSK 1 bank gives one entry to its worked example (as on the paper and in HSK 2).
EXAMPLE_NOTES = {
    "L3": "Хоёр хүний богино яриаг хоёр удаа сонсоно. Тохирох зургийг A–F-ээс сонгоно; нэг зураг жишээнд ашиглагдсан.",
    "R1": "Өгүүлбэр бүрт тохирох зургийг A–F-ээс сонгоно; нэг зураг жишээнд ашиглагдсан.",
    "R2": "Асуулт бүрт тохирох хариултыг A–F-ээс сонгоно; нэг хариулт жишээнд ашиглагдсан.",
    "R3": "Хоосон зайд тохирох үгийг A–F-ээс сонгоно; нэг үг жишээнд ашиглагдсан.",
}


class Drawn:
    """Draws a new form's scenes in its own palette (variant = form number) into <slug>/images/, one file per scene.

    Files are named by a hash of the drawing, so a picture's URL never names what it shows (the answer)."""

    def __init__(self, slug: str, variant: int):
        self.folder = PACK / slug / "images"
        if self.folder.exists():
            shutil.rmtree(self.folder)
        self.folder.mkdir(parents=True)
        self.variant = variant

    def __call__(self, scene: str, alt: str, label: str | None = None) -> dict:
        svg = scenes3.render(scene, self.variant)
        name = "p-" + hashlib.sha256(svg.encode("utf-8")).hexdigest()[:12] + ".svg"
        path = self.folder / name
        if not path.exists():
            path.write_text(svg, encoding="utf-8", newline="\n")
        return {**({"label": label} if label else {}), "image": f"images/{name}", "alt": alt}

    def bank(self, entries: list[tuple[str, str]]) -> list[dict]:
        return [self(scene, alt, "ABCDEF"[i]) for i, (scene, alt) in enumerate(entries)]


def new_turns(dialogue: list[tuple[str, str, str]]) -> list[dict]:
    return [turn(text, pinyin, "woman" if speaker == "女" else "man", speaker) for speaker, text, pinyin in dialogue]


def shared_examples(form: dict) -> dict:
    """The worked examples of form 01 by part key; forms 04-06 repeat those that do not use a bank of their own."""
    return {s["key"]: copy.deepcopy(s.get("example")) for stage in form["stages"] for s in stage["sets"]}


def picture_items(pictures: list[dict], entries: list[tuple], first: int, lead: str) -> list[dict]:
    """Items answered from a picture bank: (dialogue or sentence, …, answer, why)."""
    out = []
    for index, entry in enumerate(entries):
        answer, why = entry[-2], entry[-1]
        item = {"n": first + index, "options": labels(pictures), "answer": answer, "answerDisplay": answer, "explanation": why}
        if lead == "turns":
            item["turns"] = new_turns(entry[0])
        else:
            item["line"] = line(entry[0], entry[1])
        out.append(item)
    return out


def text_bank(part: dict, first: int) -> tuple[list[dict], list[dict], dict | None]:
    """A bank of six (or five) printed lines, its items and its worked example (which takes one line of the bank)."""
    options = part["choices"]
    items = [{"n": first + index, "options": labels(options), "answer": answer,
              "answerDisplay": f"{answer} · {next(o for o in options if o['label'] == answer)['text']}",
              "line": line(text, pinyin), "explanation": why} for index, (text, pinyin, answer, why) in enumerate(part["items"])]
    example = None
    if part.get("example"):
        text, pinyin, answer = part["example"]
        chosen = next(o for o in options if o["label"] == answer)
        example = {"line": line(text, pinyin), "answerLine": line(chosen["text"], chosen["pinyin"], chosen["label"]), "answer": answer}
    return choice_lines(options), items, example


def starred(entries: list[tuple], first: int) -> list[dict]:
    """Reading 4: a text, a ★ question and three answers."""
    return [{"n": first + index, "options": labels(options), "answer": answer, "answerDisplay": text_answer(options, answer), "line": line(text, pinyin),
             "statement": line(question, qpinyin), "choices": choice_lines(options), "explanation": why}
            for index, (text, pinyin, question, qpinyin, options, answer, why) in enumerate(entries)]


def compose_new_hsk1(number: int, first_form: dict) -> dict:
    spec, slug = N.HSK1[number], f"hsk1-mock-{number:02}"
    draw, ex = Drawn(slug, number), shared_examples(first_form)

    l1 = []
    for index, (word, pinyin, pictures, answer) in enumerate(spec["L1"]):
        shown = draw.bank(pictures)
        alt = next(p["alt"] for p in shown if p["label"] == answer)
        l1.append({"n": index + 1, "options": labels(shown), "answer": answer, "answerDisplay": answer, "pictures": shown,
                   "turns": [turn(word, pinyin, alternate(index + spec.get("L1StartsWithMan", False)))], "explanation": f"The word is {word} ({pinyin}); {answer} shows {alt[0].lower() + alt[1:]}."})
    l2 = [{"n": index + 6, "options": labels(options), "answer": answer, "answerDisplay": text_answer(options, answer), "choices": choice_lines(options),
           "turns": [turn(sentence, pinyin, alternate(index))], "explanation": why} for index, (sentence, pinyin, options, answer, why) in enumerate(spec["L2"])]

    l3_pictures = draw.bank(spec["L3"]["pictures"])
    l3 = picture_items(l3_pictures, spec["L3"]["items"], 11, "turns")
    dialogue, answer = spec["L3"]["example"]
    l3_example = {"pictures": [p for p in l3_pictures if p["label"] == answer], "answer": answer, "turns": new_turns(dialogue)}

    l4 = []
    for index, (statement, spinyin, question, qpinyin, options, answer, why) in enumerate(spec["L4"]):
        speaker = "woman" if "她" in question else "man" if "他" in question else alternate(index)
        l4.append({"n": index + 16, "options": labels(options), "answer": answer, "answerDisplay": text_answer(options, answer), "choices": choice_lines(options),
                   "turns": [turn(statement, spinyin, speaker), question_turn(question, qpinyin)], "explanation": why})

    r1_pictures = draw.bank(spec["R1"]["pictures"])
    r1 = picture_items(r1_pictures, spec["R1"]["items"], 21, "line")
    sentence, pinyin, answer = spec["R1"]["example"]
    r1_example = {"pictures": [p for p in r1_pictures if p["label"] == answer], "line": line(sentence, pinyin), "answer": answer}
    r2_choices, r2, r2_example = text_bank(spec["R2"], 26)
    r3_choices, r3, r3_example = text_bank(spec["R3"], 31)

    return {
        "id": slug, "level": 1, "number": number, "title": spec["title"], "titlePinyin": spec["titlePinyin"], "titleEn": spec["titleEn"], "theme": spec["theme"],
        "stages": [
            {"id": "hsk-l", "sets": [make_set(1, "L1", l1, ex["L1"]), make_set(1, "L2", l2, ex["L2"]),
                                     make_set(1, "L3", l3, l3_example, pictures=l3_pictures, note=EXAMPLE_NOTES["L3"]), make_set(1, "L4", l4, ex["L4"])]},
            {"id": "hsk-r", "sets": [make_set(1, "R1", r1, r1_example, pictures=r1_pictures, note=EXAMPLE_NOTES["R1"]),
                                     make_set(1, "R2", r2, r2_example, choices=r2_choices, note=EXAMPLE_NOTES["R2"]),
                                     make_set(1, "R3", r3, r3_example, choices=r3_choices, note=EXAMPLE_NOTES["R3"]), make_set(1, "R4", starred(spec["R4"], 36), ex["R4"])]},
        ],
    }


def compose_new_hsk2(number: int, first_form: dict) -> dict:
    spec, slug = N.HSK2[number], f"hsk2-mock-{number:02}"
    draw, ex = Drawn(slug, number), shared_examples(first_form)

    l1 = []
    for index, (sentence, pinyin, pictures, answer) in enumerate(spec["L1"]):
        shown = draw.bank(pictures)
        alt = next(p["alt"] for p in shown if p["label"] == answer)
        l1.append({"n": index + 1, "options": labels(shown), "answer": answer, "answerDisplay": answer, "pictures": shown,
                   "turns": [turn(sentence, pinyin, alternate(index))], "explanation": f"The sentence says {sentence} ({pinyin}); {answer} shows {alt[0].lower() + alt[1:]}."})

    l2_sets = []
    for key, first in (("L2a", 6), ("L2b", 11)):
        part = spec[key]
        shown = draw.bank(part["pictures"])
        example = None
        if part.get("example"):
            dialogue, answer = part["example"]
            example = {"pictures": [p for p in shown if p["label"] == answer], "answer": answer, "turns": new_turns(dialogue)}
        l2_sets.append(make_set(2, key, picture_items(shown, part["items"], first, "turns"), example, pictures=shown))

    l3 = [{"n": index + 16, "options": labels(options), "answer": answer, "answerDisplay": text_answer(options, answer), "choices": choice_lines(options),
           "turns": new_turns(dialogue) + [question_turn(question, qpinyin)], "explanation": why}
          for index, (dialogue, question, qpinyin, options, answer, why) in enumerate(spec["L3"])]

    r1_pictures = draw.bank(spec["R1"]["pictures"])
    sentence, pinyin, answer = spec["R1"]["example"]
    r1_example = {"pictures": [p for p in r1_pictures if p["label"] == answer], "line": line(sentence, pinyin), "answer": answer}
    reading_banks = []
    for key, first in (("R2", 31), ("R3a", 36), ("R3b", 41)):
        choices, items, example = text_bank(spec[key], first)
        reading_banks.append(make_set(2, key, items, example, choices=choices))
    numbers = [entry[0] for entry in spec["R4"]]
    r4 = starred([entry[1:] for entry in spec["R4"]], 46)
    if numbers != [item["n"] for item in r4]:
        raise ValueError(f"{slug}: Reading 4 numbers {numbers}")

    w1_spec = spec["W1"]
    letter = {component: "ABCDEF"[i] for i, component in enumerate(w1_spec["bank"])}
    bank_lines = [{"label": "ABCDEF"[i], "text": component, "pinyin": ""} for i, component in enumerate(w1_spec["bank"])]
    compose = lambda word, pinyin, at, given, gap: {"word": word, "pinyin": pinyin, "at": at, "given": given, "gap": gap}  # noqa: E731
    w1 = [{"n": index + 51, "options": list("ABCDEF"), "answer": letter[component], "answerDisplay": f"{letter[component]} · {component} → {word[at]}",
           "compose": compose(word, pinyin, at, given, gap), "explanation": f"{component} + {given} = {word[at]}, as in {word} ({pinyin})."}
          for index, (word, pinyin, at, given, gap, component) in enumerate(w1_spec["items"])]
    word, pinyin, at, given, gap, component = w1_spec["example"]
    w1_example = {"compose": compose(word, pinyin, at, given, gap), "answer": component}

    blank = lambda sentence, hint, pinyin: {"before": sentence.split("＿")[0], "after": sentence.split("＿")[1], "hint": hint, "pinyin": pinyin}  # noqa: E731
    w2 = [{"n": index + 56, "kind": "short", "options": [], "answer": answer, "answerDisplay": f"{answer} ({hint})", "blank": blank(sentence, hint, pinyin),
           "explanation": f"{sentence.replace('＿', answer)} ({pinyin})"} for index, (sentence, hint, answer, pinyin) in enumerate(spec["W2"])]

    return {
        "id": slug, "level": 2, "number": number, "title": spec["title"], "titlePinyin": spec["titlePinyin"], "titleEn": spec["titleEn"], "theme": spec["theme"],
        "stages": [
            {"id": "hsk-l", "sets": [make_set(2, "L1", l1, ex["L1"]), *l2_sets, make_set(2, "L3", l3, ex["L3"])]},
            {"id": "hsk-r", "sets": [make_set(2, "R1", picture_items(r1_pictures, spec["R1"]["items"], 26, "line"), r1_example, pictures=r1_pictures),
                                     *reading_banks, make_set(2, "R4", r4, ex["R4"])]},
            {"id": "hsk-w", "sets": [make_set(2, "W1", w1, w1_example, choices=bank_lines), make_set(2, "W2", w2, ex["W2"])]},
        ],
    }


# ---------------------------------------------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------------------------------------------
EXPECTED = {1: {"hsk-l": [5, 5, 5, 5], "hsk-r": [5, 5, 5, 5]}, 2: {"hsk-l": [5, 5, 5, 10], "hsk-r": [5, 5, 5, 5, 5], "hsk-w": [5, 5]}}


def walk(obj, path=""):
    if isinstance(obj, dict):
        for key, value in obj.items():
            yield from walk(value, f"{path}/{key}")
    elif isinstance(obj, list):
        for index, value in enumerate(obj):
            yield from walk(value, f"{path}[{index}]")
    else:
        yield path, obj


def validate(form: dict) -> tuple[list[str], dict]:
    errors, level, fid = [], form["level"], form["id"]
    counts = {stage["id"]: [len(s["items"]) for s in stage["sets"]] for stage in form["stages"]}
    if counts != EXPECTED[level]:
        errors.append(f"{fid}: item counts {counts}")
    numbers = [item["n"] for stage in form["stages"] for s in stage["sets"] for item in s["items"]]
    if numbers != list(range(1, len(numbers) + 1)) or len(numbers) != (40 if level == 1 else 60):
        errors.append(f"{fid}: question numbers {numbers}")
    unknown: dict[str, list[str]] = {}
    for stage in form["stages"]:
        for s in stage["sets"]:
            for item in s["items"] + ([s["example"]] if s.get("example") else []):
                kind = item.get("kind", "choice")
                if kind == "choice" and "options" in item and item["answer"] not in item["options"]:
                    errors.append(f"{fid} {s['id']} #{item.get('n')}: answer {item['answer']} not in options")
                if kind == "short" and item["answer"] not in C.HANDWRITING:
                    errors.append(f"{fid} #{item['n']}: {item['answer']} is not an HSK 1-2 handwriting character")
                if s["layout"] == "W1" and "compose" in item:
                    c = item["compose"]
                    if c["word"][c["at"]] not in C.HANDWRITING:
                        errors.append(f"{fid}: W1 {c['word']} target {c['word'][c['at']]} is not a handwriting character")
                if stage["id"] == "hsk-l" and not item.get("turns"):
                    errors.append(f"{fid} {s['id']} #{item.get('n')}: no recording turns")
    # Components of the Writing 1 bank are not words; a Writing 2 gap is checked as the whole sentence.
    checked = copy.deepcopy(form)
    for stage in checked["stages"]:
        for s in stage["sets"]:
            if s["layout"] == "W1":
                s.pop("choices", None)
                s.get("example", {}).pop("answerLine", None)
            for item in s["items"] + ([s["example"]] if s.get("example") else []):
                if "blank" in item:
                    b = item.pop("blank")
                    item["sentence"] = b["before"] + item["answer"] + b["after"]
    for path, value in walk(checked):
        key = path.rsplit("/", 1)[-1].split("[")[0]
        if not isinstance(value, str):
            continue
        if key in TEXT_KEYS or key in ("before", "after"):
            for token in segment(value, level):
                if token.startswith("?"):
                    unknown.setdefault(token[1:], []).append(f"{path}: {value}")
        if key == "pinyin" and CJK.search(value):
            errors.append(f"{fid} {path}: Chinese in pinyin “{value}”")
        if key == "pinyin" and value and not TONE.search(value) and not path.endswith("/blank/pinyin") and value not in ("ba", "ma", "ne", "le", "de", "a", "zhe"):
            errors.append(f"{fid} {path}: pinyin without tone marks “{value}”")
    for char, where in unknown.items():
        errors.append(f"{fid}: “{char}” is outside HSK {level} 3.0 words ({len(where)}×), e.g. {where[0]}")
    keys = {}
    for stage in form["stages"]:
        for s in stage["sets"]:
            for item in s["items"]:
                keys[str(item["n"])] = item["answer"]
    return errors, keys


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    problems: list[str] = []
    report, manifest = {"date": DATE, "forms": {}}, {"date": DATE, "files": {}}
    forms = [compose_hsk1(n, problems) for n in (1, 2, 3)] + [compose_hsk2(n, problems) for n in (1, 2, 3)]
    forms += [compose_new_hsk1(n, forms[0]) for n in NEW_FORMS] + [compose_new_hsk2(n, forms[3]) for n in NEW_FORMS]
    for form in forms:
        errors, keys = validate(form)
        problems.extend(errors)
        path = PACK / form["id"] / "mock.json"
        path.write_text(json.dumps(form, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        report["forms"][form["id"]] = {"items": len(keys), "answerCounts": {letter: list(keys.values()).count(letter) for letter in sorted(set(keys.values()))}, "errors": errors}
    for path in sorted(PACK.rglob("*")):
        if path.is_file() and "_source" not in path.parts and path.name != "manifest.json":
            manifest["files"][path.relative_to(PACK).as_posix()] = sha256(path)
    (PACK / "validation-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (PACK / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if problems:
        print("\n".join(problems), file=sys.stderr)
        sys.exit(1)
    print(f"HSK 3.0 pack: {len(forms)} forms valid; {len(manifest['files'])} files")


if __name__ == "__main__":
    main()
