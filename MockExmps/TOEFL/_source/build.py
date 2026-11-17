"""Build the offline TOEFL iBT (January 2026 format) mock pack.

Usage (from the repository root):

    python -B MockExmps/TOEFL/_source/build.py            # every form that exists
    python -B MockExmps/TOEFL/_source/build.py 3          # only form03 (still cross-checks the others)

Standard library only. It reads `_source/formNN.py`, validates each form against the blueprint in AUTHORING.md and
writes `mock-NN/{candidate,answers,examiner}.md`, `mock-NN/mock.json`, `manifest.json` and
`validation-report.json`. It never touches website content, the database or anything outside this pack.
"""

from __future__ import annotations

import hashlib
import importlib
import json
import random
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
PACK = HERE.parent
sys.path.insert(0, str(HERE))

DATE = "2026-11-18"
LETTERS = "ABCD"
FORMS = range(1, 10)

# ---------------------------------------------------------------------------------------------------------------
# Blueprint (ETS "TOEFL iBT Test: 2026 Update - Test Blueprint and Specifications"; module split: AUTHORING.md)
# ---------------------------------------------------------------------------------------------------------------
READING_PLAN = {
    "router": ["complete_words", "complete_words", "daily_life:2", "daily_life:3", "daily_life:2", "daily_life:3",
               "academic"],
    "lower": ["complete_words", "daily_life:2", "daily_life:3"],
    "upper": ["complete_words", "academic"],
}
LISTENING_PLAN = {
    "router": ["choose_response"] * 12 + ["conversation"] * 4 + ["announcement"] * 2 + ["talk"] * 2,
    "lower": ["choose_response"] * 7 + ["conversation"] + ["announcement"] * 3,
    "upper": ["choose_response"] * 3 + ["conversation", "announcement"] + ["talk"] * 2,
}
MODULE_LABEL = {"router": "Module 1 (routing module)", "lower": "Module 2 - Lower", "upper": "Module 2 - Upper"}
MINUTES = {
    "reading": {"router": 20, "lower": 9, "upper": 9},
    "listening": {"router": 18, "lower": 7, "upper": 11},
    "writing": {"build": 6, "email": 7, "discussion": 10},
    "speaking": 8,
}
ROUTING = {"reading": (21, 35), "listening": (20, 32)}  # practice rule, about 60 %; ETS publishes no cut score
REPEAT_SECONDS = [8, 8, 10, 10, 10, 12, 12]
INTERVIEW_SECONDS = 45
VOICES = {"F-US", "M-US", "F-UK", "M-UK", "F-AU", "M-AU"}
DAILY_FORMATS = {
    "email", "notice", "text_messages", "social_post", "schedule", "flyer", "menu", "memo", "advertisement",
    "receipt", "webpage", "instructions", "letter", "form", "review",
}
READING_KINDS = {
    "main_idea", "factual", "negative_factual", "vocabulary", "inference", "purpose", "paragraph_relationship",
    "sentence_select",
}
DAILY_KINDS = {"purpose", "detail", "negative", "inference"}
LISTENING_KINDS = {"main_idea", "purpose", "detail", "inference", "function", "prediction", "negative", "attitude"}
BUILD_FOCUS = {
    "negation", "statement", "yes_no_question", "wh_question", "embedded_question", "relative_clause",
    "modal", "perfect", "passive", "comparison", "conditional", "infinitive",
}
INTERVIEW_KINDS = {"event", "life", "opinion"}

BLANK = re.compile(r"([A-Za-z]+)\[([a-z]+)\]")


def words(text: str) -> int:
    return len(re.sub(r"\[|\]", "", text).split())


def sentences(text: str) -> list[str]:
    return [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s]


def syllables(sentence: str) -> int:
    """Rough English syllable estimate; used only to keep Listen and Repeat sentences in their length band."""
    total = 0
    for word in re.findall(r"[a-z']+", sentence.lower()):
        word = word.replace("'", "")
        if not word:
            continue
        groups = re.findall(r"[aeiouy]+", word)
        count = len(groups)
        if word.endswith("e") and not word.endswith(("le", "ee", "ye")) and count > 1:
            count -= 1
        if word.endswith(("ed",)) and count > 1 and not word.endswith(("ted", "ded")):
            count -= 1
        if word.endswith("es") and count > 1 and not word.endswith(("ses", "zes", "ces", "ges", "xes", "shes", "ches")):
            count -= 1
        total += max(count, 1)
    return total


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9' ]+", " ", text.lower())).strip()


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def err(self, where: str, message: str) -> None:
        self.errors.append(f"{where}: {message}")

    def warn(self, where: str, message: str) -> None:
        self.warnings.append(f"{where}: {message}")


# ---------------------------------------------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------------------------------------------
def check_question(q: dict, where: str, kinds: set[str], rep: Report, max_option_words: int = 22) -> None:
    for key in ("q", "options", "answer", "kind", "why"):
        if not q.get(key):
            rep.err(where, f"missing '{key}'")
            return
    if q["kind"] not in kinds:
        rep.err(where, f"unknown kind '{q['kind']}'")
    options = q["options"]
    if len(options) != 4 or len({norm(o) for o in options}) != 4:
        rep.err(where, "needs four different options")
        return
    if q["answer"] not in LETTERS:
        rep.err(where, f"answer '{q['answer']}' is not A-D")
        return
    for option in options:
        if words(option) > max_option_words:
            rep.err(where, f"option longer than {max_option_words} words: {option!r}")
    lengths = [len(o) for o in options]
    right = lengths[LETTERS.index(q["answer"])]
    others = [n for i, n in enumerate(lengths) if i != LETTERS.index(q["answer"])]
    if right > 1.6 * (sum(others) / 3) and right == max(lengths) and right - max(others) > 12:
        rep.warn(where, "the key is much longer than every distractor")


def check_complete_words(task: dict, where: str, rep: Report) -> None:
    text = task.get("text", "")
    if not task.get("subject"):
        rep.err(where, "missing 'subject'")
    sents = sentences(text)
    if len(sents) < 3:
        rep.err(where, "needs at least three sentences")
        return
    total = words(text)
    if not 55 <= total <= 90:
        rep.err(where, f"{total} words (55-90 allowed)")
    blanks = BLANK.findall(text)
    if len(blanks) != 10:
        rep.err(where, f"{len(blanks)} blanks (exactly 10 required)")
    if BLANK.search(sents[0]):
        rep.err(where, "the first sentence must be intact")
    if BLANK.search(sents[-1]):
        rep.err(where, "the last sentence must be intact")
    for shown, missing in blanks:
        word = shown + missing
        if len(missing) != (len(word) + 1) // 2:
            rep.err(where, f"'{shown}[{missing}]' must hide the second half ({(len(word) + 1) // 2} letters)")
        if not 2 <= len(word) <= 13:
            rep.err(where, f"'{word}' is outside 2-13 letters")
    blanked = [i for i, s in enumerate(sents) if BLANK.search(s)]
    if blanked and blanked != list(range(blanked[0], blanked[-1] + 1)):
        rep.err(where, "blanked sentences must be consecutive")
    if blanked and blanked[0] != 1:
        rep.err(where, "blanks must start in the second sentence")
    for index in blanked:
        tokens = sents[index].split()
        hits = [i for i, token in enumerate(tokens) if BLANK.search(token)]
        for a, b in zip(hits, hits[1:]):
            if b - a != 2:
                rep.err(where, f"sentence {index + 1}: blanks must fall on every second word "
                               f"('{tokens[a]}' -> '{tokens[b]}')")
    if "[" in BLANK.sub("", text) or "]" in BLANK.sub("", text):
        rep.err(where, "stray bracket")


def check_daily(task: dict, size: int, where: str, rep: Report) -> None:
    if task.get("format") not in DAILY_FORMATS:
        rep.err(where, f"unknown format '{task.get('format')}'")
    for key in ("heading", "text"):
        if not task.get(key):
            rep.err(where, f"missing '{key}'")
    questions = task.get("questions", [])
    if len(questions) != size:
        rep.err(where, f"{len(questions)} questions ({size} required)")
    total = words(task.get("text", ""))
    low, high = (35, 95) if size == 2 else (90, 155)
    if not low <= total <= high:
        rep.err(where, f"{total} words ({low}-{high} allowed for a {size}-question text)")
    for i, q in enumerate(questions, 1):
        check_question(q, f"{where} q{i}", DAILY_KINDS, rep)


def check_academic(task: dict, where: str, rep: Report) -> None:
    for key in ("subject", "title", "paragraphs"):
        if not task.get(key):
            rep.err(where, f"missing '{key}'")
            return
    paragraphs = task["paragraphs"]
    if not 2 <= len(paragraphs) <= 4:
        rep.err(where, "2-4 paragraphs required")
    total = sum(words(p) for p in paragraphs)
    if not 180 <= total <= 230:
        rep.err(where, f"{total} words (180-230 allowed)")
    questions = task.get("questions", [])
    if len(questions) != 5:
        rep.err(where, f"{len(questions)} questions (5 required)")
    kinds = [q.get("kind") for q in questions]
    if len(set(kinds)) < 4:
        rep.err(where, "use at least four different question kinds")
    for i, q in enumerate(questions, 1):
        check_question(q, f"{where} q{i}", READING_KINDS, rep)
        if q.get("kind") == "vocabulary":
            target = re.search(r"[\"“]([^\"”]+)[\"”]", q.get("q", ""))
            if not target or target.group(1).lower() not in " ".join(paragraphs).lower():
                rep.err(f"{where} q{i}", "vocabulary question must quote a word that is in the passage")


def check_voice(voice, where: str, rep: Report) -> None:
    if voice not in VOICES:
        rep.err(where, f"voice '{voice}' is not one of {sorted(VOICES)}")


def check_choose(task: dict, where: str, rep: Report) -> None:
    check_voice(task.get("voice"), where, rep)
    prompt = task.get("prompt", "")
    if not 3 <= words(prompt) <= 18:
        rep.err(where, f"prompt has {words(prompt)} words (3-18 allowed)")
    q = {"q": prompt, "options": task.get("options"), "answer": task.get("answer"), "kind": "detail",
         "why": task.get("why")}
    check_question(q, where, LISTENING_KINDS, rep, max_option_words=14)


def check_conversation(task: dict, where: str, rep: Report) -> None:
    script = task.get("script", [])
    voices = task.get("voices", {})
    if not task.get("setting"):
        rep.err(where, "missing 'setting'")
    if len(voices) != 2:
        rep.err(where, "exactly two speakers required")
    for voice in voices.values():
        check_voice(voice, where, rep)
    if len(set(voices.values())) != len(voices):
        rep.err(where, "the two speakers need different voices")
    if any(speaker not in voices for speaker, _ in script):
        rep.err(where, "script uses a speaker without a voice")
    if not 6 <= len(script) <= 12:
        rep.err(where, f"{len(script)} turns (6-12 allowed)")
    total = sum(words(line) for _, line in script)
    if not 70 <= total <= 150:
        rep.err(where, f"{total} words (70-150 allowed)")
    if len(task.get("questions", [])) != 2:
        rep.err(where, "2 questions required")
    for i, q in enumerate(task.get("questions", []), 1):
        check_question(q, f"{where} q{i}", LISTENING_KINDS, rep)


def check_monologue(task: dict, where: str, rep: Report, low: int, high: int, count: int, label: str) -> None:
    check_voice(task.get("voice"), where, rep)
    if not task.get(label):
        rep.err(where, f"missing '{label}'")
    total = words(task.get("script", ""))
    if not low <= total <= high:
        rep.err(where, f"{total} words ({low}-{high} allowed)")
    questions = task.get("questions", [])
    if len(questions) != count:
        rep.err(where, f"{len(questions)} questions ({count} required)")
    if count == 4 and len({q.get("kind") for q in questions}) < 3:
        rep.err(where, "use at least three different question kinds")
    for i, q in enumerate(questions, 1):
        check_question(q, f"{where} q{i}", LISTENING_KINDS, rep)


def check_keys(keys: list[str], where: str, rep: Report, low: float = 0.15, high: float = 0.36) -> None:
    if not keys:
        return
    counts = Counter(keys)
    for letter in LETTERS:
        share = counts[letter] / len(keys)
        if len(keys) >= 12 and not low <= share <= high:
            rep.err(where, f"key {letter} is used {counts[letter]} times in {len(keys)} ({share:.0%}); rebalance")
    run = 1
    for a, b in zip(keys, keys[1:]):
        run = run + 1 if a == b else 1
        if run == 4:
            rep.err(where, f"four identical keys in a row ({a})")


def build_tokens(item: dict) -> list[str]:
    return [t for t in [item.get("prefix", "")] + list(item.get("chips", [])) + [item.get("suffix", "")] if t]


def check_build(item: dict, where: str, rep: Report) -> None:
    for key in ("context", "answer", "chips", "focus"):
        if not item.get(key):
            rep.err(where, f"missing '{key}'")
            return
    if item["focus"] not in BUILD_FOCUS:
        rep.err(where, f"unknown focus '{item['focus']}'")
    answer = item["answer"]
    if answer[-1] not in ".?":
        rep.err(where, "answer must end with . or ?")
    if norm(" ".join(build_tokens(item))) != norm(answer):
        rep.err(where, f"prefix + chips + suffix do not rebuild the answer: {' '.join(build_tokens(item))!r}")
    chips = item["chips"]
    if not 4 <= len(chips) <= 8:
        rep.err(where, f"{len(chips)} chips (4-8 allowed)")
    if len({c.lower() for c in chips + ([item["extra"]] if item.get("extra") else [])}) != len(chips) + bool(
            item.get("extra")):
        rep.err(where, "chips (and the extra chip) must all be different")
    for chip in chips + ([item["extra"]] if item.get("extra") else []):
        first = chip.split()[0]
        if first[0].isupper() and first not in {"I", "I'm", "I'll", "I'd", "I've"} and chip not in item.get("proper", []):
            rep.err(where, f"chip '{chip}' should be lowercase")
    if not 6 <= words(answer) <= 14:
        rep.err(where, f"answer has {words(answer)} words (6-14 allowed)")
    if not 4 <= words(item["context"]) <= 16:
        rep.err(where, f"context has {words(item['context'])} words (4-16 allowed)")


def check_writing(writing: dict, where: str, rep: Report) -> None:
    build = writing.get("build", [])
    if len(build) != 10:
        rep.err(where, f"{len(build)} Build a Sentence items (10 required)")
    for i, item in enumerate(build, 1):
        check_build(item, f"{where} build {i}", rep)
    extras = sum(1 for item in build if item.get("extra"))
    if not 2 <= extras <= 4:
        rep.err(where, f"{extras} items carry an extra chip (2-4 required)")
    if sum(1 for item in build if item.get("answer", ".").endswith("?")) not in range(4, 7):
        rep.err(where, "4-6 of the ten sentences must be questions")
    if len({item.get("focus") for item in build}) < 5:
        rep.err(where, "Build a Sentence needs at least five different grammar focuses")

    email = writing.get("email", {})
    for key in ("scenario", "to", "subject", "bullets", "model"):
        if not email.get(key):
            rep.err(f"{where} email", f"missing '{key}'")
    if len(email.get("bullets", [])) != 3:
        rep.err(f"{where} email", "exactly three bullet points required")
    if not 40 <= words(email.get("scenario", "")) <= 100:
        rep.err(f"{where} email", f"scenario has {words(email.get('scenario', ''))} words (40-100 allowed)")
    if not 110 <= words(email.get("model", "")) <= 180:
        rep.err(f"{where} email", f"model answer has {words(email.get('model', ''))} words (110-180 allowed)")

    disc = writing.get("discussion", {})
    for key in ("course", "professor", "students", "model"):
        if not disc.get(key):
            rep.err(f"{where} discussion", f"missing '{key}'")
            return
    if not 45 <= words(disc["professor"].get("post", "")) <= 110:
        rep.err(f"{where} discussion", f"professor post has {words(disc['professor'].get('post', ''))} words (45-110)")
    if len(disc["students"]) != 2:
        rep.err(f"{where} discussion", "two student posts required")
    for student in disc["students"]:
        if not 35 <= words(student.get("post", "")) <= 85:
            rep.err(f"{where} discussion", f"{student.get('name')}'s post has {words(student.get('post', ''))} words "
                                           "(35-85)")
    if not 110 <= words(disc["model"]) <= 180:
        rep.err(f"{where} discussion", f"model answer has {words(disc['model'])} words (110-180 allowed)")


def check_speaking(speaking: dict, where: str, rep: Report) -> None:
    repeat = speaking.get("repeat", {})
    for key in ("scenario", "picture", "voice", "sentences"):
        if not repeat.get(key):
            rep.err(f"{where} repeat", f"missing '{key}'")
            return
    check_voice(repeat["voice"], f"{where} repeat", rep)
    if "Repeat only once." not in repeat["scenario"]:
        rep.err(f"{where} repeat", "scenario must end with the 'Repeat only once.' direction")
    if len(repeat["sentences"]) != 7:
        rep.err(f"{where} repeat", "7 sentences required")
        return
    bands = [(8, 12)] * 2 + [(12, 18)] * 3 + [(18, 26)] * 2
    for i, (sentence, (low, high)) in enumerate(zip(repeat["sentences"], bands), 1):
        count = syllables(sentence)
        if not low <= count <= high:
            rep.err(f"{where} repeat {i}", f"about {count} syllables ({low}-{high} expected): {sentence!r}")

    interview = speaking.get("interview", {})
    for key in ("scenario", "topic", "voice", "questions"):
        if not interview.get(key):
            rep.err(f"{where} interview", f"missing '{key}'")
            return
    check_voice(interview["voice"], f"{where} interview", rep)
    if len(interview["questions"]) != 4:
        rep.err(f"{where} interview", "4 questions required")
    for i, q in enumerate(interview["questions"], 1):
        if q.get("kind") not in INTERVIEW_KINDS:
            rep.err(f"{where} interview {i}", f"unknown kind '{q.get('kind')}'")
        if not 15 <= words(q.get("q", "")) <= 60:
            rep.err(f"{where} interview {i}", f"question has {words(q.get('q', ''))} words (15-60 allowed)")
        if not 80 <= words(q.get("model", "")) <= 130:
            rep.err(f"{where} interview {i}", f"model answer has {words(q.get('model', ''))} words (80-130 allowed)")
    kinds = [q.get("kind") for q in interview["questions"]]
    if kinds and kinds[-1] != "opinion":
        rep.err(f"{where} interview", "the last question must ask for an opinion")


def validate(form: dict, rep: Report) -> None:
    tag = f"form {form.get('number', '?'):02d}" if isinstance(form.get("number"), int) else "form ??"
    for key in ("number", "theme", "reading", "listening", "writing", "speaking"):
        if key not in form:
            rep.err(tag, f"missing '{key}'")
            return

    reading_keys: list[str] = []
    for module, plan in READING_PLAN.items():
        tasks = form["reading"].get(module, [])
        if [t.get("type") for t in tasks] != [p.split(":")[0] for p in plan]:
            rep.err(f"{tag} reading {module}", f"task order must be {plan}")
            continue
        module_keys: list[str] = []
        for i, (task, spec) in enumerate(zip(tasks, plan), 1):
            where = f"{tag} reading {module} task {i}"
            if task["type"] == "complete_words":
                check_complete_words(task, where, rep)
            elif task["type"] == "daily_life":
                check_daily(task, int(spec.split(":")[1]), where, rep)
            else:
                check_academic(task, where, rep)
            module_keys += [q.get("answer", "?") for q in task.get("questions", [])]
        check_keys(module_keys, f"{tag} reading {module}", rep)
        reading_keys += module_keys
    check_keys(reading_keys, f"{tag} reading (all modules)", rep, 0.18, 0.33)
    formats = [t.get("format") for m in READING_PLAN for t in form["reading"].get(m, []) if t.get("type") == "daily_life"]
    if len(set(formats)) < 5:
        rep.err(f"{tag} reading", "the six daily-life texts must use at least five different formats")

    listening_keys: list[str] = []
    voices: list[str] = []
    for module, plan in LISTENING_PLAN.items():
        tasks = form["listening"].get(module, [])
        if [t.get("type") for t in tasks] != plan:
            rep.err(f"{tag} listening {module}", "task order does not match the blueprint")
            continue
        module_keys = []
        for i, task in enumerate(tasks, 1):
            where = f"{tag} listening {module} task {i}"
            if task["type"] == "choose_response":
                check_choose(task, where, rep)
                module_keys.append(task.get("answer", "?"))
                voices.append(task.get("voice"))
            elif task["type"] == "conversation":
                check_conversation(task, where, rep)
                voices += list(task.get("voices", {}).values())
            elif task["type"] == "announcement":
                check_monologue(task, where, rep, 55, 115, 2, "setting")
                voices.append(task.get("voice"))
            else:
                check_monologue(task, where, rep, 170, 250, 4, "subject")
                voices.append(task.get("voice"))
            module_keys += [q.get("answer", "?") for q in task.get("questions", [])]
        check_keys(module_keys, f"{tag} listening {module}", rep)
        listening_keys += module_keys
    check_keys(listening_keys, f"{tag} listening (all modules)", rep, 0.19, 0.31)
    accents = Counter(v.split("-")[1] for v in voices if v in VOICES)
    for accent in ("US", "UK", "AU"):
        if accents[accent] < 6:
            rep.err(f"{tag} listening", f"only {accents[accent]} parts use a {accent} voice (at least 6 required)")

    check_writing(form["writing"], f"{tag} writing", rep)
    check_speaking(form["speaking"], f"{tag} speaking", rep)


def fingerprints(form: dict) -> list[tuple[str, str, str]]:
    """(place, category, text) for everything that must not repeat between forms."""
    out: list[tuple[str, str, str]] = []
    n = form["number"]
    for section in ("reading", "listening"):
        for module, tasks in form[section].items():
            for i, task in enumerate(tasks, 1):
                where = f"form {n:02d} {section} {module} task {i}"
                kind = task["type"]
                if kind in ("complete_words", "daily_life"):
                    out.append((where, kind, norm(full_text(task.get("text", "")))))
                if kind in ("complete_words", "academic", "talk"):
                    # one subject per task type and pack would be too strict; the title or opening must differ
                    opening = task.get("title") or " ".join(norm(full_text(task.get("text", "") or
                                                                      task.get("script", ""))).split()[:8])
                    out.append((where, f"{kind} topic", norm(opening)))
                if kind == "academic":
                    out.append((where, "passage", norm(" ".join(task.get("paragraphs", [])))))
                if kind == "choose_response":
                    out.append((where, "prompt", norm(task.get("prompt", ""))))
                if task.get("script"):
                    script = task["script"]
                    text = script if isinstance(script, str) else " ".join(line for _, line in script)
                    out.append((where, "script", norm(text)))
    writing, speaking = form["writing"], form["speaking"]
    for i, item in enumerate(writing.get("build", []), 1):
        out.append((f"form {n:02d} build {i}", "build", norm(item.get("answer", ""))))
    out.append((f"form {n:02d} email", "email", norm(writing.get("email", {}).get("scenario", ""))))
    out.append((f"form {n:02d} discussion", "discussion",
                norm(writing.get("discussion", {}).get("professor", {}).get("post", ""))))
    for i, sentence in enumerate(speaking.get("repeat", {}).get("sentences", []), 1):
        out.append((f"form {n:02d} repeat {i}", "repeat", norm(sentence)))
    out.append((f"form {n:02d} interview", "interview topic", norm(speaking.get("interview", {}).get("topic", ""))))
    return out


# ---------------------------------------------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------------------------------------------
def gapped(text: str, start: int) -> tuple[str, list[str]]:
    answers: list[str] = []

    def swap(match: re.Match) -> str:
        answers.append(match.group(1) + match.group(2))
        number = start + len(answers) - 1
        return f"**({number})** `{match.group(1)}{' _' * len(match.group(2))}`"

    return BLANK.sub(swap, text), answers


def full_text(text: str) -> str:
    return BLANK.sub(lambda m: m.group(1) + m.group(2), text)


def scramble(item: dict, seed: str) -> list[str]:
    chips = list(item["chips"]) + ([item["extra"]] if item.get("extra") else [])
    rng = random.Random(seed)
    for _ in range(50):
        shuffled = chips[:]
        rng.shuffle(shuffled)
        if shuffled[: len(item["chips"])] != item["chips"] and shuffled[0] != item["chips"][0]:
            return shuffled
    return chips[::-1]


def quote(text: str) -> str:
    return "\n".join("> " + line if line.strip() else ">" for line in text.strip().splitlines())


def options_md(options: list[str]) -> str:
    return "\n".join(f"   - **{LETTERS[i]}** {option}" for i, option in enumerate(options))


def number_form(form: dict) -> dict:
    """Return a deep-ish copy with question numbers, gapped texts and scrambled chips filled in."""
    out = json.loads(json.dumps(form))
    n = out["number"]
    for module, tasks in out["reading"].items():
        number = 1 if module == "router" else 36
        for task in tasks:
            if task["type"] == "complete_words":
                task["gapped"], task["answers"] = gapped(task["text"], number)
                task["full"] = full_text(task["text"])
                task["numbers"] = [number, number + 9]
                number += 10
            else:
                for q in task["questions"]:
                    q["number"] = number
                    number += 1
    for module, tasks in out["listening"].items():
        number = 1 if module == "router" else 33
        for task in tasks:
            if task["type"] == "choose_response":
                task["number"] = number
                number += 1
            else:
                for q in task["questions"]:
                    q["number"] = number
                    number += 1
    for i, item in enumerate(out["writing"]["build"], 1):
        item["number"] = i
        if item.get("suffix"):
            item["suffix"] = item["suffix"].rstrip(".?!")  # the final mark is printed from the answer
        item["display"] = scramble(item, f"toefl-{n}-{i}")
    return out


HEADER = (
    "> Original practice material in the January 2026 TOEFL iBT format. Not an ETS product; no official question, "
    "passage or recording is reproduced. TOEFL and TOEFL iBT are registered trademarks of ETS.\n"
)


def render_candidate(form: dict) -> str:
    n = form["number"]
    md = [f"# TOEFL iBT practice test {n:02d} - test taker's paper\n", HEADER]
    md.append(
        "| Section | Tasks | Questions | Time |\n| --- | --- | --- | --- |\n"
        "| Reading | Complete the Words, Read in Daily Life, Read an Academic Passage | 50 (35 + 15) | "
        f"{MINUTES['reading']['router']} + {MINUTES['reading']['lower']} min |\n"
        "| Listening | Choose a Response, Conversation, Announcement, Academic Talk | 47 (32 + 15) | "
        f"{MINUTES['listening']['router']} + {MINUTES['listening']['lower']} or {MINUTES['listening']['upper']} min |\n"
        "| Writing | Build a Sentence, Write an Email, Write for an Academic Discussion | 12 | 23 min |\n"
        "| Speaking | Listen and Repeat, Take an Interview | 11 | about 8 min |\n"
    )
    md.append(
        "Reading and Listening are adaptive. Everyone takes Module 1. Your result in Module 1 decides whether you "
        "take the **Lower** or the **Upper** Module 2: take only one of them. Inside a module you may go back to "
        "earlier questions; you may not return to a module once its time is over. There is no penalty for a wrong "
        "answer.\n"
    )

    # Reading ---------------------------------------------------------------------------------------------------
    md.append("---\n\n# Reading\n")
    for module in ("router", "lower", "upper"):
        tasks = form["reading"][module]
        first, last = (1, 35) if module == "router" else (36, 50)
        md.append(f"## Reading {MODULE_LABEL[module]}\n")
        md.append(f"Questions {first}-{last} · {MINUTES['reading'][module]} minutes\n")
        if module != "router":
            md.append(f"*Take this module only if you were routed to the {module} module.*\n")
        for task in tasks:
            if task["type"] == "complete_words":
                a, b = task["numbers"]
                md.append(f"### Complete the Words (Questions {a}-{b})\n")
                md.append("Fill in the missing letters in the paragraph. Each `_` stands for one letter.\n")
                md.append(quote(task["gapped"]) + "\n")
            elif task["type"] == "daily_life":
                a, b = task["questions"][0]["number"], task["questions"][-1]["number"]
                md.append(f"### Read in Daily Life (Questions {a}-{b})\n")
                md.append(f"{task['heading']}\n")
                md.append(quote(task["text"].replace("\n", "  \n")) + "\n")
                for q in task["questions"]:
                    md.append(f"**{q['number']}.** {q['q']}\n\n{options_md(q['options'])}\n")
            else:
                a, b = task["questions"][0]["number"], task["questions"][-1]["number"]
                md.append(f"### Read an Academic Passage (Questions {a}-{b})\n")
                md.append("Read an academic passage.\n")
                md.append(f"> **{task['title']}**\n>\n" + "\n>\n".join("> " + p for p in task["paragraphs"]) + "\n")
                for q in task["questions"]:
                    md.append(f"**{q['number']}.** {q['q']}\n\n{options_md(q['options'])}\n")

    # Listening -------------------------------------------------------------------------------------------------
    md.append("---\n\n# Listening\n")
    md.append(
        "Every recording is played once. You may take notes. In Listen and Choose a Response you hear one sentence "
        "and choose the best reply; the sentence is not printed. In the other tasks the questions and answer "
        "choices are printed, the recording is not.\n"
    )
    for module in ("router", "lower", "upper"):
        tasks = form["listening"][module]
        first, last = (1, 32) if module == "router" else (33, 47)
        md.append(f"## Listening {MODULE_LABEL[module]}\n")
        md.append(f"Questions {first}-{last} · about {MINUTES['listening'][module]} minutes\n")
        if module != "router":
            md.append(f"*Take this module only if you were routed to the {module} module.*\n")
        previous = None
        counters = Counter()
        for task in tasks:
            kind = task["type"]
            if kind == "choose_response":
                if previous != kind:
                    md.append("### Listen and Choose a Response\n")
                    md.append("Listen to the speaker. Choose the best response.\n")
                md.append(f"**{task['number']}.** *(recording)*\n\n{options_md(task['options'])}\n")
            else:
                counters[kind] += 1
                title = {"conversation": "Listen to a Conversation", "announcement": "Listen to an Announcement",
                         "talk": "Listen to an Academic Talk"}[kind]
                a, b = task["questions"][0]["number"], task["questions"][-1]["number"]
                md.append(f"### {title} (Questions {a}-{b})\n")
                context = task.get("setting") or f"Listen to a talk in a {task['subject'].lower()} class."
                md.append(f"*(recording)* {context}\n")
                for q in task["questions"]:
                    md.append(f"**{q['number']}.** {q['q']}\n\n{options_md(q['options'])}\n")
            previous = kind

    # Writing ---------------------------------------------------------------------------------------------------
    writing = form["writing"]
    md.append("---\n\n# Writing\n")
    md.append(f"## Build a Sentence (Questions 1-10) · {MINUTES['writing']['build']} minutes\n")
    md.append(
        "Move the words in the boxes to create a grammatical sentence. Each blank takes one box. "
        "In some questions one box is not used.\n"
    )
    for item in writing["build"]:
        blanks = " ".join(["______"] * len(item["chips"]))
        line = " ".join(t for t in [item.get("prefix", ""), blanks, item.get("suffix", "")] if t) + item["answer"][-1]
        chips = " / ".join(f"`{chip}`" for chip in item["display"])
        md.append(f"**{item['number']}.** *{item['context']}*\n\n   {line}\n\n   {chips}\n")

    email = writing["email"]
    md.append(f"## Write an Email (Question 11) · {MINUTES['writing']['email']} minutes\n")
    md.append(f"{email['scenario']}\n")
    md.append(f"Write an email to {email['to']}. In your email, do the following:\n")
    md.append("\n".join(f"- {bullet}" for bullet in email["bullets"]) + "\n")
    md.append("Write as much as you can and in complete sentences.\n")
    md.append(f"> **To:** {email['to']}  \n> **Subject:** {email['subject']}\n")

    disc = writing["discussion"]
    md.append(f"## Write for an Academic Discussion (Question 12) · {MINUTES['writing']['discussion']} minutes\n")
    md.append(
        f"Your professor is teaching a class on {disc['course']}. Write a post responding to the professor's "
        "question. In your response, you should do the following:\n\n"
        "- Express and support your opinion.\n- Make a contribution to the discussion in your own words.\n\n"
        "An effective response will contain at least 100 words.\n"
    )
    md.append(f"> **{disc['professor']['name']}**  \n> {disc['professor']['post']}\n")
    for student in disc["students"]:
        md.append(f"> **{student['name']}**  \n> {student['post']}\n")

    # Speaking --------------------------------------------------------------------------------------------------
    speaking = form["speaking"]
    md.append("---\n\n# Speaking\n")
    md.append("## Listen and Repeat (Questions 1-7)\n")
    md.append(f"{speaking['repeat']['scenario']}\n")
    md.append(f"*Picture: {speaking['repeat']['picture']}*\n")
    md.append(
        "You hear seven sentences, one at a time. They are not printed. After each sentence, wait for the beep and "
        "repeat it once. Recording time: "
        + ", ".join(f"{s} s" for s in REPEAT_SECONDS) + ".\n"
    )
    md.append("## Take an Interview (Questions 8-11)\n")
    md.append(f"{speaking['interview']['scenario']}\n")
    md.append(
        f"You hear four questions. They are not printed. There is no preparation time: start speaking as soon as "
        f"each question ends. You have {INTERVIEW_SECONDS} seconds for each answer.\n"
    )
    return "\n".join(md)


def render_examiner(form: dict) -> str:
    n = form["number"]
    md = [f"# TOEFL iBT practice test {n:02d} - recording scripts (administrator only)\n", HEADER]
    md.append(
        "Voice codes: F/M = woman/man, US/UK/AU = accent. Read or synthesise every script once, at a natural pace. "
        "Leave 20 seconds after each Choose a Response item and 25 seconds for each question that follows a "
        "conversation, announcement or talk.\n"
    )
    md.append("# Listening\n")
    for module in ("router", "lower", "upper"):
        md.append(f"## Listening {MODULE_LABEL[module]}\n")
        for task in form["listening"][module]:
            kind = task["type"]
            if kind == "choose_response":
                md.append(f"**{task['number']}.** [{task['voice']}] {task['prompt']}\n")
            elif kind == "conversation":
                a, b = task["questions"][0]["number"], task["questions"][-1]["number"]
                md.append(f"### Conversation (Questions {a}-{b})\n")
                md.append(f"*{task['setting']}* Voices: "
                          + ", ".join(f"{name} = {voice}" for name, voice in task["voices"].items()) + "\n")
                md.append("\n".join(f"**{speaker}:** {line}  " for speaker, line in task["script"]) + "\n")
            else:
                a, b = task["questions"][0]["number"], task["questions"][-1]["number"]
                label = "Announcement" if kind == "announcement" else f"Academic talk - {task['subject']}"
                md.append(f"### {label} (Questions {a}-{b})\n")
                if task.get("setting"):
                    md.append(f"*{task['setting']}*\n")
                md.append(f"[{task['voice']}] {task['script']}\n")
    speaking = form["speaking"]
    md.append("# Speaking\n")
    md.append(f"## Listen and Repeat · voice {speaking['repeat']['voice']}\n")
    md.append(f"Read aloud: \"{speaking['repeat']['scenario']}\"\n")
    for i, (sentence, seconds) in enumerate(zip(speaking["repeat"]["sentences"], REPEAT_SECONDS), 1):
        md.append(f"{i}. {sentence} *(beep, then {seconds} s of recording time)*")
    md.append("")
    md.append(f"## Take an Interview · voice {speaking['interview']['voice']}\n")
    md.append(f"Read aloud: \"{speaking['interview']['scenario']}\"\n")
    for i, q in enumerate(speaking["interview"]["questions"], 8):
        md.append(f"{i}. {q['q']} *({INTERVIEW_SECONDS} s of recording time, no preparation)*")
    md.append("")
    return "\n".join(md)


def key_table(rows: list[tuple[int, str]]) -> str:
    out = ["| Q | Key | Q | Key | Q | Key | Q | Key | Q | Key |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for i in range(0, len(rows), 5):
        chunk = rows[i:i + 5]
        cells = [f"{number} | {key}" for number, key in chunk] + [" | "] * (5 - len(chunk))
        out.append("| " + " | ".join(cells) + " |")
    return "\n".join(out)


def render_answers(form: dict) -> str:
    n = form["number"]
    md = [f"# TOEFL iBT practice test {n:02d} - answer key and explanations\n", HEADER]
    r_cut, r_of = ROUTING["reading"]
    l_cut, l_of = ROUTING["listening"]
    md.append(
        f"**Routing (practice rule).** Reading: {r_cut} or more of the {r_of} Module 1 answers correct -> Upper "
        f"module, otherwise Lower. Listening: {l_cut} or more of {l_of} -> Upper, otherwise Lower. ETS does not "
        "publish its cut scores; these are set at about 60 %.\n"
    )
    md.append(
        "**Raw score.** Reading /50, Listening /47, Writing /20 (Build a Sentence 10 x 1, Email 0-5, Academic "
        "Discussion 0-5), Speaking /55 (11 responses x 0-5). The real test counts 35 of the Reading and 35 of the "
        "Listening items and reports each section on a 1-6 band scale; this pack gives raw scores only.\n"
    )

    md.append("# Reading\n")
    for module in ("router", "lower", "upper"):
        md.append(f"## Reading {MODULE_LABEL[module]}\n")
        rows: list[tuple[int, str]] = []
        notes: list[str] = []
        for task in form["reading"][module]:
            if task["type"] == "complete_words":
                a, _ = task["numbers"]
                for i, answer in enumerate(task["answers"]):
                    rows.append((a + i, answer))
                notes.append(f"**{a}-{a + 9} ({task['subject']}).** {task['full']}\n")
            else:
                for q in task["questions"]:
                    rows.append((q["number"], q["answer"]))
                    notes.append(f"**{q['number']}. {q['answer']}** ({q['kind'].replace('_', ' ')}) {q['why']}\n")
        md.append(key_table(rows) + "\n")
        md.append("\n".join(notes))

    md.append("# Listening\n")
    for module in ("router", "lower", "upper"):
        md.append(f"## Listening {MODULE_LABEL[module]}\n")
        rows = []
        notes = []
        for task in form["listening"][module]:
            if task["type"] == "choose_response":
                rows.append((task["number"], task["answer"]))
                notes.append(f"**{task['number']}. {task['answer']}** \"{task['prompt']}\" {task['why']}\n")
            else:
                for q in task["questions"]:
                    rows.append((q["number"], q["answer"]))
                    notes.append(f"**{q['number']}. {q['answer']}** ({q['kind'].replace('_', ' ')}) {q['why']}\n")
        md.append(key_table(rows) + "\n")
        md.append("\n".join(notes))

    writing = form["writing"]
    md.append("# Writing\n")
    md.append("## Build a Sentence\n")
    md.append("One point for a sentence with every box in the right place; otherwise zero.\n")
    for item in writing["build"]:
        extra = f" Unused box: `{item['extra']}`." if item.get("extra") else ""
        md.append(f"{item['number']}. **{item['answer']}** ({item['focus'].replace('_', ' ')}){extra}")
    md.append("")
    md.append("## Write an Email - model response (score 5)\n")
    md.append(quote(writing["email"]["model"].replace("\n", "  \n")) + "\n")
    md.append(
        "| Score | Email descriptor |\n| --- | --- |\n"
        "| 5 | Fully successful: every bullet is covered with relevant detail, the tone suits the reader, ideas are "
        "connected, and only minor slips in grammar, word choice or spelling occur. |\n"
        "| 4 | Generally successful: all bullets are addressed, one may be thin; tone is appropriate; some noticeable "
        "errors that do not hide meaning. |\n"
        "| 3 | Partly successful: a bullet is missing or undeveloped, or errors and limited vocabulary sometimes "
        "obscure meaning; tone may slip. |\n"
        "| 2 | Mostly unsuccessful: little of the task is done; frequent errors; hard to follow. |\n"
        "| 1 | Unsuccessful: a few words or phrases related to the task. |\n"
        "| 0 | Blank, off topic, copied from the prompt, or not in English. |\n"
    )
    md.append("## Write for an Academic Discussion - model response (score 5)\n")
    md.append(quote(writing["discussion"]["model"]) + "\n")
    md.append(
        "| Score | Academic Discussion descriptor |\n| --- | --- |\n"
        "| 5 | A relevant, clearly expressed contribution with well-developed explanation, example or detail; varied "
        "sentence structure and precise vocabulary; almost no errors. |\n"
        "| 4 | A relevant contribution that is easy to follow, with adequate development; a few errors. |\n"
        "| 3 | Mostly relevant and understandable; development is partly missing, unclear or repeats the other "
        "posts; some errors in structure or word choice. |\n"
        "| 2 | An attempt to contribute, but limited language makes ideas hard to follow. |\n"
        "| 1 | An ineffective attempt; few ideas are understandable. |\n"
        "| 0 | Blank, off topic, copied, or not in English. |\n"
    )

    speaking = form["speaking"]
    md.append("# Speaking\n")
    md.append("## Listen and Repeat\n")
    for i, sentence in enumerate(speaking["repeat"]["sentences"], 1):
        md.append(f"{i}. {sentence}")
    md.append("")
    md.append(
        "| Score | Listen and Repeat descriptor |\n| --- | --- |\n"
        "| 5 | Fully intelligible and an exact repetition of the sentence. |\n"
        "| 4 | Intelligible; the meaning is kept, with one small change (a missing, added or replaced word). |\n"
        "| 3 | Mostly intelligible; most of the sentence is repeated, but several words are changed or missing. |\n"
        "| 2 | Only part of the sentence is repeated, or much of it is hard to understand. |\n"
        "| 1 | A few words are recognisable. |\n"
        "| 0 | No response, or nothing related to the sentence. |\n"
    )
    md.append("## Take an Interview - model responses (score 5)\n")
    for i, q in enumerate(speaking["interview"]["questions"], 8):
        md.append(f"**{i}. {q['q']}** ({q['kind']})\n\n{quote(q['model'])}\n")
    md.append(
        "| Score | Interview descriptor |\n| --- | --- |\n"
        "| 5 | Answers the question fully with clear, connected elaboration; fluent, natural pace; accurate and "
        "varied grammar and vocabulary; easy to understand throughout. |\n"
        "| 4 | Answers the question with some elaboration; generally fluent; minor errors or hesitations that do "
        "not hinder understanding. |\n"
        "| 3 | Answers the question but with limited detail; noticeable pauses, errors or pronunciation problems "
        "that sometimes require listener effort. |\n"
        "| 2 | A minimal or partly relevant answer; frequent pauses; limited language. |\n"
        "| 1 | Isolated words or phrases; very hard to understand. |\n"
        "| 0 | No response, off topic, or not in English. |\n"
    )
    return "\n".join(md)


# ---------------------------------------------------------------------------------------------------------------
def stats(form: dict) -> dict:
    reading = form["reading"]
    listening = form["listening"]
    return {
        "reading_items": {m: sum(10 if t["type"] == "complete_words" else len(t["questions"]) for t in ts)
                          for m, ts in reading.items()},
        "listening_items": {m: sum(1 if t["type"] == "choose_response" else len(t["questions"]) for t in ts)
                            for m, ts in listening.items()},
        "reading_keys": dict(Counter(q["answer"] for ts in reading.values() for t in ts
                                     for q in t.get("questions", []))),
        "listening_keys": dict(Counter(
            key for ts in listening.values() for t in ts
            for key in ([t["answer"]] if t["type"] == "choose_response" else [q["answer"] for q in t["questions"]]))),
        "academic_passage_words": [sum(words(p) for p in t["paragraphs"]) for ts in reading.values() for t in ts
                                   if t["type"] == "academic"],
        "talk_words": [words(t["script"]) for ts in listening.values() for t in ts if t["type"] == "talk"],
        "listening_script_words": sum(
            words(t["prompt"]) if t["type"] == "choose_response"
            else words(t["script"]) if isinstance(t["script"], str)
            else sum(words(line) for _, line in t["script"])
            for ts in listening.values() for t in ts),
    }


def main() -> int:
    only = {int(a) for a in sys.argv[1:] if a.isdigit()}
    check = "--check" in sys.argv  # validate the named form(s) only and write nothing
    rep = Report()
    forms: dict[int, dict] = {}
    for n in FORMS:
        if not (HERE / f"form{n:02d}.py").exists() or (check and n not in only):
            continue
        try:
            module = importlib.import_module(f"form{n:02d}")
        except Exception as error:  # a broken source file must not hide the other forms
            rep.err(f"form {n:02d}", f"cannot be imported: {error!r}")
            continue
        form = module.FORM
        if form.get("number") != n:
            rep.err(f"form {n:02d}", f"FORM['number'] is {form.get('number')!r}")
            continue
        before = len(rep.errors)
        try:
            validate(form, rep)
        except Exception as error:
            rep.err(f"form {n:02d}", f"validation crashed: {error!r}")
        form["_valid"] = len(rep.errors) == before
        forms[n] = form

    seen: dict[tuple[str, str], str] = {}
    for n, form in forms.items():
        if not form["_valid"]:
            continue
        for where, category, value in fingerprints(form):
            if not value:
                continue
            first = seen.setdefault((category, value), where)
            if first != where:
                rep.err(where, f"same {category} as {first}")

    if check:
        for line in rep.warnings:
            print("warning:", line)
        for line in rep.errors:
            print("ERROR:", line)
        for n, form in forms.items():
            if form["_valid"]:
                print(f"form {n:02d} statistics:", json.dumps(stats(form)))
        print(f"checked: {sorted(forms)} - errors: {len(rep.errors)} - warnings: {len(rep.warnings)}")
        return 1 if rep.errors else 0

    report = {"date": DATE, "forms": {}, "errors": rep.errors, "warnings": rep.warnings}
    hashes: dict[str, str] = {}
    for n, form in forms.items():
        valid = form.pop("_valid")
        if not valid:
            report["forms"][f"{n:02d}"] = {"valid": False}
            continue
        report["forms"][f"{n:02d}"] = {"valid": True, "theme": form["theme"], **stats(form)}
        if only and n not in only:
            continue
        numbered = number_form(form)
        folder = PACK / f"mock-{n:02d}"
        folder.mkdir(exist_ok=True)
        outputs = {
            "candidate.md": render_candidate(numbered),
            "answers.md": render_answers(numbered),
            "examiner.md": render_examiner(numbered),
            "mock.json": json.dumps({"id": f"toefl-ibt-{n:02d}", "format": "TOEFL iBT, January 2026", "date": DATE,
                                     "minutes": MINUTES, "routing": ROUTING, **numbered},
                                    ensure_ascii=False, indent=2) + "\n",
        }
        for name, text in outputs.items():
            (folder / name).write_text(text, encoding="utf-8", newline="\n")

    for path in sorted(PACK.rglob("*")):
        if path.is_file() and path.name not in ("manifest.json", "validation-report.json") \
                and "__pycache__" not in path.parts:
            hashes[path.relative_to(PACK).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    (PACK / "validation-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                                                 encoding="utf-8", newline="\n")
    (PACK / "manifest.json").write_text(json.dumps({"date": DATE, "sha256": hashes}, indent=2) + "\n",
                                        encoding="utf-8", newline="\n")

    for line in rep.warnings:
        print("warning:", line)
    for line in rep.errors:
        print("ERROR:", line)
    built = [n for n, data in report["forms"].items() if data["valid"]]
    print(f"forms valid: {', '.join(built) or 'none'} - errors: {len(rep.errors)} - warnings: {len(rep.warnings)}")
    return 1 if rep.errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
