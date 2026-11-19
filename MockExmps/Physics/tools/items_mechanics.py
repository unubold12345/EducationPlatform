"""Part I templates for the ЭЕШ physics mocks: units and scales, kinematics, statics, dynamics, energy, heat,
gases, astronomy and oscillations (24 templates, see TEMPLATES at the end).

Every template takes (rng, year, k) and returns the dict Paper.mc expects. The version, and so the prompt, is
`versions()[k % len(versions())]`; rng only samples distractors. Keys are computed exactly with Fraction.
"""
from __future__ import annotations

import itertools
from functools import lru_cache

from common import *  # noqa: F401,F403
from common import _number_unit  # noqa: F401

F = Fraction


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def mix(seed: int, *pools, limit: int = 400) -> tuple:
    """Each pool shuffled, then dealt in turn, so the first uses cover every kind of question."""
    decks = [shuffled(seed + index, pool)[:limit] for index, pool in enumerate(pools)]
    out = []
    for row in itertools.zip_longest(*decks):
        out.extend(item for item in row if item is not None)
    return tuple(out)


def cycle(seed: int, kind: str, combos, labels: int) -> list:
    """(kind, label index, *combo) with the label index taken in turn after shuffling."""
    return [(kind, index % labels) + tuple(combo) for index, combo in enumerate(shuffled(seed, combos))]


def clean(value, digits: int = 2) -> bool:
    return (F(value) * 10 ** digits).denominator == 1


def qty(value, unit: str, places: int = 4) -> str:
    return f"{num(value, places)} {unit}".strip()


def low(text: str) -> str:
    return text[0].lower() + text[1:]


def cap(text: str) -> str:
    return text[0].upper() + text[1:]


def length_text(metres, centimetres: bool) -> str:
    return qty(F(metres) * 100, "см") if centimetres else qty(metres, "м")


def root(value):
    """The exact square root of a rational square, else None."""
    value = F(value)
    if value < 0:
        return None
    top, bottom = math.isqrt(value.numerator), math.isqrt(value.denominator)
    return F(top, bottom) if top * top == value.numerator and bottom * bottom == value.denominator else None


def approx(value) -> Fraction:
    """An inexact distractor (a wrong root) rounded to hundredths."""
    return F(round(float(value) * 100), 100)


def scaled(factor, final: bool = False) -> str:
    """'3 дахин ихэсгэж' / '2 дахин багасгавал': how a quantity is changed."""
    factor = F(factor)
    if factor > 1:
        return f"{num(factor)} дахин ихэсгэ" + ("вэл" if final else "ж")
    return f"{num(1 / factor)} дахин багасга" + ("вал" if final else "ж")


def factor_options(factor, extra=()) -> tuple[str, list[str]]:
    """The factor_text key and four other factor_text distractors (typical mistakes first)."""
    factor = F(factor)
    answer = factor_text(factor)
    if answer is None:
        raise ValueError(f"no factor text for {factor}")
    out: list[str] = []
    pool = list(extra) + [1 / factor, factor * factor, factor * 2, factor / 2, factor * 4, factor / 4, F(1), F(2),
                          F(1, 2), F(4), F(1, 4), F(3), F(1, 3), F(8), F(1, 8), F(9), F(1, 9), F(16), F(1, 16)]
    for value in pool:
        value = F(value)
        text = factor_text(value) if value > 0 else None
        if text and text != answer and text not in out:
            out.append(text)
    return answer, out[:4]


def sci_text(value) -> str:
    """m·10ⁿ with the mantissa rounded to two decimals (distractors only; keys use sci_exact)."""
    mantissa, exponent = scientific(F(value))
    text = num(mantissa, 2)
    if text == "10":
        text, exponent = "1", exponent + 1
    return f"{text}·10{str(exponent).translate(SUPERSCRIPT)}"


def sci_options(value, unit: str, mistakes, label: str) -> tuple[str, list[str]]:
    answer = f"{sci_exact(F(value), label)} {unit}".strip()
    out: list[str] = []
    for mistake in list(mistakes) + [F(value) * 10, F(value) / 10, F(value) * 2, F(value) / 2, F(value) * 100]:
        if mistake is None or F(mistake) <= 0:
            continue
        text = f"{sci_text(mistake)} {unit}".strip()
        if text != answer and text not in out:
            out.append(text)
    return answer, out[:5]


def signed_options(value, unit: str, mistakes) -> tuple[str, list[str]]:
    answer = qty(value, unit)
    out: list[str] = []
    for mistake in mistakes:
        text = qty(mistake, unit)
        if text != answer and text not in out:
            out.append(text)
    if len(out) < 4:
        raise ValueError(f"too few distractors for {answer!r}")
    return answer, out[:4]


def energy_scale(joules) -> tuple[Fraction, str]:
    joules = F(joules)
    if joules >= 10 ** 6 and clean(joules / 10 ** 6, 2):
        return F(10 ** 6), "МЖ"
    if joules >= 10000 and clean(joules / 1000, 2):
        return F(1000), "кЖ"
    return F(1), "Ж"


def force_scale(newtons) -> tuple[Fraction, str]:
    newtons = F(newtons)
    if newtons >= 10000 and clean(newtons / 1000, 2):
        return F(1000), "кН"
    return F(1), "Н"


def in_scale(value, scale_unit, mistakes, places: int = 3) -> tuple[str, list[str]]:
    """The key in the chosen unit and numeric distractors in the same unit."""
    scale, unit = scale_unit
    answer = qty(F(value) / scale, unit)
    candidates = [F(m) / scale for m in mistakes if m is not None and F(m) > 0]
    return answer, numeric_wrongs(answer, unit, candidates, places)


def energy_text(joules) -> str:
    scale, unit = energy_scale(joules)
    return qty(F(joules) / scale, unit)


def statement_versions(seed: int, topics: int, total: int = 200) -> list:
    """Four distinct topics, each stated truly or falsely (at least one of each), and whether the true or the false
    statements are asked for."""
    rng = random.Random(seed)
    out, seen = [], set()
    while len(out) < total:
        chosen = tuple(rng.sample(range(topics), 4))
        truths = tuple(rng.random() < 0.5 for _ in chosen)
        polarity = rng.random() < 0.6
        if all(truths) or not any(truths) or (chosen, truths, polarity) in seen:
            continue
        seen.add((chosen, truths, polarity))
        out.append((chosen, truths, polarity))
    return out


def statement_item(rng: random.Random, table, chosen, truths, polarity, lead_true: str, lead_false: str):
    lines, picked, notes = [], [], []
    for number, (topic, truth) in enumerate(zip(chosen, truths), start=1):
        right, wrong_text, reason = table[topic]
        lines.append(f"{number}. {right if truth else wrong_text}")
        notes.append(f"{number}) зөв." if truth else f"{number}) буруу: {reason}")
        if truth == polarity:
            picked.append(number)
    answer, wrong = combination_options(rng, picked)
    prompt = (lead_true if polarity else lead_false) + "\n" + "\n".join(lines)
    solution = " ".join(notes) + f" Иймд {'зөв' if polarity else 'буруу'} мэдэгдлүүд: {answer}."
    return prompt, answer, wrong, solution


# ---------------------------------------------------------------------------
# 1. m_units — Хэмжилтийн нэгж
# ---------------------------------------------------------------------------

UNIT_QUANTITIES = [
    # nominative, genitive, SI unit, dimension group (same group = same dimension), category, defining relation
    ("Хурд", "Хурдны", "м/с", "v", "mech", "v = s/t"),
    ("Хурдатгал", "Хурдатгалын", "м/с²", "a", "mech", "a = Δv/t"),
    ("Хүч", "Хүчний", "Н", "F", "mech", "F = ma"),
    ("Биеийн импульс", "Биеийн импульсийн", "кг·м/с", "p", "mech", "p = mv"),
    ("Хүчний импульс", "Хүчний импульсийн", "Н·с", "p", "mech", "Δp = FΔt"),
    ("Механик ажил", "Механик ажлын", "Ж", "E", "mech", "A = Fs"),
    ("Кинетик энерги", "Кинетик энергийн", "Ж", "E", "mech", "E = mv²/2"),
    ("Хүчний момент", "Хүчний моментийн", "Н·м", "E", "mech", "M = Fd"),
    ("Инерцийн момент", "Инерцийн моментийн", "кг·м²", "I", "mech", "I = mr²"),
    ("Чадал", "Чадлын", "Вт", "P", "mech", "P = A/t"),
    ("Даралт", "Даралтын", "Па", "pr", "mech", "p = F/S"),
    ("Нягт", "Нягтын", "кг/м³", "rho", "mech", "ρ = m/V"),
    ("Пүршний хатуулаг", "Пүршний хатуулгийн", "Н/м", "k", "mech", "k = F/x"),
    ("Өнцөг хурд", "Өнцөг хурдны", "рад/с", "w", "mech", "ω = φ/t"),
    ("Өнцөг хурдатгал", "Өнцөг хурдатгалын", "рад/с²", "eps", "mech", "ε = Δω/t"),
    ("Хэлбэлзлийн давтамж", "Хэлбэлзлийн давтамжийн", "Гц", "w", "mech", "ν = N/t"),
    ("Хэлбэлзлийн үе", "Хэлбэлзлийн үеийн", "с", "T", "mech", "T = t/N"),
    ("Эзлэхүүн", "Эзлэхүүний", "м³", "V", "mech", None),
    ("Масс", "Массын", "кг", "m", "mech", None),
    ("Дулааны хэмжээ", "Дулааны хэмжээний", "Ж", "E", "heat", "Q = cmΔt"),
    ("Хувийн дулаан багтаамж", "Хувийн дулаан багтаамжийн", "Ж/(кг·°C)", "c", "heat", "c = Q/(mΔt)"),
    ("Уурших хувийн дулаан", "Уурших хувийн дулааны", "Ж/кг", "L", "heat", "L = Q/m"),
    ("Хайлах хувийн дулаан", "Хайлах хувийн дулааны", "Ж/кг", "L", "heat", "λ = Q/m"),
    ("Түлшний шаталтын хувийн дулаан", "Түлшний шаталтын хувийн дулааны", "Ж/кг", "L", "heat", "q = Q/m"),
    ("Биеийн дулаан багтаамж", "Биеийн дулаан багтаамжийн", "Ж/°C", "C", "heat", "C = Q/Δt"),
    ("Бодисын тоо", "Бодисын тооны", "моль", "nu", "heat", None),
    ("Молийн масс", "Молийн массын", "кг/моль", "M", "heat", "M = m/ν"),
    ("Үнэмлэхүй температур", "Үнэмлэхүй температурын", "К", "Temp", "heat", None),
    ("Молекулын концентраци", "Молекулын концентрацийн", "м⁻³", "n", "heat", "n = N/V"),
    ("Цахилгаан цэнэг", "Цахилгаан цэнэгийн", "Кл", "q", "elec", "q = It"),
    ("Хүчдэл", "Хүчдэлийн", "В", "U", "elec", "U = A/q"),
    ("Цахилгаан эсэргүүцэл", "Цахилгаан эсэргүүцлийн", "Ом", "R", "elec", "R = U/I"),
    ("Гүйдлийн хүч", "Гүйдлийн хүчний", "А", "I", "elec", None),
    ("Цахилгаан багтаамж", "Цахилгаан багтаамжийн", "Ф", "Cap", "elec", "C = q/U"),
    ("Ороомгийн индукц", "Ороомгийн индукцийн", "Гн", "Ind", "elec", "L = Φ/I"),
    ("Соронзон индукц", "Соронзон индукцийн", "Тл", "B", "elec", "B = F/(IL)"),
    ("Соронзон урсгал", "Соронзон урсгалын", "Вб", "Phi", "elec", "Φ = BS"),
]
UNIT_CATEGORIES = {"mech": ("mech",), "heat": ("heat", "mech"), "elec": ("elec",)}
BASE_UNITS = [
    ("Н", "кг·м/с²", "F = ma тул Н = кг·м/с²."),
    ("Ж", "кг·м²/с²", "A = Fs тул Ж = Н·м = (кг·м/с²)·м = кг·м²/с²."),
    ("Вт", "кг·м²/с³", "P = A/t тул Вт = Ж/с = кг·м²/с³."),
    ("Па", "кг/(м·с²)", "p = F/S тул Па = Н/м² = (кг·м/с²)/м² = кг/(м·с²)."),
    ("Н/м", "кг/с²", "Н/м = (кг·м/с²)/м = кг/с²."),
    ("Н·с", "кг·м/с", "Н·с = (кг·м/с²)·с = кг·м/с."),
    ("Ж/кг", "м²/с²", "Ж/кг = (кг·м²/с²)/кг = м²/с²."),
    ("Н·м", "кг·м²/с²", "Н·м = (кг·м/с²)·м = кг·м²/с²."),
]
BASE_FORMS = ["кг·м/с²", "кг·м²/с²", "кг·м²/с³", "кг/(м·с²)", "кг/с²", "кг·м/с", "м²/с²", "кг·м²/с", "кг·м/с³",
              "кг/(м²·с²)", "кг·с²/м", "кг·м³/с²"]


@lru_cache(maxsize=None)
def unit_versions() -> tuple:
    named = [("of", index, stem) for index in range(len(UNIT_QUANTITIES)) for stem in range(2)]
    units = list(dict.fromkeys(item[2] for item in UNIT_QUANTITIES))
    which = [("which", unit, stem) for unit in units for stem in range(2)]
    base = [("base", index, stem) for index in range(len(BASE_UNITS)) for stem in range(2)]
    return mix(101, named, which, base)


def m_units(rng: random.Random, year: int, k: int) -> dict:
    kind, ref, stem = unit_versions()[k % len(unit_versions())]
    if kind == "base":
        unit, form, reason = BASE_UNITS[ref]
        prompt = [
            f"{unit} нэгжийг СИ-ийн үндсэн нэгжүүдээр (кг, м, с) илэрхийлбэл аль нь вэ?",
            f"СИ системд {unit} нэгж үндсэн нэгжүүдээр (кг, м, с) хэрхэн илэрхийлэгдэх вэ?",
        ][stem]
        answer = form
        wrong = text_wrongs(answer, [item for item in BASE_FORMS if item != form], rng)
        solution = reason
    else:
        if kind == "of":
            nom, gen, unit, group, category, relation = UNIT_QUANTITIES[ref]
        else:
            nom, gen, unit, group, category, relation = next(item for item in UNIT_QUANTITIES if item[2] == ref)
        allowed = UNIT_CATEGORIES[category]
        others = [item for item in UNIT_QUANTITIES if item[4] in allowed and item[3] != group]
        if kind == "of":
            prompt = [
                f"{gen} СИ нэгжийг сонго.",
                f"Олон улсын нэгжийн системд (СИ) {low(gen)} нэгж аль нь вэ?",
            ][stem]
            answer = unit
            wrong = text_wrongs(answer, [item[2] for item in others], rng)
        else:
            prompt = [
                f"СИ системд {unit} нэгжээр хэмжигддэг физик хэмжигдэхүүн аль вэ?",
                f"{unit} нь аль физик хэмжигдэхүүний СИ нэгж вэ?",
            ][stem]
            answer = nom
            wrong = text_wrongs(answer, [item[0] for item in others], rng)
        solution = f"{unit} нь {low(gen)} СИ нэгж" + (f": {relation}." if relation else ".")
    return {
        "skill": "Хэмжилтийн нэгж",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "rank": False,
        "solution": solution,
    }


# ---------------------------------------------------------------------------
# 2. m_scale — Хэмжилтийн багажийн хуваарь
# ---------------------------------------------------------------------------

SCALES = [
    # nominative, genitive, unit, steps between numbered marks, what shows the reading
    ("Амперметр", "Амперметрийн", "А", (F(1, 2), F(1), F(2), F(5)), "заагч зүү"),
    ("Миллиамперметр", "Миллиамперметрийн", "мА", (F(10), F(20), F(50), F(100)), "заагч зүү"),
    ("Вольтметр", "Вольтметрийн", "В", (F(1), F(2), F(5), F(10)), "заагч зүү"),
    ("Термометр", "Термометрийн", "°C", (F(5), F(10), F(20)), "шингэний баганын орой"),
    ("Динамометр", "Динамометрийн", "Н", (F(1), F(2), F(5), F(10)), "заагч"),
    ("Мензур", "Мензурын", "мл", (F(10), F(20), F(50), F(100)), "усны түвшин"),
    ("Манометр", "Манометрийн", "кПа", (F(10), F(20), F(50), F(100)), "заагч зүү"),
    ("Спидометр", "Спидометрийн", "км/ц", (F(10), F(20)), "заагч зүү"),
]


@lru_cache(maxsize=None)
def scale_versions() -> tuple:
    values, readings = [], []
    for index, (_, _, _, steps, _) in enumerate(SCALES):
        for step in steps:
            for count in (2, 4, 5, 10, 20):
                if not clean(step / count, 2):
                    continue
                for start in range(5):
                    values.append(("value", index, step, count, start, 0))
                    for mark in range(1, count):
                        readings.append(("reading", index, step, count, start, mark))
    return mix(202, values, readings)


def m_scale(rng: random.Random, year: int, k: int) -> dict:
    kind, index, step, count, start, mark = scale_versions()[k % len(scale_versions())]
    _, gen, unit, _, pointer = SCALES[index]
    lower_mark, upper_mark = step * start, step * (start + 1)
    division = step / count
    lead = (
        f"{gen} хуваарийн зэргэлдээ хоёр тоон тэмдэглэгээ {qty(lower_mark, unit)} ба {qty(upper_mark, unit)} бөгөөд "
        f"тэдгээрийн хооронд {count} хуваалт бий."
    )
    working = (
        "Хуваарийн үнэ нь зэргэлдээ хоёр тоон тэмдэглэгээний зөрүүг тэдгээрийн хоорондох хуваалтын тоонд хуваасантай "
        f"тэнцүү: ({num(upper_mark)} − {num(lower_mark)})/{count} = {qty(division, unit)}."
    )
    if kind == "value":
        answer = qty(division, unit)
        prompt = lead + " Хуваарийн үнийг ол."
        wrong = numeric_wrongs(answer, unit, [step / (count + 1), step / (count - 1), step, upper_mark / count], 3)
        solution = working
    else:
        reading = lower_mark + mark * division
        answer = qty(reading, unit)
        prompt = lead + (
            f" {cap(pointer)} {qty(lower_mark, unit)} тэмдэглэгээнээс их утгын зүг {mark}-р хуваалтын зураас дээр "
            "байна. Багажийн заалтыг ол."
        )
        wrong = numeric_wrongs(answer, unit, [
            lower_mark + mark, upper_mark - mark * division, lower_mark + (mark + 1) * division,
            lower_mark + (mark - 1) * division, lower_mark + mark * step,
        ], 3)
        solution = working + f" Заалт: {num(lower_mark)} + {mark}·{num(division)} = {answer}."
    return {"skill": "Хэмжилтийн багажийн хуваарь", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 3. k_accel — Жигд хувьсах хөдөлгөөн
# ---------------------------------------------------------------------------

VEHICLES = [
    ("Автомашин", 108), ("Мотоцикл", 108), ("Галт тэрэг", 108), ("Автобус", 90), ("Ачааны машин", 90),
    ("Трамвай", 54), ("Троллейбус", 54), ("Дугуйчин", 36),
]
KMH = (18, 36, 54, 72, 90, 108)
ACCELS = (F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5))


def mps(kmh) -> Fraction:
    return F(kmh) * 5 / 18


def with_vehicles(seed: int, kind: str, combos, top) -> list:
    """(kind, vehicle, *combo): the vehicles in turn, skipping any too slow for the combo's top speed in км/ц."""
    out = []
    for index, combo in enumerate(shuffled(seed, combos)):
        able = [name for name, fastest in VEHICLES if fastest >= top(combo)]
        out.append((kind, able[index % len(able)]) + tuple(combo))
    return out


@lru_cache(maxsize=None)
def accel_versions() -> tuple:
    def final_kmh(combo):
        return (combo[0] + combo[1] * combo[2]) * F(18, 5)

    lifts = (5, 8, 10, 12, 16, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60, 64, 75, 80, 96, 100, 125, 150, 200)
    return mix(
        310,
        with_vehicles(311, "uniform_s", [(kmh, t) for kmh in KMH for t in (4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60)],
                      lambda c: c[0]),
        with_vehicles(312, "uniform_t", [
            (kmh, s) for kmh in KMH
            for s in (60, 90, 100, 120, 150, 180, 200, 240, 300, 360, 450, 600, 750, 900, 1200, 1500, 1800, 2700, 3600)
            if clean(s / mps(kmh), 1) and s / mps(kmh) <= 240
        ], lambda c: c[0]),
        with_vehicles(313, "v", [
            (v0, a, t) for v0 in (0, 2, 3, 4, 5, 6, 8, 10, 12, 15) for a in ACCELS for t in (2, 3, 4, 5, 6, 8, 10)
            if v0 + a * t <= 30
        ], final_kmh),
        with_vehicles(314, "a", [
            (k0, k1, t) for k0 in (0, 18, 36, 54) for k1 in KMH if k1 > k0 for t in (2, 4, 5, 8, 10, 15, 20, 25)
            if clean((mps(k1) - mps(k0)) / t, 2) and F(1, 5) <= (mps(k1) - mps(k0)) / t <= 5
        ], lambda c: c[1]),
        with_vehicles(315, "stop", [(kmh, a) for kmh in KMH for a in ACCELS if clean(mps(kmh) / a, 2)], lambda c: c[0]),
        with_vehicles(316, "s", [
            (v0, a, t) for v0 in (0, 1, 2, 3, 4, 5, 6, 8, 10) for a in ACCELS for t in (2, 3, 4, 5, 6, 8, 10)
            if v0 + a * t <= 30
        ], final_kmh),
        with_vehicles(317, "a_rest", [
            (a, t) for a in ACCELS + (F(1, 5), F(2, 5), F(4, 5), F(6, 5)) for t in (2, 3, 4, 5, 6, 8, 10, 12, 15, 20)
            if a * t <= 30
        ], lambda c: c[0] * c[1] * F(18, 5)),
        with_vehicles(318, "brake", [
            (kmh, a) for kmh in KMH for a in ACCELS + (F(4, 5), F(6, 5)) if clean(mps(kmh) ** 2 / (2 * a), 2)
        ], lambda c: c[0]),
        with_vehicles(319, "v_s", [
            (v0, a, s) for v0 in (0, 2, 3, 4, 5, 6, 8, 10, 12) for a in ACCELS for s in lifts
            if root(v0 * v0 + 2 * a * s) is not None and root(v0 * v0 + 2 * a * s).denominator == 1
            and root(v0 * v0 + 2 * a * s) <= 30
        ], lambda c: root(c[0] ** 2 + 2 * c[1] * c[2]) * F(18, 5)),
    )


def k_accel(rng: random.Random, year: int, k: int) -> dict:
    version = accel_versions()[k % len(accel_versions())]
    kind, name, data = version[0], version[1], version[2:]
    small = low(name)
    if kind == "uniform_s":
        kmh, t = data
        v = mps(kmh)
        s = v * t
        prompt = f"{name} {kmh} км/ц тогтмол хурдтай шулуун замаар явж байна. {t} с-д ямар зам туулах вэ?"
        answer = qty(s, "м")
        wrong = numeric_wrongs(answer, "м", [kmh * t, F(kmh * t, 36), s + 10 * v])
        solution = f"v = {kmh} км/ц = {kmh}/3.6 м/с = {num(v)} м/с. s = vt = {num(v)}·{t} = {num(s)} м."
    elif kind == "uniform_t":
        kmh, s = data
        v = mps(kmh)
        t = F(s) / v
        distance = qty(F(s, 1000), "км") if s >= 1000 else qty(s, "м")
        prompt = f"{name} {kmh} км/ц тогтмол хурдтай явж {distance} замыг хэдэн секундэд туулах вэ?"
        answer = qty(t, "с")
        wrong = numeric_wrongs(answer, "с", [F(s, kmh), t * F(18, 5), t + 10])
        solution = (
            f"v = {kmh} км/ц = {kmh}/3.6 м/с = {num(v)} м/с" + (f", s = {distance} = {s} м" if s >= 1000 else "")
            + f". t = s/v = {s}/{num(v)} = {num(t)} с."
        )
    elif kind == "v":
        v0, a, t = data
        v = v0 + a * t
        if v0:
            prompt = f"{v0} м/с хурдтай явж байсан {small} {num(a)} м/с² хурдатгалтай жигд хурдсав. {t} с-ийн дараах хурдыг ол."
        else:
            prompt = f"Тайван байдлаас хөдөлсөн {small} {num(a)} м/с² хурдатгалтай жигд хурдсав. {t} с-ийн дараах хурдыг ол."
        answer = qty(v, "м/с")
        wrong = numeric_wrongs(answer, "м/с", [a * t if v0 else a * t * t, v0 + a * t / 2, v0 + a * t * t, v0 * t + a * t])
        solution = f"v = v0 + at = {v0} + {num(a)}·{t} = {num(v)} м/с."
    elif kind == "a":
        k0, k1, t = data
        v0, v1 = mps(k0), mps(k1)
        a = (v1 - v0) / t
        if k0:
            prompt = f"{name} хурдаа {t} с-д {k0} км/ц-аас {k1} км/ц хүртэл жигд нэмэгдүүлэв. Хурдатгалыг ол."
        else:
            prompt = f"Тайван байдлаас жигд хурдсан {small} {t} с-ийн дараа {k1} км/ц хурдтай болов. Хурдатгалыг ол."
        answer = qty(a, "м/с²")
        wrong = numeric_wrongs(answer, "м/с²", [F(k1 - k0, t), v1 / t if k0 else v1 / (2 * t), (v1 + v0) / t, (v1 - v0) * t])
        solution = (
            f"v0 = {k0} км/ц = {num(v0)} м/с, v = {k1} км/ц = {num(v1)} м/с. "
            f"a = (v − v0)/t = ({num(v1)} − {num(v0)})/{t} = {num(a)} м/с²."
        )
    elif kind == "stop":
        kmh, a = data
        v0 = mps(kmh)
        t = v0 / a
        prompt = (
            f"{kmh} км/ц хурдтай явж байсан {small} тоормослоход {num(a)} м/с² хурдатгалтай жигд саарав. "
            "Зогсох хүртэл хэдэн секунд зарцуулах вэ?"
        )
        answer = qty(t, "с")
        wrong = numeric_wrongs(answer, "с", [F(kmh) / a, v0 * a, v0 / (2 * a), 2 * v0 / a])
        solution = f"v0 = {kmh}/3.6 = {num(v0)} м/с. Зогсоход v = v0 − at = 0 тул t = v0/a = {num(v0)}/{num(a)} = {num(t)} с."
    elif kind == "s":
        v0, a, t = data
        s = v0 * t + a * t * t / 2
        if v0:
            prompt = (
                f"{v0} м/с хурдтай явж байсан {small} {num(a)} м/с² хурдатгалтай жигд хурдсав. "
                f"Хурдасч эхэлснээс хойш {t} с-д туулах замыг ол."
            )
        else:
            prompt = f"Тайван байдлаас хөдөлсөн {small} {num(a)} м/с² хурдатгалтай жигд хурдсав. Эхний {t} с-д туулах замыг ол."
        answer = qty(s, "м")
        wrong = numeric_wrongs(answer, "м", [v0 * t + a * t * t, a * t * t / 2 if v0 else a * t * t / 4, (v0 + a * t) * t])
        solution = f"s = v0t + at²/2 = {v0}·{t} + {num(a)}·{t}²/2 = {num(s)} м."
    elif kind == "a_rest":
        a, t = data
        s = a * t * t / 2
        prompt = f"Тайван байдлаас жигд хурдсан {small} эхний {t} с-д {num(s)} м зам туулав. Хурдатгалыг ол."
        answer = qty(a, "м/с²")
        wrong = numeric_wrongs(answer, "м/с²", [s / (t * t), s / t, 2 * s / t])
        solution = f"Тайван байдлаас хөдөлсөн тул s = at²/2, иймд a = 2s/t² = 2·{num(s)}/{t}² = {num(a)} м/с²."
    elif kind == "brake":
        kmh, a = data
        v0 = mps(kmh)
        s = v0 * v0 / (2 * a)
        prompt = (
            f"{kmh} км/ц хурдтай явж байсан {small} тоормослоод {num(a)} м/с² хурдатгалтай жигд саарч зогсов. "
            "Тоормосны замыг ол."
        )
        answer = qty(s, "м")
        wrong = numeric_wrongs(answer, "м", [v0 * v0 / a, v0 / (2 * a), F(kmh * kmh) / (2 * a)])
        solution = (
            f"v0 = {kmh}/3.6 = {num(v0)} м/с. v² − v0² = −2as ба v = 0 тул s = v0²/(2a) = "
            f"{num(v0)}²/(2·{num(a)}) = {num(s)} м."
        )
    else:  # v_s
        v0, a, s = data
        square = v0 * v0 + 2 * a * s
        v = root(square)
        if v0:
            prompt = (
                f"{v0} м/с хурдтай явж байсан {small} {num(a)} м/с² хурдатгалтай жигд хурдасч {s} м зам туулав. "
                "Эцсийн хурдыг ол."
            )
        else:
            prompt = f"Тайван байдлаас {num(a)} м/с² хурдатгалтай жигд хурдсан {small} {s} м зам туулахад ямар хурдтай болох вэ?"
        answer = qty(v, "м/с")
        wrong = numeric_wrongs(answer, "м/с", [
            square, approx(math.sqrt(2 * a * s)) if v0 else approx(math.sqrt(a * s)),
            approx(math.sqrt(v0 * v0 + a * s)), v0 + a * s / 10,
        ])
        solution = f"v² − v0² = 2as тул v = √(v0² + 2as) = √({v0}² + 2·{num(a)}·{s}) = √{num(square)} = {num(v)} м/с."
    return {"skill": "Жигд хувьсах хөдөлгөөн", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 4. k_circle — Тойргийн дагуух хөдөлгөөн
# ---------------------------------------------------------------------------

ROTORS = [
    # nominative, genitive, radii in metres
    ("Дугуй", "Дугуйн", (F(3, 10), F(2, 5), F(1, 2))),
    ("Сэнс", "Сэнсний", (F(1, 5), F(1, 4), F(3, 10))),
    ("Диск", "Дискийн", (F(1, 10), F(3, 20), F(1, 5))),
    ("Карусель", "Каруселийн", (F(2), F(3), F(4), F(5))),
    ("Тээрмийн чулуу", "Тээрмийн чулууны", (F(2, 5), F(1, 2), F(3, 5))),
    ("Эргэдэг тавцан", "Эргэдэг тавцангийн", (F(1), F(3, 2), F(2))),
    ("Центрифуг", "Центрифугийн", (F(1, 10), F(1, 5), F(1, 4))),
    ("Хөдөлгүүрийн гол", "Хөдөлгүүрийн голын", (F(1, 20), F(1, 10))),
]
PI = F(314, 100)


@lru_cache(maxsize=None)
def circle_versions() -> tuple:
    radii = [(r, radius) for r, (_, _, values) in enumerate(ROTORS) for radius in values]
    n = len(ROTORS)
    return mix(
        400,
        cycle(401, "omega", [
            (phi, t) for phi in (4, 6, 8, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60) for t in (2, 3, 4, 5, 6, 8, 10, 12)
            if clean(F(phi, t), 2) and F(phi, t) >= F(1, 2)
        ], n),
        [("v", r, radius, w, radius < 1 and w % 2 == 0) for r, radius in radii for w in (2, 3, 4, 5, 6, 8, 10, 12, 15, 20)
         if clean(w * radius, 2)],
        [("a_v", r, radius, v) for r, radius in radii for v in (1, 2, 3, 4, 5, 6, 8, 10)
         if clean(v * v / radius, 2) and v * v / radius <= 1000],
        [("a_w", r, radius, w) for r, radius in radii for w in (2, 3, 4, 5, 6, 8, 10) if clean(w * w * radius, 2)],
        cycle(402, "period", [
            (count, t, ask) for count in (5, 10, 12, 15, 20, 24, 30, 40, 50, 60, 100, 120)
            for t in (2, 4, 5, 6, 10, 12, 15, 20, 30, 60) for ask in ("T", "nu")
            if clean(F(t, count), 3) and clean(F(count, t), 2)
        ], n),
        [("v_T", r, radius, period) for r, radius in radii
         for period in (F(1, 2), F(1), F(2), F(3), F(4), F(5), F(6), F(8), F(10), F(12), F(20))
         if clean(2 * PI * radius / period, 3)],
        cycle(403, "eps_w", [
            (eps, t, w0) for eps in (F(1, 2), F(1), F(2), F(3), F(4), F(5)) for t in (2, 3, 4, 5, 6, 8, 10)
            for w0 in (0, 2, 4, 5, 10)
        ], n),
        cycle(404, "eps_phi", [
            (eps, t) for eps in (F(1, 2), F(1), F(2), F(3), F(4), F(5), F(6)) for t in (2, 3, 4, 5, 6, 8, 10)
        ], n),
        cycle(405, "eps_find", [
            (w0, w, t) for w0 in (0, 2, 4, 5, 6, 10) for w in (8, 10, 12, 15, 20, 24, 30, 40) if w > w0
            for t in (2, 4, 5, 8, 10) if clean(F(w - w0, t), 2)
        ], n),
        cycle(406, "eps_stop", [
            (w0, eps) for w0 in (6, 8, 10, 12, 15, 20, 24, 30, 40, 50) for eps in (F(1, 2), F(1), F(2), F(3), F(4), F(5))
            if clean(w0 / eps, 2)
        ], n),
    )


def k_circle(rng: random.Random, year: int, k: int) -> dict:
    version = circle_versions()[k % len(circle_versions())]
    kind, r, data = version[0], version[1], version[2:]
    nom, gen, _ = ROTORS[r]
    if kind == "omega":
        phi, t = data
        w = F(phi, t)
        prompt = f"{nom} {t} с-д {phi} рад өнцгөөр жигд эргэв. Өнцөг хурдыг ол."
        answer = qty(w, "рад/с")
        wrong = numeric_wrongs(answer, "рад/с", [phi * t, F(t, phi), F(phi, 2 * t), F(2 * phi, t)])
        solution = f"ω = φ/t = {phi}/{t} = {num(w)} рад/с."
    elif kind == "v":
        radius, w, centimetres = data
        v = w * radius
        prompt = (
            f"{nom} {w} рад/с өнцөг хурдтай жигд эргэж байна. Эргэлтийн тэнхлэгээс {length_text(radius, centimetres)} "
            "зайд орших цэгийн шугаман хурдыг ол."
        )
        answer = qty(v, "м/с")
        wrong = numeric_wrongs(answer, "м/с", [w * radius * 100 if centimetres else w / radius, w * radius * radius, w / radius])
        solution = f"v = ωR = {w}·{num(radius)} = {num(v)} м/с" + (f" (R = {num(radius)} м)." if centimetres else ".")
    elif kind == "a_v":
        radius, v = data
        a = F(v * v) / radius
        prompt = (
            f"{gen} хамгийн захын цэг {num(radius)} м радиустай тойргоор {v} м/с шугаман хурдтай жигд хөдөлнө. "
            "Энэ цэгийн төв рүү тэмүүлэх хурдатгалыг ол."
        )
        answer = qty(a, "м/с²")
        wrong = numeric_wrongs(answer, "м/с²", [v / radius, v * v * radius, v * radius, F(v * v) / (2 * radius)])
        solution = f"a = v²/R = {v}²/{num(radius)} = {num(a)} м/с²."
    elif kind == "a_w":
        radius, w = data
        a = w * w * radius
        prompt = (
            f"{nom} {w} рад/с өнцөг хурдтай жигд эргэж байна. Тэнхлэгээс {num(radius)} м зайд орших цэгийн төв рүү "
            "тэмүүлэх хурдатгалыг ол."
        )
        answer = qty(a, "м/с²")
        wrong = numeric_wrongs(answer, "м/с²", [w * radius, w * radius * radius, w * w / radius, w * w * radius / 2])
        solution = f"a = ω²R = {w}²·{num(radius)} = {num(a)} м/с²."
    elif kind == "period":
        count, t, ask = data
        period, frequency = F(t, count), F(count, t)
        lead = f"{nom} {t} с-д {count} бүтэн эргэлт жигд хийв."
        if ask == "T":
            prompt = lead + " Эргэлтийн үеийг ол."
            answer = qty(period, "с")
            wrong = numeric_wrongs(answer, "с", [frequency, t * count, period * 2], 3)
            solution = f"T = t/N = {t}/{count} = {num(period)} с."
        else:
            prompt = lead + " Эргэлтийн давтамжийг ол."
            answer = qty(frequency, "Гц")
            wrong = numeric_wrongs(answer, "Гц", [period, t * count, frequency * 2], 3)
            solution = f"ν = N/t = {count}/{t} = {num(frequency)} Гц."
    elif kind == "v_T":
        radius, period = data
        v = 2 * PI * radius / period
        prompt = (
            f"{gen} хамгийн захын цэгийн эргэх тойргийн радиус {num(radius)} м, эргэлтийн үе {num(period)} с. "
            "Энэ цэгийн шугаман хурдыг ол. (π ≈ 3.14)"
        )
        answer = qty(v, "м/с")
        wrong = numeric_wrongs(answer, "м/с", [PI * radius / period, radius / period, 2 * PI * radius * period, 2 * PI * period / radius], 3)
        solution = f"v = 2πR/T = 2·3.14·{num(radius)}/{num(period)} = {num(v)} м/с."
    elif kind == "eps_w":
        eps, t, w0 = data
        w = w0 + eps * t
        if w0:
            prompt = (
                f"{w0} рад/с өнцөг хурдтай эргэж байсан {low(nom)} {num(eps)} рад/с² тогтмол өнцөг хурдатгалтай "
                f"хурдсав. {t} с-ийн дараах өнцөг хурдыг ол."
            )
        else:
            prompt = (
                f"{nom} тайван байдлаас {num(eps)} рад/с² тогтмол өнцөг хурдатгалтай эргэж эхлэв. "
                f"{t} с-ийн дараах өнцөг хурдыг ол."
            )
        answer = qty(w, "рад/с")
        wrong = numeric_wrongs(answer, "рад/с", [eps * t if w0 else eps * t * t, w0 + eps * t / 2, w0 + eps * t * t, eps * t * t / 2])
        solution = f"ω = ω0 + εt = {w0} + {num(eps)}·{t} = {num(w)} рад/с."
    elif kind == "eps_phi":
        eps, t = data
        phi = eps * t * t / 2
        prompt = (
            f"{nom} тайван байдлаас {num(eps)} рад/с² тогтмол өнцөг хурдатгалтай эргэж эхлэв. "
            f"Эхний {t} с-д ямар өнцгөөр эргэх вэ?"
        )
        answer = qty(phi, "рад")
        wrong = numeric_wrongs(answer, "рад", [eps * t * t, eps * t, eps * t * t / 4])
        solution = f"φ = εt²/2 = {num(eps)}·{t}²/2 = {num(phi)} рад."
    elif kind == "eps_find":
        w0, w, t = data
        eps = F(w - w0, t)
        prompt = f"{gen} өнцөг хурд {t} с-д {w0} рад/с-ээс {w} рад/с хүртэл жигд өсөв. Өнцөг хурдатгалыг ол."
        answer = qty(eps, "рад/с²")
        wrong = numeric_wrongs(answer, "рад/с²", [(w - w0) * t, F(w, t) if w0 else F(w, 2 * t), F(w + w0, t)])
        solution = f"ε = (ω − ω0)/t = ({w} − {w0})/{t} = {num(eps)} рад/с²."
    else:  # eps_stop
        w0, eps = data
        t = w0 / eps
        prompt = (
            f"{w0} рад/с өнцөг хурдтай эргэж байсан {low(nom)} {num(eps)} рад/с² өнцөг хурдатгалтай жигд саарав. "
            "Зогсох хүртэлх хугацааг ол."
        )
        answer = qty(t, "с")
        wrong = numeric_wrongs(answer, "с", [w0 * eps, eps / w0, w0 / (2 * eps), 2 * w0 / eps])
        solution = f"0 = ω0 − εt тул t = ω0/ε = {w0}/{num(eps)} = {num(t)} с."
    return {"skill": "Тойргийн дагуух хөдөлгөөн", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 5. k_throw — Шидэгдсэн биеийн хөдөлгөөн
# ---------------------------------------------------------------------------

THROWN = [
    ("Бөмбөг", "бөмбөгийг"), ("Чулуу", "чулууг"), ("Теннисний бөмбөг", "теннисний бөмбөгийг"),
    ("Хайрга", "хайргыг"), ("Ган бөмбөлөг", "ган бөмбөлгийг"), ("Сагсан бөмбөг", "сагсан бөмбөгийг"),
]
HIGH_PLACES = ["хадны оройгоос", "байшингийн дээврээс", "цамхгийн оройгоос", "гүүрэн дээрээс", "тагтнаас"]
LOW_PLACES = ["ширээний ирмэгээс", "тавиурын ирмэгээс"]
FALL_TIMES = (F(2, 5), F(1, 2), F(1), F(6, 5), F(3, 2), F(2), F(5, 2), F(3), F(4))
THROW_ANGLES = [
    ("sin α = 0.6, cos α = 0.8", F(3, 5), F(4, 5)),
    ("sin α = 0.8, cos α = 0.6", F(4, 5), F(3, 5)),
    ("α = 30°; sin 30° = 0.5, cos 30° ≈ 0.87", F(1, 2), F(87, 100)),
    ("α = 60°; sin 60° ≈ 0.87, cos 60° = 0.5", F(87, 100), F(1, 2)),
]
NO_AIR = "(g = 10 м/с², агаарын эсэргүүцлийг тооцохгүй)"


@lru_cache(maxsize=None)
def throw_versions() -> tuple:
    n = len(THROWN)
    horizontal = [(t, v0) for t in FALL_TIMES for v0 in (2, 3, 4, 5, 6, 8, 10, 12, 15, 20)]
    upward = [v0 for v0 in (4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30, 40)]
    angled = []
    for spec in range(len(THROW_ANGLES)):
        _, sine, cosine = THROW_ANGLES[spec]
        for v0 in (5, 10, 15, 20, 25, 30, 40, 50):
            for ask in ("vx", "vy", "vtop", "ttop", "hmax", "flight"):
                if ask == "hmax" and sine.denominator == 100:
                    continue
                angled.append((v0, spec, ask))
    return mix(
        500,
        cycle(501, "h_time", horizontal, n),
        cycle(502, "h_range", horizontal, n),
        cycle(503, "h_height", [(t, v0) for t, v0 in horizontal if t >= F(1, 2)], n),
        cycle(504, "up", [(v0, ask) for v0 in upward for ask in ("hmax", "ttop", "total")], n),
        cycle(505, "up_v0", [(t,) for t in (F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4))], n),
        cycle(506, "angle", angled, n),
    )


def k_throw(rng: random.Random, year: int, k: int) -> dict:
    version = throw_versions()[k % len(throw_versions())]
    kind, b, data = version[0], version[1], version[2:]
    nom, acc = THROWN[b]
    if kind in ("h_time", "h_range", "h_height"):
        t, v0 = data
        h = 5 * t * t
        places = LOW_PLACES if h < 2 else HIGH_PLACES
        place = places[(int(v0) + int(t * 10)) % len(places)]
        distance = v0 * t
        lead = f"{num(h)} м өндөр {place} {acc} хэвтээ чиглэлд {v0} м/с хурдтай шидэв."
        fall = f"h = gt²/2 тул t = √(2h/g) = √(2·{num(h)}/10) = {num(t)} с."
        if kind == "h_time":
            prompt = f"{lead} Газарт унах хүртэлх хугацааг ол. {NO_AIR}"
            answer = qty(t, "с")
            wrong = numeric_wrongs(answer, "с", [2 * h / 10, h / v0, approx(math.sqrt(h / 10)), v0 * t / 10])
            solution = fall + " Хэвтээ хурд унах хугацаанд нөлөөлөхгүй."
        elif kind == "h_range":
            prompt = f"{lead} Шидсэн цэгийн эгц доорх цэгээс ямар хэвтээ зайд газарт унах вэ? {NO_AIR}"
            answer = qty(distance, "м")
            wrong = numeric_wrongs(answer, "м", [v0 * 2 * h / 10, v0 * t / 2, v0 * t * t, h])
            solution = fall + f" L = v0·t = {v0}·{num(t)} = {num(distance)} м."
        else:
            prompt = (
                f"Хэвтээ чиглэлд {v0} м/с хурдтай шидсэн {low(nom)} шидсэн цэгийнхээ эгц доорх цэгээс {num(distance)} м "
                f"зайд газарт унав. Ямар өндрөөс шидсэн бэ? {NO_AIR}"
            )
            answer = qty(h, "м")
            wrong = numeric_wrongs(answer, "м", [10 * t * t, distance, 10 * t / 2, distance * distance / v0])
            solution = f"t = L/v0 = {num(distance)}/{v0} = {num(t)} с. h = gt²/2 = 10·{num(t)}²/2 = {num(h)} м."
    elif kind == "up":
        v0, ask = data
        height, top = F(v0 * v0, 20), F(v0, 10)
        lead = f"{cap(acc)} босоо дээш {v0} м/с хурдтай шидэв."
        if ask == "hmax":
            prompt = f"{lead} Хамгийн дээд өргөгдөх өндрийг ол. {NO_AIR}"
            answer = qty(height, "м")
            wrong = numeric_wrongs(answer, "м", [F(v0 * v0, 10), F(v0, 20), F(v0 * v0, 2)])
            solution = f"Дээд цэгт v = 0: H = v0²/(2g) = {v0}²/20 = {num(height)} м."
        elif ask == "ttop":
            prompt = f"{lead} Хамгийн дээд цэгтээ хүрэх хугацааг ол. {NO_AIR}"
            answer = qty(top, "с")
            wrong = numeric_wrongs(answer, "с", [2 * top, top / 2, F(v0 * v0, 20)])
            solution = f"Дээд цэгт v = v0 − gt = 0 тул t = v0/g = {v0}/10 = {num(top)} с."
        else:
            prompt = f"{lead} Шидсэн цэгтээ буцаж ирэх хүртэлх хугацааг ол. {NO_AIR}"
            answer = qty(2 * top, "с")
            wrong = numeric_wrongs(answer, "с", [top, 4 * top, F(v0 * v0, 20)])
            solution = f"Өгсөх хугацаа t = v0/g = {num(top)} с, буух хугацаа мөн адил; нийт 2v0/g = {num(2 * top)} с."
    elif kind == "up_v0":
        (t,) = data
        v0, height = 10 * t, 5 * t * t
        prompt = f"Босоо дээш шидсэн {low(nom)} хамгийн ихдээ {num(height)} м өндөрт өргөгдөв. Анхны хурдыг ол. {NO_AIR}"
        answer = qty(v0, "м/с")
        wrong = numeric_wrongs(answer, "м/с", [20 * height, approx(math.sqrt(10 * height)), 2 * height])
        solution = f"H = v0²/(2g) тул v0 = √(2gH) = √(20·{num(height)}) = {num(v0)} м/с."
    else:  # angle
        v0, spec, ask = data
        text, sine, cosine = THROW_ANGLES[spec]
        vx, vy = v0 * cosine, v0 * sine
        lead = f"{cap(acc)} хэвтээ чиглэлтэй α өнцөг үүсгэн {v0} м/с хурдтай шидэв ({text})."
        if ask == "vx":
            prompt = f"{lead} Анхны хурдны хэвтээ байгуулагчийг ол."
            answer = qty(vx, "м/с")
            wrong = numeric_wrongs(answer, "м/с", [vy, v0, v0 * (sine + cosine)])
            solution = f"vx = v0·cos α = {v0}·{num(cosine)} = {num(vx)} м/с."
        elif ask == "vy":
            prompt = f"{lead} Анхны хурдны босоо байгуулагчийг ол."
            answer = qty(vy, "м/с")
            wrong = numeric_wrongs(answer, "м/с", [vx, v0, v0 * (sine + cosine)])
            solution = f"vy = v0·sin α = {v0}·{num(sine)} = {num(vy)} м/с."
        elif ask == "vtop":
            prompt = f"{lead} Траекторын хамгийн дээд цэг дэх биеийн хурдыг ол. (Агаарын эсэргүүцлийг тооцохгүй)"
            answer = qty(vx, "м/с")
            wrong = numeric_wrongs(answer, "м/с", [vy, v0, v0 / 2 if v0 / 2 != vx else v0 * 2])
            solution = f"Дээд цэгт хурдны босоо байгуулагч 0, хэвтээ байгуулагч өөрчлөгдөхгүй: v = v0·cos α = {num(vx)} м/с."
        elif ask == "ttop":
            prompt = f"{lead} Траекторын хамгийн дээд цэгт хүрэх хугацааг ол. {NO_AIR}"
            answer = qty(vy / 10, "с")
            wrong = numeric_wrongs(answer, "с", [vx / 10, 2 * vy / 10, F(v0, 10)], 3)
            solution = f"t = v0·sin α/g = {v0}·{num(sine)}/10 = {num(vy / 10)} с."
        elif ask == "hmax":
            prompt = f"{lead} Хамгийн дээд өргөгдөх өндрийг ол. {NO_AIR}"
            answer = qty(vy * vy / 20, "м")
            wrong = numeric_wrongs(answer, "м", [vy * vy / 10, F(v0 * v0, 20), vx * vx / 20], 3)
            solution = f"H = (v0·sin α)²/(2g) = {num(vy)}²/20 = {num(vy * vy / 20)} м."
        else:
            prompt = f"{lead} Шидсэн түвшиндээ буцаж унах хүртэлх нислэгийн хугацааг ол. {NO_AIR}"
            answer = qty(2 * vy / 10, "с")
            wrong = numeric_wrongs(answer, "с", [vy / 10, 2 * vx / 10, F(2 * v0, 10)], 3)
            solution = f"t = 2v0·sin α/g = 2·{v0}·{num(sine)}/10 = {num(2 * vy / 10)} с."
    return {"skill": "Шидэгдсэн биеийн хөдөлгөөн", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 6. st_moment — Хүчний момент
# ---------------------------------------------------------------------------

MOMENT_SETTINGS = [
    # perpendicular-force wording, arms in metres
    ("Гаечны түлхүүрийн бариулыг самраас {d} зайд бариулд перпендикуляр {F} Н хүчээр татав. "
     "Самрын тэнхлэгийн хувьд энэ хүчний моментийг ол.", (F(3, 20), F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 2))),
    ("Хаалганы нугаснаас {d} зайд хаалганы хавтгайд перпендикуляр {F} Н хүчээр түлхэв. "
     "Нугасны тэнхлэгийн хувьд хүчний моментийг ол.", (F(1, 2), F(3, 5), F(7, 10), F(4, 5), F(9, 10), F(1))),
    ("Унадаг дугуйн дөрөөний бариулын урт {d}. Бариулд перпендикуляр {F} Н хүчээр дөрөөг дарав. "
     "Эргэлтийн тэнхлэгийн хувьд хүчний моментийг ол.", (F(3, 20), F(4, 25), F(17, 100), F(9, 50), F(1, 5))),
    ("Нэг үзүүрээрээ тэнхлэгт бэхлэгдсэн {d} урттай хөнгөн савааны нөгөө үзүүрт саваанд перпендикуляр {F} Н хүч "
     "үйлчилнэ. Тэнхлэгийн хувьд хүчний моментийг ол.", (F(2, 5), F(1, 2), F(3, 5), F(4, 5), F(1), F(6, 5), F(3, 2), F(2))),
    ("Автомашины жолооны хүрдний радиус {d}. Хүрдний ирмэгт шүргэгчийн дагуу {F} Н хүч үйлчилнэ. "
     "Хүрдний тэнхлэгийн хувьд хүчний моментийг ол.", (F(9, 50), F(1, 5), F(11, 50), F(1, 4))),
]
MOMENT_ANGLED = [
    ("Гаечны түлхүүрийн бариулыг самраас {d} зайд бариултай 30° өнцөг үүсгэх чиглэлд {F} Н хүчээр татав. "
     "Самрын тэнхлэгийн хувьд энэ хүчний моментийг ол. (sin 30° = 0.5)", (F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 2))),
    ("Нэг үзүүрээрээ тэнхлэгт бэхлэгдсэн {d} урттай хөнгөн савааны нөгөө үзүүрт саваатай 30° өнцөг үүсгэсэн {F} Н "
     "хүч үйлчилнэ. Тэнхлэгийн хувьд хүчний моментийг ол. (sin 30° = 0.5)", (F(2, 5), F(1, 2), F(4, 5), F(1), F(6, 5), F(2))),
    ("Хаалганы нугаснаас {d} зайд хаалганы хавтгайтай 30° өнцөг үүсгэсэн {F} Н хүчээр татав. "
     "Нугасны тэнхлэгийн хувьд хүчний моментийг ол. (sin 30° = 0.5)", (F(3, 5), F(4, 5), F(9, 10), F(1))),
]
MOMENT_FORCES = (10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200)


@lru_cache(maxsize=None)
def moment_versions() -> tuple:
    perpendicular = [(s, d, force, (index + force) % 2 == 0)
                     for s, (_, arms) in enumerate(MOMENT_SETTINGS) for index, d in enumerate(arms) for force in MOMENT_FORCES
                     if clean(force * d, 2)]
    angled = [(s, d, force, (index + force) % 2 == 1)
              for s, (_, arms) in enumerate(MOMENT_ANGLED) for index, d in enumerate(arms) for force in MOMENT_FORCES
              if clean(force * d / 2, 2)]
    find_force = [(moment, d) for moment in (6, 8, 10, 12, 15, 20, 24, 30, 36, 40, 45, 50, 60, 80, 100)
                  for d in (F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 2), F(3, 5)) if clean(moment / d, 1)]
    find_arm = [(force, moment) for force in (20, 25, 40, 50, 60, 80, 100, 120, 150, 200)
                for moment in (5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 50, 60) if clean(F(moment, force), 2) and F(moment, force) <= 2]
    sums = [(f1, d1, f2, d2, same)
            for f1 in (10, 20, 30, 40, 50, 60) for d1 in (F(1, 5), F(2, 5), F(1, 2), F(3, 5), F(4, 5), F(1))
            for f2 in (15, 20, 25, 40, 80) for d2 in (F(3, 10), F(1, 2), F(4, 5), F(6, 5)) for same in (False, True)
            if f1 != f2 and d1 != d2 and f1 * d1 != f2 * d2]
    return mix(600, [("perp",) + item for item in perpendicular], [("angled",) + item for item in angled],
               [("find_force",) + item for item in find_force], [("find_arm",) + item for item in find_arm],
               [("sum",) + item for item in sums])


def st_moment(rng: random.Random, year: int, k: int) -> dict:
    version = moment_versions()[k % len(moment_versions())]
    kind, data = version[0], version[1:]
    if kind in ("perp", "angled"):
        setting, d, force, centimetres = data
        wording = (MOMENT_SETTINGS if kind == "perp" else MOMENT_ANGLED)[setting][0]
        arm = d if kind == "perp" else d / 2
        moment = force * arm
        prompt = wording.format(d=length_text(d, centimetres), F=force)
        answer = qty(moment, "Н·м")
        mistakes = [force / d, force * d * 100 if centimetres else force * d * 2]
        if kind == "angled":
            mistakes = [force * d, force * d * F(87, 100)] + mistakes
        wrong = numeric_wrongs(answer, "Н·м", mistakes)
        if kind == "perp":
            solution = (
                "Хүч тэнхлэгээс үйлчлэх цэг хүртэлх шулуунд перпендикуляр тул хүчний мөр энэ зайтай тэнцүү: "
                f"M = F·d = {force}·{num(d)} = {num(moment)} Н·м."
            )
        else:
            solution = f"Хүчний мөр d·sin 30° = {num(d)}·0.5 = {num(arm)} м. M = F·d·sin 30° = {force}·{num(arm)} = {num(moment)} Н·м."
    elif kind == "find_force":
        moment, d = data
        force = moment / d
        prompt = (
            f"Самрыг суллахад {moment} Н·м хүчний момент шаардлагатай. Самраас {num(d)} м зайд гаечны түлхүүрийн "
            "бариулд перпендикуляр ямар хүч үйлчлүүлэх вэ?"
        )
        answer = qty(force, "Н")
        wrong = numeric_wrongs(answer, "Н", [moment * d, F(moment) / (d * 100), d / moment * 1000])
        solution = f"M = F·d тул F = M/d = {moment}/{num(d)} = {num(force)} Н."
    elif kind == "find_arm":
        force, moment = data
        arm = F(moment, force)
        prompt = f"{force} Н хүч эргэлтийн тэнхлэгийн хувьд {moment} Н·м хүчний момент үүсгэв. Хүчний мөрийг ол."
        answer = qty(arm, "м")
        wrong = numeric_wrongs(answer, "м", [F(force, moment), F(moment * force, 100), arm * 10], 3)
        solution = f"M = F·d тул d = M/F = {moment}/{force} = {num(arm)} м."
    else:
        f1, d1, f2, d2, same = data
        if same:
            total = f1 * d1 + f2 * d2
            prompt = (
                f"Хөнгөн саваа хэвтээ байрлалд О тэнхлэгийг тойрон эргэх боломжтой. Тэнхлэгээс баруун тийш {num(d1)} м ба "
                f"{num(d2)} м зайд харгалзан {f1} Н ба {f2} Н хүчнүүд босоо доош үйлчилнэ. Тэнхлэгийн хувьд эдгээр "
                "хүчний нийлбэр моментийг ол."
            )
            other = abs(f1 * d1 - f2 * d2)
            solution = (
                f"Хоёр хүч савааг нэг чиглэлд эргүүлэх тул моментуудыг нэмнэ: M = {f1}·{num(d1)} + {f2}·{num(d2)} = "
                f"{num(total)} Н·м."
            )
        else:
            total = abs(f1 * d1 - f2 * d2)
            prompt = (
                f"Хөнгөн саваа хэвтээ байрлалд О тэнхлэгийг тойрон эргэх боломжтой. Тэнхлэгээс зүүн тийш {num(d1)} м зайд "
                f"{f1} Н, баруун тийш {num(d2)} м зайд {f2} Н хүчнүүд босоо доош үйлчилнэ. Тэнхлэгийн хувьд эдгээр "
                "хүчний нийлбэр моментийн модулийг ол."
            )
            other = f1 * d1 + f2 * d2
            solution = (
                f"Хүчнүүд савааг эсрэг чиглэлд эргүүлэх тул моментуудыг хасна: M = |{f1}·{num(d1)} − {f2}·{num(d2)}| = "
                f"{num(total)} Н·м."
            )
        answer = qty(total, "Н·м")
        wrong = numeric_wrongs(answer, "Н·м", [other, (f1 + f2) * (d1 + d2), f1 * d1, f2 * d2])
    return {"skill": "Хүчний момент", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 7. st_hydraulic — Шингэнт шахуурга
# ---------------------------------------------------------------------------

PRESSES = ["Шингэнт шахуургын", "Гидравлик домкратын", "Гидравлик өргөгчийн", "Гидравлик хэвлэгчийн"]
SMALL_AREAS = (1, 2, 4, 5, 10, 20)
LARGE_AREAS = (50, 100, 200, 250, 400, 500, 1000)
PISTON_FORCES = (50, 80, 100, 120, 150, 200, 250, 300, 400, 500)


@lru_cache(maxsize=None)
def hydraulic_versions() -> tuple:
    n = len(PRESSES)
    areas = [(s1, s2) for s1 in SMALL_AREAS for s2 in LARGE_AREAS if s2 >= 10 * s1]
    return mix(
        700,
        cycle(701, "force_out", [(s1, s2, f1) for s1, s2 in areas for f1 in PISTON_FORCES], n),
        cycle(702, "force_in", [(s1, s2, m) for s1, s2 in areas for m in (500, 800, 1000, 1200, 1500, 2000, 2500, 3000)
                                if clean(F(m * 10 * s1, s2), 2)], n),
        cycle(703, "travel", [(s1, s2, h1) for s1, s2 in areas for h1 in (2, 4, 5, 10, 12, 15, 20, 25, 30)
                              if clean(F(10 * h1 * s1, s2), 2) and F(10 * h1 * s1, s2) >= F(1, 10)], n),
        cycle(704, "travel_back", [(s1, s2, h2) for s1, s2 in areas for h2 in (1, 2, 3, 4, 5, 6, 8, 10)
                                   if clean(F(h2 * s2, 10 * s1), 2) and F(h2 * s2, 10 * s1) <= 200], n),
        cycle(705, "ratio", [(f1, ratio) for f1 in PISTON_FORCES for ratio in (10, 20, 25, 40, 50, 80, 100, 200)], n),
        cycle(706, "pressure", [(f1, s1) for f1 in PISTON_FORCES for s1 in SMALL_AREAS if clean(F(10 * f1, s1), 2)], n),
        cycle(707, "diameter", [(times, f1) for times in (2, 3, 4, 5, 6, 8, 10) for f1 in PISTON_FORCES], n),
    )


def st_hydraulic(rng: random.Random, year: int, k: int) -> dict:
    version = hydraulic_versions()[k % len(hydraulic_versions())]
    kind, p, data = version[0], version[1], version[2:]
    press = PRESSES[p]
    if kind in ("force_out", "force_in", "travel", "travel_back"):
        s1, s2 = data[0], data[1]
        lead = f"{press} бага бүлүүрийн талбай {s1} см², их бүлүүрийнх {s2} см²."
    if kind == "force_out":
        f1 = data[2]
        f2 = F(f1 * s2, s1)
        prompt = lead + f" Бага бүлүүрийг {f1} Н хүчээр дарахад их бүлүүр ямар хүчээр түлхэх вэ?"
        scale_unit = force_scale(f2)
        answer, wrong = in_scale(f2, scale_unit, [F(f1 * s1, s2) if scale_unit[0] == 1 else None, f1 * s2, f2 / 10, f2 * 10])
        solution = f"Паскалийн хуулиар F1/S1 = F2/S2. F2 = F1·S2/S1 = {f1}·{s2}/{s1} = {num(f2)} Н" + (f" = {answer}." if scale_unit[0] != 1 else ".")
    elif kind == "force_in":
        m = data[2]
        weight = 10 * m
        f1 = F(weight * s1, s2)
        prompt = lead + f" Их бүлүүр дээрх {m} кг ачааг жигд өргөхийн тулд бага бүлүүрийг ямар хүчээр дарах вэ? (g = 10 м/с²)"
        answer = qty(f1, "Н")
        wrong = numeric_wrongs(answer, "Н", [F(m * s1, s2), F(weight * s2, s1), f1 * 10])
        solution = f"F2 = mg = {m}·10 = {weight} Н. F1 = F2·S1/S2 = {weight}·{s1}/{s2} = {num(f1)} Н."
    elif kind == "travel":
        h1 = data[2]
        h2 = F(10 * h1 * s1, s2)
        prompt = lead + f" Бага бүлүүр {h1} см доошлоход их бүлүүр хэдэн мм дээшлэх вэ?"
        answer = qty(h2, "мм")
        wrong = numeric_wrongs(answer, "мм", [h2 / 10, h2 * 10, h1 * 10 if h1 * 10 != h2 * 100 else h1 * 100], 3)
        solution = (
            f"Шингэний эзлэхүүн хадгалагдана: h1S1 = h2S2. h2 = h1·S1/S2 = {h1}·{s1}/{s2} см = {num(h2 / 10)} см = "
            f"{num(h2)} мм."
        )
    elif kind == "travel_back":
        h2 = data[2]
        h1 = F(h2 * s2, 10 * s1)
        prompt = lead + f" Их бүлүүрийг {h2} мм өргөхийн тулд бага бүлүүрийг нийтдээ хэдэн см доошлуулах вэ?"
        answer = qty(h1, "см")
        wrong = numeric_wrongs(answer, "см", [h1 * 10, h1 / 10, F(h2, 10)], 3)
        solution = f"h1S1 = h2S2 тул h1 = h2·S2/S1 = {num(F(h2, 10))}·{s2}/{s1} см = {num(h1)} см."
    elif kind == "ratio":
        f1, times = data
        f2 = f1 * times
        prompt = (
            f"{press} бага бүлүүрт {f1} Н хүч үйлчлэхэд их бүлүүр {qty(f2 / force_scale(f2)[0], force_scale(f2)[1])} "
            "хүчээр түлхэв. Их бүлүүрийн талбай бага бүлүүрийнхээс хэд дахин их вэ?"
        )
        answer = qty(times, "дахин")
        wrong = numeric_wrongs(answer, "дахин", [approx(math.sqrt(times)), times * times if times <= 20 else times * 10])
        solution = f"S2/S1 = F2/F1 = {f2}/{f1} = {times}."
    elif kind == "pressure":
        f1, s1 = data
        pressure = F(10 * f1, s1)
        prompt = (
            f"{press} бага бүлүүрийн талбай {s1} см². Түүнийг {f1} Н хүчээр дарахад бүлүүрийн доорх шингэний даралт "
            "хэдээр ихсэх вэ?"
        )
        answer = qty(pressure, "кПа")
        wrong = numeric_wrongs(answer, "кПа", [F(f1, s1), pressure * 100, F(f1 * s1, 10)])
        solution = f"p = F/S = {f1}/({s1}·10⁻⁴) Па = {num(pressure * 1000)} Па = {num(pressure)} кПа."
    else:
        times, f1 = data
        f2 = f1 * times * times
        prompt = (
            f"{press} их бүлүүрийн диаметр бага бүлүүрийнхээс {times} дахин их. Бага бүлүүрт {f1} Н хүч үйлчлэхэд их "
            "бүлүүр ямар хүчээр түлхэх вэ?"
        )
        answer, wrong = in_scale(f2, force_scale(f2), [f1 * times, F(f1, times * times), f1 * times * times * times])
        solution = f"Талбай диаметрийн квадраттай пропорциональ: S2/S1 = {times}² = {times * times}. F2 = {f1}·{times * times} = {num(f2)} Н."
    return {"skill": "Шингэнт шахуурга", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 8. st_resultant — Хүчний нийлбэр
# ---------------------------------------------------------------------------

FORCE_BODIES = ["Биед", "Хайрцагт", "Тэргэнд", "Завинд", "Ачаанд", "Чаргад"]
TRIPLES = [(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25), (20, 21, 29), (9, 40, 41)]


@lru_cache(maxsize=None)
def resultant_versions() -> tuple:
    n = len(FORCE_BODIES)
    pairs = [(f1, f2) for f1 in (3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40) for f2 in (2, 5, 7, 9, 12, 16, 18, 24, 35, 50) if f1 != f2]
    right = sorted({(a * m, b * m) for a, b, _ in TRIPLES for m in range(1, 11) if b * m <= 240}
                   | {(b * m, a * m) for a, b, _ in TRIPLES for m in range(1, 11) if b * m <= 240})
    equal = (2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 100)
    lists = [(a, b, c, d) for a in (5, 8, 10, 12, 15, 20) for b in (3, 4, 6, 9) for c in (6, 7, 10, 14, 16) for d in (0, 2, 5)
             if a + b != c + d]
    return mix(
        800,
        cycle(801, "same", pairs, n),
        cycle(802, "opposite", pairs, n),
        cycle(803, "right", right, n),
        cycle(804, "equal", [(force, angle) for force in equal for angle in (60, 90, 120)], n),
        cycle(805, "list", lists, n),
    )


def st_resultant(rng: random.Random, year: int, k: int) -> dict:
    version = resultant_versions()[k % len(resultant_versions())]
    kind, b, data = version[0], version[1], version[2:]
    body = FORCE_BODIES[b]
    ask = "Тэнцүү үйлчлэгч хүчний модулийг ол."
    if kind == "same":
        f1, f2 = data
        total = f1 + f2
        prompt = f"{body} нэг шулууны дагуу ижил чиглэлд {f1} Н ба {f2} Н хоёр хүч үйлчилнэ. {ask}"
        mistakes = [abs(f1 - f2), approx(math.hypot(f1, f2)), max(f1, f2)]
        solution = f"Ижил чиглэлтэй хүчнүүд нэмэгдэнэ: R = {f1} + {f2} = {total} Н."
    elif kind == "opposite":
        f1, f2 = data
        total = abs(f1 - f2)
        prompt = f"{body} нэг шулууны дагуу эсрэг чиглэлд {f1} Н ба {f2} Н хоёр хүч үйлчилнэ. {ask}"
        mistakes = [f1 + f2, approx(math.hypot(f1, f2)), max(f1, f2)]
        solution = f"Эсрэг чиглэлтэй хүчнүүдийн их хүчний чиглэлд: R = |{f1} − {f2}| = {total} Н."
    elif kind == "right":
        f1, f2 = data
        total = root(f1 * f1 + f2 * f2)
        prompt = f"{body} хоорондоо перпендикуляр {f1} Н ба {f2} Н хоёр хүч үйлчилнэ. {ask}"
        mistakes = [f1 + f2, abs(f1 - f2), f1 * f1 + f2 * f2 if f1 * f1 + f2 * f2 < 1000 else F(f1 + f2, 2)]
        solution = f"Пифагорын теоремоор R = √(F1² + F2²) = √({f1}² + {f2}²) = √{f1 * f1 + f2 * f2} = {num(total)} Н."
    elif kind == "equal":
        force, angle = data
        if angle == 120:
            total = F(force)
            note = ""
            solution = (
                f"Тэнцүү хоёр хүчний хоорондох өнцөг 120° бол параллелограмм нь хоёр зөв гурвалжинд хуваагдана: "
                f"R = F = {force} Н."
            )
        elif angle == 60:
            total = force * F(173, 100)
            note = " (√3 ≈ 1.73)"
            solution = f"R = 2F·cos 30° = F√3 = {force}·1.73 = {num(total)} Н."
        else:
            total = force * F(141, 100)
            note = " (√2 ≈ 1.41)"
            solution = f"R = √(F² + F²) = F√2 = {force}·1.41 = {num(total)} Н."
        prompt = f"{body} хоорондоо {angle}° өнцөг үүсгэсэн тус бүр {force} Н хоёр хүч үйлчилнэ. {ask}{note}"
        mistakes = [2 * force, force * F(173, 100), force * F(141, 100), F(force), F(force, 2)]
    else:
        a, b2, c, d = data
        right_total, left_total = a + b2, c + d
        total = abs(right_total - left_total)
        left = f"{c} Н ба {d} Н" if d else f"{c} Н"
        prompt = f"{body} нэг шулууны дагуу баруун тийш {a} Н ба {b2} Н, зүүн тийш {left} хүч үйлчилнэ. {ask}"
        mistakes = [right_total + left_total, right_total, left_total, abs(a - b2 - c + d) or a]
        solution = (
            f"Баруун тийш нийт {right_total} Н, зүүн тийш нийт {left_total} Н. R = |{right_total} − {left_total}| = {total} Н."
        )
    answer = qty(total, "Н")
    return {"skill": "Хүчний нийлбэр", "prompt": prompt, "answer": answer,
            "wrong": numeric_wrongs(answer, "Н", mistakes), "solution": solution}


# ---------------------------------------------------------------------------
# 9. d_newton2 — Ньютоны хоёрдугаар хууль
# ---------------------------------------------------------------------------

N2_OBJECTS = [("бие", "кг"), ("тэрэг", "кг"), ("хайрцаг", "кг"), ("чарга", "кг"), ("автомашин", "т"),
              ("ачааны машин", "т"), ("бөмбөг", "г"), ("тоглоомон машин", "г")]
N2_MASSES = {"кг": (2, 4, 5, 8, 10, 12, 15, 20, 25, 40, 50), "т": (1, F(6, 5), F(3, 2), 2, F(5, 2), 3, 4, 5, 8),
             "г": (100, 200, 250, 400, 500, 800)}
N2_ACCELS = (F(1, 5), F(2, 5), F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5))
KG_PER = {"кг": F(1), "т": F(1000), "г": F(1, 1000)}
CHANGES = (F(2), F(3), F(4), F(1, 2), F(1, 3), F(1, 4))


@lru_cache(maxsize=None)
def newton_versions() -> tuple:
    massed = [(o, m, a) for o, (_, unit) in enumerate(N2_OBJECTS) for m in N2_MASSES[unit] for a in N2_ACCELS
              if clean(m * KG_PER[unit] * a, 2) and m * KG_PER[unit] * a >= F(1, 10)]
    speeds = [(o, m, force, t) for o, (_, unit) in enumerate(N2_OBJECTS) if unit == "кг" for m in N2_MASSES["кг"]
              for force in (2, 4, 5, 6, 8, 10, 12, 15, 20, 30) for t in (2, 3, 4, 5, 10) if clean(F(force * t, m), 2)
              and F(force * t, m) <= 30]
    factors = [(ff, fm) for ff in CHANGES + (F(1),) for fm in CHANGES + (F(1),) if (ff, fm) != (1, 1) and factor_text(ff / fm)]
    return mix(900, [("F",) + item for item in massed], [("a",) + item for item in massed],
               [("m",) + item for item in massed], [("v",) + item for item in speeds],
               [("factor",) + item for item in factors])


def d_newton2(rng: random.Random, year: int, k: int) -> dict:
    version = newton_versions()[k % len(newton_versions())]
    kind, data = version[0], version[1:]
    result = {"skill": "Ньютоны хоёрдугаар хууль"}
    if kind == "factor":
        ff, fm = data
        factor = ff / fm
        if ff == 1:
            change = f"Хүчийг өөрчлөхгүйгээр биеийн массыг {scaled(fm, True)}"
        elif fm == 1:
            change = f"Биеийн массыг өөрчлөхгүйгээр түүнд үйлчлэх тэнцүү үйлчлэгч хүчийг {scaled(ff, True)}"
        else:
            change = f"Биед үйлчлэх тэнцүү үйлчлэгч хүчийг {scaled(ff)}, биеийн массыг {scaled(fm, True)}"
        answer, wrong = factor_options(factor, [ff * fm, fm / ff, ff, 1 / fm])
        return result | {
            "prompt": f"{change} хурдатгал нь хэрхэн өөрчлөгдөх вэ?",
            "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"a = F/m тул a' = ({ratio(ff)}·F)/({ratio(fm)}·m) = {ratio(factor)}·a: {low(answer)}.",
        }
    o, m = data[0], data[1]
    name, unit = N2_OBJECTS[o]
    mass = m * KG_PER[unit]
    mass_text = f"{num(m)} {unit}"
    in_kg = f" = {num(mass)} кг" if unit != "кг" else ""
    if kind == "v":
        force, t = data[2], data[3]
        v = F(force * t, m)
        prompt = (
            f"Тайван байсан {mass_text} масстай {name} {force} Н тогтмол тэнцүү үйлчлэгч хүчний үйлчлэлээр хөдөлж эхлэв. "
            f"{t} с-ийн дараах хурдыг ол."
        )
        answer = qty(v, "м/с")
        wrong = numeric_wrongs(answer, "м/с", [F(force, m), F(force * m, t), F(force * t * t, 2 * m)])
        solution = f"a = F/m = {force}/{m} = {num(F(force, m))} м/с². v = at = {num(F(force, m))}·{t} = {num(v)} м/с."
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    a = data[2]
    force = mass * a
    scale_unit = force_scale(force)
    force_text = qty(force / scale_unit[0], scale_unit[1])
    if kind == "F":
        prompt = f"{mass_text} масстай {name} {num(a)} м/с² хурдатгалтай хөдөлж байна. Түүнд үйлчлэх тэнцүү үйлчлэгч хүчийг ол."
        answer, wrong = in_scale(force, scale_unit, [m * a, mass / a, mass * a * 10 if unit == "кг" else mass * a / 10])
        solution = f"m = {mass_text}{in_kg}. F = ma = {num(mass)}·{num(a)} = {num(force)} Н."
    elif kind == "a":
        prompt = f"{mass_text} масстай {name} {force_text} тэнцүү үйлчлэгч хүчний үйлчлэлээр хөдөлж байна. Хурдатгалыг ол."
        answer = qty(a, "м/с²")
        wrong = numeric_wrongs(answer, "м/с²", [force / m if unit != "кг" else None,
                                               mass / force if F(1, 100) <= mass / force <= 1000 else None, a * 10, a + 1], 3)
        solution = f"m = {mass_text}{in_kg}. a = F/m = {num(force)}/{num(mass)} = {num(a)} м/с²."
    else:
        prompt = f"{force_text} тэнцүү үйлчлэгч хүчний үйлчлэлээр {num(a)} м/с² хурдатгалтай хөдөлж буй {name} ямар масстай вэ?"
        answer = qty(m, unit)
        wrong = numeric_wrongs(answer, unit, [force * a / KG_PER[unit], a / force / KG_PER[unit], m * 10])
        solution = f"m = F/a = {num(force)}/{num(a)} = {num(mass)} кг" + (f" = {mass_text}." if unit != "кг" else ".")
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 10. d_momentum — Импульс хадгалагдах хууль
# ---------------------------------------------------------------------------

HEAVY_VEHICLES = [("автомашин", (1, F(6, 5), F(3, 2), 2), 108), ("ачааны машин", (4, 5, 8, 10), 90),
                  ("автобус", (6, 8, 10, 12), 90), ("трактор", (3, 4, 5), 36)]
MOVING_THINGS = ["тэрэг", "бие", "чарга", "хайрцаг"]


@lru_cache(maxsize=None)
def momentum_versions() -> tuple:
    vehicle = [(v, m, kmh) for v, (_, masses, top) in enumerate(HEAVY_VEHICLES) for m in masses for kmh in KMH if kmh <= top]
    small = [(name, g, v) for name, grams, speeds in (
        ("сум", (5, 8, 9, 10, 12, 20), (300, 400, 500, 600, 700, 800, 900)),
        ("теннисний бөмбөг", (50, 60), (10, 20, 25, 30, 40)),
        ("хөлбөмбөгийн бөмбөг", (400, 450), (5, 10, 12, 15, 20, 25)),
        ("хоккейн шайба", (160, 170), (10, 15, 20, 25, 30, 40)),
    ) for g in grams for v in speeds if clean(F(g * v, 1000), 2)]
    change = [(t, m, v1, v2, up) for t in range(len(MOVING_THINGS)) for m in (2, 4, 5, 10, 20, 50)
              for v1 in (0, 1, 2, 3, 4, 5) for v2 in (3, 6, 8, 10) if v2 > v1 for up in (True, False) if up or v1]
    boat = [(person, mass, v) for person in (40, 50, 60, 70, 80) for mass in (100, 120, 150, 200, 240, 300)
            for v in (2, 3, 4, 5, 6) if clean(F(person * v, mass), 2)]
    cart = [(boy, mass, v) for boy in (30, 35, 40, 45, 50) for mass in (20, 25, 40, 50, 60, 80, 100)
            for v in (1, 2, 3, 4) if clean(F(boy * v, mass), 2)]
    gun = [(gun_mass, g, v) for gun_mass in (3, 4, 5, 6, 8) for g in (8, 9, 10, 12, 15, 20) for v in (400, 500, 600, 700, 800)
           if clean(F(g * v, 1000 * gun_mass), 2)]
    skaters = [(m1, m2, v1) for m1 in (40, 45, 50, 60, 70, 80) for m2 in (40, 50, 60, 75, 80, 90) if m1 != m2
               for v1 in (1, 2, 3, 4) if clean(F(m1 * v1, m2), 2)]
    stick = [(m1, v1, m2, v2, mode) for m1 in (1, 2, 3, 4, 5, 6) for v1 in (2, 3, 4, 5, 6, 8, 10) for m2 in (1, 2, 3, 4, 6)
             for v2 in (0, 1, 2) for mode in ("rest", "same", "head")
             if (v2 == 0) == (mode == "rest") and (mode != "same" or v2 < v1)
             and (mode != "head" or (m1 * v1 != m2 * v2 and m1 != m2))
             and clean(F(abs(m1 * v1 + (v2 * m2 if mode == "same" else -v2 * m2)), m1 + m2), 2)]
    wall = [(g, v, bounce) for g in (50, 100, 150, 200, 250, 400, 500) for v in (2, 4, 5, 6, 8, 10, 12, 15, 20)
            for bounce in (True, False) if clean(F(g * v, 1000), 2)]
    return mix(1000, [("vehicle",) + item for item in vehicle], [("small",) + item for item in small],
               [("change",) + item for item in change],
               shuffled(1001, [("boat",) + item for item in boat] + [("cart",) + item for item in cart]
                        + [("gun",) + item for item in gun] + [("skaters",) + item for item in skaters]),
               [("stick",) + item for item in stick], [("wall",) + item for item in wall])


def d_momentum(rng: random.Random, year: int, k: int) -> dict:
    version = momentum_versions()[k % len(momentum_versions())]
    kind, data = version[0], version[1:]
    unit = "кг·м/с"
    if kind == "vehicle":
        v_index, m, kmh = data
        name = HEAVY_VEHICLES[v_index][0]
        mass, v = m * 1000, mps(kmh)
        p = mass * v
        prompt = f"{num(m)} т масстай {name} {kmh} км/ц хурдтай явж байна. Түүний импульсийг ол."
        answer = qty(p, unit)
        wrong = numeric_wrongs(answer, unit, [m * v, mass * kmh, m * kmh, p * 10])
        solution = f"m = {num(m)} т = {num(mass)} кг, v = {kmh}/3.6 = {num(v)} м/с. p = mv = {num(mass)}·{num(v)} = {num(p)} кг·м/с."
    elif kind == "small":
        name, g, v = data
        p = F(g * v, 1000)
        prompt = f"{g} г масстай {name} {v} м/с хурдтай нисч байна. Түүний импульсийг ол."
        answer = qty(p, unit)
        wrong = numeric_wrongs(answer, unit, [g * v, F(g * v * v, 2000), p / 10, p * 10])
        solution = f"m = {g} г = {num(F(g, 1000))} кг. p = mv = {num(F(g, 1000))}·{v} = {num(p)} кг·м/с."
    elif kind == "change":
        t, m, v1, v2, up = data
        name = MOVING_THINGS[t]
        dp = m * (v2 - v1)
        if up:
            prompt = (
                f"{m} кг масстай {name} шулуун замаар нэг чиглэлд хөдөлж, хурдаа {v1} м/с-ээс {v2} м/с хүртэл "
                "нэмэгдүүлэв. Импульсийн өөрчлөлтийн модулийг ол."
            )
            solution = f"Δp = m(v2 − v1) = {m}·({v2} − {v1}) = {dp} кг·м/с."
        else:
            prompt = (
                f"{m} кг масстай {name} шулуун замаар нэг чиглэлд хөдөлж, хурдаа {v2} м/с-ээс {v1} м/с хүртэл "
                "багасгав. Импульсийн өөрчлөлтийн модулийг ол."
            )
            solution = f"|Δp| = m|v2 − v1| = {m}·({v2} − {v1}) = {dp} кг·м/с."
        answer = qty(dp, unit)
        wrong = numeric_wrongs(answer, unit, [m * (v1 + v2), m * v2, m * v1, v2 - v1])
    elif kind in ("boat", "cart", "gun", "skaters"):
        if kind == "boat":
            person, mass, v = data
            u = F(person * v, mass)
            prompt = (
                f"Тайван байсан {mass} кг масстай завинаас {person} кг масстай хүн хэвтээ чиглэлд {v} м/с хурдтай "
                "эрэг рүү үсрэв. Завь ямар хурдтай хөдлөх вэ? (Усны эсэргүүцлийг тооцохгүй)"
            )
            solution = f"Импульс хадгалагдана: 0 = m1v1 − m2u, u = m1v1/m2 = {person}·{v}/{mass} = {num(u)} м/с."
            mistakes = [F(mass * v, person), F(person * v, mass + person), v]
        elif kind == "cart":
            boy, mass, v = data
            u = F(boy * v, mass)
            prompt = (
                f"Тайван зогсож байсан {mass} кг масстай тэрэгнээс {boy} кг масстай хүүхэд хэвтээ чиглэлд {v} м/с "
                "хурдтай үсрэв. Тэрэг ямар хурдтай хөдлөх вэ? (Үрэлтийг тооцохгүй)"
            )
            solution = f"Импульс хадгалагдана: 0 = m1v1 − m2u, u = m1v1/m2 = {boy}·{v}/{mass} = {num(u)} м/с."
            mistakes = [F(mass * v, boy), F(boy * v, mass + boy), v]
        elif kind == "gun":
            gun_mass, g, v = data
            u = F(g * v, 1000 * gun_mass)
            prompt = f"{gun_mass} кг масстай буунаас {g} г масстай сум {v} м/с хурдтай хэвтээ чиглэлд гарав. Бууны ухрах хурдыг ол."
            solution = (
                f"Импульс хадгалагдана: 0 = mv − Mu, u = mv/M = {num(F(g, 1000))}·{v}/{gun_mass} = {num(u)} м/с."
            )
            mistakes = [F(g * v, gun_mass), u * 10, F(gun_mass * v, g)]
        else:
            m1, m2, v1 = data
            u = F(m1 * v1, m2)
            prompt = (
                f"Мөсөн дээр тайван зогсож байсан {m1} кг ба {m2} кг масстай хоёр тэшүүрчин бие биеэ түлхэв. "
                f"{m1} кг масстай тэшүүрчин {v1} м/с хурдтай хөдөлсөн бол нөгөө нь ямар хурдтай хөдлөх вэ?"
            )
            solution = f"Импульс хадгалагдана: m1v1 = m2v2, v2 = m1v1/m2 = {m1}·{v1}/{m2} = {num(u)} м/с."
            mistakes = [F(m2 * v1, m1), F(m1 * v1, m1 + m2), F(v1)]
        unit = "м/с"
        answer = qty(u, unit)
        wrong = numeric_wrongs(answer, unit, mistakes)
    elif kind == "stick":
        m1, v1, m2, v2, mode = data
        if mode == "rest":
            total = F(m1 * v1, m1 + m2)
            prompt = (
                f"{m1} кг масстай тэрэг {v1} м/с хурдтай явж, тайван зогсож байсан {m2} кг масстай тэргийг мөргөөд "
                "хамт хөдлөв. Мөргөлдсөний дараах хурдыг ол."
            )
            solution = f"m1v1 = (m1 + m2)u, u = {m1}·{v1}/({m1} + {m2}) = {num(total)} м/с."
            mistakes = [F(m1 * v1, m2), F(v1, 2), F(m2 * v1, m1 + m2)]
        elif mode == "same":
            total = F(m1 * v1 + m2 * v2, m1 + m2)
            prompt = (
                f"{m1} кг масстай тэрэг {v1} м/с хурдтай явж, урд нь ижил чиглэлд {v2} м/с хурдтай явж байсан {m2} кг "
                "масстай тэргийг гүйцэж мөргөөд хамт хөдлөв. Мөргөлдсөний дараах хурдыг ол."
            )
            solution = f"m1v1 + m2v2 = (m1 + m2)u, u = ({m1}·{v1} + {m2}·{v2})/({m1} + {m2}) = {num(total)} м/с."
            mistakes = [F(abs(m1 * v1 - m2 * v2), m1 + m2), F(v1 + v2, 2), F(m1 * v1, m1 + m2)]
        else:
            total = F(abs(m1 * v1 - m2 * v2), m1 + m2)
            prompt = (
                f"{m1} кг ба {m2} кг масстай хоёр тэрэг харгалзан {v1} м/с ба {v2} м/с хурдтай бие бие рүүгээ хөдөлж "
                "мөргөлдөөд хамт хөдлөв. Мөргөлдсөний дараах хурдны модулийг ол."
            )
            solution = f"Эсрэг чиглэлтэй импульсүүд хасагдана: u = |{m1}·{v1} − {m2}·{v2}|/({m1} + {m2}) = {num(total)} м/с."
            mistakes = [F(m1 * v1 + m2 * v2, m1 + m2), F(abs(v1 - v2), 2) if v1 != v2 else F(v1, 3), F(m1 * v1, m1 + m2)]
        unit = "м/с"
        answer = qty(total, unit)
        wrong = numeric_wrongs(answer, unit, mistakes)
    else:
        g, v, bounce = data
        mass = F(g, 1000)
        dp = 2 * mass * v if bounce else mass * v
        if bounce:
            prompt = (
                f"{g} г масстай бөмбөг {v} м/с хурдтай хананд перпендикуляр мөргөөд ижил хэмжээний хурдтай ойв. "
                "Бөмбөгний импульсийн өөрчлөлтийн модулийг ол."
            )
            solution = f"Хурд эсрэгээр солигдох тул |Δp| = mv − (−mv) = 2mv = 2·{num(mass)}·{v} = {num(dp)} кг·м/с."
            mistakes = [mass * v, 2 * g * v, 4 * mass * v]
        else:
            prompt = (
                f"{g} г масстай хуванцар шавар бөмбөлөг {v} м/с хурдтай хананд перпендикуляр мөргөөд наалдав. "
                "Бөмбөлгийн импульсийн өөрчлөлтийн модулийг ол."
            )
            solution = f"Эцсийн хурд 0 тул |Δp| = mv = {num(mass)}·{v} = {num(dp)} кг·м/с."
            mistakes = [2 * mass * v, g * v, mass * v / 2]
        answer = qty(dp, unit)
        wrong = numeric_wrongs(answer, unit, mistakes)
    return {"skill": "Импульс хадгалагдах хууль", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 11. d_forces — Үрэлт ба уян харимхайн хүч
# ---------------------------------------------------------------------------

DRAGGED = [("хайрцгийг", "шалан дээгүүр"), ("чаргыг", "цасан дээгүүр"), ("шүүгээг", "шалан дээгүүр"),
           ("ширээг", "шалан дээгүүр"), ("шуудайг", "шалан дээгүүр"), ("төмөр хавтанг", "бетон гадаргуу дээгүүр"),
           ("ачаатай чаргыг", "мөсөн дээгүүр")]
FRICTION_MASSES = (5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80)
FRICTION_MU = (F(1, 20), F(1, 10), F(3, 20), F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 2), F(3, 5))
STIFFNESS = (20, 40, 50, 80, 100, 120, 150, 200, 250, 400, 500, 800, 1000)


@lru_cache(maxsize=None)
def forces_versions() -> tuple:
    n = len(DRAGGED)
    drag = [(m, mu) for m in FRICTION_MASSES for mu in FRICTION_MU]
    return mix(
        1100,
        cycle(1101, "friction", drag, n),
        cycle(1102, "mu", drag, n),
        [("hooke_F", 0, stiff, x) for stiff in STIFFNESS for x in (1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20) if clean(F(stiff * x, 100), 2)],
        [("hooke_k", 0, force, x) for force in (1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 50)
         for x in (1, 2, 4, 5, 8, 10, 12, 16, 20, 25) if clean(F(100 * force, x), 1)],
        [("hooke_new", 0, f1, x1, f2) for f1 in (2, 4, 5, 6, 8, 10, 12, 20) for x1 in (1, 2, 3, 4, 5, 6, 8)
         for f2 in (3, 5, 6, 9, 10, 15, 16, 24, 30) if f1 != f2 and clean(F(x1 * f2, f1), 2) and F(x1 * f2, f1) <= 40],
        [("hang", 0, stiff, grams) for stiff in STIFFNESS for grams in (50, 100, 200, 250, 400, 500, 800, 1000, 2000)
         if clean(F(grams, stiff), 2) and F(1, 10) <= F(grams, stiff) <= 40],
    )


def d_forces(rng: random.Random, year: int, k: int) -> dict:
    version = forces_versions()[k % len(forces_versions())]
    kind, o, data = version[0], version[1], version[2:]
    if kind in ("friction", "mu"):
        acc, surface = DRAGGED[o]
        m, mu = data
        force = mu * m * 10
        if kind == "friction":
            prompt = (
                f"{m} кг масстай {acc} хэвтээ {surface} гадаргуутай параллель хүчээр жигд чирж байна. Гулсалтын үрэлтийн коэффициент "
                f"μ = {num(mu)} бол чирэх хүчийг ол. (g = 10 м/с²)"
            )
            answer = qty(force, "Н")
            wrong = numeric_wrongs(answer, "Н", [mu * m, F(m * 10), m * 10 / mu])
            solution = f"Жигд хөдөлгөөнд чирэх хүч үрэлтийн хүчтэй тэнцүү: F = μmg = {num(mu)}·{m}·10 = {num(force)} Н."
        else:
            prompt = (
                f"{m} кг масстай {acc} хэвтээ {surface} жигд чирэхэд {num(force)} Н хэвтээ хүч шаардлагатай болов. "
                "Гулсалтын үрэлтийн коэффициентийг ол. (g = 10 м/с²)"
            )
            answer = qty(mu, "")
            wrong = numeric_wrongs(answer, "", [force / m, mu * 10, F(m * 10) / force if F(m * 10) / force <= 100 else mu * 3 / 2], 3)
            solution = f"F = μmg тул μ = F/(mg) = {num(force)}/({m}·10) = {num(mu)}."
    elif kind == "hooke_F":
        stiff, x = data
        force = F(stiff * x, 100)
        prompt = f"{stiff} Н/м хатуулагтай пүршийг {x} см сунгахын тулд ямар хүч үйлчлүүлэх вэ?"
        answer = qty(force, "Н")
        wrong = numeric_wrongs(answer, "Н", [stiff * x, F(stiff * x * x, 20000), F(stiff, x)])
        solution = f"Гукийн хууль: F = kx = {stiff}·{num(F(x, 100))} = {num(force)} Н."
    elif kind == "hooke_k":
        force, x = data
        stiff = F(100 * force, x)
        prompt = f"Пүршинд {force} Н хүч үйлчлэхэд {x} см сунав. Пүршний хатуулгийг ол."
        answer = qty(stiff, "Н/м")
        wrong = numeric_wrongs(answer, "Н/м", [F(force, x), F(force * x, 100), stiff * 10])
        solution = f"F = kx тул k = F/x = {force}/{num(F(x, 100))} = {num(stiff)} Н/м."
    elif kind == "hooke_new":
        f1, x1, f2 = data
        x2 = F(x1 * f2, f1)
        prompt = f"{f1} Н хүчний үйлчлэлээр {x1} см сунадаг пүршинд {f2} Н хүч үйлчлэхэд пүрш хэдэн см сунах вэ?"
        answer = qty(x2, "см")
        wrong = numeric_wrongs(answer, "см", [F(x1 * f1, f2), x1 + f2 - f1 if x1 + f2 - f1 > 0 else x1 * f2, F(x1 * f2 * f2, f1 * f1)])
        solution = f"Суналт хүчтэй пропорциональ: x2 = x1·F2/F1 = {x1}·{f2}/{f1} = {num(x2)} см."
    else:
        stiff, grams = data
        x = F(grams, stiff)
        mass_text = qty(F(grams, 1000), "кг") if grams >= 1000 else qty(grams, "г")
        prompt = f"{stiff} Н/м хатуулагтай пүршинд {mass_text} масстай ачаа өлгөхөд пүрш хэдэн см сунах вэ? (g = 10 м/с²)"
        answer = qty(x, "см")
        wrong = numeric_wrongs(answer, "см", [x / 10, x * 10, F(stiff, grams) * 100])
        solution = (
            f"Тэнцвэрт kx = mg тул x = mg/k = {num(F(grams, 1000))}·10/{stiff} = {num(x / 100)} м = {num(x)} см."
        )
    return {"skill": "Үрэлт ба уян харимхайн хүч", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 12. e_kinetic — Кинетик энерги
# ---------------------------------------------------------------------------

FLYING = [
    ("теннисний бөмбөг", (50, 60), (10, 20, 30, 40)),
    ("хөлбөмбөгийн бөмбөг", (400, 450), (5, 10, 12, 15, 20)),
    ("хоккейн шайба", (160, 170), (10, 15, 20, 25, 30)),
    ("сум", (8, 9, 10), (300, 400, 500, 600, 700, 800)),
    ("жад", (800,), (15, 20, 25, 30)),
]


@lru_cache(maxsize=None)
def kinetic_versions() -> tuple:
    flying = [(name, g, v) for name, grams, speeds in FLYING for g in grams for v in speeds if clean(F(g * v * v, 2000), 3)]
    vehicles = [(v, m, kmh) for v, (_, masses, top) in enumerate(HEAVY_VEHICLES) for m in masses for kmh in KMH if kmh <= top
                and clean(1000 * m * mps(kmh) ** 2 / 2 / 1000, 2)]
    pairs = [(m, v) for m in (F(1, 2), F(1), F(2), F(4), F(5), F(10), F(20), F(50)) for v in range(2, 21)
             if clean(m * v * v / 2, 2)]
    momenta = [(m, p) for m in (F(1, 2), F(1), F(2), F(4), F(5), F(8), F(10)) for p in (2, 4, 5, 6, 8, 10, 12, 20, 40)
               if clean(F(p * p) / (2 * m), 2)]
    factors = [(fm, fv) for fm in CHANGES + (F(1),) for fv in (F(2), F(3), F(4), F(1, 2), F(1, 3), F(1)) if (fm, fv) != (1, 1)
               and factor_text(fm * fv * fv)]
    return mix(1200, [("flying",) + item for item in flying], [("vehicle",) + item for item in vehicles],
               [("v",) + item for item in pairs], [("m",) + item for item in pairs],
               [("p",) + item for item in momenta], [("factor",) + item for item in factors])


def e_kinetic(rng: random.Random, year: int, k: int) -> dict:
    version = kinetic_versions()[k % len(kinetic_versions())]
    kind, data = version[0], version[1:]
    result = {"skill": "Кинетик энерги"}
    if kind == "factor":
        fm, fv = data
        factor = fm * fv * fv
        if fm == 1:
            change = f"Биеийн массыг өөрчлөхгүйгээр хурдыг {scaled(fv, True)}"
        elif fv == 1:
            change = f"Биеийн хурдыг өөрчлөхгүйгээр массыг {scaled(fm, True)}"
        else:
            change = f"Биеийн массыг {scaled(fm)}, хурдыг {scaled(fv, True)}"
        answer, wrong = factor_options(factor, [fm * fv, fv * fv, fm / (fv * fv), fm * fv * fv * fv])
        return result | {
            "prompt": f"{change} кинетик энерги нь хэрхэн өөрчлөгдөх вэ?", "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"E = mv²/2 тул E' = {ratio(fm)}·({ratio(fv)})²·E = {ratio(factor)}·E: {low(answer)}.",
        }
    if kind == "flying":
        name, g, v = data
        mass = F(g, 1000)
        energy = mass * v * v / 2
        prompt = f"{g} г масстай {name} {v} м/с хурдтай нисч байна. Түүний кинетик энергийг ол."
        answer, wrong = in_scale(energy, energy_scale(energy), [F(g * v * v, 2), mass * v * v, energy * 10, energy / 10])
        solution = f"m = {g} г = {num(mass)} кг. E = mv²/2 = {num(mass)}·{v}²/2 = {num(energy)} Ж."
    elif kind == "vehicle":
        v_index, m, kmh = data
        name = HEAVY_VEHICLES[v_index][0]
        mass, v = 1000 * m, mps(kmh)
        energy = mass * v * v / 2
        prompt = f"{num(m)} т масстай {name} {kmh} км/ц хурдтай явж байна. Түүний кинетик энергийг ол."
        answer, wrong = in_scale(energy, energy_scale(energy), [mass * kmh * kmh / 2, mass * v * v, mass * v / 2, energy / 10])
        solution = (
            f"m = {num(mass)} кг, v = {kmh}/3.6 = {num(v)} м/с. E = mv²/2 = {num(mass)}·{num(v)}²/2 = {num(energy)} Ж = {answer}."
        )
    elif kind == "v":
        m, v = data
        energy = m * v * v / 2
        prompt = f"{num(m)} кг масстай биеийн кинетик энерги {num(energy)} Ж бол түүний хурдыг ол."
        answer = qty(v, "м/с")
        wrong = numeric_wrongs(answer, "м/с", [approx(math.sqrt(energy / m)), 2 * energy / m, energy / m])
        solution = f"E = mv²/2 тул v = √(2E/m) = √(2·{num(energy)}/{num(m)}) = {v} м/с."
    elif kind == "m":
        m, v = data
        energy = m * v * v / 2
        prompt = f"{v} м/с хурдтай хөдөлж буй биеийн кинетик энерги {num(energy)} Ж бол түүний массыг ол."
        answer = qty(m, "кг")
        wrong = numeric_wrongs(answer, "кг", [energy / (v * v), 2 * energy / v, energy / v])
        solution = f"E = mv²/2 тул m = 2E/v² = 2·{num(energy)}/{v}² = {num(m)} кг."
    else:
        m, p = data
        energy = F(p * p) / (2 * m)
        prompt = f"{num(m)} кг масстай биеийн импульс {p} кг·м/с бол түүний кинетик энергийг ол."
        answer = qty(energy, "Ж")
        wrong = numeric_wrongs(answer, "Ж", [F(p * p) / m, p / (2 * m), p * p * m / 2])
        solution = f"v = p/m, E = mv²/2 = p²/(2m) = {p}²/(2·{num(m)}) = {num(energy)} Ж."
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 13. e_work — Механик ажил ба потенциал энерги
# ---------------------------------------------------------------------------

PULLED = ["Хайрцгийг", "Чаргыг", "Тэргийг", "Шуудайг", "Тавиурыг"]
SLIDERS = [("Биед", "Бие"), ("Чаргад", "Чарга"), ("Хайрцагт", "Хайрцаг"), ("Шайбад", "Шайба")]
RAISED = ["ачаа", "чулуу", "хайрцаг", "шуудай", "төмөр хавтан"]


@lru_cache(maxsize=None)
def work_versions() -> tuple:
    forces = (10, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200)
    distances = (2, 3, 4, 5, 6, 8, 10, 12, 15, 20)
    pushes = [(force, s, angle) for force in forces for s in distances for angle in (0, 60)]
    perpendicular = [(m, s, support) for m in (2, 4, 5, 10, 20, 50) for s in (2, 3, 5, 8, 10) for support in (False, True)]
    friction = [(force, s) for force in (2, 4, 5, 6, 8, 10, 12, 15, 20, 25) for s in distances]
    heights = [(m, h) for m in (F(1, 2), F(1), F(2), F(3), F(4), F(5), F(10), F(20), F(50)) for h in (F(1, 2), 1, 2, 3, 4, 5, 8, 10, 12, 15, 20)]
    falls = [(m, h1, h2) for m in (F(1, 2), F(1), F(2), F(5), F(10)) for h1 in (5, 8, 10, 12, 15, 20, 25, 30) for h2 in (0, 1, 2, 3, 5)
             if h1 > h2]
    cranes = [(t, h) for t in (F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5)) for h in (3, 4, 5, 6, 8, 10, 12, 15, 20)]
    factors = [(fh, fm) for fh in CHANGES for fm in CHANGES + (F(1),) if factor_text(fh * fm)]
    powers = [(force, s, t, angle) for force in (20, 40, 50, 60, 80, 100, 120, 200) for s in (5, 10, 12, 15, 20, 30)
              for t in (2, 4, 5, 6, 10, 20) for angle in (0, 60)
              if clean(force * s * (F(1, 2) if angle else 1) / t, 2)]
    return mix(1300, cycle(1301, "push", pushes, len(PULLED)), [("perp", 0) + item for item in perpendicular],
               cycle(1302, "friction", friction, len(SLIDERS)), cycle(1303, "Ep", heights, len(RAISED)),
               cycle(1304, "fall", falls, len(RAISED)), [("crane", 0) + item for item in cranes],
               [("factor", 0) + item for item in factors], cycle(1305, "power", powers, len(PULLED)))


def e_work(rng: random.Random, year: int, k: int) -> dict:
    version = work_versions()[k % len(work_versions())]
    kind, o, data = version[0], version[1], version[2:]
    result = {"skill": "Механик ажил ба потенциал энерги"}
    if kind == "push":
        force, s, angle = data
        work = force * s * (F(1, 2) if angle else 1)
        if angle:
            prompt = (
                f"{PULLED[o]} хэвтээтэй 60° өнцөг үүсгэсэн олсоор {force} Н хүчээр татаж, хэвтээ гадаргуугаар {s} м "
                "чирэв. Татах хүчний хийсэн ажлыг ол. (cos 60° = 0.5)"
            )
            solution = f"A = Fs·cos α = {force}·{s}·0.5 = {num(work)} Ж."
            mistakes = [force * s, force * s * F(87, 100), F(force, s)]
        else:
            prompt = (
                f"{PULLED[o]} хөдөлгөөний чиглэлтэй ижил чиглэсэн {force} Н хүчээр түлхэж, хэвтээ гадаргуугаар {s} м "
                "шилжүүлэв. Энэ хүчний хийсэн ажлыг ол."
            )
            solution = f"Хүч шилжилтийн дагуу (α = 0°, cos 0° = 1): A = Fs = {force}·{s} = {num(work)} Ж."
            mistakes = [force * s / 2, F(force, s), force * s / 10]
        answer, wrong = in_scale(work, energy_scale(work), mistakes)
    elif kind == "perp":
        m, s, support = data
        weight = 10 * m
        answer = "0 Ж"
        wrong = list(dict.fromkeys(qty(value, "Ж") for value in (weight * s, -weight * s, weight * s / 2, weight, 2 * weight * s)))[:4]
        force_name = "тулгуурын урвалын хүчний" if support else "хүндийн хүчний"
        prompt = (
            f"{m} кг масстай бие хэвтээ гадаргуугаар {s} м шилжив. Энэ шилжилтэд {force_name} хийсэн ажлыг ол. (g = 10 м/с²)"
        )
        solution = (
            f"{'Тулгуурын урвалын хүч' if support else 'Хүндийн хүч'} босоо, шилжилт хэвтээ тул α = 90°, cos 90° = 0: A = 0 Ж."
        )
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
    elif kind == "friction":
        force, s = data
        dative, nominative = SLIDERS[o]
        work = -force * s
        prompt = (
            f"Хэвтээ гадаргуугаар гулсаж буй {low(dative)} {force} Н үрэлтийн хүч үйлчилнэ. {nominative} {s} м шилжихэд "
            "үрэлтийн хүчний хийсэн ажлыг ол."
        )
        prompt = cap(prompt)
        answer, wrong = signed_options(work, "Ж", [-work, F(0), work / 2, 2 * work, -work / 2])
        solution = f"Үрэлтийн хүч хөдөлгөөний эсрэг (α = 180°, cos 180° = −1): A = −Fs = −{force}·{s} = {num(work)} Ж."
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
    elif kind == "Ep":
        m, h = data
        energy = m * 10 * h
        prompt = (
            f"{num(m)} кг масстай {RAISED[o]} газраас {num(h)} м өндөрт байна. Газрын гадаргатай харьцуулсан потенциал "
            "энергийг ол. (g = 10 м/с²)"
        )
        answer, wrong = in_scale(energy, energy_scale(energy), [m * h, energy * 10 if energy < 100 else energy / 10, 10 * m * h / 2])
        solution = f"Ep = mgh = {num(m)}·10·{num(h)} = {num(energy)} Ж."
    elif kind == "fall":
        m, h1, h2 = data
        work = m * 10 * (h1 - h2)
        target = "газарт" if h2 == 0 else f"{h2} м өндөр хүртэл"
        prompt = f"{num(m)} кг масстай {RAISED[o]} {h1} м өндрөөс {target} унав. Хүндийн хүчний хийсэн ажлыг ол. (g = 10 м/с²)"
        mistakes = [m * 10 * h1 if h2 else m * 10 * h1 / 2, m * 10 * (h1 + h2) if h2 else m * h1, m * (h1 - h2)]
        answer, wrong = in_scale(work, energy_scale(work), mistakes)
        solution = f"A = mg(h1 − h2) = {num(m)}·10·({h1} − {h2}) = {num(work)} Ж."
    elif kind == "crane":
        tonnes, h = data
        work = tonnes * 1000 * 10 * h
        prompt = f"Кран {num(tonnes)} т масстай ачааг {h} м өндөрт жигд өргөв. Краны хийсэн ажлыг ол. (g = 10 м/с²)"
        answer, wrong = in_scale(work, energy_scale(work), [tonnes * 10 * h * 1000 * 10, tonnes * 1000 * h, work / 2])
        solution = f"Жигд өргөхөд F = mg. A = mgh = {num(tonnes * 1000)}·10·{h} = {num(work)} Ж = {answer}."
    elif kind == "factor":
        fh, fm = data
        factor = fh * fm
        if fm == 1:
            change = f"Биеийг газраас өргөсөн өндрийг {scaled(fh, True)}"
        else:
            change = f"Биеийг газраас өргөсөн өндрийг {scaled(fh)}, массыг нь {scaled(fm, True)}"
        answer, wrong = factor_options(factor, [fh / fm, fh * fh * fm, fh])
        return result | {
            "prompt": f"{change} газрын гадаргатай харьцуулсан потенциал энерги нь хэрхэн өөрчлөгдөх вэ?",
            "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"Ep = mgh тул Ep' = {ratio(fm)}·{ratio(fh)}·Ep = {ratio(factor)}·Ep: {low(answer)}.",
        }
    else:
        force, s, t, angle = data
        cosine = F(1, 2) if angle else F(1)
        power = force * s * cosine / t
        if angle:
            prompt = (
                f"{PULLED[o]} хэвтээтэй 60° өнцөг үүсгэсэн олсоор {force} Н хүчээр татаж, {t} с-д хэвтээ гадаргуугаар {s} м "
                "жигд чирэв. Татах хүчний чадлыг ол. (cos 60° = 0.5)"
            )
            mistakes = [force * s / t, force * s * cosine, force * t * cosine / s]
        else:
            prompt = (
                f"{PULLED[o]} хэвтээ олсоор {force} Н хүчээр татаж, {t} с-д хэвтээ гадаргуугаар {s} м жигд чирэв. "
                "Татах хүчний чадлыг ол."
            )
            mistakes = [force * s, force * s / t / 2, force * t / s]
        answer = qty(power, "Вт")
        wrong = numeric_wrongs(answer, "Вт", mistakes)
        solution = f"P = A/t = Fs·cos α/t = {force}·{s}·{num(cosine)}/{t} = {num(power)} Вт."
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 14. h_latent — Фазын шилжилтийн дулаан
# ---------------------------------------------------------------------------

VAPOURS = [  # name, accusative, genitive, L in Ж/кг, boiling point °C
    ("ус", "усыг", "усны", F(23, 10) * 10 ** 6, 100),
    ("спирт", "спиртийг", "спиртийн", F(9, 10) * 10 ** 6, 78),
    ("эфир", "эфирийг", "эфирийн", F(4, 10) * 10 ** 6, 35),
]
MELTS = [  # name, accusative, genitive, λ in Ж/кг, melting point °C
    ("мөс", "мөсийг", "мөсний", F(34, 10) * 10 ** 5, 0),
    ("хар тугалга", "хар тугалгыг", "хар тугалганы", F(25, 10) * 10 ** 4, 327),
    ("цагаан тугалга", "цагаан тугалгыг", "цагаан тугалганы", F(59, 10) * 10 ** 4, 232),
    ("хөнгөн цагаан", "хөнгөн цагааныг", "хөнгөн цагааны", F(39, 10) * 10 ** 5, 660),
    ("зэс", "зэсийг", "зэсийн", F(21, 10) * 10 ** 5, 1085),
    ("төмөр", "төмрийг", "төмрийн", F(27, 10) * 10 ** 5, 1539),
    ("мөнгө", "мөнгийг", "мөнгөний", F(87, 10) * 10 ** 4, 962),
    ("алт", "алтыг", "алтны", F(67, 10) * 10 ** 4, 1064),
]
FUELS = [("хуурай түлээ", F(10 ** 7)), ("чулуун нүүрс", F(27 * 10 ** 6)), ("бензин", F(46 * 10 ** 6)),
         ("керосин", F(46 * 10 ** 6)), ("байгалийн хий", F(44 * 10 ** 6)), ("спирт", F(27 * 10 ** 6)),
         ("хүлэр", F(14 * 10 ** 6)), ("дизель түлш", F(42 * 10 ** 6))]
LATENT_MASSES = (F(1, 10), F(1, 5), F(1, 4), F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5), F(10))


def mass_text(kilograms) -> str:
    kilograms = F(kilograms)
    return qty(kilograms * 1000, "г") if kilograms < 1 else qty(kilograms, "кг")


def specific_text(value) -> str:
    return f"{sci_exact(value, 'specific heat')} Ж/кг"


@lru_cache(maxsize=None)
def latent_versions() -> tuple:
    vapour = [(s, m) for s in range(len(VAPOURS)) for m in LATENT_MASSES]
    melt = [(s, m) for s in range(len(MELTS)) for m in LATENT_MASSES if clean(MELTS[s][3] * m / 1000, 2)]
    fuel = [(s, m) for s in range(len(FUELS)) for m in LATENT_MASSES]
    percents = (10, 20, 25, 40, 50, 75)
    fraction = ([("vap", s, m, p) for s in range(len(VAPOURS)) for m in (F(1), F(2), F(4), F(5), F(10)) for p in percents]
                + [("melt", s, m, p) for s in range(len(MELTS)) for m in (F(1), F(2), F(4), F(5), F(10)) for p in percents
                   if clean(MELTS[s][3] * m * p / 100000, 2)])
    return mix(
        1400,
        [("vap_Q",) + item for item in vapour], [("melt_Q",) + item for item in melt], [("fuel_Q",) + item for item in fuel],
        shuffled(1401, [("vap_m",) + item for item in vapour] + [("melt_m",) + item for item in melt]
                 + [("fuel_m",) + item for item in fuel]),
        shuffled(1402, [("vap_L",) + item for item in vapour] + [("melt_L",) + item for item in melt]
                 + [("fuel_L",) + item for item in fuel]),
        [("fraction",) + item for item in fraction],
    )


def h_latent(rng: random.Random, year: int, k: int) -> dict:
    version = latent_versions()[k % len(latent_versions())]
    kind, data = version[0], version[1:]
    if kind == "fraction":
        phase, s, m, percent = data
        if phase == "vap":
            name, _, gen, value, point = VAPOURS[s]
            symbol, verb, noun = "L", "ууршжээ", "Ууршихад"
            state = "100 °C-тай" if name == "ус" else "Буцлах температурт нь байгаа"
        else:
            name, _, gen, value, point = MELTS[s]
            symbol, verb, noun = "λ", "хайлжээ", "Хайлахад"
            state = "0 °C-тай" if name == "мөс" else "Хайлах температурт нь байгаа"
        heat = value * m * percent / 100
        prompt = (
            f"{state} {mass_text(m)} {gen} {percent}% нь {verb}. {noun} зарцуулсан дулааныг ол. "
            f"({symbol} = {specific_text(value)})"
        )
        answer, wrong = in_scale(heat, energy_scale(heat), [value * m, value * m * percent, value * m * (100 - percent) / 100])
        solution = (
            f"Фазын шилжилтэд орсон масс {percent}%·{num(m)} = {num(m * percent / 100)} кг. "
            f"Q = {symbol}m = {specific_text(value)}·{num(m * percent / 100)} кг = {answer}."
        )
        return {"skill": "Фазын шилжилтийн дулаан", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    s, m = data
    family = kind.split("_")[0]
    if family == "vap":
        name, acc, gen, value, point = VAPOURS[s]
        symbol = "L"
        state = "100 °C-тай" if name == "ус" else f"Буцлах температурт ({point} °C) байгаа"
        process, verb = "ууршуулахад", "ууршуулж"
        title = "уурших хувийн дулаан"
    elif family == "melt":
        name, acc, gen, value, point = MELTS[s]
        symbol = "λ"
        state = "0 °C-тай" if name == "мөс" else f"Хайлах температурт ({point} °C) байгаа"
        process, verb = "хайлуулахад", "хайлуулж"
        title = "хайлах хувийн дулаан"
    else:
        name, value = FUELS[s]
        acc = gen = name
        symbol = "q"
        title = "шаталтын хувийн дулаан"
    heat = value * m
    heat_text = energy_text(heat)
    given_value = f"({symbol} = {specific_text(value)})"
    if kind.endswith("_Q"):
        if family == "fuel":
            prompt = f"{mass_text(m)} {name} бүрэн шатахад хэдий хэмжээний дулаан ялгарах вэ? {given_value}"
        else:
            prompt = f"{state} {mass_text(m)} {acc} бүрэн {process} хэдий хэмжээний дулаан шаардлагатай вэ? {given_value}"
        grams = m < 1
        answer, wrong = in_scale(heat, energy_scale(heat), [heat * 1000 if grams else heat * 10, heat / 10, value / m if m > 1 else heat * 100])
        solution = f"Q = {symbol}m = {specific_text(value)}·{num(m)} кг = {num(heat)} Ж = {answer}."
    elif kind.endswith("_m"):
        if family == "fuel":
            prompt = f"{heat_text} дулаан авахын тулд ямар масстай {name} бүрэн шатаах шаардлагатай вэ? {given_value}"
        elif family == "vap":
            prompt = f"{heat_text} дулаанаар буцлах температурт нь байгаа ямар масстай {name} ууршуулж болох вэ? {given_value}"
        else:
            prompt = f"{heat_text} дулаанаар хайлах температурт нь байгаа ямар масстай {name} хайлуулж болох вэ? {given_value}"
        unit, scale = ("г", F(1, 1000)) if m < 1 else ("кг", F(1))
        answer = qty(m / scale, unit)
        wrong = numeric_wrongs(answer, unit, [m if m < 1 else None, m * 10 / scale, m / 10 / scale, m * 100 if m >= 1 else None], 3)
        solution = f"m = Q/{symbol} = {num(heat)} Ж / {specific_text(value)} = {num(m)} кг" + (f" = {answer}." if m < 1 else ".")
    else:
        if family == "fuel":
            prompt = f"{mass_text(m)} түлш бүрэн шатахад {heat_text} дулаан ялгарав. Түлшний шаталтын хувийн дулааныг ол."
            unit, scale = "МЖ/кг", F(10 ** 6)
        elif family == "vap":
            prompt = (
                f"Буцлах температурт нь байгаа {mass_text(m)} шингэнийг бүрэн ууршуулахад {heat_text} дулаан зарцуулав. "
                "Шингэний уурших хувийн дулааныг ол."
            )
            unit, scale = "кЖ/кг", F(1000)
        else:
            prompt = (
                f"Хайлах температурт нь байгаа {mass_text(m)} бодисыг бүрэн хайлуулахад {heat_text} дулаан зарцуулав. "
                "Бодисын хайлах хувийн дулааныг ол."
            )
            unit, scale = "кЖ/кг", F(1000)
        answer = qty(value / scale, unit)
        wrong = numeric_wrongs(answer, unit, [heat * m / scale, heat / scale, value / 10 / scale, value / 1000 / scale if m < 1 else None])
        solution = f"{symbol} = Q/m = {num(heat)} Ж / {num(m)} кг = {num(value)} Ж/кг = {answer} ({title})."
    return {"skill": "Фазын шилжилтийн дулаан", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 15. h_transfer — Дулаан дамжих төрөл
# ---------------------------------------------------------------------------

TRANSFER_NAMES = {"cond": "дулаан дамжуулал", "conv": "конвекц", "rad": "цацаргалт"}
TRANSFER_SITUATIONS = {
    "cond": [
        "Халуун цайнд дүрсэн төмөр халбаганы иш халах",
        "Халуун зуухан дээр тавьсан хайруулын тавагны бариул халах",
        "Индүүгээр хувцас индүүдэхэд даавуу халах",
        "Хүйтэн өдөр төмөр бариулыг гараар барихад гар хөрөх",
        "Халуун цайтай аягыг барихад алга халах",
        "Нэг үзүүрийг нь галд барьсан зэс савааны нөгөө үзүүр халах",
        "Гагнуурын халуун төмрөөр утас гагнах",
        "Халуун тогоон дээр тавьсан мөс хайлах",
    ],
    "conv": [
        "Радиатороос халсан агаар дээш хөөрч өрөөг бүхэлд нь дулаацуулах",
        "Доороос нь халаасан тогоон дахь ус бүхэлдээ халах",
        "Яндангаар утаа ба халуун агаар дээш гарах",
        "Өдөр далайгаас эрэг рүү салхи салхилах",
        "Хөргөгчийн дээд хэсэгт байрлах хөлдөөгч доорх агаарыг бүхэлд нь хөргөх",
        "Халсан агаар таазны орчимд хуримтлагдаж өрөөний дээд хэсэг илүү дулаан байх",
        "Өвөл цонхыг онгойлгоход хүйтэн агаар шалны дагуу өрөөнд орж ирэх",
        "Цайны данхан дахь усыг доороос нь халаахад ус эргэлдэн хөдөлж бүхэлдээ халах",
    ],
    "rad": [
        "Нарны дулаан сансрын огторгуйгаар дамжин Дэлхийд хүрэх",
        "Түлсэн галын дэргэд суухад нүүр халах",
        "Нарны гэрэлд хар өнгийн машины их бие цагаан өнгийнхөөс хурдан халах",
        "Хэт улаан туяаны чийдэнгийн доор гар дулаацах",
        "Хүйтэн өвлийн өдөр нарны гэрэлд гарахад нүүрэнд дулаан мэдрэгдэх",
        "Цахилгаан халаагчийн улайссан ороомгийн өмнө зогсоход дулаан мэдрэгдэх",
        "Үүлгүй шөнө газрын гадарга хүчтэй хөрөх",
        "Сансрын станцын гадна ханыг Нар халаах",
    ],
}
TRANSFER_EXTRA = ["Ууршилт", "Механик ажил хийх"]
TRANSFER_STATEMENTS = [
    ("Вакуумд дулаан зөвхөн цацаргалтаар дамжина.", "Вакуумд дулаан дулаан дамжуулалаар дамжина.",
     "вакуумд бодис байхгүй тул дулаан зөвхөн цацаргалтаар дамжина."),
    ("Конвекц шингэн ба хийд явагдана.", "Конвекц хатуу биед явагдана.",
     "хатуу биеийн хэсгүүд чөлөөтэй шилжиж чаддаггүй тул конвекц явагдахгүй."),
    ("Конвекцийн үед бодисын халсан хэсэг өөрөө зөөгдөнө.", "Конвекцийн үед бодис зөөгдөхгүй.",
     "конвекц нь халсан шингэн, хийн урсгалаар бодис зөөгдөх замаар явагдана."),
    ("Дулаан дамжуулалд бодис зөөгдөхгүй.", "Дулаан дамжуулалд бодисын хэсгүүд нэг газраас нөгөөд зөөгдөнө.",
     "дулаан дамжуулалд энерги хэсгүүдийн харилцан үйлчлэлээр дамжиж, бодис зөөгдөхгүй."),
    ("Металлууд дулааныг сайн дамжуулна.", "Металлууд дулааныг муу дамжуулна.",
     "металлууд чөлөөт электронтой тул дулааныг сайн дамжуулна."),
    ("Агаар дулааныг муу дамжуулна.", "Агаар дулааныг сайн дамжуулна.",
     "хий дулааныг муу дамжуулдаг; иймээс давхар шилний завсрын агаар дулааныг хадгална."),
    ("Хар өнгийн гадаргуу цацаргалтыг цагаан гадаргуугаас илүү шингээнэ.",
     "Цагаан өнгийн гадаргуу цацаргалтыг хар гадаргуугаас илүү шингээнэ.",
     "хар гадаргуу цацаргалтыг сайн шингээж, цагаан гадаргуу ихэнхийг нь ойлгоно."),
    ("Нарнаас Дэлхийд дулаан цацаргалтаар ирдэг.", "Нарнаас Дэлхийд дулаан конвекцоор ирдэг.",
     "Нар ба Дэлхийн хооронд бараг вакуум тул дулаан цацаргалтаар ирнэ."),
    ("Өрөөний халаагуурыг шалны ойролцоо байрлуулдаг нь конвекцийг ашигласан хэрэг юм.",
     "Өрөөний халаагуурыг таазны дэргэд байрлуулбал өрөө хамгийн жигд халдаг.",
     "халсан агаар дээш хөөрдөг тул халаагуурыг доор байрлуулахад конвекцоор өрөө бүхэлдээ халдаг."),
    ("Термосны давхар ханын завсрыг вакуум болгосон нь дулаан дамжуулал ба конвекцийг багасгана.",
     "Термосны мөнгөлөг ханан нь цацаргалтыг ихэсгэх зорилготой.",
     "мөнгөлөг гадаргуу цацаргалтыг ойлгож дулааны алдагдлыг багасгадаг."),
]


@lru_cache(maxsize=None)
def transfer_versions() -> tuple:
    singles = [("single", kind, index, stem) for kind in TRANSFER_SITUATIONS for index in range(8) for stem in range(2)]
    rng = random.Random(1501)
    matches, seen = [], set()
    while len(matches) < 150:
        order = tuple(rng.sample(["cond", "conv", "rad"], 3))
        picks = tuple(rng.randrange(8) for _ in range(3))
        if (order, picks) not in seen:
            seen.add((order, picks))
            matches.append(("match", order, picks, 0))
    statements = [("statement",) + item for item in statement_versions(1502, len(TRANSFER_STATEMENTS))]
    return mix(1500, singles, matches, statements)


def h_transfer(rng: random.Random, year: int, k: int) -> dict:
    version = transfer_versions()[k % len(transfer_versions())]
    kind = version[0]
    if kind == "single":
        _, transfer, index, stem = version
        situation = TRANSFER_SITUATIONS[transfer][index]
        prompt = [
            f"{situation} үзэгдэлд дулаан голчлон ямар аргаар дамжих вэ?",
            f"«{situation}» — энэ тохиолдолд дулаан дамжих аль төрөл давамгайлах вэ?",
        ][stem]
        answer = cap(TRANSFER_NAMES[transfer])
        wrong = text_wrongs(answer, [cap(name) for name in TRANSFER_NAMES.values()] + TRANSFER_EXTRA, rng)
        solution = {
            "cond": "Халуун хэсгээс хүйтэн хэсэг рүү бодис шилжихгүйгээр, шүргэлцсэн хэсгүүдээр энерги дамжиж байгаа тул дулаан дамжуулал.",
            "conv": "Халсан шингэн эсвэл хий өөрөө урсаж, бодисын урсгалаар дулаан зөөгдөж байгаа тул конвекц.",
            "rad": "Дулаан цахилгаан соронзон (хэт улаан) цацрагаар, орчин шаардлагагүйгээр дамжиж байгаа тул цацаргалт.",
        }[transfer]
    elif kind == "match":
        _, order, picks, _ = version
        lines = [f"{number}. {TRANSFER_SITUATIONS[transfer][pick]}." for number, (transfer, pick) in enumerate(zip(order, picks), start=1)]

        def describe(kinds) -> str:
            return ", ".join(f"{number} – {TRANSFER_NAMES[transfer]}" for number, transfer in enumerate(kinds, start=1))

        answer = describe(order)
        pool = [describe(perm) for perm in itertools.permutations(order) if perm != order]
        wrong = text_wrongs(answer, pool, rng)
        prompt = "Дараах үзэгдлүүдэд дулаан голчлон ямар аргаар дамжихыг харгалзуулна уу.\n" + "\n".join(lines)
        solution = (
            "Дулаан дамжуулалд бодис зөөгдөхгүйгээр шүргэлцсэн хэсгүүдээр, конвекцод шингэн ба хийн урсгалаар, "
            f"цацаргалтад цахилгаан соронзон цацрагаар дулаан дамжина. Иймд {answer}."
        )
    else:
        _, chosen, truths, polarity = version
        prompt, answer, wrong, solution = statement_item(
            rng, TRANSFER_STATEMENTS, chosen, truths, polarity,
            "Дулаан дамжих төрлүүдийн тухай дараах мэдэгдлүүдээс ЗӨВ-ийг сонго.",
            "Дулаан дамжих төрлүүдийн тухай дараах мэдэгдлүүдээс БУРУУГ сонго.",
        )
    return {"skill": "Дулаан дамжих төрөл", "prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}


# ---------------------------------------------------------------------------
# 16. g_moles — Хийн бодисын тоо
# ---------------------------------------------------------------------------

GASES = [("устөрөгч", "H₂", 2), ("гели", "He", 4), ("метан", "CH₄", 16), ("азот", "N₂", 28),
         ("хүчилтөрөгч", "O₂", 32), ("аргон", "Ar", 40), ("нүүрсхүчлийн хий", "CO₂", 44)]
AVOGADRO = F(6) * 10 ** 23
MOLES = (F(1, 10), F(1, 5), F(1, 4), F(1, 2), F(1), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5), F(10))
NA_TEXT = "N_A = 6·10²³ моль⁻¹"
NORMAL_TEXT = "хэвийн нөхцөлд 1 моль хий 22.4 л эзэлнэ"


@lru_cache(maxsize=None)
def moles_versions() -> tuple:
    gases = range(len(GASES))
    counted = [(gas, nu) for gas in gases for nu in MOLES + (F(1, 20), F(3, 10)) if clean(scientific(nu * AVOGADRO)[0], 2)]
    concentration = [(gas, nu, volume) for gas in gases for nu in (F(1, 100), F(1, 50), F(1, 20), F(1, 10), F(1, 5), F(1, 2), F(1))
                     for volume in (F(1, 2), F(1), F(2), F(4), F(5), F(10), F(20))
                     if clean(scientific(nu * AVOGADRO / (volume / 1000))[0], 2)]
    return mix(
        1600,
        [("nu", gas, nu, kilograms) for gas in gases for nu in MOLES for kilograms in (False, True)
         if not kilograms or nu * GASES[gas][2] >= 20],
        [("N",) + item for item in counted],
        [("N_mass",) + item for item in counted],
        [("V", gas, nu) for gas in gases for nu in MOLES],
        [("m_V", gas, nu) for gas in gases for nu in MOLES],
        [("n",) + item for item in concentration],
    )


def g_moles(rng: random.Random, year: int, k: int) -> dict:
    version = moles_versions()[k % len(moles_versions())]
    kind, gas, nu, rest = version[0], version[1], version[2], version[3:]
    name, formula, molar = GASES[gas]
    particle = "атом" if formula in ("He", "Ar") else "молекул"  # noble gases are monatomic
    mass = nu * molar  # grams
    result = {"skill": "Хийн бодисын тоо"}
    if kind == "nu":
        (kilograms,) = rest
        if kilograms:
            prompt = (
                f"Саванд {num(mass / 1000)} кг {name} ({formula}) байна. Бодисын тоог ол. (M = {num(F(molar, 1000))} кг/моль)"
            )
        else:
            prompt = f"{num(mass)} г {name} ({formula}) хэдэн моль бодис агуулах вэ? (M = {molar} г/моль)"
        answer = qty(nu, "моль")
        wrong = numeric_wrongs(answer, "моль", [mass * molar if mass * molar < 10 ** 4 else nu * 100, F(molar) / mass, nu * 1000 if kilograms else nu / 1000 * 100])
        solution = f"ν = m/M = {num(mass)} г / {molar} г/моль = {num(nu)} моль."
    elif kind in ("N", "N_mass"):
        count = nu * AVOGADRO
        if kind == "N":
            prompt = f"{num(nu)} моль {name} ({formula}) хэдэн {particle} агуулах вэ? ({NA_TEXT})"
            mistakes = [count * 10, count / 10, AVOGADRO / nu if nu != 1 else count * 2]
            solution = f"N = νN_A = {num(nu)}·6·10²³ = {sci_exact(count, 'N')}."
        else:
            prompt = f"{num(mass)} г {name} ({formula}) хэдэн {particle} агуулах вэ? (M = {molar} г/моль, {NA_TEXT})"
            mistakes = [mass * AVOGADRO, count * 1000, count / molar if count / molar != count else count * 2]
            solution = f"ν = m/M = {num(mass)}/{molar} = {num(nu)} моль. N = νN_A = {num(nu)}·6·10²³ = {sci_exact(count, 'N')}."
        answer, wrong = sci_options(count, "", mistakes, "N")
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong[:4], "rank": False, "solution": solution}
    elif kind == "V":
        volume = nu * F(224, 10)
        prompt = f"Хэвийн нөхцөлд {num(mass)} г {name} ({formula}) ямар эзлэхүүн эзлэх вэ? (M = {molar} г/моль; {NORMAL_TEXT})"
        answer = qty(volume, "л")
        wrong = numeric_wrongs(answer, "л", [F(224, 10) * mass if mass <= 50 else volume * 10, F(224, 10) * molar / mass, F(224, 10) / nu if nu != 1 else volume * 2])
        solution = f"ν = m/M = {num(mass)}/{molar} = {num(nu)} моль. V = ν·22.4 л = {num(volume)} л."
    elif kind == "m_V":
        volume = nu * F(224, 10)
        prompt = f"Хэвийн нөхцөлд {num(volume)} л эзлэхүүн эзлэх {name} ({formula}) ямар масстай вэ? (M = {molar} г/моль; {NORMAL_TEXT})"
        answer = qty(mass, "г")
        wrong = numeric_wrongs(answer, "г", [volume * molar if volume * molar < 10 ** 4 else mass * 10, nu, F(molar) / nu if nu != 1 else mass / 2])
        solution = f"ν = V/22.4 = {num(volume)}/22.4 = {num(nu)} моль. m = νM = {num(nu)}·{molar} = {num(mass)} г."
    else:
        (volume,) = rest
        concentration = nu * AVOGADRO / (volume / 1000)
        prompt = f"{num(volume)} л эзлэхүүнтэй саванд {num(nu)} моль {name} ({formula}) байна. {cap(particle)}ын концентрацийг ол. ({NA_TEXT})"
        answer, wrong = sci_options(concentration, "м⁻³", [concentration / 1000, concentration * 1000, nu * AVOGADRO], "n")
        solution = (
            f"N = νN_A = {sci_exact(nu * AVOGADRO, 'N')}, V = {num(volume)} л = {sci_exact(volume / 1000, 'V')} м³. "
            f"n = N/V = {answer}."
        )
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong[:4], "rank": False, "solution": solution}
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 17. g_first_law — Термодинамикийн нэгдүгээр хууль
# ---------------------------------------------------------------------------

JOULES = (100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500)
KILOJOULES = (F(3, 2), F(2), F(5, 2), F(3), F(4), F(5), F(6), F(8), F(10), F(12), F(15), F(20))
FIRST_LAW = "Термодинамикийн нэгдүгээр хууль: Q = ΔU + A, энд Q нь хийн авсан дулаан, A нь хийн хийсэн ажил."


@lru_cache(maxsize=None)
def first_law_versions() -> tuple:
    def pairs(condition):
        return ([("Ж", a, b) for a in JOULES for b in JOULES if condition(a, b)]
                + [("кЖ", a, b) for a in KILOJOULES for b in KILOJOULES if condition(a, b)])

    singles = [("Ж", a) for a in JOULES] + [("кЖ", a) for a in KILOJOULES]
    return mix(
        1700,
        [("dU_by",) + item for item in pairs(lambda a, b: a != b)],
        [("dU_on",) + item for item in pairs(lambda a, b: a != b)],
        [("Q",) + item for item in pairs(lambda a, b: True)],
        [("A",) + item for item in pairs(lambda a, b: a > b)],
        [("Q_out",) + item for item in pairs(lambda a, b: a > b)],
        shuffled(1701, [("isothermal",) + item for item in singles] + [("isochoric",) + item for item in singles]
                 + [("adiabatic",) + item + (expand,) for item in singles for expand in (True, False)]),
    )


def g_first_law(rng: random.Random, year: int, k: int) -> dict:
    version = first_law_versions()[k % len(first_law_versions())]
    kind, unit, a, rest = version[0], version[1], F(version[2]), version[3:]

    def t(value) -> str:
        return qty(value, unit)

    result = {"skill": "Термодинамикийн нэгдүгээр хууль"}
    if kind == "dU_by":
        heat, work = a, F(rest[0])
        change = heat - work
        prompt = f"Идеал хийд {t(heat)} дулаан өгөхөд хий тэлж {t(work)} ажил хийв. Хийн дотоод энергийн өөрчлөлт ΔU-г ол."
        answer, wrong = signed_options(change, unit, [-change, heat + work, -(heat + work), heat, work])
        solution = f"{FIRST_LAW} ΔU = Q − A = {num(heat)} − {num(work)} = {answer}" + (". Дотоод энерги багассан." if change < 0 else ".")
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
    if kind == "dU_on":
        work_on, heat_out = a, F(rest[0])
        change = work_on - heat_out
        prompt = (
            f"Хийг шахахад гадны хүч {t(work_on)} ажил хийж, хий орчиндоо {t(heat_out)} дулаан алдав. "
            "Хийн дотоод энергийн өөрчлөлт ΔU-г ол."
        )
        answer, wrong = signed_options(change, unit, [-change, work_on + heat_out, -(work_on + heat_out), work_on, heat_out])
        solution = (
            f"{FIRST_LAW} Энд A = −{num(work_on)}, Q = −{num(heat_out)}. ΔU = Q − A = −{num(heat_out)} + {num(work_on)} = {answer}"
            + (". Дотоод энерги багассан." if change < 0 else ".")
        )
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
    if kind in ("isothermal", "isochoric", "adiabatic"):
        if kind == "adiabatic":
            (expand,) = rest
            change = -a if expand else a
            if expand:
                prompt = f"Адиабат процессоор тэлэхдээ идеал хий {t(a)} ажил хийв. Хийн дотоод энергийн өөрчлөлт ΔU-г ол."
            else:
                prompt = f"Идеал хийг адиабат процессоор шахахад гадны хүч {t(a)} ажил хийв. Хийн дотоод энергийн өөрчлөлт ΔU-г ол."
            answer, wrong = signed_options(change, unit, [-change, F(0), 2 * change, change / 2, -2 * change])
            solution = (
                f"Адиабат процесст Q = 0 тул ΔU = −A" + (f" = −{num(a)}" if expand else f"; гадны хүчний ажил {num(a)} тул ΔU = {num(a)}")
                + f" {unit}."
            )
            return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
        if kind == "isothermal":
            prompt = f"Изотерм процессоор тэлэхдээ идеал хий {t(a)} ажил хийв. Хий хэдий хэмжээний дулаан авсан бэ?"
            solution = f"Изотерм процесст T тогтмол тул ΔU = 0. Q = A = {t(a)}."
        else:
            prompt = f"Изохор процессоор идеал хийд {t(a)} дулаан өгөв. Хийн дотоод энерги хэдээр ихсэх вэ?"
            solution = f"Изохор процесст эзлэхүүн өөрчлөгдөхгүй тул A = 0. ΔU = Q = {t(a)}."
        answer = t(a)
        wrong = numeric_wrongs(answer, unit, [2 * a, a / 2, 3 * a / 2])
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    b = F(rest[0])
    if kind == "Q":
        change, work = a, b
        value = change + work
        prompt = f"Хий тэлж {t(work)} ажил хийхэд түүний дотоод энерги {t(change)} нэмэгдэв. Хийнд хэдий хэмжээний дулаан өгсөн бэ?"
        mistakes = [abs(change - work) or change / 2, change, work, 2 * value]
        solution = f"{FIRST_LAW} Q = ΔU + A = {num(change)} + {num(work)} = {t(value)}."
    elif kind == "A":
        heat, change = a, b
        value = heat - change
        prompt = f"Идеал хийд {t(heat)} дулаан өгөхөд түүний дотоод энерги {t(change)} нэмэгдэв. Хий хэдий хэмжээний ажил хийсэн бэ?"
        mistakes = [heat + change, heat, change]
        solution = f"{FIRST_LAW} A = Q − ΔU = {num(heat)} − {num(change)} = {t(value)}."
    else:
        work_on, change = a, b
        value = work_on - change
        prompt = f"Хий дээр гадны хүч {t(work_on)} ажил хийхэд хийн дотоод энерги {t(change)} нэмэгдэв. Хий орчиндоо хэдий хэмжээний дулаан ялгаруулсан бэ?"
        mistakes = [work_on + change, work_on, change]
        solution = (
            f"{FIRST_LAW} Хийн хийсэн ажил A = −{num(work_on)}. Q = ΔU + A = {num(change)} − {num(work_on)} = −{num(value)}; "
            f"хий {t(value)} дулаан ялгаруулсан."
        )
    answer = t(value)
    wrong = numeric_wrongs(answer, unit, mistakes)
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 18. g_engine — Дулааны машины АҮК
# ---------------------------------------------------------------------------

HOT = (300, 400, 500, 600, 750, 800, 900, 1000, 1200, 1500)
COLD = (250, 273, 280, 290, 300, 320, 350, 360, 400)
HEAT_INPUTS = (100, 200, 250, 400, 500, 600, 800, 1000, 1200, 1500, 2000)
EFFICIENCIES = (F(1, 5), F(1, 4), F(3, 10), F(7, 20), F(2, 5), F(9, 20), F(1, 2), F(3, 5), F(13, 20), F(7, 10), F(3, 4), F(4, 5))
TEMPERATURE_RATIOS = (F(5, 4), F(8, 5), F(2), F(5, 2), F(4), F(5), F(8), F(10), F(20))


def percent_wrongs(answer: str, mistakes, rng: random.Random) -> list[str]:
    """Four distractors in per cent, all strictly between 0 and 100, with the key at a random rank among them
    (balance_rank would add ×2 multiples above 100 %, so these items set rank False)."""
    key = F(_number_unit(answer)[0])
    candidates = [F(value) for value in mistakes if value is not None]
    candidates += [key + step for step in (10, -10, 20, -20, 5, -5, 15, -15, 30, -30)]
    candidates += [key / 2, key * F(3, 4), 100 - key, key + (100 - key) / 2, key + (100 - key) * F(3, 4)]
    below, above, seen = [], [], [key]
    for value in candidates:
        text = qty(value, "%", 1)
        if not 0 < value < 100 or text == answer or any(abs(value - other) <= max(value, other) / 50 for other in seen):
            continue
        seen.append(value)
        (below if value < key else above).append(text)
    under = min(rng.randrange(5), len(below))
    if 4 - under > len(above):
        under = 4 - len(above)
    if under > len(below):
        raise ValueError(f"too few per-cent distractors for {answer!r}")
    return below[:under] + above[:4 - under]


def percent(value) -> str:
    return qty(F(value) * 100, "%")


@lru_cache(maxsize=None)
def engine_versions() -> tuple:
    carnot = [(t1, t2, celsius) for t1 in HOT for t2 in COLD if t2 < t1 and clean(100 - F(100 * t2, t1), 1)
              and F(1, 10) <= 1 - F(t2, t1) <= F(17, 20) for celsius in (True, False)]
    cycles = [(unit, q1, work) for unit in ("Ж", "кЖ") for q1 in HEAT_INPUTS for work in (20, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800)
              if work < q1 and clean(F(100 * work, q1), 1) and F(1, 10) <= F(work, q1) <= F(4, 5)]
    shares = [(unit, q1, eta) for unit in ("Ж", "кЖ") for q1 in HEAT_INPUTS for eta in EFFICIENCIES if clean(q1 * eta, 1)]
    temperatures = [(t2, eta) for t2 in (250, 270, 280, 290, 300, 320, 350, 360, 400) for eta in EFFICIENCIES
                    if clean(F(t2) / (1 - eta), 1)]
    hot_known = [(t1, eta) for t1 in (400, 450, 500, 600, 750, 800, 900, 1000, 1200) for eta in EFFICIENCIES if clean(t1 * (1 - eta), 1)]
    return mix(
        1800,
        [("carnot",) + item for item in carnot],
        [("eta",) + item for item in cycles], [("Q2",) + item for item in cycles],
        shuffled(1801, [("Q2_eta",) + item for item in shares] + [("A_eta",) + item for item in shares]),
        [("ratio", n, order) for n in TEMPERATURE_RATIOS for order in (0, 1)],
        shuffled(1802, [("T1",) + item for item in temperatures] + [("T2",) + item for item in hot_known]),
    )


def g_engine(rng: random.Random, year: int, k: int) -> dict:
    version = engine_versions()[k % len(engine_versions())]
    kind, data = version[0], version[1:]
    if kind == "carnot":
        t1, t2, celsius = data
        eta = 1 - F(t2, t1)
        if celsius:
            prompt = (
                f"Идеал дулааны машины халаагчийн температур {num(t1 - 273)} °C, хөргөгчийнх {num(t2 - 273)} °C. "
                "Машины ашигт үйлийн коэффициентийг ол."
            )
            solution = f"T1 = {num(t1 - 273)} + 273 = {t1} К, T2 = {num(t2 - 273)} + 273 = {t2} К. η = 1 − T2/T1 = 1 − {t2}/{t1} = {percent(eta)}."
            wrongs_c = [1 - F(t2 - 273, t1 - 273)] if t2 > 273 else []
        else:
            prompt = f"Идеал дулааны машины халаагчийн температур {t1} К, хөргөгчийнх {t2} К. Машины ашигт үйлийн коэффициентийг ол."
            solution = f"η = 1 − T2/T1 = 1 − {t2}/{t1} = {percent(eta)}."
            wrongs_c = []
        answer = percent(eta)
        mistakes = wrongs_c + [F(t2, t1), F(t1 - t2, t2) if t1 < 2 * t2 else F(t2, 2 * t1)]
        wrong = percent_wrongs(answer, [m * 100 for m in mistakes if 0 < m < 1], rng)
    elif kind in ("eta", "Q2"):
        unit, q1, work = data
        lead = f"Дулааны машин нэг циклд халаагчаас {qty(q1, unit)} дулаан авч, {qty(work, unit)} ажил хийнэ."
        if kind == "eta":
            eta = F(work, q1)
            prompt = lead + " Машины ашигт үйлийн коэффициентийг ол."
            answer = percent(eta)
            wrong = percent_wrongs(answer, [100 * (1 - eta), 100 * F(work, q1 - work) if 2 * work < q1 else None], rng)
            solution = f"η = A/Q1 = {work}/{q1} = {percent(eta)}."
        else:
            prompt = lead + " Нэг циклд хөргөгчид хэдий хэмжээний дулаан өгөх вэ?"
            answer = qty(q1 - work, unit)
            wrong = numeric_wrongs(answer, unit, [q1 + work, work, q1])
            solution = f"Энерги хадгалагдана: Q1 = A + Q2, Q2 = Q1 − A = {q1} − {work} = {answer}."
    elif kind in ("Q2_eta", "A_eta"):
        unit, q1, eta = data
        lead = f"Ашигт үйлийн коэффициент нь {percent(eta)} дулааны машин нэг циклд халаагчаас {qty(q1, unit)} дулаан авна."
        work = q1 * eta
        if kind == "A_eta":
            prompt = lead + " Нэг циклд хийх ажлыг ол."
            answer = qty(work, unit)
            wrong = numeric_wrongs(answer, unit, [q1 - work, q1 / eta if q1 / eta < 10 ** 4 else q1 * 2, q1 * eta * eta])
            solution = f"A = ηQ1 = {num(eta)}·{q1} = {answer}."
        else:
            prompt = lead + " Нэг циклд хөргөгчид өгөх дулааныг ол."
            answer = qty(q1 - work, unit)
            wrong = numeric_wrongs(answer, unit, [work, q1 + work, q1])
            solution = f"A = ηQ1 = {num(eta)}·{q1} = {num(work)}. Q2 = Q1 − A = {q1} − {num(work)} = {answer}."
    elif kind == "ratio":
        n, order = data
        eta = 1 - 1 / n
        if order:
            prompt = (
                f"Идеал дулааны машины хөргөгчийн үнэмлэхүй температур халаагчийнхаас {num(n)} дахин бага. "
                "Машины АҮК-ийг ол."
            )
        else:
            prompt = (
                f"Идеал дулааны машины халаагчийн үнэмлэхүй температур хөргөгчийнхөөс {num(n)} дахин их. "
                "Машины АҮК-ийг ол."
            )
        answer = percent(eta)
        wrong = percent_wrongs(answer, [100 / n, 100 * (1 - 1 / (n * n)), 100 * (1 - 2 / n) if n > 2 else None], rng)
        solution = f"η = 1 − T2/T1 = 1 − 1/{num(n)} = {answer}."
    else:
        if kind == "T1":
            t2, eta = data
            t1 = F(t2) / (1 - eta)
            prompt = f"Хөргөгчийн температур нь {t2} К байх идеал дулааны машины АҮК {percent(eta)} бол халаагчийн температурыг ол."
            answer = qty(t1, "К")
            wrong = numeric_wrongs(answer, "К", [t2 * (1 + eta), t2 / eta if t2 / eta < 5000 else t1 * 2, t2 * (1 - eta)])
            solution = f"η = 1 − T2/T1 тул T1 = T2/(1 − η) = {t2}/{num(1 - eta)} = {num(t1)} К."
        else:
            t1, eta = data
            t2 = t1 * (1 - eta)
            prompt = f"Халаагчийн температур нь {t1} К байх идеал дулааны машины АҮК {percent(eta)} бол хөргөгчийн температурыг ол."
            answer = qty(t2, "К")
            wrong = numeric_wrongs(answer, "К", [t1 * eta, F(t1) / (1 + eta), t1 * (1 - eta) - 273 if t2 > 300 else t1 - t2 / 2])
            solution = f"η = 1 − T2/T1 тул T2 = T1(1 − η) = {t1}·{num(1 - eta)} = {num(t2)} К."
    return {"skill": "Дулааны машины АҮК", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution,
            "rank": not answer.endswith("%")}


# ---------------------------------------------------------------------------
# 19. g_state — Идеал хийн төлвийн тэгшитгэл
# ---------------------------------------------------------------------------

STATE_WORDS = {"p": ("даралтыг", "даралт нь"), "V": ("эзлэхүүнийг", "эзлэхүүн нь"),
               "T": ("үнэмлэхүй температурыг", "үнэмлэхүй температур нь")}
STATE_POWERS = {"p": {"T": 1, "V": -1}, "V": {"T": 1, "p": -1}, "T": {"p": 1, "V": 1}}
MKT_WORDS = {"n": "молекулын концентрацийг", "v": "молекулуудын дундаж квадрат хурдыг", "m": "молекулын массыг",
             "E": "молекулуудын хөдөлгөөний дундаж кинетик энергийг"}
MKT_POWERS = {"n": 1, "v": 2, "m": 1, "E": 1}
MKT_PAIRS = [("n", "v"), ("n", "E"), ("m", "v"), ("n", "m"), ("v",), ("E",), ("n",)]
R_TEXT = "R = 8.31 Ж/(моль·К)"
R_GAS = F(831, 100)


@lru_cache(maxsize=None)
def state_versions() -> tuple:
    factors = (F(2), F(3), F(4), F(1, 2), F(1, 3), F(1, 4))
    pairs = []
    for asked in "pVT":
        x, y = [q for q in "pVT" if q != asked]
        for fx in factors:
            for fy in factors:
                powers = STATE_POWERS[asked]
                factor = fx ** powers[x] * fy ** powers[y]
                if factor_text(factor):
                    pairs.append((asked, x, fx, y, fy))
                    pairs.append((asked, y, fy, x, fx))
        for constant in (x, y):
            changed = y if constant == x else x
            for fc in factors:
                pairs.append((asked, changed, fc, constant, F(1)))
    pairs = distinct(pairs, lambda item: item)
    numeric = []
    for p1 in (100, 120, 150, 200, 250, 300):
        for v1 in (2, 3, 4, 5, 6, 8, 10, 12):
            for t1 in (250, 300, 350, 400, 450, 500, 600):
                for second in (2, 3, 4, 5, 6, 8, 10, 12, 15):
                    for third in (200, 250, 300, 350, 400, 450, 500, 600, 750, 800):
                        p2 = F(p1 * v1 * third, second * t1)
                        if second != v1 and third != t1 and clean(p2, 1) and 20 <= p2 <= 1000:
                            numeric.append(("p", p1, v1, t1, second, third))
    gas_law = [(nu, temperature, volume) for nu in (F(1, 2), F(1), F(2), F(3), F(4), F(5)) for temperature in (200, 250, 300, 400, 500, 600)
               for volume in (5, 10, 20, 25, 50, 100) if clean(R_GAS * nu * temperature / volume, 2)]
    mkt = []
    for pair in MKT_PAIRS:
        for f1 in factors:
            for f2 in (factors if len(pair) == 2 else (F(1),)):
                factor = f1 ** MKT_POWERS[pair[0]] * (f2 ** MKT_POWERS[pair[1]] if len(pair) == 2 else 1)
                if factor_text(factor):
                    mkt.append((pair, f1, f2))
    return mix(
        1900,
        [("factor",) + item for item in pairs],
        [("numeric",) + item for item in numeric],
        shuffled(1901, [("pV", ask) + item for item in gas_law for ask in ("p", "T", "nu")]),
        [("mkt",) + item for item in mkt],
    )


def g_state(rng: random.Random, year: int, k: int) -> dict:
    version = state_versions()[k % len(state_versions())]
    kind, data = version[0], version[1:]
    result = {"skill": "Идеал хийн төлвийн тэгшитгэл"}
    if kind == "factor":
        asked, x, fx, y, fy = data
        powers = STATE_POWERS[asked]
        factor = fx ** powers[x] * fy ** powers[y]
        if fy == 1:
            change = f"{STATE_WORDS[y][0]} тогтмол байлгаж {STATE_WORDS[x][0]} {scaled(fx, True)}"
        else:
            change = f"{STATE_WORDS[x][0]} {scaled(fx)}, {STATE_WORDS[y][0]} {scaled(fy, True)}"
        answer, wrong = factor_options(factor, [fx * fy, 1 / factor, fx / fy, fy / fx])
        law = {"p": "p = const·T/V", "V": "V = const·T/p", "T": "T = const·pV"}[asked]
        return result | {
            "prompt": f"Тогтмол масстай идеал хийн {change} {STATE_WORDS[asked][1]} хэрхэн өөрчлөгдөх вэ?",
            "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"pV/T = const тул {law}. Иймд {asked}' = {ratio(factor)}·{asked}: {low(answer)}.",
        }
    if kind == "mkt":
        pair, f1, f2 = data
        factor = f1 ** MKT_POWERS[pair[0]] * (f2 ** MKT_POWERS[pair[1]] if len(pair) == 2 else 1)
        if len(pair) == 2:
            change = f"{MKT_WORDS[pair[0]]} {scaled(f1)}, {MKT_WORDS[pair[1]]} {scaled(f2, True)}"
        else:
            change = f"Бусад хэмжигдэхүүнийг тогтмол байлгаж {MKT_WORDS[pair[0]]} {scaled(f1, True)}"
        answer, wrong = factor_options(factor, [f1 * f2, 1 / factor, f1 * f2 * f2 if len(pair) == 2 else f1 * f1, f1])
        return result | {
            "prompt": f"Идеал хийн {change} хийн даралт хэрхэн өөрчлөгдөх вэ?" if len(pair) == 2
            else f"{change} идеал хийн даралт хэрхэн өөрчлөгдөх вэ?",
            "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"p = (1/3)·n·m0·v² = (2/3)·n·Ē тул p' = {ratio(factor)}·p: {low(answer)}.",
        }
    if kind == "numeric":
        _, p1, v1, t1, v2, t2 = data
        p2 = F(p1 * v1 * t2, v2 * t1)
        prompt = (
            f"Тогтмол масстай идеал хийн даралт {p1} кПа, эзлэхүүн {v1} л, температур {t1} К байв. Эзлэхүүнийг {v2} л, "
            f"температурыг {t2} К болгоход даралт ямар болох вэ?"
        )
        answer = qty(p2, "кПа")
        wrong = numeric_wrongs(answer, "кПа", [F(p1 * v2 * t2, v1 * t1), F(p1 * v1 * t1, v2 * t2), F(p1 * t2, t1), F(p1 * v1, v2)], 1)
        solution = f"p1V1/T1 = p2V2/T2 тул p2 = p1V1T2/(V2T1) = {p1}·{v1}·{t2}/({v2}·{t1}) = {num(p2)} кПа."
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    ask, nu, temperature, volume = data
    pressure = R_GAS * nu * temperature / volume  # кПа, since V is in litres
    if ask == "p":
        prompt = (
            f"{volume} л эзлэхүүнтэй битүү саванд {num(nu)} моль идеал хий {temperature} К температуртай байна. "
            f"Хийн даралтыг ол. ({R_TEXT})"
        )
        answer = qty(pressure, "кПа")
        wrong = numeric_wrongs(answer, "кПа", [pressure * 1000, pressure / nu if nu != 1 else pressure * 2, pressure * (temperature - 273) / temperature if temperature > 273 else pressure / 2])
        solution = (
            f"pV = νRT тул p = νRT/V = {num(nu)}·8.31·{temperature}/({volume}·10⁻³) Па = {num(pressure * 1000)} Па = {num(pressure)} кПа."
        )
    elif ask == "T":
        prompt = (
            f"{volume} л эзлэхүүнтэй битүү саванд байгаа {num(nu)} моль идеал хийн даралт {num(pressure)} кПа. "
            f"Хийн температурыг ол. ({R_TEXT})"
        )
        answer = qty(temperature, "К")
        wrong = numeric_wrongs(answer, "К", [temperature - 273 if temperature > 300 else temperature + 273, temperature * nu if nu != 1 else temperature * 2, F(temperature, 1000) * 100])
        solution = f"T = pV/(νR) = {num(pressure * 1000)}·{volume}·10⁻³/({num(nu)}·8.31) = {temperature} К."
    else:
        prompt = (
            f"{volume} л эзлэхүүнтэй битүү саванд байгаа {temperature} К температуртай идеал хийн даралт {num(pressure)} кПа. "
            f"Саванд хэдэн моль хий байгааг ол. ({R_TEXT})"
        )
        answer = qty(nu, "моль")
        wrong = numeric_wrongs(answer, "моль", [nu * 1000, nu * temperature / 273 if temperature != 273 else nu * 2, nu * 10])
        solution = f"ν = pV/(RT) = {num(pressure * 1000)}·{volume}·10⁻³/(8.31·{temperature}) = {num(nu)} моль."
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 20. g_work — Хийн хийх ажил
# ---------------------------------------------------------------------------


@lru_cache(maxsize=None)
def gas_work_versions() -> tuple:
    litres = (1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20)
    pressures = (50, 100, 120, 150, 200, 250, 300, 400, 500)
    isobaric = [(p, v1, v2) for p in pressures for v1 in litres for v2 in litres if v1 != v2]
    cubic = [(p, v1, v2) for p in (1, F(3, 2), 2, F(5, 2), 3, 4, 5) for v1 in (F(1, 100), F(1, 50), F(1, 20), F(1, 10), F(1, 5))
             for v2 in (F(3, 100), F(1, 20), F(1, 10), F(1, 4), F(3, 10), F(1, 2)) if v2 > v1]
    heated = [(nu, change) for nu in (F(1, 2), 1, 2, 3, 4, 5, 10) for change in (10, 20, 25, 40, 50, 100, 200) if clean(R_GAS * nu * change, 2)]
    rectangles = [(p1, p2, v1, v2) for p1 in (50, 100, 150, 200) for p2 in (200, 250, 300, 400, 500) if p2 > p1
                  for v1 in (1, 2, 3, 4, 5) for v2 in (4, 6, 8, 10, 12) if v2 > v1]
    return mix(
        2000,
        [("isobaric",) + item for item in isobaric],
        [("cubic",) + item for item in cubic],
        [("heated",) + item for item in heated],
        shuffled(2001, [("cycle",) + item for item in rectangles] + [("segment", ask) + item for item in rectangles for ask in (0, 1)]),
        [("compare",) + item for item in rectangles],
    )


def cycle_figure(p1, p2, v1, v2) -> dict:
    return {
        "kind": "p_v_diagram",
        "points": [[v1, p1], [v1, p2], [v2, p2], [v2, p1], [v1, p1]],
        "labels": ["1", "2", "3", "4", ""],
    }


def g_work(rng: random.Random, year: int, k: int) -> dict:
    version = gas_work_versions()[k % len(gas_work_versions())]
    kind, data = version[0], version[1:]
    figure = None
    if kind == "isobaric":
        p, v1, v2 = data
        work = F(p * abs(v2 - v1))  # кПа·л = Ж
        if v2 > v1:
            prompt = f"Идеал хий {p} кПа тогтмол даралттай үед эзлэхүүн нь {v1} л-ээс {v2} л хүртэл ихсэв. Хийн хийсэн ажлыг ол."
            who = "Хийн хийсэн ажил"
        else:
            prompt = (
                f"Идеал хийг {p} кПа тогтмол даралттай үед {v1} л-ээс {v2} л хүртэл шахав. Гадны хүч хий дээр ямар ажил хийсэн бэ?"
            )
            who = "Гадны хүчний ажил"
        answer, wrong = in_scale(work, energy_scale(work), [p * max(v1, v2), p * min(v1, v2), work * 1000, p * (v1 + v2)])
        solution = f"{who} A = pΔV = {p}·10³ Па·{abs(v2 - v1)}·10⁻³ м³ = {num(work)} Ж" + (f" = {answer}." if answer != f"{num(work)} Ж" else ".")
    elif kind == "cubic":
        p, v1, v2 = data
        pressure = p * 10 ** 5
        work = pressure * (v2 - v1)
        prompt = (
            f"{sci_exact(F(pressure), 'p')} Па тогтмол даралттай идеал хийн эзлэхүүн {num(v1)} м³-ээс {num(v2)} м³ хүртэл ихсэв. "
            "Хийн хийсэн ажлыг ол."
        )
        answer, wrong = in_scale(work, energy_scale(work), [pressure * v2, pressure * v1, p * (v2 - v1) * 1000, work * 10])
        solution = f"A = pΔV = {sci_exact(F(pressure), 'p')}·({num(v2)} − {num(v1)}) = {num(work)} Ж = {answer}."
    elif kind == "heated":
        nu, change = data
        work = R_GAS * nu * change
        prompt = f"{num(nu)} моль идеал хийг тогтмол даралттай үед {change} К-ээр халаав. Хийн хийсэн ажлыг ол. ({R_TEXT})"
        answer = qty(work, "Ж")
        wrong = numeric_wrongs(answer, "Ж", [work * F(3, 2), work * F(5, 2), work / nu if nu != 1 else work * 2])
        solution = f"Изобар процесст A = pΔV = νRΔT = {num(nu)}·8.31·{change} = {num(work)} Ж."
    else:
        if kind == "segment":
            ask, p1, p2, v1, v2 = data
        else:
            ask = None
            p1, p2, v1, v2 = data
        dv = v2 - v1
        states = (
            f"1-р төлөвт p1 = {p1} кПа, V1 = {v1} л; 2-р төлөвт p2 = {p2} кПа, V2 = {v1} л; 3-р төлөвт p3 = {p2} кПа, "
            f"V3 = {v2} л; 4-р төлөвт p4 = {p1} кПа, V4 = {v2} л."
        )
        lead = f"Идеал хий p–V диаграммд үзүүлсэн 1–2–3–4–1 тойрог процессыг хийв. {states}"
        if kind == "compare":
            ratio_value = F(p2, p1)
            prompt = (
                f"Идеал хийг 1-р төлвөөс 3-р төлөвт хоёр янзаар шилжүүлэв: 1–2–3 (изохор, дараа нь изобар) ба 1–4–3 "
                f"(изобар, дараа нь изохор). {states} 1–2–3 процесст хийн хийсэн ажил 1–4–3 процессынхоос хэд дахин их вэ?"
            )
            answer = qty(ratio_value, "дахин")
            wrong = numeric_wrongs(answer, "дахин", [F(p1, p2) * 10, F(v2, v1), ratio_value + 1, F(p2 + p1, p1)])
            solution = (
                f"Изохор хэсэгт ажил 0. A123 = p2(V3 − V2) = {p2}·{dv} = {p2 * dv} Ж, A143 = p1(V4 − V1) = {p1}·{dv} = "
                f"{p1 * dv} Ж. A123/A143 = {p2}/{p1} = {num(ratio_value)}."
            )
        else:
            figure = cycle_figure(p1, p2, v1, v2)
            if kind == "cycle":
                work = F((p2 - p1) * dv)
                prompt = f"{lead} Нэг циклд хийн хийсэн ажлыг ол."
                mistakes = [p2 * dv, p1 * dv, (p1 + p2) * dv, work / 2]
                solution = (
                    f"Тойрог процессын ажил нь диаграмм дээрх тэгш өнцөгтийн талбай: A = (p2 − p1)(V3 − V2) = "
                    f"({p2} − {p1})·10³ Па·{dv}·10⁻³ м³ = {num(work)} Ж."
                )
            elif ask == 0:
                work = F(p2 * dv)
                prompt = f"{lead} 2–3 процесст хийн хийсэн ажлыг ол."
                mistakes = [p1 * dv, (p2 - p1) * dv, p2 * v2]
                solution = f"2–3 нь изобар тэлэлт: A23 = p2(V3 − V2) = {p2}·10³ Па·{dv}·10⁻³ м³ = {num(work)} Ж."
            else:
                work = F(p1 * dv)
                prompt = f"{lead} 4–1 процесст гадны хүч хий дээр ямар ажил хийх вэ?"
                mistakes = [p2 * dv, (p2 - p1) * dv, p1 * v2]
                solution = f"4–1 нь изобар шахалт: гадны хүчний ажил A = p1(V4 − V1) = {p1}·10³ Па·{dv}·10⁻³ м³ = {num(work)} Ж."
            answer, wrong = in_scale(work, energy_scale(work), mistakes)
    return {"skill": "Хийн хийх ажил", "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution, "figure": figure}


# ---------------------------------------------------------------------------
# 21. n_kepler — Гаригийн хөдөлгөөн
# ---------------------------------------------------------------------------

SOLAR_BODIES = ["Нарны аймгийн нэгэн гариг", "Нэгэн астероид", "Нэгэн одой гариг", "Нэгэн сүүлт од"]
EARTH_NOTE = "(Дэлхий Нарнаас 1 одон орны нэгж зайд оршиж, Нарыг 1 жилд тойрдог.)"
KEPLER_DISTANCES = (F(4, 25), F(1, 4), F(9, 25), F(49, 100), F(16, 25), F(81, 100), F(121, 100), F(36, 25), F(169, 100),
                    F(49, 25), F(9, 4), F(64, 25), F(81, 25), F(4), F(25, 4), F(9), F(16), F(25), F(36))
KEPLER_TWO = (F(4), F(9), F(16), F(1, 4), F(1, 9), F(9, 4), F(4, 9), F(25, 4))
SECOND_LAW = [
    ("Гариг Нарыг эллипс тойрог замаар тойрдог.", "Нарнаас"),
    ("Сүүлт од Нарыг ихэд сунасан эллипс тойрог замаар тойрдог.", "Нарнаас"),
    ("Хиймэл дагуул Дэлхийг эллипс тойрог замаар тойрдог.", "Дэлхийгээс"),
]
SECOND_ASKS = [
    ("хурд нь хамгийн бага", "far"), ("хурд нь хамгийн их", "near"),
    ("кинетик энерги нь хамгийн их", "near"), ("кинетик энерги нь хамгийн бага", "far"),
]


def three_halves(value) -> Fraction:
    """value^(3/2) for a rational square."""
    return root(value) ** 3


@lru_cache(maxsize=None)
def kepler_versions() -> tuple:
    n = len(SOLAR_BODIES)
    forward = [(a,) for a in KEPLER_DISTANCES]
    backward = [(a,) for a in KEPLER_DISTANCES if clean(three_halves(a), 3)]
    two = [(r1, factor, t1) for r1 in (20, 30, 40, 50, 60, 80, 100, 150) for factor in KEPLER_TWO
           for t1 in (10, 20, 30, 40, 50, 60, 80, 100, 120)
           if (r1 * factor).denominator == 1 and clean(t1 * three_halves(factor), 1) and t1 * three_halves(factor) <= 2000]
    speeds = [(v1, factor) for v1 in (F(8), F(6), F(4), F(15, 2), F(36, 5), F(5)) for factor in (F(4), F(9), F(16), F(25), F(9, 4), F(36, 25))
              if clean(v1 / root(factor), 2)]
    periods = [(t1, factor) for t1 in (F(3, 2), F(2), F(3), F(4), F(5), F(6), F(8), F(12), F(24)) for factor in (F(4), F(9), F(16), F(9, 4))
               if clean(t1 * three_halves(factor), 2)]
    factors = [(quantity, factor) for quantity in ("v", "T") for factor in (F(4), F(9), F(16), F(25), F(1, 4), F(1, 9), F(1, 16))
               if factor_text(1 / root(factor) if quantity == "v" else three_halves(factor))]
    second = [(body, ask) for body in range(len(SECOND_LAW)) for ask in range(len(SECOND_ASKS))]
    trend = [(body, closer) for body in range(len(SECOND_LAW)) for closer in (True, False)]
    return mix(
        2100,
        cycle(2101, "forward", forward * 2, n),
        cycle(2102, "backward", backward * 2, n),
        [("two", 0) + item for item in two],
        shuffled(2103, [("speed", 0) + item for item in speeds] + [("period", 0) + item for item in periods]),
        [("factor", 0) + item for item in factors],
        shuffled(2104, [("second", 0) + item for item in second] + [("trend", 0) + item for item in trend]),
    )


def n_kepler(rng: random.Random, year: int, k: int) -> dict:
    version = kepler_versions()[k % len(kepler_versions())]
    kind, b, data = version[0], version[1], version[2:]
    result = {"skill": "Гаригийн хөдөлгөөн"}
    if kind in ("forward", "backward"):
        (a,) = data
        period = three_halves(a)
        body = SOLAR_BODIES[b]
        if kind == "forward":
            prompt = f"{body} Нарнаас дунджаар {num(a)} одон орны нэгж зайд оршдог. Түүний Нарыг тойрох эргэлтийн үеийг ол. {EARTH_NOTE}"
            answer = qty(period, "жил")
            wrong = numeric_wrongs(answer, "жил", [a, a * a, root(a)], 3)
            solution = f"Кеплерийн гуравдугаар хууль: T²/a³ = const. T = a^(3/2) = √({num(a)})³ = {num(root(a))}³ = {num(period)} жил."
        else:
            prompt = f"{body} Нарыг {num(period)} жилд нэг тойрдог. Нарнаас түүний дундаж зайг одон орны нэгжээр ол. {EARTH_NOTE}"
            answer = qty(a, "одон орны нэгж")
            wrong = numeric_wrongs(answer, "одон орны нэгж", [period, root(a), period * period if period * period < 10 ** 4 else a * 2], 3)
            solution = f"T²/a³ = const тул a³ = T² = {num(period)}², a = {num(a)} одон орны нэгж (шалгалт: {num(a)}³ = {num(a ** 3)} = {num(period)}²)."
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    if kind == "two":
        r1, factor, t1 = data
        r2 = r1 * factor
        t2 = t1 * three_halves(factor)
        prompt = (
            f"Нэгэн одыг тойрох хоёр гаригийн тойрог замын радиус {r1} сая км ба {num(r2)} сая км. Эхний гариг одыг {t1} "
            "хоногт нэг тойрдог бол хоёр дахь гариг хэдэн хоногт нэг тойрох вэ?"
        )
        answer = qty(t2, "хоног")
        wrong = numeric_wrongs(answer, "хоног", [t1 * factor, t1 * root(factor), t1 * factor * factor], 1)
        solution = (
            f"T2/T1 = (R2/R1)^(3/2) = ({num(factor)})^(3/2) = {num(three_halves(factor))}. T2 = {t1}·{num(three_halves(factor))} = "
            f"{num(t2)} хоног."
        )
    elif kind == "speed":
        v1, factor = data
        v2 = v1 / root(factor)
        prompt = (
            f"Дэлхийг R радиустай тойрог замаар тойрох хиймэл дагуулын хурд {num(v1)} км/с. {num(factor)}R радиустай "
            "тойрог замаар тойрох хиймэл дагуулын хурдыг ол."
        )
        answer = qty(v2, "км/с")
        wrong = numeric_wrongs(answer, "км/с", [v1 / factor, v1 * root(factor), v1 / (factor * root(factor))])
        solution = f"GMm/r² = mv²/r тул v = √(GM/r) ∝ 1/√r. v2 = v1/√{num(factor)} = {num(v1)}/{num(root(factor))} = {num(v2)} км/с."
    elif kind == "period":
        t1, factor = data
        t2 = t1 * three_halves(factor)
        prompt = (
            f"Дэлхийг R радиустай тойрог замаар тойрох хиймэл дагуулын эргэлтийн үе {num(t1)} цаг. {num(factor)}R радиустай "
            "тойрог замаар тойрох хиймэл дагуулын эргэлтийн үеийг ол."
        )
        answer = qty(t2, "цаг")
        wrong = numeric_wrongs(answer, "цаг", [t1 * factor, t1 * root(factor), t1 * factor * factor])
        solution = f"Кеплерийн гуравдугаар хуулиар T ∝ r^(3/2): T2 = {num(t1)}·({num(factor)})^(3/2) = {num(t1)}·{num(three_halves(factor))} = {num(t2)} цаг."
    elif kind == "factor":
        quantity, factor = data
        change = f"Хиймэл дагуулын тойрог замын радиусыг {scaled(factor, True)}"
        if quantity == "v":
            value = 1 / root(factor)
            prompt = f"{change} тойрог замын хурд нь хэрхэн өөрчлөгдөх вэ?"
            answer, wrong = factor_options(value, [1 / factor, root(factor), factor, three_halves(factor)])
            solution = f"v = √(GM/r) ∝ 1/√r тул v' = {ratio(value)}·v: {low(answer)}."
        else:
            value = three_halves(factor)
            prompt = f"{change} эргэлтийн үе нь хэрхэн өөрчлөгдөх вэ?"
            answer, wrong = factor_options(value, [factor, root(factor), factor * factor, 1 / value])
            solution = f"T² ∝ r³ тул T' = ({ratio(factor)})^(3/2)·T = {ratio(value)}·T: {low(answer)}."
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
    elif kind == "second":
        body, ask = data
        name, source = SECOND_LAW[body]
        phrase, where = SECOND_ASKS[ask]
        options = {
            "near": f"{source} хамгийн ойр цэгт",
            "far": f"{source} хамгийн хол цэгт",
        }
        pool = [options["near"], options["far"], "Тойрог замын бүх цэгт ижил", f"{source} дундаж зайтай цэгт",
                "Хурд нь тойрог замын хэлбэрээс хамаарахгүй"]
        answer = options[where]
        prompt = f"{name} Тойрог замын аль цэгт түүний {phrase} байх вэ?"
        wrong = text_wrongs(answer, pool, rng)
        solution = (
            "Кеплерийн хоёрдугаар хууль: радиус-вектор ижил хугацаанд ижил талбай зурна. Иймд ойр цэгт хурд (кинетик энерги) "
            f"хамгийн их, хол цэгт хамгийн бага. Иймд хариу: «{answer}»."
        )
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
    else:
        body, closer = data
        name, source = SECOND_LAW[body]
        answer = "Ихэснэ" if closer else "Багасна"
        motion = "ойртож" if closer else "холдож"
        prompt = f"{name} Тойрог замынхаа дагуу {source} {motion} байх үед түүний хурд хэрхэн өөрчлөгдөх вэ?"
        pool = ["Ихэснэ", "Багасна", "Өөрчлөгдөхгүй", "Эхлээд ихсээд дараа нь багасна", "Тэг болно"]
        wrong = text_wrongs(answer, pool, rng)
        solution = (
            "Кеплерийн хоёрдугаар хуулиар радиус-вектор ижил хугацаанд ижил талбай зурна; зай багасахад хурд ихэсч, "
            f"зай ихсэхэд хурд багасна. Иймд {low(answer)}."
        )
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 22. n_sky — Одон орны үзэгдэл
# ---------------------------------------------------------------------------

SKY_STATEMENTS = [
    ("Нарны хиртэлтийн үед Сар Нар ба Дэлхийн хооронд байрлана.",
     "Нарны хиртэлтийн үед Дэлхий Нар ба Сарны хооронд байрлана.",
     "Нарны хиртэлтийн үед Сар Нар ба Дэлхийн хооронд орж, Сарны сүүдэр Дэлхий дээр тусна."),
    ("Сарны хиртэлтийн үед Дэлхий Нар ба Сарны хооронд байрлана.",
     "Сарны хиртэлтийн үед Сар Нар ба Дэлхийн хооронд байрлана.",
     "Сарны хиртэлтийн үед Дэлхий Нар ба Сарны хооронд орж, Дэлхийн сүүдэр Сар дээр тусна."),
    ("Нарны хиртэлт зөвхөн шинэ сарын үед тохиолдож болно.",
     "Нарны хиртэлт тэргэл сарын үед тохиолддог.",
     "Нарны хиртэлт Сар Нар ба Дэлхийн хооронд байх шинэ сарын үед л тохиолдоно."),
    ("Сарны хиртэлт зөвхөн тэргэл сарын үед тохиолдож болно.",
     "Сарны хиртэлт шинэ сарын үед тохиолддог.",
     "Сарны хиртэлт Сар Дэлхийн сүүдэрт орох тэргэл сарын үед л тохиолдоно."),
    ("Сарны тойрог замын хавтгай Дэлхийн тойрог замын хавтгайтай бага өнцөг үүсгэдэг тул хиртэлт сар бүр болдоггүй.",
     "Нарны ба сарны хиртэлт сар бүр заавал тохиолддог.",
     "Сарны тойрог замын хавтгай ойролцоогоор 5°-аар хазайсан тул ихэнх сард Нар, Дэлхий, Сар нэг шулуун дээр байрладаггүй."),
    ("Сарны үе солигдох нь Нарны гэрэлтүүлсэн хагасыг нь Дэлхийгээс өөр өөр байрлалаас харж байгаатай холбоотой.",
     "Сарны үе солигдох нь Сар дээр Дэлхийн сүүдэр тусдагтай холбоотой.",
     "Сарны үе нь Нарны гэрэлтүүлсэн хагасыг өөр өнцгөөс харахаас болдог; Дэлхийн сүүдэр Сар дээр зөвхөн сарны хиртэлтийн үед тусна."),
    ("Шинэ сараас дараагийн шинэ сар хүртэл ойролцоогоор 29.5 хоног болно.",
     "Шинэ сараас дараагийн шинэ сар хүртэл ойролцоогоор 7 хоног болно.",
     "шинэ сараас дараагийн шинэ сар хүртэл ойролцоогоор 29.5 хоног болно."),
    ("Улирал солигдох нь Дэлхийн эргэлтийн тэнхлэг тойрог замын хавтгайн перпендикуляраас ойролцоогоор 23.5°-аар хазайсантай холбоотой.",
     "Улирал солигдох нь Дэлхий Нарнаас ойртож, холдсоноос болдог.",
     "Дэлхийн тойрог зам бараг дугуй; улирал нь тэнхлэгийн 23.5° хазайлтаас болж нарны туяа тусах өнцөг ба өдрийн урт өөрчлөгддөгөөс болно."),
    ("Өдөр шөнө ээлжлэх нь Дэлхий тэнхлэгээ тойрон эргэдгээс болдог.",
     "Өдөр шөнө ээлжлэх нь Дэлхий Нарыг тойрон эргэдгээс болдог.",
     "өдөр шөнө нь Дэлхийн тэнхлэгээ тойрох эргэлтээс болно; Нарыг тойрох эргэлт нэг жил үргэлжилнэ."),
    ("Дэлхий тэнхлэгээ тойрон ойролцоогоор 24 цагт нэг эргэнэ.",
     "Дэлхий тэнхлэгээ тойрон ойролцоогоор 365 хоногт нэг эргэнэ.",
     "тэнхлэгээ тойрох эргэлт ойролцоогоор 24 цаг; 365 хоног нь Нарыг тойрох үе."),
    ("Хөх өнгийн од улаан өнгийн одноос гадаргын температур өндөртэй.",
     "Улаан өнгийн од хөх өнгийн одноос гадаргын температур өндөртэй.",
     "гадаргын температур өндөр байх тусам одны цацаргалт богино долгион руу шилжинэ; хөх од улаан одноос халуун."),
    ("Сар өөрөө гэрэл цацаргадаггүй, Нарны гэрлийг ойлгодог.",
     "Сар өөрөө гэрэл цацаргадаг тэнгэрийн биет.",
     "Сар бол Нарны гэрлийг ойлгодог хүйтэн биет."),
    ("Хойд хагас бөмбөрцөгт зун байхад өмнөд хагас бөмбөрцөгт өвөл байна.",
     "Хойд ба өмнөд хагас бөмбөрцөгт зун нэгэн зэрэг болдог.",
     "тэнхлэг хазайсан тул нэг хагас бөмбөрцөг Нар руу хазайх үед нөгөө нь Нарнаас хазайж, улирал эсрэг байна."),
    ("Хаврын ба намрын тэгшитгэлийн өдрүүдэд өдөр шөнийн урт ойролцоогоор тэнцүү байна.",
     "Хаврын тэгшитгэлийн өдөр хойд хагас бөмбөрцөгт өдөр хамгийн урт байна.",
     "тэгшитгэлийн өдрүүдэд өдөр шөнө тэнцүү; хойд хагас бөмбөрцөгт өдөр хамгийн урт нь зуны туйлын өдөр (6-р сарын 22 орчим)."),
    ("Нар бол Дэлхийд хамгийн ойр орших од юм.",
     "Нар бол Нарны аймгийн хамгийн том гариг юм.",
     "Нар бол од; Нарны аймгийн хамгийн том гариг нь Бархасбадь."),
]


@lru_cache(maxsize=None)
def sky_versions() -> tuple:
    return tuple(statement_versions(2201, len(SKY_STATEMENTS)))


def n_sky(rng: random.Random, year: int, k: int) -> dict:
    chosen, truths, polarity = sky_versions()[k % len(sky_versions())]
    leads = [
        ("Одон орны үзэгдлүүдийн тухай дараах мэдэгдлүүдээс ЗӨВ-ийг сонго.",
         "Одон орны үзэгдлүүдийн тухай дараах мэдэгдлүүдээс БУРУУГ сонго."),
        ("Хиртэлт, сарны үе, улирал болон оддын тухай дараах мэдэгдлүүдийн аль нь ЗӨВ вэ?",
         "Хиртэлт, сарны үе, улирал болон оддын тухай дараах мэдэгдлүүдийн аль нь БУРУУ вэ?"),
    ][k % 2]
    prompt, answer, wrong, solution = statement_item(rng, SKY_STATEMENTS, chosen, truths, polarity, *leads)
    return {"skill": "Одон орны үзэгдэл", "prompt": prompt, "answer": answer, "wrong": wrong, "rank": False, "solution": solution}


# ---------------------------------------------------------------------------
# 23. o_pendulum — Дүүжингийн хэлбэлзэл
# ---------------------------------------------------------------------------

SWINGERS = ["Математик дүүжин", "Пүршин дүүжин", "Цагны дүүжин", "Савлуур"]
PENDULUM_LENGTHS = (F(4, 25), F(1, 4), F(9, 25), F(49, 100), F(16, 25), F(81, 100), F(1), F(121, 100), F(36, 25),
                    F(169, 100), F(49, 25), F(9, 4), F(64, 25), F(81, 25), F(4))
PLACES_G = [("Дэлхий дээр", F(10)), ("Сар дээр", F(8, 5))]


@lru_cache(maxsize=None)
def pendulum_versions() -> tuple:
    counts = [(count, t, ask) for count in (5, 10, 12, 15, 20, 25, 30, 40, 50, 60) for t in (4, 5, 6, 8, 10, 12, 15, 20, 30, 60)
              for ask in ("T", "nu") if clean(F(t, count), 2) and clean(F(count, t), 2)]
    precise = [(place, length) for place, (_, g) in enumerate(PLACES_G)
               for length in (F(1, 40), F(1, 10), F(2, 5), F(9, 10), F(8, 5), F(5, 2), F(18, 5), F(49, 10), F(2, 125), F(8, 125),
                              F(18, 125), F(32, 125), F(2, 5), F(8, 5))
               if root(length / g) is not None and clean(2 * PI * root(length / g), 3)]
    precise = distinct(precise, lambda item: item)
    springs = [(mass, stiff) for mass in (F(1, 10), F(1, 5), F(1, 4), F(2, 5), F(1, 2), F(4, 5), F(1), F(8, 5), F(2), F(5, 2), F(4))
               for stiff in (5, 10, 16, 20, 25, 40, 50, 80, 100, 160, 200, 250, 400, 500, 1000)
               if root(40 * mass / stiff) is not None and clean(root(40 * mass / stiff), 2)]
    changes = (F(4), F(9), F(16), F(1, 4), F(1, 9), F(1, 16))
    ratio_items = ([("length", f, F(1), ask) for f in changes for ask in ("T", "nu")]
                   + [("gravity", F(1), f, ask) for f in (F(4), F(9), F(16), F(1, 4), F(1, 9)) for ask in ("T", "nu")]
                   + [("both", f, g, "T") for f in changes for g in (F(4), F(9), F(1, 4)) if f != g and factor_text(root(f / g))]
                   + [("mass", f, F(1), ask) for f in (F(2), F(3), F(4), F(1, 2), F(1, 3)) for ask in ("T", "nu")]
                   + [("spring", f, g, ask) for f in changes + (F(1),) for g in changes + (F(1),) if (f, g) != (1, 1)
                      and root(f / g) is not None and factor_text(root(f / g)) and factor_text(1 / root(f / g)) for ask in ("T", "nu")])
    compare = [(n1, n2) for n1 in (5, 10, 12, 15, 20, 30) for n2 in (10, 15, 20, 24, 30, 40, 45, 60) if n2 > n1 and clean(F(n2 * n2, n1 * n1), 2)]
    return mix(
        2300,
        cycle(2301, "count", counts, len(SWINGERS)),
        shuffled(2302, [("math_T", 0, length) for length in PENDULUM_LENGTHS] + [("math_l", 0, length) for length in PENDULUM_LENGTHS]),
        [("precise", 0) + item for item in precise],
        shuffled(2303, [("spring_T", 0) + item for item in springs] + [("spring_k", 0) + item for item in springs]),
        [("ratio", 0) + item for item in ratio_items],
        [("compare", 0) + item for item in compare],
    )


def o_pendulum(rng: random.Random, year: int, k: int) -> dict:
    version = pendulum_versions()[k % len(pendulum_versions())]
    kind, s, data = version[0], version[1], version[2:]
    result = {"skill": "Дүүжингийн хэлбэлзэл"}
    if kind == "count":
        count, t, ask = data
        period, frequency = F(t, count), F(count, t)
        lead = f"{SWINGERS[s]} {t} с-д {count} бүтэн хэлбэлзэл хийв."
        if ask == "T":
            prompt = lead + " Хэлбэлзлийн үеийг ол."
            answer = qty(period, "с")
            wrong = numeric_wrongs(answer, "с", [frequency, t * count, period * 2])
            solution = f"T = t/N = {t}/{count} = {num(period)} с."
        else:
            prompt = lead + " Хэлбэлзлийн давтамжийг ол."
            answer = qty(frequency, "Гц")
            wrong = numeric_wrongs(answer, "Гц", [period, t * count, frequency * 2])
            solution = f"ν = N/t = {count}/{t} = {num(frequency)} Гц."
    elif kind in ("math_T", "math_l"):
        (length,) = data
        period = 2 * root(length)
        if kind == "math_T":
            prompt = f"{num(length)} м урттай математик дүүжингийн хэлбэлзлийн үеийг ол. (g = 10 м/с², π² ≈ 10)"
            answer = qty(period, "с")
            wrong = numeric_wrongs(answer, "с", [2 * length, root(length), 4 * length])
            solution = f"T = 2π√(l/g) = √(4π²l/g) = √(4·10·{num(length)}/10) = 2√{num(length)} = {num(period)} с."
        else:
            prompt = f"Хэлбэлзлийн үе нь {num(period)} с байх математик дүүжингийн уртыг ол. (g = 10 м/с², π² ≈ 10)"
            answer = qty(length, "м")
            wrong = numeric_wrongs(answer, "м", [period / 2, period * period, period * period / 2], 3)
            solution = f"T = 2π√(l/g) тул l = gT²/(4π²) = 10·{num(period)}²/40 = {num(length)} м."
    elif kind == "precise":
        place, length = data
        where, g = PLACES_G[place]
        period = 2 * PI * root(length / g)
        prompt = f"{num(length)} м урттай математик дүүжин {where} хэлбэлзэнэ (g = {num(g)} м/с²). Хэлбэлзлийн үеийг ол. (π ≈ 3.14)"
        answer = qty(period, "с")
        wrong = numeric_wrongs(answer, "с", [PI * root(length / g), 2 * PI * length / g, 2 * PI * approx(math.sqrt(float(g / length)))], 3)
        solution = f"T = 2π√(l/g) = 2·3.14·√({num(length)}/{num(g)}) = 6.28·{num(root(length / g))} = {num(period)} с."
    elif kind in ("spring_T", "spring_k"):
        mass, stiff = data
        period = root(40 * mass / stiff)
        mass_given = qty(mass * 1000, "г") if mass < 1 else qty(mass, "кг")
        if kind == "spring_T":
            prompt = f"{stiff} Н/м хатуулагтай пүршинд {mass_given} масстай ачаа өлгөж хэлбэлзүүлэв. Хэлбэлзлийн үеийг ол. (π² ≈ 10)"
            answer = qty(period, "с")
            wrong = numeric_wrongs(answer, "с", [approx(math.sqrt(float(40 * stiff / mass))) if stiff / mass <= 100 else period * 4,
                                                 40 * mass / stiff, period * 2])
            solution = f"T = 2π√(m/k) = √(4π²m/k) = √(40·{num(mass)}/{stiff}) = {num(period)} с."
        else:
            prompt = f"Пүршинд өлгөсөн {mass_given} масстай ачааны хэлбэлзлийн үе {num(period)} с бол пүршний хатуулгийг ол. (π² ≈ 10)"
            answer = qty(stiff, "Н/м")
            wrong = numeric_wrongs(answer, "Н/м", [40 * mass / period, 4 * mass / (period * period), stiff * 4])
            solution = f"T = 2π√(m/k) тул k = 4π²m/T² = 40·{num(mass)}/{num(period)}² = {stiff} Н/м."
    elif kind == "ratio":
        change, f, g, ask = data
        noun = "үе" if ask == "T" else "давтамж"
        if change == "length":
            factor = root(f)
            text = f"Математик дүүжингийн уртыг {scaled(f, True)} хэлбэлзлийн {noun} хэрхэн өөрчлөгдөх вэ?"
            law = "T = 2π√(l/g)"
        elif change == "gravity":
            factor = 1 / root(g)
            more = "их" if g > 1 else "бага"
            size = num(g) if g > 1 else num(1 / g)
            text = (
                f"Математик дүүжинг чөлөөт уналтын хурдатгал нь Дэлхийнхээс {size} дахин {more} гариг дээр аваачвал хэлбэлзлийн "
                f"{noun} хэрхэн өөрчлөгдөх вэ?"
            )
            law = "T = 2π√(l/g)"
        elif change == "both":
            factor = root(f / g)
            more = "их" if g > 1 else "бага"
            size = num(g) if g > 1 else num(1 / g)
            text = (
                f"Математик дүүжингийн уртыг {scaled(f)}, түүнийг чөлөөт уналтын хурдатгал нь Дэлхийнхээс {size} дахин {more} "
                f"гариг дээр аваачвал хэлбэлзлийн {noun} хэрхэн өөрчлөгдөх вэ?"
            )
            law = "T = 2π√(l/g)"
        elif change == "mass":
            factor = F(1)
            text = f"Математик дүүжингийн ачааны массыг {scaled(f, True)} хэлбэлзлийн {noun} хэрхэн өөрчлөгдөх вэ?"
            law = "T = 2π√(l/g) нь массаас хамаарахгүй"
        else:
            factor = root(f / g)
            if g == 1:
                text = f"Пүршин дүүжингийн ачааны массыг {scaled(f, True)} хэлбэлзлийн {noun} хэрхэн өөрчлөгдөх вэ?"
            elif f == 1:
                text = f"Пүршин дүүжингийн пүршний хатуулгийг {scaled(g, True)} хэлбэлзлийн {noun} хэрхэн өөрчлөгдөх вэ?"
            else:
                text = (
                    f"Пүршин дүүжингийн ачааны массыг {scaled(f)}, пүршний хатуулгийг {scaled(g, True)} хэлбэлзлийн {noun} "
                    "хэрхэн өөрчлөгдөх вэ?"
                )
            law = "T = 2π√(m/k)"
        value = factor if ask == "T" else 1 / factor
        answer, wrong = factor_options(value, [value * value, 1 / value, f if f != 1 else g])
        tail = "" if ask == "T" else " Давтамж ν = 1/T тул эсрэгээр өөрчлөгдөнө."
        return result | {
            "prompt": text, "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"{law}. Иймд T' = {ratio(factor)}·T.{tail} Хариу: {low(answer)}.",
        }
    else:
        n1, n2 = data
        value = F(n2 * n2, n1 * n1)
        prompt = (
            f"Ижил хугацаанд нэг математик дүүжин {n1}, нөгөө нь {n2} бүтэн хэлбэлзэл хийв. Эхний дүүжингийн урт хоёр дахь "
            "дүүжингийнхээс хэд дахин их вэ?"
        )
        answer = qty(value, "дахин")
        wrong = numeric_wrongs(answer, "дахин", [F(n2, n1), F(n1 * n1, n2 * n2) * 10, root(F(n2, n1)) if root(F(n2, n1)) else F(n2, n1) * 2])
        solution = f"T = t/N тул T1/T2 = N2/N1 = {n2}/{n1}. T ∝ √l тул l1/l2 = (T1/T2)² = ({num(F(n2, n1))})² = {num(value)}."
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 24. o_lc — Цахилгаан хэлбэлзлийн хүрээ
# ---------------------------------------------------------------------------

INDUCTANCES = (1, 2, 4, 5, 8, 10, 16, 20, 25, 40, 50, 80, 100, 160, 250, 400, 500)
CAPACITANCES = (F(1, 10), F(1, 5), F(2, 5), F(1, 2), F(1), F(8, 5), F(2), F(5, 2), F(4), F(5), F(10), F(16), F(20), F(25), F(40), F(50), F(100))


def time_text(seconds) -> tuple[str, str, Fraction]:
    seconds = F(seconds)
    if seconds >= F(1, 1000):
        return qty(seconds * 1000, "мс"), "мс", F(1000)
    return qty(seconds * 10 ** 6, "мкс"), "мкс", F(10 ** 6)


@lru_cache(maxsize=None)
def lc_versions() -> tuple:
    precise, rough = [], []
    for inductance in INDUCTANCES:
        for capacitance in CAPACITANCES:
            product = inductance * capacitance * F(1, 10 ** 9)
            exact_root = root(product)
            if exact_root is not None:
                period = 2 * PI * exact_root
                if clean(time_text(period)[2] * period, 3):
                    precise.append((inductance, capacitance))
            square = root(inductance * capacitance)
            if square is not None:
                period = 2 * square * F(1, 10 ** 4)
                if clean(time_text(period)[2] * period, 2):
                    rough.append((inductance, capacitance, "T"))
                    if clean(1 / period, 1):
                        rough.append((inductance, capacitance, "nu"))
    changes = (F(4), F(9), F(16), F(1, 4), F(1, 9), F(1, 16), F(2), F(1, 2), F(8), F(1, 8))
    ratio_items = [(fl, fc, ask) for fl in changes + (F(1),) for fc in changes + (F(1),) if (fl, fc) != (1, 1)
                   and root(fl * fc) is not None and factor_text(root(fl * fc)) and factor_text(1 / root(fl * fc)) for ask in ("T", "nu")]
    charges = [(q, c) for q in (2, 4, 5, 6, 8, 10, 12, 20, 30, 40) for c in (F(1, 2), F(1), F(2), F(4), F(5), F(8), F(10))
               if clean(F(q * q) / (2 * c), 2)]
    currents = [(inductance, current) for inductance in (2, 4, 5, 10, 20, 40, 50, 100, 200)
                for current in (F(1, 10), F(1, 5), F(1, 2), F(1), F(2), F(3), F(4), F(5)) if clean(inductance * current * current / 2, 2)]
    voltages = [(c, u) for c in (F(1, 2), F(1), F(2), F(4), F(5), F(10), F(20)) for u in (2, 4, 5, 6, 10, 12, 20, 50, 100)
                if clean(c * u * u / 2, 2)]
    energy_factors = [(what, f) for what in ("q", "I", "U") for f in (F(2), F(3), F(4), F(1, 2), F(1, 3))] + \
                     [("C", f) for f in (F(2), F(3), F(4), F(1, 2), F(1, 4))]
    return mix(
        2400,
        [("precise",) + item for item in precise],
        [("rough",) + item for item in rough],
        [("ratio",) + item for item in ratio_items],
        shuffled(2401, [("W_q",) + item for item in charges] + [("W_I",) + item for item in currents]
                 + [("W_U",) + item for item in voltages]),
        [("W_factor",) + item for item in energy_factors],
    )


def o_lc(rng: random.Random, year: int, k: int) -> dict:
    version = lc_versions()[k % len(lc_versions())]
    kind, data = version[0], version[1:]
    result = {"skill": "Цахилгаан хэлбэлзлийн хүрээ"}
    if kind in ("precise", "rough"):
        inductance, capacitance = data[0], data[1]
        lead = (
            f"Хэлбэлзлийн хүрээ {inductance} мГн индукцтэй ороомог ба {num(capacitance)} мкФ багтаамжтай конденсатораас тогтоно."
        )
        product = inductance * capacitance * F(1, 10 ** 9)
        if kind == "precise":
            period = 2 * PI * root(product)
            text, unit, scale = time_text(period)
            prompt = f"{lead} Хүрээний чөлөөт хэлбэлзлийн үеийг ол. (π ≈ 3.14)"
            answer = text
            wrong = numeric_wrongs(answer, unit, [PI * root(product) * scale, period * scale * 10,
                                                 2 * PI * approx(math.sqrt(float(inductance * capacitance))) * F(1, 10 ** 3) * scale / 10], 3)
            solution = (
                f"T = 2π√(LC) = 2·3.14·√({inductance}·10⁻³·{num(capacitance)}·10⁻⁶) = 6.28·{sci_text(root(product))} с = {answer}."
            )
        else:
            ask = data[2]
            period = 2 * root(inductance * capacitance) * F(1, 10 ** 4)
            text, unit, scale = time_text(period)
            if ask == "T":
                prompt = f"{lead} Хүрээний чөлөөт хэлбэлзлийн үеийг ол. (π² ≈ 10)"
                answer = text
                wrong = numeric_wrongs(answer, unit, [period * scale / 2, period * scale * 10, period * scale * period * scale], 3)
                solution = (
                    f"T = 2π√(LC) = √(4π²LC) = √(40·{inductance}·10⁻³·{num(capacitance)}·10⁻⁶) = {sci_text(period)} с = {answer}."
                )
            else:
                frequency = 1 / period
                prompt = f"{lead} Хүрээний чөлөөт хэлбэлзлийн давтамжийг ол. (π² ≈ 10)"
                if frequency >= 1000 and clean(frequency / 1000, 2):
                    answer, unit, scale_f = qty(frequency / 1000, "кГц"), "кГц", F(1, 1000)
                else:
                    answer, unit, scale_f = qty(frequency, "Гц"), "Гц", F(1)
                wrong = numeric_wrongs(answer, unit, [frequency * 2 * scale_f, frequency * 10 * scale_f, period * 10 ** 6 * scale_f], 2)
                solution = (
                    f"T = 2π√(LC) = √(40·{inductance}·10⁻³·{num(capacitance)}·10⁻⁶) = {sci_text(period)} с. "
                    f"ν = 1/T = {num(frequency)} Гц" + (f" = {answer}." if unit == "кГц" else ".")
                )
        return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    if kind == "ratio":
        fl, fc, ask = data
        factor = root(fl * fc)
        noun = "үе" if ask == "T" else "давтамж"
        if fc == 1:
            change = f"ороомгийн индукцийг {scaled(fl, True)}"
        elif fl == 1:
            change = f"конденсаторын багтаамжийг {scaled(fc, True)}"
        else:
            change = f"ороомгийн индукцийг {scaled(fl)}, конденсаторын багтаамжийг {scaled(fc, True)}"
        value = factor if ask == "T" else 1 / factor
        answer, wrong = factor_options(value, [fl * fc if ask == "T" else 1 / (fl * fc), 1 / value, value * value])
        tail = "" if ask == "T" else " ν = 1/T тул давтамж эсрэгээр өөрчлөгдөнө."
        return result | {
            "prompt": f"Хэлбэлзлийн хүрээний {change} чөлөөт хэлбэлзлийн {noun} хэрхэн өөрчлөгдөх вэ?",
            "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"T = 2π√(LC) тул T' = √({ratio(fl)}·{ratio(fc)})·T = {ratio(factor)}·T.{tail} Иймд {low(answer)}.",
        }
    if kind == "W_factor":
        what, f = data
        if what == "C":
            factor = 1 / f
            prompt = (
                f"Хэлбэлзлийн хүрээний конденсаторын цэнэгийн далайцыг тогтмол байлгаж багтаамжийг {scaled(f, True)} "
                "хүрээний бүрэн энерги хэрхэн өөрчлөгдөх вэ?"
            )
            law = "W = q²/(2C)"
        else:
            factor = f * f
            subject = {"q": "конденсаторын цэнэгийн далайцыг", "I": "ороомог дахь гүйдлийн хүчний далайцыг",
                       "U": "конденсаторын хүчдэлийн далайцыг"}[what]
            prompt = f"Хэлбэлзлийн хүрээний {subject} {scaled(f, True)} хүрээний бүрэн энерги хэрхэн өөрчлөгдөх вэ?"
            law = {"q": "W = q²/(2C)", "I": "W = LI²/2", "U": "W = CU²/2"}[what]
        answer, wrong = factor_options(factor, [f if what != "C" else f, 1 / factor, factor * f if what != "C" else 1 / (f * f)])
        return result | {
            "prompt": prompt, "answer": answer, "wrong": wrong, "rank": False,
            "solution": f"{law} тул W' = {ratio(factor)}·W: {low(answer)}.",
        }
    if kind == "W_q":
        q, c = data
        energy = F(q * q) / (2 * c)  # мкЖ
        prompt = f"Хэлбэлзлийн хүрээний {num(c)} мкФ багтаамжтай конденсаторын цэнэгийн далайц {q} мкКл. Хүрээний бүрэн энергийг ол."
        answer = qty(energy, "мкЖ")
        wrong = numeric_wrongs(answer, "мкЖ", [F(q * q) / c, F(q) / (2 * c), q * q * c / 2])
        solution = f"W = q²/(2C) = ({q}·10⁻⁶)²/(2·{num(c)}·10⁻⁶) Ж = {num(energy)}·10⁻⁶ Ж = {answer}."
    elif kind == "W_I":
        inductance, current = data
        energy = inductance * current * current / 2  # мЖ
        prompt = (
            f"Хэлбэлзлийн хүрээний ороомгийн индукц {inductance} мГн, гүйдлийн хүчний далайц {num(current)} А. "
            "Хүрээний бүрэн энергийг ол."
        )
        answer = qty(energy, "мЖ")
        wrong = numeric_wrongs(answer, "мЖ", [inductance * current * current, inductance * current / 2, energy * 1000], 3)
        solution = f"W = LI²/2 = {inductance}·10⁻³·{num(current)}²/2 Ж = {num(energy)}·10⁻³ Ж = {answer}."
    else:
        c, u = data
        energy = c * u * u / 2  # мкЖ
        prompt = (
            f"Хэлбэлзлийн хүрээний {num(c)} мкФ багтаамжтай конденсаторын хүчдэлийн далайц {u} В. Хүрээний бүрэн энергийг ол."
        )
        if energy >= 1000 and clean(energy / 1000, 2):
            answer, unit, scale = qty(energy / 1000, "мЖ"), "мЖ", F(1, 1000)
        else:
            answer, unit, scale = qty(energy, "мкЖ"), "мкЖ", F(1)
        wrong = numeric_wrongs(answer, unit, [c * u * u * scale, c * u / 2 * scale, c * c * u * u / 2 * scale if c != 1 else energy * 4 * scale])
        solution = f"W = CU²/2 = {num(c)}·10⁻⁶·{u}²/2 Ж = {num(energy)}·10⁻⁶ Ж = {answer}."
    return result | {"prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


TEMPLATES = {
    "m_units": m_units,
    "m_scale": m_scale,
    "k_accel": k_accel,
    "k_circle": k_circle,
    "k_throw": k_throw,
    "st_moment": st_moment,
    "st_hydraulic": st_hydraulic,
    "st_resultant": st_resultant,
    "d_newton2": d_newton2,
    "d_momentum": d_momentum,
    "d_forces": d_forces,
    "e_kinetic": e_kinetic,
    "e_work": e_work,
    "h_latent": h_latent,
    "h_transfer": h_transfer,
    "g_moles": g_moles,
    "g_first_law": g_first_law,
    "g_engine": g_engine,
    "g_state": g_state,
    "g_work": g_work,
    "n_kepler": n_kepler,
    "n_sky": n_sky,
    "o_pendulum": o_pendulum,
    "o_lc": o_lc,
}
