"""Offline authoring generator for the physics mock exams.

This folder is never imported by the application.  The generator emits one
JSON paper per variant, using the item count and point split of the reference
year.  Answers are calculated from the same data used to write the question.

Every Part I question draws on a pool of versions (contexts and numbers).  A
paper takes version `slot % len(pool)`, where `slot` is the paper's place in a
fixed per-question order of the 60 papers, so a pool of 20 or more puts any one
version in at most three papers, and a pool of 60 in one (2026-11-13, finding
H4 in docs/MOCK_REVIEW.md).  The Part II tasks 2.1–2.4 pick their scenario the
same way, with orders 47–50 and 30 scenarios each, so each task is in two papers.
"""
from __future__ import annotations

import itertools
import json
import math
import random
import re
from decimal import ROUND_HALF_UP, Decimal
from fractions import Fraction
from functools import lru_cache
from pathlib import Path

from figures import render_svg

ROOT = Path(__file__).resolve().parents[1]
AUTHOR = "OpenCode (DeepSeek V4.1 Flash)"
G = 10.0
R = 8.31

# 2015-2016: 46 MCQ / 80 points + 4 constructed / 20 points.
# 2017-2026: 46 MCQ / 76 points + 4 constructed / 24 points.
# 2015 uses the one-point set printed in the official 2015 variant-A key.
ONE_POINT_2015 = {1, 7, 9, 23, 24, 25, 27, 32, 36, 39, 44, 45}
# The 2016 D paper marks questions 1-12 as one point and 13-46 as two points.
ONE_POINT_2016 = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
ONE_POINT_2017_2026 = {
    2, 5, 7, 14, 16, 18, 21, 23, 25, 27, 31, 33, 37, 39, 40, 45,
}


def fmt(value: float, digits: int = 2) -> str:
    """Format a number without trailing zeroes; keep integers clean."""
    if abs(value - round(value)) < 1e-9:
        return str(int(round(value)))
    text = f"{value:.{digits}f}".rstrip("0").rstrip(".")
    return text.replace("-", "−")


def exact(value: Decimal) -> str:
    """A Decimal written plainly, without trailing zeros: 1.6620 -> 1.662, 2.0 -> 2."""
    text = format(value.normalize(), "f")
    return text.rstrip("0").rstrip(".") if "." in text else text


def roundings(value: Decimal, places: tuple[int, ...] = (2, 1)) -> list[str]:
    """Half-up roundings a student may reasonably give besides the exact value (accepted as well)."""
    out: list[str] = []
    for place in places:
        text = exact(value.quantize(Decimal(1).scaleb(-place), rounding=ROUND_HALF_UP))
        if text != exact(value) and text not in out:
            out.append(text)
    return out


def num(value, places: int = 4) -> str:
    """A number as printed: exact, rounded half up to `places` decimals, no trailing zeros, a real minus sign."""
    value = Fraction(repr(value)) if isinstance(value, float) else Fraction(value)
    quantum = Decimal(1).scaleb(-places)
    decimal = (Decimal(value.numerator) / Decimal(value.denominator)).quantize(quantum, rounding=ROUND_HALF_UP)
    text = format(decimal, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    if text in ("-0", ""):
        text = "0"
    return text.replace("-", "−")


def ratio(value) -> str:
    """4, 1/9 or 2/3: a ratio written exactly."""
    value = Fraction(value)
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def sci(value: float, digits: int = 2) -> str:
    """Scientific notation with a middle dot and superscripts."""
    if value == 0:
        return "0"
    exponent = int(math.floor(math.log10(abs(value))))
    mantissa = value / (10 ** exponent)
    mantissa_text = fmt(mantissa, digits)
    superscript = str(exponent).replace("-", "⁻").translate(
        str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
    )
    return f"{mantissa_text}·10{superscript}"


def option(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float)):
        return fmt(float(value))
    return str(value)


NUMBER_UNIT = re.compile(r"^(−?\d+(?:\.\d+)?)(?:\s+(\S.*))?$")


def _number_unit(text: str):
    match = NUMBER_UNIT.match(text)
    return (float(match.group(1).replace("−", "-")), match.group(2) or "") if match else None


def balance_rank(answer: str, wrongs: list[str], rng: random.Random) -> list[str]:
    """Four distractors with the key at a random rank among the numbers.

    The templates' ×2, ÷2, ×1.5 and ×0.75 distractors always bracketed the key, so it was never the smallest or
    largest option (and was the middle one in most items). The template's own distractors are kept first."""
    key = _number_unit(answer)
    parsed = [_number_unit(wrong) for wrong in wrongs]
    if key is None or key[0] <= 0 or any(item is None or item[1] != key[1] for item in parsed):
        return wrongs
    unit = key[1]
    pool = list(wrongs) + [f"{fmt(key[0] * factor)} {unit}".strip() for factor in (2, 0.5, 4, 0.25, 3, 1 / 3, 1.5, 0.75)]
    seen, values, lower, upper = {answer}, [key[0]], [], []
    for candidate in pool:
        value = _number_unit(candidate)[0]
        # Skip repeats and near-repeats (2.66 beside 2.67), which would read as the same answer.
        if candidate in seen or value <= 0 or any(abs(value - other) <= 0.02 * max(value, other) for other in values):
            continue
        seen.add(candidate)
        values.append(value)
        (lower if value < key[0] else upper).append(candidate)
    under = min(rng.randrange(5), len(lower))
    if 4 - under > len(upper):
        under = 4 - len(upper)
    return lower[:under] + upper[: 4 - under]


def pick_wrongs(answer, candidates) -> list[str]:
    """Return four distinct wrong option strings."""
    correct = option(answer)
    result: list[str] = []
    for candidate in candidates:
        text = option(candidate)
        if text != correct and text not in result:
            result.append(text)
        if len(result) == 4:
            return result
    raise ValueError(f"Could not build four distinct distractors for {correct!r}")


def numeric_wrongs(answer: str, unit: str, candidates, places: int = 2) -> list[str]:
    """Up to eight distractors in the key's unit, the template's own values first.

    Paper.mc lets balance_rank choose four of them with the key at a random rank, so it seldom has to fall back
    on bare ×4 and ÷4 multiples of the key."""
    key = Fraction(_number_unit(answer)[0]) if _number_unit(answer) else Fraction(1)
    values = [Fraction(value) for value in candidates if value is not None]
    values += [key * 2, key / 2, key * 3, key / 3]
    texts = []
    for value in values:
        text = f"{num(value, places)} {unit}".strip()
        if value > 0 and text != answer and text not in texts:
            texts.append(text)
    if len(texts) < 4:
        raise ValueError(f"Could not build four distinct distractors for {answer!r}")
    return texts[:8]


def combination_options(rng: random.Random, true_indices: list[int], total: int = 4):
    """Build a correct combination and four distinct wrong combinations."""
    answer = ", ".join(str(index) for index in sorted(true_indices))
    candidates = []
    for mask in range(1, 1 << total):
        text = ", ".join(str(index + 1) for index in range(total) if mask & (1 << index))
        if text != answer:
            candidates.append(text)
    return answer, rng.sample(candidates, 4)


def text_wrongs(answer: str, pool, rng: random.Random, count: int = 4) -> list[str]:
    """`count` distractors from `pool`. One is at least as long as the key whenever the pool allows, so the key
    is never the one uniquely longest option."""
    candidates = [item for item in dict.fromkeys(pool) if item != answer]
    if len(candidates) < count:
        raise ValueError(f"too few distractors for {answer!r}")
    long_enough = [item for item in candidates if len(item) >= len(answer)]
    if not long_enough:
        return rng.sample(candidates, count)
    first = rng.choice(long_enough)
    return [first] + rng.sample([item for item in candidates if item != first], count - 1)


def spread_wrongs(key, below, above, rng: random.Random) -> list:
    """Four distractor values with the key at a random rank among them."""
    below = [value for value in dict.fromkeys(below) if value < key]
    above = [value for value in dict.fromkeys(above) if value > key]
    under = min(rng.randrange(5), len(below))
    if 4 - under > len(above):
        under = 4 - len(above)
    return rng.sample(below, under) + rng.sample(above, 4 - under)


class Paper:
    def __init__(self, year: int, variant: int):
        self.year = year
        self.variant = variant
        self.items: list[dict] = []

    def mc(self, number: int, data: dict, points: int) -> None:
        answer = option(data["answer"])
        wrongs = [option(wrong) for wrong in data["wrong"]]
        rank_rng = random.Random(self.year * 100_000 + self.variant * 1_000 + number + 50_000)
        options = [answer]
        # Labels such as transition numbers 1–5 are not quantities: their distractors stay as written.
        chosen = balance_rank(answer, wrongs, rank_rng) if data.get("rank", True) else wrongs
        for text in chosen[:4]:
            if text not in options:
                options.append(text)
        if len(options) != 5:
            raise ValueError(
                f"{self.year} P{self.variant} Q{number}: "
                f"expected 5 unique options, got {options!r}"
            )
        rng = random.Random(self.year * 100_000 + self.variant * 1_000 + number)
        rng.shuffle(options)
        item = {
            "number": str(number),
            "referenceQuestion": str(number),
            "skill": data["skill"],
            "type": "multiple_choice",
            "points": points,
            "prompt": data["prompt"],
            "options": dict(zip("ABCDE", options)),
            "answer": "ABCDE"[options.index(answer)],
            "answerValue": answer,
            "solution": data["solution"],
        }
        if data.get("figure"):
            item["figure"] = data["figure"]
        self.items.append(item)

    def structured(self, number: str, data: dict, part_points: list[int]) -> None:
        parts = []
        for index, part in enumerate(data["parts"]):
            entry = {
                "id": str(index + 1),
                "points": part_points[index],
                "prompt": part["prompt"],
                "answer": option(part["answer"]),
            }
            # Other accepted answers, e.g. the exact work 1.662 кЖ and its roundings 1.66 and 1.7.
            if part.get("accept"):
                entry["accept"] = [option(value) for value in part["accept"]]
            parts.append(entry)
        item = {
            "number": number,
            "referenceQuestion": number,
            "skill": data["skill"],
            "type": "structured_response",
            "points": sum(part_points),
            "prompt": data["prompt"],
            "parts": parts,
            "solution": data["solution"],
        }
        if data.get("figure"):
            item["figure"] = data["figure"]
        self.items.append(item)

    def save(self) -> None:
        if len(self.items) != 50:
            raise ValueError(f"{self.year} P{self.variant}: expected 50 items")
        mcq = [item for item in self.items if item["type"] == "multiple_choice"]
        constructed = [item for item in self.items if item["type"] == "structured_response"]
        mcq_points = sum(item["points"] for item in mcq)
        constructed_points = sum(item["points"] for item in constructed)
        expected_mcq = 80 if self.year <= 2016 else 76
        expected_constructed = 20 if self.year <= 2016 else 24
        if (len(mcq), len(constructed)) != (46, 4):
            raise ValueError(f"{self.year} P{self.variant}: item counts are wrong")
        if (mcq_points, constructed_points) != (expected_mcq, expected_constructed):
            raise ValueError(
                f"{self.year} P{self.variant}: point totals "
                f"{mcq_points}/{constructed_points} are wrong"
            )

        for item in self.items:
            figure = item.get("figure")
            if figure:
                figure["mediaType"] = "image/svg+xml"
                figure["svg"] = render_svg(figure)

        document = {
            "schemaVersion": 1,
            "subject": "physics",
            "language": "mn",
            "referenceYear": self.year,
            "mockVariant": f"P{self.variant}",
            "title": f"ЭЕШ физик {self.year} оны жишиг — P{self.variant}",
            "official": False,
            "author": AUTHOR,
            "referenceVariant": "A",
            "referenceDirectory": "reference",
            "durationMinutes": 100,
            "difficulty": {
                "target": (
                    "Match the official item count, point split, topic coverage "
                    "and reasoning depth for the reference year"
                ),
                "status": (
                    "Author review only; empirical difficulty equivalence has "
                    "not been established"
                ),
            },
            "answerProvenance": (
                "Independently calculated by OpenCode from the stated data; "
                "not an official answer key"
            ),
            "responseFormat": (
                "Part I: choose one of A–E. Part II: exact numeric values "
                "(not the official digit-box encoding)."
            ),
            "instructions": [
                "Нэгдүгээр хэсэгт зөвхөн нэг зөв хариултыг сонгоно.",
                "Хоёрдугаар хэсэгт тооцооллын хариуг бичнэ.",
                "Бүх тооцоонд g = 10 м/с² гэж авна.",
                "Зураг дээрх хэмжээсүүд масштабтай биш.",
                "Хугацаа: 100 минут.",
            ],
            "questions": self.items,
        }
        target = ROOT / str(self.year)
        target.mkdir(parents=True, exist_ok=True)
        path = target / f"mock-{self.variant:02}.json"
        path.write_text(
            json.dumps(document, ensure_ascii=False, indent=2) + "\n",
            encoding="utf8",
        )


# ---------------------------------------------------------------------------
# Version pools
# ---------------------------------------------------------------------------

PAPERS = 60


def slot(year: int, variant: int, number: int) -> int:
    """The paper's place (0–59) in a fixed order of the 60 papers, shuffled separately for each question."""
    order = list(range(PAPERS))
    random.Random(7_919 * number + 104_729).shuffle(order)
    return order[(year - 2015) * 5 + (variant - 1)]


def shuffled(seed: int, items) -> list:
    items = list(items)
    random.Random(seed).shuffle(items)
    return items


def distinct(items, key) -> list:
    """Items in order, dropping any whose key (normally the prompt's data) was already seen."""
    seen, out = set(), []
    for item in items:
        mark = key(item)
        if mark not in seen:
            seen.add(mark)
            out.append(item)
    return out


def assign(combos, labels: list[str], total_of, count: int = PAPERS) -> list:
    """Attach a context label to each combo so that no (label, total) pair repeats: the prompt names both."""
    used, out = set(), []
    for index, combo in enumerate(combos):
        for shift in range(len(labels)):
            label = labels[(index + shift) % len(labels)]
            if (label, total_of(combo)) not in used:
                used.add((label, total_of(combo)))
                out.append((label,) + tuple(combo))
                break
        if len(out) == count:
            break
    return out


# ---------------------------------------------------------------------------
# Part I item generators
# ---------------------------------------------------------------------------

RULER_OBJECTS = [
    "Харандааны", "Баллуурын", "Хадаасны", "Түлхүүрийн", "Навчны",
    "Өдний", "Шүдэнзний хайрцагны", "Модон савааны", "Шилэн хоолойн", "Зэс утасны",
]


def q01(rng: random.Random, year: int, k: int) -> dict:
    lengths = shuffled(101, [Fraction(tenths, 10) for tenths in range(31, 150) if tenths % 10])
    length = lengths[k % len(lengths)]
    obj = RULER_OBJECTS[k % len(RULER_OBJECTS)]
    if k % 2 == 0:
        reading, unit, error = f"{float(length):.1f}", "см", Fraction(1, 20)
        below = [Fraction(1, 1000), Fraction(1, 200), Fraction(1, 100), Fraction(1, 50)]
        above = [Fraction(1, 10), Fraction(1, 5), Fraction(1, 2), Fraction(1)]
        solution = (
            "1 мм хуваалттай шугамчнаас уншихад үнэмлэхүй алдаа нь хуваалтын хагас, "
            "өөрөөр хэлбэл 0.5 мм = 0.05 см байна."
        )
    else:
        reading, unit, error = str(int(length * 10)), "мм", Fraction(1, 2)
        below = [Fraction(1, 100), Fraction(1, 20), Fraction(1, 10), Fraction(1, 5)]
        above = [Fraction(1), Fraction(2), Fraction(5), Fraction(10)]
        solution = "1 мм хуваалттай шугамчнаас уншихад үнэмлэхүй алдаа нь хуваалтын хагас буюу 0.5 мм байна."
    return {
        "skill": "Хэмжилтийн үнэмлэхүй алдаа",
        "prompt": (
            f"Шугамчны хуваалт 1 мм. {obj} уртыг хэмжихэд {reading} {unit} болж уншив. "
            "Хэмжилтийн үр дүнг үнэмлэхүй алдаатай зөв бичсэн хувилбарыг сонго."
        ),
        "answer": f"{reading} ± {num(error)} {unit}",
        "wrong": [f"{reading} ± {num(value)} {unit}" for value in spread_wrongs(error, below, above, rng)],
        "solution": solution,
        "figure": {"kind": "ruler", "length_cm": float(length), "division_mm": 1},
    }


MOTION_OBJECTS = [
    "Автомашины", "Дугуйчны", "Галт тэрэгний", "Автобусны", "Мотоциклийн", "Тэшүүрчний",
    "Гүйгчийн", "Трамвайн", "Чарганы", "Завины", "Лифтний", "Троллейбусны",
]
MOTION_SHAPES = [
    ("up_flat_down", "Эхлээд жигд хурдасч, дараа нь жигд хөдөлж, эцэст нь жигд саарна."),
    ("down_flat_up", "Эхлээд жигд саарч, дараа нь жигд хөдөлж, эцэст нь жигд хурдасна."),
    ("up_flat", "Эхлээд жигд хурдасч, дараа нь жигд хөдөлнө."),
    ("flat_down", "Эхлээд жигд хөдөлж, дараа нь жигд саарна."),
    ("flat_up", "Эхлээд жигд хөдөлж, дараа нь жигд хурдасна."),
    ("down_flat", "Эхлээд жигд саарч, дараа нь жигд хөдөлнө."),
    ("up_down", "Эхлээд жигд хурдасч, дараа нь жигд саарна."),
    ("down", "Бүх хугацаанд жигд саарна."),
    ("up", "Бүх хугацаанд жигд хурдасна."),
    ("flat", "Бүх хугацаанд жигд хөдөлнө."),
]


def motion_points(shape: str, total: int, rng: random.Random) -> list[list[int]]:
    t1 = rng.randint(1, total // 2)
    t2 = rng.randint(t1 + 1, total - 1)
    low = rng.choice([2, 3, 4, 5])
    high = rng.choice([10, 12, 14, 15, 16, 18, 20])
    start = rng.choice([0, low])
    stop = rng.choice([0, low])
    if shape == "up_flat_down":
        return [[0, start], [t1, high], [t2, high], [total, stop]]
    if shape == "down_flat_up":
        return [[0, high], [t1, low], [t2, low], [total, high]]
    if shape == "up_flat":
        return [[0, start], [t1, high], [total, high]]
    if shape == "flat_down":
        return [[0, high], [t1, high], [total, stop]]
    if shape == "flat_up":
        return [[0, low], [t1, low], [total, high]]
    if shape == "down_flat":
        return [[0, high], [t1, low], [total, low]]
    if shape == "up_down":
        return [[0, start], [t2, high], [total, stop]]
    if shape == "down":
        return [[0, high], [total, stop]]
    if shape == "up":
        return [[0, start], [total, high]]
    return [[0, high], [total, high]]


@lru_cache(maxsize=None)
def motion_versions() -> tuple:
    versions = []
    for index in range(PAPERS):
        obj = MOTION_OBJECTS[index % len(MOTION_OBJECTS)]
        total = (6, 8, 9, 10, 12)[index // len(MOTION_OBJECTS)]
        shape, answer = MOTION_SHAPES[(7 * index + index // 10) % len(MOTION_SHAPES)]
        versions.append((obj, total, answer, motion_points(shape, total, random.Random(2_000 + index))))
    return tuple(versions)


def q02(rng: random.Random, year: int, k: int) -> dict:
    obj, total, answer, points = motion_versions()[k % PAPERS]
    return {
        "skill": "Хурд-хугацааны график",
        "prompt": (
            f"{obj} 0–{total} с хугацааны хурд-хугацааны графикийг үзүүлэв. "
            "Хөдөлгөөнийг зөв тодорхойлсон хувилбарыг сонго."
        ),
        "answer": answer,
        "wrong": text_wrongs(answer, [text for _, text in MOTION_SHAPES], rng),
        "solution": (
            "Хурд-хугацааны графикийн налуу эерэг хэсэгт хурд жигд өсөж (жигд хурдсах), хэвтээ хэсэгт тогтмол "
            f"(жигд хөдөлгөөн), налуу сөрөг хэсэгт жигд буурна (жигд саарах). Иймд: {answer}"
        ),
        "figure": {"kind": "v_t_graph", "points": points},
    }


ROUTE_OBJECTS = [
    "тэрэгний", "вагоны", "тоглоомон машины", "робот тэрэгний", "автомашины", "завины",
    "лифтний", "трамвайн", "галт тэрэгний", "мотоциклийн", "троллейбусны", "дугуйчны",
]


@lru_cache(maxsize=None)
def route_versions() -> tuple:
    combos = shuffled(303, [
        (t1, plateau, descent, speed)
        for t1 in (2, 3, 4) for plateau in (2, 3, 4, 5) for descent in (2, 4, 6) for speed in (4, 6, 8, 10, 12)
    ])
    return tuple(assign(combos, ROUTE_OBJECTS, lambda combo: sum(combo[:3])))


def q03(rng: random.Random, year: int, k: int) -> dict:
    obj, t1, plateau, descent, speed = route_versions()[k % PAPERS]
    t2, total = t1 + plateau, t1 + plateau + descent
    turn = Fraction(t2 + total, 2)
    first, second, third = t1 * speed // 2, plateau * speed, descent * speed // 4
    distance, displacement, forward = first + second + 2 * third, first + second, first + second + third
    answer = f"Зам {distance} м, шилжилт {displacement} м"
    return {
        "skill": "Зам ба шилжилт",
        "prompt": (
            f"Шулуун замаар хөдөлсөн {obj} хурд-хугацааны графикийг үзүүлэв. "
            f"0–{total} с хугацааны зам ба шилжилтийг ол."
        ),
        "answer": answer,
        "wrong": [
            f"Зам {a} м, шилжилт {b} м"
            for a, b in ((displacement, distance), (distance, distance), (forward, forward), (displacement, displacement))
        ],
        "solution": (
            f"Графикийн доорх талбайг хэсэг бүрээр олно: 0–{t1} с: {first} м, {t1}–{t2} с: {second} м, "
            f"{t2}–{num(turn)} с: {third} м, {num(turn)}–{total} с: −{third} м (хурд сөрөг тул буцах хөдөлгөөн). "
            f"Зам нь талбайн абсолют утгын нийлбэр: {distance} м; шилжилт нь тэмдэгтэй нийлбэр: {displacement} м."
        ),
        "figure": {"kind": "v_t_graph", "points": [[0, 0], [t1, speed], [t2, speed], [total, -speed]]},
    }


ROD_LENGTHS = [Fraction(3, 5), Fraction(4, 5), Fraction(1), Fraction(6, 5), Fraction(3, 2), Fraction(2), Fraction(12, 5), Fraction(3)]


@lru_cache(maxsize=None)
def rod_versions() -> tuple:
    out = []
    for length in ROD_LENGTHS:
        for masses in itertools.product(range(1, 7), repeat=3):
            if len(set(masses)) == 1:
                continue
            centre = length * (Fraction(masses[1], 2) + masses[2]) / sum(masses)
            if (centre * 100).denominator == 1 and centre != length / 2:
                out.append((length, masses))
    return tuple(shuffled(404, out))


def q04(rng: random.Random, year: int, k: int) -> dict:
    length, (m1, m2, m3) = rod_versions()[k % len(rod_versions())]
    total = m1 + m2 + m3
    centre = length * (Fraction(m2, 2) + m3) / total
    answer = f"{num(centre)} м"
    return {
        "skill": "Хүндийн төв",
        "prompt": (
            f"{num(length)} м урттай, массыг нь үл тоомсорлож болох саваа дээр {m1} кг, {m2} кг, {m3} кг "
            f"бөмбөлгүүдийг зүүн үзүүрээс 0 м, {num(length / 2)} м, {num(length)} м зайд бэхлэв. "
            "Хүндийн төв зүүн үзүүрээс ямар зайд байрлах вэ?"
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "м", [
            length / 2, length - centre, length * m3 / total, length * (m2 + m3) / total,
            length * (Fraction(m1, 2) + m2) / total, centre + length / 10,
        ]),
        "solution": (
            "x_c = (m1x1 + m2x2 + m3x3)/(m1 + m2 + m3) = "
            f"({m1}·0 + {m2}·{num(length / 2)} + {m3}·{num(length)})/{total} = {num(centre)} м."
        ),
        "figure": {
            "kind": "rod_with_masses",
            "length_m": float(length),
            "masses_kg": [m1, m2, m3],
            "positions_m": [0.0, float(length / 2), float(length)],
        },
    }


ARMS = [Fraction(cm, 100) for cm in (20, 25, 30, 40, 50, 60, 75, 80, 90, 100, 120, 150, 180, 200)]


@lru_cache(maxsize=None)
def lever_versions() -> tuple:
    out = []
    for force in (10, 12, 15, 16, 18, 20, 24, 25, 30, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 120):
        for arm in ARMS:
            for other in ARMS:
                balance = force * arm / other
                if arm != other and balance.denominator == 1 and 5 <= balance <= 500:
                    out.append((force, arm, other))
    return tuple(shuffled(505, out))


def q05(rng: random.Random, year: int, k: int) -> dict:
    force1, arm1, arm2 = lever_versions()[k % len(lever_versions())]
    force2 = force1 * arm1 / arm2
    answer = f"{num(force2)} Н"
    return {
        "skill": "Хөшүүргийн тэнцвэр",
        "prompt": (
            f"Хөшүүргийн нэг талд {force1} Н ачаа {num(arm1)} м зайд өлгөв. Тэнцвэртэй байхын тулд "
            f"нөгөө талд {num(arm2)} м зайд ямар хүч үйлчлэх вэ?"
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "Н", [force1, force1 * arm2 / arm1, force2 / 2, force2 * 2, force2 + 10]),
        "solution": (
            "Хөшүүргийн тэнцвэрийн нөхцөл: F1·d1 = F2·d2. "
            f"F2 = {force1}·{num(arm1)}/{num(arm2)} = {num(force2)} Н."
        ),
        "figure": {"kind": "lever", "force_n": force1, "arm_m": float(arm1), "other_arm_m": float(arm2)},
    }


ELEVATOR_CASES = [
    # motion, moving up, acceleration points up
    ("дээш хөдлөхдөө хурдаа {a} м/с² хурдатгалтай нэмэгдүүлж буй", True, True),
    ("доош хөдлөхдөө хурдаа {a} м/с² хурдатгалтай нэмэгдүүлж буй", False, False),
    ("дээш хөдлөхдөө {a} м/с² хурдатгалтай саарч буй", True, False),
    ("доош хөдлөхдөө {a} м/с² хурдатгалтай саарч буй", False, True),
]


@lru_cache(maxsize=None)
def elevator_versions() -> tuple:
    return tuple(shuffled(606, [
        (mass, accel, case)
        for mass in (45, 50, 55, 60, 65, 70, 75, 80, 85, 90)
        for accel in (Fraction(1, 2), Fraction(1), Fraction(3, 2), Fraction(2), Fraction(5, 2), Fraction(3))
        for case in range(len(ELEVATOR_CASES))
    ]))


def q06(rng: random.Random, year: int, k: int) -> dict:
    mass, accel, case = elevator_versions()[k % len(elevator_versions())]
    motion, moving_up, accel_up = ELEVATOR_CASES[case]
    weight = mass * (10 + accel) if accel_up else mass * (10 - accel)
    other = mass * (10 - accel) if accel_up else mass * (10 + accel)
    sign = "+" if accel_up else "−"
    reason = (
        "хурдаа нэмэгдүүлж байгаа тул хурдатгал хөдөлгөөний чиглэлтэй ижил"
        if case < 2 else "саарч байгаа тул хурдатгал хөдөлгөөний эсрэг"
    )
    answer = f"{num(weight)} Н"
    return {
        "skill": "Лифтэн дэх жин",
        "prompt": (
            f"{mass} кг масстай хүн {motion.format(a=num(accel))} лифтэнд зогсож байна. "
            "Хүний жинг ол. (g = 10 м/с²)"
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "Н", [mass * 10, other, mass * accel, weight + 10]),
        "solution": (
            f"Лифт {reason}, өөрөөр хэлбэл {'дээш' if accel_up else 'доош'} чиглэнэ. "
            f"Иймд N = m(g {sign} a) = {mass}·(10 {sign} {num(accel)}) = {num(weight)} Н."
        ),
        "figure": {"kind": "elevator", "mass_kg": mass, "acceleration": float(accel), "moving_up": moving_up},
    }


FORCE_TARGETS = [
    "Тэргэнд", "Хайрцагт", "Чаргад", "Вагонд", "Завинд", "Тоглоомон машинд", "Робот тэргэнд", "Хөнгөн тэргэнд",
]


def force_at(rise: int, plateau: int, fall: int, force: int, moment: Fraction) -> Fraction:
    if moment < rise:
        return force * moment / rise
    if moment <= rise + plateau:
        return Fraction(force)
    return force * (rise + plateau + fall - moment) / fall


@lru_cache(maxsize=None)
def force_reading_versions() -> tuple:
    segments: tuple[list, list, list] = ([], [], [])
    for rise in (1, 2, 3, 4):
        for plateau in (1, 2, 3, 4):
            for fall in (1, 2, 3, 4):
                for force in (10, 12, 15, 16, 20, 24, 30, 40):
                    total = rise + plateau + fall
                    for half in range(1, 2 * total):
                        moment = Fraction(half, 2)
                        part = 0 if moment < rise else 1 if moment <= rise + plateau else 2
                        value = force_at(rise, plateau, fall, force, moment)
                        if value.denominator == 1 and value > 0:
                            segments[part].append((rise, plateau, fall, force, moment))
    pools = [shuffled(707 + part, items) for part, items in enumerate(segments)]
    mixed = [pools[index % 3][index // 3] for index in range(3 * min(len(pool) for pool in pools))]
    labelled = [(FORCE_TARGETS[index % len(FORCE_TARGETS)],) + item for index, item in enumerate(mixed)]
    return tuple(distinct(labelled, lambda item: (item[0], sum(item[1:4]), item[5])))


def q07(rng: random.Random, year: int, k: int) -> dict:
    target, rise, plateau, fall, force, moment = force_reading_versions()[k % PAPERS]
    total = rise + plateau + fall
    value = force_at(rise, plateau, fall, force, moment)
    answer = f"{num(value)} Н"
    return {
        "skill": "Хүч-хугацааны график",
        "prompt": (
            f"{target} 0–{total} с хугацаанд үйлчилсэн хүчний графикийг үзүүлэв. "
            f"t = {num(moment)} с үеийн хүчийг ол."
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "Н", [
            force if value != force else Fraction(force, 2), value * 2, value / 2,
            force - value if force > value else value + Fraction(force, 4),
        ]),
        "solution": (
            f"Графикт хүч 0–{rise} с хугацаанд 0-ээс {force} Н хүртэл жигд өсөж, {rise}–{rise + plateau} с хугацаанд "
            f"{force} Н-д тогтмол, {rise + plateau}–{total} с хугацаанд {force} Н-оос 0 хүртэл жигд буурна. "
            f"t = {num(moment)} с үед F = {num(value)} Н."
        ),
        "figure": {"kind": "f_t_graph", "points": [[0, 0], [rise, force], [rise + plateau, force], [total, 0]]},
    }


@lru_cache(maxsize=None)
def impulse_versions() -> tuple:
    combos = shuffled(808, [
        (rise, top, total, force)
        for rise in (1, 2, 3, 4) for top in range(rise + 1, rise + 6) for total in range(top + 1, top + 5)
        for force in (10, 12, 15, 16, 20, 24, 25, 30, 40, 50)
        if force * (total + top - rise) % 2 == 0
    ])
    return tuple(assign(combos, FORCE_TARGETS, lambda combo: combo[2]))


def q08(rng: random.Random, year: int, k: int) -> dict:
    target, rise, top, total, force = impulse_versions()[k % PAPERS]
    impulse = force * (total + top - rise) // 2
    answer = f"{impulse} Н·с"
    return {
        "skill": "Импульс",
        "prompt": (
            f"{target} үйлчилсэн хүч-хугацааны графикийг үзүүлэв. "
            f"0–{total} с хугацааны хүчний импульсийг ол."
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "Н·с", [
            force * total, force * (top - rise), Fraction(impulse, 2), impulse * 2, impulse + force,
        ]),
        "solution": (
            "Импульс нь F–t графикийн доорх талбай: "
            f"0.5·{rise}·{force} + ({top}−{rise})·{force} + 0.5·({total}−{top})·{force} = {impulse} Н·с."
        ),
        "figure": {"kind": "f_t_graph", "points": [[0, 0], [rise, force], [top, force], [total, 0]]},
    }


PROJECTILES = [("сум", "Сумны"), ("бөмбөлөг", "Бөмбөлгийн"), ("хуванцар бөмбөг", "Бөмбөгний")]


@lru_cache(maxsize=None)
def spring_versions() -> tuple:
    out = []
    for stiffness in (50, 80, 100, 120, 125, 160, 200, 250, 300, 320, 400, 450, 500, 600, 800, 1000):
        for squeeze in (2, 3, 4, 5, 6, 8, 10, 12, 15, 20):
            for grams in (5, 8, 10, 12, 16, 20, 25, 32, 40, 50, 80, 100, 125, 160, 200, 250):
                # v² = x²k/m with x in metres and m in kilograms, i.e. x²k/(10m) with x in cm and m in g.
                square = Fraction(squeeze * squeeze * stiffness, 10 * grams)
                if square.denominator == 1:
                    root = math.isqrt(square.numerator)
                    if root * root == square.numerator and 2 <= root <= 40:
                        out.append((stiffness, squeeze, grams, root))
    return tuple(shuffled(909, out))


def q09(rng: random.Random, year: int, k: int) -> dict:
    stiffness, squeeze, grams, speed = spring_versions()[k % len(spring_versions())]
    name, genitive = PROJECTILES[k % len(PROJECTILES)]
    answer = f"{speed} м/с"
    return {
        "skill": "Пүршний энерги",
        "prompt": (
            f"{stiffness} Н/м хатуулагтай пүршийг {squeeze} см шахаж {grams} г масстай {name} харвав. "
            f"{genitive} хурдыг ол. Үрэлтийг тооцохгүй."
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "м/с", [2 * speed, Fraction(speed, 2), speed + 3, speed * 10]),
        "solution": (
            "Пүршний потенциал энерги кинетик энергид шилжинэ: ½kx² = ½mv². "
            f"v = x·√(k/m) = {num(Fraction(squeeze, 100))}·√({stiffness}/{num(Fraction(grams, 1000))}) = {speed} м/с."
        ),
        "figure": {
            "kind": "spring_launcher",
            "stiffness_n_m": stiffness,
            "compression_cm": squeeze,
            "mass_g": grams,
            "label": name,
        },
    }


SLOPE_OBJECTS = ["тоглоомон машины", "чарганы", "тэшүүрчний", "скейтбордчны", "цаначны", "гулгуурын тэрэгний"]


@lru_cache(maxsize=None)
def slope_versions() -> tuple:
    out = []
    for start in (0, 1, 2, 3, 4, 5, 6, 8):
        for final in range(start + 2, 21):
            height = Fraction(final * final - start * start, 20)
            if Fraction(1, 5) <= height <= 15:
                out.append((start, final, height))
    return tuple(shuffled(1010, out))


def q10(rng: random.Random, year: int, k: int) -> dict:
    start, final, height = slope_versions()[k % len(slope_versions())]
    obj = SLOPE_OBJECTS[k % len(SLOPE_OBJECTS)]
    launch = "тайван байдлаас" if start == 0 else f"{start} м/с хурдтайгаар"
    answer = f"{final} м/с"
    return {
        "skill": "Механик энергийн хадгалалт",
        "prompt": (
            f"{num(height)} м өндрөөс {launch} гулсаж эхэлсэн {obj} доод цэг дэх хурдыг ол. "
            "Үрэлтийг үл тоомсорло."
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "м/с", [start or final + 1, final + 2, final - 2, 2 * final]),
        "solution": (
            "mgh + ½mv0² = ½mv². v = √(v0² + 2gh) = "
            f"√({start}² + 2·10·{num(height)}) = √{final * final} = {final} м/с."
        ),
        "figure": {"kind": "inclined_track", "height_m": float(height), "initial_speed": start},
    }


@lru_cache(maxsize=None)
def crane_versions() -> tuple:
    out = []
    for tonnes in (Fraction(1, 2), Fraction(1), Fraction(3, 2), Fraction(2), Fraction(5, 2), Fraction(3), Fraction(4), Fraction(5), Fraction(6)):
        for speed in (Fraction(1, 2), Fraction(1), Fraction(3, 2), Fraction(2), Fraction(3), Fraction(4), Fraction(5), Fraction(6)):
            for seconds in (2, 3, 4, 5, 6, 8, 10):
                for efficiency in (Fraction(2, 5), Fraction(1, 2), Fraction(3, 5), Fraction(3, 4), Fraction(4, 5), Fraction(9, 10)):
                    useful = tonnes * 10 * speed * seconds  # кЖ
                    if useful.denominator == 1 and 20 <= useful <= 2000:
                        out.append((tonnes, speed, seconds, efficiency, "useful"))
                        if (useful / efficiency).denominator == 1:
                            out.append((tonnes, speed, seconds, efficiency, "total"))
    return tuple(shuffled(1111, out))


def q11(rng: random.Random, year: int, k: int) -> dict:
    tonnes, speed, seconds, efficiency, asked = crane_versions()[k % len(crane_versions())]
    useful = tonnes * 10 * speed * seconds
    total = useful / efficiency
    percent = num(efficiency * 100)
    lead = f"{percent}% үр ашигтай кран {num(tonnes)} т ачааг {num(speed)} м/с хурдтайгаар жигд өргөж байна. "
    working = f"Ашигтай ажил A = mgvt = {num(tonnes * 1000)}·10·{num(speed)}·{seconds} Ж = {num(useful)} кЖ."
    if asked == "useful":
        answer = f"{num(useful)} кЖ"
        prompt = lead + f"Эхний {seconds} с-д гүйцэтгэсэн ашигтай ажлыг ол."
        wrong = numeric_wrongs(answer, "кЖ", [total, useful * efficiency, useful * 2, useful / 2, useful * (1 - efficiency)])
        solution = "Ачааг жигд өргөх ашигтай чадал P = mgv. " + working
    else:
        answer = f"{num(total)} кЖ"
        prompt = lead + f"Эхний {seconds} с-д краны хөдөлгүүрийн гүйцэтгэсэн бүрэн ажлыг ол."
        wrong = numeric_wrongs(answer, "кЖ", [useful, useful * efficiency, total * 2, total / 2])
        solution = working + f" Бүрэн ажил A_б = A/η = {num(useful)}/{num(efficiency)} = {num(total)} кЖ."
    return {
        "skill": "Чадал ба үр ашиг",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": solution,
        "figure": {
            "kind": "crane",
            "mass_t": float(tonnes),
            "speed_m_s": float(speed),
            "efficiency": float(efficiency),
            "time_s": seconds,
        },
    }


EXPANSION_MATERIALS = [("хөнгөн цагаан", 24), ("зэс", 17), ("ган", 12), ("гууль", 19)]


@lru_cache(maxsize=None)
def expansion_versions() -> tuple:
    out = []
    for name, alpha in EXPANSION_MATERIALS:
        for length in (10, 20, 25, 40, 50, 60, 80, 100, 120, 150, 200):
            for change in (10, 15, 20, 25, 30, 40, 50):
                millimetres = Fraction(alpha * length * change, 1000)
                if (millimetres * 100).denominator == 1 and Fraction(1, 2) <= millimetres <= 300:
                    out.append((name, alpha, length, change))
    return tuple(shuffled(1212, out))


def q12(rng: random.Random, year: int, k: int) -> dict:
    name, alpha, length, change = expansion_versions()[k % len(expansion_versions())]
    heating = k % 2 == 0
    start = (0, 5, 10, 15, 20, 25)[k % 6] if heating else (20, 25, 30, 35, 15, 10)[k % 6]
    end = start + change if heating else start - change
    millimetres = Fraction(alpha * length * change, 1000)
    unit, value = ("см", millimetres / 10) if millimetres >= 10 else ("мм", millimetres)
    answer = f"{num(value)} {unit}"
    return {
        "skill": "Дулааны тэлэлт",
        "prompt": (
            f"{length} м урттай {name} утасны температур {num(start)} °C-аас {num(end)} °C хүртэл "
            f"{'нэмэгдэхэд' if heating else 'буурахад'} урт нь хэр их өөрчлөгдөх вэ? α = {alpha}·10⁻⁶ 1/°C."
        ),
        "answer": answer,
        "wrong": [f"{num(v)} {unit}" for v in (value / 2, value * 2, value / 10, value * 10)],
        "solution": (
            f"ΔL = αLΔT = {alpha}·10⁻⁶·{length}·{change} м = {num(millimetres)} мм"
            + (f" = {num(value)} см." if unit == "см" else ".")
        ),
        "figure": {"kind": "thermal_expansion", "length_m": length, "delta_t": change},
    }


@lru_cache(maxsize=None)
def temperature_versions() -> tuple:
    out = [("CF", c) for c in range(5, 105, 5)] + [("FC", c) for c in range(5, 105, 5)]
    out += [("CK", c) for c in (-73, -50, -40, -20, -10, 15, 27, 37, 50, 77, 100, 127, 227, 327)]
    return tuple(shuffled(1313, out))


def q13(rng: random.Random, year: int, k: int) -> dict:
    kind, celsius = temperature_versions()[k % len(temperature_versions())]
    fahrenheit = 9 * celsius // 5 + 32
    figure = {"kind": "thermometer", "celsius": celsius}
    if kind == "CF":
        prompt = f"Цельсийн {celsius} °C нь Фаренгейтийн хэдэн градус вэ?"
        answer = f"{fahrenheit} °F"
        wrong = numeric_wrongs(answer, "°F", [
            fahrenheit - 18, fahrenheit + 18, 9 * celsius // 5, fahrenheit + 9, fahrenheit - 9, fahrenheit + 27, celsius + 32,
        ])
        solution = f"F = 9C/5 + 32 = 9·{celsius}/5 + 32 = {fahrenheit} °F."
    elif kind == "FC":
        prompt = f"Фаренгейтийн {fahrenheit} °F нь Цельсийн хэдэн градус вэ?"
        answer = f"{celsius} °C"
        wrong = numeric_wrongs(answer, "°C", [fahrenheit - 32, Fraction(5 * fahrenheit, 9), celsius + 5, celsius + 10, celsius - 5], 1)
        solution = f"C = 5(F − 32)/9 = 5·({fahrenheit} − 32)/9 = {celsius} °C."
        figure = None
    else:
        kelvin = celsius + 273
        prompt = f"Цельсийн {num(celsius)} °C нь Кельвиний хуваариар хэдэн кельвин вэ?"
        answer = f"{kelvin} К"
        wrong = numeric_wrongs(answer, "К", [celsius + 237, kelvin + 10, kelvin - 10, kelvin + 100, 273 - celsius])
        solution = f"T = t + 273 = {num(celsius)} + 273 = {kelvin} К."
    return {
        "skill": "Температурын хуваарь",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": solution,
        "figure": figure,
    }


SPECIFIC_HEATS = [
    ("Ус", 4200), ("Спирт", 2400), ("Мөс", 2100), ("Хөнгөн цагаан", 900), ("Тоосго", 880), ("Шил", 840),
    ("Ган", 500), ("Төмөр", 460), ("Зэс", 390), ("Гууль", 380), ("Мөнгө", 240), ("Цагаан тугалга", 230),
    ("Хар тугалга", 130),
]


@lru_cache(maxsize=None)
def heat_table_versions() -> tuple:
    rng = random.Random(1414)
    versions, seen = [], set()
    while len(versions) < PAPERS:
        chosen = rng.sample(SPECIFIC_HEATS, 5)
        high = len(versions) % 2 == 0
        key = (max if high else min)(chosen, key=lambda item: item[1])[0]
        names = tuple(name for name, _ in chosen)
        # The key must not be the one uniquely longest name (Хөнгөн цагаан among Ус, Зэс, Шил …).
        if (names, high) in seen or max(len(name) for name in names if name != key) < len(key):
            continue
        seen.add((names, high))
        rows = tuple(
            (name, heat, rng.choice([Fraction(1, 2), Fraction(1), Fraction(2)]), rng.choice([10, 20, 30]))
            for name, heat in chosen
        )
        versions.append((rows, high, key))
    return tuple(versions)


def q14(rng: random.Random, year: int, k: int) -> dict:
    rows, high, key = heat_table_versions()[k % PAPERS]
    word = "их" if high else "бага"
    listing = ", ".join(name.lower() for name, *_ in rows)
    return {
        "skill": "Хувийн дулаан",
        "prompt": (
            f"Хүснэгтэд {listing} гэсэн таван бодисын масс, температурын өөрчлөлт ба хүлээн авсан дулааны "
            f"хэмжээг үзүүлэв. Аль бодисын хувийн дулаан хамгийн {word} вэ?"
        ),
        "answer": key,
        "wrong": [name for name, *_ in rows if name != key],
        "solution": (
            "c = Q/(mΔT): "
            + "; ".join(f"{name.lower()} {num(heat * mass * change)}/({num(mass)}·{change}) = {heat}" for name, heat, mass, change in rows)
            + f" Ж/(кг·°C). Хамгийн {word} нь {key.lower()}."
        ),
        "figure": {
            "kind": "table",
            "columns": ["Бодис", "m, кг", "ΔT, °C", "Q, Ж"],
            "rows": [[name, num(mass), str(change), num(heat * mass * change)] for name, heat, mass, change in rows],
        },
    }


@lru_cache(maxsize=None)
def mixing_versions() -> tuple:
    out = []
    for hot_mass in (5, 10, 15, 20, 25, 30, 40, 50):
        for hot in range(40, 100, 5):
            for cold in range(5, 30, 5):
                for final in range(cold + 5, hot, 5):
                    cold_mass = Fraction(hot_mass * (hot - final), final - cold)
                    if cold_mass.denominator == 1 and 2 <= cold_mass <= 200 and cold_mass != hot_mass:
                        out.append((hot_mass, hot, cold, final, int(cold_mass)))
    return tuple(shuffled(1515, out))


def q15(rng: random.Random, year: int, k: int) -> dict:
    hot_mass, hot, cold, final, cold_mass = mixing_versions()[k % len(mixing_versions())]
    if k % 2 == 0:
        prompt = (
            f"{hot} °C-ын {hot_mass} кг халуун усыг {cold} °C-ын хүйтэн устай холиход {final} °C болсон. "
            "Хүйтэн усны массыг ол. Дулааны алдагдлыг тооцохгүй."
        )
        value, given = cold_mass, hot_mass
        solution = f"m1c(T1−T) = m2c(T−T2). m2 = {hot_mass}·({hot}−{final})/({final}−{cold}) = {cold_mass} кг."
        figure = {"kind": "calorimeter", "hot_mass_kg": hot_mass, "hot_temp_c": hot, "cold_temp_c": cold, "final_temp_c": final}
    else:
        prompt = (
            f"{cold} °C-ын {cold_mass} кг хүйтэн усыг {hot} °C-ын халуун устай холиход {final} °C болсон. "
            "Халуун усны массыг ол. Дулааны алдагдлыг тооцохгүй."
        )
        value, given = hot_mass, cold_mass
        solution = f"m1c(T1−T) = m2c(T−T2). m1 = {cold_mass}·({final}−{cold})/({hot}−{final}) = {hot_mass} кг."
        figure = {"kind": "calorimeter", "cold_mass_kg": cold_mass, "hot_temp_c": hot, "cold_temp_c": cold, "final_temp_c": final}
    answer = f"{value} кг"
    return {
        "skill": "Дулааны тэнцвэр",
        "prompt": prompt,
        "answer": answer,
        "wrong": numeric_wrongs(answer, "кг", [given, Fraction(value, 2), value + 10, 2 * value, value + 5]),
        "solution": solution,
        "figure": figure,
    }


WATER_HEATING = ["Халах", "Хайлах", "Буцлах", "Шингэрэх", "Хөлдөх"]
SOLID_HEATING = ["Халах", "Хайлах", "Буцлах", "Хатуурах", "Хөрөх"]
WATER_COOLING = ["Хөрөх", "Хөлдөх", "Хайлах", "Буцлах", "Шингэрэх"]
STEAM_COOLING = ["Хөрөх", "Шингэрэх", "Хөлдөх", "Хатуурах", "Буцлах"]
MELT_COOLING = ["Хөрөх", "Хатуурах", "Хайлах", "Шингэрэх", "Халах"]
PHASE_RUNS = [
    # what is heated or cooled, heating?, start °C, [(process, end °C)], options
    ("Мөсийг", True, -20, [("Халах", 0), ("Хайлах", 0), ("Халах", 100), ("Буцлах", 100)], WATER_HEATING),
    ("Усыг", True, 20, [("Халах", 100), ("Буцлах", 100), ("Халах", 120)], WATER_HEATING),
    ("Нафталиныг", True, 20, [("Халах", 80), ("Хайлах", 80), ("Халах", 120)], SOLID_HEATING),
    ("Цагаан тугалгыг", True, 180, [("Халах", 232), ("Хайлах", 232), ("Халах", 280)], SOLID_HEATING),
    ("Хар тугалгыг", True, 270, [("Халах", 327), ("Хайлах", 327), ("Халах", 380)], SOLID_HEATING),
    ("Усны уурыг", False, 120, [("Хөрөх", 100), ("Шингэрэх", 100), ("Хөрөх", 40)], STEAM_COOLING),
    ("Усыг", False, 30, [("Хөрөх", 0), ("Хөлдөх", 0), ("Хөрөх", -15)], WATER_COOLING),
    ("Хайлсан нафталиныг", False, 110, [("Хөрөх", 80), ("Хатуурах", 80), ("Хөрөх", 40)], MELT_COOLING),
    ("Хайлсан цагаан тугалгыг", False, 280, [("Хөрөх", 232), ("Хатуурах", 232), ("Хөрөх", 190)], MELT_COOLING),
    ("Хайлсан хар тугалгыг", False, 380, [("Хөрөх", 327), ("Хатуурах", 327), ("Хөрөх", 280)], MELT_COOLING),
]
PHASE_TIMINGS = [(2, 3, 4, 2), (3, 4, 3, 3), (1, 5, 4, 3)]


@lru_cache(maxsize=None)
def phase_versions() -> tuple:
    out = []
    for run in range(len(PHASE_RUNS)):
        for timing in range(len(PHASE_TIMINGS)):
            for segment in range(len(PHASE_RUNS[run][3])):
                out.append((run, timing, segment))
    return tuple(shuffled(1616, out))


def q16(rng: random.Random, year: int, k: int) -> dict:
    run, timing, segment = phase_versions()[k % len(phase_versions())]
    subject, heating, start, steps, options = PHASE_RUNS[run]
    times = [0]
    for duration in PHASE_TIMINGS[timing][: len(steps)]:
        times.append(times[-1] + duration)
    temperatures = [start] + [end for _, end in steps]
    process = steps[segment][0]
    a, b = times[segment], times[segment + 1]
    t_a, t_b = temperatures[segment], temperatures[segment + 1]
    if t_a == t_b:
        solution = f"{a}–{b} мин хугацаанд температур {num(t_a)} °C-д тогтмол байгаа нь {process.lower()} процесс."
    else:
        change = "өссөн тул бодис халж" if t_b > t_a else "буурсан тул бодис хөрч"
        solution = f"{a}–{b} мин хугацаанд температур {num(t_a)} °C-аас {num(t_b)} °C хүртэл {change} байна."
    return {
        "skill": "Халах муруй",
        "prompt": (
            f"{subject} {'халаахад' if heating else 'хөргөхөд'} температур хугацаанаас хэрхэн хамаарч "
            f"өөрчлөгдсөнийг хүснэгтэд үзүүлэв. {a}–{b} мин хугацаанд ямар процесс явагдаж байна?"
        ),
        "answer": process,
        "wrong": [item for item in options if item != process],
        "solution": solution,
        "figure": {
            "kind": "table",
            "columns": ["t, мин", "T, °C"],
            "rows": [[str(time), num(temperature)] for time, temperature in zip(times, temperatures)],
        },
    }


@lru_cache(maxsize=None)
def heater_versions() -> tuple:
    out = []
    masses = (Fraction(1, 10), Fraction(1, 5), Fraction(1, 4), Fraction(3, 10), Fraction(2, 5), Fraction(1, 2), Fraction(3, 5), Fraction(4, 5), Fraction(1), Fraction(3, 2), Fraction(2))
    for heat in (900, 1700, 2000, 2100, 2400, 2500, 3000, 3600, 4000, 4200):
        for mass in masses:
            for change in (5, 10, 15, 20, 25, 30, 40, 50):
                for power in (100, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000):
                    seconds = heat * mass * change / power
                    if seconds.denominator == 1 and 10 <= seconds <= 900:
                        out.append((power, mass, change, int(seconds), heat))
    return tuple(shuffled(1717, out))


def q17(rng: random.Random, year: int, k: int) -> dict:
    power, mass, change, seconds, heat = heater_versions()[k % len(heater_versions())]
    answer = f"{heat} Ж/(кг·°C)"
    return {
        "skill": "Хувийн дулаан",
        "prompt": (
            f"{power} Вт чадалтай халаагуур {num(mass)} кг шингэнийг {change} °C-аар халаахад {seconds} с зарцуулав. "
            "Дулааны алдагдлыг тооцохгүй бол шингэний хувийн дулааныг ол."
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "Ж/(кг·°C)", [heat / 2, heat * 2, heat + 500, heat - 500]),
        "solution": (
            "Q = Pt = mcΔT, иймд c = Pt/(mΔT). "
            f"c = {power}·{seconds}/({num(mass)}·{change}) = {heat} Ж/(кг·°C)."
        ),
        "figure": {"kind": "heating_curve", "power_w": power, "mass_kg": float(mass), "delta_t": change, "time_s": seconds},
    }


ISOTHERMS = {
    600: [(2, 300), (3, 200), (4, 150), (6, 100)],
    800: [(2, 400), (4, 200), (8, 100)],
    1200: [(3, 400), (4, 300), (6, 200), (8, 150), (12, 100)],
    1800: [(6, 300), (9, 200), (12, 150), (18, 100)],
    2400: [(6, 400), (8, 300), (12, 200), (16, 150), (24, 100)],
}
PV_VOLUMES = (2, 3, 4, 5, 6, 8, 10, 12)
PV_PRESSURES = (100, 150, 200, 250, 300, 400)
PROCESS_NAMES = {"p": "Изобар", "V": "Изохор", "T": "Изотерм"}
PROCESS_KINDS = ["pV", "Vp", "TV", "pT", "pVp", "Tp", "VpV", "VT"]


def process_path(kind: str, rng: random.Random) -> list[tuple[int, int]]:
    """States of a 1–2–3(–4) path; letter i of `kind` names segment i: p изобар, V изохор, T изотерм."""
    def other(values, avoid):
        return rng.choice([value for value in values if value != avoid])

    product = rng.choice(sorted(ISOTHERMS))
    (va, pa), (vb, pb) = rng.sample(ISOTHERMS[product], 2)
    v1, p1 = rng.choice(PV_VOLUMES), rng.choice(PV_PRESSURES)
    if kind == "pV":
        v2 = other(PV_VOLUMES, v1)
        return [(v1, p1), (v2, p1), (v2, other(PV_PRESSURES, p1))]
    if kind == "Vp":
        p2 = other(PV_PRESSURES, p1)
        return [(v1, p1), (v1, p2), (other(PV_VOLUMES, v1), p2)]
    if kind == "pVp":
        v2 = other(PV_VOLUMES, v1)
        p3 = other(PV_PRESSURES, p1)
        return [(v1, p1), (v2, p1), (v2, p3), (other(PV_VOLUMES, v2), p3)]
    if kind == "VpV":
        p2 = other(PV_PRESSURES, p1)
        v3 = other(PV_VOLUMES, v1)
        return [(v1, p1), (v1, p2), (v3, p2), (v3, other(PV_PRESSURES, p2))]
    if kind == "TV":
        return [(va, pa), (vb, pb), (vb, other(PV_PRESSURES, pb))]
    if kind == "Tp":
        return [(va, pa), (vb, pb), (other(PV_VOLUMES, vb), pb)]
    if kind == "pT":
        return [(other(PV_VOLUMES, va), pa), (va, pa), (vb, pb)]
    return [(va, other(PV_PRESSURES, pa)), (va, pa), (vb, pb)]  # "VT"


@lru_cache(maxsize=None)
def process_versions() -> tuple:
    rng = random.Random(1818)
    versions, seen, index = [], set(), 0
    while len(versions) < PAPERS:
        kind = PROCESS_KINDS[index % len(PROCESS_KINDS)]
        segment = (index // len(PROCESS_KINDS)) % len(kind)
        index += 1
        states = tuple(process_path(kind, rng))
        if (states, segment) in seen or len(set(states)) != len(states):
            continue
        seen.add((states, segment))
        versions.append((kind, states, segment))
    return tuple(versions)


def q18(rng: random.Random, year: int, k: int) -> dict:
    kind, states, segment = process_versions()[k % PAPERS]
    letter = kind[segment]
    (va, pa), (vb, pb) = states[segment], states[segment + 1]
    label = f"{segment + 1}–{segment + 2}"
    if letter == "p":
        solution = f"{label} хэсэгт даралт {pa} кПа-д тогтмол, эзлэхүүн {va} л-ээс {vb} л болсон тул изобар процесс."
    elif letter == "V":
        solution = f"{label} хэсэгт эзлэхүүн {va} л-т тогтмол, даралт {pa} кПа-аас {pb} кПа болсон тул изохор процесс."
    else:
        solution = (
            f"{label} хэсэг муруй бөгөөд pV = {pa}·{va} = {pb}·{vb} = {pa * va} тогтмол тул температур "
            "тогтмол: изотерм процесс."
        )
    answer = PROCESS_NAMES[letter]
    return {
        "skill": "Идеал хийн процесс",
        "prompt": (
            f"Зурагт нэг моль идеал хийн {'–'.join(str(i + 1) for i in range(len(states)))} процессыг p–V "
            f"диаграммаар үзүүлэв. 1-р төлөвт p1 = {states[0][1]} кПа, V1 = {states[0][0]} л. "
            f"{label} процессын нэрийг тодорхойл."
        ),
        "answer": answer,
        "wrong": [item for item in ["Изобар", "Изохор", "Изотерм", "Адиабат", "Цикл"] if item != answer],
        "solution": solution,
        "figure": {
            "kind": "p_v_diagram",
            "points": [[v, p] for v, p in states],
            "labels": [str(i + 1) for i in range(len(states))],
            "curves": [i for i, item in enumerate(kind) if item == "T"],
        },
    }


def energy_text(joules: Fraction, kilo: bool) -> str:
    return f"{num(joules / 1000, 3)} кЖ" if kilo else f"{num(joules, 2)} Ж"


def in_kilojoules(joules: Fraction) -> bool:
    """Whole kilojoules or hundredths of one read better in кЖ; anything else stays in Ж."""
    return joules >= 1000 and (joules / 10).denominator == 1


@lru_cache(maxsize=None)
def internal_energy_versions() -> tuple:
    out = [("pV", p, v) for p in (50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500) for v in (2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30)]
    out += [("nRT", n, t) for n in (1, 2, 3, 4) for t in (200, 250, 300, 400, 500, 600, 800) if (n * t) % 200 == 0]
    return tuple(shuffled(1919, out))


def q19(rng: random.Random, year: int, k: int) -> dict:
    kind, a, b = internal_energy_versions()[k % len(internal_energy_versions())]
    if kind == "pV":
        base = Fraction(a * b)  # pV in joules (кПа·л)
        prompt = f"Нэг атомт идеал хий {a} кПа даралттай, {b} л эзлэхүүнтэй байна. Дотоод энергийг ол."
        working = f"Нэг атомт идеал хийн дотоод энерги U = (3/2)pV = 1.5·{a}·10³·{b}·10⁻³ Ж"
        figure = {"kind": "gas_state", "pressure_kpa": a, "volume_l": b}
    else:
        base = Fraction(a * b) * Fraction(831, 100)  # νRT
        prompt = f"{a} моль нэг атомт идеал хийн температур {b} К. Дотоод энергийг ол. (R = 8.31 Ж/(моль·К))"
        working = f"Нэг атомт идеал хийн дотоод энерги U = (3/2)νRT = 1.5·{a}·8.31·{b} Ж"
        figure = None
    energy = base * Fraction(3, 2)
    kilo = in_kilojoules(energy)
    answer = energy_text(energy, kilo)
    return {
        "skill": "Идеал хийн дотоод энерги",
        "prompt": prompt,
        "answer": answer,
        "wrong": pick_wrongs(answer, [energy_text(base * factor, kilo) for factor in (1, Fraction(5, 2), 3, Fraction(3, 4), 2, Fraction(1, 2))]),
        "solution": f"{working} = {answer}.",
        "figure": figure,
    }


@lru_cache(maxsize=None)
def isochoric_versions() -> tuple:
    out = [
        ("dp", v, p, p + dp)
        for v in (2, 3, 4, 5, 6, 8, 10, 12, 15, 20) for p in (100, 120, 150, 180, 200, 250, 300)
        for dp in (20, 30, 40, 50, 60, 80, 100, 150, 200)
    ]
    out += [("dT", n, t, 0) for n in (1, 2, 3, 4, 5) for t in (10, 20, 40, 50, 80, 100, 200)]
    return tuple(shuffled(2020, out))


def q20(rng: random.Random, year: int, k: int) -> dict:
    kind, a, b, c = isochoric_versions()[k % len(isochoric_versions())]
    if kind == "dp":
        base = Fraction(a * (c - b))  # VΔp in joules
        prompt = (
            f"Нэг атомт идеал хийн эзлэхүүн {a} л-т тогтмол байхад даралт {b} кПа-аас {c} кПа хүртэл өсөв. "
            "Хийнд өгсөн дулааны хэмжээг ол."
        )
        working = f"Изохор процесст A = 0, иймд Q = ΔU = (3/2)VΔp = 1.5·{a}·10⁻³·{c - b}·10³ Ж"
        figure = {"kind": "p_v_diagram", "points": [[a, b], [a, c]], "labels": ["1", "2"]}
    else:
        base = Fraction(a * b) * Fraction(831, 100)  # νRΔT
        prompt = (
            f"{a} моль нэг атомт идеал хийн эзлэхүүнийг тогтмол байлгаж температурыг {b} К-ээр нэмэгдүүлэв. "
            "Хийнд өгсөн дулааны хэмжээг ол. (R = 8.31 Ж/(моль·К))"
        )
        working = f"Изохор процесст A = 0, иймд Q = ΔU = (3/2)νRΔT = 1.5·{a}·8.31·{b} Ж"
        figure = None
    heat = base * Fraction(3, 2)
    kilo = in_kilojoules(heat)
    answer = energy_text(heat, kilo)
    return {
        "skill": "Изохор процессын дулаан",
        "prompt": prompt,
        "answer": answer,
        "wrong": pick_wrongs(answer, [energy_text(base * factor, kilo) for factor in (1, Fraction(5, 2), 3, Fraction(3, 4), 2, Fraction(1, 2))]),
        "solution": f"{working} = {answer}.",
        "figure": figure,
    }


CIRCUIT_SYMBOLS = {
    # element: (accusative, how the circuit diagram draws it)
    "конденсатор": ("конденсаторыг", "зэрэгцээ хоёр шугам"),
    "гүйдлийн эх үүсвэр": ("гүйдлийн эх үүсвэрийг", "урт ба богино зэрэгцээ шугам"),
    "эсэргүүцэл": ("эсэргүүцлийг", "тэгш өнцөгт"),
    "ороомог": ("ороомгийг", "ороомог шугам"),
    "амперметр": ("амперметрийг", "тойрог дотор A"),
    "вольтметр": ("вольтметрийг", "тойрог дотор V"),
    "гэрлийн чийдэн": ("гэрлийн чийдэнг", "тойрог дотор загалмай"),
    "түлхүүр": ("түлхүүрийг", "налуу шугамаар тасарсан утас"),
    "диод": ("диодыг", "хөндлөн шугамд тулсан гурвалжин"),
    "газардуулга": ("газардуулгыг", "богиносох гурван хэвтээ шугам"),
    "реостат": ("реостатыг", "сумаар огтолсон тэгш өнцөгт"),
    "гальванометр": ("гальванометрийг", "тойрог дотор G"),
    "хайлуур хамгаалагч": ("хайлуур хамгаалагчийг", "дундуураа шугамтай тэгш өнцөгт"),
    "хувьсах гүйдлийн үүсвэр": ("хувьсах гүйдлийн үүсвэрийг", "тойрог дотор ~ тэмдэг"),
}


def q21(rng: random.Random, year: int, k: int) -> dict:
    names = list(CIRCUIT_SYMBOLS)
    target = names[k % len(names)]
    accusative, answer = CIRCUIT_SYMBOLS[target]
    if (k // len(names)) % 2 == 0:
        prompt = f"Цахилгаан хэлхээний тэмдэглэгээнүүдээс {accusative} зөв дүрсэлсэн хувилбарыг сонго."
    else:
        prompt = f"Хэлхээний бүдүүвчид {accusative} ямар тэмдэглэгээгээр дүрсэлдэг вэ?"
    wrong = text_wrongs(answer, [drawing for name, (_, drawing) in CIRCUIT_SYMBOLS.items() if name != target], rng)
    shown = [target] + [name for name, (_, drawing) in CIRCUIT_SYMBOLS.items() if drawing in wrong]
    rng.shuffle(shown)
    return {
        "skill": "Хэлхээний тэмдэглэгээ",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": f"{accusative.capitalize()} хэлхээний бүдүүвчид «{answer}» хэлбэрээр тэмдэглэнэ.",
        "figure": {"kind": "circuit_symbols", "target": target, "symbols": shown},
    }


def q22(rng: random.Random, year: int, k: int) -> dict:
    statements = [
        ("Оролтын гүйдэл тэг.", True),
        ("Сөрөг холбоос үед оролтын хүчдэлийн ялгаа тэг.", True),
        ("Гаралтын хүчдэл үргэлж тэг.", False),
        ("Оролтын эсэргүүцэл төгсгөлгүй их.", True),
        ("Сөрөг холбоосгүй үед оролтын хүчдэлийн ялгаа тэг.", False),
        ("Гаралтын эсэргүүцэл тэг.", True),
        ("Идеал үйлдлийн өсгөгчийн оролтын эсэргүүцэл тэг.", False),
    ]
    while True:
        chosen = rng.sample(statements, 4)
        if any(flag for _, flag in chosen) and any(not flag for _, flag in chosen):
            break
    true_indices = [index + 1 for index, (_, flag) in enumerate(chosen) if flag]
    answer, wrong = combination_options(rng, true_indices)
    listing = "\n".join(
        f"{index}. {text}" for index, (text, _) in enumerate(chosen, start=1)
    )
    return {
        "skill": "Идеал үйлдлийн өсгөгч",
        "prompt": (
            "Идеал үйлдлийн өсгөгчийн алтан дүрмүүдийн аль нь ЗӨВ вэ?\n"
            f"{listing}"
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Идеал үйлдлийн өсгөгчийн оролтын гүйдэл тэг, оролтын "
            "эсэргүүцэл төгсгөлгүй, гаралтын эсэргүүцэл тэг. Сөрөг холбоос "
            "үед оролтын хүчдэлийн ялгаа тэг болно. Гаралтын хүчдэл үргэлж "
            "тэг байх албагүй."
        ),
    }


GATE_TABLES = {
    "AND": [("0", "0", "0"), ("0", "1", "0"), ("1", "0", "0"), ("1", "1", "1")],
    "OR": [("0", "0", "0"), ("0", "1", "1"), ("1", "0", "1"), ("1", "1", "1")],
    "NAND": [("0", "0", "1"), ("0", "1", "1"), ("1", "0", "1"), ("1", "1", "0")],
    "NOR": [("0", "0", "1"), ("0", "1", "0"), ("1", "0", "0"), ("1", "1", "0")],
    "XOR": [("0", "0", "0"), ("0", "1", "1"), ("1", "0", "1"), ("1", "1", "0")],
    "XNOR": [("0", "0", "1"), ("0", "1", "0"), ("1", "0", "0"), ("1", "1", "1")],
}
GATE_NAMES = ["AND", "OR", "NAND", "NOR", "XOR", "XNOR", "NOT"]
GATE_TABLE_INTROS = {
    "AND": "хоёр оролттой логик элементийн",
    "OR": "дохиоллын хэлхээнд ашигласан логик элементийн",
    "NAND": "роботын мэдрэгчийн хэлхээний логик элементийн",
    "NOR": "хаалганы удирдлагын хэлхээний логик элементийн",
    "XOR": "гэрэлтүүлгийн удирдлагын хэлхээний логик элементийн",
    "XNOR": "тоглоомын самбарын хэлхээний логик элементийн",
}
GATE_SITUATIONS = [
    ("AND", "Үйлдвэрийн хэрчих машин ажилтан хоёр товчлуурыг хоёр гараараа зэрэг дарж байх үед л ажилладаг.", "хоёр товчлуурын тус бүр дарагдсан эсэх", "машин ажиллах эсэх"),
    ("AND", "Сейфийн хаалга хоёр өөр түлхүүрийг хоёуланг нь эргүүлсэн үед л нээгддэг.", "түлхүүр тус бүр эргүүлэгдсэн эсэх", "хаалга нээгдэх эсэх"),
    ("AND", "Цахилгаан тэрэгний хөдөлгүүр хаалга хаалттай бөгөөд жолооч хамгаалах бүсээ зүүсэн үед л асдаг.", "хаалга хаалттай эсэх ба бүс зүүсэн эсэх", "хөдөлгүүр асах эсэх"),
    ("AND", "Усалгааны насос хөрс хуурай бөгөөд өдөр байх үед л ажилладаг.", "хөрс хуурай эсэх ба өдөр эсэх", "насос ажиллах эсэх"),
    ("OR", "Байшингийн хонх урд эсвэл хойд хаалганы товчлуурыг дарахад дуугардаг.", "хоёр товчлуурын тус бүр дарагдсан эсэх", "хонх дуугарах эсэх"),
    ("OR", "Дохиолол цонхны эсвэл хаалганы мэдрэгчийн аль нэг нь идэвхжихэд дуугардаг.", "мэдрэгч тус бүр идэвхжсэн эсэх", "дохиолол дуугарах эсэх"),
    ("OR", "Автобусны самбарын анхааруулах гэрэл хоёр хаалганы аль нэг нь нээлттэй үед асдаг.", "хаалга тус бүр нээлттэй эсэх", "анхааруулах гэрэл асах эсэх"),
    ("OR", "Коридорын гэрэл хөдөлгөөний мэдрэгч эсвэл гар унтраалгын аль нэгээр асдаг.", "мэдрэгч идэвхжсэн эсэх ба унтраалга асаалттай эсэх", "гэрэл асах эсэх"),
    ("NAND", "Хоёр мэдрэгч хоёулаа идэвхжсэн үед л ногоон гэрэл унтардаг; бусад бүх үед гэрэл асаалттай байдаг.", "мэдрэгч тус бүр идэвхжсэн эсэх", "ногоон гэрэл асах эсэх"),
    ("NAND", "Хэвлэгч цаасны хоёр тавиур хоёулаа хоосон болсон үед л ажиллахаа зогсоодог.", "тавиур тус бүр хоосон эсэх", "хэвлэгч ажиллах эсэх"),
    ("NAND", "Цахилгаан зуух хоёр мэдрэгч хоёулаа хэт халалт илрүүлсэн үед л унтардаг.", "мэдрэгч тус бүр хэт халалт илрүүлсэн эсэх", "зуух ажиллах эсэх"),
    ("NAND", "Тоглоомон машин хоёр батерей хоёулаа суларсан үед л зогсдог.", "батерей тус бүр суларсан эсэх", "машин явах эсэх"),
    ("NOR", "Хоёр хаалганы аль нь ч нээгдээгүй үед л ногоон «аюулгүй» гэрэл асдаг.", "хаалга тус бүр нээлттэй эсэх", "ногоон гэрэл асах эсэх"),
    ("NOR", "Лифт хаалганы хоёр мэдрэгчийн аль нь ч саад илрүүлээгүй үед л хөдөлдөг.", "мэдрэгч тус бүр саад илрүүлсэн эсэх", "лифт хөдлөх эсэх"),
    ("NOR", "Усны насос хоёр савны аль нь ч дүүрээгүй үед л ажилладаг.", "сав тус бүр дүүрсэн эсэх", "насос ажиллах эсэх"),
    ("NOR", "Галт тэрэг хоёр семафорын аль нь ч улаан гэрэл асаагаагүй үед л хөдөлдөг.", "семафор тус бүр улаан гэрэл асаасан эсэх", "галт тэрэг хөдлөх эсэх"),
    ("XOR", "Шатны гэрлийг доод ба дээд давхрын хоёр унтраалгын аль нэгийг шилжүүлэхэд гэрлийн төлөв солигддог; хоёр унтраалга ижил байрлалтай үед гэрэл унтраалттай.", "унтраалга тус бүр дээш байрлалтай эсэх", "гэрэл асах эсэх"),
    ("XOR", "Хоёр тоглогчийн зөвхөн нэг нь товчлуураа дарсан үед л гэрэл асдаг; хоёулаа зэрэг дарвал асахгүй.", "тоглогч тус бүр товчлуур дарсан эсэх", "гэрэл асах эсэх"),
    ("XOR", "Хоёр хоолойн зөвхөн нэгээр нь ус урсаж байх үед л анхааруулах дохио өгдөг.", "хоолой тус бүрээр ус урсаж байгаа эсэх", "дохио өгөх эсэх"),
    ("XNOR", "Хоёр унтраалга хоёулаа асаалттай эсвэл хоёулаа унтраалттай үед л ногоон гэрэл асдаг.", "унтраалга тус бүр асаалттай эсэх", "ногоон гэрэл асах эсэх"),
    ("XNOR", "Хоёр мэдрэгчийн заалт тохирч байх үед л систем «хэвийн» гэсэн дохио өгдөг.", "мэдрэгч тус бүр дохио өгсөн эсэх", "«хэвийн» дохио гарах эсэх"),
]
GATE_PLAIN = [
    ("XOR", "Хоёр нэг оронтой хоёртын тоо A ба B-г нэмэхэд нийлбэрийн бага оронгийн цифр Y-г гаргадаг хэлхээ ямар логик элемент вэ?"),
    ("XNOR", "Хоёр оролт A ба B ижил (хоёулаа 0 эсвэл хоёулаа 1) үед л Y = 1 гаргадаг тэнцүүг шалгагч хэлхээ ямар логик элемент вэ?"),
]


def gate_table_text(gate: str) -> str:
    return "; ".join(f"A={a}, B={b} → Y={y}" for a, b, y in GATE_TABLES[gate])


@lru_cache(maxsize=None)
def gate_versions() -> tuple:
    versions = [("table", gate, GATE_TABLE_INTROS[gate]) for gate in GATE_TABLES]
    versions += [("situation", gate, (situation, inputs, output)) for gate, situation, inputs, output in GATE_SITUATIONS]
    versions += [("plain", gate, text) for gate, text in GATE_PLAIN]
    return tuple(shuffled(2323, versions))


def q23(rng: random.Random, year: int, k: int) -> dict:
    kind, gate, data = gate_versions()[k % len(gate_versions())]
    figure = None
    if kind == "table":
        prompt = f"Хүснэгтэд {data} үнэний хүснэгтийг үзүүлэв. Энэ нь ямар логик элемент вэ?"
        solution = f"Хүснэгтийн гаралтын утгууд нь {gate} элементийн үнэний хүснэгттэй тохирч байна: {gate_table_text(gate)}."
        figure = {"kind": "truth_table", "columns": ["A", "B", "Y"], "rows": [list(row) for row in GATE_TABLES[gate]]}
    elif kind == "situation":
        situation, inputs, output = data
        prompt = (
            f"{situation} Оролт A ба B нь {inputs} (тийм бол 1), гаралт Y нь {output} (тийм бол 1) гэж үзвэл "
            "энэ системийг ямар логик элементээр загварчлах вэ?"
        )
        solution = f"Нөхцөлийг үнэний хүснэгтээр бичвэл {gate} элементийн хүснэгт гарна: {gate_table_text(gate)}."
    else:
        prompt = data
        solution = f"Үнэний хүснэгт нь {gate} элементийнх: {gate_table_text(gate)}."
    return {
        "skill": "Логик элемент",
        "prompt": prompt,
        "answer": gate,
        "wrong": text_wrongs(gate, GATE_NAMES, rng),
        "solution": solution,
        "figure": figure,
    }


BOOLEAN_IDENTITIES = [
    ("A⊕B илэрхийллийг зөв хувиргасан хувилбарыг сонго.", "A·B̄ + Ā·B", ["A·B + Ā·B̄", "A + B", "A·B", "Ā + B̄"],
     "XOR буюу онцгой эсрэг үйлдэл нь нэг оролт 1, нөгөө нь 0 үед 1 болно: A·B̄ + Ā·B."),
    ("A⊙B (XNOR) илэрхийллийг зөв хувиргасан хувилбарыг сонго.", "A·B + Ā·B̄", ["A·B̄ + Ā·B", "A + B", "A·B", "Ā + B̄"],
     "XNOR нь оролтууд ижил үед 1 болно: A·B + Ā·B̄."),
    ("¬(A·B)-г зөв хувиргасан хувилбарыг сонго.", "Ā + B̄", ["A + B", "Ā·B̄", "A·B", "A·B̄ + Ā·B"], "Де Морганы хуулиар ¬(A·B) = Ā + B̄."),
    ("¬(A+B)-г зөв хувиргасан хувилбарыг сонго.", "Ā·B̄", ["A·B", "Ā + B̄", "A+B", "A⊕B"], "Де Морганы хуулиар ¬(A+B) = Ā·B̄."),
    ("A + A·B илэрхийллийг зөв хялбарчилсан хувилбарыг сонго.", "A", ["B", "A·B", "A+B", "Ā"], "Шингээх хуулиар A + A·B = A·(1+B) = A."),
    ("A·(A + B) илэрхийллийг хялбарчил.", "A", ["B", "A·B", "A + B", "1"], "A·(A + B) = A·A + A·B = A + A·B = A (шингээх хууль)."),
    ("A + Ā·B илэрхийллийг хялбарчил.", "A + B", ["A·B", "A", "B", "Ā + B"], "A + Ā·B = (A + Ā)·(A + B) = 1·(A + B) = A + B."),
    ("A·(Ā + B) илэрхийллийг хялбарчил.", "A·B", ["A + B", "A", "B", "0"], "A·(Ā + B) = A·Ā + A·B = 0 + A·B = A·B."),
    ("A·B + A·B̄ илэрхийллийг хялбарчил.", "A", ["B", "1", "A·B", "A + B"], "A·B + A·B̄ = A·(B + B̄) = A·1 = A."),
    ("(A + B)·(A + B̄) илэрхийллийг хялбарчил.", "A", ["B", "0", "A + B", "A·B"], "(A + B)·(A + B̄) = A + B·B̄ = A + 0 = A."),
    ("A·B + A·C илэрхийллийг хаалтаар бүлэглэсэн хувилбарыг сонго.", "A·(B + C)", ["A + B·C", "A·B·C", "(A + B)·C", "A + B + C"],
     "Тархалтын хуулиар A·B + A·C = A·(B + C)."),
    ("(A + B)·(A + C) илэрхийллийг хялбарчил.", "A + B·C", ["A·(B + C)", "A·B·C", "A + B + C", "A·B + C"],
     "(A + B)·(A + C) = A + A·C + A·B + B·C = A + B·C (шингээх хууль)."),
    ("¬(Ā·B̄) илэрхийллийг хялбарчил.", "A + B", ["A·B", "Ā + B̄", "Ā·B̄", "A⊕B"], "Де Морганы хуулиар ¬(Ā·B̄) = A + B."),
    ("¬(Ā + B̄) илэрхийллийг хялбарчил.", "A·B", ["A + B", "Ā·B̄", "Ā + B̄", "A⊕B"], "Де Морганы хуулиар ¬(Ā + B̄) = A·B."),
    ("A·Ā + B илэрхийллийг хялбарчил.", "B", ["A", "0", "1", "A + B"], "A·Ā = 0 тул A·Ā + B = B."),
    ("(A + Ā)·B илэрхийллийг хялбарчил.", "B", ["A", "0", "1", "A·B"], "A + Ā = 1 тул (A + Ā)·B = B."),
    ("Ā·B̄ + Ā·B илэрхийллийг хялбарчил.", "Ā", ["B̄", "A", "Ā·B", "1"], "Ā·B̄ + Ā·B = Ā·(B̄ + B) = Ā."),
    ("(A + B)·(Ā + B) илэрхийллийг хялбарчил.", "B", ["A", "A·B", "A + B", "0"], "(A + B)·(Ā + B) = A·Ā + B = B."),
    ("A·B + Ā·B + A·B̄ илэрхийллийг хялбарчил.", "A + B", ["A·B", "A⊕B", "1", "Ā + B̄"],
     "A·B + Ā·B = B, B + A·B̄ = (B + A)·(B + B̄) = A + B."),
    ("¬(A⊕B) илэрхийллийг зөв хувиргасан хувилбарыг сонго.", "A·B + Ā·B̄", ["A·B̄ + Ā·B", "Ā + B̄", "A·B", "Ā·B̄"],
     "XOR-ийн эсрэг нь XNOR: оролтууд ижил үед 1, иймд A·B + Ā·B̄."),
    ("A·B·C + A·B·C̄ илэрхийллийг хялбарчил.", "A·B", ["A·C", "B·C", "A·B·C", "1"], "A·B·C + A·B·C̄ = A·B·(C + C̄) = A·B."),
    ("Ā + A·B илэрхийллийг хялбарчил.", "Ā + B", ["A + B", "Ā·B", "Ā + B̄", "B"], "Ā + A·B = (Ā + A)·(Ā + B) = Ā + B."),
]


def q24(rng: random.Random, year: int, k: int) -> dict:
    prompt, answer, wrong, solution = BOOLEAN_IDENTITIES[k % len(BOOLEAN_IDENTITIES)]
    return {
        "skill": "Булийн алгебр",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": solution,
    }


WIRE_POINTS = {
    # point: (where, x in units of half the wire spacing; the wires are at −1 and +1)
    "M": ("Хоёр утасны яг дунд орших M цэгт", 0),
    "K": ("Зүүн утаснаас зүүн тийш, утас хоорондын зайтай тэнцүү зайд орших K цэгт", -3),
    "N": ("Баруун утаснаас баруун тийш, утас хоорондын зайтай тэнцүү зайд орших N цэгт", 3),
}


@lru_cache(maxsize=None)
def wire_versions() -> tuple:
    return tuple(shuffled(2525, [
        (left, right, left_size, right_size, point)
        for left in (1, -1) for right in (1, -1) for left_size in (1, 2) for right_size in (1, 2) for point in "MKN"
    ]))


def q25(rng: random.Random, year: int, k: int) -> dict:
    left, right, left_size, right_size, point = wire_versions()[k % len(wire_versions())]
    where, x = WIRE_POINTS[point]
    # B_y ∝ s·I/(x − x_wire): a current out of the page (s = +1) gives an upward field on its right.
    from_left = Fraction(left * left_size, x + 1)
    from_right = Fraction(right * right_size, x - 1)
    field = from_left + from_right
    answer = "Дээш" if field > 0 else "Доош" if field < 0 else "Тэг"

    def current(sign: int, size: int) -> str:
        return f"{'I' if size == 1 else '2I'} хүчтэй гүйдэл {'хуудаснаас гарах' if sign > 0 else 'хуудас руу орох'} чиглэлд"

    def part(value: Fraction) -> str:
        return f"{'дээш' if value > 0 else 'доош'} (хэмжээ ∝ {ratio(abs(value))})"

    return {
        "skill": "Параллель утасны соронзон орон",
        "prompt": (
            "Хоёр урт параллель утас зургийн хавтгайд перпендикуляр байрлана. "
            f"Зүүн утсаар {current(left, left_size)}, баруун утсаар {current(right, right_size)} гүйнэ. "
            f"{where} үүсэх соронзон орны чиглэлийг (зургийн хавтгайд) ол."
        ),
        "answer": answer,
        "wrong": [item for item in ["Дээш", "Доош", "Зүүн", "Баруун", "Тэг"] if item != answer],
        "solution": (
            "Шулуун гүйдлийн соронзон орон I/r-тэй пропорциональ бөгөөд чиглэлийг баруун гарын дүрмээр олно: "
            "хуудаснаас гарах гүйдлийн баруун талд орон дээш, зүүн талд доош; хуудас руу орох гүйдлийнх эсрэгээр. "
            f"{point} цэгт зүүн утасны орон {part(from_left)}, баруун утасных {part(from_right)} тул "
            f"нийлбэр орон: {answer.lower()}."
        ),
        "figure": {
            "kind": "parallel_wires",
            "left_current": "out" if left > 0 else "in",
            "right_current": "out" if right > 0 else "in",
            "labels": ["I" if left_size == 1 else "2I", "I" if right_size == 1 else "2I"],
            "point": point,
        },
    }


@lru_cache(maxsize=None)
def reactance_versions() -> tuple:
    out = []
    for frequency in (50, 100, 200, 250, 400, 500, 1000):
        for numerator in (10, 20, 25, 40, 50, 100, 125, 200, 250, 500, 1000):
            reactance = Fraction(10 ** 6, 2 * frequency * numerator)
            if reactance.denominator == 1 and 5 <= reactance <= 2000:
                out.append(("pi", frequency, numerator, int(reactance)))
                out.append(("pi-f", frequency, numerator, int(reactance)))
    for frequency in (50, 60, 100):
        for capacitance in (1, 2, 5, 10, 20, 25, 40, 50, 100):
            exact_value = 1 / (2 * math.pi * frequency * capacitance * 1e-6)
            rough = 1 / (2 * 3.14 * frequency * capacitance * 1e-6)
            rounded = Decimal(repr(exact_value)).quantize(Decimal(1), rounding=ROUND_HALF_UP)
            # Keep only values where π and 3.14 give the same whole number of ohms.
            if rounded == Decimal(repr(rough)).quantize(Decimal(1), rounding=ROUND_HALF_UP) and 5 <= exact_value <= 2000:
                out.append(("plain", frequency, capacitance, int(rounded)))
    return tuple(shuffled(2626, out))


def q26(rng: random.Random, year: int, k: int) -> dict:
    kind, frequency, capacitance, reactance = reactance_versions()[k % len(reactance_versions())]
    if kind == "plain":
        prompt = (
            f"{capacitance} мкФ багтаамжтай конденсаторыг {frequency} Гц давтамжтай хувьсах гүйдлийн хэлхээнд холбов. "
            "Багтаамжийн эсэргүүцлийг ол."
        )
        answer, unit, value = f"{reactance} Ом", "Ом", reactance
        solution = f"X_C = 1/(2πfC) = 1/(2·3.14·{frequency}·{capacitance}·10⁻⁶) ≈ {reactance} Ом."
        figure = {"kind": "capacitor_ac", "capacitance_uf": capacitance, "frequency_hz": frequency}
    elif kind == "pi":
        prompt = (
            f"{capacitance}/π мкФ багтаамжтай конденсаторыг {frequency} Гц давтамжтай хувьсах гүйдлийн хэлхээнд холбов. "
            "Багтаамжийн эсэргүүцлийг ол."
        )
        answer, unit, value = f"{reactance} Ом", "Ом", reactance
        solution = (
            f"X_C = 1/(2πfC) = 1/(2π·{frequency}·({capacitance}/π)·10⁻⁶) = 10⁶/(2·{frequency}·{capacitance}) = "
            f"{reactance} Ом."
        )
        figure = {"kind": "capacitor_ac", "capacitance_text": f"{capacitance}/π", "frequency_hz": frequency}
    else:
        prompt = (
            f"{capacitance}/π мкФ багтаамжтай конденсаторын багтаамжийн эсэргүүцэл {reactance} Ом байхын тулд "
            "хувьсах гүйдлийн давтамж ямар байх ёстой вэ?"
        )
        answer, unit, value = f"{frequency} Гц", "Гц", frequency
        solution = (
            f"X_C = 1/(2πfC) тул f = 1/(2πCX_C) = 1/(2π·({capacitance}/π)·10⁻⁶·{reactance}) = "
            f"10⁶/(2·{capacitance}·{reactance}) = {frequency} Гц."
        )
        figure = {"kind": "capacitor_ac", "capacitance_text": f"{capacitance}/π", "frequency_text": "?"}
    return {
        "skill": "Багтаамжийн эсэргүүцэл",
        "prompt": prompt,
        "answer": answer,
        "wrong": numeric_wrongs(answer, unit, [value * 2, Fraction(value, 2), value * 4, Fraction(value, 4)]),
        "solution": solution,
        "figure": figure,
    }


def factor_text(factor: Fraction) -> str | None:
    if factor == 1:
        return "Өөрчлөгдөхгүй"
    if factor > 1 and factor.denominator == 1:
        return f"{factor} дахин ихэснэ"
    if factor < 1 and factor.numerator == 1:
        return f"{factor.denominator} дахин багасна"
    return None


@lru_cache(maxsize=None)
def coulomb_versions() -> tuple:
    distances = [(f"{n} дахин багасгаж", Fraction(n * n), Fraction(n)) for n in (2, 3, 4)]
    distances += [(f"{n} дахин ихэсгэж", Fraction(1, n * n), Fraction(1, n)) for n in (2, 3)]
    charges = [(f"нэг цэнэгийг {c} дахин ихэсгэвэл", Fraction(c)) for c in (2, 3, 4, 6, 8, 9)]
    charges += [(f"хоёр цэнэгийг тус бүр {c} дахин ихэсгэвэл", Fraction(c * c)) for c in (2, 3)]
    charges += [(f"нэг цэнэгийг {c} дахин багасгавал", Fraction(1, c)) for c in (2, 3, 4)]
    out = []
    for distance_text, distance_factor, linear in distances:
        for charge_text, charge_factor in charges:
            if factor_text(distance_factor * charge_factor):
                out.append((distance_text, distance_factor, linear, charge_text, charge_factor))
    return tuple(shuffled(2727, out))


def q27(rng: random.Random, year: int, k: int) -> dict:
    distance_text, distance_factor, linear, charge_text, charge_factor = coulomb_versions()[k % len(coulomb_versions())]
    factor = distance_factor * charge_factor
    answer = factor_text(factor)
    candidates = [linear * charge_factor, charge_factor, distance_factor, 1 / factor, factor * 2, factor / 2, factor * 4,
                  distance_factor / charge_factor, factor / 4, factor * 3]
    wrong = []
    for value in candidates:
        text = factor_text(value)
        if text and text != answer and text not in wrong:
            wrong.append(text)
    if len(wrong) < 4:
        raise ValueError(f"Q27: too few distractors for {answer!r}")
    return {
        "skill": "Кулоны хууль",
        "prompt": f"Хоёр цэгэн цэнэгийн хоорондох зайг {distance_text}, {charge_text} Кулоны хүч хэрхэн өөрчлөгдөх вэ?",
        "answer": answer,
        "wrong": wrong[:4],
        "solution": (
            "F = kq1q2/r². Зайн өөрчлөлтөөс хүч "
            f"{ratio(distance_factor)} дахин, цэнэгийн өөрчлөлтөөс {ratio(charge_factor)} дахин үржигдэнэ. "
            f"Иймд F' = {ratio(factor)}·F: {answer.lower()}."
        ),
    }


@lru_cache(maxsize=None)
def capacitor_versions() -> tuple:
    caps = (1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20)
    volts = (5, 6, 9, 10, 12, 15, 20, 24, 30, 50)
    return tuple(shuffled(2828, [(asked, c1, c2, u) for c1, c2 in itertools.combinations(caps, 2) for u in volts for asked in ("total", "one")]))


def q28(rng: random.Random, year: int, k: int) -> dict:
    asked, c1, c2, voltage = capacitor_versions()[k % len(capacitor_versions())]
    lead = f"{c1} мкФ ба {c2} мкФ конденсаторуудыг параллель холбож {voltage} В хүчдэл өгөв. "
    total = (c1 + c2) * voltage
    if asked == "total":
        prompt = lead + "Нийт цэнэгийг ол."
        answer = f"{total} мкКл"
        wrong = numeric_wrongs(answer, "мкКл", [c1 * voltage, c2 * voltage, Fraction(total, 2), total * 2, Fraction(c1 * c2 * voltage, c1 + c2)])
        solution = f"Параллель холболтод C_экв = C1 + C2. Q = C_экв·U = ({c1}+{c2})·{voltage} = {total} мкКл."
    else:
        prompt = lead + f"{c2} мкФ конденсаторын цэнэгийг ол."
        answer = f"{c2 * voltage} мкКл"
        wrong = numeric_wrongs(answer, "мкКл", [c1 * voltage, total, Fraction(c2 * voltage, 2), c2 * voltage * 2])
        solution = f"Параллель холбосон конденсатор бүрийн хүчдэл U = {voltage} В. Q2 = C2·U = {c2}·{voltage} = {c2 * voltage} мкКл."
    return {
        "skill": "Конденсаторын параллель холболт",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": solution,
        "figure": {"kind": "capacitor_circuit", "capacitances_uf": [c1, c2], "voltage_v": voltage},
    }


@lru_cache(maxsize=None)
def circuit_versions(seed: int) -> tuple:
    resistances = (2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30)
    out = []
    for r1 in (1, 2, 3, 4, 5, 6, 8, 10):
        for current in (Fraction(1), Fraction(3, 2), Fraction(2), Fraction(5, 2), Fraction(3), Fraction(4), Fraction(5), Fraction(6)):
            power = current * current * r1
            if power.denominator != 1 or power > 200:
                continue
            for r2 in resistances:
                for r3 in resistances:
                    if r2 == r3:
                        continue
                    i2, i3 = current * r3 / (r2 + r3), current * r2 / (r2 + r3)
                    if (i2 * 100).denominator == 1 and (i3 * 100).denominator == 1:
                        out.append((r1, r2, r3, int(power), current, i3, i2))
    return tuple(shuffled(seed, out))


def circuit_item(rng: random.Random, k: int, seed: int, branch: int) -> dict:
    r1, r2, r3, power, current, i3, i2 = circuit_versions(seed)[k % len(circuit_versions(seed))]
    value, other = (i3, i2) if branch == 3 else (i2, i3)
    name = "R3-аар" if branch == 3 else "R2-оор"
    answer = f"{num(value)} А"
    return {
        "skill": "Хэлхээний гүйдэл",
        "prompt": (
            f"R1 = {r1} Ом нь эх үүсвэртэй цуваа, R2 = {r2} Ом ба R3 = {r3} Ом нь хоорондоо параллель холбогдсон. "
            f"R1 нь {power} Вт чадалтай бол {name} гүйх гүйдлийг ол."
        ),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "А", [other, current, value * 2, value / 2, other * 2, other / 2]),
        "solution": (
            f"R1-ийн гүйдэл I = √(P1/R1) = √({power}/{r1}) = {num(current)} А. "
            f"Параллель хэсгийн эквивалент эсэргүүцэл R_p = {r2}·{r3}/({r2}+{r3}) Ом, түүний хүчдэл U_p = I·R_p. "
            f"{name} гүйх гүйдэл I{branch} = U_p/R{branch} = {num(value)} А."
        ),
        "figure": {"kind": "resistor_network", "r1": r1, "r2": r2, "r3": r3, "power1_w": power},
    }


def q29(rng: random.Random, year: int, k: int) -> dict:
    return circuit_item(rng, k, 2929, 3)


def q30(rng: random.Random, year: int, k: int) -> dict:
    return circuit_item(rng, k, 3030, 2)


REFLECTION_MEDIA = ["Олсны", "Урт пүршний", "Резин хоолойн", "Сунгасан утасны"]
REFLECTION_ENDS = [
    ("хананд бат бэхэлж", "бэхэлсэн"),
    ("хөдөлгөөнгүй шонд чанга уяж", "бэхэлсэн"),
    ("гөлгөр шон дээгүүр чөлөөтэй гулсдаг хөнгөн цагирагт уяж", "сул"),
]


def q31(rng: random.Random, year: int, k: int) -> dict:
    combos = shuffled(3131, [(m, e, d) for m in range(len(REFLECTION_MEDIA)) for e in range(len(REFLECTION_ENDS)) for d in ("дээш", "доош")])
    medium, end_index, pulse = combos[k % len(combos)]
    end_text, end = REFLECTION_ENDS[end_index]
    opposite = "доош" if pulse == "дээш" else "дээш"
    inverted = f"Буцаж тархахдаа {opposite} чиглэсэн импульс болно (фаз 180°-аар өөрчлөгдөнө)."
    upright = f"Буцаж тархахдаа {pulse} чиглэсэн хэвээр байна (фаз өөрчлөгдөхгүй)."
    answer = inverted if end == "бэхэлсэн" else upright
    pool = [
        upright if end == "бэхэлсэн" else inverted,
        f"Буцаж тархахдаа {opposite} чиглэсэн импульс болж, хурд нь хоёр дахин багасна.",
        f"Ойхгүй; импульс {'бэхэлсэн цэгт' if end == 'бэхэлсэн' else 'цагирагт'} бүрэн шингэнэ.",
        f"Буцаж тархахдаа {pulse} чиглэсэн импульс болж, далайц нь хоёр дахин ихэснэ.",
        "Хоёр импульс болж хуваагдан, нэг нь дээш, нөгөө нь доош чиглэнэ.",
    ]
    return {
        "skill": "Долгионы ойлт",
        "prompt": (
            f"{REFLECTION_MEDIA[medium]} нэг үзүүрийг {end_text}, нөгөө үзүүрээс {pulse} чиглэсэн ганц импульс "
            "илгээв. Ойсон импульс ямар байх вэ?"
        ),
        "answer": answer,
        "wrong": text_wrongs(answer, pool, rng),
        "solution": (
            "Бэхэлсэн үзүүрээс ойход фаз 180°-аар өөрчлөгдөж, импульс урвуу харагдана. Чөлөөтэй (сул) үзүүрээс "
            "ойход фаз өөрчлөгдөхгүй, импульс ижил талдаа үлдэнэ. Ойлтын үед тархах хурд, далайц өөрчлөгдөхгүй."
        ),
        "figure": {"kind": "wave_reflection", "end": end, "pulse": "up" if pulse == "дээш" else "down"},
    }


SPACING_PHRASES = [
    ("Хамгийн ойр орших эсрэг фазтай цэгүүдийн хоорондох зай", 2),
    ("Хамгийн ойр орших ижил фазтай цэгүүдийн хоорондох зай", 1),
    ("Зэргэлдээ хоёр оройн хоорондох зай", 1),
    ("Орой ба түүнд хамгийн ойр хонхорын хоорондох хэвтээ зай", 2),
]


@lru_cache(maxsize=None)
def wave_frequency_versions() -> tuple:
    out = []
    speeds = (Fraction(1), Fraction(3, 2), Fraction(2), Fraction(3), Fraction(4), Fraction(5), Fraction(6), Fraction(8), Fraction(10), Fraction(12), Fraction(15), Fraction(20))
    distances = (Fraction(1, 20), Fraction(1, 10), Fraction(1, 5), Fraction(1, 4), Fraction(2, 5), Fraction(1, 2), Fraction(4, 5), Fraction(1), Fraction(3, 2), Fraction(2))
    for speed in speeds:
        for distance in distances:
            for phrase, factor in SPACING_PHRASES:
                frequency = speed / (factor * distance)
                if frequency.denominator == 1 and 1 <= frequency <= 200:
                    out.append((speed, distance, phrase, factor, int(frequency)))
    return tuple(shuffled(3232, out))


def q32(rng: random.Random, year: int, k: int) -> dict:
    speed, distance, phrase, factor, frequency = wave_frequency_versions()[k % len(wave_frequency_versions())]
    wavelength = factor * distance
    answer = f"{frequency} Гц"
    return {
        "skill": "Долгионы хурд ба давтамж",
        "prompt": f"Долгион {num(speed)} м/с хурдтай тархана. {phrase} {num(distance)} м бол долгионы давтамжийг ол.",
        "answer": answer,
        "wrong": numeric_wrongs(answer, "Гц", [frequency * 2, Fraction(frequency, 2), frequency * 10, Fraction(frequency, 10)]),
        "solution": (
            f"{phrase} нь {'λ/2' if factor == 2 else 'λ'}. λ = {num(wavelength)} м; "
            f"f = v/λ = {num(speed)}/{num(wavelength)} = {frequency} Гц."
        ),
        "figure": {
            "kind": "wave_profile",
            "speed_m_s": float(speed),
            "half_wavelength_m": float(wavelength / 2),
            "label": f"{num(distance)} м",
            "span": "half" if factor == 2 else "full",
        },
    }


TRANSMISSION_CONTEXTS = [
    ("Дууны долгион нэг орчноос нөгөө орчин руу нэвтрэхэд", (Fraction(2), Fraction(3), Fraction(4), Fraction(3, 2)), ("ихэссэн", "багассан")),
    ("Гэрэл нэг тунгалаг орчноос нөгөө тунгалаг орчин руу шилжихэд", (Fraction(3, 2), Fraction(2)), ("ихэссэн", "багассан")),
    ("Усны гадаргын долгион гүн хэсгээс гүехэн хэсэг рүү шилжихэд", (Fraction(2), Fraction(3), Fraction(4), Fraction(3, 2)), ("багассан",)),
]
TRANSMISSION_GIVEN = {"length": "долгионы урт нь", "speed": "тархах хурд нь"}


@lru_cache(maxsize=None)
def transmission_versions() -> tuple:
    out = []
    for context, factors, directions in TRANSMISSION_CONTEXTS:
        for factor in factors:
            for direction in directions:
                for given in ("length", "speed"):
                    for asked in ("frequency", "other"):
                        out.append((context, factor, direction, given, asked))
    return tuple(shuffled(3333, out))


def q33(rng: random.Random, year: int, k: int) -> dict:
    context, factor, direction, given, asked = transmission_versions()[k % len(transmission_versions())]
    change = f"{num(factor)} дахин {direction}"
    if asked == "frequency":
        question, answer = "давтамж нь", "Өөрчлөгдөхгүй."
        solution = "Орчин солигдоход давтамж эх үүсвэрээр тодорхойлогдох тул өөрчлөгдөхгүй; зөвхөн долгионы урт ба хурд өөрчлөгдөнө."
    else:
        question = "тархах хурд нь" if given == "length" else "долгионы урт нь"
        answer = f"{num(factor)} дахин {'ихэснэ' if direction == 'ихэссэн' else 'багасна'}."
        solution = f"Давтамж өөрчлөгдөхгүй тул v = λf-ээс хурд ба долгионы урт ижил харьцаагаар өөрчлөгдөнө: {answer.lower()}"
    pool = ["Өөрчлөгдөхгүй."] + [
        f"{num(value)} дахин {verb}."
        for value in (factor, factor * 2, factor * factor) for verb in ("ихэснэ", "багасна")
    ]
    return {
        "skill": "Долгионы шилжилт",
        "prompt": f"{context} {TRANSMISSION_GIVEN[given]} {change} бол {question} хэрхэн өөрчлөгдөх вэ?",
        "answer": answer,
        "wrong": text_wrongs(answer, pool, rng),
        "solution": solution,
    }


@lru_cache(maxsize=None)
def sound_speed_versions() -> tuple:
    out = [("v1", t) for t in range(-30, 45, 5)] + [("v2", t) for t in range(-30, 45, 5)] + [("T", t) for t in range(5, 45, 5)]
    return tuple(shuffled(3434, out))


def q34(rng: random.Random, year: int, k: int) -> dict:
    kind, temperature = sound_speed_versions()[k % len(sound_speed_versions())]
    speed = 331 + Fraction(3, 5) * temperature
    figure = {"kind": "sound_speed_temperature", "intercept": 331, "slope": 0.6, "temperature_c": temperature}
    if kind == "v1":
        prompt = (
            "Агаарт тархах дууны хурд-температурын хамаарлын график өгөгджээ. "
            f"Агаарын температур {num(temperature)} °C байх үед дуу тархах хурдыг ол."
        )
    elif kind == "v2":
        prompt = (
            "Графикт агаар дахь дууны хурд температураас хэрхэн хамаарахыг үзүүлэв. "
            f"{num(temperature)} °C температуртай агаарт дуу ямар хурдтай тархах вэ?"
        )
    if kind in ("v1", "v2"):
        answer = f"{num(speed)} м/с"
        wrong = numeric_wrongs(answer, "м/с", [331 if temperature else 343, 331 + abs(temperature), speed + 6, speed - 6, 343])
        solution = f"Графикийн шугаман хамаарлаас v ≈ 331 + 0.6T. T = {num(temperature)} °C үед v ≈ {num(speed)} м/с."
    else:
        prompt = (
            "Агаарт тархах дууны хурд-температурын хамаарлын графикийг ашиглан дуу "
            f"{num(speed)} м/с хурдтай тархах үеийн агаарын температурыг ол."
        )
        answer = f"{temperature} °C"
        wrong = numeric_wrongs(answer, "°C", [temperature + 5, temperature - 5, speed - 331, temperature * 2, 20])
        solution = f"v ≈ 331 + 0.6T тул T = (v − 331)/0.6 = ({num(speed)} − 331)/0.6 = {temperature} °C."
        figure = {"kind": "sound_speed_temperature", "intercept": 331, "slope": 0.6, "speed": float(speed), "ask": "T"}
    return {
        "skill": "Дууны хурд ба температур",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": solution,
        "figure": figure,
    }


SHM_CONTEXTS = [
    ("Пүршинд өлгөсөн ачааны", "см", (Fraction(1, 2), Fraction(1), Fraction(2), Fraction(5, 2)), (2, 3, 4, 5, 6, 8)),
    ("Дүүжингийн", "см", (Fraction(1, 4), Fraction(1, 2), Fraction(1)), (3, 4, 5, 6, 8, 10, 12)),
    ("Чичиргээт хавтангийн", "мм", (Fraction(10), Fraction(25), Fraction(50)), (2, 3, 4, 5, 6)),
    ("Долгион дээрх хөвөгчийн", "см", (Fraction(1, 2), Fraction(1), Fraction(2)), (2, 3, 4, 5, 6)),
    ("Машины пүршний", "см", (Fraction(1), Fraction(2), Fraction(5, 2)), (2, 3, 4, 5)),
    ("Ширээнд хавчсан ган шугамын үзүүрийн", "мм", (Fraction(5), Fraction(10), Fraction(25)), (2, 3, 4, 5, 6, 8)),
]


@lru_cache(maxsize=None)
def shm_versions() -> tuple:
    out = []
    for context in range(len(SHM_CONTEXTS)):
        _, _, frequencies, amplitudes = SHM_CONTEXTS[context]
        for index, frequency in enumerate(frequencies):
            for asked in ("frequency", "period"):
                # One amplitude per prompt (context, time span, quantity asked), so no two versions share a prompt.
                out.append((context, frequency, amplitudes[(2 * index + (asked == "period")) % len(amplitudes)], asked))
    return tuple(shuffled(3535, out))


def q35(rng: random.Random, year: int, k: int) -> dict:
    context, frequency, amplitude, asked = shm_versions()[k % len(shm_versions())]
    name, unit, _, _ = SHM_CONTEXTS[context]
    period = 1 / frequency
    other_unit = "мм" if unit == "см" else "см"

    def pair(a, value, value_unit):
        return f"{num(a)} {unit}, {num(value)} {value_unit}"

    if asked == "frequency":
        answer = pair(amplitude, frequency, "Гц")
        pool = [pair(2 * amplitude, frequency, "Гц"), pair(amplitude, 2 * frequency, "Гц"), pair(amplitude, frequency / 2, "Гц"),
                pair(amplitude, period, "Гц"), f"{num(amplitude)} {other_unit}, {num(frequency)} Гц"]
        question = "давтамжийг"
        tail = f"давтамж f = 1/T = {num(frequency)} Гц"
    else:
        answer = pair(amplitude, period, "с")
        pool = [pair(2 * amplitude, period, "с"), pair(amplitude, 2 * period, "с"), pair(amplitude, period / 2, "с"),
                pair(amplitude, frequency, "с"), f"{num(amplitude)} {other_unit}, {num(period)} с"]
        question = "үеийг"
        tail = f"үе T = {num(period)} с"
    return {
        "skill": "Гармоник хэлбэлзэл",
        "prompt": (
            f"{name} шилжилт-хугацааны графикийг 0–{num(2 * period)} с хугацаанд үзүүлэв. "
            f"Хэлбэлзлийн далайц ба {question} ол."
        ),
        "answer": answer,
        "wrong": text_wrongs(answer, pool, rng),
        "solution": (
            f"Графикийн хамгийн их шилжилт буюу далайц {num(amplitude)} {unit}. Нэг бүтэн хэлбэлзэл "
            f"{num(period)} с үргэлжилнэ, иймд {tail}."
        ),
        "figure": {"kind": "shm_displacement_time", "amplitude_mm": float(amplitude), "frequency_hz": float(frequency), "unit": unit},
    }


def q36(rng: random.Random, year: int, k: int) -> dict:
    statements = [
        ("Эсэргүүцлийн улмаас далайц буурахыг унтрах хэлбэлзэл гэнэ.", True),
        ("Гадны үечилсэн хүчний үйлчлэлээр явагдахыг албадмал хэлбэлзэл гэнэ.", True),
        ("Резонанс үед далайц эрс бага болно.", False),
        ("Энергийн алдагдлыг нөхөж явагдахыг авто хэлбэлзэл гэнэ.", True),
        ("Резонанс үед далайц эрс ихэснэ.", True),
        (
            "Албадмал хэлбэлзлийн давтамж нь гадны хүчний давтамжтай тэнцүү байна.",
            True,
        ),
        ("Унтрах хэлбэлзлийн далайц хугацааны явцад өөрчлөгдөхгүй.", False),
    ]
    while True:
        chosen = rng.sample(statements, 4)
        if any(flag for _, flag in chosen) and any(not flag for _, flag in chosen):
            break
    true_indices = [index + 1 for index, (_, flag) in enumerate(chosen) if flag]
    answer, wrong = combination_options(rng, true_indices)
    listing = "\n".join(
        f"{index}. {text}" for index, (text, _) in enumerate(chosen, start=1)
    )
    return {
        "skill": "Хэлбэлзлийн төрөл",
        "prompt": (
            "Унтрах ба албадмал хэлбэлзэл, резонанс, авто хэлбэлзлийн тухай "
            "дараах мэдэгдлүүдээс ЗӨВ-ийг сонго.\n"
            f"{listing}"
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Унтрах хэлбэлзэл нь эсэргүүцлийн улмаас далайц буурдаг, "
            "албадмал хэлбэлзэл нь гадны үечилсэн хүчний үйлчлэлээр "
            "явагддаг, авто хэлбэлзэл нь энергийн алдагдлыг нөхөж явагддаг. "
            "Резонанс үед далайц эрс ихэсдэг."
        ),
    }


WAVE_TRUE = [
    ("Агаарт дуу тархах хурд агаарын температураас хамаардаг.", "temperature"),
    ("Пүршийг түүний тэнхлэгийн дагуу хэлбэлзүүлэхэд үүсэх долгион тууш байна.", "spring"),
    ("Долгион тархахад бодис зөөгдөхгүй.", "matter"),
    ("Дууны өндөр нам нь хэлбэлзлийн давтамжаас хамаарна.", "pitch"),
    ("Долгионы хурд нь орчны шинж чанараас хамаарна.", "medium"),
    ("Хөндлөн долгион нь хатуу биетийн гадаргуу болон шингэний гадаргуу дээгүүр тархаж болно.", "surface"),
    ("Дуу вакуумд тархахгүй.", "vacuum"),
    ("Дууны чанга сул нь голчлон хэлбэлзлийн далайцаас хамаарна.", "loudness"),
    ("Долгион энергийг нэг цэгээс нөгөөд зөөдөг.", "energy"),
    ("Хүний чих ойролцоогоор 20 Гц-ээс 20 кГц хүртэлх давтамжтай дууг сонсдог.", "hearing"),
    ("Ультра авиа нь 20 кГц-ээс их давтамжтай механик долгион юм.", "hearing"),
    ("Хоёр когерент долгион давхцахад интерференц ажиглагдана.", "interference"),
    ("Долгион саадыг тойрон тархахыг дифракц гэнэ.", "diffraction"),
    ("Зогсонги долгионы зэргэлдээ хоёр зангилааны хоорондох зай λ/2 байна.", "nodes"),
    ("Ихэнх хатуу биетэд дуу агаараас хурдан тархдаг.", "sound speed"),
    ("Тууш долгионд орчны хэсгүүд долгион тархах чиглэлийн дагуу хэлбэлзэнэ.", "longitudinal"),
    ("Хөндлөн долгионд орчны хэсгүүд долгион тархах чиглэлд перпендикуляр хэлбэлзэнэ.", "transverse"),
    ("Цуурай нь дуу саадаас ойсны улмаас сонсогддог.", "echo"),
    ("Ижил орчинд давтамж ихсэхэд долгионы урт багасна.", "wavelength"),
    ("Орчин солигдоход долгионы давтамж өөрчлөгдөхгүй.", "frequency"),
]
WAVE_FALSE = [
    ("Зогсонги долгионоор энерги нэг цэгээс нөгөөд зөөгдөнө.", "energy",
     "Зогсонги долгион энергийг нэг цэгээс нөгөө рүү зөөдөггүй; энерги зангилаа ба гүйлтийн цэгүүдийн хооронд хэлбэлзэнэ."),
    ("Долгионы давтамж орчин солигдоход өөрчлөгдөнө.", "frequency",
     "Орчин солигдоход давтамж өөрчлөгдөхгүй; зөвхөн долгионы урт ба хурд өөрчлөгдөнө."),
    ("Дууны хурд орчны нягтаас хамаарахгүй.", "medium", "Дууны хурд орчны уян харимхай чанар ба нягтаас хамаарна."),
    ("Дуу вакуумд хамгийн хурдан тархана.", "vacuum", "Дуу механик долгион тул вакуумд огт тархахгүй."),
    ("Дууны өндөр нам нь зөвхөн хэлбэлзлийн далайцаас хамаарна.", "pitch",
     "Дууны өндөр нам давтамжаас, чанга сул нь далайцаас хамаарна."),
    ("Тууш долгион зөвхөн хатуу биетэд тархана.", "longitudinal", "Тууш долгион хий, шингэн, хатуу биеийн аль алинд нь тархана."),
    ("Хөндлөн механик долгион хийн дотор чөлөөтэй тархана.", "transverse",
     "Хийд шилжилтийн уян харимхай хүч бараг байхгүй тул хөндлөн механик долгион тархахгүй; хийд тууш долгион тархана."),
    ("Долгион тархахад орчны бодис долгионтой хамт зөөгдөнө.", "matter",
     "Долгион тархахад орчны хэсгүүд тэнцвэрийн байрлалынхаа орчим хэлбэлзэх ба бодис зөөгдөхгүй; зөвхөн энерги зөөгдөнө."),
    ("Ультра авиаг хүний чих сайн сонсдог.", "hearing", "Ультра авиа 20 кГц-ээс их давтамжтай тул хүний чих сонсдоггүй."),
    ("Гэрэл бол тууш механик долгион.", "light", "Гэрэл бол цахилгаан соронзон хөндлөн долгион."),
    ("Зогсонги долгионы зэргэлдээ хоёр зангилааны хоорондох зай λ байна.", "nodes", "Зэргэлдээ хоёр зангилааны хоорондох зай λ/2."),
    ("Дуу агаараас ус руу шилжихэд түүний хурд багасна.", "sound speed",
     "Усанд дуу агаараас хэд дахин хурдан тархдаг тул ус руу шилжихэд хурд нь ихэснэ."),
    ("Долгионы урт нь тархах хурдаас хамаарахгүй.", "wavelength", "λ = v/f тул долгионы урт хурдаас шууд хамаарна."),
    ("Цуурай нь дууны хугарлаас үүсдэг.", "echo", "Цуурай нь дууны ойлтоос үүсдэг."),
    ("Хоёр долгион давхцахад тэд үргэлж бие биеэ бүрэн унтраадаг.", "interference",
     "Давхцах үед фазын ялгаанаас хамаарч далайц нэмэгдэх эсвэл багасна; үргэлж унтраадаггүй."),
    ("Дифракц зөвхөн гэрлийн долгионд ажиглагдана.", "diffraction", "Дифракц дуу, усны долгион зэрэг бүх төрлийн долгионд ажиглагдана."),
    ("Ижил орчинд давтамж ихсэхэд долгионы урт ихэснэ.", "wavelength",
     "Ижил орчинд v тогтмол, λ = v/f тул давтамж ихсэхэд долгионы урт багасна."),
    ("Инфра авиа нь 20 кГц-ээс их давтамжтай.", "hearing", "Инфра авиа 20 Гц-ээс бага давтамжтай; 20 кГц-ээс их нь ультра авиа."),
    ("Дууны хурд бүх орчинд ижил байдаг.", "medium", "Дууны хурд орчноос хамаарна: агаарт ойролцоогоор 340 м/с, усанд 1500 м/с орчим."),
    ("Пүршийг тэнхлэгийнх нь дагуу хэлбэлзүүлэхэд хөндлөн долгион үүснэ.", "spring",
     "Пүршийг тэнхлэгийнх нь дагуу шахаж сунгахад тууш долгион үүснэ."),
]


@lru_cache(maxsize=None)
def wave_statement_versions() -> tuple:
    versions = [("false", index) for index in range(len(WAVE_FALSE))] + [("true", index) for index in range(len(WAVE_TRUE))]
    return tuple(shuffled(3737, versions))


def q37(rng: random.Random, year: int, k: int) -> dict:
    polarity, index = wave_statement_versions()[k % len(wave_statement_versions())]
    # The statements are the options; the lead-in only varies its wording.
    if polarity == "false":
        answer, topic, solution = WAVE_FALSE[index]
        pool = [text for text, other in WAVE_TRUE if other != topic]
        prompt = [
            "Долгионы тухай дараах мэдэгдлүүдээс БУРУУГ ол.",
            "Механик долгион ба дууны тухай дараах мэдэгдлүүдийн аль нь БУРУУ вэ?",
            "Дараах мэдэгдлүүдийн аль нь долгионы шинж чанарыг БУРУУ тайлбарласан бэ?",
            "Долгион, дууны тухай БУРУУ мэдэгдлийг сонго.",
        ][index % 4]
    else:
        answer, topic = WAVE_TRUE[index]
        pool = [text for text, other, _ in WAVE_FALSE if other != topic]
        prompt = [
            "Долгионы тухай дараах мэдэгдлүүдээс ЗӨВ-ийг ол.",
            "Механик долгион ба дууны тухай дараах мэдэгдлүүдийн аль нь ЗӨВ вэ?",
            "Дараах мэдэгдлүүдийн аль нь долгионы шинж чанарыг ЗӨВ тайлбарласан бэ?",
            "Долгион, дууны тухай ЗӨВ мэдэгдлийг сонго.",
        ][index % 4]
    wrong = text_wrongs(answer, pool, rng)
    if polarity == "true":
        reasons = {text: reason for text, _, reason in WAVE_FALSE}
        solution = f"«{answer}» гэдэг зөв. Бусад нь буруу: " + " ".join(reasons[text] for text in wrong)
    return {
        "skill": "Долгионы шинж чанар",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": solution,
    }


FLOAT_CONTEXTS = [
    "Загасчин {t} с хугацаанд загасны уургын хөвөгч {n} удаа хэлбэлзэхийг ажиглав. Усны гадаргуугаар тархах "
    "долгионуудын оройн хоорондох зай {lam} м бол долгион ямар хурдтай тархаж байсан бэ?",
    "Нууран дээр хөвж буй нугас {t} с-д {n} удаа дээш доош хөдөлжээ. Зэргэлдээ хоёр долгионы оройн хоорондох "
    "зай {lam} м бол долгионы тархах хурдыг ол.",
    "Усан дээр хөвж буй навч {t} с-д {n} бүтэн хэлбэлзэл хийв. Долгионы урт {lam} м бол долгион ямар хурдтай "
    "тархах вэ?",
    "Эрэг дээр зогссон хүн {t} с-д эрэг мөргөх {n} долгион тоолжээ. Долгионы оройнуудын хоорондох зай {lam} м "
    "бол долгионы хурдыг ол.",
]


@lru_cache(maxsize=None)
def float_versions() -> tuple:
    out = []
    for count in (5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 36, 40):
        for seconds in (4, 5, 6, 8, 10, 12, 15, 20):
            for wavelength in (Fraction(1, 2), Fraction(1), Fraction(3, 2), Fraction(2), Fraction(5, 2), Fraction(3), Fraction(4), Fraction(5)):
                frequency = Fraction(count, seconds)
                speed = frequency * wavelength
                if (speed * 10).denominator == 1 and Fraction(1, 2) <= speed <= 20 and frequency <= 5:
                    out.append((count, seconds, wavelength))
    return tuple(shuffled(3838, out))


def q38(rng: random.Random, year: int, k: int) -> dict:
    count, seconds, wavelength = float_versions()[k % len(float_versions())]
    frequency = Fraction(count, seconds)
    speed = frequency * wavelength
    answer = f"{num(speed)} м/с"
    return {
        "skill": "Долгионы хурд",
        "prompt": FLOAT_CONTEXTS[k % len(FLOAT_CONTEXTS)].format(t=seconds, n=count, lam=num(wavelength)),
        "answer": answer,
        "wrong": numeric_wrongs(answer, "м/с", [speed * 2, speed / 2, Fraction(count), wavelength, wavelength / frequency]),
        "solution": (
            f"f = N/t = {count}/{seconds} = {num(frequency)} Гц; "
            f"v = fλ = {num(frequency)}·{num(wavelength)} = {num(speed)} м/с."
        ),
        "figure": {"kind": "water_waves", "oscillations": count, "time_s": seconds, "wavelength_m": float(wavelength)},
    }


def q39(rng: random.Random, year: int, k: int) -> dict:
    statements = [
        (
            "Ойрын хараатай (миопи) хүн гүдгэр линз зүүдэг.",
            False,
            "Буруу: ойрын хараатай (миопи) хүн хүнхэр линз зүүдэг.",
        ),
        (
            "Холын хараатай (гиперметропи) хүн хүнхэр линз зүүдэг.",
            False,
            "Буруу: холын хараатай (гиперметропи) хүн гүдгэр линз зүүдэг.",
        ),
        (
            "Ойрын хараатай (миопи) хүний нүд дүрсийг торлог бүрхэвчийн өмнө үүсгэдэг.",
            True,
            "Зөв: ойрын хараатай (миопи) нүдэнд фокус торлог бүрхэвчийн өмнө байна.",
        ),
        (
            "Холын хараатай (гиперметропи) хүний нүд дүрсийг торлог бүрхэвчийн ард үүсгэдэг.",
            True,
            "Зөв: холын хараатай (гиперметропи) нүдэнд фокус торлог бүрхэвчийн ард байна.",
        ),
        (
            "Ойрын харааг (миопи) гүдгэр линзээр засна.",
            False,
            "Буруу: ойрын харааг (миопи) хүнхэр линзээр засна.",
        ),
        (
            "Холын харааг (гиперметропи) гүдгэр линзээр засна.",
            True,
            "Зөв: холын харааг (гиперметропи) гүдгэр линзээр засна.",
        ),
    ]
    while True:
        chosen = rng.sample(statements, 3)
        if any(flag for _, flag, _ in chosen) and any(not flag for _, flag, _ in chosen):
            break

    def pattern(flags: tuple[bool, ...]) -> str:
        return ", ".join("Тийм" if flag else "Үгүй" for flag in flags)

    answer = pattern(tuple(flag for _, flag, _ in chosen))
    all_patterns = [
        pattern((a, b, c))
        for a in (True, False)
        for b in (True, False)
        for c in (True, False)
    ]
    wrong = rng.sample([item for item in all_patterns if item != answer], 4)
    listing = "\n".join(
        f"{index}. {text}" for index, (text, _, _) in enumerate(chosen, start=1)
    )
    explanation = "\n".join(
        f"{index}. {reason}" for index, (_, _, reason) in enumerate(chosen, start=1)
    )
    return {
        "skill": "Нүдний хараа",
        "prompt": (
            "Нүдний тухай дараах мэдэгдлүүдэд ТИЙМ эсвэл ҮГҮЙ гэж хариул.\n"
            f"{listing}"
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": explanation,
    }


REFRACTION_MEDIA = {
    # medium: (refractive index, "from …", "into …")
    "агаар": (Fraction(1), "агаараас", "агаар руу"),
    "ус": (Fraction(133, 100), "уснаас", "ус руу"),
    "мөс": (Fraction(131, 100), "мөснөөс", "мөс рүү"),
    "глицерин": (Fraction(147, 100), "глицеринээс", "глицерин рүү"),
    "шил": (Fraction(3, 2), "шилнээс", "шил рүү"),
    "алмаз": (Fraction(121, 50), "алмазаас", "алмаз руу"),
}
INTO_DENSER = [
    "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормаль руу ойртоно.",
    "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормалаас холдоно.",
    "Ойсон туяа нормаль руу, хугарсан туяа нормалаас холдоно.",
    "Ойсон туяа байхгүй.",
    "Хугарсан туяа тусах туяатай параллель.",
]
INTO_RARER = [
    "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормалаас холдоно.",
    "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормаль руу ойртоно.",
    "Ойсон туяа нормаль руу, хугарсан туяа нормаль руу ойртоно.",
    "Ойсон туяа байхгүй.",
    "Хугарсан туяа тусах туяатай параллель.",
]


@lru_cache(maxsize=None)
def refraction_versions() -> tuple:
    out = []
    for first, second in itertools.permutations(REFRACTION_MEDIA, 2):
        n1, n2 = REFRACTION_MEDIA[first][0], REFRACTION_MEDIA[second][0]
        if abs(n1 - n2) < Fraction(3, 20):
            continue
        if n1 < n2:
            angles = (20, 30, 40, 50, 60)
        else:
            # Stay well below the critical angle, so a refracted ray exists.
            critical = math.degrees(math.asin(n2 / n1))
            angles = tuple(angle for angle in (10, 15, 20, 25, 30, 35, 40) if angle <= critical - 4)
        out += [(first, second, angle) for angle in angles]
    return tuple(shuffled(4040, out))


def q40(rng: random.Random, year: int, k: int) -> dict:
    first, second, angle = refraction_versions()[k % len(refraction_versions())]
    n1, origin, _ = REFRACTION_MEDIA[first]
    n2, _, into = REFRACTION_MEDIA[second]
    less = n1 < n2
    options = INTO_DENSER if less else INTO_RARER
    return {
        "skill": "Гэрлийн хугарал",
        "prompt": (
            f"Гэрэл {origin} {into} {angle}° тусах өнцгөөр тусах үед n1 {'<' if less else '>'} n2 байна. "
            "Аль дүрслэл зөв вэ?"
        ),
        "answer": options[0],
        "wrong": options[1:],
        "solution": (
            "Ойлтын хууль: ойлтын өнцөг = тусах өнцөг. "
            + ("Оптик нягт орчин руу нэвтрэхэд хугарсан туяа нормаль руу ойртоно."
               if less else "Оптик сийрэг орчин руу нэвтрэхэд хугарсан туяа нормалаас холдоно (тусах өнцөг хязгаар өнцгөөс бага).")
        ),
        "figure": {"kind": "refraction", "from": first, "to": second, "n1_less": less},
    }


LIGHT_SETTINGS = [
    # setting, heights or distances in metres, plausible luminous intensities in candela
    ("pole", (3, 4, 5, 6, 8, 10, 12), (200, 250, 300, 320, 400, 450, 500, 600, 800, 900, 1000)),
    ("ceiling", (Fraction(3, 2), Fraction(2), Fraction(5, 2), Fraction(3)), (50, 60, 75, 80, 90, 100, 120, 150, 160, 180, 200, 250)),
    ("desk", (Fraction(1, 4), Fraction(2, 5), Fraction(1, 2), Fraction(3, 5), Fraction(4, 5), Fraction(1)), (20, 25, 30, 40, 50, 60, 75, 80, 90, 100)),
]


@lru_cache(maxsize=None)
def illuminance_versions() -> tuple:
    out = []
    for setting, distances, intensities in LIGHT_SETTINGS:
        for intensity in intensities:
            for distance in distances:
                lux = intensity / Fraction(distance) ** 2
                if (lux * 100).denominator == 1 and 1 <= lux <= 5000:
                    out.append((setting, intensity, Fraction(distance)))
    return tuple(shuffled(4141, out))


def q41(rng: random.Random, year: int, k: int) -> dict:
    setting, intensity, distance = illuminance_versions()[k % len(illuminance_versions())]
    lux = intensity / distance ** 2
    if setting == "pole":
        prompt = (
            f"{num(distance)} м өндөртэй гэрлийн шонгийн оройд I = {intensity} кд гэрлийн хүчтэй гэрэл үүсгэгч "
            "байрлана. Гэрэл үүсгэгчийн эгц доор газар дээрх гэрэлтүүлгийг ол."
        )
    elif setting == "ceiling":
        prompt = (
            f"Таазанд өлгөсөн I = {intensity} кд гэрлийн хүчтэй чийдэнгээс {num(distance)} м доор ширээ байрлана. "
            "Чийдэнгийн эгц доорх ширээний гадаргуугийн гэрэлтүүлгийг ол."
        )
    else:
        prompt = (
            f"Ширээний чийдэнгийн гэрлийн хүч I = {intensity} кд. Чийдэнгийн эгц доор {num(distance)} м зайд "
            "байгаа номын хуудасны гэрэлтүүлгийг ол."
        )
    answer = f"{num(lux)} лк"
    return {
        "skill": "Гэрэлтүүлэг",
        "prompt": prompt,
        "answer": answer,
        "wrong": numeric_wrongs(answer, "лк", [intensity / distance, intensity * distance, lux * 2, lux / 2, lux * 3]),
        "solution": f"E = I/r² = {intensity}/{num(distance)}² = {num(lux)} лк.",
        "figure": {"kind": "illuminance", "intensity_cd": intensity, "distance_m": float(distance)},
    }


INSTRUMENTS = [
    # name, accusative, what it does, "for doing that" (dative), group of instruments that do much the same
    ("Микроскоп", "Микроскопыг", "Нүдэнд үл харагдах жижиг биетийг ихээр томруулж харах", "Нүдэнд үл харагдах жижиг биетийг ихээр томруулж харахад", "magnify"),
    ("Луп", "Лупыг", "Ойрын биетийн нарийн хэсгийг бага зэрэг томруулж харах", "Ойрын биетийн нарийн хэсгийг бага зэрэг томруулж харахад", "magnify"),
    ("Телескоп", "Телескопыг", "Сансрын алслагдсан биетийг ажиглах", "Сансрын алслагдсан биетийг ажиглахад", "far"),
    ("Дуран", "Дураныг", "Газрын алсын биетийг хоёр нүдээр томруулж харах", "Газрын алсын биетийг хоёр нүдээр томруулж харахад", "far"),
    ("Перископ", "Перископыг", "Саадын дээгүүр буюу цаанаас толиор харах", "Саадын дээгүүр буюу цаанаас толиор харахад", "periscope"),
    ("Фотоаппарат", "Фотоаппаратыг", "Биетийн бодит дүрсийг мэдрэгч дээр буулгаж хадгалах", "Биетийн бодит дүрсийг мэдрэгч дээр буулгаж хадгалахад", "camera"),
    ("Проектор", "Проекторыг", "Жижиг зургийг томруулж дэлгэцэнд тусгах", "Жижиг зургийг томруулж дэлгэцэнд тусгахад", "projector"),
    ("Нүдний шил", "Нүдний шилийг", "Нүдний харааны согогийг засах", "Нүдний харааны согогийг засахад", "glasses"),
    ("Оптик шилэн кабель", "Оптик шилэн кабелийг", "Бүрэн дотоод ойлтоор гэрлийн дохиог хол дамжуулах", "Бүрэн дотоод ойлтоор гэрлийн дохиог хол дамжуулахад", "fibre"),
    ("Эндоскоп", "Эндоскопыг", "Биеийн хөндийн дотор талыг шилэн утсаар харах", "Биеийн хөндийн дотор талыг шилэн утсаар харахад", "fibre"),
    ("Спектрометр", "Спектрометрийг", "Гэрлийн спектрийн бүрэлдэхүүн ба долгионы уртыг тодорхойлох", "Гэрлийн спектрийн бүрэлдэхүүн ба долгионы уртыг тодорхойлоход", "wavelength"),
    ("Интерферометр", "Интерферометрийг", "Интерференцээр долгионы урт, маш бага шугаман хэмжээг хэмжих", "Интерференцээр долгионы урт, маш бага шугаман хэмжээг хэмжихэд", "wavelength"),
    ("Люксметр", "Люксметрийг", "Гадаргуугийн гэрэлтүүлгийг люксээр хэмжих", "Гадаргуугийн гэрэлтүүлгийг люксээр хэмжихэд", "lux"),
    ("Рефрактометр", "Рефрактометрийг", "Шингэний хугарлын илтгэгчийг хэмжих", "Шингэний хугарлын илтгэгчийг хэмжихэд", "index"),
    ("Поляриметр", "Поляриметрийг", "Гэрлийн поляризацийн хавтгайн эргэлтийг хэмжих", "Гэрлийн поляризацийн хавтгайн эргэлтийг хэмжихэд", "polar"),
]


def q42(rng: random.Random, year: int, k: int) -> dict:
    name, accusative, purpose, dative, group = INSTRUMENTS[k % len(INSTRUMENTS)]
    others = [item for item in INSTRUMENTS if item[4] != group]
    if (k // len(INSTRUMENTS)) % 2 == 0:
        prompt = f"{accusative} юунд ашигладаг вэ?"
        answer = purpose
        wrong = text_wrongs(answer, [item[2] for item in others], rng)
    else:
        prompt = f"{dative} ашигладаг багаж аль вэ?"
        answer = name
        wrong = text_wrongs(answer, [item[0] for item in others], rng)
    return {
        "skill": "Оптик багаж",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": f"{name} нь {dative[0].lower() + dative[1:]} ашиглагддаг.",
    }


HYDROGEN_EV = {1: Fraction(-136, 10), 2: Fraction(-34, 10), 3: Fraction(-151, 100), 4: Fraction(-85, 100), 5: Fraction(-54, 100)}


def transition_listing(transitions) -> str:
    return ", ".join(f"{index}) n={a} → n={b}" for index, (a, b) in enumerate(transitions, start=1))


@lru_cache(maxsize=None)
def transition_sets(seed: int) -> tuple:
    rng = random.Random(seed)
    out, seen = [], set()
    while len(out) < 80:
        top = rng.choice((4, 5))
        pairs = [(a, b) for a in range(1, top + 1) for b in range(1, top + 1) if a != b]
        chosen = tuple(rng.sample(pairs, 5))
        ups = sum(b > a for a, b in chosen)
        if ups < 2 or ups > 3 or chosen in seen:
            continue
        seen.add(chosen)
        out.append((top, chosen))
    return tuple(out)


def level_figure(top: int, transitions) -> dict:
    levels = list(range(1, top + 1))
    return {
        "kind": "energy_levels",
        "levels": levels,
        "energies_ev": [float(HYDROGEN_EV[n]) for n in levels],
        "transitions": [list(pair) for pair in transitions],
    }


def q43(rng: random.Random, year: int, k: int) -> dict:
    top, transitions = transition_sets(4343)[k % 80]
    absorbed = [str(i) for i, (a, b) in enumerate(transitions, 1) if b > a]
    emitted = [str(i) for i, (a, b) in enumerate(transitions, 1) if b < a]

    def describe(up, down) -> str:
        return f"{', '.join(sorted(up, key=int))} шингээнэ; {', '.join(sorted(down, key=int))} цацаргана"

    answer = describe(absorbed, emitted)
    pool = [
        describe(emitted, absorbed),
        describe(absorbed[:-1], emitted + absorbed[-1:]),
        describe(absorbed + emitted[:1], emitted[1:]),
        describe(absorbed[1:] + emitted[:1], emitted[1:] + absorbed[:1]),
        "Бүх шилжилтэд фотон шингээгдэнэ",
        "Бүх шилжилтэд фотон цацарна",
    ]
    return {
        "skill": "Атомын энергийн шилжилт",
        "prompt": (
            "Атомын энергийн түвшний хоорондох электроны таван шилжилтийг диаграммд үзүүлэв: "
            f"{transition_listing(transitions)}. Аль шилжилтүүдэд фотон шингээгдэж, аль нь цацаргах вэ?"
        ),
        "answer": answer,
        "wrong": text_wrongs(answer, pool, rng),
        "solution": (
            "Бага энергийн түвшнээс их энергийн түвшин рүү (n ихсэх) шилжихэд фотон шингээгдэж, ихээс бага руу "
            f"шилжихэд фотон цацарна. Иймд {answer}."
        ),
        "figure": level_figure(top, transitions),
    }


PHOTON_QUESTIONS = [
    ("Аль шилжилтэд хамгийн их давтамжтай фотон цацарсан бэ?", "down", max),
    ("Аль шилжилтэд хамгийн бага давтамжтай фотон цацарсан бэ?", "down", min),
    ("Аль шилжилтэд цацарсан фотоны долгионы урт хамгийн их вэ?", "down", min),
    ("Аль шилжилтэд цацарсан фотоны долгионы урт хамгийн бага вэ?", "down", max),
    ("Аль шилжилтэд хамгийн их энергитэй фотон шингээгдсэн бэ?", "up", max),
    ("Аль шилжилтэд хамгийн бага энергитэй фотон шингээгдсэн бэ?", "up", min),
]


def q44(rng: random.Random, year: int, k: int) -> dict:
    top, transitions = transition_sets(4444)[k % 80]
    question, direction, pick = PHOTON_QUESTIONS[k % len(PHOTON_QUESTIONS)]
    candidates = [
        (index, abs(HYDROGEN_EV[b] - HYDROGEN_EV[a]))
        for index, (a, b) in enumerate(transitions, start=1)
        if (b > a) == (direction == "up")
    ]
    best = pick(candidates, key=lambda item: item[1])[0]
    kind = "Шингээх" if direction == "up" else "Цацаргах"
    return {
        "skill": "Фотоны давтамж",
        "prompt": (
            "Устөрөгчийн атомын энергийн түвшин (E_n = −13.6/n² эВ) ба таван шилжилтийг диаграммд үзүүлэв: "
            f"{transition_listing(transitions)}. {question}"
        ),
        "answer": str(best),
        "wrong": [str(index) for index in range(1, 6) if index != best],
        "rank": False,
        "solution": (
            "Фотоны энерги hf = |E_эхний − E_эцсийн|; энерги их бол давтамж их, долгионы урт бага (λ = c/f). "
            f"{kind} шилжилтүүдийн энерги: "
            + "; ".join(f"{index}) {num(gap, 2)} эВ" for index, gap in candidates)
            + f". Иймд {best}-р шилжилт."
        ),
        "figure": level_figure(top, transitions),
    }


ISOTOPES = [
    ("Нүүрстөрөгч", 12, 6), ("Нүүрстөрөгч", 14, 6), ("Азот", 14, 7), ("Хүчилтөрөгч", 16, 8), ("Хүчилтөрөгч", 18, 8),
    ("Натри", 23, 11), ("Магни", 24, 12), ("Хөнгөн цагаан", 27, 13), ("Фосфор", 31, 15), ("Хүхэр", 32, 16),
    ("Хлор", 35, 17), ("Хлор", 37, 17), ("Кали", 39, 19), ("Кали", 40, 19), ("Кальци", 40, 20), ("Төмөр", 56, 26),
    ("Кобальт", 60, 27), ("Зэс", 63, 29), ("Цайр", 65, 30), ("Стронци", 90, 38), ("Иод", 131, 53), ("Цези", 137, 55),
    ("Алт", 197, 79), ("Хар тугалга", 206, 82), ("Хар тугалга", 208, 82), ("Висмут", 209, 83), ("Полони", 210, 84),
    ("Радон", 220, 86), ("Радон", 222, 86), ("Ради", 226, 88), ("Тори", 232, 90), ("Уран", 235, 92), ("Уран", 238, 92),
    ("Плутони", 239, 94),
]


def q45(rng: random.Random, year: int, k: int) -> dict:
    name, mass_number, protons = ISOTOPES[k % len(ISOTOPES)]
    neutrons = mass_number - protons
    if (k // len(ISOTOPES)) % 2 == 0:
        word = "протон"
        prompt = f"{name}-{mass_number} (Z = {protons}) изотопын цөмд хэдэн протон, хэдэн нейтрон байх вэ?"
        solution = f"Протоны тоо Z = {protons}, нейтроны тоо N = A − Z = {mass_number} − {protons} = {neutrons}."
    else:
        word = "электрон"
        prompt = f"Саармаг {name}-{mass_number} (Z = {protons}) атомд хэдэн электрон байх ба цөмд нь хэдэн нейтрон байх вэ?"
        solution = (
            f"Саармаг атомын электроны тоо протоны тоотой тэнцүү: {protons}. "
            f"Нейтроны тоо N = A − Z = {mass_number} − {protons} = {neutrons}."
        )
    answer = f"{protons} {word}, {neutrons} нейтрон"
    return {
        "skill": "Изотопын бүтэц",
        "prompt": prompt,
        "answer": answer,
        # Where Z = N (C-12, O-16, Ca-40 …) the swapped pair is the key itself; pick_wrongs then takes the next one.
        "wrong": pick_wrongs(answer, [
            f"{protons} {word}, {mass_number} нейтрон",
            f"{mass_number} {word}, {protons} нейтрон",
            f"{neutrons} {word}, {protons} нейтрон",
            f"{neutrons} {word}, {mass_number} нейтрон",
            f"{mass_number} {word}, {neutrons} нейтрон",
            f"{protons} {word}, {neutrons + 2} нейтрон",
            f"{protons + 1} {word}, {neutrons - 1} нейтрон",
            f"{mass_number} {word}, {mass_number} нейтрон",
        ]),
        "solution": solution,
        "figure": {"kind": "nuclide", "element": name, "mass_number": mass_number, "atomic_number": protons},
    }


DECAY_CHAINS = [
    ("Тори", 232, 90, "Радон", 220, 86), ("Уран", 238, 92, "Хар тугалга", 206, 82),
    ("Уран", 235, 92, "Хар тугалга", 207, 82), ("Ради", 226, 88, "Радон", 222, 86),
    ("Тори", 232, 90, "Хар тугалга", 208, 82), ("Уран", 238, 92, "Ради", 226, 88),
    ("Уран", 238, 92, "Радон", 222, 86), ("Уран", 238, 92, "Полони", 218, 84),
    ("Уран", 238, 92, "Хар тугалга", 214, 82), ("Уран", 238, 92, "Хар тугалга", 210, 82),
    ("Уран", 238, 92, "Тори", 230, 90), ("Уран", 238, 92, "Уран", 234, 92),
    ("Ради", 226, 88, "Хар тугалга", 206, 82), ("Ради", 226, 88, "Хар тугалга", 210, 82),
    ("Тори", 232, 90, "Ради", 224, 88), ("Тори", 232, 90, "Полони", 216, 84),
    ("Тори", 232, 90, "Хар тугалга", 212, 82), ("Уран", 235, 92, "Ради", 223, 88),
    ("Уран", 235, 92, "Радон", 219, 86), ("Нептуни", 237, 93, "Висмут", 209, 83),
    ("Радон", 222, 86, "Хар тугалга", 206, 82), ("Плутони", 239, 94, "Хар тугалга", 207, 82),
    ("Ради", 228, 88, "Хар тугалга", 208, 82), ("Тори", 230, 90, "Ради", 226, 88),
    ("Полони", 210, 84, "Хар тугалга", 206, 82), ("Хар тугалга", 210, 82, "Хар тугалга", 206, 82),
]
COUNT_WORDS = ["тэг", "нэг", "хоёр", "гурван", "дөрвөн", "таван", "зургаан", "долоон", "найман", "есөн", "арван", "арван нэг"]


def q46(rng: random.Random, year: int, k: int) -> dict:
    parent, parent_a, parent_z, daughter, daughter_a, daughter_z = DECAY_CHAINS[k % len(DECAY_CHAINS)]
    alpha_count = (parent_a - daughter_a) // 4
    beta_count = 2 * alpha_count - (parent_z - daughter_z)

    def alpha_text(count: int) -> str:
        return "альфагүй" if count == 0 else f"{COUNT_WORDS[count]} альфа"

    def beta_text(count: int) -> str:
        return "бетагүй" if count == 0 else f"{COUNT_WORDS[count]} бета"

    answer = f"{alpha_text(alpha_count)}, {beta_text(beta_count)}"
    return {
        "skill": "Цацраг идэвхт задрал",
        "prompt": (
            f"{parent} {parent_a} (Z = {parent_z}) изотоп хэд хэдэн цацраг идэвхт задралын дараа {daughter} "
            f"{daughter_a} (Z = {daughter_z}) изотопын цөм болж хувирсан. Ямар задралууд явагдсан бэ?"
        ),
        "answer": answer,
        "wrong": pick_wrongs(
            answer,
            [
                f"{alpha_text(alpha_count + 1)}, {beta_text(beta_count)}",
                f"{alpha_text(max(1, alpha_count - 1))}, {beta_text(beta_count)}",
                f"{alpha_text(alpha_count)}, {beta_text(beta_count + 1)}",
                f"{alpha_text(alpha_count)}, {beta_text(max(0, beta_count - 1))}",
                f"{alpha_text(beta_count)}, {beta_text(alpha_count)}",
                f"{alpha_text(alpha_count + 2)}, {beta_text(beta_count)}",
                f"{alpha_text(alpha_count + 1)}, {beta_text(beta_count + 1)}",
                f"{alpha_text(alpha_count)}, {beta_text(beta_count + 2)}",
            ],
        ),
        "solution": (
            "Альфа задралд A 4-өөр, Z 2-оор буурна; бета задралд A өөрчлөгдөхгүй, "
            f"Z 1-ээр өснө. ΔA = {parent_a}−{daughter_a} = {parent_a - daughter_a} = 4a тул a = {alpha_count}. "
            f"ΔZ = {parent_z}−{daughter_z} = {parent_z - daughter_z} = 2a − b = {2 * alpha_count} − b тул b = {beta_count}."
        ),
        "figure": {"kind": "decay_chain", "parent": [parent_a, parent_z], "daughter": [daughter_a, daughter_z]},
    }


# ---------------------------------------------------------------------------
# Part II item generators
# ---------------------------------------------------------------------------
# Each task takes scenario `k % len(pool)`, where k is the paper's place in the task's own order (slot 47–50).
# Thirty scenarios put each task text in two of the 60 papers; the first five of each pool are the earlier ones.
# Keys are worked out in exact fractions, and a scenario that breaks a task's rule stops the generator.

SUPERSCRIPT = str.maketrans("-0123456789", "⁻⁰¹²³⁴⁵⁶⁷⁸⁹")


def given(value) -> Fraction:
    """A scenario number as written (0.38, 2.5e-3, 8.31) as an exact fraction, free of binary float error."""
    return Fraction(str(value))


def places(value: Fraction, most: int, label: str) -> Fraction:
    """`value` itself, after checking that it is a decimal ending within `most` places."""
    if (Fraction(value) * 10 ** most).denominator != 1:
        raise ValueError(f"{label} = {float(value)} does not end within {most} decimals")
    return Fraction(value)


def scientific(value: Fraction) -> tuple[Fraction, int]:
    """The mantissa in [1, 10) and the power of ten of an exact positive value."""
    mantissa, exponent = Fraction(value), 0
    while mantissa >= 10:
        mantissa, exponent = mantissa / 10, exponent + 1
    while mantissa < 1:
        mantissa, exponent = mantissa * 10, exponent - 1
    return mantissa, exponent


def sci_exact(value, label: str) -> str:
    """Like `sci`, 1.5·10⁻⁸, for an exact value whose mantissa ends within two decimals."""
    mantissa, exponent = scientific(given(value) if isinstance(value, float) else value)
    return f"{num(places(mantissa, 2, label))}·10{str(exponent).translate(SUPERSCRIPT)}"


CONNECTED_SCENARIOS = [
    # m2 holds while m1_initial < μs·m2 and slides once m1_test > μs·m2; a = (m1_test − μ·m2)g/(m1_test + m2)
    # ends within one decimal.
    dict(m2=10, mu_s=0.4, mu_k=0.2, m1_initial=2, m1_test=5),
    dict(m2=15, mu_s=0.38, mu_k=0.26, m1_initial=3, m1_test=6),
    dict(m2=20, mu_s=0.3, mu_k=0.12, m1_initial=3, m1_test=8),
    dict(m2=12, mu_s=0.5, mu_k=0.25, m1_initial=4, m1_test=8),
    dict(m2=8, mu_s=0.5, mu_k=0.4, m1_initial=2, m1_test=6),
    dict(m2=5, mu_s=0.4, mu_k=0.21, m1_initial=1, m1_test=6),
    dict(m2=6, mu_s=0.45, mu_k=0.3, m1_initial=2, m1_test=7),
    dict(m2=7, mu_s=0.4, mu_k=0.22, m1_initial=2, m1_test=7),
    dict(m2=8, mu_s=0.25, mu_k=0.17, m1_initial=1, m1_test=4),
    dict(m2=9, mu_s=0.6, mu_k=0.46, m1_initial=4, m1_test=9),
    dict(m2=10, mu_s=0.48, mu_k=0.33, m1_initial=3, m1_test=9),
    dict(m2=11, mu_s=0.6, mu_k=0.34, m1_initial=4, m1_test=11),
    dict(m2=12, mu_s=0.25, mu_k=0.1, m1_initial=2, m1_test=8),
    dict(m2=13, mu_s=0.3, mu_k=0.14, m1_initial=3, m1_test=6),
    dict(m2=14, mu_s=0.55, mu_k=0.38, m1_initial=7, m1_test=9),
    dict(m2=14, mu_s=0.6, mu_k=0.43, m1_initial=6, m1_test=12),
    dict(m2=15, mu_s=0.36, mu_k=0.15, m1_initial=4, m1_test=10),
    dict(m2=16, mu_s=0.25, mu_k=0.11, m1_initial=3, m1_test=8),
    dict(m2=17, mu_s=0.5, mu_k=0.2, m1_initial=6, m1_test=13),
    dict(m2=18, mu_s=0.55, mu_k=0.28, m1_initial=8, m1_test=14),
    dict(m2=19, mu_s=0.6, mu_k=0.36, m1_initial=6, m1_test=15),
    dict(m2=20, mu_s=0.42, mu_k=0.29, m1_initial=5, m1_test=10),
    dict(m2=21, mu_s=0.3, mu_k=0.16, m1_initial=5, m1_test=7),
    dict(m2=22, mu_s=0.45, mu_k=0.32, m1_initial=7, m1_test=11),
    dict(m2=23, mu_s=0.5, mu_k=0.4, m1_initial=8, m1_test=12),
    dict(m2=24, mu_s=0.35, mu_k=0.23, m1_initial=7, m1_test=12),
    dict(m2=24, mu_s=0.5, mu_k=0.35, m1_initial=8, m1_test=16),
    dict(m2=25, mu_s=0.32, mu_k=0.19, m1_initial=5, m1_test=10),
    dict(m2=26, mu_s=0.35, mu_k=0.2, m1_initial=6, m1_test=14),
    dict(m2=30, mu_s=0.4, mu_k=0.23, m1_initial=9, m1_test=15),
]


def s21(rng: random.Random, year: int, k: int) -> dict:
    scenario = CONNECTED_SCENARIOS[k % len(CONNECTED_SCENARIOS)]
    m2 = scenario["m2"]
    mu_s = scenario["mu_s"]
    mu_k = scenario["mu_k"]
    m1_initial = scenario["m1_initial"]
    m1_test = scenario["m1_test"]
    weight = m2 * G
    friction = m1_initial * G
    threshold = places(given(mu_s) * m2, 2, "μс·m2")
    acceleration = places((m1_test - given(mu_k) * m2) * 10 / (m1_test + m2), 1, "a")
    # [b] is the static friction m1g only while m2 stays put, and [d] needs m2 to slide.
    if not m1_initial < threshold < m1_test:
        raise ValueError(f"2.1 {scenario}: needs m1_initial < μс·m2 < m1_test")
    return {
        "skill": "Холбосон бие ба үрэлт",
        "prompt": (
            f"m1 = {m1_initial} кг масстай бие ба m2 = {m2} кг масстай биеийг "
            "үл сунах, массгүй утсаар холбон үл хөдлөх эргэвч дээгүүр "
            "тохож байрлуулав. m2 масстай бие ба гадаргуугийн хоорондох "
            f"тайвны үрэлтийн коэффициент μс = {mu_s:g}, гулсахын үрэлтийн "
            f"коэффициент μ = {mu_k:g}. m1 масстай биеийн массыг нэмэгдүүлэх "
            "боломжтой."
        ),
        "parts": [
            {"prompt": f"m2 масстай биеийн хүндийн хүч [a] Н.", "answer": f"{weight:g}"},
            {
                "prompt": f"m1 = {m1_initial} кг байх үед m2 масстай бие ба гадаргуугийн хоорондох үрэлтийн хүч [b] Н.",
                "answer": f"{friction:g}",
            },
            {
                "prompt": f"m1 масстай биеийн массыг [c] кг хүртэл нэмэгдүүлэхэд m2 масстай бие гадаргуу дээгүүр гулсаж эхэлнэ.",
                "answer": num(threshold),
            },
            {
                "prompt": f"m2 масстай бие m1 = {m1_test:g} кг үед [d] м/с² хурдатгалтай гулсана.",
                "answer": num(acceleration),
            },
        ],
        "solution": (
            f"1) P2 = m2g = {m2}·10 = {weight:g} Н. "
            f"2) m1 = {m1_initial} кг үед тайвны үрэлт m1g = {friction:g} Н; "
            f"хязгаар μс·m2g = {num(threshold * 10)} Н тул хөдлөхгүй. "
            f"3) Гулсаж эхлэх нөхцөл m1g = μс·m2g, иймд m1 = μс·m2 = {num(threshold)} кг. "
            f"4) m1 = {m1_test:g} кг үед a = (m1g − μ·m2g)/(m1+m2) = "
            f"{num(acceleration)} м/с²."
        ),
        "figure": {
            "kind": "connected_masses",
            "m2_kg": m2,
            "m1_initial_kg": m1_initial,
            "m1_test_kg": m1_test,
            "mu_s": mu_s,
            "mu_k": mu_k,
        },
    }


GAS_SCENARIOS = [
    # V1 is a whole multiple of 8.31 л, so T1 = p1V1/R is whole. 1–2 is a straight line on the diagram (isobaric
    # where p2 is left out) and 2–3 is isochoric. One state alone has the highest pressure, and each state is that
    # one in ten scenarios, so [a] is 1, 2 or 3 in a third of the papers each. The work in 1–2, the area under the
    # line, comes out in whole joules except in the third and fifth scenarios. The prompt names only p1 and V1
    # (V2, p2 and p3 are read off the figure), so no two scenarios share that pair.
    # State 3 highest: isobaric 1–2, then the pressure rises at constant volume.
    dict(p1=200, v1=8.31, v2=16.62, p3=300),
    dict(p1=100, v1=8.31, v2=24.93, p3=200),
    dict(p1=150, v1=8.31, v2=16.62, p3=250),
    dict(p1=250, v1=8.31, v2=24.93, p3=400),  # p1 was 200 kPa, the first scenario's prompt
    dict(p1=120, v1=8.31, v2=16.62, p3=180),
    dict(p1=100, v1=24.93, v2=33.24, p3=140),
    dict(p1=150, v1=16.62, v2=49.86, p3=220),
    dict(p1=260, v1=8.31, v2=49.86, p3=400),
    dict(p1=300, v1=16.62, v2=24.93, p3=420),
    dict(p1=400, v1=16.62, v2=41.55, p3=600),
    # State 2 highest: the pressure rises along 1–2 and falls at constant volume.
    dict(p1=100, v1=16.62, v2=24.93, p2=300, p3=200),
    dict(p1=120, v1=16.62, v2=33.24, p2=180, p3=80),
    dict(p1=150, v1=24.93, v2=41.55, p2=350, p3=250),
    dict(p1=160, v1=16.62, v2=33.24, p2=240, p3=100),
    dict(p1=180, v1=8.31, v2=33.24, p2=220, p3=120),
    dict(p1=200, v1=16.62, v2=33.24, p2=400, p3=300),
    dict(p1=250, v1=16.62, v2=24.93, p2=350, p3=150),
    dict(p1=300, v1=8.31, v2=16.62, p2=500, p3=200),
    dict(p1=350, v1=8.31, v2=41.55, p2=450, p3=250),
    dict(p1=400, v1=8.31, v2=24.93, p2=600, p3=300),
    # State 1 highest: the pressure falls along 1–2 and stays below p1 at constant volume.
    dict(p1=200, v1=24.93, v2=41.55, p2=100, p3=150),
    dict(p1=220, v1=16.62, v2=24.93, p2=180, p3=120),
    dict(p1=250, v1=24.93, v2=33.24, p2=150, p3=200),
    dict(p1=280, v1=8.31, v2=49.86, p2=120, p3=200),
    dict(p1=300, v1=24.93, v2=41.55, p2=100, p3=200),
    dict(p1=350, v1=16.62, v2=33.24, p2=150, p3=250),
    dict(p1=360, v1=8.31, v2=24.93, p2=240, p3=120),
    dict(p1=450, v1=8.31, v2=16.62, p2=150, p3=300),
    dict(p1=500, v1=8.31, v2=24.93, p2=300, p3=100),
    dict(p1=600, v1=8.31, v2=33.24, p2=200, p3=400),
]


def s22(rng: random.Random, year: int, k: int) -> dict:
    scenario = GAS_SCENARIOS[k % len(GAS_SCENARIOS)]
    p1 = scenario["p1"]
    v1 = scenario["v1"]
    v2 = scenario["v2"]
    p2 = scenario.get("p2", p1)
    p3 = scenario["p3"]
    pressures = [p1, p2, p3]
    highest = pressures.index(max(pressures)) + 1
    temperature1 = places(p1 * given(v1) / given(R), 0, "T1")
    # The area under the straight 1–2 line: p1(V2 − V1) when it is isobaric, (p1 + p2)(V2 − V1)/2 when it slopes.
    work = Decimal(p1 + p2) * (Decimal(str(v2)) - Decimal(str(v1))) / 2000
    places(Fraction(work), 4, "A")
    # [a] has one answer only when one state alone is the highest; 2–3 must change the pressure to be a process.
    if not v2 > v1 or pressures.count(max(pressures)) != 1 or p3 == p2:
        raise ValueError(f"2.2 {scenario}: needs V2 > V1, a single highest pressure and p3 ≠ p2")
    if p2 == p1:
        work_step = f"4) 1–2 изобар процесс: A = p1(V2−V1) = {p1}·10³·({v2:g}−{v1:g})·10⁻³ Ж = {exact(work)} кЖ."
    else:
        work_step = (
            "4) 1–2 процессын график шулуун тул хийн ажил нь түүний доорх трапецийн талбайтай тэнцүү: "
            f"A = (p1+p2)(V2−V1)/2 = ({p1}+{p2})·10³·({v2:g}−{v1:g})·10⁻³/2 Ж = {exact(work)} кЖ."
        )
    return {
        "skill": "Идеал хийн процесс",
        "prompt": (
            "Зурагт нэг моль, нэг атомт идеал хий явагдсан 1–2–3 процессыг "
            "p–V диаграммаар үзүүлэв. 1-р төлөвийн даралт p1 = "
            f"{p1} кПа, эзлэхүүн V1 = {v1:g} л, R = 8.31 Ж/(моль·К)."
        ),
        "parts": [
            {"prompt": "[a] төлөвт даралт хамгийн их байна.", "answer": str(highest)},
            {"prompt": "1-р төлөвийн температур [b] К.", "answer": num(temperature1)},
            {"prompt": "3-р төлөвт даралт [c] кПа.", "answer": f"{p3:g}"},
            {"prompt": "1–2 процесст хийн хийсэн ажил [d] кЖ.", "answer": exact(work), "accept": roundings(work, (3, 2, 1))},
        ],
        "solution": (
            f"1) p1 = {p1} кПа, p2 = {p2} кПа, p3 = {p3} кПа тул {highest}-р төлөвт даралт хамгийн их. "
            f"2) T1 = p1V1/(νR) = {p1}·10³·{v1:g}·10⁻³/(1·8.31) = {num(temperature1)} К. "
            # An isochoric 2–3 fixes V3 = V2; p3 itself is read off the graph (it was "isochoric, so p3 = …").
            f"3) 2–3 изохор процесс тул V3 = V2 = {v2:g} л; графикаас харахад 3-р төлөвийн даралт p3 = {p3} кПа. "
            + work_step
        ),
        "figure": {
            "kind": "p_v_diagram",
            "points": [[v1, p1], [v2, p2], [v2, p3]],
            "labels": ["1", "2", "3"],
        },
    }


CHARGE_SCENARIOS = [
    # Givens with at most two decimals in scientific notation; F = qvB, r = mv/(qB) and T = 2πm/(qB) = [d]·π·10ⁿ
    # come out exact, with [d] whole. The added particles carry whole multiples of e = 1.6·10⁻¹⁹ Кл and about one
    # proton mass or more per unit charge (two or more when the charge is 2e or larger).
    dict(B=2.5e-3, v=3e6, m=5e-23, q=2e-12),
    dict(B=0.1, v=1e6, m=1e-26, q=1e-19),
    dict(B=0.2, v=2e6, m=4e-26, q=2e-19),
    dict(B=0.02, v=5e6, m=2e-26, q=1e-19),
    dict(B=0.05, v=4e6, m=3e-26, q=2e-19),
    dict(B=0.01, v=1e4, m=2.4e-25, q=1.6e-19),
    dict(B=0.01, v=6e4, m=6.4e-27, q=1.6e-19),
    dict(B=0.04, v=1e5, m=3.2e-27, q=1.6e-19),
    dict(B=0.05, v=8e4, m=2e-26, q=1.6e-19),
    dict(B=0.05, v=6e5, m=8e-27, q=1.6e-19),
    dict(B=0.08, v=5e4, m=9.6e-26, q=1.6e-19),
    dict(B=0.15, v=2.5e6, m=6e-27, q=1.6e-19),
    dict(B=0.2, v=2e5, m=8e-26, q=1.6e-19),
    dict(B=0.2, v=1.5e5, m=9.6e-27, q=1.6e-19),
    dict(B=0.25, v=3e5, m=1e-26, q=1.6e-19),
    dict(B=0.4, v=1.5e6, m=4.8e-26, q=1.6e-19),
    dict(B=0.5, v=2e6, m=4e-27, q=1.6e-19),
    dict(B=0.5, v=8e5, m=4.8e-27, q=1.6e-19),
    dict(B=0.5, v=4e6, m=1.6e-27, q=1.6e-19),
    dict(B=0.5, v=6e6, m=6e-27, q=1.6e-19),
    dict(B=0.02, v=1.5e4, m=6.4e-26, q=3.2e-19),
    dict(B=0.05, v=2.5e5, m=1.6e-26, q=3.2e-19),
    dict(B=0.1, v=3e4, m=9.6e-26, q=3.2e-19),
    dict(B=0.1, v=2e4, m=4.8e-25, q=3.2e-19),
    dict(B=0.3, v=5e5, m=2.4e-26, q=3.2e-19),
    dict(B=0.025, v=4e5, m=9.6e-27, q=4.8e-19),
    dict(B=0.25, v=3e6, m=3e-26, q=4.8e-19),
    dict(B=0.25, v=5e6, m=9.6e-27, q=4.8e-19),
    dict(B=0.025, v=4e4, m=3.2e-25, q=6.4e-19),
    dict(B=0.025, v=2.5e4, m=6.4e-25, q=6.4e-19),
]


def s23(rng: random.Random, year: int, k: int) -> dict:
    scenario = CHARGE_SCENARIOS[k % len(CHARGE_SCENARIOS)]
    B = scenario["B"]
    v = scenario["v"]
    m = scenario["m"]
    q = scenario["q"]
    force = given(q) * given(v) * given(B)
    radius_cm = places(100 * given(m) * given(v) / (given(q) * given(B)), 2, "r")
    mantissa, exponent = scientific(given(m) / (given(q) * given(B)))
    coefficient = num(places(2 * mantissa, 0, "T/π"))
    power = "10" + str(exponent).translate(SUPERSCRIPT)
    return {
        "skill": "Соронзон орон дахь цэнэгт бөөм",
        "prompt": (
            "Зургийн хавтгайд перпендикуляр цааш чиглэсэн "
            f"B = {sci_exact(B, 'B')} Тл индукцтэй нэгэн төрлийн соронзон орон байв. "
            "Энэ орны соронзон индукцийн векторт перпендикуляраар "
            f"v = {sci_exact(v, 'v')} м/с хурдтай, m = {sci_exact(m, 'm')} кг масстай, эерэг "
            f"q = {sci_exact(q, 'q')} Кл цэнэгтэй бөөм оруулахад R радиустай тойргоор хөдлөв."
        ),
        "parts": [
            {"prompt": "Соронзон орны зүгээс энэ цэнэгт бөөмд үйлчлэх Лоренцын хүч [a] чиглэлд үйлчилнэ.", "answer": "тойргийн төв рүү"},
            {"prompt": "Лоренцын хүчний хэмжээ [b] Н.", "answer": sci_exact(force, "F")},
            {"prompt": "Цэнэгт бөөм соронзон орон дотор [c] см радиустай тойргоор хөдөлнө.", "answer": num(radius_cm)},
            {"prompt": f"Бөөмийн тойргоор нэг бүтэн эргэх хугацаа T = [d]·π·{power} с болно.", "answer": coefficient},
        ],
        "solution": (
            "Лоренцын хүч F = qvB, чиглэл нь эерэг цэнэгийн хувьд хурд ба "
            "соронзон орны векторт перпендикуляр, тойргийн төв рүү. "
            f"F = {sci_exact(force, 'F')} Н. Радиус r = mv/(qB) = {num(radius_cm)} см. "
            f"Үе T = 2πm/(qB) = {coefficient}π·{power} с, тиймээс [d] = {coefficient}."
        ),
        "figure": {
            "kind": "charged_particle_in_b",
            "B_t": B,
            "speed_m_s": v,
            "mass_kg": m,
            "charge_c": q,
        },
    }


SHM_SCENARIOS = [
    # x = A·sin(nπt + φ): T = 2/n ends within two decimals, A·n² within one, and E = ½·m·n²·A² (times π²)
    # within four, at least 0.01.
    dict(m=0.2, A=0.5, omega=2 * math.pi, phi=math.pi / 3),
    dict(m=0.1, A=0.4, omega=4 * math.pi, phi=math.pi / 6),
    dict(m=0.5, A=0.3, omega=math.pi, phi=math.pi / 4),
    dict(m=0.2, A=0.2, omega=5 * math.pi, phi=math.pi / 2),
    dict(m=0.4, A=0.6, omega=2 * math.pi, phi=math.pi / 6),
    dict(m=0.1, A=0.5, omega=2 * math.pi, phi=math.pi / 2),
    dict(m=0.2, A=0.1, omega=8 * math.pi, phi=math.pi / 4),
    dict(m=0.25, A=0.08, omega=5 * math.pi, phi=math.pi / 6),
    dict(m=0.25, A=0.6, omega=math.pi, phi=math.pi / 2),
    dict(m=0.3, A=0.04, omega=10 * math.pi, phi=math.pi / 2),
    dict(m=0.3, A=0.15, omega=8 * math.pi, phi=math.pi / 3),
    dict(m=0.4, A=0.12, omega=5 * math.pi, phi=math.pi / 3),
    dict(m=0.5, A=0.1, omega=4 * math.pi, phi=math.pi / 4),
    dict(m=0.6, A=0.04, omega=10 * math.pi, phi=math.pi / 3),
    dict(m=0.6, A=0.08, omega=10 * math.pi, phi=math.pi / 4),
    dict(m=0.6, A=0.6, omega=2 * math.pi, phi=math.pi / 3),
    dict(m=0.8, A=0.12, omega=5 * math.pi, phi=math.pi / 2),
    dict(m=0.8, A=0.2, omega=4 * math.pi, phi=math.pi / 6),
    dict(m=0.8, A=0.3, omega=math.pi, phi=math.pi / 4),
    dict(m=1, A=0.05, omega=10 * math.pi, phi=math.pi / 4),
    dict(m=1, A=0.15, omega=8 * math.pi, phi=math.pi / 6),
    dict(m=1, A=0.4, omega=math.pi, phi=math.pi / 2),
    dict(m=1.2, A=0.05, omega=10 * math.pi, phi=math.pi / 6),
    dict(m=1.2, A=0.1, omega=4 * math.pi, phi=math.pi / 3),
    dict(m=1.2, A=0.5, omega=2 * math.pi, phi=math.pi / 6),
    dict(m=1.5, A=0.2, omega=math.pi, phi=math.pi / 3),
    dict(m=1.5, A=0.2, omega=5 * math.pi, phi=math.pi / 4),
    dict(m=1.5, A=0.4, omega=4 * math.pi, phi=math.pi / 6),
    dict(m=2, A=0.12, omega=5 * math.pi, phi=math.pi / 6),
    dict(m=2, A=0.25, omega=4 * math.pi, phi=math.pi / 2),
]


def s24(rng: random.Random, year: int, k: int) -> dict:
    scenario = SHM_SCENARIOS[k % len(SHM_SCENARIOS)]
    m = scenario["m"]
    A = scenario["A"]
    omega = scenario["omega"]
    phi = scenario["phi"]
    phase_denominator = round(math.pi / phi)
    n = round(omega / math.pi)
    period = Decimal(2) / n
    acceleration_coefficient = Decimal(str(A)) * n * n
    energy_coefficient = Decimal(str(m)) * n * n * Decimal(str(A)) ** 2 / 2
    places(Fraction(2, n), 2, "T")
    places(Fraction(acceleration_coefficient), 1, "Aω²/π²")
    # Roundings of the energy are accepted too, so it must not round to 0.
    if places(Fraction(energy_coefficient), 4, "E/π²") < Fraction(1, 100):
        raise ValueError(f"2.4 {scenario}: E/π² below 0.01")
    return {
        "skill": "Гармоник хэлбэлзэл",
        "prompt": (
            f"{m:g} кг масстай бие x = {A:g} sin({'' if n == 1 else n}πt + "
            f"π/{phase_denominator}) хуулиар хэлбэлзэж байна (СИ)."
        ),
        "parts": [
            {"prompt": "Хэлбэлзлийн анхны фаз π/[a] рад.", "answer": str(phase_denominator)},
            {"prompt": "Хэлбэлзлийн үе [b] с.", "answer": exact(period)},
            {"prompt": "Хурдатгалын далайц [c]·π² м/с².", "answer": exact(acceleration_coefficient)},
            {"prompt": "Хэлбэлзлийн бүрэн энерги [d]·π² Ж.", "answer": exact(energy_coefficient), "accept": roundings(energy_coefficient, (3, 2))},
        ],
        "solution": (
            f"1) Анхны фаз π/{phase_denominator} тул [a] = {phase_denominator}. "
            f"2) T = 2π/ω = {exact(period)} с. "
            f"3) a_max = Aω² = {exact(acceleration_coefficient)}π² м/с². "
            f"4) E = ½mω²A² = {exact(energy_coefficient)}π² Ж."
        ),
        "figure": {
            "kind": "shm_displacement_time",
            "mass_kg": m,
            "amplitude_m": A,
            "angular_frequency": omega,
            "initial_phase": phi,
        },
    }


# ---------------------------------------------------------------------------
# Assembly
# ---------------------------------------------------------------------------

MCQ_GENERATORS = [
    q01, q02, q03, q04, q05, q06, q07, q08, q09, q10,
    q11, q12, q13, q14, q15, q16, q17, q18, q19, q20,
    q21, q22, q23, q24, q25, q26, q27, q28, q29, q30,
    q31, q32, q33, q34, q35, q36, q37, q38, q39, q40,
    q41, q42, q43, q44, q45, q46,
]

STRUCTURED_GENERATORS = [s21, s22, s23, s24]


def one_point(year: int, number: int) -> bool:
    if year == 2015:
        return number in ONE_POINT_2015
    if year == 2016:
        return number in ONE_POINT_2016
    return number in ONE_POINT_2017_2026


def part_points(year: int) -> list[int]:
    return [2, 1, 1, 1] if year <= 2016 else [1, 1, 2, 2]


def build(year: int, variant: int) -> None:
    paper = Paper(year, variant)
    for number, generator in enumerate(MCQ_GENERATORS, start=1):
        data = generator(
            random.Random(year * 100_000 + variant * 1_000 + number),
            year,
            slot(year, variant, number),
        )
        paper.mc(number, data, 1 if one_point(year, number) else 2)
    for index, generator in enumerate(STRUCTURED_GENERATORS, start=1):
        # Part II follows its own per-task paper orders, numbered on from the 46 choice questions (47–50).
        data = generator(
            random.Random(year * 100_000 + variant * 1_000 + 100 + index),
            year,
            slot(year, variant, 46 + index),
        )
        paper.structured(f"2.{index}", data, part_points(year))
    paper.save()


def main() -> None:
    for year in range(2015, 2027):
        for variant in range(1, 6):
            build(year, variant)
    print("Generated 60 physics mock papers.")


if __name__ == "__main__":
    main()
