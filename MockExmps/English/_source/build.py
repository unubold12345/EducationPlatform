"""Build ЭЕШ English mock JSON files from per-year data modules and validate them.

Usage: python -I build.py <repo_root> [year ...]   (no years: rebuild every year)
"""
import collections, importlib.util, json, pathlib, random, re, sys

HERE = pathlib.Path(__file__).resolve().parent
LETTERS = "ABCDE"
STATUS = ("Original practice content written by Claude Code (Opus 5.5) on 2026-11-06 to mirror the official "
          "paper's structure, task types, timing and level. Not copied from БҮТ papers. Teacher review pending. "
          "Not used on the website.")


def load(year):
    spec = importlib.util.spec_from_file_location(f"data_{year}", HERE / f"data_{year}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.MOCKS


class Numberer:
    def __init__(self, seed, count=46):
        targets = list(LETTERS) * 10
        rng = random.Random(seed)
        rng.shuffle(targets)
        self.targets = targets[:count]
        self.n = 0
        self.key = collections.OrderedDict()
        self.points = 0
        self.five = 0

    def q(self, item, pts, fixed=False):
        stem, opts, ans = item
        k = len(opts)
        # four-option items only occur with a printed, shared bank (2025 reading task 2)
        assert k == 5 or (k == 4 and fixed), (self.n + 1, opts)
        assert ans in LETTERS[:k], (self.n + 1, ans)
        assert len(set(opts)) == k, ("duplicate option", self.n + 1, opts)
        self.five += k == 5
        # move the correct option to a balanced target letter by swapping two options
        opts = list(opts)
        i, j = LETTERS.index(ans), (LETTERS.index(ans) if fixed else LETTERS.index(self.targets[self.n]))
        opts[i], opts[j] = opts[j], opts[i]
        ans = LETTERS[j]
        for letter, part in re.findall(r"\[([A-E]) ([^\]]+)\]", stem or ""):
            assert opts[LETTERS.index(letter)] == part, ("marked part does not match its option", self.n + 1, letter, part)
        self.n += 1
        self.key[str(self.n)] = ans
        self.points += pts
        out = {"number": self.n}
        if stem:
            out["stem"] = stem
        out["options"] = dict(zip(LETTERS[:k], opts))
        out["answer"] = ans
        out["points"] = pts
        return out

    def qs(self, items, pts, fixed=False):
        return [self.q(i, pts, fixed) for i in items]

    def bank(self, bank, answers, pts):
        """Numbered blanks that share one printed bank of options, so the letters are fixed by the bank."""
        return [self.q(("", bank, a), pts, fixed=True) for a in answers]

    def pairs(self, tid, instructions, items, choices, ans, numbers=None, text=None):
        """Items a-h matched to numbered choices (some extra); `items` may be blank labels for gaps in `text`."""
        numbers = numbers or "123456789"[:len(choices)]
        assert len(items) == len(ans) and len(choices) == len(numbers) >= len(items), tid
        assert len(set(ans)) == len(ans) and set(ans) <= set(numbers), (tid, ans)
        assert len(set(choices)) == len(choices), tid
        labels = "abcdefgh"[:len(items)]
        out = {"id": tid, "instructions": instructions, "points": len(items), "pointsPerItem": 1}
        if text:
            out["text"] = text
        out["items"] = [{"label": l, "text": t} if t else {"label": l} for l, t in zip(labels, items)]
        out["choices"] = [{"number": int(n), "text": c} for n, c in zip(numbers, choices)]
        out["answer"] = {l: int(d) for l, d in zip(labels, ans)}
        out["answerDigits"] = ans
        self.key[tid] = ans
        self.points += len(items)
        return out

    def choose(self, tid, groups):
        """Sentences a-h in groups, each sentence with its own five numbered options (2025 Part II 2.2)."""
        out = {"id": tid, "points": 0, "pointsPerItem": 1, "groups": []}
        digits, labels = "", iter("abcdefgh")
        for instructions, rows in groups:
            g = {"instructions": instructions, "items": []}
            for sentence, opts, ans in rows:
                label = next(labels)
                assert len(opts) == 5 and len(set(opts)) == 5 and 1 <= ans <= 5, (tid, label)
                g["items"].append({"label": label, "text": sentence,
                                   "choices": {str(k + 1): o for k, o in enumerate(opts)}, "answer": ans})
                digits += str(ans)
            out["groups"].append(g)
            out["points"] += len(rows)
        out["answerDigits"] = digits
        self.key[tid] = digits
        self.points += out["points"]
        return out

    def pergap(self, tid, instructions, text, gaps, labels="abcdef"):
        """A text whose gaps each have their own five numbered options (2026 Part II 2.1 and 2.3)."""
        out = {"id": tid, "instructions": instructions, "points": len(gaps), "pointsPerItem": 1, "text": text, "gaps": []}
        digits = ""
        for label, (opts, ans) in zip(labels, gaps):
            assert len(opts) == 5 and len(set(opts)) == 5 and 1 <= ans <= 5, (tid, label)
            out["gaps"].append({"label": label, "choices": {str(k + 1): o for k, o in enumerate(opts)}, "answer": ans})
            digits += str(ans)
        out["answerDigits"] = digits
        self.key[tid] = digits
        self.points += len(gaps)
        return out

    def matched(self, tid, groups):
        """Groups of four words matched to five shared choices, one extra (2026 Part II 2.2)."""
        out = {"id": tid, "points": 0, "pointsPerItem": 1, "groups": []}
        digits, labels = "", iter("abcdefgh")
        for instructions, items, choices, ans in groups:
            assert len(items) == 4 and len(choices) == 5 and len(ans) == 4 and len(set(ans)) == 4, tid
            ls = [next(labels) for _ in items]
            out["groups"].append({"instructions": instructions, "items": [{"label": l, "text": t} for l, t in zip(ls, items)],
                                  "choices": [{"number": k + 1, "text": c} for k, c in enumerate(choices)],
                                  "answer": {l: int(d) for l, d in zip(ls, ans)}})
            digits += ans
            out["points"] += 4
        out["answerDigits"] = digits
        self.key[tid] = digits
        self.points += out["points"]
        return out

    def match(self, tid, task, instructions):
        items, choices, ans = task["items"], task["choices"], task["answer"]
        assert len(items) == 5 and len(ans) == 5, tid
        assert len(set(ans)) == 5, (tid, "answers must be distinct")
        assert all(1 <= int(d) <= len(choices) for d in ans), tid
        self.key[tid] = ans
        self.points += 5
        out = {"id": tid, "instructions": instructions, "points": 5, "pointsPerItem": 1}
        if task.get("text"):
            out["text"] = task["text"]
        out["items"] = [{"label": l, "text": t} for l, t in zip("abcde", items)]
        out["choices"] = [{"number": i + 1, "text": c} for i, c in enumerate(choices)]
        out["answer"] = {l: int(d) for l, d in zip("abcde", ans)}
        out["answerDigits"] = ans
        return out


def task(title, instructions, questions, extra=None):
    t = {"title": title, "instructions": instructions}
    if extra:
        t.update(extra)
    t["questions"] = questions
    return t


def build_2018(m):
    N = Numberer(m["theme"])
    part1 = {"part": "PART I", "sections": [
        {"title": "SECTION 1: GRAMMAR", "minutes": 8, "tasks": [
            task("Grammar", "Read the following sentences. Choose the correct answer for each gap. /12 x 1 = 12 points/",
                 N.qs(m["grammar"], 1))]},
        {"title": "SECTION 2: VOCABULARY", "minutes": 12, "tasks": [
            task("Task 1", "Read the sentences and choose the correct word for each blank. /10 x 2 = 20 points/",
                 N.qs(m["vocab1"], 2)),
            task("Task 2", "Choose the correct word to complete the conversations. /3 x 2 = 6 points/",
                 N.qs(m["vocab2"], 2)),
            task("Task 3", "Choose the correct prefix to build the antonym of the adjectives. /2 x 2 = 4 points/",
                 N.qs(m["vocab3"], 2))]},
        {"title": "SECTION 3: COMMUNICATION", "minutes": 10, "tasks": [
            task("Conversation 1", "Read the conversations and choose the best answers for them. There are 2 blanks in "
                 "the conversation (28-29). Fill in the blanks from the given options. /5 x 2 = 10 points/",
                 None, {"text": m["conv1"]["text"]}),
            task("Conversation 2", "", None, {"text": m["conv2"]["text"]})]},
        {"title": "SECTION 4: READING", "minutes": 20, "tasks": [
            task("Passage 1", "Read the passage and choose the correct answers. /4 x 2 = 8 points/", None,
                 {"text": m["read1"]["text"]}),
            task("Passage 2", "Read the text and choose the correct answers. There are 3 blanks in the text (37-39). "
                 "Fill in the blanks from the given options. /4 x 2 = 8 points/", None, {"text": m["read2"]["text"]})]},
    ]}
    s3, s4 = part1["sections"][2]["tasks"], part1["sections"][3]["tasks"]
    s3[0]["questions"] = N.qs(m["conv1"]["questions"], 2)
    s3[1]["questions"] = N.qs(m["conv2"]["questions"], 2)
    s4[0]["questions"] = N.qs(m["read1"]["questions"], 2)
    s4[1]["questions"] = N.qs(m["read2"]["questions"], 2)
    p2 = m["part2"]
    part2 = {"part": "PART II", "minutes": 20, "tasks": [
        N.match("2.1", p2["2.1"], "Read the questions (a-e) and complete them with the appropriate words (1-7). "
                "/5 x 1 = 5 points/ (5 min)"),
        N.match("2.2", p2["2.2"], "Read the incomplete sentences (a-e) and fill in the gaps with the appropriate "
                "words (1-7). /5 x 1 = 5 points/ (5 min)"),
        N.match("2.3", p2["2.3"], "Match the beginnings of the sentences (a-e) with the appropriate endings (1-7). "
                "/5 x 1 = 5 points/ (5 min)"),
        N.match("2.4", p2["2.4"], p2["2.4"]["instructions"] + " /5 x 1 = 5 points/ (5 min)"),
    ]}
    L = m["listening"]
    part3 = {"part": "PART III", "sections": [{"title": "LISTENING", "minutes": 10, "tasks": [
        task("Listening", L["instructions"] + " You have 1 minute and 30 seconds to look through the questions before "
             "you listen. You will listen to the passage twice only, so listen carefully. /6 x 2 = 12 points/",
             N.qs(L["questions"], 2), {"audioScript": L["script"]})]}]}
    # keep questions after the listening script for readability
    return N, [part1, part2, part3], 80


def build_2019(m):
    N = Numberer(m["theme"])
    part1 = {"part": "PART I", "sections": [
        {"title": "SECTION 1. GRAMMAR", "minutes": 10, "tasks": [
            task("Grammar", "Read the following sentences. Choose the best answer for each gap. /12 x 1 = 12 points/",
                 N.qs(m["grammar"], 1))]},
        {"title": "SECTION 2. VOCABULARY", "minutes": 15, "tasks": [
            task("Task 1", "Read the sentences and choose the best one for each blank. /6 x 2 = 12 points/",
                 N.qs(m["vocab1"], 2)),
            task("Task 2", "Choose the one that has the similar meaning to the underlined word. /3 x 2 = 6 points/",
                 N.qs(m["vocab2"], 2)),
            task("Task 3", "Phrasal verbs. Choose the correct particles. /4 x 2 = 8 points/", N.qs(m["vocab3"], 2)),
            task("Task 4", "Choose the best answer. /2 x 2 = 4 points/", N.qs(m["vocab4"], 2))]},
        {"title": "SECTION 3. COMMUNICATION", "minutes": 5, "tasks": [
            task("Communication", "Choose the correct question that goes with the answers. /5 x 2 = 10 points/",
                 N.qs(m["comm"], 2))]},
        {"title": "SECTION 4. READING", "minutes": 20, "tasks": [
            task("Reading", "Read the article and choose the best answer for the questions. /8 x 2 = 16 points/", None,
                 {"passageTitle": m["reading"]["title"], "text": m["reading"]["text"]})]},
    ]}
    part1["sections"][3]["tasks"][0]["questions"] = N.qs(m["reading"]["questions"], 2)
    p2 = m["part2"]
    part2 = {"part": "PART II", "minutes": 20, "tasks": [
        N.match("2.1", p2["2.1"], "Match the beginnings of the sentences (a-e) with the appropriate endings (1-6). "
                "There is one extra ending in column 2. /5 x 1 = 5 points/"),
        N.match("2.2", p2["2.2"], "Choose an appropriate answer for each question. There is one extra answer in "
                "column 2. /5 x 1 = 5 points/"),
        N.match("2.3", p2["2.3"], "Read the text and fill in the gaps (a-e) with the appropriate adjectives (1-6). "
                "There is one extra adjective. /5 x 1 = 5 points/"),
        N.match("2.4", p2["2.4"], p2["2.4"]["instructions"] + " There is one extra ending in column 2. "
                "/5 x 1 = 5 points/"),
    ]}
    for t in p2.values():
        assert len(t["choices"]) == 6
    L = m["listening"]
    part3 = {"part": "PART III", "sections": [{"title": "LISTENING", "minutes": 10, "tasks": [
        task("Listening", L["instructions"] + " For questions 41-46 decide which of the choices A, B, C, D or E is the "
             "correct answer. You have 45 seconds to look through the questions before you listen. You will listen "
             "twice only, so listen carefully. /6 x 2 = 12 points/", N.qs(L["questions"], 2),
             {"audioScript": L["script"]})]}]}
    return N, [part1, part2, part3], 80


def build_2020(m):
    N = Numberer(m["theme"])
    part1 = {"part": "PART I", "sections": [
        {"title": "SECTION 1. GRAMMAR", "points": 26, "minutes": 15, "tasks": [
            task("Task 1", "Read the following sentences and choose the correct answer for each gap. /12*1=12/",
                 N.qs(m["grammar1"], 1)),
            task("Task 2", "Read the sentences and select the correct answer for each blank. /4*2=8/",
                 N.qs(m["grammar2"], 2)),
            task("Task 3", "Identify one underlined part that should be corrected in the sentences. Underlined parts "
                 "are marked [A ...], [B ...] and so on. /3*2=6/", N.qs(m["errors"], 2, fixed=True))]},
        {"title": "SECTION 2. VOCABULARY", "points": 32, "minutes": 20, "tasks": [
            task("Task 1", "Read the sentences and complete the gaps with the most appropriate word. /9*2=18/",
                 N.qs(m["vocab1"], 2)),
            task("Task 2", "Complete the sentences with the correct particle of the phrasal verbs. /4*2=8/",
                 N.qs(m["phrasal"], 2)),
            task("Task 3", "Find out the appropriate meaning to the underlined parts (idioms) of the sentences. /3*2=6/",
                 N.qs(m["idioms"], 2))]},
        {"title": "SECTION 3. COMMUNICATION", "points": 10, "minutes": 10, "tasks": [
            task("Conversation", "Read the conversation and choose the best answer for questions 36-37, and complete "
                 "blanks 38-40 from the given options. /5*2=10/", None, {"text": m["conv"]["text"]})]},
        {"title": "SECTION 4. READING", "points": 12, "minutes": 15, "tasks": [
            task("Reading", "Read the text and choose the best answers. /6*2=12/", None,
                 {"passageTitle": m["reading"]["title"], "text": m["reading"]["text"]})]},
    ]}
    part1["sections"][2]["tasks"][0]["questions"] = N.qs(m["conv"]["questions"], 2)
    part1["sections"][3]["tasks"][0]["questions"] = N.qs(m["reading"]["questions"], 2)
    p2 = m["part2"]
    part2 = {"part": "PART II", "points": 20, "minutes": 20, "tasks": [
        N.match("2.1", p2["2.1"], "Fill in the blanks (a-e) with suitable linking words (1-7). There are two extra "
                "items that you don't need to use. /5*1=5/"),
        N.match("2.2", p2["2.2"], "Match the words (a-e) with their definitions (1-7). There are two extra items that "
                "you don't need to use. /5*1=5/"),
        N.match("2.3", p2["2.3"], "Match the situations (a-e) with the suggestions (1-7). There are two extra items "
                "that you don't need to use. /5*1=5/"),
        N.match("2.4", p2["2.4"], p2["2.4"]["instructions"] + " There are two extra items that you don't need to "
                "use. /5*1=5/"),
    ]}
    return N, [part1, part2], 80


def build_2026(m):
    N = Numberer(m["theme"], 47)
    sec = lambda title, tasks: {"title": title, "tasks": tasks}
    part1 = {"part": "PART I", "note": "47 multiple-choice items, 80 points.", "sections": [
        sec("SECTION 1. GRAMMAR", [
            task("Task 1", "Choose the correct answers. /6x1=6 points/", N.qs(m["g1"], 1)),
            task("Task 2", "Choose the correct answers. /7x2=14 points/", N.qs(m["g2"], 2)),
            task("Task 3", "Choose the correct answers. /3x2=6 points/", N.qs(m["g3"], 2)),
            task("Task 4", "Identify the underlined part that should be corrected in each sentence. Underlined parts are marked [A ...] to [E ...]. /2x3=6 points/", N.qs(m["errors"], 3, fixed=True))]),
        sec("SECTION 2. VOCABULARY", [
            task("Task 1", "Choose the correct answers. /9x1=9 points/", N.qs(m["v1"], 1)),
            task("Task 2", "Choose the correct meaning of the underlined phrasal verbs to complete the sentences. /2x2=4 points/", N.qs(m["v2"], 2)),
            task("Task 3", "Choose the most suitable word to complete each collocation. /2x2=4 points/", N.qs(m["v3"], 2)),
            task("Task 4", "Read these situations and choose the correct answers. /2x3=6 points/", N.qs(m["v4"], 3))]),
        sec("SECTION 3. COMMUNICATION", [
            task("Task 1", "Read the conversations and choose the most appropriate answers. /3x2=6 points/", N.qs(m["c1"], 2)),
            task("Task 2", "Read the conversations and choose the most appropriate responses. /2x2=4 points/", N.qs(m["c2"], 2))]),
        sec("SECTION 4. READING", [
            task("Task 1", "Read the passage and then answer the questions below. /6x1=6 points/", None,
                 {"passageTitle": m["reading"]["title"], "text": m["reading"]["text"]}),
            task("Task 2", "Read the summary of the passage and fill in the blanks with the following words or phrases. There are two extra words or phrases. /3x3=9 points/", None,
                 {"wordBank": dict(zip(LETTERS, m["summary"]["bank"])), "text": m["summary"]["text"]})]),
    ]}
    r = part1["sections"][3]["tasks"]
    r[0]["questions"] = N.qs(m["reading"]["questions"], 1)
    bank = m["summary"]["bank"]
    r[1]["questions"] = N.qs([("", bank, a) for a in m["summary"]["answers"]], 3, fixed=True)
    p2 = m["part2"]
    part2 = {"part": "PART II", "note": "3 tasks, 20 points.", "tasks": [
        N.pergap("2.1", "Read the paragraph and choose the correct word form that best fits in each blank. /6x1=6 points/", p2["2.1"]["text"], p2["2.1"]["gaps"]),
        N.matched("2.2", [("Match the words with their DEFINITIONS. There is one extra definition. /4x1=4 points/", *p2["2.2"]["definitions"]),
                          ("Match the words with their SYNONYMS. There is one extra word. /4x1=4 points/", *p2["2.2"]["synonyms"])]),
        N.pergap("2.3", "Read the short passage and choose the best word to fit in each blank. /6x1=6 points/", p2["2.3"]["text"], p2["2.3"]["gaps"]),
    ]}
    return N, [part1, part2], None


def sec(title, tasks):
    return {"title": title, "tasks": tasks}


def build_2022(m):
    N = Numberer(m["theme"], 47)
    part1 = {"part": "PART I", "note": "47 multiple-choice items, 80 points.", "sections": [
        sec("SECTION 1. GRAMMAR", [
            task("Task 1", "Read the following sentences and choose the correct answer to complete each sentence. /4x1=4 points/", N.qs(m["g1"], 1)),
            task("Task 2", "Choose the correct answer to complete each sentence. /11x2=22 points/", N.qs(m["g2"], 2)),
            task("Task 3", "Identify the underlined part that should be corrected in each sentence. Underlined parts are marked [A ...] to [E ...]. /2x2=4 points/", N.qs(m["errors"], 2, fixed=True))]),
        sec("SECTION 2. VOCABULARY", [
            task("Task 1", "Read the sentences and choose the correct word to complete each sentence. /10x1=10 points/", N.qs(m["v1"], 1)),
            task("Task 2", "Complete the phrasal verbs with the correct particles. /3x2=6 points/", N.qs(m["phrasal"], 2)),
            task("Task 3", "Choose the correct meaning of the underlined idioms. /3x2=6 points/", N.qs(m["idioms"], 2))]),
        sec("SECTION 3. COMMUNICATION", [
            task("Task 1", "Read the conversations and choose the best answers. /3x2=6 points/", N.qs(m["c1"], 2)),
            task("Task 2", "Read the short conversations and choose the best answers. /2x2=4 points/", N.qs(m["c2"], 2))]),
        sec("SECTION 4. READING", [
            task("Task 1", "Read the passage and choose the correct answers. /6x2=12 points/", None, {"text": m["reading"]["text"]}),
            task("Task 2", m["cloze"]["instructions"] + " /3x2=6 points/", None, {"text": m["cloze"]["text"]})]),
    ]}
    r = part1["sections"][3]["tasks"]
    r[0]["questions"] = N.qs(m["reading"]["questions"], 2)
    r[1]["questions"] = N.qs([("", o, a) for o, a in m["cloze"]["gaps"]], 2)
    p2 = m["part2"]
    part2 = {"part": "PART II", "note": "3 tasks, 20 points.", "tasks": [
        N.pairs("2.1", "Combine each phrase in column A (a-f) with a suitable phrase from column B (1-8). Not all phrases in column B will be used. /6x1=6 points/", *p2["2.1"]),
        N.pairs("2.2", "Match the words (a-f) with their definitions (1-8). There are two extra definitions. /6x1=6 points/", *p2["2.2"]),
        N.pergap("2.3", "Choose the correct word form that best fits in each blank. /8x1=8 points/", p2["2.3"]["text"], p2["2.3"]["gaps"], "abcdefgh"),
    ]}
    return N, [part1, part2], None


def build_2023(m):
    N = Numberer(m["theme"], 47)
    part1 = {"part": "PART I", "note": "47 multiple-choice items, 80 points.", "sections": [
        sec("SECTION 1. GRAMMAR", [
            task("Task 1", "Choose the correct answers to complete each sentence. /13x1=13 points/", N.qs(m["g1"], 1)),
            task("Task 2", "Identify the underlined part that should be corrected in each sentence. Underlined parts are marked [A ...] to [E ...]. /3x3=9 points/", N.qs(m["errors"], 3, fixed=True)),
            task("Task 3", "Complete the phrasal verbs with the correct particles. /2x3=6 points/", N.qs(m["phrasal"], 3))]),
        sec("SECTION 2. VOCABULARY", [
            task("Task 1", "Choose the correct word and phrase to complete each sentence. /7x1=7 points/", N.qs(m["v1"], 1)),
            task("Task 2", "Choose the appropriate reaction of the man to what the woman says. /2x1=2 points/", N.qs(m["reaction"], 1)),
            task("Task 3", "Choose the most suitable word to complete each collocation fork. /2x3=6 points/", N.qs(m["forks"], 3)),
            task("Task 4", "Choose the correct phrase to complete a student's comment on study skills. /1x3=3 points/", N.qs([m["study"]], 3)),
            task("Task 5", m["solution"]["instructions"] + " /1x3=3 points/", N.qs([m["solution"]["item"]], 3)),
            task("Task 6", "Choose the correct meaning for the underlined idioms. /2x3=6 points/", N.qs(m["idioms"], 3))]),
        sec("SECTION 3. COMMUNICATION", [
            task("Task 1", "Read the conversations and choose the correct answers. /2x1=2 points/", N.qs(m["c1"], 1)),
            task("Task 2", "Choose the most polite form. /1x2=2 points/", N.qs([m["polite"]], 2)),
            task("Task 3", "Choose the most appropriate phrase instead of the underlined word. /1x3=3 points/", N.qs([m["instead"]], 3)),
            task("Task 4", "Read the short conversation and choose the correct answer. /1x3=3 points/", N.qs([m["short"]], 3))]),
        sec("SECTION 4. READING", [
            task("Task 1", "Read the passage, then read again and choose the correct answers. Questions 39-42: /4x1=4 points/; questions 43-44: /2x3=6 points/",
                 N.qs(m["reading"]["questions"][:4], 1) + N.qs(m["reading"]["questions"][4:], 3), {"text": m["reading"]["text"]}),
            task("Task 2", m["games"]["instructions"] + " /2x1=2 points/", N.qs(m["games"]["items"], 1)),
            task("Task 3", "Complete the sentence with the most appropriate phrase. /1x3=3 points/", N.qs([m["games"]["phrase"]], 3))]),
    ]}
    p2 = m["part2"]
    part2 = {"part": "PART II", "note": "3 tasks, 20 points.", "tasks": [
        N.pergap("2.1", "Choose the correct form that best fits each blank. /6x1=6 points/", p2["2.1"]["text"], p2["2.1"]["gaps"]),
        N.pairs("2.2", "Choose the word that has a similar meaning to the underlined word. Match the words (a-h) with their synonyms in the sentences (1-8). /8x1=8 points/", *p2["2.2"]),
        N.pergap("2.3", "Choose the best word to fit each blank. /6x1=6 points/", p2["2.3"]["text"], p2["2.3"]["gaps"]),
    ]}
    return N, [part1, part2], None


def build_2024(m):
    N = Numberer(m["theme"], 47)
    conv, homo, summ = m["responses"], m["homonym"], m["summary"]
    part1 = {"part": "PART I", "note": "47 multiple-choice items, 80 points.", "sections": [
        sec("SECTION 1. GRAMMAR", [
            task("Task 1", "Choose the most suitable word to complete each sentence. /6x1=6 points/", N.qs(m["g1"], 1)),
            task("Task 2", "Choose the word or phrase that best completes each sentence. /7x2=14 points/", N.qs(m["g2"], 2)),
            task("Task 3", "Read the short conversation and choose the appropriate response. There are two extra. /3x2=6 points/",
                 N.bank(conv["bank"], conv["answers"], 2), {"wordBank": dict(zip(LETTERS, conv["bank"])), "text": conv["text"]}),
            task("Task 4", "Read the sentences and choose the best options that transformed correctly using the KEY WORDS IN BOLD. /2x3=6 points/", N.qs(m["transform"], 3))]),
        sec("SECTION 2. VOCABULARY", [
            task("Task 1", "Choose the correct word to complete each sentence. /4x1=4 points/", N.qs(m["v1"], 1)),
            task("Task 2", "Choose the word with different meanings that best fits in all three gaps. /3x1=3 points/",
                 N.bank(homo["bank"], homo["answers"], 1), {"wordBank": dict(zip(LETTERS, homo["bank"])), "text": homo["text"]}),
            task("Task 3", "Find the most suitable phrase for each situation. /2x1=2 points/", N.qs(m["situations"], 1)),
            task("Task 4", "Choose the correct prefix and suffix that correspond to the following collocations. /2x2=4 points/", N.qs(m["affixes"], 2)),
            task("Task 5", "Fill in the correct preposition for each sentence. /2x2=4 points/", N.qs(m["prepositions"], 2)),
            task("Task 6", "Choose the correct meaning for each idiom underlined. /2x3=6 points/", N.qs(m["idioms"], 3))]),
        sec("SECTION 3. COMMUNICATION", [
            task("Task 1", m["conversation"]["instructions"] + " /3x2=6 points/", N.qs(m["conversation"]["questions"], 2)),
            task("Task 2", "Read the conversations and fill in the missing phrasal verbs. /2x2=4 points/", N.qs(m["phrasal"], 2))]),
        sec("SECTION 4. READING", [
            task("Task 1", "Read the article and then answer the questions below. /6x1=6 points/", N.qs(m["reading"]["questions"], 1),
                 {"passageTitle": m["reading"]["title"], "text": m["reading"]["text"]}),
            task("Task 2", "Read again and complete this summary of the article with the following words. There are two extra. /3x3=9 points/",
                 N.bank(summ["bank"], summ["answers"], 3), {"wordBank": dict(zip(LETTERS, summ["bank"])), "text": summ["text"]})]),
    ]}
    p2 = m["part2"]
    part2 = {"part": "PART II", "note": "3 tasks, 20 points.", "tasks": [
        N.pergap("2.1", "Read the passage and fill in the gaps with correct word forms. /6x1=6 points/", p2["2.1"]["text"], p2["2.1"]["gaps"]),
        N.pairs("2.2", "Read the passage in 2.1 again and match the words (a-h) to their definitions. There are two extra. The tenth definition is numbered 0. /8x1=8 points/",
                *p2["2.2"], numbers="1234567890"),
        N.pergap("2.3", "Read the short passage and find the SYNONYM of the word in bold. /6x1=6 points/", p2["2.3"]["text"], p2["2.3"]["gaps"]),
    ]}
    return N, [part1, part2], None


def build_2025(m):
    N = Numberer(m["theme"], 47)
    story, gaps2 = m["story"], m["gapped"]
    part1 = {"part": "PART I", "note": "47 multiple-choice items, 80 points.", "sections": [
        sec("SECTION 1. GRAMMAR", [
            task("Task 1", "Choose the correct answer to complete the sentences. /9x1=9 points/", N.qs(m["g1"], 1)),
            task("Task 2", "Choose the word or phrase that best completes each sentence. /4x2=8 points/", N.qs(m["g2"], 2)),
            task("Task 3", "Identify the one underlined word that is not correct. Underlined parts are marked [A ...] to [E ...]. /3x3=9 points/", N.qs(m["errors"], 3, fixed=True))]),
        sec("SECTION 2. VOCABULARY", [
            task("Task 1", "Choose the best answer. /9x1=9 points/", N.qs(m["v1"], 1)),
            task("Task 2", "Use these verbs in the box to complete the story. /5x2=10 points/",
                 N.bank(story["bank"], story["answers"], 2), {"wordBank": dict(zip(LETTERS, story["bank"])), "text": story["text"]}),
            task("Task 3", "Choose the best answers. /3x3=9 points/", N.qs(m["v3"], 3))]),
        sec("SECTION 3. COMMUNICATION", [
            task("Task 1", "Read the conversation and choose the correct answer. /3x2=6 points/", N.qs(m["c1"], 2)),
            task("Task 2", "Choose the best answer. /2x3=6 points/", N.qs(m["c2"], 3))]),
        sec("SECTION 4. READING", [
            task("Task 1", "Read the passage and choose the correct answers. /6x1=6 points/", N.qs(m["reading"]["questions"], 1), {"text": m["reading"]["text"]}),
            task("Task 2", "Read through the following text and then choose the best phrase or sentence to fill each of the blanks, from A-D. There are two extra. /2x3=6 points/",
                 N.bank(gaps2["bank"], gaps2["answers"], 3), {"wordBank": dict(zip("ABCD", gaps2["bank"])), "text": gaps2["text"]}),
            task("Task 3", "Read the following statement and choose the letter of the best answer based on the information given. /1x2=2 points/",
                 N.qs([m["statement"]["item"]], 2), {"text": m["statement"]["text"]})]),
    ]}
    p2 = m["part2"]
    part2 = {"part": "PART II", "note": "3 tasks, 20 points.", "tasks": [
        N.pergap("2.1", "Read the passage and fill in the gaps with correct word forms. /6x1=6 points/", p2["2.1"]["text"], p2["2.1"]["gaps"]),
        N.choose("2.2", [("Read the sentences and find the SYNONYM of the word in bold. /4x1=4 points/", p2["2.2"]["synonyms"]),
                         ("Choose the word that is the opposite (ANTONYM) of the underlined word. /4x1=4 points/", p2["2.2"]["antonyms"])]),
        N.pairs("2.3", "Complete the text below with these words in the box (1-6). /6x1=6 points/", [""] * 6,
                p2["2.3"]["box"], p2["2.3"]["answer"], text=p2["2.3"]["text"]),
    ]}
    return N, [part1, part2], None


BUILDERS = {2018: build_2018, 2019: build_2019, 2020: build_2020, 2022: build_2022, 2023: build_2023,
            2024: build_2024, 2025: build_2025, 2026: build_2026}
EXPECTED = {2018: 46, 2019: 46, 2020: 46, 2022: 47, 2023: 47, 2024: 47, 2025: 45, 2026: 47}  # five-option items
ITEMS = {2025: 47}  # 2025 items 45-46 have four options (A-D) from a shared bank
VARIANT = {2023: "D", 2025: "B"}
NOTES = {
    2022: ("Follows the 2022 ЭЕШ Variant A (Internet Archive copy of eec.mn/post/2213): Part I 47 items / 80 points, "
           "Part II 3 tasks / 20 points. The paper prints no duration and БҮТ published no key, so durationMinutes is null."),
    2023: ("Follows the 2023 ЭЕШ Variant D, known only from screenshots of a user upload on Scribd, not an official "
           "БҮТ file. Part I 47 items / 80 points, Part II 3 tasks / 20 points. That paper heads its two phrasal-verb items "
           "(17-18) '3x2=6 points', so its printed item points add up to 78; this mock keeps the section's 6 points as "
           "2 x 3 so the total is 100. No duration or key is printed, so durationMinutes is null."),
    2024: ("Follows the 2024 ЭЕШ Variant A, known only from screenshots of a user upload on Scribd, not an official "
           "БҮТ file (the official key upload was deleted). Part I 47 items / 80 points, Part II 3 tasks / 20 points. "
           "No duration is printed, so durationMinutes is null."),
    2025: ("Follows the 2025 Элсэлтийн шалгалт Variant B (Internet Archive copy of eec.mn/post/6273; Variant A was never "
           "archived). Part I 47 items / 80 points, Part II 3 tasks / 20 points. As on the official paper, items 45-46 "
           "share a four-option bank (A-D, two extra). No duration or key is printed, so durationMinutes is null."),
}


def main(root, years=None):
    root = pathlib.Path(root)
    for year, builder in BUILDERS.items():
        if years and year not in years:
            continue
        mocks = load(year)
        assert len(mocks) == 5, (year, len(mocks))
        for i, m in enumerate(mocks, 1):
            N, parts, minutes = builder(m)
            assert N.five == EXPECTED[year] and N.n == ITEMS.get(year, EXPECTED[year]), (year, i, N.five, N.n)
            assert N.points == 100, (year, i, N.points)
            doc = collections.OrderedDict()
            doc["title"] = f"ЭЕШ English mock {year} · Mock {i}"
            doc["subject"] = "English"
            doc["exam"] = "ЭЕШ (Элсэлтийн ерөнхий шалгалт)"
            doc["year"] = year
            doc["mockNumber"] = i
            doc["theme"] = m["theme"]
            v = VARIANT.get(year, "A")
            doc["referenceVariant"] = {"year": year, "variant": v, "folder": f"MockExmps/English/{year}/reference-variant-{v}"}
            doc["status"] = STATUS
            doc["durationMinutes"] = minutes
            doc["totalPoints"] = 100
            if year in NOTES:
                doc["note"] = NOTES[year]
            elif year == 2026:
                doc["note"] = ("Follows the 2026 Элсэлтийн шалгалт (ЭШ) layout: Part I 47 items / 80 points, Part II 3 tasks / "
                               "20 points. The official paper prints no duration and БҮТ published no key, so durationMinutes is null.")
            elif year == 2020:
                doc["note"] = "The 2020 official paper has no listening part; this mock follows that."
            else:
                doc["note"] = ("Part III is a listening task. No audio is provided; a teacher or a text-to-speech tool "
                               "reads audioScript aloud twice.")
            doc["parts"] = parts
            doc["answerKey"] = N.key
            out = root / "MockExmps" / "English" / str(year) / f"mock-{i}.json"
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            dist = collections.Counter(v for k, v in N.key.items() if "." not in k)
            print(year, i, "ok", dict(sorted(dist.items())))


if __name__ == "__main__":
    main(sys.argv[1], [int(y) for y in sys.argv[2:]])
