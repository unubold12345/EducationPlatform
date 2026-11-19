"""Part I templates for electricity, electronics, fields, waves, optics and atomic physics (ЭЕШ physics mocks).

Written 2026-11-20 for the per-year blueprints. Each template takes (rng, year, k) and returns the dict Paper.mc
expects; the version is `versions()[k % len(versions())]` and rng only picks or orders distractors. Every item is
original and its key is computed exactly (Fraction) from the data stated in the prompt.
"""
from __future__ import annotations

import itertools
from functools import lru_cache

from common import *  # noqa: F401,F403
from common import _number_unit  # noqa: F401

E_CHARGE = Fraction(16, 10) / 10 ** 19
H_PLANCK = Fraction(66, 10) / 10 ** 34
C_LIGHT = Fraction(3 * 10 ** 8)
HC_EV_NM = 1240


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def clean(value, decimals: int = 2) -> bool:
    """True when `value` is a decimal ending within `decimals` places."""
    return (Fraction(value) * 10 ** decimals).denominator == 1


def sci_clean(value) -> bool:
    try:
        sci_exact(Fraction(value), "value")
        return True
    except ValueError:
        return False


def sci_text(value) -> str:
    """m·10ⁿ with the mantissa rounded half up to two decimals (for distractors, which need not be exact)."""
    mantissa, exponent = scientific(Fraction(value))
    text = num(mantissa, 2)
    if text == "10":
        text, exponent = "1", exponent + 1
    return f"{text}·10{str(exponent).translate(SUPERSCRIPT)}"


def unit_text(value, unit: str, places_: int = 4) -> str:
    return f"{num(value, places_)} {unit}".strip()


def nw(answer: str, unit: str, candidates, places_: int = 2) -> list[str]:
    """numeric_wrongs without values that would print as 0."""
    keep = []
    for value in candidates:
        if value is None:
            continue
        value = Fraction(value)
        if value > 0 and num(value, places_) != "0":
            keep.append(value)
    texts = [text for text in numeric_wrongs(answer, unit, keep, places_) if _number_unit(text) and _number_unit(text)[0] > 0]
    if len(texts) < 4:
        raise ValueError(f"too few distractors for {answer!r}")
    return texts


def spread(key, candidates, render, rng: random.Random, factors=(2, 3, 4, 10), upper=None, offsets=()) -> list[str]:
    """Four distractors rendered by `render`, the key at a random rank, the template's own values first.

    For answers balance_rank cannot parse (scientific notation, degrees) or must not multiply (percent)."""
    key = Fraction(key)
    key_text = render(key)
    values = [Fraction(value) for value in candidates if value is not None]
    for factor in factors:
        values += [key * factor, key / factor]
    for offset in offsets:
        values += [key + Fraction(offset), key - Fraction(offset)]
    below, above, seen = [], [], {key_text}
    for value in values:
        if value <= 0 or (upper is not None and value >= upper):
            continue
        text = render(value)
        if text in seen:
            continue
        seen.add(text)
        (below if value < key else above).append(text)
    under = min(rng.randrange(5), len(below))
    if 4 - under > len(above):
        under = 4 - len(above)
    out = below[:under] + above[: 4 - under]
    if len(out) < 4:
        raise ValueError(f"too few distractors for {key_text!r}")
    return out


def factor_wrongs(factor: Fraction, candidates=()) -> list[str]:
    answer = factor_text(factor)
    out = []
    pool = list(candidates) + [1 / factor, factor * 2, factor / 2, factor * 4, factor / 4, factor * 3, factor / 3,
                               Fraction(1), factor * 9, factor / 9, factor * 8, factor / 8]
    for value in pool:
        if value is None or value == 0:
            continue
        text = factor_text(Fraction(value))
        if text and text != answer and text not in out:
            out.append(text)
    if len(out) < 4:
        raise ValueError(f"too few factor distractors for {answer!r}")
    return out[:4]


def text_item(skill: str, prompt: str, answer: str, pool, solution: str, rng: random.Random, figure=None) -> dict:
    data = {
        "skill": skill,
        "prompt": prompt,
        "answer": answer,
        "wrong": text_wrongs(answer, pool, rng),
        "solution": solution,
        "rank": False,
    }
    if figure:
        data["figure"] = figure
    return data


def grouped(groups: dict, seed: int, each) -> tuple:
    """Up to `each` (or each[kind]) shuffled versions of every kind, then shuffled together."""
    out = []
    for index, (kind, items) in enumerate(groups.items()):
        limit = each[kind] if isinstance(each, dict) else each
        out += shuffled(seed + 17 * index, items)[:limit]
    return tuple(shuffled(seed, out))


ROMAN = ("I", "II", "III")
COMBO_LABELS = {1: "Зөвхөн I", 2: "Зөвхөн II", 4: "Зөвхөн III", 3: "I ба II", 5: "I ба III", 6: "II ба III",
                7: "I, II ба III"}


def statement_sets(seed: int, true_pool, false_pool, count: int) -> tuple:
    """`count` distinct triples of statements, cycling through all seven true/false patterns, no topic twice.

    Pools hold (topic, statement, note); a false statement's note is the correct fact."""
    rng = random.Random(seed)
    out, seen, tries = [], set(), 0
    while len(out) < count:
        tries += 1
        if tries > 200_000:
            raise ValueError("statement pools too small")
        mask = len(out) % 7 + 1
        topics, chosen = set(), []
        for place in range(3):
            pool = true_pool if mask >> place & 1 else false_pool
            options = [item for item in pool if item[0] not in topics]
            if not options:
                break
            item = rng.choice(options)
            topics.add(item[0])
            chosen.append(item)
        if len(chosen) < 3:
            continue
        key = tuple(item[1] for item in chosen)
        if key in seen:
            continue
        seen.add(key)
        out.append(("statements", mask, tuple(chosen)))
    return tuple(out)


def statement_item(skill: str, stem: str, mask: int, chosen, rng: random.Random) -> dict:
    listing = " ".join(f"{label}. {item[1]}" for label, item in zip(ROMAN, chosen))
    answer = COMBO_LABELS[mask]
    wrong = rng.sample([label for value, label in COMBO_LABELS.items() if value != mask], 4)
    parts = []
    for place, (label, item) in enumerate(zip(ROMAN, chosen)):
        if mask >> place & 1:
            parts.append(f"{label} зөв.")
        else:
            parts.append(f"{label} буруу: {item[2]}.")
    return {
        "skill": skill,
        "prompt": f"{stem} {listing}",
        "answer": answer,
        "wrong": wrong,
        "rank": False,
        "solution": " ".join(parts) + f" Иймд {answer}.",
    }


def root2(value, unit: str) -> str:
    value = Fraction(value)
    return f"√2 {unit}" if value == 1 else f"{num(value)}√2 {unit}"


# ---------------------------------------------------------------------------
# 1. c_resistivity
# ---------------------------------------------------------------------------

SKILL_RESISTIVITY = "Цахилгаан эсэргүүцэл ба хувийн эсэргүүцэл"
RESISTIVITIES = [("зэс", "0.017"), ("хөнгөн цагаан", "0.028"), ("мөнгөн", "0.016"), ("вольфрам", "0.055"),
                 ("төмөр", "0.1"), ("никелин", "0.4"), ("манганин", "0.43"), ("константан", "0.5"), ("нихром", "1.1")]
WIRE_LENGTHS = ("0.5", "1", "2", "4", "5", "10", "20", "25", "50", "100", "200", "500")
WIRE_AREAS = ("0.1", "0.2", "0.25", "0.5", "0.8", "1", "1.5", "2", "2.5", "4")
LENGTH_CHANGES = [
    ("уртыг нь 2 дахин ихэсгэж", "уртыг нь 2 дахин ихэсгэвэл", Fraction(2)),
    ("уртыг нь 3 дахин ихэсгэж", "уртыг нь 3 дахин ихэсгэвэл", Fraction(3)),
    ("уртыг нь 4 дахин ихэсгэж", "уртыг нь 4 дахин ихэсгэвэл", Fraction(4)),
    ("уртыг нь 2 дахин багасгаж", "уртыг нь 2 дахин багасгавал", Fraction(1, 2)),
    ("уртыг нь 3 дахин багасгаж", "уртыг нь 3 дахин багасгавал", Fraction(1, 3)),
    (None, None, Fraction(1)),
]
AREA_CHANGES = [
    ("хөндлөн огтлолын талбайг нь 2 дахин ихэсгэвэл", Fraction(2), None),
    ("хөндлөн огтлолын талбайг нь 3 дахин ихэсгэвэл", Fraction(3), None),
    ("хөндлөн огтлолын талбайг нь 4 дахин ихэсгэвэл", Fraction(4), None),
    ("хөндлөн огтлолын талбайг нь 2 дахин багасгавал", Fraction(1, 2), None),
    ("хөндлөн огтлолын талбайг нь 3 дахин багасгавал", Fraction(1, 3), None),
    ("диаметрийг нь 2 дахин ихэсгэвэл", Fraction(4), Fraction(2)),
    ("диаметрийг нь 3 дахин ихэсгэвэл", Fraction(9), Fraction(3)),
    ("диаметрийг нь 2 дахин багасгавал", Fraction(1, 4), Fraction(1, 2)),
    ("радиусыг нь 2 дахин ихэсгэвэл", Fraction(4), Fraction(2)),
    ("радиусыг нь 3 дахин багасгавал", Fraction(1, 9), Fraction(1, 3)),
    (None, Fraction(1), None),
]


@lru_cache(maxsize=None)
def wire_table_sets() -> tuple:
    rng = random.Random(10_303)
    lengths = (1, 2, 3, 4, 5, 6, 8, 10, 12, 15)
    areas = tuple(given(a) for a in ("0.5", "1", "1.5", "2", "2.5", "3", "4", "5"))
    out, seen = [], set()
    while len(out) < 60:
        wires = tuple((rng.choice(lengths), rng.choice(areas)) for _ in range(5))
        values = [Fraction(length) / area for length, area in wires]
        if len(set(values)) < 5 or wires in seen:
            continue
        greatest = len(out) % 2 == 0
        best = values.index(max(values) if greatest else min(values))
        length, area = wires[best]
        if greatest and (length == max(w[0] for w in wires) or area == min(w[1] for w in wires)):
            continue
        if not greatest and (length == min(w[0] for w in wires) or area == max(w[1] for w in wires)):
            continue
        seen.add(wires)
        name = RESISTIVITIES[len(out) % len(RESISTIVITIES)][0]
        out.append(("table", name, greatest, wires, best + 1))
    return tuple(out)


@lru_cache(maxsize=None)
def resistivity_versions() -> tuple:
    groups = {"R": [], "L": [], "S": [], "scale": [], "special": [], "table": list(wire_table_sets())}
    for name, rho in RESISTIVITIES:
        for length in WIRE_LENGTHS:
            for area in WIRE_AREAS:
                resistance = given(rho) * given(length) / given(area)
                if clean(resistance) and Fraction(1, 10) <= resistance <= 1000:
                    for asked in ("R", "L", "S"):
                        groups[asked].append((asked, name, rho, length, area, resistance))
    index = 0
    for (l_join, l_cond, l_factor), (a_cond, a_factor, linear) in itertools.product(LENGTH_CHANGES, AREA_CHANGES):
        if l_factor == 1 and a_factor == 1:
            continue
        if factor_text(l_factor / a_factor) is None:
            continue
        name = RESISTIVITIES[index % len(RESISTIVITIES)][0]
        index += 1
        groups["scale"].append(("scale", name, l_join, l_cond, l_factor, a_cond, a_factor, linear))
    for n in (2, 3):
        for name, _ in RESISTIVITIES[:4]:
            groups["special"].append(("stretch", name, n))
    for n in (2, 3, 4):
        for name, _ in RESISTIVITIES[4:7]:
            groups["special"].append(("cut", name, n))
    return grouped(groups, 1001, {"R": 45, "L": 20, "S": 20, "scale": 80, "special": 30, "table": 40})


NUMBER_WORDS = {2: "хоёр", 3: "гурван", 4: "дөрвөн", 5: "таван", 6: "зургаан"}


def c_resistivity(rng: random.Random, year: int, k: int) -> dict:
    version = resistivity_versions()[k % len(resistivity_versions())]
    kind = version[0]
    skill = SKILL_RESISTIVITY
    if kind in ("R", "L", "S"):
        _, name, rho, length, area, resistance = version
        rho_v, length_v, area_v = given(rho), given(length), given(area)
        tail = f" Хувийн эсэргүүцэл ρ = {rho} Ом·мм²/м."
        if kind == "R":
            prompt = f"{length} м урттай, {area} мм² хөндлөн огтлолын талбайтай {name} утасны эсэргүүцлийг ол." + tail
            answer = unit_text(resistance, "Ом")
            wrong = nw(answer, "Ом", [rho_v * length_v, rho_v * length_v * area_v, resistance * 10, resistance / 10,
                                      resistance * 4])
            solution = f"R = ρL/S = {rho}·{length}/{area} = {num(resistance)} Ом."
        elif kind == "L":
            prompt = (f"{area} мм² хөндлөн огтлолын талбайтай {name} утасны эсэргүүцэл {num(resistance)} Ом байв. "
                      "Утасны уртыг ол." + tail)
            answer = unit_text(length_v, "м")
            wrong = nw(answer, "м", [resistance * rho_v / area_v, resistance / (rho_v * area_v), length_v * 10, length_v / 10])
            solution = f"R = ρL/S тул L = RS/ρ = {num(resistance)}·{area}/{rho} = {length} м."
        else:
            prompt = (f"{length} м урттай {name} утасны эсэргүүцэл {num(resistance)} Ом бол утасны хөндлөн огтлолын "
                      "талбайг ол." + tail)
            answer = unit_text(area_v, "мм²")
            wrong = nw(answer, "мм²", [resistance * length_v / rho_v / 1000, resistance / (rho_v * length_v),
                                        rho_v * resistance / length_v, area_v * 10, area_v / 10, area_v * 4])
            solution = f"R = ρL/S тул S = ρL/R = {rho}·{length}/{num(resistance)} = {area} мм²."
        return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    if kind == "scale":
        _, name, l_join, l_cond, l_factor, a_cond, a_factor, linear = version
        if l_factor == 1:
            change = f"уртыг нь өөрчлөлгүй {a_cond}"
        elif a_factor == 1:
            change = f"хөндлөн огтлолыг нь өөрчлөлгүй {l_cond}"
        else:
            change = f"{l_join}, {a_cond}"
        factor = l_factor / a_factor
        answer = factor_text(factor)
        candidates = [l_factor * a_factor, l_factor / linear if linear else None, l_factor, 1 / a_factor]
        solution = (
            f"R = ρL/S. Урт {ratio(l_factor)} дахин, хөндлөн огтлолын талбай {ratio(a_factor)} дахин үржигдэнэ"
            + (" (S = πd²/4 тул диаметр эсвэл радиус n дахин өөрчлөгдөхөд талбай n² дахин өөрчлөгдөнө)" if linear else "")
            + f". R' = R·({ratio(l_factor)})/({ratio(a_factor)}) = {ratio(factor)}·R: {answer.lower()}."
        )
        return {
            "skill": skill,
            "prompt": f"{name.capitalize()} утасны {change} эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?",
            "answer": answer,
            "wrong": factor_wrongs(factor, candidates),
            "rank": False,
            "solution": solution,
        }
    if kind == "stretch":
        _, name, n = version
        factor = Fraction(n * n)
        answer = factor_text(factor)
        return {
            "skill": skill,
            "prompt": (f"{name.capitalize()} утсыг сунгаж уртыг нь {n} дахин ихэсгэв. Утасны эзлэхүүн өөрчлөгдөөгүй бол "
                       "эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?"),
            "answer": answer,
            "wrong": factor_wrongs(factor, [Fraction(n), Fraction(1), Fraction(1, n)]),
            "rank": False,
            "solution": (f"Эзлэхүүн V = LS тогтмол тул урт {n} дахин ихсэхэд талбай {n} дахин багасна. "
                         f"R = ρL/S нь {n}·{n} = {n * n} дахин ихэснэ."),
        }
    if kind == "cut":
        _, name, n = version
        factor = Fraction(1, n * n)
        answer = factor_text(factor)
        return {
            "skill": skill,
            "prompt": (f"{name.capitalize()} утсыг тэнцүү {n} хэсэгт хувааж, хэсгүүдийг нь хооронд нь параллель холбов. "
                       "Ерөнхий эсэргүүцэл анхны утасныхаас хэрхэн өөрчлөгдөх вэ?"),
            "answer": answer,
            "wrong": factor_wrongs(factor, [Fraction(1, n), Fraction(n), Fraction(1)]),
            "rank": False,
            "solution": (f"Хэсэг бүрийн эсэргүүцэл R/{n}. Ижил {n} эсэргүүцлийг параллель холбоход ерөнхий эсэргүүцэл "
                         f"(R/{n})/{n} = R/{n * n}: {answer.lower()}."),
        }
    _, name, greatest, wires, best = version
    word = "их" if greatest else "бага"
    return {
        "skill": skill,
        "prompt": (f"Таван {name} утасны урт L ба хөндлөн огтлолын талбай S-ийг хүснэгтэд үзүүлэв. "
                   f"Аль утасны эсэргүүцэл хамгийн {word} вэ?"),
        "answer": f"{best}-р утас",
        "wrong": [f"{index}-р утас" for index in range(1, 6) if index != best],
        "rank": False,
        "solution": (
            "Ижил металлын утасны хувьд R = ρL/S нь L/S-тэй пропорциональ: "
            + "; ".join(f"{index}) {length}/{num(area)} ≈ {num(Fraction(length) / area, 2)}"
                        for index, (length, area) in enumerate(wires, start=1))
            + f". Хамгийн {word} нь {best}-р утас."
        ),
        "figure": {
            "kind": "table",
            "columns": ["Утас", "L, м", "S, мм²"],
            "rows": [[str(index), str(length), num(area)] for index, (length, area) in enumerate(wires, start=1)],
        },
    }


# ---------------------------------------------------------------------------
# 2. c_power
# ---------------------------------------------------------------------------

SKILL_POWER = "Цахилгаан гүйдлийн ажил ба чадал"
TIMES = [("10 с", 10), ("20 с", 20), ("30 с", 30), ("40 с", 40), ("50 с", 50), ("1 мин", 60), ("2 мин", 120),
         ("5 мин", 300), ("10 мин", 600)]
DEVICES = [
    (220, "цахилгаан данх", ("5", "8", "10")), (220, "индүү", ("4", "5")), (220, "үс хатаагч", ("4", "5", "8")),
    (220, "тоос сорогч", ("4", "5", "8")), (220, "цахилгаан халаагуур", ("2", "5", "10")),
    (220, "богино долгионы зуух", ("4", "5")), (220, "хөргөгч", ("0.5", "1")), (220, "зурагт", ("0.5", "1")),
    (12, "автомашины гэрэл", ("2", "4", "5")), (12, "автомашины дуут дохио", ("1.5", "2", "3")),
    (24, "ачааны машины чийдэн", ("2", "3", "4")), (36, "гагнуурын төмөр", ("1", "1.5", "2")),
    (110, "цахилгаан сэнс", ("0.2", "0.4", "0.5")), (6, "тоглоомын хөдөлгүүр", ("0.2", "0.25", "0.5")),
    (9, "зөөврийн радио", ("0.1", "0.2")),
]
KWH_DEVICES = [(40, "чийдэн"), (60, "чийдэн"), (75, "зурагт"), (100, "зурагт"), (150, "компьютер"),
               (200, "хөргөгч"), (500, "индүү"), (800, "угаалгын машин"), (1000, "цахилгаан халаагуур"),
               (1200, "богино долгионы зуух"), (1500, "усны халаагуур"), (2000, "цахилгаан халаагуур")]


@lru_cache(maxsize=None)
def power_versions() -> tuple:
    groups = {name: [] for name in ("charge", "electrons", "current_n", "p_ui", "i_ui", "p_i2r", "i_i2r", "r_i2r",
                                    "p_u2r", "joule", "kwh")}
    currents = tuple(given(x) for x in ("0.2", "0.4", "0.5", "0.8", "1.2", "1.5", "2", "2.5", "3", "4", "5"))
    for current in currents:
        for text, seconds in TIMES:
            groups["charge"].append(("charge", current, text, seconds))
        for seconds in (1, 2, 4, 5, 8, 10, 16, 20, 40):
            count = current * seconds / E_CHARGE
            if sci_clean(count):
                groups["electrons"].append(("electrons", current, seconds, count))
                groups["current_n"].append(("current_n", current, seconds, count))
    for voltage, device, amps in DEVICES:
        for amp in amps:
            groups["p_ui"].append(("p_ui", voltage, device, given(amp)))
            groups["i_ui"].append(("i_ui", voltage, device, given(amp)))
    for current in tuple(given(x) for x in ("0.5", "1", "1.5", "2", "2.5", "3", "4", "5")):
        for resistance in (2, 4, 5, 6, 8, 10, 12, 20, 40, 50, 100):
            power = current * current * resistance
            if clean(power) and power <= 2000:
                for kind in ("p_i2r", "i_i2r", "r_i2r"):
                    groups[kind].append((kind, current, resistance, power))
    for voltage in (6, 12, 24, 36, 110, 220):
        for resistance in (2, 3, 4, 6, 8, 9, 10, 12, 16, 18, 20, 24, 36, 40, 44, 48, 55, 72, 100, 110, 121, 220, 484):
            power = Fraction(voltage * voltage, resistance)
            if clean(power) and 1 <= power <= 3000:
                groups["p_u2r"].append(("p_u2r", voltage, resistance, power))
    for current in tuple(given(x) for x in ("0.5", "1", "2", "3", "4", "5")):
        for resistance in (2, 5, 10, 20, 40, 50, 100):
            for text, seconds in TIMES:
                heat = current * current * resistance * seconds
                if clean(heat) and heat <= 2_000_000:
                    groups["joule"].append(("joule", current, resistance, text, seconds, heat))
    for watts, device in KWH_DEVICES:
        for hours in (2, 3, 4, 5, 6, 8):
            for days in (7, 10, 30):
                energy = Fraction(watts * hours * days, 1000)
                if clean(energy):
                    groups["kwh"].append(("kwh", watts, device, hours, days, energy))
    return grouped(groups, 2002, 20)


def c_power(rng: random.Random, year: int, k: int) -> dict:
    version = power_versions()[k % len(power_versions())]
    kind = version[0]
    if kind == "charge":
        _, current, text, seconds = version
        charge = current * seconds
        minutes = Fraction(seconds, 60) if text.endswith("мин") else None
        prompt = (f"Дамжуулагчаар {num(current)} А гүйдэл {text} гүйхэд түүний хөндлөн огтлолоор хэдэн кулон цэнэг "
                  "өнгөрөх вэ?")
        answer = unit_text(charge, "Кл")
        wrong = nw(answer, "Кл", [current * minutes if minutes else None, Fraction(seconds) / current, charge * 10,
                                  charge / 10])
        solution = f"q = It = {num(current)}·{seconds} = {num(charge)} Кл" + (f" ({text} = {seconds} с)." if minutes else ".")
    elif kind == "electrons":
        _, current, seconds, count = version
        prompt = (f"Дамжуулагчаар {num(current)} А гүйдэл {seconds} с гүйхэд түүний хөндлөн огтлолоор хэдэн электрон "
                  "өнгөрөх вэ? e = 1.6·10⁻¹⁹ Кл.")
        answer = sci_exact(count, "N")
        wrong = spread(count, [count * 10, count / 10, count * seconds, count / seconds], sci_text, rng, factors=(2, 4, 100))
        solution = f"q = It = {num(current)}·{seconds} = {num(current * seconds)} Кл; N = q/e = {num(current * seconds)}/(1.6·10⁻¹⁹) = {answer}."
    elif kind == "current_n":
        _, current, seconds, count = version
        prompt = (f"Дамжуулагчийн хөндлөн огтлолоор {seconds} с-д {sci_exact(count, 'N')} электрон өнгөрөв. "
                  "Гүйдлийн хүчийг ол. e = 1.6·10⁻¹⁹ Кл.")
        answer = unit_text(current, "А")
        wrong = nw(answer, "А", [current * seconds, current * 10, current / 10, current * 4])
        solution = f"q = Ne = {sci_exact(count, 'N')}·1.6·10⁻¹⁹ = {num(current * seconds)} Кл; I = q/t = {num(current * seconds)}/{seconds} = {num(current)} А."
    elif kind == "p_ui":
        _, voltage, device, current = version
        power = voltage * current
        prompt = f"Хүчдэл нь {voltage} В, гүйдэл нь {num(current)} А байх үед {device} ямар чадалтай ажиллах вэ?"
        answer = unit_text(power, "Вт")
        wrong = nw(answer, "Вт", [Fraction(voltage) / current, power * current, Fraction(voltage), power * 10, power / 10])
        solution = f"P = UI = {voltage}·{num(current)} = {num(power)} Вт."
    elif kind == "i_ui":
        _, voltage, device, current = version
        power = voltage * current
        prompt = f"{num(power)} Вт чадалтай {device} {voltage} В хүчдэлд хэвийн ажиллаж байна. Түүгээр гүйх гүйдлийг ол."
        answer = unit_text(current, "А")
        wrong = nw(answer, "А", [Fraction(voltage) / power, current * 10, current / 10, current * 4])
        solution = f"P = UI тул I = P/U = {num(power)}/{voltage} = {num(current)} А."
    elif kind == "p_i2r":
        _, current, resistance, power = version
        prompt = f"{resistance} Ом эсэргүүцэлтэй резистороор {num(current)} А гүйдэл гүйж байна. Резисторт ялгарах чадлыг ол."
        answer = unit_text(power, "Вт")
        wrong = nw(answer, "Вт", [current * resistance, resistance / current, power / current * 2, power * 2])
        solution = f"P = I²R = {num(current)}²·{resistance} = {num(power)} Вт."
    elif kind == "i_i2r":
        _, current, resistance, power = version
        prompt = f"{resistance} Ом эсэргүүцэлтэй резисторт {num(power)} Вт чадал ялгарч байна. Резистороор гүйх гүйдлийг ол."
        answer = unit_text(current, "А")
        wrong = nw(answer, "А", [power / resistance, power * resistance / 100, current * current, current * 2, current / 2])
        solution = f"P = I²R тул I = √(P/R) = √({num(power)}/{resistance}) = {num(current)} А."
    elif kind == "r_i2r":
        _, current, resistance, power = version
        prompt = f"Резистороор {num(current)} А гүйдэл гүйхэд {num(power)} Вт чадал ялгарав. Резисторын эсэргүүцлийг ол."
        answer = unit_text(resistance, "Ом")
        wrong = nw(answer, "Ом", [power / current, power * current, resistance * current, resistance * 2, resistance / 2])
        solution = f"P = I²R тул R = P/I² = {num(power)}/{num(current)}² = {resistance} Ом."
    elif kind == "p_u2r":
        _, voltage, resistance, power = version
        prompt = f"{resistance} Ом эсэргүүцэлтэй халаагуурыг {voltage} В хүчдэлд залгав. Халаагуурын чадлыг ол."
        answer = unit_text(power, "Вт")
        wrong = nw(answer, "Вт", [Fraction(voltage, resistance), Fraction(voltage * resistance), power * 2, power / 2,
                                  Fraction(voltage * voltage, resistance * resistance)])
        solution = f"P = U²/R = {voltage}²/{resistance} = {num(power)} Вт."
    elif kind == "joule":
        _, current, resistance, text, seconds, heat = version
        kilo = heat >= 10_000
        unit, value = ("кЖ", heat / 1000) if kilo else ("Ж", heat)
        scale = Fraction(1, 1000) if kilo else Fraction(1)
        minutes = Fraction(seconds, 60) if text.endswith("мин") else None
        prompt = (f"{resistance} Ом эсэргүүцэлтэй дамжуулагчаар {num(current)} А гүйдэл {text} гүйхэд ялгарах дулааны "
                  "хэмжээг ол.")
        answer = unit_text(value, unit)
        wrong = nw(answer, unit, [current * resistance * seconds * scale, heat / seconds * scale * 10,
                                  heat / 60 * scale if minutes else None, value * 2, value / 2])
        solution = (f"Жоуль-Ленцийн хууль: Q = I²Rt = {num(current)}²·{resistance}·{seconds} = {num(heat)} Ж"
                    + (f" = {num(value)} кЖ." if kilo else "."))
    else:
        _, watts, device, hours, days, energy = version
        prompt = (f"{watts} Вт чадалтай {device} өдөрт {hours} цаг ажиллавал {days} хоногт хэдэн кВт·ц цахилгаан "
                  "энерги зарцуулах вэ?")
        answer = unit_text(energy, "кВт·ц")
        wrong = nw(answer, "кВт·ц", [Fraction(watts * hours, 1000), energy * 24 / hours, energy / 10, energy * 10,
                                      Fraction(watts * days, 1000)])
        solution = f"W = Pt = {num(Fraction(watts, 1000))} кВт·{hours} ц·{days} = {num(energy)} кВт·ц."
    return {"skill": SKILL_POWER, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 3. c_transformer
# ---------------------------------------------------------------------------

SKILL_TRANSFORMER = "Хувьсах гүйдэл ба трансформатор"
TURNS = (50, 100, 120, 200, 250, 300, 400, 500, 600, 800, 1000, 1100, 1200, 1500, 2000, 2200, 3000, 4000, 5000,
         6000, 10000)


@lru_cache(maxsize=None)
def transformer_versions() -> tuple:
    groups = {name: [] for name in ("u2", "n2", "i1", "i2", "step", "rms_u", "rms_i", "peak", "eq_u", "eq_f", "eq_t",
                                    "eq_p")}
    for u1 in (12, 36, 110, 127, 220, 380, 6000, 10000):
        for n1, n2 in itertools.permutations(TURNS, 2):
            u2 = Fraction(u1 * n2, n1)
            nice = n2 % n1 == 0 or n1 % n2 == 0
            if nice and clean(u2) and 1 <= u2 <= 110_000:
                groups["u2"].append(("u2", u1, n1, n2, u2))
                groups["n2"].append(("n2", u1, n1, n2, u2))
    for n1, n2 in itertools.permutations(TURNS, 2):
        if not (n2 % n1 == 0 or n1 % n2 == 0):
            continue
        for current in tuple(given(x) for x in ("0.1", "0.2", "0.5", "1", "2", "2.5", "4", "5", "10")):
            other = current * n2 / n1
            if clean(other) and Fraction(1, 10) <= other <= 200:
                groups["i1"].append(("i1", n1, n2, current, other))
            other = current * n1 / n2
            if clean(other) and Fraction(1, 10) <= other <= 200:
                groups["i2"].append(("i2", n1, n2, current, other))
        ratio_value = Fraction(max(n1, n2), min(n1, n2))
        if ratio_value in (2, 3, 4, 5, 10, 20, 50):
            groups["step"].append(("step", n1, n2, int(ratio_value)))
    voltages = (5, 6, 10, 12, 20, 24, 36, 50, 100, 110, 127, 200, 220, 380)
    for voltage in voltages:
        groups["rms_u"].append(("rms_u", voltage))
        groups["peak"].append(("peak", voltage))
        for omega in (50, 100, 200, 400, 1000):
            groups["eq_u"].append(("eq_u", voltage, omega))
            groups["eq_f"].append(("eq_f", voltage, omega))
            groups["eq_t"].append(("eq_t", voltage, omega))
    for current in tuple(given(x) for x in ("0.5", "1", "1.5", "2", "3", "4", "5", "10")):
        groups["rms_i"].append(("rms_i", current))
        for resistance in (2, 5, 10, 20, 50, 100):
            for omega in (100, 200):
                power = current * current * resistance
                if clean(power):
                    groups["eq_p"].append(("eq_p", current, resistance, omega, power))
    return grouped(groups, 3003, {"u2": 30, "n2": 25, "i1": 20, "i2": 20, "step": 30, "rms_u": 12, "rms_i": 8,
                                  "peak": 12, "eq_u": 12, "eq_f": 12, "eq_t": 10, "eq_p": 15})


def transformer_lead(n1, n2) -> str:
    return f"Идеал трансформаторын анхдагч ороомгийн ороодосын тоо N1 = {n1}, хоёрдогч ороомгийнх N2 = {n2}."


def c_transformer(rng: random.Random, year: int, k: int) -> dict:
    version = transformer_versions()[k % len(transformer_versions())]
    kind = version[0]
    skill = SKILL_TRANSFORMER
    if kind == "u2":
        _, u1, n1, n2, u2 = version
        prompt = transformer_lead(n1, n2) + f" Анхдагч ороомогт {u1} В хувьсах хүчдэл өгөхөд хоёрдогч ороомгийн хүчдэлийг ол."
        answer = unit_text(u2, "В")
        wrong = nw(answer, "В", [Fraction(u1 * n1, n2), u2 * 10, u2 / 10, Fraction(u1)])
        solution = f"U2/U1 = N2/N1 тул U2 = U1·N2/N1 = {u1}·{n2}/{n1} = {num(u2)} В."
    elif kind == "n2":
        _, u1, n1, n2, u2 = version
        verb = "өсгөнө" if n2 > n1 else "бууруулна"
        prompt = (f"Идеал трансформатор {u1} В хүчдэлийг {num(u2)} В болгон {verb}. Анхдагч ороомог {n1} ороодостой бол "
                  "хоёрдогч ороомог хэдэн ороодостой вэ?")
        answer = str(n2)
        wrong = nw(answer, "", [Fraction(n1 * n1, n2), Fraction(n2 * 10), Fraction(n2, 10), Fraction(n1)])
        solution = f"N2/N1 = U2/U1 тул N2 = N1·U2/U1 = {n1}·{num(u2)}/{u1} = {n2}."
    elif kind == "i1":
        _, n1, n2, current, other = version
        prompt = transformer_lead(n1, n2) + f" Хоёрдогч ороомгоор {num(current)} А гүйдэл гүйж байвал анхдагч ороомгийн гүйдлийг ол."
        answer = unit_text(other, "А")
        wrong = nw(answer, "А", [current * n1 / n2, other * 10, other / 10, current])
        solution = f"Идеал трансформаторт I1/I2 = N2/N1 тул I1 = I2·N2/N1 = {num(current)}·{n2}/{n1} = {num(other)} А."
    elif kind == "i2":
        _, n1, n2, current, other = version
        prompt = transformer_lead(n1, n2) + f" Анхдагч ороомгоор {num(current)} А гүйдэл гүйж байвал хоёрдогч ороомгийн гүйдлийг ол."
        answer = unit_text(other, "А")
        wrong = nw(answer, "А", [current * n2 / n1, other * 10, other / 10, current])
        solution = f"I2/I1 = N1/N2 тул I2 = I1·N1/N2 = {num(current)}·{n1}/{n2} = {num(other)} А."
    elif kind == "step":
        _, n1, n2, m = version
        up = f"Хүчдэлийг {m} дахин өсгөж, гүйдлийг {m} дахин бууруулна"
        down = f"Хүчдэлийг {m} дахин бууруулж, гүйдлийг {m} дахин өсгөнө"
        answer = up if n2 > n1 else down
        pool = [down if n2 > n1 else up,
                f"Хүчдэл ба гүйдлийг хоёуланг нь {m} дахин өсгөнө",
                f"Хүчдэл ба гүйдлийг хоёуланг нь {m} дахин бууруулна",
                f"Хүчдэлийг {m} дахин {'өсгөж' if n2 > n1 else 'бууруулж'}, гүйдлийг өөрчлөхгүй",
                f"Хүчдэлийг {m * m} дахин {'өсгөж' if n2 > n1 else 'бууруулж'}, гүйдлийг {m * m} дахин {'бууруулна' if n2 > n1 else 'өсгөнө'}"]
        return text_item(
            skill,
            f"Идеал трансформаторын анхдагч ороомог {n1}, хоёрдогч ороомог {n2} ороодостой. Энэ трансформатор хүчдэл ба "
            "гүйдлийг хэрхэн өөрчлөх вэ?",
            answer, pool,
            f"U2/U1 = N2/N1 = {ratio(Fraction(n2, n1))}, I2/I1 = N1/N2 = {ratio(Fraction(n1, n2))}. "
            f"{'Өсгөгч' if n2 > n1 else 'Бууруулагч'} трансформатор: {answer.lower()} (чадал UI хадгалагдана).",
            rng,
        )
    elif kind == "rms_u":
        _, voltage = version
        prompt = f"Хувьсах хүчдэлийн далайц (хамгийн их утга) Um = {root2(voltage, 'В')}. Хүчдэлийн үйлчлэх утгыг ол."
        answer = unit_text(voltage, "В")
        wrong = [root2(voltage, "В"), unit_text(2 * voltage, "В"), root2(Fraction(voltage, 2), "В"), unit_text(Fraction(voltage, 2), "В")]
        solution = f"U = Um/√2 = {root2(voltage, 'В')}/√2 = {voltage} В."
    elif kind == "rms_i":
        _, current = version
        prompt = f"Хувьсах гүйдлийн далайц Im = {root2(current, 'А')}. Гүйдлийн үйлчлэх утгыг ол."
        answer = unit_text(current, "А")
        wrong = [root2(current, "А"), unit_text(2 * current, "А"), root2(current / 2, "А"), unit_text(current / 2, "А")]
        solution = f"I = Im/√2 = {root2(current, 'А')}/√2 = {num(current)} А."
    elif kind == "peak":
        _, voltage = version
        prompt = f"Хувьсах хүчдэлийн үйлчлэх утга {voltage} В бол түүний далайцыг (хамгийн их утгыг) ол."
        answer = root2(voltage, "В")
        wrong = [unit_text(voltage, "В"), unit_text(2 * voltage, "В"), root2(Fraction(voltage, 2), "В"), root2(2 * voltage, "В")]
        solution = f"Um = √2·U = {answer}."
    elif kind in ("eq_u", "eq_f", "eq_t"):
        _, voltage, omega = version
        equation = f"u = {root2(voltage, '').strip()}·sin({omega}πt) В"
        frequency, period = Fraction(omega, 2), Fraction(2, omega)
        if kind == "eq_u":
            prompt = f"Хувьсах хүчдэл {equation} тэгшитгэлээр өөрчлөгдөнө. Хүчдэлийн үйлчлэх утгыг ол."
            answer = unit_text(voltage, "В")
            wrong = [root2(voltage, "В"), unit_text(2 * voltage, "В"), root2(Fraction(voltage, 2), "В"), unit_text(Fraction(voltage, 2), "В")]
            solution = f"Um = {root2(voltage, 'В')}; U = Um/√2 = {voltage} В."
        elif kind == "eq_f":
            prompt = f"Хувьсах хүчдэл {equation} тэгшитгэлээр өөрчлөгдөнө. Хүчдэлийн давтамжийг ол."
            answer = unit_text(frequency, "Гц")
            wrong = nw(answer, "Гц", [Fraction(omega), Fraction(omega * 314, 100), frequency / 2, frequency * 2])
            solution = f"ω = {omega}π рад/с = 2πf тул f = ω/(2π) = {num(frequency)} Гц."
        else:
            prompt = f"Хувьсах хүчдэл {equation} тэгшитгэлээр өөрчлөгдөнө. Хэлбэлзлийн үеийг ол."
            answer = unit_text(period, "с")
            wrong = nw(answer, "с", [Fraction(1, omega), period * 2, period / 2, Fraction(1, 2 * omega)], 4)
            solution = f"ω = {omega}π рад/с; T = 2π/ω = 2/{omega} = {num(period)} с."
    else:
        _, current, resistance, omega, power = version
        prompt = (f"{resistance} Ом эсэргүүцэлтэй резистороор i = {root2(current, '').strip()}·sin({omega}πt) А хувьсах "
                  "гүйдэл гүйж байна. Резисторт ялгарах дундаж чадлыг ол.")
        answer = unit_text(power, "Вт")
        wrong = nw(answer, "Вт", [power * 2, current * resistance, power / 2, power * 4])
        solution = f"Үйлчлэх гүйдэл I = Im/√2 = {num(current)} А; P = I²R = {num(current)}²·{resistance} = {num(power)} Вт."
    return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 4. c_series_cap
# ---------------------------------------------------------------------------

SKILL_CAPS = "Конденсаторын холболт"
CAPS = (1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 30, 36, 40, 60)
SAME_CAPS = [
    ("{n} ширхэг ижил конденсаторыг цуваа холбов.", None),
    ("ижил гурван конденсаторын хоёрыг нь параллель холбож, гурав дахийг нь тэдгээртэй цуваа холбов.", Fraction(2, 3)),
    ("ижил гурван конденсаторын хоёрыг нь цуваа холбож, гурав дахийг нь тэдгээртэй параллель холбов.", Fraction(3, 2)),
    ("ижил дөрвөн конденсаторыг хоёр хоёроор нь цуваа холбож, үүссэн хоёр салбарыг параллель холбов.", Fraction(1)),
    ("ижил дөрвөн конденсаторын гурвыг нь параллель холбож, дөрөв дэхийг нь тэдгээртэй цуваа холбов.", Fraction(3, 4)),
    ("ижил дөрвөн конденсаторын гурвыг нь цуваа холбож, дөрөв дэхийг нь тэдгээртэй параллель холбов.", Fraction(4, 3)),
]
PLATE_D = [("ялтсуудын хоорондох зайг 2 дахин ихэсгэж", Fraction(2)), ("ялтсуудын хоорондох зайг 3 дахин ихэсгэж", Fraction(3)),
           ("ялтсуудын хоорондох зайг 2 дахин багасгаж", Fraction(1, 2)), ("ялтсуудын хоорондох зайг 4 дахин багасгаж", Fraction(1, 4)),
           (None, Fraction(1))]
PLATE_OTHER = [("ялтсуудын талбайг 2 дахин ихэсгэвэл", Fraction(2)), ("ялтсуудын талбайг 3 дахин ихэсгэвэл", Fraction(3)),
               ("ялтсуудын талбайг 2 дахин багасгавал", Fraction(1, 2)),
               ("ялтсуудын хоорондох агаарыг ε = 2 диэлектрикээр дүүргэвэл", Fraction(2)),
               ("ялтсуудын хоорондох агаарыг ε = 4 диэлектрикээр дүүргэвэл", Fraction(4)),
               ("ялтсуудын хоорондох агаарыг ε = 6 диэлектрикээр дүүргэвэл", Fraction(6)),
               ("ялтсуудын хоорондох ε = 3 диэлектрикийг гаргаж, агаараар сольвол", Fraction(1, 3)),
               (None, Fraction(1))]


@lru_cache(maxsize=None)
def capacitor_series_versions() -> tuple:
    groups = {name: [] for name in ("series", "charge", "volt", "series3", "mixed_a", "mixed_b", "same", "plate", "change")}
    for c1, c2 in itertools.combinations(CAPS, 2):
        total = Fraction(c1 * c2, c1 + c2)
        if clean(total):
            groups["series"].append(("series", c1, c2, total))
            for voltage in (6, 10, 12, 20, 24, 50, 100):
                charge = total * voltage
                if clean(charge):
                    groups["charge"].append(("charge", c1, c2, voltage, charge))
                    groups["volt"].append(("volt", c1, c2, voltage, charge))
    for c1, c2, c3 in itertools.combinations(CAPS, 3):
        total = 1 / (Fraction(1, c1) + Fraction(1, c2) + Fraction(1, c3))
        if clean(total):
            groups["series3"].append(("series3", c1, c2, c3, total))
    for c1, c2 in itertools.combinations_with_replacement(CAPS[:12], 2):
        for c3 in CAPS:
            total = Fraction((c1 + c2) * c3, c1 + c2 + c3)
            if clean(total) and total.denominator != 1 or (total.denominator == 1 and c3 != c1 + c2):
                if clean(total):
                    groups["mixed_a"].append(("mixed_a", c1, c2, c3, total))
            total = Fraction(c1 * c2, c1 + c2) + c3
            if clean(total) and c1 != c2:
                groups["mixed_b"].append(("mixed_b", c1, c2, c3, total))
    for template, factor in SAME_CAPS:
        for cap in (2, 3, 4, 6, 8, 9, 12, 15, 18, 20, 24, 30):
            if factor is None:
                for n in (2, 3, 4, 5, 6):
                    if clean(Fraction(cap, n)):
                        groups["same"].append(("same", template.replace("{n}", NUMBER_WORDS[n]), Fraction(1, n), cap))
            elif clean(factor * cap):
                groups["same"].append(("same", template, factor, cap))
    for eps in (1, 2, 4, 6, 7):
        for area in (20, 40, 50, 80, 100, 200, 400, 500):
            for gap in ("0.5", "1", "2", "4", "5"):
                value = Fraction(885, 1000) * eps * area / given(gap)
                if clean(value) and 5 <= value <= 1000:
                    groups["plate"].append(("plate", eps, area, gap, value))
    for (d_text, d_factor), (o_text, o_factor) in itertools.product(PLATE_D, PLATE_OTHER):
        if d_factor == 1 and o_factor == 1:
            continue
        factor = o_factor / d_factor
        if factor_text(factor):
            groups["change"].append(("change", d_text, d_factor, o_text, o_factor))
    return grouped(groups, 4004, {"series": 30, "charge": 20, "volt": 15, "series3": 15, "mixed_a": 25, "mixed_b": 25,
                                  "same": 20, "plate": 20, "change": 30})


def c_series_cap(rng: random.Random, year: int, k: int) -> dict:
    version = capacitor_series_versions()[k % len(capacitor_series_versions())]
    kind = version[0]
    if kind == "series":
        _, c1, c2, total = version
        prompt = f"{c1} мкФ ба {c2} мкФ багтаамжтай хоёр конденсаторыг цуваа холбов. Ерөнхий багтаамжийг ол."
        answer = unit_text(total, "мкФ")
        wrong = nw(answer, "мкФ", [Fraction(c1 + c2), Fraction(c1 + c2, 2), Fraction(c1 * c2), Fraction(c1 + c2, c1 * c2)])
        solution = f"Цуваа холболтод 1/C = 1/C1 + 1/C2 тул C = C1C2/(C1 + C2) = {c1}·{c2}/({c1}+{c2}) = {num(total)} мкФ."
    elif kind == "charge":
        _, c1, c2, voltage, charge = version
        total = Fraction(c1 * c2, c1 + c2)
        prompt = (f"{c1} мкФ ба {c2} мкФ багтаамжтай хоёр конденсаторыг цуваа холбож, {voltage} В хүчдэлд залгав. "
                  "Конденсатор бүрийн цэнэгийг ол.")
        answer = unit_text(charge, "мкКл")
        wrong = nw(answer, "мкКл", [Fraction(c1 * voltage), Fraction(c2 * voltage), Fraction((c1 + c2) * voltage), charge / 2])
        solution = (f"C = C1C2/(C1 + C2) = {num(total)} мкФ. Цуваа холболтод конденсатор бүрийн цэнэг ижил: "
                    f"Q = CU = {num(total)}·{voltage} = {num(charge)} мкКл.")
    elif kind == "volt":
        _, c1, c2, voltage, charge = version
        u1 = charge / c1
        prompt = (f"{c1} мкФ ба {c2} мкФ багтаамжтай хоёр конденсаторыг цуваа холбож, {voltage} В хүчдэлд залгав. "
                  f"{c1} мкФ конденсаторын хүчдэлийг ол.")
        answer = unit_text(u1, "В")
        wrong = nw(answer, "В", [voltage - u1, Fraction(voltage, 2), Fraction(voltage), u1 / 2])
        solution = (f"Q = CU = {c1}·{c2}/({c1}+{c2})·{voltage} = {num(charge)} мкКл; U1 = Q/C1 = {num(charge)}/{c1} = "
                    f"{num(u1)} В (бага багтаамжтай конденсатор их хүчдэлтэй).")
    elif kind == "series3":
        _, c1, c2, c3, total = version
        prompt = f"{c1} мкФ, {c2} мкФ ба {c3} мкФ багтаамжтай гурван конденсаторыг цуваа холбов. Ерөнхий багтаамжийг ол."
        answer = unit_text(total, "мкФ")
        wrong = nw(answer, "мкФ", [Fraction(c1 + c2 + c3), Fraction(c1 + c2 + c3, 3), Fraction(c1 * c2, c1 + c2),
                                    Fraction(c1)])
        solution = f"1/C = 1/{c1} + 1/{c2} + 1/{c3} = {ratio(1 / total)} тул C = {num(total)} мкФ."
    elif kind == "mixed_a":
        _, c1, c2, c3, total = version
        prompt = (f"C1 = {c1} мкФ ба C2 = {c2} мкФ конденсаторуудыг параллель холбож, тэдгээрийг C3 = {c3} мкФ "
                  "конденсатортой цуваа холбов. Ерөнхий багтаамжийг ол.")
        answer = unit_text(total, "мкФ")
        wrong = nw(answer, "мкФ", [Fraction(c1 + c2 + c3), Fraction(c1 * c2, c1 + c2) + c3, Fraction(c1 + c2),
                                    1 / (Fraction(1, c1) + Fraction(1, c2) + Fraction(1, c3))])
        solution = (f"C12 = C1 + C2 = {c1 + c2} мкФ; C = C12·C3/(C12 + C3) = {c1 + c2}·{c3}/({c1 + c2}+{c3}) = "
                    f"{num(total)} мкФ.")
    elif kind == "mixed_b":
        _, c1, c2, c3, total = version
        series = Fraction(c1 * c2, c1 + c2)
        prompt = (f"C1 = {c1} мкФ ба C2 = {c2} мкФ конденсаторуудыг цуваа холбож, тэдгээртэй C3 = {c3} мкФ "
                  "конденсаторыг параллель холбов. Ерөнхий багтаамжийг ол.")
        answer = unit_text(total, "мкФ")
        wrong = nw(answer, "мкФ", [Fraction(c1 + c2 + c3), Fraction((c1 + c2) * c3, c1 + c2 + c3), series,
                                    Fraction(c1 + c2) + c3 / 2])
        solution = f"C12 = C1C2/(C1 + C2) = {c1}·{c2}/({c1}+{c2}) = {num(series)} мкФ; C = C12 + C3 = {num(total)} мкФ."
    elif kind == "same":
        _, template, factor, cap = version
        total = factor * cap
        prompt = f"Багтаамж нь тус бүр {cap} мкФ {template} Ерөнхий багтаамжийг ол."
        answer = unit_text(total, "мкФ")
        wrong = nw(answer, "мкФ", [Fraction(cap) / factor, Fraction(cap), total * 3, total / 3])
        solution = f"Цуваа хэсэгт 1/C = Σ1/Ci, параллель хэсэгт C = ΣCi. Тооцоолоход C = {ratio(factor)}·{cap} = {num(total)} мкФ."
    elif kind == "plate":
        _, eps, area, gap, value = version
        medium = "агаар (ε = 1)" if eps == 1 else f"ε = {eps} диэлектрик"
        prompt = (f"Хавтгай конденсаторын ялтас бүрийн талбай {area} см², ялтсуудын хоорондох зай {gap} мм, ялтсуудын "
                  f"хооронд {medium} байна. Конденсаторын багтаамжийг ол. ε0 = 8.85·10⁻¹² Ф/м.")
        answer = unit_text(value, "пФ")
        wrong = nw(answer, "пФ", [value * 10, value / 10, value * 100, value / eps if eps > 1 else value * 1000])
        solution = (f"C = εε0S/d = {eps}·8.85·10⁻¹²·{area}·10⁻⁴/({gap}·10⁻³) Ф = {num(value)}·10⁻¹² Ф = {num(value)} пФ.")
    else:
        _, d_text, d_factor, o_text, o_factor = version
        if d_factor == 1:
            change = o_text
        elif o_factor == 1:
            change = d_text[:-1] + ("вэл" if d_text.endswith("ихэсгэж") else "вал")
        else:
            change = f"{d_text}, {o_text}"
        factor = o_factor / d_factor
        answer = factor_text(factor)
        return {
            "skill": SKILL_CAPS,
            "prompt": f"Хавтгай конденсаторын {change} багтаамж нь хэрхэн өөрчлөгдөх вэ?",
            "answer": answer,
            "wrong": factor_wrongs(factor, [o_factor * d_factor, 1 / factor, d_factor]),
            "rank": False,
            "solution": (f"C = εε0S/d. S эсвэл ε {ratio(o_factor)} дахин, d {ratio(d_factor)} дахин үржигдэнэ: "
                         f"C' = C·({ratio(o_factor)})/({ratio(d_factor)}) = {ratio(factor)}·C. {answer}."),
        }
    return {"skill": SKILL_CAPS, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 5. c_emf
# ---------------------------------------------------------------------------

SKILL_EMF = "Бүрэн хэлхээний Омын хууль"


@lru_cache(maxsize=None)
def emf_versions() -> tuple:
    groups = {name: [] for name in ("current", "terminal", "short", "r_from_i", "r_from_u", "emf", "two_emf", "two_r")}
    emfs = tuple(given(x) for x in ("1.5", "3", "4.5", "6", "9", "12", "24"))
    internals = tuple(given(x) for x in ("0.5", "1", "1.5", "2", "3"))
    loads = tuple(given(x) for x in ("1", "1.5", "2", "2.5", "3", "4", "5", "5.5", "7", "8", "10", "11", "14", "20"))
    for emf in emfs:
        for internal in internals:
            short = emf / internal
            if clean(short):
                groups["short"].append(("short", emf, internal, short))
            for load in loads:
                current = emf / (load + internal)
                if not clean(current):
                    continue
                terminal = current * load
                groups["current"].append(("current", emf, internal, load, current))
                groups["r_from_i"].append(("r_from_i", emf, internal, load, current))
                if clean(terminal):
                    groups["terminal"].append(("terminal", emf, internal, load, current, terminal))
                    groups["r_from_u"].append(("r_from_u", emf, internal, load, current, terminal))
                    groups["emf"].append(("emf", emf, internal, load, current, terminal))
            for load1, load2 in itertools.combinations(loads, 2):
                i1, i2 = emf / (load1 + internal), emf / (load2 + internal)
                if clean(i1) and clean(i2):
                    groups["two_emf"].append(("two_emf", emf, internal, load1, i1, load2, i2))
                    groups["two_r"].append(("two_r", emf, internal, load1, i1, load2, i2))
    return grouped(groups, 5005, {"current": 35, "terminal": 30, "short": 15, "r_from_i": 25, "r_from_u": 20,
                                  "emf": 20, "two_emf": 15, "two_r": 15})


def c_emf(rng: random.Random, year: int, k: int) -> dict:
    version = emf_versions()[k % len(emf_versions())]
    kind = version[0]
    if kind == "current":
        _, emf, internal, load, current = version
        prompt = (f"ЦХХ нь {num(emf)} В, дотоод эсэргүүцэл нь {num(internal)} Ом эх үүсвэрт {num(load)} Ом "
                  "эсэргүүцэлтэй резистор холбов. Хэлхээний гүйдлийг ол.")
        answer = unit_text(current, "А")
        wrong = nw(answer, "А", [emf / load, emf / internal, emf / (load - internal) if load > internal else None, current * 2])
        solution = f"I = ε/(R + r) = {num(emf)}/({num(load)} + {num(internal)}) = {num(current)} А."
    elif kind == "terminal":
        _, emf, internal, load, current, terminal = version
        prompt = (f"ЦХХ нь {num(emf)} В, дотоод эсэргүүцэл нь {num(internal)} Ом эх үүсвэрт {num(load)} Ом "
                  "эсэргүүцэлтэй резистор холбов. Эх үүсвэрийн туйлууд дээрх хүчдэлийг ол.")
        answer = unit_text(terminal, "В")
        wrong = nw(answer, "В", [current * internal, emf, emf + current * internal, terminal / 2])
        solution = (f"I = ε/(R + r) = {num(emf)}/({num(load)} + {num(internal)}) = {num(current)} А; "
                    f"U = ε − Ir = {num(emf)} − {num(current)}·{num(internal)} = {num(terminal)} В.")
    elif kind == "short":
        _, emf, internal, short = version
        prompt = f"ЦХХ нь {num(emf)} В, дотоод эсэргүүцэл нь {num(internal)} Ом эх үүсвэрийн богино холболтын гүйдлийг ол."
        answer = unit_text(short, "А")
        wrong = nw(answer, "А", [emf * internal, internal / emf, short / 2, short * 2])
        solution = f"Богино холболтод R = 0 тул I = ε/r = {num(emf)}/{num(internal)} = {num(short)} А."
    elif kind == "r_from_i":
        _, emf, internal, load, current = version
        prompt = (f"ЦХХ нь {num(emf)} В эх үүсвэрт {num(load)} Ом эсэргүүцэлтэй резистор холбоход хэлхээгээр "
                  f"{num(current)} А гүйдэл гүйв. Эх үүсвэрийн дотоод эсэргүүцлийг ол.")
        answer = unit_text(internal, "Ом")
        wrong = nw(answer, "Ом", [emf / current, emf / current + load, load - internal if load > internal else None,
                                  internal * 2, internal * 3])
        solution = f"I = ε/(R + r) тул r = ε/I − R = {num(emf)}/{num(current)} − {num(load)} = {num(internal)} Ом."
    elif kind == "r_from_u":
        _, emf, internal, load, current, terminal = version
        prompt = (f"Эх үүсвэрийн туйлуудад холбосон вольтметр гадаад хэлхээ задгай үед {num(emf)} В, {num(load)} Ом "
                  f"резистор холбоход {num(terminal)} В заав. Эх үүсвэрийн дотоод эсэргүүцлийг ол.")
        answer = unit_text(internal, "Ом")
        wrong = nw(answer, "Ом", [(emf - terminal) / load, load * terminal / emf, emf / current, internal * 2])
        solution = (f"Задгай үед U = ε = {num(emf)} В. Ачаалалтай үед I = U/R = {num(terminal)}/{num(load)} = "
                    f"{num(current)} А; r = (ε − U)/I = ({num(emf)} − {num(terminal)})/{num(current)} = {num(internal)} Ом.")
    elif kind == "emf":
        _, emf, internal, load, current, terminal = version
        prompt = (f"Дотоод эсэргүүцэл нь {num(internal)} Ом эх үүсвэрийн туйлууд дээрх хүчдэл {num(terminal)} В, "
                  f"хэлхээний гүйдэл {num(current)} А байв. Эх үүсвэрийн ЦХХ-ийг ол.")
        answer = unit_text(emf, "В")
        wrong = nw(answer, "В", [terminal - current * internal if terminal > current * internal else None, terminal,
                                 current * internal, terminal + internal])
        solution = f"ε = U + Ir = {num(terminal)} + {num(current)}·{num(internal)} = {num(emf)} В."
    else:
        _, emf, internal, load1, i1, load2, i2 = version
        lead = (f"Эх үүсвэрт {num(load1)} Ом резистор холбоход хэлхээгээр {num(i1)} А, {num(load2)} Ом резистор "
                f"холбоход {num(i2)} А гүйдэл гүйв.")
        work = (f"ε = I1(R1 + r) = I2(R2 + r) тул r = (I1R1 − I2R2)/(I2 − I1) = ({num(i1)}·{num(load1)} − "
                f"{num(i2)}·{num(load2)})/({num(i2)} − {num(i1)}) = {num(internal)} Ом")
        if kind == "two_emf":
            prompt = lead + " Эх үүсвэрийн ЦХХ-ийг ол."
            answer = unit_text(emf, "В")
            wrong = nw(answer, "В", [i1 * load1, i2 * load2, (i1 + i2) * (load1 + load2) / 2, emf * 2])
            solution = work + f"; ε = I1(R1 + r) = {num(i1)}·({num(load1)} + {num(internal)}) = {num(emf)} В."
        else:
            prompt = lead + " Эх үүсвэрийн дотоод эсэргүүцлийг ол."
            answer = unit_text(internal, "Ом")
            wrong = nw(answer, "Ом", [load2 - load1, (load2 - load1) / 2, internal * 2, internal * 3, internal / 2])
            solution = work + "."
    return {"skill": SKILL_EMF, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 6. c_combo
# ---------------------------------------------------------------------------

SKILL_COMBO = "Хэлхээний ерөнхий эсэргүүцэл"
RESISTORS = (1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60)
SAME_RESISTORS = [
    ("{n} ижил резисторыг параллель холбов.", None),
    ("гурван ижил резисторын хоёрыг нь параллель холбож, гурав дахийг нь тэдгээртэй цуваа холбов.", Fraction(3, 2)),
    ("гурван ижил резисторын хоёрыг нь цуваа холбож, гурав дахийг нь тэдгээртэй параллель холбов.", Fraction(2, 3)),
    ("дөрвөн ижил резисторыг хоёр хоёроор нь цуваа холбож, үүссэн хоёр салбарыг параллель холбов.", Fraction(1)),
    ("дөрвөн ижил резисторыг хоёр хоёроор нь параллель холбож, үүссэн хоёр хэсгийг цуваа холбов.", Fraction(1)),
    ("дөрвөн ижил резисторын гурвыг нь параллель холбож, дөрөв дэхийг нь тэдгээртэй цуваа холбов.", Fraction(4, 3)),
    ("дөрвөн ижил резисторын гурвыг нь цуваа холбож, дөрөв дэхийг нь тэдгээртэй параллель холбов.", Fraction(3, 4)),
]


@lru_cache(maxsize=None)
def combo_versions() -> tuple:
    groups = {name: [] for name in ("series", "parallel", "mixed_a", "mixed_b", "same", "count", "from_series")}
    for a, b, c in itertools.combinations(RESISTORS, 3):
        if a + b + c <= 60:
            groups["series"].append(("series", a, b, c, Fraction(a + b + c)))
    for a, b, c in itertools.combinations_with_replacement(RESISTORS, 3):
        if a == b == c:
            continue
        total = 1 / (Fraction(1, a) + Fraction(1, b) + Fraction(1, c))
        if clean(total):
            groups["parallel"].append(("parallel", a, b, c, total))
    for r1 in RESISTORS:
        for r2, r3 in itertools.combinations_with_replacement(RESISTORS, 2):
            total = r1 + Fraction(r2 * r3, r2 + r3)
            if clean(total):
                groups["mixed_a"].append(("mixed_a", r1, r2, r3, total))
            total = Fraction((r1 + r2) * r3, r1 + r2 + r3)
            if clean(total) and r1 <= r2:
                groups["mixed_b"].append(("mixed_b", r1, r2, r3, total))
    for template, factor in SAME_RESISTORS:
        for resistance in (2, 3, 4, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 60):
            if factor is None:
                for n in (2, 3, 4, 5, 6):
                    if clean(Fraction(resistance, n)):
                        groups["same"].append(("same", template.replace("{n}", NUMBER_WORDS[n]), Fraction(1, n), resistance))
            elif clean(factor * resistance):
                groups["same"].append(("same", template, factor, resistance))
    for resistance in (10, 12, 20, 24, 30, 36, 40, 60, 100, 120):
        for n in (2, 3, 4, 5, 6, 8, 10):
            if resistance % n == 0:
                groups["count"].append(("count", resistance, n))
            series = resistance * n
            if clean(Fraction(series, n * n)) and n <= 6:
                groups["from_series"].append(("from_series", series, n))
    return grouped(groups, 6006, {"series": 12, "parallel": 35, "mixed_a": 40, "mixed_b": 35, "same": 30, "count": 15,
                                  "from_series": 15})


def c_combo(rng: random.Random, year: int, k: int) -> dict:
    version = combo_versions()[k % len(combo_versions())]
    kind = version[0]
    figure = None
    if kind == "series":
        _, a, b, c, total = version
        prompt = f"R1 = {a} Ом, R2 = {b} Ом ба R3 = {c} Ом гурван резисторыг цуваа холбов. Ерөнхий эсэргүүцлийг ол."
        answer = unit_text(total, "Ом")
        wrong = nw(answer, "Ом", [1 / (Fraction(1, a) + Fraction(1, b) + Fraction(1, c)), Fraction(a + b + c, 3),
                                  Fraction(a + b), Fraction(b + c)])
        solution = f"Цуваа холболтод R = R1 + R2 + R3 = {a} + {b} + {c} = {num(total)} Ом."
    elif kind == "parallel":
        _, a, b, c, total = version
        prompt = f"R1 = {a} Ом, R2 = {b} Ом ба R3 = {c} Ом гурван резисторыг параллель холбов. Ерөнхий эсэргүүцлийг ол."
        answer = unit_text(total, "Ом")
        wrong = nw(answer, "Ом", [Fraction(a + b + c), Fraction(a + b + c, 3), Fraction(a * b, a + b), Fraction(1, 1) / total])
        solution = f"1/R = 1/{a} + 1/{b} + 1/{c} = {ratio(1 / total)} Ом⁻¹ тул R = {num(total)} Ом."
    elif kind == "mixed_a":
        _, r1, r2, r3, total = version
        parallel = Fraction(r2 * r3, r2 + r3)
        prompt = (f"Зурагт үзүүлсэн хэлхээнд R1 = {r1} Ом резистор нь хоорондоо параллель холбогдсон R2 = {r2} Ом ба "
                  f"R3 = {r3} Ом резисторуудтай цуваа холбогдсон. Гадаад хэлхээний ерөнхий эсэргүүцлийг ол.")
        answer = unit_text(total, "Ом")
        wrong = nw(answer, "Ом", [Fraction(r1 + r2 + r3), parallel, Fraction((r1 + r2) * r3, r1 + r2 + r3),
                                  r1 + Fraction(r2 + r3, 2)])
        solution = (f"R23 = R2R3/(R2 + R3) = {r2}·{r3}/({r2}+{r3}) = {num(parallel)} Ом; R = R1 + R23 = {r1} + "
                    f"{num(parallel)} = {num(total)} Ом.")
        figure = {"kind": "resistor_network", "r1": r1, "r2": r2, "r3": r3}
    elif kind == "mixed_b":
        _, r1, r2, r3, total = version
        prompt = (f"R1 = {r1} Ом ба R2 = {r2} Ом резисторуудыг цуваа холбож, тэдгээртэй R3 = {r3} Ом резисторыг "
                  "параллель холбов. Ерөнхий эсэргүүцлийг ол.")
        answer = unit_text(total, "Ом")
        wrong = nw(answer, "Ом", [Fraction(r1 + r2 + r3), r1 + Fraction(r2 * r3, r2 + r3), Fraction(r1 + r2),
                                  1 / (Fraction(1, r1) + Fraction(1, r2) + Fraction(1, r3))])
        solution = (f"R12 = R1 + R2 = {r1 + r2} Ом; R = R12·R3/(R12 + R3) = {r1 + r2}·{r3}/({r1 + r2}+{r3}) = "
                    f"{num(total)} Ом.")
    elif kind == "same":
        _, template, factor, resistance = version
        total = factor * resistance
        prompt = f"Эсэргүүцэл нь тус бүр {resistance} Ом {template} Ерөнхий эсэргүүцлийг ол."
        answer = unit_text(total, "Ом")
        wrong = nw(answer, "Ом", [Fraction(resistance) / factor, Fraction(resistance), total * 3, total / 3])
        solution = f"Цуваа хэсэгт R = ΣRi, параллель хэсэгт 1/R = Σ1/Ri. Тооцоолоход R = {ratio(factor)}·{resistance} = {num(total)} Ом."
    elif kind == "count":
        _, resistance, n = version
        target = Fraction(resistance, n)
        prompt = (f"Эсэргүүцэл нь тус бүр {resistance} Ом ижил резисторуудыг параллель холбож {num(target)} Ом ерөнхий "
                  "эсэргүүцэл гаргахын тулд хэдэн резистор шаардлагатай вэ?")
        answer = str(n)
        wrong = [str(value) for value in dict.fromkeys([n * n, n + 1, n - 1, 2 * n, n + 2, n + 3, 3 * n, n + 4]) if value not in (n, 0)][:4]
        return {
            "skill": SKILL_COMBO,
            "prompt": prompt,
            "answer": answer,
            "wrong": wrong,
            "rank": False,
            "solution": f"n ижил резисторыг параллель холбоход R = R1/n тул n = R1/R = {resistance}/{num(target)} = {n}.",
        }
    else:
        _, series, n = version
        total = Fraction(series, n * n)
        prompt = (f"{NUMBER_WORDS[n].capitalize()} ижил резисторыг цуваа холбоход ерөнхий эсэргүүцэл {series} Ом байв. "
                  "Тэдгээрийг параллель холбовол ерөнхий эсэргүүцэл хэд болох вэ?")
        answer = unit_text(total, "Ом")
        wrong = nw(answer, "Ом", [Fraction(series, n), Fraction(series * n), total * 2, total / 2])
        solution = f"Нэг резистор R1 = {series}/{n} = {num(Fraction(series, n))} Ом; параллель холбоход R = R1/{n} = {num(total)} Ом."
    data = {"skill": SKILL_COMBO, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    if figure:
        data["figure"] = figure
    return data


# ---------------------------------------------------------------------------
# 7. c_media
# ---------------------------------------------------------------------------

SKILL_MEDIA = "Янз бүрийн орчин дахь цахилгаан гүйдэл"
CARRIERS = {
    "metal": "Чөлөөт электронууд",
    "electrolyte": "Эерэг ба сөрөг ионууд",
    "gas": "Электронууд болон эерэг, сөрөг ионууд",
    "semi": "Электронууд ба нүхнүүд",
    "vacuum": "Катодоос ялгарсан электронууд",
}
CARRIER_EXTRA = ["Зөвхөн эерэг ионууд", "Протонууд", "Зөвхөн нүхнүүд", "Зөвхөн сөрөг ионууд"]
MEDIA_CONTEXTS = [
    ("metal", "Зэс утсаар"), ("metal", "Хөнгөн цагаан утсаар"), ("metal", "Төмөр утсаар"),
    ("metal", "Гэрлийн чийдэнгийн вольфрам утсаар"), ("metal", "Мөнгөн утсаар"), ("metal", "Халаагуурын нихром спиралиар"),
    ("electrolyte", "Зэсийн купоросын усан уусмалаар"), ("electrolyte", "Хоолны давсны усан уусмалаар"),
    ("electrolyte", "Аккумуляторын хүхрийн хүчлийн уусмалаар"), ("electrolyte", "Хайлсан хоолны давсаар"),
    ("electrolyte", "Мөнгөний нитратын уусмалаар"),
    ("gas", "Неон чийдэнгийн хийгээр"), ("gas", "Аянга цахилгаан буух үед агаараар"),
    ("gas", "Гагнуурын цахилгаан нумаар"), ("gas", "Өдрийн гэрлийн чийдэнгийн мөнгөн усны уураар"),
    ("gas", "Цацрагаар ионжуулсан агаараар"),
    ("semi", "Цэвэр цахиурын талстаар"), ("semi", "Цэвэр германы талстаар"), ("semi", "Нарны зайн цахиур ялтсаар"),
    ("semi", "Хольцгүй хагас дамжуулагч талстаар"),
    ("vacuum", "Вакуум диодын катод ба анодын хоорондох орон зайгаар"),
    ("vacuum", "Электрон цацрагийн хоолойн вакуумаар"), ("vacuum", "Рентген хоолойн катодоос анод хүртэлх вакуумаар"),
    ("vacuum", "Вакуум гурвалын (триодын) хоолойгоор"),
]
MEDIA_QUESTIONS = ["Энэ гүйдлийг ямар цэнэгт бөөмс үүсгэдэг вэ?", "Энэ орчин дахь цэнэг зөөгчид юу вэ?"]
MEDIA_EXPLAIN = {
    "metal": "Металлд гүйдлийг чөлөөт электронуудын чиглэсэн хөдөлгөөн үүсгэнэ.",
    "electrolyte": "Электролитод (уусмал, хайлмал) молекулууд эерэг ба сөрөг ион болон задарч, тэдгээр нь эсрэг электродууд руу хөдөлнө.",
    "gas": "Ионжсон хийд гүйдлийг электронууд болон эерэг, сөрөг ионууд үүсгэнэ.",
    "semi": "Хагас дамжуулагчид гүйдлийг чөлөөт электронууд ба нүхнүүд үүсгэнэ.",
    "vacuum": "Вакуумд өөрийн цэнэг зөөгч байхгүй; халаасан катодоос ялгарсан (термоэлектрон эмиссийн) электронууд гүйдэл үүсгэнэ.",
}
RESISTANCE_POOL = ["Ихэснэ", "Багасна", "Өөрчлөгдөхгүй", "Тэг болно", "Эхлээд багасаад, дараа нь ихэснэ"]
NAMES_POOL = ["Термоэлектрон эмисс", "Фотоэффект", "Электролит диссоциаци", "Ионжилт", "Хэт дамжуулалт", "Цахилгаан задрал"]
MEDIA_PROPERTIES = [
    ("Зэс утсыг халаахад эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?", "Ихэснэ", RESISTANCE_POOL,
     "Металлыг халаахад ионуудын хэлбэлзэл ихсэж, электронуудын хөдөлгөөнд саад болох тул эсэргүүцэл ихэснэ."),
    ("Төмөр утсыг халаахад эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?", "Ихэснэ", RESISTANCE_POOL,
     "Металлыг халаахад ионуудын хэлбэлзэл ихсэж, эсэргүүцэл ихэснэ."),
    ("Цэвэр цахиурын талстыг халаахад эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?", "Багасна", RESISTANCE_POOL,
     "Хагас дамжуулагчийг халаахад чөлөөт электрон ба нүхний тоо ихсэж, эсэргүүцэл багасна."),
    ("Цэвэр германы талстыг халаахад эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?", "Багасна", RESISTANCE_POOL,
     "Хагас дамжуулагчийг халаахад цэнэг зөөгчийн тоо ихсэж, эсэргүүцэл багасна."),
    ("Хоолны давсны усан уусмалыг халаахад эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?", "Багасна", RESISTANCE_POOL,
     "Электролитыг халаахад диссоциаци ихсэж, ионууд хурдан хөдөлдөг болох тул эсэргүүцэл багасна."),
    ("Зэсийн купоросын уусмалыг халаахад эсэргүүцэл нь хэрхэн өөрчлөгдөх вэ?", "Багасна", RESISTANCE_POOL,
     "Электролитыг халаахад ионы тоо ба хөдөлгөөн ихсэж, эсэргүүцэл багасна."),
    ("Зарим металлыг маш бага (критик) температураас доош хөргөхөд эсэргүүцэл нь ямар болох вэ?", "Тэг болно",
     RESISTANCE_POOL, "Энэ нь хэт дамжуулалтын үзэгдэл: эсэргүүцэл тэг болно."),
    ("Вакуум диодын халаасан катодоос электрон ялгарах үзэгдлийг юу гэж нэрлэх вэ?", "Термоэлектрон эмисс", NAMES_POOL,
     "Халаасан металлаас электрон ялгарахыг термоэлектрон эмисс гэнэ."),
    ("Хийн молекулууд электрон алдаж (эсвэл нэмж) ион болох үзэгдлийг юу гэж нэрлэх вэ?", "Ионжилт", NAMES_POOL,
     "Төвийг сахисан молекулаас ион үүсэхийг ионжилт гэнэ."),
    ("Давс усанд уусахдаа эерэг ба сөрөг ион болон задрах үзэгдлийг юу гэж нэрлэх вэ?", "Электролит диссоциаци",
     NAMES_POOL, "Уусахдаа молекул ион болон задрахыг электролит диссоциаци гэнэ."),
    ("Цахилгаан задлалын үед эерэг ионууд аль электрод руу хөдлөх вэ?", "Катод руу",
     ["Катод руу", "Анод руу", "Хөдлөхгүй", "Хоёр электрод руу ээлжлэн", "Уусмалын гадаргуу руу"],
     "Эерэг ионууд сөрөг электрод буюу катод руу хөдөлнө."),
    ("Цахилгаан задлалын үед сөрөг ионууд аль электрод руу хөдлөх вэ?", "Анод руу",
     ["Катод руу", "Анод руу", "Хөдлөхгүй", "Хоёр электрод руу ээлжлэн", "Уусмалын гадаргуу руу"],
     "Сөрөг ионууд эерэг электрод буюу анод руу хөдөлнө."),
    ("Зэсийн купоросын уусмалаар гүйдэл гүйлгэхэд катод дээр юу ялгарах вэ?", "Цэвэр зэс",
     ["Цэвэр зэс", "Хүхэр", "Устөрөгч ба хүхэр", "Юу ч ялгарахгүй", "Сульфат ионууд"],
     "Эерэг зэсийн ионууд катод дээр электрон авч, цэвэр зэс болон суурьшина."),
    ("Мөнгөний нитратын уусмалаар гүйдэл гүйлгэхэд катод дээр юу ялгарах вэ?", "Мөнгө",
     ["Мөнгө", "Азот", "Нитрат ионууд", "Юу ч ялгарахгүй", "Хүчилтөрөгч ба азот"],
     "Эерэг мөнгөний ионууд катод дээр электрон авч, мөнгө болон суурьшина."),
    ("Хагас дамжуулагчид холбооноос электрон чөлөөлөгдсөний дараа үлдэх эерэг цэнэгтэй сул орон зайг юу гэж нэрлэх вэ?",
     "Нүх", ["Нүх", "Ион", "Протон", "Позитрон", "Фотон"],
     "Электрон чөлөөлөгдөхөд үлдсэн эерэг цэнэгтэй сул орон зайг нүх гэнэ."),
    ("Металлоор гүйдэл гүйхэд бодис шилжин ялгарах уу?", "Ялгарахгүй: цэнэгийг электронууд зөөнө",
     ["Ялгарахгүй: цэнэгийг электронууд зөөнө", "Ялгарна: металлын ионууд катод руу шилжинэ",
      "Ялгарна: металлын ионууд анод руу шилжинэ", "Зөвхөн хувьсах гүйдлийн үед ялгарна",
      "Зөвхөн халуун металлд ялгарна"],
     "Металлд гүйдлийг электронууд үүсгэх тул бодис шилжихгүй; электролитод бол ионууд бодис зөөнө."),
]
MEDIA_TRUE = [
    ("metal", "Металлд цахилгаан гүйдлийг чөлөөт электронууд үүсгэнэ.", ""),
    ("electrolyte", "Электролитод цахилгаан гүйдлийг эерэг ба сөрөг ионууд үүсгэнэ.", ""),
    ("gas", "Ионжсон хийд цахилгаан гүйдлийг электронууд болон ионууд үүсгэнэ.", ""),
    ("semi", "Цэвэр хагас дамжуулагчид гүйдлийг электронууд ба нүхнүүд үүсгэнэ.", ""),
    ("vacuum", "Вакуумд гүйдлийг халаасан катодоос ялгарсан электронууд үүсгэнэ.", ""),
    ("metal_t", "Металлын эсэргүүцэл температур ихсэхэд ихэснэ.", ""),
    ("semi_t", "Хагас дамжуулагчийн эсэргүүцэл температур ихсэхэд багасна.", ""),
    ("electrolysis", "Цахилгаан задлалын үед эерэг ионууд катод руу хөдөлнө.", ""),
    ("transfer", "Электролитоор гүйдэл гүйхэд электрод дээр бодис ялгарна.", ""),
    ("super", "Хэт дамжуулагч төлөвт металлын эсэргүүцэл тэг болно.", ""),
]
MEDIA_FALSE = [
    ("metal", "Металлд цахилгаан гүйдлийг эерэг ионууд үүсгэнэ.", "металлд гүйдлийг чөлөөт электронууд үүсгэнэ"),
    ("electrolyte", "Электролитод цахилгаан гүйдлийг зөвхөн электронууд үүсгэнэ.", "электролитод гүйдлийг эерэг ба сөрөг ионууд үүсгэнэ"),
    ("gas", "Хийд цахилгаан гүйдлийг зөвхөн эерэг ионууд үүсгэнэ.", "ионжсон хийд электронууд болон эерэг, сөрөг ионууд оролцоно"),
    ("semi", "Цэвэр хагас дамжуулагчид гүйдлийг зөвхөн ионууд үүсгэнэ.", "хагас дамжуулагчид электронууд ба нүхнүүд гүйдэл үүсгэнэ"),
    ("vacuum", "Вакуумд гүйдлийг эерэг ба сөрөг ионууд үүсгэнэ.", "вакуумд гүйдлийг катодоос ялгарсан электронууд үүсгэнэ"),
    ("metal_t", "Металлын эсэргүүцэл температур ихсэхэд багасна.", "металлын эсэргүүцэл халахад ихэснэ"),
    ("semi_t", "Хагас дамжуулагчийн эсэргүүцэл температур ихсэхэд ихэснэ.", "хагас дамжуулагчийн эсэргүүцэл халахад багасна"),
    ("electrolysis", "Цахилгаан задлалын үед эерэг ионууд анод руу хөдөлнө.", "эерэг ионууд катод руу хөдөлнө"),
    ("transfer", "Металл утсаар гүйдэл гүйхэд утасны дагуу бодис шилжиж ялгарна.", "металлд цэнэгийг электронууд зөөх тул бодис шилжихгүй"),
]


@lru_cache(maxsize=None)
def media_versions() -> tuple:
    groups = {
        "carrier": [("carrier", medium, context, question) for medium, context in MEDIA_CONTEXTS for question in MEDIA_QUESTIONS],
        "property": [("property",) + item for item in MEDIA_PROPERTIES],
        "statements": list(statement_sets(7007, MEDIA_TRUE, MEDIA_FALSE, 70)),
    }
    return grouped(groups, 7007, {"carrier": 48, "property": 16, "statements": 70})


def c_media(rng: random.Random, year: int, k: int) -> dict:
    version = media_versions()[k % len(media_versions())]
    if version[0] == "carrier":
        _, medium, context, question = version
        answer = CARRIERS[medium]
        pool = [text for name, text in CARRIERS.items() if name != medium and {name, medium} != {"metal", "vacuum"}]
        return text_item(SKILL_MEDIA, f"{context} цахилгаан гүйдэл гүйж байна. {question}", answer,
                         pool + CARRIER_EXTRA, MEDIA_EXPLAIN[medium], rng)
    if version[0] == "property":
        _, prompt, answer, pool, solution = version
        return text_item(SKILL_MEDIA, prompt, answer, pool, solution, rng)
    _, mask, chosen = version
    return statement_item(SKILL_MEDIA, "Янз бүрийн орчин дахь цахилгаан гүйдлийн тухай дараах өгүүлбэрүүдээс аль нь зөв бэ?",
                          mask, chosen, rng)


# ---------------------------------------------------------------------------
# 8. el_semiconductor
# ---------------------------------------------------------------------------

SKILL_SEMI = "Хагас дамжуулагч элемент"
DOPANTS = [("фосфор", 5), ("хүнцэл", 5), ("сурьма", 5), ("бор", 3), ("хөнгөн цагаан", 3), ("галли", 3), ("инди", 3)]
DOPING_POOL = ["n төрлийн, үндсэн цэнэг зөөгч нь электрон", "p төрлийн, үндсэн цэнэг зөөгч нь нүх",
               "n төрлийн, үндсэн цэнэг зөөгч нь нүх", "p төрлийн, үндсэн цэнэг зөөгч нь электрон",
               "Хагас дамжуулагч диэлектрик болно"]
LAMP_POOL = ["Чийдэн асна: диод шууд чиглэлд холбогдсон", "Чийдэн асахгүй: диод урвуу чиглэлд холбогдсон",
             "Чийдэн асна: диод урвуу чиглэлд холбогдсон", "Чийдэн асахгүй: диод шууд чиглэлд холбогдсон",
             "Чийдэн анивчиж асна: диод гүйдлийг үе үе тасална"]
SOURCES_DC = ["Батарей", "Аккумулятор", "Тогтмол гүйдлийн эх үүсвэр"]
BRANCH_POOL = ["Зөвхөн Ч1 асна", "Зөвхөн Ч2 асна", "Хоёулаа асна", "Аль нь ч асахгүй", "Хоёулаа ээлжлэн анивчина"]
CHANGE_POOL = ["Ихэснэ", "Багасна", "Өөрчлөгдөхгүй", "Тэг болно", "Эхлээд ихсээд, дараа нь багасна"]
SENSORS = [
    ("Фоторезистор", "фоторезисторын эсэргүүцэл", "фоторезистор дээрх хүчдэл", "Фоторезистор дээр тусах гэрлийг ихэсгэвэл", -1,
     "Гэрэлтүүлэг ихсэхэд фоторезисторын эсэргүүцэл багасна"),
    ("Фоторезистор", "фоторезисторын эсэргүүцэл", "фоторезистор дээрх хүчдэл", "Фоторезисторыг харанхуйлвал", 1,
     "Харанхуйд фоторезисторын эсэргүүцэл ихэснэ"),
    ("Термистор", "термисторын эсэргүүцэл", "термистор дээрх хүчдэл", "Термисторыг халаавал", -1,
     "Халахад термисторын (хагас дамжуулагчийн) эсэргүүцэл багасна"),
    ("Термистор", "термисторын эсэргүүцэл", "термистор дээрх хүчдэл", "Термисторыг хөргөвөл", 1,
     "Хөрөхөд термисторын эсэргүүцэл ихэснэ"),
]
ROLE_POOL = ["Дохио өсгөх ба унтраалга (түлхүүр) болгох", "Гүйдлийг зөвхөн нэг чиглэлд нэвтрүүлж шулуутгах",
             "Гэрлийн энергийг цахилгаан энерги болгох", "Цахилгаан цэнэг хуримтлуулах",
             "Хувьсах хүчдэлийг өсгөх буюу бууруулах"]
TYPE_POOL = ["n төрлийн", "p төрлийн", "Хольцгүй цэвэр хагас дамжуулагч", "Металл", "Диэлектрик"]
SEMI_FACTS = [
    ("npn транзисторын суурь (база) ямар төрлийн хагас дамжуулагчаар хийгдсэн бэ?", "p төрлийн", TYPE_POOL,
     "npn транзисторт хоёр n давхаргын дунд нимгэн p давхарга (суурь) байна."),
    ("pnp транзисторын суурь (база) ямар төрлийн хагас дамжуулагчаар хийгдсэн бэ?", "n төрлийн", TYPE_POOL,
     "pnp транзисторт хоёр p давхаргын дунд нимгэн n давхарга (суурь) байна."),
    ("npn транзисторын эмиттер ямар төрлийн хагас дамжуулагчаар хийгдсэн бэ?", "n төрлийн", TYPE_POOL,
     "npn транзисторын эмиттер ба коллектор нь n төрлийн давхарга."),
    ("pnp транзисторын коллектор ямар төрлийн хагас дамжуулагчаар хийгдсэн бэ?", "p төрлийн", TYPE_POOL,
     "pnp транзисторын эмиттер ба коллектор нь p төрлийн давхарга."),
    ("Транзистор хэдэн p-n шилжилттэй вэ?", "Хоёр", ["Нэг", "Хоёр", "Гурав", "Дөрөв", "p-n шилжилтгүй"],
     "Гурван давхаргын хооронд хоёр p-n шилжилт (эмиттерийн ба коллекторын) үүснэ."),
    ("Транзисторын гурван гаралтын аль нь дунд давхаргад холбогдсон байдаг вэ?", "Суурь (база)",
     ["Эмиттер", "Коллектор", "Суурь (база)", "Анод", "Катод"], "Дунд нимгэн давхаргыг суурь (база) гэнэ."),
    ("Транзисторыг хэлхээнд голчлон ямар зорилгоор ашигладаг вэ?", ROLE_POOL[0], ROLE_POOL,
     "Суурийн бага гүйдлээр коллекторын их гүйдлийг удирдах тул транзистор дохио өсгөж, унтраалгын үүрэг гүйцэтгэнэ."),
    ("Хагас дамжуулагч диодыг хэлхээнд голчлон ямар зорилгоор ашигладаг вэ?", ROLE_POOL[1], ROLE_POOL,
     "p-n шилжилт гүйдлийг нэг чиглэлд нэвтрүүлэх тул диод хувьсах гүйдлийг шулуутгана."),
    ("Нарны зай (фотоэлемент) ямар үүрэгтэй вэ?", ROLE_POOL[2], ROLE_POOL,
     "Нарны зайн p-n шилжилтэд гэрэл тусахад ЦХХ үүсч, гэрлийн энерги цахилгаан энерги болно."),
    ("Гэрэл диодыг (гэрэл цацруулагч диод) хэрхэн холбоход гэрэл цацруулах вэ?", "Шууд чиглэлд холбоход",
     ["Шууд чиглэлд холбоход", "Урвуу чиглэлд холбоход", "Аль ч чиглэлд холбоход ижил гэрэлтэнэ",
      "Зөвхөн хувьсах гүйдлийн эх үүсвэрт холбоход", "Гэрэлтүүлэхэд (гадны гэрэл тусахад)"],
     "Шууд чиглэлд холбогдсон p-n шилжилтэд электрон ба нүх нэгдэхдээ гэрэл цацруулна."),
]
SEMI_TRUE = [
    ("diode", "Диод шууд чиглэлд холбогдоход гүйдлийг сайн нэвтрүүлнэ.", ""),
    ("reverse", "Урвуу чиглэлд холбосон диодоор гүйдэл бараг гүйхгүй.", ""),
    ("led", "Гэрэл диод шууд чиглэлд холбогдоход гэрэл цацруулна.", ""),
    ("photo", "Фоторезисторын эсэргүүцэл гэрэлтүүлэг ихсэхэд багасна.", ""),
    ("ntc", "Термисторын эсэргүүцэл халахад багасна.", ""),
    ("ntype", "Цахиурт фосфор хольц оруулахад n төрлийн хагас дамжуулагч үүснэ.", ""),
    ("ptype", "Цахиурт бор хольц оруулахад p төрлийн хагас дамжуулагч үүснэ.", ""),
    ("npn", "npn транзисторын суурь нь p төрлийн хагас дамжуулагч байна.", ""),
    ("transistor", "Транзисторын суурийн бага гүйдлээр коллекторын их гүйдлийг удирдаж болно.", ""),
    ("holes", "p төрлийн хагас дамжуулагчид үндсэн цэнэг зөөгч нь нүх байна.", ""),
    ("rectifier", "Диодыг хувьсах гүйдлийг шулуутгахад ашигладаг.", ""),
]
SEMI_FALSE = [
    ("diode", "Урвуу чиглэлд холбосон диод гүйдлийг сайн нэвтрүүлнэ.", "урвуу чиглэлд диодоор гүйдэл бараг гүйхгүй"),
    ("led", "Гэрэл диод урвуу чиглэлд холбогдоход хамгийн хүчтэй гэрэлтэнэ.", "гэрэл диод шууд чиглэлд холбогдоход гэрэлтэнэ"),
    ("photo", "Фоторезисторын эсэргүүцэл гэрэлтүүлэг ихсэхэд ихэснэ.", "гэрэлтүүлэг ихсэхэд эсэргүүцэл нь багасна"),
    ("ntc", "Термисторын эсэргүүцэл халахад ихэснэ.", "термисторын эсэргүүцэл халахад багасна"),
    ("ntype", "Цахиурт фосфор хольц оруулахад p төрлийн хагас дамжуулагч үүснэ.", "таван валенттай фосфор n төрөл үүсгэнэ"),
    ("ptype", "Цахиурт бор хольц оруулахад n төрлийн хагас дамжуулагч үүснэ.", "гурван валенттай бор p төрөл үүсгэнэ"),
    ("npn", "npn транзисторын суурь нь n төрлийн хагас дамжуулагч байна.", "npn транзисторын суурь нь p төрлийн"),
    ("transistor", "Транзистор нь ганц p-n шилжилттэй, хоёр гаралттай элемент юм.", "транзистор хоёр p-n шилжилт, гурван гаралттай"),
    ("holes", "n төрлийн хагас дамжуулагчид үндсэн цэнэг зөөгч нь нүх байна.", "n төрөлд үндсэн цэнэг зөөгч нь электрон"),
    ("rectifier", "Диод хувьсах хүчдэлийн далайцыг ихэсгэдэг.", "диод гүйдлийг шулуутгана; хүчдэлийг өсгөдөггүй"),
]


@lru_cache(maxsize=None)
def semiconductor_versions() -> tuple:
    groups = {name: [] for name in ("doping", "diode", "branch", "sensor", "fact")}
    for host, host_gen in (("цахиур", "цахиурын"), ("герман", "германы")):
        for dopant, valence in DOPANTS:
            for show in (False, True):
                groups["doping"].append(("doping", host_gen, dopant, valence, show))
    for source in SOURCES_DC:
        for terminal in ("анод", "катод"):
            for pole in ("эерэг", "сөрөг"):
                groups["diode"].append(("diode", source, terminal, pole))
    for terminal in ("анод", "катод"):
        for branch in (1, 2):
            for source in SOURCES_DC[:2]:
                groups["branch"].append(("branch", source, terminal, branch))
    groups["branch"].append(("ac",))
    for sensor in range(len(SENSORS)):
        for asked in ("resistance", "current", "fixed", "sensor", "lamp"):
            groups["sensor"].append(("sensor", sensor, asked))
    groups["fact"] = [("fact",) + item for item in SEMI_FACTS]
    groups["statements"] = list(statement_sets(8008, SEMI_TRUE, SEMI_FALSE, 60))
    return grouped(groups, 8008, {"doping": 28, "diode": 12, "branch": 9, "sensor": 20, "fact": 10, "statements": 60})


def el_semiconductor(rng: random.Random, year: int, k: int) -> dict:
    version = semiconductor_versions()[k % len(semiconductor_versions())]
    kind = version[0]
    skill = SKILL_SEMI
    if kind == "doping":
        _, host_gen, dopant, valence, show = version
        note = f" ({'таван' if valence == 5 else 'гурван'} валенттай)" if show else ""
        answer = DOPING_POOL[0] if valence == 5 else DOPING_POOL[1]
        return text_item(
            skill,
            f"Дөрвөн валенттай цэвэр {host_gen} талстад {dopant}{note} хольц оруулав. Ямар хагас дамжуулагч үүсэх вэ?",
            answer, DOPING_POOL,
            (f"{dopant.capitalize()} {'таван' if valence == 5 else 'гурван'} валенттай. "
             + ("Илүүдэл тав дахь электрон чөлөөт электрон болох тул n төрөл үүсч, үндсэн цэнэг зөөгч нь электрон."
                if valence == 5 else "Нэг холбоонд электрон дутагдаж нүх үүсэх тул p төрөл үүсч, үндсэн цэнэг зөөгч нь нүх.")),
            rng,
        )
    if kind == "diode":
        _, source, terminal, pole = version
        forward = (terminal == "анод") == (pole == "эерэг")
        answer = LAMP_POOL[0] if forward else LAMP_POOL[1]
        return text_item(
            skill,
            (f"{source}, хагас дамжуулагч диод ба чийдэнг цуваа холбов. Диодын {terminal} нь эх үүсвэрийн {pole} туйл "
             "талд холбогдсон бол чийдэн асах уу?"),
            answer, LAMP_POOL,
            ("Диодын анод эерэг, катод сөрөг туйл талд байвал диод шууд чиглэлд холбогдож гүйдэл нэвтрүүлнэ; эсрэгээр "
             f"холбовол урвуу чиглэл болж гүйдэл бараг гүйхгүй. Энд {'шууд' if forward else 'урвуу'} чиглэл: "
             f"{answer[0].lower() + answer[1:]}."),
            rng,
        )
    if kind == "branch":
        _, source, terminal, branch = version
        # The named diode's terminal faces the positive pole; the other branch's diode points the other way.
        lit = branch if terminal == "анод" else 3 - branch
        answer = BRANCH_POOL[lit - 1]
        return text_item(
            skill,
            (f"{source}т хоёр салбарыг параллель холбов. Салбар бүрт чийдэн (Ч1, Ч2) ба диод цуваа холбогдсон бөгөөд хоёр "
             f"диод эсрэг чиглэлтэй. {branch}-р салбарын диодын {terminal} нь эх үүсвэрийн эерэг туйл талд байрлана. "
             "Аль чийдэн асах вэ?"),
            answer, BRANCH_POOL,
            (f"Анод нь эерэг туйл талд байрлах диод шууд чиглэлд холбогдоно. Энэ нь {lit}-р салбарын диод тул зөвхөн "
             f"Ч{lit} асна; нөгөө диод урвуу чиглэлд байна."),
            rng,
        )
    if kind == "ac":
        pool = ["Гүйдэл зөвхөн нэг чиглэлд, хагас үе бүрт гүйнэ", "Гүйдэл огт гүйхгүй",
                "Гүйдэл хоёр чиглэлд ижил гүйнэ", "Гүйдлийн давтамж хоёр дахин ихэснэ", "Гүйдэл тогтмол хэмжээтэй болно"]
        return text_item(
            skill,
            "Хувьсах гүйдлийн эх үүсвэрт хагас дамжуулагч диод ба чийдэнг цуваа холбов. Чийдэнгээр гүйх гүйдэл ямар байх вэ?",
            pool[0], pool,
            "Диод зөвхөн шууд чиглэлийн хагас үед гүйдэл нэвтрүүлнэ: хувьсах гүйдэл нэг чиглэлтэй (шулуутгасан) болно.",
            rng,
        )
    if kind == "sensor":
        _, index, asked = version
        name, resistance_text, sensor_voltage, change, direction, reason = SENSORS[index]
        # direction −1: the sensor's resistance falls, so the current and the fixed resistor's voltage rise.
        effect = {"resistance": direction, "current": -direction, "fixed": -direction, "sensor": direction, "lamp": -direction}[asked]
        answer = "Ихэснэ" if effect > 0 else "Багасна"
        partner = "чийдэнг" if asked == "lamp" else "тогтмол эсэргүүцэлтэй резисторыг"
        asked_text = {
            "resistance": resistance_text, "current": "хэлхээний гүйдэл", "fixed": "резистор дээрх хүчдэл",
            "sensor": sensor_voltage, "lamp": "чийдэнгийн гэрэлтэлт",
        }[asked]
        return text_item(
            skill,
            (f"{name} ба {partner} цуваа холбож, тогтмол хүчдэлийн эх үүсвэрт залгав. {change} {asked_text} хэрхэн "
             "өөрчлөгдөх вэ?"),
            answer, CHANGE_POOL,
            (f"{reason}. Иймд I = U/(R_мэдрэгч + R) {'ихэснэ' if direction < 0 else 'багасна'}, резистор (чийдэн) дээрх "
             f"хүчдэл IR {'ихэсч' if direction < 0 else 'багасч'}, мэдрэгч дээрх хүчдэл U − IR "
             f"{'багасна' if direction < 0 else 'ихэснэ'}. Хариу: {answer.lower()}."),
            rng,
        )
    if kind == "fact":
        _, prompt, answer, pool, solution = version
        return text_item(skill, prompt, answer, pool, solution, rng)
    _, mask, chosen = version
    return statement_item(skill, "Хагас дамжуулагч элементийн тухай дараах өгүүлбэрүүдээс аль нь зөв бэ?", mask, chosen, rng)


# ---------------------------------------------------------------------------
# 9. el_divider
# ---------------------------------------------------------------------------

SKILL_DIVIDER = "Хүчдэл хуваагч ба мэдрэгч"
SENSOR_TABLES = [
    ("thermistor", "t, °C", "°C", (0, 20, 40, 60, 80), (16, 8, 4, 2, 1)),
    ("thermistor", "t, °C", "°C", (0, 10, 20, 30, 40, 50), (30, 20, 12, 9, 6, 4)),
    ("thermistor", "t, °C", "°C", (10, 25, 40, 55, 70), (20, 10, 6, 3, 2)),
    ("thermistor", "t, °C", "°C", (-10, 0, 10, 20, 30), (45, 27, 18, 12, 8)),
    ("ldr", "E, лк", "лк", (5, 20, 50, 200, 1000), (60, 25, 12, 4, 1)),
    ("ldr", "E, лк", "лк", (1, 10, 100, 500, 1000), (100, 30, 8, 3, 2)),
    ("ldr", "E, лк", "лк", (10, 50, 100, 400, 800), (40, 16, 10, 5, 3)),
]


@lru_cache(maxsize=None)
def divider_versions() -> tuple:
    groups = {name: [] for name in ("u2", "u1", "current", "r2", "table_i", "table_uf", "table_us")}
    for supply in (5, 6, 9, 10, 12, 15, 20, 24):
        for r1, r2 in itertools.product((1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20), repeat=2):
            out = Fraction(supply * r2, r1 + r2)
            current = Fraction(supply, r1 + r2)
            if clean(out):
                groups["u2"].append(("u2", supply, r1, r2, out))
                groups["u1"].append(("u1", supply, r1, r2, supply - out))
                if out != supply - out:
                    groups["r2"].append(("r2", supply, r1, r2, out))
            if clean(current):
                groups["current"].append(("current", supply, r1, r2, current))
    for table_index, (_, _, _, xs, rs) in enumerate(SENSOR_TABLES):
        for row in range(len(xs)):
            for supply in (5, 6, 9, 12):
                for fixed in (1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20):
                    total = rs[row] + fixed
                    current = Fraction(supply, total)
                    fixed_u = current * fixed
                    if clean(current) and clean(fixed_u):
                        groups["table_i"].append(("table_i", table_index, row, supply, fixed, current))
                        groups["table_uf"].append(("table_uf", table_index, row, supply, fixed, fixed_u))
                        groups["table_us"].append(("table_us", table_index, row, supply, fixed, supply - fixed_u))
    return grouped(groups, 9009, {"u2": 35, "u1": 15, "current": 15, "r2": 20, "table_i": 30, "table_uf": 30,
                                  "table_us": 20})


def el_divider(rng: random.Random, year: int, k: int) -> dict:
    version = divider_versions()[k % len(divider_versions())]
    kind = version[0]
    figure = None
    if kind in ("u2", "u1", "current"):
        _, supply, r1, r2, value = version
        lead = (f"Хүчдэл хуваагч хэлхээнд R1 = {r1} кОм ба R2 = {r2} кОм резисторуудыг цуваа холбож, {supply} В хүчдэлтэй "
                "эх үүсвэрт залгав.")
        if kind == "current":
            prompt = lead + " Хэлхээгээр гүйх гүйдлийг ол."
            answer = unit_text(value, "мА")
            wrong = nw(answer, "мА", [Fraction(supply, r1), Fraction(supply, r2), value * 1000 / 1000 * 10, value / 10])
            solution = f"I = U/(R1 + R2) = {supply} В/({r1} + {r2}) кОм = {num(value)} мА."
        else:
            which, resistor = ("R2", r2) if kind == "u2" else ("R1", r1)
            prompt = lead + f" {which} резистор дээрх хүчдэлийг ол."
            answer = unit_text(value, "В")
            other = supply - value
            wrong = nw(answer, "В", [other, Fraction(supply * resistor, max(r1, r2)) if r1 != r2 else None,
                                     Fraction(supply, 2), Fraction(supply * resistor, r1 + r2 + resistor)])
            solution = f"U_{which[1]} = U·{which}/(R1 + R2) = {supply}·{resistor}/({r1} + {r2}) = {num(value)} В."
    elif kind == "r2":
        _, supply, r1, r2, out = version
        prompt = (f"Хүчдэл хуваагчийн оролтод {supply} В хүчдэл өгөв. R1 = {r1} кОм бол R2 резистор дээрх гаралтын хүчдэл "
                  f"{num(out)} В байхын тулд R2-ын эсэргүүцэл ямар байх ёстой вэ?")
        answer = unit_text(r2, "кОм")
        wrong = nw(answer, "кОм", [r1 * (supply - out) / out, r1 * out / supply, Fraction(r2 * 2), Fraction(r2, 2), Fraction(r1)])
        solution = (f"U_гар = U·R2/(R1 + R2) тул R2 = R1·U_гар/(U − U_гар) = {r1}·{num(out)}/({supply} − {num(out)}) = "
                    f"{r2} кОм.")
    else:
        _, table_index, row, supply, fixed, value = version
        sensor, column, unit, xs, rs = SENSOR_TABLES[table_index]
        name = "Термистор" if sensor == "thermistor" else "Фоторезистор"
        quantity = "температураас" if sensor == "thermistor" else "гэрэлтүүлгээс"
        condition = f"Температур {num(xs[row])} °C" if sensor == "thermistor" else f"Гэрэлтүүлэг {xs[row]} лк"
        sensor_r = rs[row]
        lead = (f"{name}ын эсэргүүцэл {quantity} хэрхэн хамаарахыг хүснэгтэд үзүүлэв. {name}ыг {fixed} кОм резистортой "
                f"цуваа холбож, {supply} В хүчдэлтэй эх үүсвэрт залгав. {condition} байх үед ")
        current = Fraction(supply, sensor_r + fixed)
        work = f"Хүснэгтээс R = {sensor_r} кОм; I = U/(R + R0) = {supply}/({sensor_r} + {fixed}) = {num(current)} мА"
        if kind == "table_i":
            prompt = lead + "хэлхээний гүйдлийг ол."
            answer = unit_text(value, "мА")
            wrong = nw(answer, "мА", [Fraction(supply, sensor_r), Fraction(supply, fixed), value * 2, value / 2])
            solution = work + "."
        elif kind == "table_uf":
            prompt = lead + "резистор дээрх хүчдэлийг ол."
            answer = unit_text(value, "В")
            wrong = nw(answer, "В", [supply - value, current * sensor_r * 2, Fraction(supply, 2), value * 2])
            solution = work + f"; U0 = IR0 = {num(current)}·{fixed} = {num(value)} В."
        else:
            prompt = lead + f"{name.lower()} дээрх хүчдэлийг ол."
            answer = unit_text(value, "В")
            wrong = nw(answer, "В", [supply - value, Fraction(supply, 2), value * 2, value / 2])
            solution = work + f"; U = I·R = {num(current)}·{sensor_r} = {num(value)} В."
        figure = {
            "kind": "table",
            "columns": [column, "R, кОм"],
            "rows": [[num(x), str(r)] for x, r in zip(xs, rs)],
        }
    data = {"skill": SKILL_DIVIDER, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    if figure:
        data["figure"] = figure
    return data


# ---------------------------------------------------------------------------
# 10. f_ampere
# ---------------------------------------------------------------------------

SKILL_AMPERE = "Амперын хүч"
B_FIELDS = [("0.02 Тл", "0.02"), ("50 мТл", "0.05"), ("0.1 Тл", "0.1"), ("0.2 Тл", "0.2"), ("0.25 Тл", "0.25"),
            ("0.4 Тл", "0.4"), ("0.5 Тл", "0.5"), ("0.8 Тл", "0.8"), ("1.2 Тл", "1.2"), ("20 мТл", "0.02")]
LENGTHS = [("5 см", "0.05"), ("10 см", "0.1"), ("20 см", "0.2"), ("25 см", "0.25"), ("40 см", "0.4"), ("50 см", "0.5"),
           ("1 м", "1"), ("1.5 м", "1.5"), ("2 м", "2")]
ANGLES = [(90, "индукцийн шугамд перпендикуляр", Fraction(1)), (30, "индукцийн шугамтай 30° өнцөг үүсгэн", Fraction(1, 2))]
AMPERE_CHANGES = {
    "B": [("Соронзон орны индукцийг 2 дахин ихэсгэж", "соронзон орны индукцийг 2 дахин ихэсгэвэл", Fraction(2)),
          ("Соронзон орны индукцийг 3 дахин ихэсгэж", "соронзон орны индукцийг 3 дахин ихэсгэвэл", Fraction(3)),
          ("Соронзон орны индукцийг 2 дахин багасгаж", "соронзон орны индукцийг 2 дахин багасгавал", Fraction(1, 2))],
    "I": [("Гүйдлийн хүчийг 2 дахин ихэсгэж", "гүйдлийн хүчийг 2 дахин ихэсгэвэл", Fraction(2)),
          ("Гүйдлийн хүчийг 4 дахин ихэсгэж", "гүйдлийн хүчийг 4 дахин ихэсгэвэл", Fraction(4)),
          ("Гүйдлийн хүчийг 2 дахин багасгаж", "гүйдлийн хүчийг 2 дахин багасгавал", Fraction(1, 2)),
          ("Гүйдлийн хүчийг 3 дахин багасгаж", "гүйдлийн хүчийг 3 дахин багасгавал", Fraction(1, 3))],
    "L": [("Орон дахь дамжуулагчийн уртыг 2 дахин ихэсгэж", "орон дахь дамжуулагчийн уртыг 2 дахин ихэсгэвэл", Fraction(2)),
          ("Орон дахь дамжуулагчийн уртыг 3 дахин багасгаж", "орон дахь дамжуулагчийн уртыг 3 дахин багасгавал", Fraction(1, 3))],
    "a": [("Дамжуулагч ба индукцийн шугамын хоорондох өнцгийг 30°-аас 90° болгож",
           "дамжуулагч ба индукцийн шугамын хоорондох өнцгийг 30°-аас 90° болговол", Fraction(2)),
          ("Дамжуулагч ба индукцийн шугамын хоорондох өнцгийг 90°-аас 30° болгож",
           "дамжуулагч ба индукцийн шугамын хоорондох өнцгийг 90°-аас 30° болговол", Fraction(1, 2))],
}
DIRECTIONS = {
    "right": ((1, 0, 0), "баруун тийш", "Баруун тийш"), "left": ((-1, 0, 0), "зүүн тийш", "Зүүн тийш"),
    "up": ((0, 1, 0), "дээш", "Дээш"), "down": ((0, -1, 0), "доош", "Доош"),
    "out": ((0, 0, 1), "зургийн хавтгайгаас бидэн рүү", "Зургийн хавтгайгаас бидэн рүү"),
    "in": ((0, 0, -1), "зургийн хавтгайд перпендикуляр цааш (биднээс холдох)", "Зургийн хавтгайд перпендикуляр цааш"),
}


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def direction_name(vector) -> str:
    for key, (unit_vector, _, label) in DIRECTIONS.items():
        if unit_vector == vector:
            return label
    raise ValueError(vector)


@lru_cache(maxsize=None)
def ampere_versions() -> tuple:
    groups = {name: [] for name in ("force", "field", "current", "change", "direction")}
    currents = tuple(given(x) for x in ("0.5", "1", "2", "2.5", "4", "5", "8", "10", "12", "15", "20"))
    for (b_text, b_value), (l_text, l_value), (angle, angle_text, sine) in itertools.product(B_FIELDS, LENGTHS, ANGLES):
        for current in currents:
            force = given(b_value) * current * given(l_value) * sine
            if force >= Fraction(1, 10) and clean(force):
                unit, value = "Н", force
            elif clean(force * 1000) and force * 1000 >= Fraction(1, 10):
                unit, value = "мН", force * 1000
            else:
                continue
            groups["force"].append(("force", b_text, b_value, l_text, l_value, angle, current, unit, value))
            groups["field"].append(("field", b_text, b_value, l_text, l_value, angle, current, unit, value))
            groups["current"].append(("current", b_text, b_value, l_text, l_value, angle, current, unit, value))
    for first, second in itertools.combinations(AMPERE_CHANGES, 2):
        for one, two in itertools.product(AMPERE_CHANGES[first], AMPERE_CHANGES[second]):
            factor = one[2] * two[2]
            if factor_text(factor):
                groups["change"].append(("change", one, two))
    for current_key in ("right", "left", "up", "down"):
        for field_key in DIRECTIONS:
            current_vector, field_vector = DIRECTIONS[current_key][0], DIRECTIONS[field_key][0]
            if any(current_vector) and sum(x * y for x, y in zip(current_vector, field_vector)) == 0:
                for hint in (False, True):
                    groups["direction"].append(("direction", current_key, field_key, hint))
    return grouped(groups, 1010, {"force": 50, "field": 30, "current": 30, "change": 40, "direction": 32})


def ampere_lead(l_text, angle) -> str:
    angle_text = [text for value, text, _ in ANGLES if value == angle][0]
    return f"{l_text} урттай шулуун дамжуулагч нэгэн төрлийн соронзон оронд {angle_text} байрлана."


def f_ampere(rng: random.Random, year: int, k: int) -> dict:
    version = ampere_versions()[k % len(ampere_versions())]
    kind = version[0]
    skill = SKILL_AMPERE
    if kind in ("force", "field", "current"):
        _, b_text, b_value, l_text, l_value, angle, current, unit, value = version
        sine = Fraction(1) if angle == 90 else Fraction(1, 2)
        sine_text = "sin 90° = 1" if angle == 90 else "sin 30° = 0.5"
        force_text = unit_text(value, unit)
        scale = Fraction(1000) if unit == "мН" else Fraction(1)
        if kind == "force":
            prompt = (ampere_lead(l_text, angle).replace("нэгэн төрлийн", f"B = {b_text} индукцтэй нэгэн төрлийн")
                      + f" Дамжуулагчаар {num(current)} А гүйдэл гүйхэд түүнд үйлчлэх Амперын хүчийг ол.")
            answer = force_text
            wrong = nw(answer, unit, [value * 2 if angle == 30 else value / 2, value * 100, value / 100,
                                      given(b_value) * current * scale])
            solution = f"F = BIL·sin α = {b_value}·{num(current)}·{l_value}·{sine_text.split('= ')[1]} = {num(force_text.split()[0])} {unit}."
            solution = f"F = BIL·sin α = {b_value} Тл·{num(current)} А·{l_value} м·{num(sine)} = {force_text}."
        elif kind == "field":
            b = given(b_value)
            b_unit, b_shown = ("мТл", b * 1000) if b < Fraction(1, 10) else ("Тл", b)
            prompt = (ampere_lead(l_text, angle) + f" Дамжуулагчаар {num(current)} А гүйдэл гүйхэд түүнд {force_text} "
                      "Амперын хүч үйлчилсэн бол соронзон орны индукцийг ол.")
            answer = unit_text(b_shown, b_unit)
            wrong = nw(answer, b_unit, [b_shown * 2 if angle == 30 else b_shown / 2, b_shown * 10, b_shown / 10,
                                        b_shown * current])
            solution = (f"F = BIL·sin α тул B = F/(IL·sin α) = {num(value / scale, 6)} Н/({num(current)} А·{l_value} м·{num(sine)}) "
                        f"= {answer}.")
        else:
            prompt = (ampere_lead(l_text, angle).replace("нэгэн төрлийн", f"B = {b_text} индукцтэй нэгэн төрлийн")
                      + f" Дамжуулагчид {force_text} Амперын хүч үйлчилж байвал түүгээр гүйх гүйдлийг ол.")
            answer = unit_text(current, "А")
            wrong = nw(answer, "А", [current * 2 if angle == 30 else current / 2, current * 10, current / 10, current * 4])
            solution = (f"F = BIL·sin α тул I = F/(BL·sin α) = {num(value / scale, 6)} Н/({b_value} Тл·{l_value} м·{num(sine)}) "
                        f"= {answer}.")
        return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    if kind == "change":
        _, one, two = version
        factor = one[2] * two[2]
        answer = factor_text(factor)
        return {
            "skill": skill,
            "prompt": (f"Нэгэн төрлийн соронзон оронд гүйдэлтэй шулуун дамжуулагч байрлана. {one[0]}, {two[1]} "
                       "дамжуулагчид үйлчлэх Амперын хүч хэрхэн өөрчлөгдөх вэ?"),
            "answer": answer,
            "wrong": factor_wrongs(factor, [one[2] / two[2], two[2] / one[2], one[2], two[2]]),
            "rank": False,
            "solution": (f"F = BIL·sin α нь B, I, L ба sin α-тай шууд пропорциональ (sin 30° = 0.5, sin 90° = 1). "
                         f"F' = {ratio(one[2])}·{ratio(two[2])}·F = {ratio(factor)}·F: {answer.lower()}."),
        }
    _, current_key, field_key, hint = version
    current_vector, current_text, _ = DIRECTIONS[current_key]
    field_vector, field_text, _ = DIRECTIONS[field_key]
    answer = direction_name(cross(current_vector, field_vector))
    orientation = "Хэвтээ" if current_key in ("right", "left") else "Босоо"
    prompt = (f"{orientation} шулуун дамжуулагчаар зургийн хавтгайд гүйдэл {current_text} гүйж байна. Соронзон орны "
              f"индукцийн вектор {field_text} чиглэсэн бол дамжуулагчид үйлчлэх Амперын хүч хаашаа чиглэх вэ?")
    if hint:
        prompt += " (Зүүн гарын дүрмийг ашиглана.)"
    pool = [label for _, _, label in DIRECTIONS.values()]
    return text_item(
        skill, prompt, answer, pool,
        ("Зүүн гарын дүрэм: соронзон индукцийн шугам алган дээр орж, дөрвөн хуруу гүйдлийн чиглэлийг заахад 90° тэнийлгэсэн "
         f"эрхий хуруу Амперын хүчний чиглэлийг заана (F = I·L×B). Хариу: {answer.lower()}."),
        rng,
    )


# ---------------------------------------------------------------------------
# 11. f_lorentz
# ---------------------------------------------------------------------------

SKILL_LORENTZ = "Лоренцын хүч"
CHARGED = [("Протон", 1), ("Электрон", 1), ("Альфа бөөм (q = 2e)", 2), ("Хоёр валенттай эерэг ион (q = 2e)", 2),
           ("Гурван валенттай эерэг ион (q = 3e)", 3)]
SPEEDS = tuple((m, e) for m in ("1", "1.5", "2", "2.5", "3", "4", "5", "6", "8") for e in (5, 6, 7))
B_STRONG = ("0.02", "0.05", "0.1", "0.2", "0.25", "0.4", "0.5", "0.8", "1", "1.5", "2")
NUCLEI = [("Протон", "протоны", 1, 1), ("Дейтрон", "дейтроны", 2, 1), ("Тритон", "тритоны", 3, 1),
          ("Альфа бөөм", "альфа бөөмийн", 4, 2), ("Гели-3 цөм", "гели-3 цөмийн", 3, 2)]
RADIUS_CONDITIONS = [("ижил хурдтайгаар", "v"), ("ижил импульстэйгээр", "p"), ("ижил кинетик энергитэйгээр", "E")]
LORENTZ_CHANGES = [
    ("бөөмийн хурдыг 2 дахин ихэсгэж", Fraction(2), "v"), ("бөөмийн хурдыг 3 дахин ихэсгэж", Fraction(3), "v"),
    ("бөөмийн хурдыг 2 дахин багасгаж", Fraction(1, 2), "v"), (None, Fraction(1), "v"),
]
LORENTZ_FIELD_CHANGES = [
    ("соронзон орны индукцийг 2 дахин ихэсгэвэл", Fraction(2)), ("соронзон орны индукцийг 3 дахин ихэсгэвэл", Fraction(3)),
    ("соронзон орны индукцийг 2 дахин багасгавал", Fraction(1, 2)), ("соронзон орны индукцийг 4 дахин багасгавал", Fraction(1, 4)),
    (None, Fraction(1)),
]


@lru_cache(maxsize=None)
def lorentz_versions() -> tuple:
    groups = {name: [] for name in ("force", "speed", "field", "ratio", "change")}
    for (name, charge), (mantissa, exponent), b_value, angle in itertools.product(CHARGED, SPEEDS, B_STRONG, (90, 30)):
        speed = given(mantissa) * 10 ** exponent
        sine = Fraction(1) if angle == 90 else Fraction(1, 2)
        force = charge * E_CHARGE * speed * given(b_value) * sine
        if sci_clean(force):
            for kind in ("force", "speed", "field"):
                groups[kind].append((kind, name, charge, speed, b_value, angle, force))
    for (first, second), (condition, mode) in itertools.product(itertools.permutations(NUCLEI, 2), RADIUS_CONDITIONS):
        m1, q1, m2, q2 = first[2], first[3], second[2], second[3]
        if mode == "v":
            value = Fraction(m1, q1) / Fraction(m2, q2)
        elif mode == "p":
            value = Fraction(q2, q1)
        else:
            square = Fraction(m1 * q2 * q2, m2 * q1 * q1)
            root = Fraction(math.isqrt(square.numerator), math.isqrt(square.denominator))
            if root * root != square:
                continue
            value = root
        groups["ratio"].append(("ratio", first, second, condition, mode, value))
    for (v_text, v_factor, _), (b_text, b_factor) in itertools.product(LORENTZ_CHANGES, LORENTZ_FIELD_CHANGES):
        if v_factor == 1 and b_factor == 1:
            continue
        for asked in ("radius", "period", "force"):
            factor = {"radius": v_factor / b_factor, "period": 1 / b_factor, "force": v_factor * b_factor}[asked]
            if factor_text(factor):
                groups["change"].append(("change", v_text, v_factor, b_text, b_factor, asked, factor))
    return grouped(groups, 1111, {"force": 50, "speed": 25, "field": 25, "ratio": 40, "change": 40})


def lorentz_angle(angle) -> str:
    return "индукцийн шугамд перпендикуляраар" if angle == 90 else "индукцийн шугамтай 30° өнцөг үүсгэн"


def f_lorentz(rng: random.Random, year: int, k: int) -> dict:
    version = lorentz_versions()[k % len(lorentz_versions())]
    kind = version[0]
    skill = SKILL_LORENTZ
    if kind in ("force", "speed", "field"):
        _, name, charge, speed, b_value, angle, force = version
        sine = Fraction(1) if angle == 90 else Fraction(1, 2)
        q_text = sci_exact(charge * E_CHARGE, "q")
        if kind == "force":
            prompt = (f"{name} {sci_exact(speed, 'v')} м/с хурдтайгаар B = {b_value} Тл индукцтэй нэгэн төрлийн соронзон "
                      f"оронд {lorentz_angle(angle)} орж ирэв. Бөөмд үйлчлэх Лоренцын хүчийг ол. e = 1.6·10⁻¹⁹ Кл.")
            answer = sci_exact(force, "F") + " Н"
            wrong = [text + " Н" for text in spread(force, [force * 2 if angle == 30 else force / 2, force * 10, force / 10],
                                                     sci_text, rng)]
            solution = f"F = qvB·sin α = {q_text}·{sci_exact(speed, 'v')}·{b_value}·{num(sine)} = {answer}."
        elif kind == "speed":
            prompt = (f"{name} B = {b_value} Тл индукцтэй нэгэн төрлийн соронзон оронд {lorentz_angle(angle)} хөдлөхөд "
                      f"түүнд {sci_exact(force, 'F')} Н Лоренцын хүч үйлчлэв. Бөөмийн хурдыг ол. e = 1.6·10⁻¹⁹ Кл.")
            answer = sci_exact(speed, "v") + " м/с"
            wrong = [text + " м/с" for text in spread(speed, [speed * 2 if angle == 30 else speed / 2, speed * 10, speed / 10],
                                                       sci_text, rng)]
            solution = f"F = qvB·sin α тул v = F/(qB·sin α) = {sci_exact(force, 'F')}/({q_text}·{b_value}·{num(sine)}) = {answer}."
        else:
            b = given(b_value)
            prompt = (f"{name} {sci_exact(speed, 'v')} м/с хурдтайгаар нэгэн төрлийн соронзон оронд {lorentz_angle(angle)} "
                      f"хөдлөхөд түүнд {sci_exact(force, 'F')} Н Лоренцын хүч үйлчлэв. Соронзон орны индукцийг ол. "
                      "e = 1.6·10⁻¹⁹ Кл.")
            answer = unit_text(b, "Тл")
            wrong = nw(answer, "Тл", [b * 2 if angle == 30 else b / 2, b * 10, b / 10, b * 4], 3)
            solution = f"B = F/(qv·sin α) = {sci_exact(force, 'F')}/({q_text}·{sci_exact(speed, 'v')}·{num(sine)}) = {answer}."
        return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    if kind == "ratio":
        _, first, second, condition, mode, value = version

        def describe(item):
            mass = "m" if item[2] == 1 else f"{item[2]}m"
            charge = "e" if item[3] == 1 else f"{item[3]}e"
            return f"{item[0]} (масс {mass}, цэнэг {charge})"

        answer = ratio(value)
        m_ratio, q_ratio = Fraction(first[2], second[2]), Fraction(first[3], second[3])
        candidates = [1 / value, value * value, m_ratio, 1 / q_ratio, m_ratio / q_ratio, q_ratio, m_ratio * q_ratio,
                      value * 2, value / 2, Fraction(4), Fraction(1, 4), Fraction(1), Fraction(3), Fraction(1, 3)]
        wrong = []
        for candidate in candidates:
            text = ratio(candidate)
            if text != answer and text not in wrong:
                wrong.append(text)
        def mass(item):
            return "m" if item[2] == 1 else f"{item[2]}m"

        def charge(item):
            return "e" if item[3] == 1 else f"{item[3]}e"

        work = {
            "v": (f"r = mv/(qB); ижил хурдтай үед r ∝ m/q: r1/r2 = ({mass(first)}/{charge(first)})/"
                  f"({mass(second)}/{charge(second)})"),
            "p": f"r = p/(qB); ижил импульстэй үед r ∝ 1/q: r1/r2 = {charge(second)}/{charge(first)}",
            "E": (f"r = √(2mE)/(qB); ижил кинетик энергитэй үед r ∝ √m/q: r1/r2 = √({mass(first)}/{mass(second)})·"
                  f"{charge(second)}/{charge(first)}"),
        }[mode]
        return {
            "skill": skill,
            "prompt": (f"{describe(first)} ба {describe(second).replace(second[0], second[0].lower(), 1)} {condition} нэгэн "
                       f"төрлийн соронзон оронд индукцийн шугамд перпендикуляраар орж ирэв. {first[1].capitalize()} тойргийн "
                       f"радиусыг r1, {second[1]} тойргийн радиусыг r2 гэвэл r1/r2 харьцаа хэд вэ?"),
            "answer": answer,
            "wrong": wrong[:4],
            "rank": False,
            "solution": work + f" = {answer}.",
        }
    _, v_text, v_factor, b_text, b_factor, asked, factor = version
    owner = "бөөмийн " if v_text is None else ""
    if v_text is None:
        change = b_text
    elif b_text is None:
        change = v_text[:-1] + ("вэл" if v_text.endswith("ихэсгэж") else "вал")
    else:
        change = f"{v_text}, {b_text}"
    quantity = {"radius": f"{owner}тойргийн радиус", "period": f"{owner}эргэлтийн үе",
                "force": "бөөмд үйлчлэх Лоренцын хүч"}[asked]
    answer = factor_text(factor)
    rule = {"radius": "r = mv/(qB) ∝ v/B", "period": "T = 2πm/(qB) нь хурднаас хамаарахгүй, ∝ 1/B",
            "force": "F = qvB ∝ vB"}[asked]
    return {
        "skill": skill,
        "prompt": (f"Нэгэн төрлийн соронзон оронд цэнэгт бөөм индукцийн шугамд перпендикуляраар хөдөлж байна. "
                   f"{change[0].upper() + change[1:]} {quantity} хэрхэн өөрчлөгдөх вэ?"),
        "answer": answer,
        "wrong": factor_wrongs(factor, [v_factor * b_factor, v_factor / b_factor, 1 / b_factor, v_factor, b_factor]),
        "rank": False,
        "solution": f"{rule}. Хурд {ratio(v_factor)} дахин, индукц {ratio(b_factor)} дахин үржигдэнэ: {answer.lower()}.",
    }


# ---------------------------------------------------------------------------
# 12. f_efield
# ---------------------------------------------------------------------------

SKILL_EFIELD = "Цахилгаан орны хүчлэг"
PARTICLES_SMALL = ["тоосны ширхэг", "тосны дусал", "цэнэгтэй бөмбөлөг", "хөвөнгийн ширхэг"]
POSITIONS = [("баруун талд", (1, 0)), ("зүүн талд", (-1, 0)), ("дээд талд", (0, 1)), ("доод талд", (0, -1))]
PLANE_LABELS = {(1, 0): "Баруун тийш", (-1, 0): "Зүүн тийш", (0, 1): "Дээш", (0, -1): "Доош", (0, 0): "Тэгтэй тэнцүү"}
PAIR_CHARGES = [("+q", 1), ("−q", -1), ("+2q", 2), ("−2q", -2)]
DISTANCE_CHANGES = [("2 дахин хол", Fraction(2)), ("3 дахин хол", Fraction(3)), ("4 дахин хол", Fraction(4)),
                    ("2 дахин ойр", Fraction(1, 2)), ("3 дахин ойр", Fraction(1, 3))]
CHARGE_CHANGES = [("", Fraction(1)), ("цэнэгийг 2 дахин ихэсгэвэл", Fraction(2)), ("цэнэгийг 4 дахин ихэсгэвэл", Fraction(4)),
                  ("цэнэгийг 2 дахин багасгавал", Fraction(1, 2)), ("цэнэгийг 9 дахин ихэсгэвэл", Fraction(9))]


@lru_cache(maxsize=None)
def efield_versions() -> tuple:
    groups = {name: [] for name in ("e_from_f", "f_from_e", "point", "point_q", "change", "accel", "accel_e", "dir_point",
                                    "dir_pair")}
    for force in (1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 40, 60):
        for charge in (1, 2, 3, 4, 5, 6, 8, 10, 12, 20):
            field = Fraction(force, charge)
            if clean(field) and field >= Fraction(1, 5):
                for small in (True, False):
                    groups["e_from_f"].append(("e_from_f", force, charge, small, field))
    for field in (1, 2, 4, 5, 10, 20, 25, 40, 50, 100, 200):
        for charge in ("0.5", "1", "2", "3", "4", "5", "8", "10", "20"):
            groups["f_from_e"].append(("f_from_e", field, given(charge), field * given(charge)))
    for charge in (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 18, 20):
        for distance in (1, 2, 3, 4, 5, 6, 10, 15, 20, 30):
            field = Fraction(90 * charge, distance * distance)
            if clean(field) and field >= Fraction(1, 10):
                groups["point"].append(("point", charge, distance, field))
                groups["point_q"].append(("point_q", charge, distance, field))
    for (d_text, d_factor), (q_text, q_factor) in itertools.product(DISTANCE_CHANGES, CHARGE_CHANGES):
        factor = q_factor / (d_factor * d_factor)
        if factor_text(factor):
            groups["change"].append(("change", d_text, d_factor, q_text, q_factor, factor))
    for index, (mass, charge, field) in enumerate(itertools.product((1, 2, 4, 5, 10, 20), (1, 2, 4, 5, 10), (1, 2, 5, 10, 20, 50))):
        accel = Fraction(charge * field, mass)
        if clean(accel) and Fraction(1, 10) <= accel <= 500:
            groups["accel"].append(("accel", PARTICLES_SMALL[index % len(PARTICLES_SMALL)], mass, charge, field, accel))
    for particle, specific in (("Электрон", Fraction(176, 100) * 10 ** 11), ("Протон", Fraction(96, 10) * 10 ** 7)):
        for field in (10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000):
            accel = specific * field
            if sci_clean(accel):
                groups["accel_e"].append(("accel_e", particle, specific, field, accel))
    for sign in (1, -1):
        for position, vector in POSITIONS:
            for asked in ("field", "electron"):
                groups["dir_point"].append(("dir_point", sign, position, vector, asked))
    for (text1, q1), (text2, q2) in itertools.product(PAIR_CHARGES, repeat=2):
        if q1 == q2 and abs(q1) == 2:
            continue
        for asked in ("field", "electron"):
            groups["dir_pair"].append(("dir_pair", text1, q1, text2, q2, asked))
    return grouped(groups, 1212, {"e_from_f": 25, "f_from_e": 25, "point": 30, "point_q": 15, "change": 25, "accel": 20,
                                  "accel_e": 15, "dir_point": 16, "dir_pair": 20})


def f_efield(rng: random.Random, year: int, k: int) -> dict:
    version = efield_versions()[k % len(efield_versions())]
    kind = version[0]
    skill = SKILL_EFIELD
    if kind == "e_from_f":
        _, force, charge, small, field = version
        f_unit, q_unit = ("мкН", "нКл") if small else ("мН", "мкКл")
        prompt = (f"Цахилгаан оронд байрлуулсан {charge} {q_unit} цэгэн цэнэгт {force} {f_unit} хүч үйлчилж байна. Тухайн "
                  "цэг дээрх цахилгаан орны хүчлэгийг ол.")
        answer = unit_text(field, "кН/Кл")
        wrong = nw(answer, "кН/Кл", [Fraction(force * charge), Fraction(charge, force), field * 1000, field / 1000, field * 10])
        power = "10⁻⁶/10⁻⁹" if small else "10⁻³/10⁻⁶"
        solution = f"E = F/q = {force}·{power} Н/Кл = {num(field)}·10³ Н/Кл = {num(field)} кН/Кл."
    elif kind == "f_from_e":
        _, field, charge, force = version
        prompt = f"Хүчлэг нь {field} кН/Кл цахилгаан оронд {num(charge)} нКл цэнэг байрлуулав. Цэнэгт үйлчлэх хүчийг ол."
        answer = unit_text(force, "мкН")
        wrong = nw(answer, "мкН", [Fraction(field) / charge, charge / field, force * 1000, force / 1000, force * 10])
        solution = f"F = qE = {num(charge)}·10⁻⁹ Кл·{field}·10³ Н/Кл = {num(force)}·10⁻⁶ Н = {num(force)} мкН."
    elif kind in ("point", "point_q"):
        _, charge, distance, field = version
        if kind == "point":
            prompt = (f"{charge} нКл цэгэн цэнэгээс {distance} см зайд орших цэг дээрх цахилгаан орны хүчлэгийг ол. "
                      "k = 9·10⁹ Н·м²/Кл².")
            answer = unit_text(field, "кН/Кл")
            wrong = nw(answer, "кН/Кл", [Fraction(90 * charge, distance), field * 100, field / 100, field * 2, field / 2])
            solution = (f"E = kq/r² = 9·10⁹·{charge}·10⁻⁹/(0.{distance:02d})² Н/Кл" if distance < 100 else "")
            solution = (f"E = kq/r² = 9·10⁹·{charge}·10⁻⁹/({num(Fraction(distance, 100))})² Н/Кл = "
                        f"{num(field * 1000)} Н/Кл = {num(field)} кН/Кл.")
        else:
            prompt = (f"Цэгэн цэнэгээс {distance} см зайд орших цэг дээрх цахилгаан орны хүчлэг {num(field)} кН/Кл байв. "
                      "Цэнэгийн хэмжээг ол. k = 9·10⁹ Н·м²/Кл².")
            answer = unit_text(charge, "нКл")
            wrong = nw(answer, "нКл", [Fraction(charge * distance), Fraction(charge, distance), Fraction(charge * 10),
                                       Fraction(charge, 10)])
            solution = (f"E = kq/r² тул q = Er²/k = {num(field * 1000)}·({num(Fraction(distance, 100))})²/(9·10⁹) Кл = "
                        f"{charge}·10⁻⁹ Кл = {charge} нКл.")
    elif kind == "change":
        _, d_text, d_factor, q_text, q_factor, factor = version
        prompt = (f"Цэгэн цэнэгийн орны хүчлэгийг тодорхой цэгт хэмжив. Хэмжих цэгийг цэнэгээс {d_text} "
                  + (f"зайд шилжүүлж, {q_text}" if q_text else "зайд шилжүүлбэл")
                  + " орны хүчлэг хэрхэн өөрчлөгдөх вэ?")
        answer = factor_text(factor)
        return {
            "skill": skill,
            "prompt": prompt,
            "answer": answer,
            "wrong": factor_wrongs(factor, [q_factor / d_factor, d_factor * d_factor, 1 / d_factor, q_factor]),
            "rank": False,
            "solution": (f"E = kq/r². Зай {ratio(d_factor)} дахин, цэнэг {ratio(q_factor)} дахин үржигдэхэд "
                         f"E' = E·{ratio(q_factor)}/({ratio(d_factor)})² = {ratio(factor)}·E: {answer.lower()}."),
        }
    elif kind == "accel":
        _, particle, mass, charge, field, accel = version
        prompt = (f"Масс нь {mass} мг, цэнэг нь {charge} нКл {particle} хүчлэг нь {field} кН/Кл нэгэн төрлийн цахилгаан "
                  "оронд байна. Цахилгаан хүчний үйлчлэлээр олж авах хурдатгалыг ол (хүндийн хүчийг тооцохгүй).")
        answer = unit_text(accel, "м/с²")
        wrong = nw(answer, "м/с²", [accel * 1000, accel / 1000, Fraction(mass * field, charge), accel * 10, accel / 10])
        solution = (f"a = F/m = qE/m = {charge}·10⁻⁹ Кл·{field}·10³ Н/Кл/({mass}·10⁻⁶ кг) = {num(accel)} м/с².")
    elif kind == "accel_e":
        _, particle, specific, field, accel = version
        prompt = (f"{particle} хүчлэг нь {field} Н/Кл нэгэн төрлийн цахилгаан оронд хөдөлж байна. Түүний хурдатгалыг ол. "
                  f"Бөөмийн цэнэг ба массын харьцаа e/m = {sci_exact(specific, 'e/m')} Кл/кг.")
        answer = sci_exact(accel, "a") + " м/с²"
        wrong = [text + " м/с²" for text in spread(accel, [accel * 10, accel / 10, specific / field], sci_text, rng)]
        solution = f"a = eE/m = (e/m)·E = {sci_exact(specific, 'e/m')}·{field} = {answer}."
    elif kind == "dir_point":
        _, sign, position, vector, asked = version
        field_vector = vector if sign > 0 else (-vector[0], -vector[1])
        result = field_vector if asked == "field" else (-field_vector[0], -field_vector[1])
        answer = PLANE_LABELS[result]
        sign_text = "Эерэг" if sign > 0 else "Сөрөг"
        if asked == "field":
            prompt = f"{sign_text} цэгэн цэнэгийн {position} орших A цэг дээрх цахилгаан орны хүчлэгийн вектор хаашаа чиглэх вэ?"
        else:
            prompt = f"{sign_text} цэгэн цэнэгийн {position} орших A цэгт электрон байрлуулав. Электронд үйлчлэх цахилгаан хүч хаашаа чиглэх вэ?"
        return text_item(
            skill, prompt, answer, list(PLANE_LABELS.values()),
            ("Эерэг цэнэгийн орны хүчлэг цэнэгээс холдох, сөрөг цэнэгийнх цэнэг рүү чиглэнэ. "
             + ("Электрон сөрөг цэнэгтэй тул түүнд үйлчлэх хүч хүчлэгийн эсрэг чиглэнэ. " if asked == "electron" else "")
             + f"Хариу: {answer.lower()}."),
            rng,
        )
    else:
        _, text1, q1, text2, q2, asked = version
        total = q1 - q2  # field at the midpoint in units of kq/(d/2)², positive to the right
        field_vector = (1 if total > 0 else -1 if total < 0 else 0, 0)
        result = field_vector if asked == "field" else (-field_vector[0], 0)
        answer = PLANE_LABELS[result]
        lead = (f"Хэвтээ шулуун дээр зүүн талд нь {text1}, баруун талд нь {text2} цэгэн цэнэг байрлана. Тэдгээрийн яг "
                "дунд орших цэг дээр")
        prompt = lead + (" цахилгаан орны хүчлэг хаашаа чиглэх вэ?" if asked == "field"
                         else " электрон байрлуулбал түүнд үйлчлэх хүч хаашаа чиглэх вэ?")
        return text_item(
            skill, prompt, answer, list(PLANE_LABELS.values()),
            ("Дунд цэгт зүүн цэнэгийн орон эерэг бол баруун тийш, сөрөг бол зүүн тийш; баруун цэнэгийнх эерэг бол зүүн "
             f"тийш, сөрөг бол баруун тийш чиглэнэ. Баруун тийш чиглэсэн нийлбэр ∝ ({num(q1)}) − ({num(q2)}) = {num(total)}. "
             + ("Электронд үйлчлэх хүч хүчлэгийн эсрэг. " if asked == "electron" else "") + f"Хариу: {answer.lower()}."),
            rng,
        )
    return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 13. f_induction
# ---------------------------------------------------------------------------

SKILL_INDUCTION = "Цахилгаан соронзон индукц"
FLUX_ANGLES = [
    ("Соронзон индукцийн шугам хүрээний хавтгайд перпендикуляр байна", Fraction(1), "α = 0°, cos 0° = 1"),
    ("Соронзон индукцийн вектор хүрээний нормальтай 60° өнцөг үүсгэнэ", Fraction(1, 2), "α = 60°, cos 60° = 0.5"),
    ("Соронзон индукцийн вектор хүрээний хавтгайтай 30° өнцөг үүсгэнэ", Fraction(1, 2), "нормальтай α = 60°, cos 60° = 0.5"),
]
AREAS = [("20 см²", "0.002"), ("40 см²", "0.004"), ("50 см²", "0.005"), ("100 см²", "0.01"), ("200 см²", "0.02"),
         ("400 см²", "0.04"), ("500 см²", "0.05"), ("0.1 м²", "0.1"), ("0.2 м²", "0.2"), ("0.5 м²", "0.5")]
LENZ_FORCE = ["Түлхэлцэнэ: ороомгийн соронз руу харсан үзүүр N туйл болно",
              "Таталцана: ороомгийн соронз руу харсан үзүүр S туйл болно",
              "Таталцана: ороомгийн соронз руу харсан үзүүр N туйл болно",
              "Түлхэлцэнэ: ороомгийн соронз руу харсан үзүүр S туйл болно",
              "Харилцан үйлчлэхгүй: индукцийн гүйдэл үүсэхгүй"]
LENZ_SENSE = ["Цагийн зүүний эсрэг", "Цагийн зүүний дагуу", "Индукцийн гүйдэл үүсэхгүй",
              "Эхлээд цагийн зүүний дагуу, дараа нь эсрэг", "Ороомгийн тэнхлэгийн дагуу"]
RING_POOL = ["Соронзоос холдож түлхэгдэнэ", "Соронзыг дагаж татагдана", "Хөдлөхгүй", "Тэнхлэгээ тойрон эргэнэ",
             "Дээш өргөгдөнө"]
COIL_POOL = ["Үүснэ, 1-р ороомгийн гүйдлийн эсрэг чиглэлтэй", "Үүснэ, 1-р ороомгийн гүйдэлтэй ижил чиглэлтэй",
             "Үүсэхгүй", "Үүснэ, чиглэл нь ээлжлэн өөрчлөгдөнө", "Үүснэ, хэмжээ нь тогтмол хэвээр байна"]
COIL_CASES = [
    ("1-р ороомгийн хэлхээг залгах агшинд", 0, "гүйдэл (ба урсгал) ихсэх тул индукцийн гүйдэл эсрэг чиглэлтэй"),
    ("1-р ороомгийн хэлхээг салгах агшинд", 1, "урсгал багасах тул индукцийн гүйдэл ижил чиглэлтэй"),
    ("1-р ороомгоор тогтмол гүйдэл гүйж байх үед", 2, "урсгал өөрчлөгдөхгүй тул индукцийн гүйдэл үүсэхгүй"),
    ("1-р ороомгийн гүйдлийг реостатаар ихэсгэх үед", 0, "урсгал ихсэх тул индукцийн гүйдэл эсрэг чиглэлтэй"),
    ("1-р ороомгийн гүйдлийг реостатаар багасгах үед", 1, "урсгал багасах тул индукцийн гүйдэл ижил чиглэлтэй"),
]


@lru_cache(maxsize=None)
def induction_versions() -> tuple:
    groups = {name: [] for name in ("flux", "emf_flux", "emf_field", "lenz")}
    for (area_text, area), b_value, angle in itertools.product(AREAS, ("0.1", "0.2", "0.4", "0.5", "0.8", "1", "1.2", "2"),
                                                               range(len(FLUX_ANGLES))):
        flux = given(area) * given(b_value) * FLUX_ANGLES[angle][1]
        groups["flux"].append(("flux", area_text, area, b_value, angle, flux))
    for turns in (1, 10, 20, 50, 100, 200, 500):
        for start, end in ((2, 6), (8, 2), (10, 0), (5, 15), (12, 4), (3, 9), (20, 5), (1, 4)):
            for dt in ("0.01", "0.02", "0.05", "0.1", "0.2", "0.5", "1", "2"):
                emf = turns * Fraction(abs(end - start), 1000) / given(dt)
                if clean(emf) and Fraction(1, 10) <= emf <= 500:
                    groups["emf_flux"].append(("emf_flux", turns, start, end, dt, emf))
    for turns in (10, 50, 100, 200, 500):
        for area_text, area in AREAS[:7]:
            for (b1, b2), dt in itertools.product((("0.1", "0.5"), ("0.6", "0.2"), ("0", "0.4"), ("1", "0"), ("0.2", "0.8")),
                                                  ("0.01", "0.02", "0.05", "0.1", "0.2", "0.5")):
                emf = turns * given(area) * abs(given(b2) - given(b1)) / given(dt)
                if clean(emf) and Fraction(1, 10) <= emf <= 500:
                    groups["emf_field"].append(("emf_field", turns, area_text, area, b1, b2, dt, emf))
    for pole in ("N", "S"):
        for motion in ("approach", "recede", "rest"):
            for coil in ("ороомог", "гальванометрт холбосон ороомог"):
                groups["lenz"].append(("lenz_force", pole, motion, coil))
                groups["lenz"].append(("lenz_sense", pole, motion, coil))
        for motion in ("approach", "recede"):
            for ring in ("solid", "cut"):
                groups["lenz"].append(("ring", pole, motion, ring))
    groups["lenz"] += [("coils", index) for index in range(len(COIL_CASES))]
    return grouped(groups, 1313, {"flux": 50, "emf_flux": 45, "emf_field": 45, "lenz": 37})


def flux_text(value: Fraction) -> tuple[str, str, Fraction]:
    if value >= Fraction(1, 10):
        return "Вб", unit_text(value, "Вб"), Fraction(1)
    if value * 1000 >= Fraction(1, 10):
        return "мВб", unit_text(value * 1000, "мВб"), Fraction(1000)
    return "мкВб", unit_text(value * 10 ** 6, "мкВб"), Fraction(10 ** 6)


def f_induction(rng: random.Random, year: int, k: int) -> dict:
    version = induction_versions()[k % len(induction_versions())]
    kind = version[0]
    skill = SKILL_INDUCTION
    if kind == "flux":
        _, area_text, area, b_value, angle, flux = version
        angle_text, cosine, angle_note = FLUX_ANGLES[angle]
        unit, answer, scale = flux_text(flux)
        prompt = (f"Талбай нь {area_text} хавтгай хүрээ B = {b_value} Тл индукцтэй нэгэн төрлийн соронзон оронд байрлана. "
                  f"{angle_text}. Хүрээг нэвтлэх соронзон урсгалыг ол.")
        value = flux * scale
        base = given(area) * given(b_value) * scale
        wrong = nw(answer, unit, [base if cosine != 1 else base / 2, value * 10, value / 10, value * 100, value * 3], 3)
        solution = f"Φ = BS·cos α ({angle_note}) = {b_value} Тл·{area} м²·{num(cosine)} = {answer}."
    elif kind == "emf_flux":
        _, turns, start, end, dt, emf = version
        coil = "Хүрээг" if turns == 1 else f"{turns} ороодостой ороомгийг"
        prompt = (f"{coil} нэвтлэх соронзон урсгал {dt} с-ийн дотор {start} мВб-аас {end} мВб хүртэл жигд өөрчлөгдөв. "
                  "Үүсэх индукцийн ЦХХ-ийг ол.")
        unit, value = ("В", emf) if emf >= 1 else ("мВ", emf * 1000)
        scale = Fraction(1) if unit == "В" else Fraction(1000)
        answer = unit_text(value, unit)
        delta = Fraction(abs(end - start), 1000)
        wrong = nw(answer, unit, [value / turns if turns > 1 else value * 10, delta * given(dt) * turns * scale,
                                  Fraction(end + start, 1000) * turns / given(dt) * scale, value * 1000, value / 1000])
        solution = (f"ε = N|ΔΦ|/Δt = {turns}·{abs(end - start)}·10⁻³ Вб/{dt} с = {num(emf)} В"
                    + (f" = {num(value)} мВ." if unit == "мВ" else "."))
    elif kind == "emf_field":
        _, turns, area_text, area, b1, b2, dt, emf = version
        prompt = (f"Талбай нь {area_text}, {turns} ороодостой ороомог түүний хавтгайд перпендикуляр соронзон оронд байрлана. "
                  f"Соронзон орны индукц {dt} с-ийн дотор {b1} Тл-оос {b2} Тл хүртэл жигд өөрчлөгдөв. Ороомогт үүсэх "
                  "индукцийн ЦХХ-ийг ол.")
        unit, value = ("В", emf) if emf >= 1 else ("мВ", emf * 1000)
        scale = Fraction(1) if unit == "В" else Fraction(1000)
        answer = unit_text(value, unit)
        wrong = nw(answer, unit, [value / turns, (given(b1) + given(b2)) * given(area) * turns / given(dt) * scale,
                                  value * 10000 / 10000 * 100, value / 100, value * 2])
        solution = (f"ε = N·S·|ΔB|/Δt = {turns}·{area} м²·{num(abs(given(b2) - given(b1)))} Тл/{dt} с = {num(emf)} В"
                    + (f" = {num(value)} мВ." if unit == "мВ" else "."))
    elif kind in ("lenz_force", "lenz_sense"):
        _, pole, motion, coil = version
        pole_text = "хойд (N)" if pole == "N" else "өмнөд (S)"
        motion_text = {"approach": "ойртуулав", "recede": "холдуулав", "rest": "хөдөлгөөнгүй байлгав"}[motion]
        lead = f"Тогтмол соронзыг {pole_text} туйлаар нь {coil} руу харуулан {motion_text}."
        if motion == "rest":
            face = None
        else:
            # The induced field opposes the change: approaching repels (same pole faces the magnet), receding attracts.
            face = pole if motion == "approach" else ("S" if pole == "N" else "N")
        if kind == "lenz_force":
            prompt = lead + " Ороомог ба соронз хоорондоо хэрхэн харилцан үйлчлэх вэ?"
            if face is None:
                answer = LENZ_FORCE[4]
            elif motion == "approach":
                answer = LENZ_FORCE[0] if face == "N" else LENZ_FORCE[3]
            else:
                answer = LENZ_FORCE[1] if face == "S" else LENZ_FORCE[2]
            pool = LENZ_FORCE
        else:
            prompt = lead + " Соронзны талаас харахад ороомог дахь индукцийн гүйдэл аль чиглэлд гүйх вэ?"
            answer = LENZ_SENSE[2] if face is None else (LENZ_SENSE[0] if face == "N" else LENZ_SENSE[1])
            pool = LENZ_SENSE
        solution = ("Ленцийн дүрэм: индукцийн гүйдэл өөрийг нь үүсгэсэн соронзон урсгалын өөрчлөлтийг эсэргүүцнэ. "
                    + ("Урсгал өөрчлөгдөхгүй тул гүйдэл үүсэхгүй." if face is None else
                       f"Ороомгийн соронз руу харсан үзүүр {face} туйл болно ({'түлхэлцэнэ' if motion == 'approach' else 'таталцана'}); "
                       "гадагш (харагч руу) чиглэсэн орон цагийн зүүний эсрэг гүйдлээр, дотогш чиглэсэн орон цагийн зүүний "
                       f"дагуу гүйдлээр үүснэ. Хариу: {answer[0].lower() + answer[1:]}."))
        return text_item(skill, prompt, answer, pool, solution, rng)
    elif kind == "ring":
        _, pole, motion, ring = version
        pole_text = "хойд (N)" if pole == "N" else "өмнөд (S)"
        ring_text = "бүтэн" if ring == "solid" else "зүсэлттэй (тасархай)"
        verb = "ойртуулбал" if motion == "approach" else "холдуулбал"
        answer = RING_POOL[2] if ring == "cut" else (RING_POOL[0] if motion == "approach" else RING_POOL[1])
        return text_item(
            skill,
            (f"Утсаар өлгөсөн {ring_text} хөнгөн цагаан цагирагийн тэнхлэгийн дагуу тогтмол соронзыг {pole_text} туйлаар нь "
             f"цагираг руу харуулан {verb} цагираг хэрхэн хөдлөх вэ?"),
            answer, RING_POOL,
            ("Зүсэлттэй цагирагт хүрээ битүү биш тул индукцийн гүйдэл гүйхгүй, цагираг хөдлөхгүй." if ring == "cut" else
             "Ленцийн дүрмээр индукцийн гүйдэл урсгалын өөрчлөлтийг эсэргүүцнэ: ойртоход цагираг түлхэгдэж, холдоход "
             f"соронзыг дагана (туйлаас үл хамаарна). Хариу: {answer.lower()}."),
            rng,
        )
    else:
        _, index = version
        case, answer_index, reason = COIL_CASES[index]
        answer = COIL_POOL[answer_index]
        return text_item(
            skill,
            f"Нэг төмөр зүрхэн дээр хоёр ороомог ороожээ. {case} 2-р ороомогт индукцийн гүйдэл үүсэх үү?",
            answer, COIL_POOL,
            f"Ленцийн дүрэм: индукцийн гүйдэл соронзон урсгалын өөрчлөлтийг эсэргүүцнэ. Энд {reason}.",
            rng,
        )
    return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 14. w_echo
# ---------------------------------------------------------------------------

SKILL_ECHO = "Дууны цуурай"
AIR_PLACES = ["хадан хананы", "барилгын хананы", "хавцлын эсрэг хананы", "хадан цохионы", "ойн захын"]


def echo_wavelength(speed, frequency, unit):
    """The wavelength in см (or мм below 1 см) when it prints with at most two decimals, else None."""
    wavelength = speed / (Fraction(frequency) * (1000 if unit == "кГц" else 10 ** 6))
    if wavelength >= Fraction(1, 100) and clean(wavelength * 100):
        return wavelength * 100, "см"
    if clean(wavelength * 1000):
        return wavelength * 1000, "мм"
    return None


@lru_cache(maxsize=None)
def echo_versions() -> tuple:
    groups = {name: [] for name in ("air_s", "sea_h", "air_t", "sea_t", "speed", "lambda", "bat")}
    for index, t in enumerate(("0.5", "1", "1.5", "2", "2.5", "3", "4", "5", "6", "0.8", "1.2", "1.6", "2.4")):
        for place_index in range(len(AIR_PLACES)):
            groups["air_s"].append(("air_s", AIR_PLACES[(place_index + index) % len(AIR_PLACES)], given(t)))
    for t in ("0.2", "0.4", "0.6", "0.8", "1", "1.2", "1.6", "2", "2.4", "3", "4", "5", "6", "8"):
        for device in ("Хөлөг онгоцны эхолот (цуурай хэмжигч)", "Судалгааны хөлөг онгоцны хэт авиан төхөөрөмж"):
            groups["sea_h"].append(("sea_h", device, given(t)))
    for distance in (34, 51, 68, 85, 102, 170, 255, 340, 425, 510, 680, 850, 1020):
        groups["air_t"].append(("air_t", AIR_PLACES[distance % len(AIR_PLACES)], distance))
    for depth in (150, 300, 450, 600, 750, 900, 1200, 1500, 2250, 3000, 3750, 4500, 6000):
        groups["sea_t"].append(("sea_t", depth))
    for medium, speed in (("усанд", 1500), ("агаарт", 340), ("далайн усанд", 1530), ("ган төмөр замын төмөрт", 5000)):
        for t in ("0.2", "0.4", "0.5", "1", "2", "4"):
            distance = speed * given(t) / 2
            if clean(distance):
                groups["speed"].append(("speed", medium, speed, given(t), distance))
    for medium, speed, label in (("усанд", 1500, "water"), ("агаарт", 340, "air")):
        for frequency in (20, 25, 30, 40, 50, 60, 75, 100, 120, 150, 200, 250, 500):
            if echo_wavelength(speed, frequency, "кГц") is not None:
                groups["lambda"].append(("lambda", medium, speed, frequency, "кГц"))
    for frequency in ("1", "1.5", "2", "2.5", "3", "5"):
        groups["lambda"].append(("lambda", "биеийн зөөлөн эдэд", 1500, given(frequency), "МГц"))
    for ms in (5, 10, 15, 20, 25, 30, 40, 50, 60):
        groups["bat"].append(("bat", ms))
    return grouped(groups, 1414, {"air_s": 40, "sea_h": 28, "air_t": 13, "sea_t": 13, "speed": 20, "lambda": 32, "bat": 9})


def w_echo(rng: random.Random, year: int, k: int) -> dict:
    version = echo_versions()[k % len(echo_versions())]
    kind = version[0]
    if kind == "air_s":
        _, place, t = version
        distance = 340 * t / 2
        prompt = (f"Хүн {place} өмнө зогсож алгаа ташихад {num(t)} с-ийн дараа цуурай сонсогдов. Хүнээс хана хүртэлх зайг ол. "
                  "Агаар дахь дууны хурд 340 м/с.").replace("хана хүртэлх", "саад хүртэлх")
        answer = unit_text(distance, "м")
        wrong = nw(answer, "м", [340 * t, 340 / t, distance / 2, distance * 4])
        solution = f"Дуу саад хүртэл очоод буцаж ирнэ: 2s = vt, s = vt/2 = 340·{num(t)}/2 = {num(distance)} м."
    elif kind == "sea_h":
        _, device, t = version
        depth = 1500 * t / 2
        prompt = (f"{device} усан доош хэт авианы дохио илгээхэд далайн ёроолоос ойсон дохио {num(t)} с-ийн дараа буцаж ирэв. "
                  "Далайн гүнийг ол. Усан дахь дууны хурд 1500 м/с.")
        answer = unit_text(depth, "м")
        wrong = nw(answer, "м", [1500 * t, 340 * t / 2, depth / 2, depth * 4])
        solution = f"h = vt/2 = 1500·{num(t)}/2 = {num(depth)} м."
    elif kind == "air_t":
        _, place, distance = version
        t = Fraction(2 * distance, 340)
        prompt = (f"Хүн {place} өмнө {distance} м зайд зогсож хашгирав. Цуурай хэдэн секундийн дараа сонсогдох вэ? "
                  "Агаар дахь дууны хурд 340 м/с.")
        answer = unit_text(t, "с")
        wrong = nw(answer, "с", [Fraction(distance, 340), Fraction(distance, 170 * 4), t * 2, t * 10], 3)
        solution = f"t = 2s/v = 2·{distance}/340 = {num(t)} с."
    elif kind == "sea_t":
        _, depth = version
        t = Fraction(2 * depth, 1500)
        prompt = (f"Далайн гүн {depth} м. Хөлөг онгоцны эхолотын илгээсэн хэт авианы дохио ёроолоос ойж хэдэн секундийн "
                  "дараа буцаж ирэх вэ? Усан дахь дууны хурд 1500 м/с.")
        answer = unit_text(t, "с")
        wrong = nw(answer, "с", [Fraction(depth, 1500), Fraction(2 * depth, 340), t * 2, t * 10], 3)
        solution = f"t = 2h/v = 2·{depth}/1500 = {num(t)} с."
    elif kind == "speed":
        _, medium, speed, t, distance = version
        prompt = (f"{medium.capitalize()} илгээсэн дууны дохио {num(distance)} м зайд орших саадаас ойж {num(t)} с-ийн дараа "
                  "буцаж ирэв. Энэ орчин дахь дууны хурдыг ол.")
        answer = unit_text(speed, "м/с")
        wrong = nw(answer, "м/с", [distance / t, distance * t, Fraction(speed * 2), Fraction(speed, 4)])
        solution = f"v = 2s/t = 2·{num(distance)}/{num(t)} = {speed} м/с."
    elif kind == "lambda":
        _, medium, speed, frequency, unit = version
        shown, w_unit = echo_wavelength(speed, frequency, unit)
        prompt = (f"{num(frequency)} {unit} давтамжтай хэт авиа {medium} {speed} м/с хурдтай тархана. Хэт авианы долгионы "
                  "уртыг ол.")
        answer = unit_text(shown, w_unit)
        wrong = nw(answer, w_unit, [shown * 10, shown / 10, shown * 2, shown / 2, shown * 4], 3)
        solution = f"λ = v/f = {speed}/({num(frequency)}·10{'³' if unit == 'кГц' else '⁶'}) м = {answer}."
    else:
        _, ms = version
        distance = Fraction(340 * ms, 2000)
        prompt = (f"Сарьсан багваахайн цацруулсан хэт авиа шавьжнаас ойж {ms} мс-ийн дараа буцаж ирэв. Шавьж хүртэлх зайг ол. "
                  "Агаар дахь дууны хурд 340 м/с.")
        answer = unit_text(distance, "м")
        wrong = nw(answer, "м", [distance * 2, distance * 1000, distance / 10, distance * 10])
        solution = f"s = vt/2 = 340·{ms}·10⁻³/2 = {num(distance)} м."
    return {"skill": SKILL_ECHO, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 15. w_doppler
# ---------------------------------------------------------------------------

SKILL_DOPPLER = "Дууны Доплерын үзэгдэл"
SOUND_SOURCES = ["Түргэн тусламжийн машин", "Галын машин", "Цагдаагийн машин", "Аврах албаны машин", "Мотоцикль"]
KMH = {10: 36, 15: 54, 20: 72, 25: 90, 30: 108, 40: 144}


def speed_text(value: int, kmh: bool) -> str:
    return f"{KMH[value]} км/ц" if kmh and value in KMH else f"{value} м/с"


@lru_cache(maxsize=None)
def doppler_versions() -> tuple:
    modes = ("src_toward", "src_away", "obs_toward", "obs_away", "both", "find_vs")
    groups = {name + tag: [] for name in modes for tag in ("", "_fast")}
    freqs = (170, 200, 255, 300, 320, 340, 350, 360, 380, 400, 420, 440, 450, 480, 500, 510, 540, 550, 570, 600, 630,
             640, 660, 680, 700, 720, 740, 760, 770, 800, 840, 850, 880, 900, 950, 960, 990, 1000, 1020, 1050, 1080,
             1100, 1140, 1200, 1260, 1320, 1360, 1400, 1440, 1500, 1600, 1700, 2000)
    speeds = (10, 15, 17, 20, 25, 30, 34, 40, 60, 68)
    index = 0
    for f in freqs:
        for u in speeds:
            kmh = index % 3 == 0 and u in KMH
            source = "Өндөр хурдны галт тэрэг" if u > 40 else SOUND_SOURCES[index % len(SOUND_SOURCES)]
            index += 1
            for mode, value in (("src_toward", Fraction(f * 340, 340 - u)), ("src_away", Fraction(f * 340, 340 + u)),
                                ("obs_toward", Fraction(f * (340 + u), 340)), ("obs_away", Fraction(f * (340 - u), 340))):
                tag = "_fast" if u > 40 else ""
                if value.denominator == 1 and 100 <= value <= 3000:
                    groups[mode + tag].append((mode, source, f, u, kmh, value))
                    if mode == "src_toward":
                        groups["find_vs" + tag].append(("find_vs", source, f, u, kmh, value))
            for w in (10, 20, 30, 40):
                value = Fraction(f * (340 + w), 340 - u)
                if value.denominator == 1 and 100 <= value <= 3000:
                    groups["both" + ("_fast" if u > 40 else "")].append(("both", source, f, u, kmh, value, w))
    caps = {"src_toward": 35, "src_away": 30, "obs_toward": 30, "obs_away": 25, "both": 30, "find_vs": 20}
    return grouped(groups, 1515, {name + tag: (6 if tag else caps[name]) for name in modes for tag in ("", "_fast")})


def w_doppler(rng: random.Random, year: int, k: int) -> dict:
    version = doppler_versions()[k % len(doppler_versions())]
    mode, source, f, u, kmh, value = version[:6]
    speed = speed_text(u, kmh)
    note = f" ({speed} = {u} м/с)" if kmh and u in KMH else ""
    tail = " Агаар дахь дууны хурд 340 м/с."
    lower = source[0].lower() + source[1:]
    fast = u > 40
    observer = "галт тэрэгний зорчигчийн" if fast else "автомашины жолоочийн"
    station = (f"Төмөр замын гарам дээрх дуут дохио {f} Гц давтамжтай дуугарч байна." if fast else
               f"Зам дээр зогсож буй {lower} {f} Гц давтамжтай дуут дохио дуугаргаж байна.")
    answer = unit_text(value, "Гц")
    if mode == "src_toward":
        prompt = (f"{source} {f} Гц давтамжтай дуут дохио дуугаргасаар {'гарам дээр' if fast else 'зам дээр'} зогсож буй хүн рүү {speed} хурдтай ойртож "
                  "байна. Хүний сонсох дууны давтамжийг ол." + tail)
        wrong = nw(answer, "Гц", [Fraction(f * (340 + u), 340), Fraction(f * 340, 340 + u), Fraction(f), Fraction(f * (340 - u), 340)])
        solution = f"Эх үүсвэр ойртоход f' = f·v/(v − u){note} = {f}·340/(340 − {u}) = {answer}."
    elif mode == "src_away":
        prompt = (f"{source} {f} Гц давтамжтай дуут дохио дуугаргасаар {'гарам дээр' if fast else 'зам дээр'} зогсож буй хүнээс {speed} хурдтай холдож "
                  "байна. Хүний сонсох дууны давтамжийг ол." + tail)
        wrong = nw(answer, "Гц", [Fraction(f * 340, 340 - u), Fraction(f * (340 - u), 340), Fraction(f), Fraction(f * (340 + u), 340)])
        solution = f"Эх үүсвэр холдоход f' = f·v/(v + u){note} = {f}·340/(340 + {u}) = {answer}."
    elif mode == "obs_toward":
        prompt = (f"{station} Түүн рүү {speed} хурдтай ойртож буй {observer} сонсох дууны давтамжийг ол." + tail)
        wrong = nw(answer, "Гц", [Fraction(f * 340, 340 - u), Fraction(f * (340 - u), 340), Fraction(f), Fraction(f * 340, 340 + u)])
        solution = f"Ажиглагч ойртоход f' = f·(v + u)/v{note} = {f}·(340 + {u})/340 = {answer}."
    elif mode == "obs_away":
        prompt = (f"{station} Түүнээс {speed} хурдтай холдож буй {observer} сонсох дууны давтамжийг ол." + tail)
        wrong = nw(answer, "Гц", [Fraction(f * 340, 340 + u), Fraction(f * (340 + u), 340), Fraction(f), Fraction(f * 340, 340 - u)])
        solution = f"Ажиглагч холдоход f' = f·(v − u)/v{note} = {f}·(340 − {u})/340 = {answer}."
    elif mode == "both":
        w = version[6]
        prompt = (f"{source} {f} Гц давтамжтай дуут дохио дуугаргасаар {speed} хурдтай явж байна. Түүн рүү эсрэг чиглэлээс "
                  f"{w} м/с хурдтай ойртож буй автомашины жолоочийн сонсох дууны давтамжийг ол." + tail)
        wrong = nw(answer, "Гц", [Fraction(f * 340, 340 - u), Fraction(f * (340 + w), 340), Fraction(f),
                                  Fraction(f * (340 - w), 340 + u)])
        solution = f"Хоёулаа ойртоход f' = f·(v + w)/(v − u){note} = {f}·(340 + {w})/(340 − {u}) = {answer}."
    else:
        prompt = (f"{source} {f} Гц давтамжтай дуут дохио дуугаргасаар зогсож буй хүн рүү ойртож байхад хүн {value} Гц "
                  "давтамжтай дуу сонсов. Эх үүсвэрийн хурдыг ол." + tail)
        answer = unit_text(u, "м/с")
        wrong = nw(answer, "м/с", [Fraction(340 * (value - f), f), Fraction(value - f), Fraction(u * 2), Fraction(u, 2)])
        solution = f"f' = f·v/(v − u) тул u = v(1 − f/f') = 340·(1 − {f}/{value}) = {u} м/с."
    return {"skill": SKILL_DOPPLER, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 16. w_sound
# ---------------------------------------------------------------------------

SKILL_SOUND = "Дууны шинж чанар"
SOUND_KIND_POOL = ["Инфра авиа; хүний чих сонсохгүй", "Сонсогдох дуу; хүний чих сонсоно",
                   "Хэт авиа; хүний чих сонсохгүй", "Инфра авиа; хүний чих сонсоно", "Хэт авиа; хүний чих сонсоно"]
SOUND_FREQUENCIES = [("2 Гц", 2), ("5 Гц", 5), ("8 Гц", 8), ("10 Гц", 10), ("12 Гц", 12), ("15 Гц", 15), ("17 Гц", 17),
                     ("25 Гц", 25), ("50 Гц", 50), ("100 Гц", 100), ("250 Гц", 250), ("440 Гц", 440), ("1000 Гц", 1000),
                     ("2.5 кГц", 2500), ("5 кГц", 5000), ("8 кГц", 8000), ("12 кГц", 12000), ("16 кГц", 16000),
                     ("18 кГц", 18000), ("25 кГц", 25000), ("30 кГц", 30000), ("40 кГц", 40000), ("50 кГц", 50000),
                     ("100 кГц", 100000), ("200 кГц", 200000), ("1 МГц", 10 ** 6), ("2 МГц", 2 * 10 ** 6), ("5 МГц", 5 * 10 ** 6)]
SOUND_PERIODS = [("0.5 с", Fraction(1, 2)), ("0.2 с", Fraction(1, 5)), ("0.1 с", Fraction(1, 10)), ("0.08 с", Fraction(2, 25)),
                 ("0.01 с", Fraction(1, 100)), ("0.002 с", Fraction(1, 500)), ("10⁻³ с", Fraction(1, 1000)),
                 ("10⁻⁴ с", Fraction(1, 10000)), ("2·10⁻⁵ с", Fraction(1, 50000)), ("10⁻⁵ с", Fraction(1, 100000)),
                 ("4·10⁻⁵ с", Fraction(1, 25000))]
SOUND_WAVELENGTHS = [("68 м", 68), ("34 м", 34), ("3.4 м", Fraction(34, 10)), ("0.85 м", Fraction(85, 100)),
                     ("0.34 м", Fraction(34, 100)), ("3.4 см", Fraction(34, 1000)), ("8.5 мм", Fraction(85, 10000)),
                     ("3.4 мм", Fraction(34, 10000)), ("1.7 мм", Fraction(17, 10000)), ("6.8 см", Fraction(68, 1000))]
PERCEPTION_POOL = ["Дууны өндөр нэмэгдэнэ (дуу нарийсна)", "Дууны өндөр буурна (дуу бүдүүрнэ)", "Дууны чанга нэмэгдэнэ",
                   "Дууны чанга буурна", "Дууны тембр өөрчлөгдөж, өндөр ба чанга нь хэвээр үлдэнэ"]
QUANTITY_POOL = ["Давтамж ихсэнэ", "Давтамж багасна", "Далайц ихсэнэ", "Далайц багасна", "Агаар дахь тархах хурд ихсэнэ"]
SOUND_CHANGES = [
    ("Гитарын утсыг илүү чангалж татаад цохиход", 0, "утасны таталт ихсэхэд хэлбэлзлийн давтамж ихсэнэ"),
    ("Хөгжмийн зэмсгийн хэлбэлзэх утасны уртыг богиносгоход", 0, "утас богиносоход давтамж ихсэнэ"),
    ("Морин хуурын утсыг суллахад", 1, "утасны таталт багасахад давтамж багасна"),
    ("Лимбийн дуугарах агаарын баганыг уртасгахад", 1, "агаарын багана уртсахад давтамж багасна"),
    ("Камертоны хэлбэлзлийн давтамжийг ихэсгэхэд", 0, "давтамж ихсэхэд дууны өндөр нэмэгдэнэ"),
    ("Дуу гаргагчийн хэлбэлзлийн давтамжийг багасгахад", 1, "давтамж багасахад дууны өндөр буурна"),
    ("Гитарын утсыг илүү хүчтэй татаж тоглоход", 2, "утасны хэлбэлзлийн далайц ихсэнэ"),
    ("Бөмбөрийг илүү хүчтэй цохиход", 2, "мембраны хэлбэлзлийн далайц ихсэнэ"),
    ("Хонхыг сул цохиход", 3, "хэлбэлзлийн далайц багасна"),
    ("Чанга яригчийн мембраны хэлбэлзлийн далайцыг ихэсгэхэд", 2, "далайц ихсэхэд дууны чанга нэмэгдэнэ"),
    ("Дуу гаргагчийн хэлбэлзлийн далайцыг багасгахад", 3, "далайц багасахад дууны чанга буурна"),
    ("Дуучин нарийн, өндөр дуугаар дуулахад", 0, "дууны өндрийг давтамж тодорхойлно"),
]
NOTE_BASES = (110, 128, 160, 192, 200, 220, 240, 256, 300, 320, 330, 384, 400, 440, 480, 500, 512, 600, 640, 660, 800,
              880, 1000, 1024, 1200, 1600)


@lru_cache(maxsize=None)
def sound_versions() -> tuple:
    groups = {name: [] for name in ("frequency", "period", "wavelength", "perception", "quantity", "octave", "octave_n")}
    for text, value in SOUND_FREQUENCIES:
        for form in (0, 1):
            groups["frequency"].append(("frequency", text, value, form))
    for text, value in SOUND_PERIODS:
        groups["period"].append(("period", text, value))
    for text, value in SOUND_WAVELENGTHS:
        groups["wavelength"].append(("wavelength", text, value))
    for index in range(len(SOUND_CHANGES)):
        groups["perception"].append(("perception", index))
        groups["quantity"].append(("quantity", index))
    for base in NOTE_BASES:
        for shift in (1, 2, 3, -1, -2, -3):
            result = Fraction(base) * Fraction(2) ** shift
            if clean(result) and 20 <= result <= 20000:
                groups["octave"].append(("octave", base, shift, result))
                if shift > 0:
                    groups["octave_n"].append(("octave_n", base, shift, result))
    return grouped(groups, 1616, {"frequency": 40, "period": 11, "wavelength": 10, "perception": 12, "quantity": 12,
                                  "octave": 50, "octave_n": 25})


def sound_kind(frequency) -> str:
    if frequency < 20:
        return SOUND_KIND_POOL[0]
    if frequency <= 20000:
        return SOUND_KIND_POOL[1]
    return SOUND_KIND_POOL[2]


RANGE_NOTE = "Хүний чих 20 Гц-ээс 20 000 Гц хүртэлх давтамжтай механик долгионыг сонсоно; 20 Гц-ээс бага бол инфра авиа, 20 000 Гц-ээс их бол хэт авиа."


def w_sound(rng: random.Random, year: int, k: int) -> dict:
    version = sound_versions()[k % len(sound_versions())]
    kind = version[0]
    skill = SKILL_SOUND
    if kind == "frequency":
        _, text, value, form = version
        prompt = (f"Давтамж нь {text} механик долгион аль төрөлд хамаарах вэ?" if form == 0 else
                  f"Агаарт {text} давтамжтай механик долгион тархаж байна. Энэ ямар долгион бөгөөд хүний чих сонсох уу?")
        answer = sound_kind(value)
        return text_item(skill, prompt, answer, SOUND_KIND_POOL, f"{RANGE_NOTE} {text} тул: {answer.lower()}.", rng)
    if kind == "period":
        _, text, period = version
        frequency = 1 / period
        answer = sound_kind(frequency)
        return text_item(skill, f"Хэлбэлзлийн үе нь {text} механик долгион аль төрөлд хамаарах вэ?", answer, SOUND_KIND_POOL,
                         f"f = 1/T = {num(frequency)} Гц. {RANGE_NOTE} Иймд {answer.lower()}.", rng)
    if kind == "wavelength":
        _, text, wavelength = version
        frequency = 340 / Fraction(wavelength)
        answer = sound_kind(frequency)
        return text_item(skill, (f"Агаарт тархах механик долгионы урт {text} бол энэ нь аль төрлийн долгион вэ? Агаар дахь "
                                 "дууны хурд 340 м/с."), answer, SOUND_KIND_POOL,
                         f"f = v/λ = 340/{num(Fraction(wavelength))} = {num(frequency)} Гц. {RANGE_NOTE} Иймд {answer.lower()}.", rng)
    if kind in ("perception", "quantity"):
        _, index = version
        context, effect, reason = SOUND_CHANGES[index]
        if kind == "perception":
            answer = PERCEPTION_POOL[effect]
            prompt = f"{context} сонсогдох дуу хэрхэн өөрчлөгдөх вэ?"
            pool = PERCEPTION_POOL
        else:
            answer = QUANTITY_POOL[effect]
            prompt = f"{context} дууны долгионы аль хэмжигдэхүүн хэрхэн өөрчлөгдөх вэ?"
            pool = QUANTITY_POOL
        return text_item(skill, prompt, answer, pool,
                         f"Дууны өндрийг давтамж, чангыг далайц тодорхойлно. Энд {reason}. Хариу: {answer.lower()}.", rng)
    if kind == "octave":
        _, base, shift, result = version
        prompt = (f"Дууны давтамж {base} Гц. Түүнээс {abs(shift)} октав {'өндөр' if shift > 0 else 'нам'} дууны давтамжийг ол.")
        answer = unit_text(result, "Гц")
        wrong = nw(answer, "Гц", [base * Fraction(2) ** (-shift), base * 2 * shift if shift > 0 else Fraction(base, 2 * abs(shift)),
                                  Fraction(base) * (abs(shift) + 1) if shift > 0 else Fraction(base, abs(shift) + 1) + 1,
                                  Fraction(base), result * 2, result / 2])
        solution = f"Нэг октав өндөр дуу хоёр дахин их давтамжтай: f = {base}·2^({num(shift)}) = {answer}."
        return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    _, base, shift, result = version
    answer = f"{shift} октав"
    wrong = [f"{value} октав" for value in dict.fromkeys([2 ** shift, shift + 1, shift + 2, max(shift - 1, 4), shift * 2 + 1, 5, 6])
             if value != shift][:4]
    return {
        "skill": skill,
        "prompt": f"{base} Гц ба {num(result)} Гц давтамжтай хоёр дууны давтамжийн зай хэдэн октав вэ?",
        "answer": answer,
        "wrong": wrong,
        "rank": False,
        "solution": f"Октав бүрт давтамж хоёр дахин ихсэнэ: {num(result)}/{base} = {2 ** shift} = 2^{shift} тул {shift} октав.",
    }


# ---------------------------------------------------------------------------
# 17. w_em
# ---------------------------------------------------------------------------

SKILL_EM = "Электромагнит долгион"
EM_FREQS = [("150 кГц", 150_000), ("200 кГц", 200_000), ("300 кГц", 300_000), ("500 кГц", 500_000), ("600 кГц", 600_000),
            ("750 кГц", 750_000), ("1 МГц", 10 ** 6), ("1.5 МГц", 1_500_000), ("3 МГц", 3 * 10 ** 6), ("6 МГц", 6 * 10 ** 6),
            ("7.5 МГц", 7_500_000), ("10 МГц", 10 ** 7), ("15 МГц", 15 * 10 ** 6), ("20 МГц", 2 * 10 ** 7),
            ("50 МГц", 5 * 10 ** 7), ("60 МГц", 6 * 10 ** 7), ("75 МГц", 75 * 10 ** 6), ("100 МГц", 10 ** 8),
            ("120 МГц", 12 * 10 ** 7), ("150 МГц", 15 * 10 ** 7), ("200 МГц", 2 * 10 ** 8), ("250 МГц", 25 * 10 ** 7),
            ("500 МГц", 5 * 10 ** 8), ("600 МГц", 6 * 10 ** 8), ("750 МГц", 75 * 10 ** 7), ("1.2 ГГц", 12 * 10 ** 8),
            ("1.5 ГГц", 15 * 10 ** 8), ("2.4 ГГц", 24 * 10 ** 8), ("2.5 ГГц", 25 * 10 ** 8), ("3 ГГц", 3 * 10 ** 9),
            ("5 ГГц", 5 * 10 ** 9), ("6 ГГц", 6 * 10 ** 9), ("10 ГГц", 10 ** 10), ("12 ГГц", 12 * 10 ** 9),
            ("15 ГГц", 15 * 10 ** 9), ("30 ГГц", 3 * 10 ** 10)]
SPECTRUM = ["радио долгион", "бичил (микро) долгион", "хэт улаан туяа", "үзэгдэх гэрэл", "хэт ягаан туяа", "рентген туяа",
            "гамма туяа"]
EXTREMES = [("хамгийн их давтамжтай", "max"), ("хамгийн бага давтамжтай", "min"), ("хамгийн их долгионы урттай", "min"),
            ("хамгийн бага долгионы урттай", "max"), ("фотон нь хамгийн их энергитэй", "max")]
ORDERS = [("долгионы урт нь өсөх", "down"), ("давтамж нь өсөх", "up"), ("фотоны энерги нь буурах", "down"),
          ("долгионы урт нь буурах", "up")]


def em_context(hertz: int) -> str:
    if hertz < 3 * 10 ** 7:
        return "Радио станц"
    if hertz < 3 * 10 ** 8:
        return "Телевиз ба радиогийн станц"
    if hertz in (24 * 10 ** 8, 25 * 10 ** 8):
        return "Богино долгионы зуух"
    if hertz < 5 * 10 ** 9:
        return "Гар утасны сүлжээний станц"
    return "Радиолокатор"


def length_text(metres: Fraction) -> tuple[Fraction, str]:
    if metres >= 1:
        return metres, "м"
    if metres >= Fraction(1, 100):
        return metres * 100, "см"
    return metres * 1000, "мм"


@lru_cache(maxsize=None)
def em_versions() -> tuple:
    groups = {name: [] for name in ("lambda", "freq", "light", "order", "extreme")}
    for text, hertz in EM_FREQS:
        groups["lambda"].append(("lambda", text, hertz))
        groups["freq"].append(("freq", text, hertz))
    for nm in (400, 480, 500, 600, 750):
        groups["light"].append(("light", nm))
    rng = random.Random(1717)
    for combo in itertools.combinations(range(len(SPECTRUM)), 4):
        for asked, direction in ORDERS[:2]:
            while True:
                listing = list(combo)
                rng.shuffle(listing)
                if listing != sorted(listing) and listing != sorted(listing, reverse=True):
                    break
            groups["order"].append(("order", tuple(listing), asked, direction))
    for combo in itertools.combinations(range(len(SPECTRUM)), 5):
        for asked, pick in EXTREMES:
            listing = list(combo)
            rng.shuffle(listing)
            groups["extreme"].append(("extreme", tuple(listing), asked, pick))
    return grouped(groups, 1717, {"lambda": 36, "freq": 30, "light": 5, "order": 45, "extreme": 45})


def w_em(rng: random.Random, year: int, k: int) -> dict:
    version = em_versions()[k % len(em_versions())]
    kind = version[0]
    skill = SKILL_EM
    if kind == "lambda":
        _, text, hertz = version
        shown, unit = length_text(C_LIGHT / hertz)
        prompt = (f"{em_context(hertz)} {text} давтамжтай цахилгаан соронзон долгион цацруулна. Энэ долгионы уртыг ол. "
                  "c = 3·10⁸ м/с.")
        answer = unit_text(shown, unit)
        wrong = nw(answer, unit, [shown * 10, shown / 10, shown * 100, shown / 100, shown * 1000])
        solution = f"λ = c/f = 3·10⁸/({sci_text(hertz)}) м = {answer}."
    elif kind == "freq":
        _, text, hertz = version
        shown, unit = length_text(C_LIGHT / hertz)
        prompt = f"Долгионы урт нь {unit_text(shown, unit)} цахилгаан соронзон долгионы давтамжийг ол. c = 3·10⁸ м/с."
        value, f_unit = text.split()
        value = given(value)
        answer = text
        wrong = nw(answer, f_unit, [value * 10, value / 10, value * 1000, value / 1000, value * 2])
        solution = f"f = c/λ = 3·10⁸/{num(C_LIGHT / hertz)} Гц = {sci_text(hertz)} Гц = {text}."
    elif kind == "light":
        _, nm = version
        hertz = C_LIGHT / (Fraction(nm) / 10 ** 9)
        prompt = f"Долгионы урт нь {nm} нм үзэгдэх гэрлийн давтамжийг ол. c = 3·10⁸ м/с."
        answer = sci_exact(hertz, "f") + " Гц"
        wrong = [text + " Гц" for text in spread(hertz, [hertz * 10, hertz / 10, hertz * 100], sci_text, rng)]
        solution = f"f = c/λ = 3·10⁸/({nm}·10⁻⁹) = {answer}."
    elif kind == "order":
        _, listing, asked, direction = version
        ranked = sorted(listing, reverse=(direction == "down"))
        answer = ", ".join(str(listing.index(item) + 1) for item in ranked)
        reverse = ", ".join(str(listing.index(item) + 1) for item in reversed(ranked))
        others = [", ".join(str(listing.index(item) + 1) for item in perm) for perm in itertools.permutations(listing)]
        others = [text for text in others if text not in (answer, reverse)]
        wrong = [reverse] + rng.sample(others, 3)
        names = ", ".join(f"{index}) {SPECTRUM[item]}" for index, item in enumerate(listing, start=1))
        return {
            "skill": skill,
            "prompt": f"Дараах цахилгаан соронзон цацрагуудыг {asked} дарааллаар байрлуул: {names}.",
            "answer": answer,
            "wrong": wrong,
            "rank": False,
            "solution": ("Давтамж өсөх (долгионы урт буурах) дараалал: радио долгион, бичил долгион, хэт улаан туяа, "
                         "үзэгдэх гэрэл, хэт ягаан туяа, рентген туяа, гамма туяа. Фотоны энерги давтамжтай пропорциональ. "
                         f"Иймд {answer}."),
        }
    else:
        _, listing, asked, pick = version
        best = max(listing) if pick == "max" else min(listing)
        answer = SPECTRUM[best].capitalize()
        names = ", ".join(SPECTRUM[item] for item in listing)
        return {
            "skill": skill,
            "prompt": f"Дараах цацрагуудаас аль нь {asked} вэ: {names}?",
            "answer": answer,
            "wrong": [SPECTRUM[item].capitalize() for item in listing if item != best],
            "rank": False,
            "solution": ("Цахилгаан соронзон долгионы давтамж радио долгионоос гамма туяа хүртэл өснө; долгионы урт эсрэгээр "
                         f"буурна, фотоны энерги hf давтамжтай хамт өснө. Иймд {answer.lower()}."),
        }
    return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 18. p_reflection
# ---------------------------------------------------------------------------

SKILL_REFLECTION = "Гэрлийн ойлт"


def deg(value) -> str:
    return f"{num(value)}°"


@lru_cache(maxsize=None)
def reflection_versions() -> tuple:
    groups = {name: [] for name in ("mirror", "between", "rotate", "plane", "images")}
    for beta in range(10, 85, 5):
        for asked in ("reflection", "between"):
            groups["mirror"].append(("mirror", beta, asked))
    for gamma in range(20, 170, 10):
        for asked in ("incidence", "mirror"):
            groups["between"].append(("between", gamma, asked))
    for alpha in (20, 25, 30, 35, 40, 45, 50):
        for theta in (5, 10, 15, 20):
            if alpha + theta < 90:
                for asked in ("turn", "new"):
                    groups["rotate"].append(("rotate", alpha, theta, asked))
    for d in ("0.5", "1", "1.5", "2", "2.5", "3", "4", "5"):
        groups["plane"].append(("plane_d", given(d)))
        for x in ("0.5", "1", "1.5"):
            if given(x) < given(d):
                groups["plane"].append(("plane_move", given(d), given(x)))
    for v in ("0.5", "1", "1.5", "2", "3"):
        groups["plane"].append(("plane_v", given(v)))
    for x in ("0.2", "0.5", "1", "1.5", "2"):
        groups["plane"].append(("plane_mirror", given(x)))
    for phi in (20, 30, 36, 45, 60, 90):
        groups["images"].append(("images", phi))
        groups["images"].append(("images_phi", phi))
    return grouped(groups, 1818, {"mirror": 30, "between": 30, "rotate": 50, "plane": 40, "images": 12})


def p_reflection(rng: random.Random, year: int, k: int) -> dict:
    version = reflection_versions()[k % len(reflection_versions())]
    kind = version[0]
    skill = SKILL_REFLECTION
    if kind == "mirror":
        _, beta, asked = version
        alpha = 90 - beta
        lead = f"Гэрлийн туяа хавтгай толины гадаргуутай {beta}° өнцөг үүсгэн тусав."
        if asked == "reflection":
            prompt = lead + " Ойлтын өнцгийг ол."
            key = alpha
            candidates = [beta, 2 * alpha, 2 * beta, 180 - 2 * beta if 180 - 2 * beta != key else None]
            solution = f"Тусах өнцгийг нормалаас хэмжинэ: α = 90° − {beta}° = {alpha}°. Ойлтын өнцөг тусах өнцөгтэй тэнцүү: {alpha}°."
        else:
            prompt = lead + " Туссан туяа ба ойсон туяаны хоорондох өнцгийг ол."
            key = 2 * alpha
            candidates = [alpha, 2 * beta, beta, 180 - beta]
            solution = f"α = 90° − {beta}° = {alpha}°; туссан ба ойсон туяаны хоорондох өнцөг 2α = {2 * alpha}°."
        upper = 180
    elif kind == "between":
        _, gamma, asked = version
        alpha = Fraction(gamma, 2)
        lead = f"Хавтгай толинд туссан туяа ба ойсон туяаны хоорондох өнцөг {gamma}° байв."
        if asked == "incidence":
            prompt = lead + " Тусах өнцгийг ол."
            key = alpha
            candidates = [gamma, 90 - alpha if 90 - alpha != alpha else None, Fraction(gamma, 4), 180 - gamma]
            solution = f"Тусах ба ойлтын өнцөг тэнцүү тул α = {gamma}°/2 = {num(alpha)}°."
        else:
            prompt = lead + " Туссан туяа толины гадаргуутай ямар өнцөг үүсгэх вэ?"
            key = 90 - alpha
            candidates = [alpha, gamma, 180 - gamma, 90 - Fraction(gamma, 4)]
            solution = f"α = {gamma}°/2 = {num(alpha)}°; толины гадаргуутай үүсгэх өнцөг 90° − {num(alpha)}° = {num(key)}°."
        upper = 180
    elif kind == "rotate":
        _, alpha, theta, asked = version
        lead = f"Хавтгай толинд гэрлийн туяа {alpha}° тусах өнцгөөр тусав."
        if asked == "turn":
            prompt = lead + f" Туссан туяаны чиглэлийг өөрчлөлгүй толийг {theta}°-аар эргүүлэхэд ойсон туяа хэдэн градусаар эргэх вэ?"
            key = 2 * theta
            candidates = [theta, 4 * theta, alpha + theta, 2 * alpha]
            solution = f"Толь θ өнцгөөр эргэхэд тусах өнцөг θ-аар өөрчлөгдөж, ойсон туяа 2θ = 2·{theta}° = {2 * theta}°-аар эргэнэ."
        else:
            prompt = lead + f" Тусах өнцөг ихсэх чиглэлд толийг {theta}°-аар эргүүлэв. Туссан ба ойсон туяаны хоорондох өнцөг хэд болох вэ?"
            key = 2 * (alpha + theta)
            candidates = [2 * alpha, 2 * alpha + theta, alpha + theta, 2 * (alpha - theta), 2 * alpha + 4 * theta]
            solution = f"Шинэ тусах өнцөг {alpha}° + {theta}° = {alpha + theta}°; туяануудын хоорондох өнцөг 2·{alpha + theta}° = {key}°."
        upper = 180
    elif kind == "images":
        _, phi = version
        count = 360 // phi - 1
        return {
            "skill": skill,
            "prompt": (f"Хоорондоо {phi}° өнцөг үүсгэсэн хоёр хавтгай толины хооронд биет байрлуулав. Биетийн хэдэн дүрс "
                       "харагдах вэ?"),
            "answer": str(count),
            "wrong": [str(value) for value in dict.fromkeys([count + 1, count - 1, count + 2, 2 * count, count + 3]) if value > 0][:4],
            "rank": False,
            "solution": f"Дүрсийн тоо n = 360°/φ − 1 = 360°/{phi}° − 1 = {count}.",
        }
    elif kind == "images_phi":
        _, phi = version
        count = 360 // phi - 1
        prompt = (f"Хоорондоо φ өнцөг үүсгэсэн хоёр хавтгай толины хооронд байрлуулсан биетийн {count} дүрс харагдав. "
                  "Толины хоорондох өнцгийг ол.")
        key = phi
        candidates = [c for c in (Fraction(360, count), Fraction(360, count + 2), Fraction(180, count + 1), 2 * phi)
                      if clean(c, 1)]
        solution = f"n = 360°/φ − 1 тул φ = 360°/(n + 1) = 360°/{count + 1} = {phi}°."
        upper = 180
    else:
        if kind == "plane_d":
            _, d = version
            prompt = f"Хүн хавтгай толиноос {num(d)} м зайд зогсож байна. Хүн ба түүний дүрсийн хоорондох зайг ол."
            answer = unit_text(2 * d, "м")
            wrong = nw(answer, "м", [d, d / 2, 4 * d, 3 * d])
            solution = f"Хавтгай толины дүрс толины ард ижил {num(d)} м зайд үүснэ: хүн ба дүрсийн зай 2·{num(d)} = {answer}."
        elif kind == "plane_move":
            _, d, x = version
            prompt = (f"Хүн хавтгай толиноос {num(d)} м зайд зогсож байв. Тэр толь руу {num(x)} м ойртвол хүн ба түүний "
                      "дүрсийн хоорондох зай хэд болох вэ?")
            answer = unit_text(2 * (d - x), "м")
            wrong = nw(answer, "м", [d - x, 2 * d - x, 2 * d, 2 * (d + x), 2 * d - 4 * x])
            solution = f"Толь хүртэлх шинэ зай {num(d)} − {num(x)} = {num(d - x)} м; хүн ба дүрсийн зай 2·{num(d - x)} = {answer}."
        elif kind == "plane_v":
            _, v = version
            prompt = f"Хүн хавтгай толь руу {num(v)} м/с хурдтай ойртож байна. Хүн өөрийн дүрс рүүгээ ямар хурдтай ойртох вэ?"
            answer = unit_text(2 * v, "м/с")
            wrong = nw(answer, "м/с", [v, v / 2, 4 * v, 3 * v])
            solution = f"Дүрс толь руу мөн {num(v)} м/с хурдтай ойртоно; хүн ба дүрсийн харьцангуй хурд 2·{num(v)} = {answer}."
        else:
            _, x = version
            prompt = (f"Хөдөлгөөнгүй биетийн өмнө байгаа хавтгай толийг биетээс {num(x)} м холдуулав. Биетийн дүрс хэдэн "
                      "метрээр шилжих вэ?")
            answer = unit_text(2 * x, "м")
            wrong = nw(answer, "м", [x, x / 2, 4 * x, 3 * x])
            solution = f"Толь x-ээр холдоход биетээс толь хүртэлх зай x-ээр, дүрс хүртэлх зай 2x-ээр ихэснэ: 2·{num(x)} = {answer}."
        return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    return {
        "skill": skill,
        "prompt": prompt,
        "answer": deg(key),
        "wrong": spread(key, [c for c in candidates if c is not None and c != key], deg, rng, factors=(2,), upper=upper,
                        offsets=(10, 20, 5, 30)),
        "solution": solution,
    }


# ---------------------------------------------------------------------------
# 19. p_lens
# ---------------------------------------------------------------------------

SKILL_LENS = "Линз ба толины дүрс"
LENS_DISTANCES = (6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 28, 30, 35, 36, 40, 45, 48, 50, 60, 70, 75, 80, 90,
                  100, 120, 150, 180, 200, 300)


@lru_cache(maxsize=None)
def lens_versions() -> tuple:
    groups = {name: [] for name in ("f", "F", "d", "D", "G", "h")}
    for d, f in itertools.product(LENS_DISTANCES, repeat=2):
        focal = Fraction(d * f, d + f)
        if focal.denominator != 1 or focal < 4:
            continue
        for device in ("lens", "mirror"):
            groups["f"].append(("f", device, d, f, focal))
            groups["F"].append(("F", device, d, f, focal))
            groups["d"].append(("d", device, d, f, focal))
            if d != f and clean(Fraction(f, d)):
                groups["G"].append(("G", device, d, f, focal))
            for height in (1, 2, 3, 4, 5, 6, 8, 10):
                image = Fraction(height * f, d)
                if d != f and clean(image) and image >= Fraction(1, 2):
                    groups["h"].append(("h", device, d, f, focal, height, image))
        if clean(Fraction(100, focal)):
            groups["D"].append(("D", "lens", d, f, focal))
    return grouped(groups, 1919, {"f": 40, "F": 35, "d": 30, "D": 25, "G": 25, "h": 25})


def p_lens(rng: random.Random, year: int, k: int) -> dict:
    version = lens_versions()[k % len(lens_versions())]
    kind, device, d, f, focal = version[:5]
    lens = device == "lens"
    name = "цуглуулагч линз" if lens else "хотгор толь"
    gen = "цуглуулагч линзний" if lens else "хотгор толины"
    where = "линзний нөгөө талд" if lens else "толины өмнө"
    place = "линзээс" if lens else "толины өмнө"
    formula = f"1/F = 1/d + 1/f"
    name_from = "цуглуулагч линзээс" if lens else "хотгор толины өмнө"
    if kind == "f":
        prompt = (f"Фокусын зай нь {focal} см {name_from} {d} см зайд биет байрлуулав. "
                  f"Бодит дүрс {'линзээс' if lens else 'толиноос'} ямар зайд үүсэх вэ?")
        answer = unit_text(f, "см")
        wrong = nw(answer, "см", [Fraction(d * focal, d + focal), abs(d - focal) or None, Fraction(d + focal), Fraction(d)])
        solution = f"{formula} тул f = dF/(d − F) = {d}·{focal}/({d} − {focal}) = {f} см."
    elif kind == "F":
        prompt = (f"{name_from.capitalize()} {d} см зайд байрлуулсан биетийн бодит дүрс {where} "
                  f"{f} см зайд үүсэв. {'Линзний' if lens else 'Толины'} фокусын зайг ол.")
        answer = unit_text(focal, "см")
        wrong = nw(answer, "см", [Fraction(d + f), abs(d - f) or None, Fraction(d + f, 2),
                                  Fraction(d * f, abs(d - f)) if d != f else Fraction(d * 2)])
        solution = f"{formula} = 1/{d} + 1/{f} тул F = df/(d + f) = {d}·{f}/({d} + {f}) = {focal} см."
    elif kind == "d":
        prompt = (f"Фокусын зай нь {focal} см {gen} {'нөгөө талд' if lens else 'өмнө'} {f} см зайд биетийн бодит дүрс үүсэв. "
                  f"Биет {'линзээс' if lens else 'толиноос'} ямар зайд байсан бэ?")
        answer = unit_text(d, "см")
        wrong = nw(answer, "см", [Fraction(f * focal, f + focal), abs(f - focal) or None, Fraction(f + focal), Fraction(f)])
        solution = f"{formula} тул d = fF/(f − F) = {f}·{focal}/({f} − {focal}) = {d} см."
    elif kind == "D":
        power = Fraction(100, focal)
        prompt = (f"Цуглуулагч линзээс {d} см зайд байрлуулсан биетийн бодит дүрс линзний нөгөө талд {f} см зайд үүсэв. "
                  "Линзний оптик хүчийг ол.")
        answer = unit_text(power, "дптр")
        wrong = nw(answer, "дптр", [Fraction(focal), Fraction(100, d + f), power * 2, power / 2, Fraction(focal, 100) * 10])
        solution = f"F = df/(d + f) = {d}·{f}/({d} + {f}) = {focal} см = {num(Fraction(focal, 100))} м; D = 1/F = {num(power)} дптр."
    elif kind == "G":
        gain = Fraction(f, d)
        prompt = (f"{name_from.capitalize()} {d} см зайд байрлуулсан биетийн бодит дүрс {where} "
                  f"{f} см зайд үүсэв. Дүрсийн шугаман томруулалтыг ол.")
        answer = num(gain)
        wrong = nw(answer, "", [Fraction(d, f), Fraction(f, focal), Fraction(d, focal), gain * 2, gain / 2])
        solution = f"Γ = f/d = {f}/{d} = {answer}."
    else:
        _, _, _, _, _, height, image = version
        prompt = (f"Өндөр нь {height} см биетийг фокусын зай нь {focal} см {name_from} {d} см зайд "
                  "байрлуулав. Бодит дүрсийн өндрийг ол.")
        answer = unit_text(image, "см")
        wrong = nw(answer, "см", [Fraction(height * d, f), Fraction(height * focal, d), image * 2, image / 2, Fraction(height)])
        solution = f"f = dF/(d − F) = {d}·{focal}/({d} − {focal}) = {f} см; H = h·f/d = {height}·{f}/{d} = {answer}."
    return {"skill": SKILL_LENS, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 20. p_waveoptics
# ---------------------------------------------------------------------------

SKILL_WAVEOPTICS = "Гэрлийн дифракц ба интерференц"
GRATINGS = (100, 125, 200, 250, 400, 500, 800, 1000)
WAVELENGTHS = (400, 420, 440, 450, 480, 500, 520, 540, 560, 580, 600, 620, 640, 650, 660, 680, 700, 720, 750)


@lru_cache(maxsize=None)
def waveoptics_versions() -> tuple:
    groups = {name: [] for name in ("lambda", "order", "lines", "kmax", "total", "spacing", "position", "young_lambda",
                                    "ratio")}
    for lines, wavelength, order in itertools.product(GRATINGS, WAVELENGTHS, (1, 2, 3, 4)):
        spacing = Fraction(10 ** 6, lines)
        sine = order * wavelength / spacing
        if sine <= Fraction(9, 10) and clean(sine, 3):
            for kind in ("lambda", "order", "lines"):
                groups[kind].append((kind, lines, wavelength, order, sine))
    for lines, wavelength in itertools.product(GRATINGS[2:], WAVELENGTHS):
        spacing = Fraction(10 ** 6, lines)
        if (spacing / wavelength).denominator != 1 and spacing / wavelength < 13:
            top = math.floor(spacing / wavelength)
            groups["kmax"].append(("kmax", lines, wavelength, top))
            groups["total"].append(("total", lines, wavelength, top))
    for wavelength, length, gap in itertools.product((400, 450, 500, 550, 600, 640, 650, 700), ("1", "1.2", "1.5", "2", "2.5", "3"),
                                                     ("0.1", "0.2", "0.25", "0.3", "0.4", "0.5", "1")):
        fringe = wavelength * given(length) / (given(gap) * 1000)
        if clean(fringe) and fringe >= Fraction(1, 5):
            groups["spacing"].append(("spacing", wavelength, length, gap, fringe))
            groups["young_lambda"].append(("young_lambda", wavelength, length, gap, fringe))
            for order in (2, 3, 4, 5):
                if clean(order * fringe):
                    groups["position"].append(("position", wavelength, length, gap, fringe, order))
    for first, second in itertools.permutations((1, 2, 3, 4, 5, 6), 2):
        if first > 4:
            continue
        for position in ("1", "1.2", "1.5", "2", "2.4", "3", "4", "4.5", "6"):
            other = given(position) * second / first
            if clean(other):
                groups["ratio"].append(("ratio", first, given(position), second, other))
    return grouped(groups, 2020, {"lambda": 25, "order": 20, "lines": 15, "kmax": 15, "total": 15, "spacing": 25,
                                  "position": 25, "young_lambda": 15, "ratio": 25})


def grating_angle(sine) -> str:
    return "φ = 30° өнцгөөр" if sine == Fraction(1, 2) else f"sin φ = {num(sine)} өнцгөөр"


def p_waveoptics(rng: random.Random, year: int, k: int) -> dict:
    version = waveoptics_versions()[k % len(waveoptics_versions())]
    kind = version[0]
    skill = SKILL_WAVEOPTICS
    if kind in ("lambda", "order", "lines"):
        _, lines, wavelength, order, sine = version
        spacing = Fraction(10 ** 6, lines)
        grating = f"1 мм-т {lines} зураас бүхий дифракцийн торон"
        if kind == "lambda":
            prompt = (f"{grating} дээр монохромат гэрэл перпендикуляр тусав. {order}-р эрэмбийн максимум {grating_angle(sine)} "
                      "ажиглагдав. Гэрлийн долгионы уртыг ол.")
            answer = unit_text(wavelength, "нм")
            wrong = nw(answer, "нм", [spacing * sine, Fraction(wavelength * order * order), Fraction(wavelength, 2) if order == 1 else Fraction(wavelength * order),
                                      spacing / order])
            solution = (f"d = 1/{lines} мм = {num(spacing)} нм; d·sin φ = kλ тул λ = d·sin φ/k = {num(spacing)}·{num(sine)}/{order} "
                        f"= {wavelength} нм.")
        elif kind == "order":
            prompt = (f"{grating} дээр {wavelength} нм долгионы урттай гэрэл перпендикуляр тусав. {grating_angle(sine).replace('өнцгөөр', 'өнцөгт')} "
                      "хэддүгээр эрэмбийн максимум ажиглагдах вэ?")
            answer = str(order)
            return {
                "skill": skill, "prompt": prompt, "answer": answer, "rank": False,
                "wrong": [str(value) for value in range(1, 7) if value != order][:4],
                "solution": f"d = {num(spacing)} нм; k = d·sin φ/λ = {num(spacing)}·{num(sine)}/{wavelength} = {order}.",
            }
        else:
            prompt = (f"Долгионы урт нь {wavelength} нм гэрлийг дифракцийн торон дээр перпендикуляр тусгахад {order}-р эрэмбийн "
                      f"максимум {grating_angle(sine)} ажиглагдав. Торны 1 мм дэх зураасны тоог ол.")
            answer = str(lines)
            wrong = nw(answer, "", [Fraction(lines * order), Fraction(lines * 10), Fraction(lines, 10), Fraction(lines, order) if order > 1 else Fraction(lines * 4)])
            solution = (f"d = kλ/sin φ = {order}·{wavelength}/{num(sine)} = {num(spacing)} нм = {num(spacing / 10 ** 6, 6)} мм; "
                        f"N = 1/d = {lines} мм⁻¹.")
    elif kind in ("kmax", "total"):
        _, lines, wavelength, top = version
        spacing = Fraction(10 ** 6, lines)
        lead = f"1 мм-т {lines} зураас бүхий дифракцийн торон дээр {wavelength} нм долгионы урттай гэрэл перпендикуляр тусав."
        if kind == "kmax":
            answer, values = str(top), [top + 1, top - 1, 2 * top + 1, 2 * top, top + 2, top + 3, top + 4]
            prompt = lead + " Ажиглагдах максимумын хамгийн их эрэмбийг ол."
            extra = ""
        else:
            answer, values = str(2 * top + 1), [2 * top, 2 * top + 2, 2 * top + 3, top, top + 1, 2 * top - 1]
            prompt = lead + " Нийт хэдэн максимум (төв максимумыг оруулан) ажиглагдах вэ?"
            extra = f" Хоёр талдаа {top} ба төв максимум: 2·{top} + 1 = {2 * top + 1}."
        return {
            "skill": skill, "prompt": prompt, "answer": answer, "rank": False,
            "wrong": [str(value) for value in dict.fromkeys(values) if value > 0 and str(value) != answer][:4],
            "solution": (f"sin φ ≤ 1 тул k ≤ d/λ = {num(spacing)}/{wavelength} ≈ {num(spacing / wavelength, 2)}; "
                         f"хамгийн их бүхэл эрэмбэ {top}." + extra),
        }
    elif kind in ("spacing", "position", "young_lambda"):
        wavelength, length, gap, fringe = version[1:5]
        lead = f"Юнгийн туршилтад хоёр нарийн ангархайн хоорондох зай {gap} мм, ангархайгаас дэлгэц хүртэлх зай {length} м."
        work = f"Δx = λL/a = {wavelength}·10⁻⁹·{length}/({gap}·10⁻³) м = {num(fringe)} мм"
        if kind == "spacing":
            prompt = lead + f" {wavelength} нм долгионы урттай гэрлээр гэрэлтүүлэхэд дэлгэц дээрх зэргэлдээ гэрэл зурвасуудын хоорондох зайг ол."
            answer = unit_text(fringe, "мм")
            wrong = nw(answer, "мм", [fringe * 10, fringe / 10, fringe * 2, fringe / 2, fringe * 1000 / 1000 * 4])
            solution = work + "."
        elif kind == "position":
            order = version[5]
            prompt = lead + (f" {wavelength} нм долгионы урттай гэрлээр гэрэлтүүлэв. Төв гэрэл зурвасаас {order}-р гэрэл зурвас "
                             "хүртэлх зайг ол.")
            answer = unit_text(order * fringe, "мм")
            wrong = nw(answer, "мм", [fringe, (order - 1) * fringe, (order + 1) * fringe, order * fringe / 2, order * fringe * 10])
            solution = work + f"; x_{order} = {order}·Δx = {answer}."
        else:
            prompt = lead + f" Дэлгэц дээрх зэргэлдээ гэрэл зурвасуудын хоорондох зай {num(fringe)} мм бол гэрлийн долгионы уртыг ол."
            answer = unit_text(wavelength, "нм")
            wrong = nw(answer, "нм", [Fraction(wavelength * 2), Fraction(wavelength, 2), Fraction(wavelength * 10), Fraction(wavelength * 4)])
            solution = f"λ = Δx·a/L = {num(fringe)}·10⁻³·{gap}·10⁻³/{length} м = {wavelength} нм."
    else:
        _, first, position, second, other = version
        prompt = (f"Хоёр ангархайн интерференцийн зурагт төв гэрэл зурвасаас {first}-р гэрэл зурвас хүртэлх зай {num(position)} мм "
                  f"байв. Төвөөс {second}-р гэрэл зурвас хүртэлх зайг ол.")
        answer = unit_text(other, "мм")
        wrong = nw(answer, "мм", [position * first / second, position + (second - first), position * second, position / first])
        solution = f"Гэрэл зурвасын байрлал x_k = kΔx тул x_{second} = x_{first}·{second}/{first} = {num(position)}·{second}/{first} = {answer}."
    return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 21. p_nature
# ---------------------------------------------------------------------------

SKILL_NATURE = "Гэрлийн мөн чанар"
PHENOMENA = [
    ("Савангийн хөөсөн хальс цагаан гэрэлд солонгорч харагдах", "Интерференц", True),
    ("Усан дээрх нимгэн тосон хальс өнгө алаглан харагдах", "Интерференц", True),
    ("Линз ба хавтгай шилний хооронд Ньютоны цагираг үүсэх", "Интерференц", True),
    ("Нарийн ангархайгаар өнгөрсөн гэрэл геометр сүүдрийн хүрээнд орох", "Дифракц", True),
    ("Лазерын туяа нарийн утсанд саатахад дэлгэц дээр гэрэл, харанхуй зурвасууд үүсэх", "Дифракц", True),
    ("Компакт дискний гадаргуу цагаан гэрэлд өнгө алаглан харагдах", "Дифракц", True),
    ("Хоёр поляроид шүүлтүүрийн нэгийг эргүүлэхэд нэвтэрсэн гэрэл сулрах", "Поляризаци", True),
    ("Поляризацийн нарны шил уснаас ойсон хурц гэрлийг сулруулах", "Поляризаци", True),
    ("Гэрэл тусахад металлын гадаргуугаас электрон сугаран гарах", "Фотоэффект", False),
    ("Гэрэл тусахад фотоэлементийн хэлхээнд гүйдэл үүсэх", "Фотоэффект", False),
    ("Гэрэл тусах гадаргуу даралт мэдрэх (нарны далбаат хөлгийг түлхэх)", "Гэрлийн даралт", False),
    ("Рентген туяа электроноос сарнихдаа долгионы урт нь ихсэх", "Комптоны эффект", False),
]
NATURE_NAMES = ["Интерференц", "Дифракц", "Поляризаци", "Фотоэффект", "Гэрлийн даралт", "Дисперс"]
COLOURS = ["Улаан", "Улбар шар", "Шар", "Ногоон", "Цэнхэр", "Хөх", "Нил ягаан"]
DISPERSION = [
    ("Цагаан гэрэл шилэн призмээр өнгөрөхөд аль өнгөний туяа хамгийн их хазайх вэ?", "Нил ягаан"),
    ("Цагаан гэрэл шилэн призмээр өнгөрөхөд аль өнгөний туяа хамгийн бага хазайх вэ?", "Улаан"),
    ("Шилний хугарлын илтгэгч аль өнгөний гэрлийн хувьд хамгийн их вэ?", "Нил ягаан"),
    ("Шилний хугарлын илтгэгч аль өнгөний гэрлийн хувьд хамгийн бага вэ?", "Улаан"),
    ("Шилэн дотор аль өнгөний гэрэл хамгийн их хурдтай тархах вэ?", "Улаан"),
    ("Шилэн дотор аль өнгөний гэрэл хамгийн бага хурдтай тархах вэ?", "Нил ягаан"),
    ("Үзэгдэх гэрлийн аль өнгө хамгийн их долгионы урттай вэ?", "Улаан"),
    ("Үзэгдэх гэрлийн аль өнгө хамгийн их давтамжтай вэ?", "Нил ягаан"),
    ("Үзэгдэх гэрлийн аль өнгөний фотон хамгийн их энергитэй вэ?", "Нил ягаан"),
    ("Үзэгдэх гэрлийн аль өнгөний фотон хамгийн бага энергитэй вэ?", "Улаан"),
    ("Солонгын гадна (дээд) захад ямар өнгө байрлах вэ?", "Улаан"),
    ("Солонгын дотор (доод) захад ямар өнгө байрлах вэ?", "Нил ягаан"),
]
PAIR_POOL_TAIL = ["Хоёулаа ижил хугарна", "Гэрлийн эрчмээс хамаарна", "Призмийн өнцгөөс хамаарч аль нь ч байж болно"]
ADDITION = [("улаан", "ногоон", "Шар"), ("улаан", "хөх", "Ягаан (пурпур)"), ("ногоон", "хөх", "Цэнхэр"),
            ("улаан, ногоон", "хөх", "Цагаан")]
ADDITION_POOL = ["Шар", "Ягаан (пурпур)", "Цэнхэр", "Цагаан", "Хар", "Ногоон", "Улбар шар", "Хүрэн"]
REFLECTS = {"улаан": {"R"}, "ногоон": {"G"}, "хөх": {"B"}, "цагаан": {"R", "G", "B"}, "хар": set(), "шар": {"R", "G"}}
SEEN = {frozenset(): "Хар", frozenset({"R"}): "Улаан", frozenset({"G"}): "Ногоон", frozenset({"B"}): "Хөх",
        frozenset({"R", "G"}): "Шар", frozenset({"R", "G", "B"}): "Цагаан"}
LIGHTS = {"улаан": {"R"}, "ногоон": {"G"}, "хөх": {"B"}}
OBJECT_POOL = ["Хар", "Улаан", "Ногоон", "Хөх", "Шар", "Цагаан"]


@lru_cache(maxsize=None)
def nature_versions() -> tuple:
    groups = {name: [] for name in ("phenomenon", "dispersion", "pair", "addition", "object", "why", "rainbow")}
    groups["phenomenon"] = [("phenomenon", index) for index in range(len(PHENOMENA))]
    groups["dispersion"] = [("dispersion", index) for index in range(len(DISPERSION))]
    for first, second in itertools.combinations(range(len(COLOURS)), 2):
        for asked in ("refract", "speed"):
            groups["pair"].append(("pair", first, second, asked))
    for index in range(len(ADDITION)):
        for setting in ("stage", "screen"):
            groups["addition"].append(("addition", index, setting))
    for obj in REFLECTS:
        for light in LIGHTS:
            groups["object"].append(("object", obj, light))
    for obj, thing in (("улаан", "алим"), ("ногоон", "навч"), ("хөх", "даавуу"), ("шар", "нимбэг"), ("цагаан", "цаас"),
                       ("хар", "хилэн даавуу")):
        groups["why"].append(("why", obj, thing))
    groups["rainbow"] = [("rainbow", 0), ("rainbow", 1)]
    return grouped(groups, 2121, {"phenomenon": 12, "dispersion": 12, "pair": 30, "addition": 8, "object": 18, "why": 6,
                                  "rainbow": 2})


def p_nature(rng: random.Random, year: int, k: int) -> dict:
    version = nature_versions()[k % len(nature_versions())]
    kind = version[0]
    skill = SKILL_NATURE

    def nature(name, wave):
        return f"{name}; гэрлийн {'долгионы' if wave else 'бөөмийн (корпускуляр)'} шинжийг харуулна"

    if kind == "phenomenon":
        description, name, wave = PHENOMENA[version[1]]
        answer = nature(name, wave)
        pool = [nature(name, not wave)] + [nature(other, other_wave) for other in NATURE_NAMES if other != name
                                           for other_wave in (True, False)]
        return text_item(
            skill, f"{description} нь ямар үзэгдэл бөгөөд гэрлийн ямар шинжийг харуулах вэ?", answer, pool,
            ("Интерференц, дифракц, поляризаци нь гэрлийн долгионы шинжийг; фотоэффект, гэрлийн даралт, Комптоны эффект нь "
             f"бөөмийн (фотоны) шинжийг харуулна. Энд: {answer[0].lower() + answer[1:]}."),
            rng,
        )
    if kind == "dispersion":
        prompt, answer = DISPERSION[version[1]]
        return text_item(skill, prompt, answer, COLOURS,
                         ("Дисперс: шилний хугарлын илтгэгч долгионы урт багасах тусам ихэсдэг. Улаан гэрэл хамгийн урт долгионтой, "
                          "бага хугарч шилэнд хурдан тархана; нил ягаан хамгийн богино долгионтой, хамгийн их хугарч удаан "
                          "тархана. Анхдагч солонгын гадна зах улаан, дотор зах нил ягаан."), rng)
    if kind == "pair":
        _, first, second, asked = version
        a, b = COLOURS[first].lower(), COLOURS[second].lower()
        # COLOURS runs from red (long wavelength) to violet (short wavelength).
        if asked == "refract":
            answer = COLOURS[second]
            prompt = f"{a.capitalize()} ба {b} гэрлийн аль нь шилэн призмд илүү их хугарах вэ?"
        else:
            answer = COLOURS[first]
            prompt = f"{a.capitalize()} ба {b} гэрлийн аль нь шилэн дотор илүү их хурдтай тархах вэ?"
        pool = [COLOURS[first], COLOURS[second]] + PAIR_POOL_TAIL + ["Аль аль нь ижил хурдтай"]
        return text_item(skill, prompt, answer, pool,
                         (f"Долгионы урт нь богино {b} гэрлийн хугарлын илтгэгч их тул илүү хугарч, шилэнд удаан тархана; "
                          f"{a} гэрэл бага хугарч хурдан тархана. Хариу: {answer.lower()}."), rng)
    if kind == "addition":
        _, index, setting = version
        a, b, result = ADDITION[index]
        if setting == "stage":
            prompt = f"Тайзан дээрх цагаан дэлгэц рүү {a} ба {b} гэрлийн туяаг зэрэг тусгав. Дэлгэц ямар өнгөтэй харагдах вэ?"
        else:
            prompt = f"Дэлгэцийн пикселийн {a} ба {b} гэрэлтүүлэгчийг зэрэг асаахад ямар өнгө харагдах вэ?"
        return text_item(skill, prompt, result, ADDITION_POOL,
                         ("Гэрлийн өнгө нэмэгдэхэд: улаан + ногоон = шар, улаан + хөх = ягаан (пурпур), ногоон + хөх = цэнхэр, "
                          f"улаан + ногоон + хөх = цагаан. Хариу: {result.lower()}."), rng)
    if kind == "object":
        _, obj, light = version
        seen = SEEN[frozenset(REFLECTS[obj] & LIGHTS[light])]
        return text_item(
            skill,
            f"Цагаан гэрэлд {obj} харагддаг биетийг зөвхөн {light} гэрлээр гэрэлтүүлэхэд ямар өнгөтэй харагдах вэ?",
            seen, OBJECT_POOL,
            (f"Биет өөрийн өнгөний гэрлийг ойлгож бусдыг шингээнэ ({obj} биет: "
             f"{', '.join({'R': 'улаан', 'G': 'ногоон', 'B': 'хөх'}[c] for c in sorted(REFLECTS[obj])) or 'юуг ч ойлгохгүй'}). "
             f"Зөвхөн {light} гэрэл тусахад ойх гэрэл: {seen.lower()}."),
            rng,
        )
    if kind == "why":
        _, obj, thing = version
        pool = [f"{obj.capitalize()} өнгийг ойлгож, бусад өнгийг шингээнэ", f"{obj.capitalize()} өнгийг шингээж, бусад өнгийг ойлгоно",
                "Бүх өнгийг ижил хэмжээгээр ойлгоно", "Бүх өнгийг шингээнэ", f"Өөрөө {obj} гэрэл цацруулна"]
        if obj == "цагаан":
            answer, pool = "Бүх өнгийг ижил хэмжээгээр ойлгоно", pool[2:] + ["Цагаан өнгийг шингээж, бусдыг ойлгоно", "Зөвхөн шар өнгийг ойлгоно"]
        elif obj == "хар":
            answer, pool = "Бүх өнгийг шингээнэ", pool[2:] + ["Хар өнгийг ойлгоно", "Зөвхөн хөх өнгийг ойлгоно"]
        else:
            answer = pool[0]
        return text_item(skill, f"Цагаан гэрэлд {thing} {obj} өнгөтэй харагддаг нь гэрэлтэй хэрхэн харьцдагтай холбоотой вэ?",
                         answer, pool, f"Биетийн өнгийг түүний ойлгодог гэрэл тодорхойлно. Хариу: {answer.lower()}.", rng)
    answer = "Усны дусалд хугарах, дисперс ба дотоод ойлт"
    pool = [answer, "Зөвхөн гэрлийн поляризаци", "Агаарын молекул дээрх фотоэффект", "Үүлэн дээрх толины ойлт",
            "Гэрлийн хоёр эх үүсвэрийн интерференц"]
    prompt = ("Солонго үүсэхэд гэрлийн ямар үзэгдлүүд оролцдог вэ?" if version[1] == 0 else
              "Бороо орсны дараа наранд нуруугаа харуулан зогсоход солонго харагддаг. Үүнийг юугаар тайлбарлах вэ?")
    return text_item(skill, prompt, answer, pool,
                     "Нарны гэрэл усны дусалд орохдоо хугарч, өнгөнүүдэд задарна (дисперс), дусал дотор ойгоод гарахдаа дахин хугарна.", rng)


# ---------------------------------------------------------------------------
# 22. a_halflife
# ---------------------------------------------------------------------------

SKILL_HALFLIFE = "Хагас задралын үе"
ISOTOPES_T = [("Иод-131", "8", "хоног"), ("Цези-137", "30", "жил"), ("Кобальт-60", "5.3", "жил"), ("Стронци-90", "29", "жил"),
              ("Фосфор-32", "14", "хоног"), ("Натри-24", "15", "цаг"), ("Полони-210", "138", "хоног"),
              ("Ради-226", "1600", "жил"), ("Нүүрстөрөгч-14", "5730", "жил"), ("Радон-222", "3.8", "хоног"),
              ("Висмут-210", "5", "хоног"), ("Тори-234", "24", "хоног"), ("Алт-198", "2.7", "хоног")]
GEN_UNIT = {"хоног": "хоногийн", "жил": "жилийн", "цаг": "цагийн", "мин": "минутын"}
TIMES_WORD = {1: "нэг", 2: "хоёр", 3: "гурав"}


@lru_cache(maxsize=None)
def halflife_versions() -> tuple:
    groups = {name: [] for name in ("left", "decayed", "pct_left", "pct_decayed", "period", "time", "double")}
    for index, (iso, period, unit) in enumerate(ISOTOPES_T):
        for n in (1, 2, 3, 4, 5):
            groups["pct_left"].append(("pct_left", iso, period, unit, n))
            groups["pct_decayed"].append(("pct_decayed", iso, period, unit, n))
            groups["time"].append(("time", iso, period, unit, n))
            for mass in (16, 20, 24, 32, 40, 48, 64, 80, 96, 100, 120, 128, 160, 200, 240, 256, 320, 400, 480, 640, 800):
                if clean(Fraction(mass, 2 ** n)) and (mass + n + index) % 3 == 0:
                    groups["left"].append(("left", iso, period, unit, n, mass))
                    groups["decayed"].append(("decayed", iso, period, unit, n, mass))
    for period, unit in (("2", "цаг"), ("3", "хоног"), ("5", "жил"), ("8", "хоног"), ("10", "мин"), ("12", "цаг"),
                         ("20", "мин"), ("30", "жил"), ("6", "цаг"), ("15", "хоног")):
        for n in (2, 3, 4):
            for mass in (40, 64, 80, 120, 160, 200, 320):
                if clean(Fraction(mass, 2 ** n)):
                    groups["period"].append(("period", period, unit, n, mass))
    for percent in (10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90):
        for times in (2, 3):
            for span, unit in (("2", "цаг"), ("3", "хоног"), ("5", "жил"), ("10", "мин"), ("4", "цаг"), ("6", "хоног")):
                value = 100 - 100 * (1 - Fraction(percent, 100)) ** times
                if clean(value, 3):
                    groups["double"].append(("double", percent, times, span, unit, value))
    return grouped(groups, 2222, {"left": 30, "decayed": 25, "pct_left": 20, "pct_decayed": 20, "period": 25, "time": 20,
                                  "double": 45})


def percent_text(value) -> str:
    return f"{num(value, 2)} %"


def a_halflife(rng: random.Random, year: int, k: int) -> dict:
    version = halflife_versions()[k % len(halflife_versions())]
    kind = version[0]
    skill = SKILL_HALFLIFE
    if kind in ("left", "decayed", "pct_left", "pct_decayed", "time"):
        iso, period, unit, n = version[1:5]
        t = given(period) * n
        lead = f"Хагас задралын үе нь {period} {unit} байх {iso} изотопын"
        left = Fraction(1, 2 ** n)
        if kind in ("left", "decayed"):
            mass = version[5]
            prompt = lead + f" {mass} г дээжээс {num(t)} {GEN_UNIT[unit]} дараа хэдэн грамм нь {'задралгүй үлдэх' if kind == 'left' else 'задрах'} вэ?"
            value = mass * left if kind == "left" else mass * (1 - left)
            other = mass - value
            answer = unit_text(value, "г")
            wrong = nw(answer, "г", [other, Fraction(mass, 2 * n), Fraction(mass, n + 1), value * 2, value / 2])
            solution = (f"t/T = {num(t)}/{period} = {n}; m = m0·2^(−{n}) = {mass}/{2 ** n} = {num(mass * left)} г"
                        + (f"; задарсан нь {mass} − {num(mass * left)} = {answer}." if kind == "decayed" else "."))
            return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
        if kind == "time":
            prompt = lead + f" цөмийн тоо {2 ** n} дахин багасахад хэр хугацаа шаардагдах вэ?"
            answer = unit_text(t, unit)
            wrong = nw(answer, unit, [given(period) * 2 ** n, given(period) * 2 ** n / 2, given(period) / n, given(period) * (n + 1),
                                      given(period) * (n - 1) if n > 1 else given(period) / 2])
            solution = f"{2 ** n} = 2^{n} тул {n} хагас задралын үе: t = {n}·{period} = {answer}."
            return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
        value = 100 * left if kind == "pct_left" else 100 * (1 - left)
        prompt = lead + f" цөмүүдийн хэдэн хувь нь {num(t)} {GEN_UNIT[unit]} дараа {'задралгүй үлдэх' if kind == 'pct_left' else 'задрах'} вэ?"
        candidates = [100 - value, Fraction(100, 2 * n), Fraction(100, n + 1), value / 2, 100 - value / 2]
        return {
            "skill": skill, "prompt": prompt, "answer": percent_text(value), "rank": False,
            "wrong": spread(value, candidates, percent_text, rng, factors=(2,), upper=100, offsets=(10, 5, 20, 25)),
            "solution": (f"t/T = {n}; үлдэх хэсэг 2^(−{n}) = 1/{2 ** n} = {num(100 * left)} %"
                         + (f"; задрах хэсэг 100 % − {num(100 * left)} % = {num(value)} %" if kind == "pct_decayed" else "")
                         # The key is rounded to two decimals (3.125 % → 3.13 %): say so.
                         + (f" ≈ {percent_text(value)}." if percent_text(value) != f"{num(value)} %" else ".")),
        }
    if kind == "period":
        _, period, unit, n, mass = version
        t = given(period) * n
        left = Fraction(mass, 2 ** n)
        prompt = f"Цацраг идэвхт изотопын {mass} г дээжийн {num(t)} {GEN_UNIT[unit]} дараа {num(left)} г нь задралгүй үлдэв. Хагас задралын үеийг ол."
        answer = unit_text(given(period), unit)
        wrong = nw(answer, unit, [t / 2 ** n, t / 2, t, t * 2, given(period) * 2])
        solution = f"m0/m = {mass}/{num(left)} = {2 ** n} = 2^{n} тул t = {n}T, T = {num(t)}/{n} = {answer}."
        return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    _, percent, times, span, unit, value = version
    total = given(span) * times
    fraction_left = 1 - Fraction(percent, 100)
    prompt = (f"Цацраг идэвхт дээжийн цөмүүдийн {percent} % нь {span} {GEN_UNIT[unit]} хугацаанд задарсан бол {num(total)} "
              f"{GEN_UNIT[unit]} хугацаанд цөмүүдийн хэдэн хувь нь задрах вэ?")
    candidates = [Fraction(percent * times), Fraction(percent), 100 * fraction_left ** times, Fraction(percent) ** times / 100 ** (times - 1)]
    return {
        "skill": skill, "prompt": prompt, "answer": percent_text(value), "rank": False,
        "wrong": spread(value, [c for c in candidates if 0 < c < 100], percent_text, rng, factors=(2,), upper=100,
                        offsets=(10, 5, 20, 25)),
        "solution": (f"Тэнцүү хугацаа бүрт үлдсэн цөмийн ижил хэсэг задарна: {span} {unit} бүрт {num(100 * fraction_left)} % нь "
                     f"үлдэнэ. {times} ийм хугацааны дараа ({num(fraction_left)}){str(times).translate(SUPERSCRIPT)} = {num(fraction_left ** times)} буюу {num(100 * fraction_left ** times)} % үлдэж, "
                     f"{num(value)} % нь задарна."),
    }


# ---------------------------------------------------------------------------
# 23. a_photoelectric
# ---------------------------------------------------------------------------

SKILL_PHOTOELECTRIC = "Фотоэффект"
METALS = [("цезийн", "1.9"), ("калийн", "2.2"), ("натрийн", "2.3"), ("литийн", "2.4"), ("цайрын", "4.2"),
          ("вольфрамын", "4.5"), ("платины", "5.3"), ("металлын", "2"), ("металлын", "2.5"), ("металлын", "3"),
          ("металлын", "3.5"), ("металлын", "4"), ("металлын", "1.8")]
CLEAN_LAMBDAS = (124, 155, 160, 200, 248, 310, 400, 496, 500, 620)
PHOTON_EVS = ("2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.2", "7", "8", "10")
RED_LIMITS = [("1.55", 800), ("2", 620), ("2.48", 500), ("2.5", 496), ("3.1", 400), ("4", 310), ("4.96", 250), ("5", 248),
              ("6.2", 200), ("1.24", 1000), ("3.2", Fraction(775, 2)), ("1.6", 775)]


@lru_cache(maxsize=None)
def photoelectric_versions() -> tuple:
    groups = {name: [] for name in ("ek_e", "ek_l", "work", "needed", "red", "work_red", "stop_e", "stop_l", "work_u")}
    for metal, work in METALS:
        for energy in PHOTON_EVS:
            ek = given(energy) - given(work)
            if ek >= Fraction(3, 10):
                groups["ek_e"].append(("ek_e", metal, work, given(energy), ek))
                groups["stop_e"].append(("stop_e", metal, work, given(energy), ek))
                groups["work"].append(("work", metal, work, given(energy), ek))
                groups["needed"].append(("needed", metal, work, given(energy), ek))
        for wavelength in CLEAN_LAMBDAS:
            energy = Fraction(HC_EV_NM, wavelength)
            ek = energy - given(work)
            if ek >= Fraction(3, 10):
                groups["ek_l"].append(("ek_l", metal, work, wavelength, ek))
                groups["stop_l"].append(("stop_l", metal, work, wavelength, ek))
                groups["work_u"].append(("work_u", metal, work, wavelength, ek))
    for work, limit in RED_LIMITS:
        for metal in ("металлын", "катодын бодисын"):
            groups["red"].append(("red", metal, work, limit))
            groups["work_red"].append(("work_red", metal, work, limit))
    return grouped(groups, 2323, {"ek_e": 25, "ek_l": 25, "work": 20, "needed": 20, "red": 20, "work_red": 15, "stop_e": 20,
                                  "stop_l": 20, "work_u": 15})


def a_photoelectric(rng: random.Random, year: int, k: int) -> dict:
    version = photoelectric_versions()[k % len(photoelectric_versions())]
    kind = version[0]
    tail = " hc = 1240 эВ·нм."
    if kind in ("red", "work_red"):
        _, metal, work, limit = version
        if kind == "red":
            prompt = f"Гаралтын ажил нь {work} эВ {metal} фотоэффектийн улаан хязгаарын долгионы уртыг ол." + tail
            answer = unit_text(limit, "нм")
            wrong = nw(answer, "нм", [given(work) * HC_EV_NM / 10, Fraction(HC_EV_NM) * 2 / given(work), limit / 2, limit * 2])
            solution = f"hc/λ0 = A тул λ0 = hc/A = 1240/{work} = {answer}."
        else:
            prompt = f"{metal.capitalize()} фотоэффектийн улаан хязгаар {num(limit)} нм бол гаралтын ажлыг ол." + tail
            answer = unit_text(given(work), "эВ")
            wrong = nw(answer, "эВ", [given(work) * 2, given(work) / 2, Fraction(limit, HC_EV_NM) * 10, given(work) * 10])
            solution = f"A = hc/λ0 = 1240/{num(limit)} = {answer}."
        return {"skill": SKILL_PHOTOELECTRIC, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}
    _, metal, work, light, ek = version
    a = given(work)
    surface = f"Гаралтын ажил нь {work} эВ {metal} гадаргуу"
    if kind in ("ek_e", "stop_e", "work", "needed"):
        energy = light
        if kind == "ek_e":
            prompt = f"{surface} дээр {num(energy)} эВ энергитэй фотонууд тусав. Фотоэлектронуудын хамгийн их кинетик энергийг ол."
            answer = unit_text(ek, "эВ")
            wrong = nw(answer, "эВ", [energy + a, energy, a, ek * 2, ek / 2])
            solution = f"hν = A + Ek тул Ek = hν − A = {num(energy)} − {work} = {answer}."
        elif kind == "stop_e":
            prompt = f"{surface} дээр {num(energy)} эВ энергитэй фотонууд тусав. Фотоэлектронуудыг бүрэн зогсоох саатуулах хүчдэлийг ол."
            answer = unit_text(ek, "В")
            wrong = nw(answer, "В", [energy + a, energy, a, ek * 2, ek / 2])
            solution = f"eU = Ek = hν − A = {num(energy)} − {work} = {num(ek)} эВ тул U = {answer}."
        elif kind == "work":
            prompt = (f"{num(energy)} эВ энергитэй фотонууд металл гадаргуу дээр тусахад хамгийн их кинетик энерги нь {num(ek)} эВ "
                      "фотоэлектронууд ялгарав. Металлын гаралтын ажлыг ол.")
            answer = unit_text(a, "эВ")
            wrong = nw(answer, "эВ", [energy + ek, energy, ek, a * 2, a / 2])
            solution = f"A = hν − Ek = {num(energy)} − {num(ek)} = {answer}."
        else:
            prompt = (f"{surface}гаас хамгийн их кинетик энерги нь {num(ek)} эВ фотоэлектрон ялгаруулахын тулд ямар энергитэй "
                      "фотон тусгах шаардлагатай вэ?")
            answer = unit_text(energy, "эВ")
            wrong = nw(answer, "эВ", [abs(a - ek) or None, a, ek, energy * 2, energy / 2])
            solution = f"hν = A + Ek = {work} + {num(ek)} = {answer}."
    else:
        wavelength = light
        energy = Fraction(HC_EV_NM, wavelength)
        if kind == "ek_l":
            prompt = f"{surface} дээр {wavelength} нм долгионы урттай гэрэл тусав. Фотоэлектронуудын хамгийн их кинетик энергийг ол." + tail
            answer = unit_text(ek, "эВ")
            wrong = nw(answer, "эВ", [energy + a, energy, a, ek * 2, ek / 2])
            solution = f"hν = hc/λ = 1240/{wavelength} = {num(energy)} эВ; Ek = hν − A = {num(energy)} − {work} = {answer}."
        elif kind == "stop_l":
            prompt = (f"{surface} дээр {wavelength} нм долгионы урттай гэрэл тусав. Фотоэлектронуудыг бүрэн зогсоох саатуулах "
                      "хүчдэлийг ол." + tail)
            answer = unit_text(ek, "В")
            wrong = nw(answer, "В", [energy + a, energy, a, ek * 2, ek / 2])
            solution = f"hν = 1240/{wavelength} = {num(energy)} эВ; eU = hν − A = {num(ek)} эВ тул U = {answer}."
        else:
            prompt = (f"Металл гадаргуу дээр {wavelength} нм долгионы урттай гэрэл тусахад фотоэлектронуудыг {num(ek)} В саатуулах "
                      "хүчдэл бүрэн зогсоов. Металлын гаралтын ажлыг ол." + tail)
            answer = unit_text(a, "эВ")
            wrong = nw(answer, "эВ", [energy + ek, energy, ek, a * 2, a / 2])
            solution = f"hν = 1240/{wavelength} = {num(energy)} эВ; A = hν − eU = {num(energy)} − {num(ek)} = {answer}."
    return {"skill": SKILL_PHOTOELECTRIC, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


# ---------------------------------------------------------------------------
# 24. a_photon_energy
# ---------------------------------------------------------------------------

SKILL_PHOTON = "Фотоны энерги ба импульс"
EV_LAMBDAS = (124, 155, 160, 200, 248, 310, 400, 496, 500, 620, 800, 1000, 1240, 2480, 40, Fraction(124, 10))
EV_ENERGIES = ("0.5", "1", "1.24", "1.55", "2", "2.48", "2.5", "3.1", "4", "5", "6.2", "8", "10", "12.4", "100")
J_MOMENTA = (110, 120, 132, 165, 200, 220, 264, 300, 330, 400, 440, 500, 550, 600, 660)
J_ENERGIES = ("1.2", "1.5", "2.4", "3", "3.3", "3.6", "4.5", "4.8", "5.4", "6", "6.6", "7.5", "9")
FREQ_MANTISSAS = [("4", 14), ("5", 14), ("6", 14), ("7.5", 14), ("8", 14), ("1", 15), ("1.5", 15), ("2", 15), ("3", 15),
                  ("5", 15), ("1", 18), ("3", 18)]


def band(nm) -> str:
    nm = Fraction(nm)
    if nm < 10:
        return "рентген туяаны"
    if nm < 380:
        return "хэт ягаан туяаны"
    if nm <= 760:
        return "үзэгдэх гэрлийн"
    return "хэт улаан туяаны"


@lru_cache(maxsize=None)
def photon_versions() -> tuple:
    groups = {name: [] for name in ("ev", "lam", "joule", "nu", "nu_ev", "p_lam", "p_e", "ratio", "factor")}
    for nm in EV_LAMBDAS:
        energy = Fraction(HC_EV_NM) / Fraction(nm)
        if clean(energy):
            groups["ev"].append(("ev", Fraction(nm), energy))
    for energy in EV_ENERGIES:
        nm = HC_EV_NM / given(energy)
        if clean(nm):
            groups["lam"].append(("lam", given(energy), nm))
    for nm in sorted(set(list(range(100, 1205, 5)) + [132, 198, 264, 396, 495, 660, 990])):
        energy = H_PLANCK * C_LIGHT / (Fraction(nm) / 10 ** 9)
        if sci_clean(energy):
            groups["joule"].append(("joule", nm, energy))
    for mantissa, exponent in FREQ_MANTISSAS:
        nu = given(mantissa) * 10 ** exponent
        energy = H_PLANCK * nu
        if sci_clean(energy):
            groups["nu"].append(("nu", mantissa, exponent, energy))
        energy_ev = Fraction(41, 10) / 10 ** 15 * nu
        if clean(energy_ev) and energy_ev < 10 ** 5:
            groups["nu_ev"].append(("nu_ev", mantissa, exponent, energy_ev))
    for nm in J_MOMENTA:
        momentum = H_PLANCK / (Fraction(nm) / 10 ** 9)
        if sci_clean(momentum):
            groups["p_lam"].append(("p_lam", nm, momentum))
    for energy in J_ENERGIES:
        value = given(energy) / 10 ** 19
        momentum = value / C_LIGHT
        if sci_clean(momentum):
            groups["p_e"].append(("p_e", value, momentum))
    names = [(200, "хэт ягаан"), (250, "хэт ягаан"), (300, "хэт ягаан"), (400, "нил ягаан"), (450, "хөх"), (500, "ногоон"),
             (600, "улбар шар"), (700, "улаан"), (750, "улаан"), (800, "хэт улаан"), (1000, "хэт улаан"), (1200, "хэт улаан")]
    for (l1, n1), (l2, n2) in itertools.permutations(names, 2):
        value = Fraction(l2, l1)
        if clean(value) and value != 1:
            for asked in ("energy", "momentum"):
                groups["ratio"].append(("ratio", l1, n1, l2, n2, asked, value))
    for n in (2, 3, 4):
        for change in ("lambda_down", "lambda_up", "freq_up"):
            for asked in ("energy", "momentum"):
                groups["factor"].append(("factor", n, change, asked))
    return grouped(groups, 2424, {"ev": 15, "lam": 15, "joule": 30, "nu": 10, "nu_ev": 6, "p_lam": 15, "p_e": 13,
                                  "ratio": 40, "factor": 18})


def a_photon_energy(rng: random.Random, year: int, k: int) -> dict:
    version = photon_versions()[k % len(photon_versions())]
    kind = version[0]
    skill = SKILL_PHOTON
    h_text = "h = 6.6·10⁻³⁴ Ж·с"
    if kind == "ev":
        _, nm, energy = version
        prompt = f"Долгионы урт нь {num(nm)} нм {band(nm)} фотоны энергийг электрон-вольтоор ол. hc = 1240 эВ·нм."
        answer = unit_text(energy, "эВ")
        wrong = nw(answer, "эВ", [nm / HC_EV_NM * 10 if nm < 1240 else None, energy * 10, energy / 10, energy * 2, energy / 2])
        solution = f"E = hc/λ = 1240/{num(nm)} = {answer}."
    elif kind == "lam":
        _, energy, nm = version
        prompt = f"Энерги нь {num(energy)} эВ фотоны долгионы уртыг ол. hc = 1240 эВ·нм."
        answer = unit_text(nm, "нм")
        wrong = nw(answer, "нм", [energy * HC_EV_NM / 100, nm * 10, nm / 10, nm * 2, nm / 2])
        solution = f"λ = hc/E = 1240/{num(energy)} = {answer}."
    elif kind == "joule":
        _, nm, energy = version
        prompt = f"Долгионы урт нь {nm} нм гэрлийн фотоны энергийг ол. {h_text}, c = 3·10⁸ м/с."
        answer = sci_exact(energy, "E") + " Ж"
        wrong = [text + " Ж" for text in spread(energy, [energy * 10, energy / 10, energy / 3],
                                                 sci_text, rng)]
        solution = f"E = hc/λ = 6.6·10⁻³⁴·3·10⁸/({nm}·10⁻⁹) = {answer}."
    elif kind == "nu":
        _, mantissa, exponent, energy = version
        nu_text = f"{mantissa}·10{str(exponent).translate(SUPERSCRIPT)}"
        prompt = f"Давтамж нь {nu_text} Гц цахилгаан соронзон цацрагийн фотоны энергийг ол. {h_text}."
        answer = sci_exact(energy, "E") + " Ж"
        wrong = [text + " Ж" for text in spread(energy, [energy * 10, energy / 10], sci_text, rng)]
        solution = f"E = hν = 6.6·10⁻³⁴·{nu_text} = {answer}."
    elif kind == "nu_ev":
        _, mantissa, exponent, energy = version
        nu_text = f"{mantissa}·10{str(exponent).translate(SUPERSCRIPT)}"
        prompt = f"Давтамж нь {nu_text} Гц фотоны энергийг электрон-вольтоор ол. h = 4.1·10⁻¹⁵ эВ·с."
        answer = unit_text(energy, "эВ")
        wrong = nw(answer, "эВ", [energy * 10, energy / 10, energy * 2, energy / 2, energy * 100])
        solution = f"E = hν = 4.1·10⁻¹⁵·{nu_text} = {answer}."
    elif kind == "p_lam":
        _, nm, momentum = version
        prompt = f"Долгионы урт нь {nm} нм фотоны импульсийг ол. {h_text}."
        answer = sci_exact(momentum, "p") + " кг·м/с"
        wrong = [text + " кг·м/с" for text in spread(momentum, [momentum * 10, momentum / 10, momentum * C_LIGHT / 10 ** 8],
                                                      sci_text, rng)]
        solution = f"p = h/λ = 6.6·10⁻³⁴/({nm}·10⁻⁹) = {answer}."
    elif kind == "p_e":
        _, energy, momentum = version
        prompt = f"Энерги нь {sci_exact(energy, 'E')} Ж фотоны импульсийг ол. c = 3·10⁸ м/с."
        answer = sci_exact(momentum, "p") + " кг·м/с"
        wrong = [text + " кг·м/с" for text in spread(momentum, [momentum * 10, momentum / 10, momentum * 3],
                                                      sci_text, rng)]
        solution = f"p = E/c = {sci_exact(energy, 'E')}/(3·10⁸) = {answer}."
    elif kind == "ratio":
        _, l1, n1, l2, n2, asked, value = version
        word = "энергийн" if asked == "energy" else "импульсийн"
        symbol = "E1/E2" if asked == "energy" else "p1/p2"
        prompt = (f"Долгионы урт нь λ1 = {l1} нм ({n1}) ба λ2 = {l2} нм ({n2}) хоёр фотоны {word} харьцаа {symbol}-ийг ол.")
        answer = num(value)
        wrong = nw(answer, "", [1 / value, value * value, value * 2, value / 2, value + 1])
        relation = "E = hc/λ" if asked == "energy" else "p = h/λ"
        solution = f"{relation} тул {symbol} = λ2/λ1 = {l2}/{l1} = {answer}."
    else:
        _, n, change, asked = version
        quantity = "энерги" if asked == "energy" else "импульс"
        text = {"lambda_down": f"долгионы уртыг {n} дахин багасгавал", "lambda_up": f"долгионы уртыг {n} дахин ихэсгэвэл",
                "freq_up": f"давтамжийг {n} дахин ихэсгэвэл"}[change]
        factor = Fraction(1, n) if change == "lambda_up" else Fraction(n)
        answer = factor_text(factor)
        return {
            "skill": skill,
            "prompt": f"Фотоны {text} түүний {quantity} хэрхэн өөрчлөгдөх вэ?",
            "answer": answer,
            "wrong": factor_wrongs(factor, [1 / factor, factor * factor, Fraction(1)]),
            "rank": False,
            "solution": (f"E = hν = hc/λ ба p = h/λ = hν/c: энерги ба импульс давтамжтай шууд, долгионы урттай урвуу "
                         f"пропорциональ. Иймд {answer.lower()}."),
        }
    return {"skill": skill, "prompt": prompt, "answer": answer, "wrong": wrong, "solution": solution}


TEMPLATES = {
    "c_resistivity": c_resistivity,
    "c_power": c_power,
    "c_transformer": c_transformer,
    "c_series_cap": c_series_cap,
    "c_emf": c_emf,
    "c_combo": c_combo,
    "c_media": c_media,
    "el_semiconductor": el_semiconductor,
    "el_divider": el_divider,
    "f_ampere": f_ampere,
    "f_lorentz": f_lorentz,
    "f_efield": f_efield,
    "f_induction": f_induction,
    "w_echo": w_echo,
    "w_doppler": w_doppler,
    "w_sound": w_sound,
    "w_em": w_em,
    "p_reflection": p_reflection,
    "p_lens": p_lens,
    "p_waveoptics": p_waveoptics,
    "p_nature": p_nature,
    "a_halflife": a_halflife,
    "a_photoelectric": a_photoelectric,
    "a_photon_energy": a_photon_energy,
}
