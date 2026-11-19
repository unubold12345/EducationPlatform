"""Part II tasks added for the per-year blueprints (2026-11-20).

Each task takes (rng, year, k) like s21–s24 and returns four parts. Where the official papers of different years
set a different kind of task under one topic, `year` picks the kind (for example a rough incline in 2018 and 2020,
a smooth one in 2019). `k` picks the scenario; generate.py spreads the scenarios over the papers that use a task.
Keys are exact fractions; a scenario that breaks a task's rule stops the generator.
"""
from __future__ import annotations

import itertools
from functools import lru_cache

from common import *  # noqa: F401,F403
from common import Decimal, Fraction, random

E_CHARGE = Fraction(16, 100)  # e = 1.6·10⁻¹⁹ Кл, written as 0.16·10⁻¹⁸
TRIG = {37: (Fraction(3, 5), Fraction(4, 5)), 53: (Fraction(4, 5), Fraction(3, 5))}


def text(value) -> str:
    """An exact answer printed in full (at most four decimals, checked)."""
    return num(places(Fraction(value), 4, "answer"))


def dec(value) -> Decimal:
    value = Fraction(value)
    return Decimal(value.numerator) / Decimal(value.denominator)


def pick(pool: tuple, k: int):
    return pool[k % len(pool)]


# ---------------------------------------------------------------------------
# Incline
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def incline_versions(up: bool) -> tuple:
    out = []
    for angle, mu, mass, time in itertools.product((37, 53), (Fraction(1, 10), Fraction(1, 5), Fraction(1, 4), Fraction(1, 2)),
                                                   (Fraction(1, 5), Fraction(1, 2), 1, 2, 3, 4),
                                                   (Fraction(1, 2), 1, Fraction(3, 2), 2)):
        sin, cos = TRIG[angle]
        if up:
            mu = Fraction(0)
            accel = 10 * sin
        else:
            accel = 10 * (sin - mu * cos)
        if accel <= 0:
            continue
        distance = accel * time * time / 2
        if (distance * 100).denominator != 1:
            continue
        out.append((angle, mu, Fraction(mass), Fraction(time), accel, distance))
    return tuple(shuffled(4101 + up, distinct(out, key=lambda v: v[:4] if not up else (v[0], v[2], v[3]))))


def t_incline(rng: random.Random, year: int, k: int) -> dict:
    up = year == 2019
    angle, mu, mass, time, accel, distance = pick(incline_versions(up), k)
    sin, cos = TRIG[angle]
    normal = mass * 10 * cos
    friction = mu * normal
    trig = f"sin{angle}° = {num(sin)}, cos{angle}° = {num(cos)}, g = 10 м/с²"
    if up:
        speed = accel * time
        height = distance * sin
        return {
            "skill": "Налуу хавтгай дээрх хөдөлгөөн",
            "prompt": (f"{num(mass)} кг масстай биеийг α = {angle}° өнцөгтэй үрэлтгүй налуу хавтгайн дагуу доороос нь "
                       f"дээш {num(speed)} м/с анхны хурдтай түлхэв ({trig})."),
            "parts": [
                {"prompt": "Биеийн хурдатгалын модуль [a] м/с².", "answer": text(accel)},
                {"prompt": "Бие [b] с-ийн дараа зогсоно.", "answer": text(time)},
                {"prompt": "Зогсох хүртлээ налуугийн дагуу [c] м зам туулна.", "answer": text(distance)},
                {"prompt": "Энэ үед бие анхны байрнаасаа [d] м өндөрт гарна.", "answer": text(height)},
            ],
            "solution": (f"1) Үрэлтгүй тул a = g·sinα = 10·{num(sin)} = {text(accel)} м/с². "
                         f"2) t = v0/a = {num(speed)}/{text(accel)} = {text(time)} с. "
                         f"3) s = v0²/(2a) = {num(speed)}²/(2·{text(accel)}) = {text(distance)} м. "
                         f"4) h = s·sinα = {text(distance)}·{num(sin)} = {text(height)} м."),
        }
    return {
        "skill": "Налуу хавтгай дээрх хөдөлгөөн",
        "prompt": (f"{num(mass)} кг масстай бие α = {angle}° өнцөгтэй налуу хавтгайн дагуу тайван байдлаас гулсаж эхлэв. "
                   f"Бие ба хавтгайн хоорондох үрэлтийн коэффициент μ = {num(mu)} ({trig})."),
        "parts": [
            {"prompt": "Хавтгайн биед үзүүлэх тулгуурын хариу үйлчлэлийн хүч [a] Н.", "answer": text(normal)},
            {"prompt": "Гулсалтын үрэлтийн хүч [b] Н.", "answer": text(friction)},
            {"prompt": "Биеийн хурдатгал [c] м/с².", "answer": text(accel)},
            {"prompt": f"Бие хөдөлж эхэлснээс хойш [d] с-ийн дараа налуугийн дагуу {num(distance)} м зам туулна.", "answer": text(time)},
        ],
        "solution": (f"1) N = mg·cosα = {num(mass)}·10·{num(cos)} = {text(normal)} Н. "
                     f"2) F_ү = μN = {num(mu)}·{text(normal)} = {text(friction)} Н. "
                     f"3) ma = mg·sinα − μmg·cosα ⇒ a = g(sinα − μcosα) = 10·({num(sin)} − {num(mu)}·{num(cos)}) = {text(accel)} м/с². "
                     f"4) s = at²/2 ⇒ t = √(2s/a) = √(2·{num(distance)}/{text(accel)}) = {text(time)} с."),
    }


# ---------------------------------------------------------------------------
# Gas in a closed vessel
# ---------------------------------------------------------------------------

# name, formula, molar mass in г/моль, genitive ("...-ийн молекул")
GASES = [("устөрөгч", "H₂", 2, "устөрөгчийн"), ("гели", "He", 4, "гелийн"), ("метан", "CH₄", 16, "метаны"),
         ("азот", "N₂", 28, "азотын"), ("хүчилтөрөгч", "O₂", 32, "хүчилтөрөгчийн"), ("аргон", "Ar", 40, "аргоны"),
         ("нүүрсхүчлийн хий", "CO₂", 44, "нүүрсхүчлийн хийн")]


@lru_cache(maxsize=None)
def vessel_versions(mixture: bool) -> tuple:
    out = []
    moles = (Fraction(1, 2), 1, Fraction(3, 2), 2, Fraction(5, 2), 3, 4)
    for (name, formula, molar, genitive), nu, litres, kelvin in itertools.product(GASES, moles, (2, 4, 5, 10, 20, 25), (250, 300, 360, 400, 500)):
        nu = Fraction(nu)
        pressure = nu * Fraction(831, 100) * kelvin / litres  # кПа
        concentration = 60 * nu / litres  # ·10²⁵ м⁻³
        if (pressure * 100).denominator != 1 or (concentration * 100).denominator != 1:
            continue
        out.append((name, formula, molar, nu, litres, kelvin, genitive))
    if mixture:
        pairs = []
        for first, second in itertools.combinations(out, 2):
            if first[0] != second[0] and first[4:6] == second[4:6] and first[3] != second[3] and first[2] < second[2]:
                pairs.append((first, second))
        return tuple(shuffled(4202, pairs)[:120])
    return tuple(shuffled(4201, out)[:240])


def t_vessel(rng: random.Random, year: int, k: int) -> dict:
    mixture = year == 2020
    constants = "R = 8.31 Ж/(моль·К), N_A = 6·10²³ моль⁻¹"
    if mixture:
        first, second = pick(vessel_versions(True), k)
        litres, kelvin = first[4], first[5]
        nu1, nu2 = first[3], second[3]
        total = nu1 + nu2
        pressure = total * Fraction(831, 100) * kelvin / litres
        molecules = nu1 * 6
        concentration = 60 * nu1 / litres
        mass1, mass2 = nu1 * first[2], nu2 * second[2]
        return {
            "skill": "Битүү саван дахь хий",
            "prompt": (f"{litres} л эзлэхүүнтэй битүү саванд {num(mass1)} г {first[0]} ({first[1]}, M = {first[2]} г/моль), "
                       f"{num(mass2)} г {second[0]} ({second[1]}, M = {second[2]} г/моль) хийн хольц {text(pressure)} кПа даралттай байна. "
                       f"Хийнүүдийг идеал гэж үзнэ ({constants})."),
            "parts": [
                {"prompt": f"Саванд нийт N = [a]·10²³ тооны {first[6]} молекул байна.", "answer": text(molecules)},
                {"prompt": f"{first[6].capitalize()} молекулын концентрац n = [b]·10²⁵ м⁻³.", "answer": text(concentration)},
                {"prompt": "Хольцын бодисын тоо [c] моль.", "answer": text(total)},
                {"prompt": "Хольцын температур [d] К.", "answer": text(kelvin)},
            ],
            "solution": (f"1) ν1 = m1/M1 = {num(mass1)}/{first[2]} = {num(nu1)} моль, N = ν1·N_A = {num(nu1)}·6·10²³ = {text(molecules)}·10²³. "
                         f"2) n = N/V = {text(molecules)}·10²³/({litres}·10⁻³) = {text(concentration)}·10²⁵ м⁻³. "
                         f"3) ν2 = {num(mass2)}/{second[2]} = {num(nu2)} моль, ν = ν1 + ν2 = {text(total)} моль. "
                         f"4) pV = νRT ⇒ T = pV/(νR) = {text(pressure)}·10³·{litres}·10⁻³/({text(total)}·8.31) = {kelvin} К."),
        }
    name, formula, molar, nu, litres, kelvin, _ = pick(vessel_versions(False), k)
    mass = nu * molar
    pressure = nu * Fraction(831, 100) * kelvin / litres
    molecules = nu * 6
    concentration = 60 * nu / litres
    return {
        "skill": "Битүү саван дахь хий",
        "prompt": (f"{litres} л эзлэхүүнтэй битүү саванд {kelvin} К температуртай {num(mass)} г {name} ({formula}, "
                   f"M = {molar} г/моль) байна. Хийг идеал гэж үзнэ ({constants})."),
        "parts": [
            {"prompt": "Хийн бодисын тоо [a] моль.", "answer": text(nu)},
            {"prompt": "Саван дахь молекулын тоо N = [b]·10²³.", "answer": text(molecules)},
            {"prompt": "Хийн даралт [c] кПа.", "answer": text(pressure), "accept": roundings(dec(pressure), (1,))},
            {"prompt": "Молекулын концентрац n = [d]·10²⁵ м⁻³.", "answer": text(concentration)},
        ],
        "solution": (f"1) ν = m/M = {num(mass)}/{molar} = {text(nu)} моль. "
                     f"2) N = ν·N_A = {text(nu)}·6·10²³ = {text(molecules)}·10²³. "
                     f"3) p = νRT/V = {text(nu)}·8.31·{kelvin}/({litres}·10⁻³) Па = {text(pressure)} кПа. "
                     f"4) n = N/V = {text(molecules)}·10²³/({litres}·10⁻³) = {text(concentration)}·10²⁵ м⁻³."),
    }


# ---------------------------------------------------------------------------
# DC circuits
# ---------------------------------------------------------------------------

def parallel(a, b):
    return Fraction(a) * b / (Fraction(a) + b)


@lru_cache(maxsize=None)
def circuit_versions(kind: str) -> tuple:
    out = []
    values = (1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30)
    if kind == "mixed":  # R1 ∥ R2, then R3 in series; ideal source U
        for r1, r2, r3, current, seconds in itertools.product(values, values, (2, 3, 4, 5, 6, 8), (1, 2, 3), (2, 4, 5, 10)):
            r12 = parallel(r1, r2)
            if r1 >= r2 or r12.denominator != 1:
                continue
            total = r12 + r3
            out.append((r1, r2, r3, current * total, seconds))
    elif kind == "branch":  # R1 + R2 in series, parallel to R3; the ammeter in the main line reads I
        for r1, r2, r3, current in itertools.product(values, values, values, (1, 2, 3, Fraction(3, 2))):
            total = parallel(r1 + r2, r3)
            branch = Fraction(current) * r3 / (r1 + r2 + r3)
            if r1 >= r2 or total.denominator != 1 or (branch * 100).denominator != 1 or (r1, r2, r3) == (1, 2, 6):
                continue
            out.append((r1, r2, r3, Fraction(current)))
    elif kind == "emf":  # R1 ∥ R2 outside a source with EMF ε and internal resistance r
        for r1, r2, inner, current in itertools.product(values, values, (Fraction(1, 2), 1, Fraction(3, 2), 2), (1, 2, 3, 4)):
            outer = parallel(r1, r2)
            if r1 > r2 or outer.denominator != 1:
                continue
            emf = current * (outer + inner)
            if (emf * 10).denominator != 1:
                continue
            out.append((r1, r2, inner, emf))
    elif kind == "capacitor":  # R1 + R2 in series on an ideal source; C across R2
        for r1, r2, current, capacitance in itertools.product(values, values, (1, 2, 3), (2, 4, 5, 10, 20)):
            if r1 == r2:
                continue
            out.append((r1, r2, current * (r1 + r2), capacitance))
    elif kind == "two_emf":  # two sources in one loop, opposing, with resistor R
        for e1, e2, r1, r2, resistor in itertools.product((6, 9, 12, 15, 18, 24), (3, 4, 6, 9, 12), (Fraction(1, 2), 1, 2), (Fraction(1, 2), 1, 2), (2, 3, 4, 5, 6, 8, 10)):
            if e1 <= e2:
                continue
            current = Fraction(e1 - e2) / (resistor + r1 + r2)
            if (current * 100).denominator != 1:
                continue
            out.append((e1, e2, r1, r2, resistor))
    return tuple(shuffled(4300 + len(kind), out)[:240])


def circuit_kind(year: int) -> str:
    return {2016: "mixed", 2018: "branch", 2020: "emf", 2023: "capacitor", 2025: "two_emf"}.get(year, "mixed")


@lru_cache(maxsize=None)
def clean_circuits(kind: str) -> tuple:
    """The versions whose every answer ends within four decimals."""
    out = []
    for version in circuit_versions(kind):
        try:
            circuit_task(kind, version)
        except ValueError:
            continue
        out.append(version)
    return tuple(out)


def t_circuit(rng: random.Random, year: int, k: int) -> dict:
    kind = circuit_kind(year)
    return circuit_task(kind, pick(clean_circuits(kind), k))


def circuit_task(kind: str, version: tuple) -> dict:
    skill = "Тогтмол гүйдлийн хэлхээ"
    if kind == "mixed":
        r1, r2, r3, voltage, seconds = version
        r12 = parallel(r1, r2)
        total = r12 + r3
        current = Fraction(voltage) / total
        current1 = current * r2 / (r1 + r2)
        current2 = current - current1
        heat = current2 ** 2 * r2 * seconds
        return {
            "skill": skill,
            "prompt": (f"R1 = {r1} Ом ба R2 = {r2} Ом эсэргүүцлүүдийг зэрэгцээ холбоод R3 = {r3} Ом эсэргүүцэлтэй цуваа холбож, "
                       f"{num(voltage)} В хүчдэлтэй тэжээлд залгав. Тэжээлийн дотоод эсэргүүцлийг тооцохгүй."),
            "parts": [
                {"prompt": "Хэлхээний ерөнхий эсэргүүцэл [a] Ом.", "answer": text(total)},
                {"prompt": "R3 эсэргүүцлээр гүйх гүйдэл [b] А.", "answer": text(current)},
                {"prompt": "R1 эсэргүүцлээр гүйх гүйдэл [c] А.", "answer": text(current1)},
                {"prompt": f"{seconds} с-д R2 эсэргүүцэлд ялгарах дулаан [d] Ж.", "answer": text(heat)},
            ],
            "solution": (f"1) R12 = R1R2/(R1+R2) = {r1}·{r2}/({r1}+{r2}) = {text(r12)} Ом, R = R12 + R3 = {text(total)} Ом. "
                         f"2) I = U/R = {num(voltage)}/{text(total)} = {text(current)} А; R3-аар нийт гүйдэл гүйнэ. "
                         f"3) U12 = I·R12 = {text(current * r12)} В, I1 = U12/R1 = {text(current1)} А. "
                         f"4) I2 = I − I1 = {text(current2)} А, Q = I2²R2t = {text(current2)}²·{r2}·{seconds} = {text(heat)} Ж."),
        }
    if kind == "branch":
        r1, r2, r3, current = version
        total = parallel(r1 + r2, r3)
        voltage = current * total
        power = voltage * current
        current1 = voltage / (r1 + r2)
        return {
            "skill": skill,
            "prompt": (f"R1 = {r1} Ом ба R2 = {r2} Ом эсэргүүцлүүдийг цуваа холбоод, тэдгээрт R3 = {r3} Ом эсэргүүцлийг "
                       f"зэрэгцээ залгажээ. Үндсэн шугам дахь амперметрийн заалт {num(current)} А."),
            "parts": [
                {"prompt": "Хэлхээний ерөнхий эсэргүүцэл [a] Ом.", "answer": text(total)},
                {"prompt": "R3 эсэргүүцэл дээрх хүчдэл [b] В.", "answer": text(voltage)},
                {"prompt": "Хэлхээний нийт чадал [c] Вт.", "answer": text(power)},
                {"prompt": "R1 эсэргүүцлээр гүйх гүйдэл [d] А.", "answer": text(current1)},
            ],
            "solution": (f"1) R12 = R1 + R2 = {r1 + r2} Ом, R = R12·R3/(R12+R3) = {r1 + r2}·{r3}/{r1 + r2 + r3} = {text(total)} Ом. "
                         f"2) U = I·R = {num(current)}·{text(total)} = {text(voltage)} В; зэрэгцээ салаанууд ижил хүчдэлтэй. "
                         f"3) P = UI = {text(voltage)}·{num(current)} = {text(power)} Вт. "
                         f"4) I1 = U/(R1+R2) = {text(voltage)}/{r1 + r2} = {text(current1)} А."),
        }
    if kind == "emf":
        r1, r2, inner, emf = version
        outer = parallel(r1, r2)
        current = emf / (outer + inner)
        terminal = current * outer
        current2 = terminal / r2
        return {
            "skill": skill,
            "prompt": (f"ЦХХ нь ε = {num(emf)} В, дотоод эсэргүүцэл нь r = {num(inner)} Ом тэжээлд зэрэгцээ холбосон "
                       f"R1 = {r1} Ом ба R2 = {r2} Ом эсэргүүцлүүдийг залгажээ."),
            "parts": [
                {"prompt": "Хэлхээний гадаад эсэргүүцэл [a] Ом.", "answer": text(outer)},
                {"prompt": "Хэлхээний ерөнхий гүйдэл [b] А.", "answer": text(current)},
                {"prompt": "Тэжээлийн туйлуудын хоорондох хүчдэл [c] В.", "answer": text(terminal)},
                {"prompt": "R2 эсэргүүцлээр гүйх гүйдэл [d] А.", "answer": text(current2)},
            ],
            "solution": (f"1) R = R1R2/(R1+R2) = {r1}·{r2}/{r1 + r2} = {text(outer)} Ом. "
                         f"2) I = ε/(R + r) = {num(emf)}/({text(outer)} + {num(inner)}) = {text(current)} А. "
                         f"3) U = IR = {text(current)}·{text(outer)} = {text(terminal)} В. "
                         f"4) I2 = U/R2 = {text(terminal)}/{r2} = {text(current2)} А."),
        }
    if kind == "capacitor":
        r1, r2, voltage, capacitance = version
        current = Fraction(voltage) / (r1 + r2)
        u2 = current * r2
        charge = capacitance * u2
        energy = capacitance * u2 ** 2 / 2
        return {
            "skill": skill,
            "prompt": (f"R1 = {r1} Ом ба R2 = {r2} Ом эсэргүүцлүүдийг цуваа холбож {num(voltage)} В хүчдэлтэй тэжээлд залгав. "
                       f"R2 эсэргүүцэлд C = {capacitance} мкФ багтаамжтай конденсаторыг зэрэгцээ холбожээ. Конденсатор бүрэн цэнэглэгдсэн."),
            "parts": [
                {"prompt": "Хэлхээгээр гүйх гүйдэл [a] А.", "answer": text(current)},
                {"prompt": "R2 эсэргүүцэл дээрх хүчдэл [b] В.", "answer": text(u2)},
                {"prompt": "Конденсаторын цэнэг [c] мкКл.", "answer": text(charge)},
                {"prompt": "Конденсаторын цахилгаан орны энерги [d] мкЖ.", "answer": text(energy)},
            ],
            "solution": (f"1) Цэнэглэгдсэн конденсатороор гүйдэл гүйхгүй: I = U/(R1+R2) = {num(voltage)}/{r1 + r2} = {text(current)} А. "
                         f"2) U2 = IR2 = {text(current)}·{r2} = {text(u2)} В. "
                         f"3) q = CU2 = {capacitance}·{text(u2)} = {text(charge)} мкКл. "
                         f"4) W = CU2²/2 = {capacitance}·{text(u2)}²/2 = {text(energy)} мкЖ."),
        }
    e1, e2, r1, r2, resistor = version
    current = Fraction(e1 - e2) / (resistor + r1 + r2)
    u_r = current * resistor
    terminal = e1 - current * r1
    power = current ** 2 * resistor
    return {
        "skill": skill,
        "prompt": (f"ЦХХ нь ε1 = {e1} В, дотоод эсэргүүцэл нь r1 = {num(r1)} Ом ба ЦХХ нь ε2 = {e2} В, дотоод эсэргүүцэл нь "
                   f"r2 = {num(r2)} Ом хоёр тэжээлийг ижил нэртэй туйлуудаар нь эсрэг чиглэлд цуваа холбож, R = {resistor} Ом "
                   f"эсэргүүцэлтэй нэг битүү хүрээ үүсгэжээ."),
        "parts": [
            {"prompt": "Хүрээгээр гүйх гүйдэл [a] А.", "answer": text(current)},
            {"prompt": "R эсэргүүцэл дээрх хүчдэл [b] В.", "answer": text(u_r)},
            {"prompt": "Эхний тэжээлийн туйлуудын хоорондох хүчдэл [c] В.", "answer": text(terminal)},
            {"prompt": "R эсэргүүцэлд ялгарах чадал [d] Вт.", "answer": text(power)},
        ],
        "solution": (f"1) Кирхгофын II дүрмээр ε1 − ε2 = I(R + r1 + r2) ⇒ I = ({e1} − {e2})/({resistor} + {num(r1)} + {num(r2)}) = {text(current)} А. "
                     f"2) U_R = IR = {text(current)}·{resistor} = {text(u_r)} В. "
                     f"3) Эхний тэжээл гүйдлийг өөрийн чиглэлд гүйлгэнэ: U1 = ε1 − Ir1 = {e1} − {text(current)}·{num(r1)} = {text(terminal)} В. "
                     f"4) P = I²R = {text(current)}²·{resistor} = {text(power)} Вт."),
    }


# ---------------------------------------------------------------------------
# Electron in a uniform field
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def electron_versions() -> tuple:
    out = []
    # v = n·10⁶ м/с after a potential difference U = 2.8125·n² В (m = 9·10⁻³¹ кг, e = 1.6·10⁻¹⁹ Кл).
    for n, low, gap in itertools.product((2, 4, 6, 8, 10, 12, 16), (-40, -25, -10, 0, 5, 20, 50), (Fraction(1, 2), 1, 2, Fraction(5, 2), 4, 5)):
        voltage = Fraction(45, 16) * n * n
        if (voltage * 100).denominator != 1:
            continue
        out.append((n, Fraction(low), Fraction(low) + voltage, Fraction(gap)))
    return tuple(shuffled(4401, out))


def t_efield(rng: random.Random, year: int, k: int) -> dict:
    n, low, high, gap = pick(electron_versions(), k)
    voltage = high - low
    work = Fraction(16, 10) * voltage  # ·10⁻¹⁹ Ж
    field = voltage / (gap / 100)  # В/м
    return {
        "skill": "Цахилгаан орон дахь электрон",
        "prompt": (f"Нэгэн төрлийн цахилгаан оронд потенциал нь φ1 = {num(low)} В цэгт тайван байсан электрон орны үйлчлэлээр "
                   f"потенциал нь φ2 = {num(high)} В цэг рүү хөдөлж, хоорондох {num(gap)} см замыг туулав. Электроны масс "
                   f"m = 9·10⁻³¹ кг, цэнэгийн модуль e = 1.6·10⁻¹⁹ Кл."),
        "parts": [
            {"prompt": "Хоёр цэгийн хоорондох потенциалын ялгавар [a] В.", "answer": text(voltage)},
            {"prompt": "Цахилгаан орны хийсэн ажил [b]·10⁻¹⁹ Ж.", "answer": text(work)},
            {"prompt": "Электроны эцсийн хурд [c]·10⁶ м/с.", "answer": str(n)},
            {"prompt": "Цахилгаан орны хүчлэг [d] В/м.", "answer": text(field)},
        ],
        "solution": (f"1) U = φ2 − φ1 = {num(high)} − ({num(low)}) = {text(voltage)} В. "
                     f"2) A = eU = 1.6·10⁻¹⁹·{text(voltage)} = {text(work)}·10⁻¹⁹ Ж. "
                     f"3) mv²/2 = eU ⇒ v = √(2eU/m) = √(2·{text(work)}·10⁻¹⁹/(9·10⁻³¹)) = {n}·10⁶ м/с. "
                     f"4) E = U/d = {text(voltage)}/({num(gap)}·10⁻²) = {text(field)} В/м."),
    }


# ---------------------------------------------------------------------------
# Diffraction grating and screen
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def grating_versions() -> tuple:
    out = []
    for lines, wavelength, screen, order, other in itertools.product((50, 100, 125, 200, 250), (400, 450, 480, 500, 600, 640), (1, Fraction(3, 2), 2, Fraction(5, 2), 3), (2, 3, 4), (400, 450, 500, 600, 700)):
        period = Fraction(1, lines)  # мм
        first = Fraction(wavelength, 10 ** 6) * screen * 1000 / period  # мм on the screen (small angles)
        sine = order * Fraction(wavelength, 10 ** 6) / period
        ratio = period * 10 ** 6 / other
        if (first * 100).denominator != 1 or sine > Fraction(1, 5) or other == wavelength or ratio.denominator == 1:
            continue
        maxima = 2 * (ratio.numerator // ratio.denominator) + 1
        if maxima > 99:
            continue
        out.append((lines, wavelength, Fraction(screen), first, order, sine, other, maxima))
    return tuple(shuffled(4501, distinct(out, key=lambda v: v[:5])))


def t_grating(rng: random.Random, year: int, k: int) -> dict:
    lines, wavelength, screen, first, order, sine, other, maxima = pick(grating_versions(), k)
    period = Fraction(1, lines)
    position = order * first
    return {
        "skill": "Дифракцын торын туршилт",
        "prompt": (f"1 мм-т {lines} зураастай дифракцын торон дээр дан өнгийн гэрлийг эгц тусгаж, тороос {num(screen)} м зайд "
                   f"байрлуулсан дэлгэц дээр дифракцын зургийг гаргав. Нэгдүгээр эрэмбийн гол максимум төвийн максимумаас "
                   f"{num(first)} мм зайд үүсэв. Бага өнцгийн хувьд sinφ ≈ tgφ гэж үзнэ."),
        "parts": [
            {"prompt": "Торын тогтмол [a]·10⁻⁶ м.", "answer": text(period * 1000)},
            {"prompt": "Туссан гэрлийн долгионы урт [b] нм.", "answer": str(wavelength)},
            {"prompt": f"Төвийн максимумаас {num(position)} мм зайд [c]-р эрэмбийн гол максимум үүснэ.", "answer": str(order)},
            {"prompt": f"Энэ торон дээр {other} нм долгионы урттай гэрэл тусгавал нийт [d] гол максимум ажиглагдана.", "answer": str(maxima)},
        ],
        "solution": (f"1) d = 1/{lines} мм = {text(period * 1000)}·10⁻⁶ м. "
                     f"2) d·x1/L = λ ⇒ λ = {text(period * 1000)}·10⁻⁶·{num(first)}·10⁻³/{num(screen)} = {wavelength}·10⁻⁹ м = {wavelength} нм. "
                     f"3) x_k = k·x1 ⇒ k = {num(position)}/{num(first)} = {order}. "
                     f"4) k_max < d/λ = {text(period * 10 ** 6)}/{other} = {num(period * 10 ** 6 / other)} ⇒ k_max = {(maxima - 1) // 2}; "
                     f"нийт 2·{(maxima - 1) // 2} + 1 = {maxima} гол максимум."),
    }


# ---------------------------------------------------------------------------
# Simple pendulum
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def pendulum_versions(equation: bool) -> tuple:
    out = []
    for omega, amplitude, mass in itertools.product((2, Fraction(5, 2), 4, 5, 10), (1, 2, 3, 4, 5, 6, 8, 10), (Fraction(1, 10), Fraction(1, 5), Fraction(1, 2), 1, 2)):
        length = Fraction(10) / (omega * omega)  # м
        if amplitude * 10 > length * 100:  # keep the swing small (A ≤ 0.1·L, under about 6°)
            continue
        energy = Fraction(mass) * (Fraction(omega) * amplitude / 100) ** 2 / 2 * 1000
        force = Fraction(mass) * omega * omega * amplitude / 100
        if (energy * 1000).denominator != 1 or (force * 1000).denominator != 1:
            continue
        out.append((Fraction(omega), Fraction(amplitude), mass, length))
    return tuple(shuffled(4601 + equation, out))


def t_pendulum(rng: random.Random, year: int, k: int) -> dict:
    equation = year == 2020
    omega, amplitude, mass, length = pick(pendulum_versions(equation), k)
    speed = omega * amplitude  # см/с
    period = Fraction(628, 100) / omega
    force = mass * omega * omega * amplitude / 100  # Н
    energy = mass * (speed / 100) ** 2 / 2 * 1000  # мЖ
    if equation:
        return {
            "skill": "Математик дүүжингийн хэлбэлзэл",
            "prompt": (f"{num(mass)} кг масстай ачаатай математик дүүжин x = {num(amplitude)}·cos({num(omega)}t) (см) хуулиар бага "
                       f"далайцтай хэлбэлзэнэ (t секундээр). g = 10 м/с², π = 3.14 гэж авна."),
            "parts": [
                {"prompt": "Дүүжингийн урт [a] м.", "answer": text(length)},
                {"prompt": "Хэлбэлзлийн үе [b] с.", "answer": text(period), "accept": roundings(dec(period), (2, 1))},
                {"prompt": "Ачаанд үйлчлэх сэргээх хүчний хамгийн их утга [c] Н.", "answer": text(force)},
                {"prompt": "Дүүжингийн бүрэн механик энерги [d] мЖ.", "answer": text(energy)},
            ],
            "solution": (f"1) ω = √(g/L) ⇒ L = g/ω² = 10/{num(omega)}² = {text(length)} м. "
                         f"2) T = 2π/ω = 6.28/{num(omega)} = {text(period)} с. "
                         f"3) F_max = mω²A = {num(mass)}·{num(omega)}²·{num(amplitude)}·10⁻² = {text(force)} Н. "
                         f"4) E = mω²A²/2 = {num(mass)}·({text(speed)}·10⁻²)²/2 Ж = {text(energy)} мЖ."),
        }
    return {
        "skill": "Математик дүүжингийн хэлбэлзэл",
        "prompt": (f"{text(length * 100)} см урттай жингүй, сунадаггүй утсанд {num(mass)} кг масстай жижиг ачаа дүүжлээд тэнцвэрийн "
                   f"байрнаас нь {num(amplitude)} см хазайлгаж тавив. g = 10 м/с², π = 3.14 гэж авна."),
        "parts": [
            {"prompt": "Хэлбэлзлийн тойрох давтамж [a] рад/с.", "answer": text(omega)},
            {"prompt": "Хэлбэлзлийн үе [b] с.", "answer": text(period), "accept": roundings(dec(period), (2, 1))},
            {"prompt": "Ачааны хурдны хамгийн их утга [c] см/с.", "answer": text(speed)},
            {"prompt": "Дүүжингийн бүрэн механик энерги [d] мЖ.", "answer": text(energy)},
        ],
        "solution": (f"1) ω = √(g/L) = √(10/{text(length)}) = {text(omega)} рад/с. "
                     f"2) T = 2π/ω = 6.28/{num(omega)} = {text(period)} с. "
                     f"3) υ_max = ωA = {num(omega)}·{num(amplitude)} = {text(speed)} см/с. "
                     f"4) E = mυ_max²/2 = {num(mass)}·({text(speed)}·10⁻²)²/2 Ж = {text(energy)} мЖ."),
    }


# ---------------------------------------------------------------------------
# Throws and energy
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def throw_versions(angled: bool) -> tuple:
    out = []
    if angled:
        for speed, sine, mass, time in itertools.product((10, 15, 20, 25, 30), (Fraction(3, 5), Fraction(4, 5)), (Fraction(1, 5), Fraction(1, 2), 1, 2), (Fraction(1, 2), 1, Fraction(3, 2))):
            vertical = speed * sine
            if time >= vertical / 10:
                continue
            out.append((Fraction(speed), sine, mass, Fraction(time)))
    else:
        for speed, mass, height in itertools.product((10, 12, 15, 20, 25, 30), (Fraction(1, 5), Fraction(1, 2), 1, 2, 3), (2, 3, 4, 5, 8, 10, 15)):
            top = Fraction(speed * speed, 20)
            if height >= top:
                continue
            out.append((Fraction(speed), mass, Fraction(height)))
    return tuple(shuffled(4701 + angled, out))


def t_throw(rng: random.Random, year: int, k: int) -> dict:
    if year == 2016:
        speed, sine, mass, time = pick(throw_versions(True), k)
        cosine = Fraction(4, 5) if sine == Fraction(3, 5) else Fraction(3, 5)
        vertical, horizontal = speed * sine, speed * cosine
        height = vertical * time - 5 * time * time
        potential = mass * 10 * height
        total = mass * speed * speed / 2
        return {
            "skill": "Шидэгдсэн биеийн энерги",
            "prompt": (f"{num(mass)} кг масстай биеийг газраас хэвтээ чигтэй α өнцөг үүсгэн {num(speed)} м/с хурдтай шидэв "
                       f"(sinα = {num(sine)}, cosα = {num(cosine)}, g = 10 м/с², агаарын эсэргүүцлийг тооцохгүй)."),
            "parts": [
                {"prompt": "Анхны хурдны босоо байгуулагч [a] м/с.", "answer": text(vertical)},
                {"prompt": "Анхны хурдны хэвтээ байгуулагч [b] м/с.", "answer": text(horizontal)},
                {"prompt": f"Шидсэнээс хойш {num(time)} с-ийн дараах биеийн потенциал энерги [c] Ж.", "answer": text(potential)},
                {"prompt": "Биеийн бүрэн механик энерги [d] Ж.", "answer": text(total)},
            ],
            "solution": (f"1) υy = υ0·sinα = {num(speed)}·{num(sine)} = {text(vertical)} м/с. "
                         f"2) υx = υ0·cosα = {num(speed)}·{num(cosine)} = {text(horizontal)} м/с. "
                         f"3) h = υy·t − gt²/2 = {text(vertical)}·{num(time)} − 5·{num(time)}² = {text(height)} м, Eп = mgh = {text(potential)} Ж. "
                         f"4) E = mυ0²/2 = {num(mass)}·{num(speed)}²/2 = {text(total)} Ж (газрын түвшнээс)."),
        }
    speed, mass, height = pick(throw_versions(False), k)
    kinetic = mass * speed * speed / 2
    top = speed * speed / 20
    potential = mass * 10 * height
    remaining = kinetic - potential
    return {
        "skill": "Шидэгдсэн биеийн энерги",
        "prompt": (f"{num(mass)} кг масстай биеийг газраас босоо дээш {num(speed)} м/с хурдтай шидэв "
                   f"(g = 10 м/с², агаарын эсэргүүцлийг тооцохгүй, потенциал энергийг газрын түвшнээс тооцно)."),
        "parts": [
            {"prompt": "Шидэх агшин дахь кинетик энерги [a] Ж.", "answer": text(kinetic)},
            {"prompt": "Бие газраас [b] м хамгийн их өндөрт гарна.", "answer": text(top)},
            {"prompt": f"{num(height)} м өндөрт биеийн потенциал энерги [c] Ж.", "answer": text(potential)},
            {"prompt": f"{num(height)} м өндөрт биеийн кинетик энерги [d] Ж.", "answer": text(remaining)},
        ],
        "solution": (f"1) Eк = mυ0²/2 = {num(mass)}·{num(speed)}²/2 = {text(kinetic)} Ж. "
                     f"2) h_max = υ0²/(2g) = {num(speed)}²/20 = {text(top)} м. "
                     f"3) Eп = mgh = {num(mass)}·10·{num(height)} = {text(potential)} Ж. "
                     f"4) Механик энерги хадгалагдана: Eк' = Eк − Eп = {text(kinetic)} − {text(potential)} = {text(remaining)} Ж."),
    }


# ---------------------------------------------------------------------------
# Converging lens
# ---------------------------------------------------------------------------

@lru_cache(maxsize=None)
def lens_versions() -> tuple:
    out = []
    for distance, magnification, near in itertools.product((12, 15, 20, 24, 25, 30, 36, 40, 45, 50, 60), (2, 3, 4, 5), (Fraction(1, 2), Fraction(2, 3), Fraction(3, 4))):
        image = distance * magnification
        focal = Fraction(distance * image, distance + image)
        if focal.denominator != 1 or (Fraction(100, focal) * 100).denominator != 1:
            continue
        close = focal * near
        if close.denominator != 1:
            continue
        virtual = close * focal / (focal - close)
        gain = virtual / close
        if virtual.denominator != 1 or (gain * 100).denominator != 1:
            continue
        out.append((distance, magnification, focal, close, virtual, gain))
    return tuple(shuffled(4801, out))


def t_lens(rng: random.Random, year: int, k: int) -> dict:
    distance, magnification, focal, close, virtual, gain = pick(lens_versions(), k)
    power = Fraction(100) / focal
    return {
        "skill": "Цуглуулагч линзний дүрс",
        "prompt": (f"Нимгэн цуглуулагч линзээс {distance} см зайд биеийг байрлуулахад урвуу, бодит, {magnification} дахин "
                   f"томорсон дүрс үүсэв."),
        "parts": [
            {"prompt": "Линзийн фокусын зай [a] см.", "answer": text(focal)},
            {"prompt": "Линзийн оптик хүч [b] дптр.", "answer": text(power)},
            {"prompt": f"Биеийг линзээс {text(close)} см зайд байрлуулбал шууд, хуурмаг дүрс линзээс [c] см зайд үүснэ.", "answer": text(virtual)},
            {"prompt": "Энэ үеийн дүрсийн өсгөлт [d].", "answer": text(gain)},
        ],
        "solution": (f"1) Γ = f/d ⇒ f = {magnification}·{distance} = {distance * magnification} см; 1/F = 1/d + 1/f ⇒ "
                     f"F = df/(d+f) = {distance}·{distance * magnification}/{distance + distance * magnification} = {text(focal)} см. "
                     f"2) D = 1/F = 1/{num(focal / 100)} м = {text(power)} дптр. "
                     f"3) d < F тул дүрс хуурмаг: 1/F = 1/d − 1/f ⇒ f = dF/(F − d) = {text(close)}·{text(focal)}/({text(focal)} − {text(close)}) = {text(virtual)} см. "
                     f"4) Γ = f/d = {text(virtual)}/{text(close)} = {text(gain)}."),
    }


TASKS = {
    "t_incline": t_incline,
    "t_vessel": t_vessel,
    "t_circuit": t_circuit,
    "t_efield": t_efield,
    "t_grating": t_grating,
    "t_pendulum": t_pendulum,
    "t_throw": t_throw,
    "t_lens": t_lens,
}
