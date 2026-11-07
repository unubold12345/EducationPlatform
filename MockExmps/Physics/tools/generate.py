"""Offline authoring generator for the physics mock exams.

This folder is never imported by the application.  The generator emits one
JSON paper per variant, using the item count and point split of the reference
year.  Answers are calculated from the same data used to write the question.
"""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

from figures import render_svg

ROOT = Path(__file__).resolve().parents[1]
AUTHOR = "OpenCode (DeepSeek V4.1 Flash)"
G = 10.0
R = 8.31
ALPHA_AL = 24e-6

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


def combination_options(rng: random.Random, true_indices: list[int], total: int = 4):
    """Build a correct combination and four distinct wrong combinations."""
    answer = ", ".join(str(index) for index in sorted(true_indices))
    candidates = []
    for mask in range(1, 1 << total):
        text = ", ".join(str(index + 1) for index in range(total) if mask & (1 << index))
        if text != answer:
            candidates.append(text)
    return answer, rng.sample(candidates, 4)


class Paper:
    def __init__(self, year: int, variant: int):
        self.year = year
        self.variant = variant
        self.items: list[dict] = []

    def mc(self, number: int, data: dict, points: int) -> None:
        answer = option(data["answer"])
        options = [answer]
        for wrong in data["wrong"]:
            text = option(wrong)
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
            parts.append(
                {
                    "id": str(index + 1),
                    "points": part_points[index],
                    "prompt": part["prompt"],
                    "answer": option(part["answer"]),
                }
            )
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
# Part I item generators
# ---------------------------------------------------------------------------

def q01(rng: random.Random, year: int) -> dict:
    length = rng.choice([6.4, 7.2, 8.5, 9.1, 10.3, 11.6, 12.4])
    answer = f"{length:.1f} ± 0.05 см"
    wrong = [
        f"{length:.1f} ± 0.1 см",
        f"{length:.1f} ± 0.5 см",
        f"{length:.1f} ± 0.01 см",
        f"{length:.1f} ± 0.005 см",
    ]
    return {
        "skill": "Хэмжилтийн үнэмлэхүй алдаа",
        "prompt": (
            f"Шугамчны хуваалт 1 мм. Харандааны уртыг хэмжихэд "
            f"{length:.1f} см болж уншив. Хэмжилтийн үр дүнг үнэмлэхүй "
            f"алдаатай зөв бичсэн хувилбарыг сонго."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "1 мм хуваалттай шугамчнаас уншихад алдаа нь хуваалтын хагас, "
            "өөрөөр хэлбэл 0.5 мм = 0.05 см байна."
        ),
        "figure": {"kind": "ruler", "length_cm": length, "division_mm": 1},
    }


def q02(rng: random.Random, year: int) -> dict:
    patterns = [
        {
            "points": [[0, 0], [2, 12], [5, 12], [8, 0]],
            "answer": "Эхлээд жигд хурдасч, дараа нь жигд хөдөлж, эцэст нь жигд саарна.",
            "solution": (
                "Графикийн налуу эерэг хэсэгт хурд өсөж, тэг налуутай хэсэгт "
                "тогтмол, сөрөг налуутай хэсэгт хурд буурна."
            ),
        },
        {
            "points": [[0, 12], [2, 4], [5, 4], [8, 12]],
            "answer": "Эхлээд жигд саарч, дараа нь жигд хөдөлж, эцэст нь жигд хурдасна.",
            "solution": (
                "Эхний хэсэгт налуу сөрөг тул хурд буурч, дунд хэсэгт тогтмол, "
                "эцэст налуу эерэг тул хурд өснө."
            ),
        },
        {
            "points": [[0, 0], [3, 9], [8, 9]],
            "answer": "Эхлээд жигд хурдасч, дараа нь жигд хөдөлнө.",
            "solution": "Эхний хэсэгт хурд шугаман өсөж, дараа нь тогтмол байна.",
        },
        {
            "points": [[0, 9], [8, 0]],
            "answer": "Бүх хугацаанд жигд саарна.",
            "solution": "График бүхэлдээ нэг шулуун бөгөөд налуу нь сөрөг байна.",
        },
        {
            "points": [[0, 0], [8, 12]],
            "answer": "Бүх хугацаанд жигд хурдасна.",
            "solution": "График бүхэлдээ нэг шулуун бөгөөд налуу нь эерэг байна.",
        },
    ]
    chosen = rng.choice(patterns)
    return {
        "skill": "Хурд-хугацааны график",
        "prompt": (
            "Хурд-хугацааны графикт үзүүлсэн хөдөлгөөнийг зөв "
            "тодорхойлсон хувилбарыг сонго."
        ),
        "answer": chosen["answer"],
        "wrong": [item["answer"] for item in patterns if item is not chosen],
        "solution": chosen["solution"],
        "figure": {"kind": "v_t_graph", "points": chosen["points"]},
    }


def q03(rng: random.Random, year: int) -> dict:
    graphs = [
        {
            "points": [[0, 0], [4, 8], [8, 8], [12, -8]],
            "distance": 64,
            "displacement": 48,
        },
        {
            "points": [[0, 0], [2, 10], [6, 10], [8, 0]],
            "distance": 60,
            "displacement": 60,
        },
        {
            "points": [[0, 0], [3, 6], [7, 6], [10, -6]],
            "distance": 42,
            "displacement": 33,
        },
        {
            "points": [[0, 0], [5, 10], [9, 10], [12, 0]],
            "distance": 80,
            "displacement": 80,
        },
        {
            "points": [[0, 0], [4, 12], [8, 12], [12, -12]],
            "distance": 96,
            "displacement": 72,
        },
    ]
    chosen = rng.choice(graphs)
    answer = f"Зам {chosen['distance']} м, шилжилт {chosen['displacement']} м"
    return {
        "skill": "Зам ба шилжилт",
        "prompt": (
            f"Графикт үзүүлсэн хөдөлгөөний 0–{chosen['points'][-1][0]} с "
            "хугацааны зам ба шилжилтийг ол."
        ),
        "answer": answer,
        "wrong": [
            f"Зам {item['distance']} м, шилжилт {item['displacement']} м"
            for item in graphs
            if item is not chosen
        ],
        "solution": (
            "Графикийн доорх талбайнуудыг нэмнэ. Зам нь бүх сегментийн "
            "абсолют талбайн нийлбэр, шилжилт нь тэмдэгтэй талбайн нийлбэр: "
            f"зам {chosen['distance']} м, шилжилт {chosen['displacement']} м."
        ),
        "figure": {"kind": "v_t_graph", "points": chosen["points"]},
    }


def q04(rng: random.Random, year: int) -> dict:
    masses = [1, 2, 3]
    rng.shuffle(masses)
    positions = [0.0, 0.5, 1.0]
    centre = sum(m * x for m, x in zip(masses, positions)) / sum(masses)
    answer = f"{centre:.2f} м"
    candidates = [
        f"{centre + 0.05:.2f} м",
        f"{centre - 0.05:.2f} м",
        f"{centre + 0.10:.2f} м",
        f"{centre - 0.10:.2f} м",
        "0.50 м",
        "0.75 м",
    ]
    wrong = []
    for candidate in candidates:
        if candidate != answer and candidate not in wrong:
            wrong.append(candidate)
        if len(wrong) == 4:
            break
    return {
        "skill": "Хүндийн төв",
        "prompt": (
            "1 м урттай, массыг нь үл тоомсорлож болох саваа дээр "
            f"{masses[0]} кг, {masses[1]} кг, {masses[2]} кг бөмбөлгүүдийг "
            "0 м, 0.5 м, 1 м зайд бэхлэв. Хүндийн төвийн байрлалыг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "x_c = (m1x1 + m2x2 + m3x3) / (m1 + m2 + m3). "
            f"Орлуулахад x_c = {centre:.2f} м."
        ),
        "figure": {
            "kind": "rod_with_masses",
            "length_m": 1,
            "masses_kg": masses,
            "positions_m": positions,
        },
    }


def q05(rng: random.Random, year: int) -> dict:
    force1, arm1, arm2, force2 = rng.choice(
        [
            (40, 1.2, 0.8, 60),
            (30, 1.0, 0.5, 60),
            (20, 1.5, 1.0, 30),
            (50, 0.8, 0.5, 80),
            (60, 1.0, 0.6, 100),
        ]
    )
    return {
        "skill": "Хөшүүргийн тэнцвэр",
        "prompt": (
            f"Хөшүүргийн нэг талд {force1} Н ачаа {arm1:g} м зайд өлгөв. "
            f"Тэнцвэртэй байхын тулд нөгөө талд {arm2:g} м зайд ямар хүч "
            "үйлчлэх вэ?"
        ),
        "answer": f"{force2} Н",
        "wrong": pick_wrongs(
            f"{force2} Н",
            [
                f"{force1} Н",
                f"{force2 // 2} Н",
                f"{force2 * 2} Н",
                f"{force2 - 10} Н",
                f"{force2 + 10} Н",
                f"{max(5, force2 // 3)} Н",
            ],
        ),
        "solution": (
            "Хөшүүргийн тэнцвэрийн нөхцөл: F1·d1 = F2·d2. "
            f"F2 = {force1}·{arm1:g}/{arm2:g} = {force2} Н."
        ),
        "figure": {
            "kind": "lever",
            "force_n": force1,
            "arm_m": arm1,
            "other_arm_m": arm2,
        },
    }


def q06(rng: random.Random, year: int) -> dict:
    mass = rng.choice([50, 60, 70, 80])
    acceleration = rng.choice([1, 2, 3])
    direction = rng.choice(["дээш", "доош"])
    normal = mass * (G + acceleration) if direction == "дээш" else mass * (G - acceleration)
    other = mass * (G - acceleration) if direction == "дээш" else mass * (G + acceleration)
    answer = f"{normal} Н"
    wrong = [f"{mass * G} Н", f"{other} Н", f"{mass * acceleration} Н", f"{normal + 10} Н"]
    return {
        "skill": "Лифтэн дэх жин",
        "prompt": (
            f"{mass} кг масстай хүн {acceleration} м/с² хурдатгалтай "
            f"{direction} хөдөлж буй лифтэнд зогсож байна. Хүний жинг ол. "
            "(g = 10 м/с²)"
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Дээш хурдатгалтай үед N = m(g+a), доош хурдатгалтай үед "
            f"N = m(g−a). Энд N = {normal} Н."
        ),
        "figure": {"kind": "elevator", "mass_kg": mass, "acceleration": acceleration},
    }


def q07(rng: random.Random, year: int) -> dict:
    time = rng.choice([1, 3, 5])
    force = 10 if time in (1, 5) else 20
    return {
        "skill": "Хүч-хугацааны график",
        "prompt": (
            f"Хүч-хугацааны графикт үзүүлсэн t = {time} с үеийн хүчийг ол."
        ),
        "answer": f"{force} Н",
        "wrong": [f"{force + 10} Н", f"{force - 5} Н", "0 Н", "40 Н"],
        "solution": (
            "Графикийн 0–2 с хэсэгт хүч 0-ээс 20 Н хүртэл шугаман өсөж, "
            "2–4 с хэсэгт 20 Н тогтмол, 4–6 с хэсэгт 20-оос 0 Н хүртэл буурна."
        ),
        "figure": {
            "kind": "f_t_graph",
            "points": [[0, 0], [2, 20], [4, 20], [6, 0]],
        },
    }


def q08(rng: random.Random, year: int) -> dict:
    ramp_up, ramp_down, force = rng.choice(
        [(2, 4, 20), (1, 5, 20), (3, 5, 15), (1, 4, 20), (2, 6, 10), (3, 4, 20)]
    )
    impulse = force * (0.5 * ramp_up + (ramp_down - ramp_up) + 0.5 * (6 - ramp_down))
    answer = f"{impulse:g} Н·с"
    return {
        "skill": "Импульс",
        "prompt": (
            "Хүч-хугацааны графикт үзүүлсэн 0–6 с хугацааны импульсийг ол."
        ),
        "answer": answer,
        "wrong": pick_wrongs(
            answer,
            [
                f"{impulse - 20:g} Н·с",
                f"{impulse + 20:g} Н·с",
                f"{impulse * 2:g} Н·с",
                f"{impulse / 2:g} Н·с",
                f"{impulse + 10:g} Н·с",
                f"{max(10, impulse - 10):g} Н·с",
            ],
        ),
        "solution": (
            "Импульс нь F–t графикийн доорх талбай: "
            f"0.5·{ramp_up}·{force} + ({ramp_down}−{ramp_up})·{force} + "
            f"0.5·(6−{ramp_down})·{force} = {impulse:g} Н·с."
        ),
        "figure": {
            "kind": "f_t_graph",
            "points": [[0, 0], [ramp_up, force], [ramp_down, force], [6, 0]],
        },
    }


def q09(rng: random.Random, year: int) -> dict:
    mass_g, stiffness, compression_cm, speed = rng.choice(
        [
            (20, 200, 10, 10),
            (40, 100, 10, 5),
            (30, 300, 10, 10),
            (10, 400, 10, 20),
            (20, 200, 20, 20),
        ]
    )
    return {
        "skill": "Пүршний энерги",
        "prompt": (
            f"{stiffness} Н/м хатуулагтай пүршийг {compression_cm} см шахаж "
            f"{mass_g} г сум харвав. Сумны хурдыг ол."
        ),
        "answer": f"{speed} м/с",
        "wrong": [f"{speed // 2} м/с", f"{speed * 2} м/с", f"{speed + 3} м/с", f"{max(1, speed - 2)} м/с"],
        "solution": (
            "Пүршний потенциал энерги кинетик энергид шилжинэ: "
            "½kx² = ½mv². Энд v = x·√(k/m)."
        ),
        "figure": {
            "kind": "spring_launcher",
            "stiffness_n_m": stiffness,
            "compression_cm": compression_cm,
            "mass_g": mass_g,
        },
    }


def q10(rng: random.Random, year: int) -> dict:
    initial_speed, height, final_speed = rng.choice(
        [(4, 0.45, 5), (3, 0.8, 5), (5, 1.2, 7), (0, 5, 10), (8, 1.8, 10)]
    )
    return {
        "skill": "Механик энергийн хадгалалт",
        "prompt": (
            f"{height:g} м өндрөөс {initial_speed:g} м/с хурдтайгаар гулсаж "
            "буй тоглоомон машины доод цэг дэх хурдыг ол. Үрэлтийг үл тоомсорло."
        ),
        "answer": f"{final_speed} м/с",
        "wrong": pick_wrongs(
            f"{final_speed} м/с",
            [
                f"{initial_speed} м/с",
                f"{final_speed - 2} м/с",
                f"{final_speed + 2} м/с",
                f"{final_speed * 2} м/с",
                f"{final_speed + 3} м/с",
                f"{max(1, final_speed - 3)} м/с",
            ],
        ),
        "solution": (
            "mgh + ½mv0² = ½mv². Энд v = √(v0² + 2gh) = "
            f"{final_speed} м/с."
        ),
        "figure": {
            "kind": "inclined_track",
            "height_m": height,
            "initial_speed": initial_speed,
        },
    }


def q11(rng: random.Random, year: int) -> dict:
    mass_t, speed, efficiency, time = rng.choice(
        [(2, 4, 0.5, 2), (3, 5, 0.6, 2), (4, 6, 0.75, 3), (2, 6, 0.8, 4), (5, 4, 0.5, 2)]
    )
    useful = mass_t * 1000 * G * speed * time
    answer = f"{useful / 1000:.0f} кЖ"
    wrong = pick_wrongs(
        answer,
        [
            f"{useful / efficiency / 1000:.0f} кЖ",
            f"{useful * 2 / 1000:.0f} кЖ",
            f"{useful * 1.5 / 1000:.0f} кЖ",
            f"{useful * 0.5 / 1000:.0f} кЖ",
            f"{useful * 0.25 / 1000:.0f} кЖ",
            f"{useful * (1 - efficiency) / 1000:.0f} кЖ",
        ],
    )
    return {
        "skill": "Чадал ба үр ашиг",
        "prompt": (
            f"{efficiency * 100:.0f}% үр ашигтай кран {mass_t} т ачааг "
            f"{speed} м/с хурдтайгаар өргөж байна. Эхний {time} с-д "
            "гүйцэтгэсэн ашигтай ажлыг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Ашигтай чадал P = mgv; ашигтай ажил A = P·t. "
            f"A = {mass_t}000·10·{speed}·{time} = {useful / 1000:.0f} кЖ."
        ),
        "figure": {
            "kind": "crane",
            "mass_t": mass_t,
            "speed_m_s": speed,
            "efficiency": efficiency,
            "time_s": time,
        },
    }


def q12(rng: random.Random, year: int) -> dict:
    length, delta_t = rng.choice([(50, 20), (80, 25), (100, 25), (120, 30), (100, 40)])
    change_cm = ALPHA_AL * length * delta_t * 100
    answer = f"{change_cm:g} см"
    wrong = [f"{change_cm / 2:g} см", f"{change_cm * 2:g} см", f"{change_cm / 10:g} см", f"{change_cm * 10:g} см"]
    return {
        "skill": "Дулааны тэлэлт",
        "prompt": (
            f"{length} м урттай хөнгөн цагаан утасны температур 15 °C-аас "
            f"{15 - delta_t} °C хүртэл буурахад урт нь хэр их өөрчлөгдөх вэ? "
            "α = 24·10⁻⁶ 1/°C."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "ΔL = αLΔT. ΔT = −"
            f"{delta_t} °C тул |ΔL| = 24·10⁻⁶·{length}·{delta_t} м = "
            f"{change_cm:g} см."
        ),
        "figure": {
            "kind": "thermal_expansion",
            "length_m": length,
            "delta_t": delta_t,
        },
    }


def q13(rng: random.Random, year: int) -> dict:
    celsius = rng.choice([10, 15, 20, 25, 30, 35])
    fahrenheit = 9 * celsius / 5 + 32
    return {
        "skill": "Температурын хуваарь",
        "prompt": f"Цельсийн {celsius} °C нь Фаренгейтийн хэдэн градус вэ?",
        "answer": f"{fahrenheit:.0f} °F",
        "wrong": [
            f"{fahrenheit - 18:.0f} °F",
            f"{fahrenheit + 18:.0f} °F",
            f"{fahrenheit + 9:.0f} °F",
            f"{fahrenheit - 9:.0f} °F",
        ],
        "solution": "F = 9C/5 + 32. Орлуулахад F = " + f"{fahrenheit:.0f} °F.",
        "figure": {"kind": "thermometer", "celsius": celsius},
    }


def q14(rng: random.Random, year: int) -> dict:
    substances = [
        ("Хөнгөн цагаан", 900),
        ("Төмөр", 460),
        ("Зэс", 390),
        ("Хар тугалга", 130),
        ("Мөнгө", 240),
    ]
    rows = []
    for name, specific in substances:
        mass = rng.choice([0.5, 1.0, 2.0])
        delta_t = rng.choice([10, 20, 30])
        heat = specific * mass * delta_t
        rows.append(
            {
                "substance": name,
                "mass_kg": mass,
                "delta_t": delta_t,
                "heat_j": heat,
            }
        )
    ask_high = rng.choice([True, False])
    if ask_high:
        answer = "Хөнгөн цагаан"
        prompt = (
            "Хүснэгтэд таван бодисын масс, температурын өөрчлөлт ба "
            "хүлээн авсан дулааны хэмжээг үзүүлэв. Аль бодисын хувийн "
            "дулаан хамгийн их вэ?"
        )
    else:
        answer = "Хар тугалга"
        prompt = (
            "Хүснэгтэд таван бодисын масс, температурын өөрчлөлт ба "
            "хүлээн авсан дулааны хэмжээг үзүүлэв. Аль бодисын хувийн "
            "дулаан хамгийн бага вэ?"
        )
    return {
        "skill": "Хувийн дулаан",
        "prompt": prompt,
        "answer": answer,
        "wrong": [name for name, _ in substances if name != answer],
        "solution": (
            "c = Q/(mΔT). Хүснэгтийн мэдээллээр хамгийн "
            f"{'их' if ask_high else 'бага'} утга нь {answer} бодист харгалзана."
        ),
        "figure": {
            "kind": "table",
            "columns": ["Бодис", "m, кг", "ΔT, °C", "Q, Ж"],
            "rows": [
                [
                    row["substance"],
                    f"{row['mass_kg']:g}",
                    str(row["delta_t"]),
                    str(row["heat_j"]),
                ]
                for row in rows
            ],
        },
    }


def q15(rng: random.Random, year: int) -> dict:
    mass1, temp1, final_temp, temp2, mass2 = rng.choice(
        [
            (20, 72, 36, 18, 40),
            (10, 80, 40, 20, 20),
            (30, 60, 30, 10, 45),
            (25, 70, 40, 10, 25),
            (15, 90, 50, 10, 15),
        ]
    )
    return {
        "skill": "Дулааны тэнцвэр",
        "prompt": (
            f"{temp1} °C-ын {mass1} кг халуун усыг {temp2} °C-ын хүйтэн "
            f"устай холиход {final_temp} °C болсон. Хүйтэн усны массыг ол."
        ),
        "answer": f"{mass2} кг",
        "wrong": pick_wrongs(
            f"{mass2} кг",
            [
                f"{mass1} кг",
                f"{mass2 // 2} кг",
                f"{mass2 + 10} кг",
                f"{mass2 * 2} кг",
                f"{mass2 + 5} кг",
                f"{max(1, mass2 - 5)} кг",
            ],
        ),
        "solution": (
            "m1c(T1−T) = m2c(T−T2). "
            f"m2 = {mass1}·({temp1}−{final_temp})/({final_temp}−{temp2}) = "
            f"{mass2} кг."
        ),
        "figure": {
            "kind": "calorimeter",
            "hot_mass_kg": mass1,
            "hot_temp_c": temp1,
            "cold_temp_c": temp2,
            "final_temp_c": final_temp,
        },
    }


def q16(rng: random.Random, year: int) -> dict:
    interval = rng.choice(["0–2", "2–5", "5–8", "10–12"])
    if interval == "2–5":
        answer = "Хайлах"
        explanation = "Температур 0 °C-д тогтмол байгаа нь хайлах процесс."
    elif interval == "10–12":
        answer = "Буцлах"
        explanation = "Температур 100 °C-д тогтмол байгаа нь буцлах процесс."
    else:
        answer = "Халах"
        explanation = "Температур тасралтгүй өсөж байгаа нь халах процесс."
    return {
        "skill": "Халах муруй",
        "prompt": (
            "Халаах процессын температур-хугацааны хүснэгтийг үзүүлэв. "
            f"{interval} мин хугацаанд ямар процесс явагдаж байна?"
        ),
        "answer": answer,
        "wrong": [item for item in ["Хайлах", "Буцлах", "Халах", "Конденсац", "Хөлдөх"] if item != answer],
        "solution": explanation,
        "figure": {
            "kind": "table",
            "columns": ["t, мин", "T, °C"],
            "rows": [
                ["0", "−10"],
                ["2", "0"],
                ["5", "0"],
                ["8", "20"],
                ["10", "100"],
                ["12", "100"],
            ],
        },
    }


def q17(rng: random.Random, year: int) -> dict:
    power, mass, delta_t, time, specific = rng.choice(
        [
            (500, 0.5, 20, 60, 3000),
            (200, 0.2, 20, 60, 3000),
            (400, 0.5, 20, 100, 4000),
            (300, 0.3, 10, 50, 5000),
            (600, 0.6, 20, 80, 4000),
        ]
    )
    return {
        "skill": "Хувийн дулаан",
        "prompt": (
            f"{power} Вт халаагуур {mass:g} кг шингэнийг {delta_t} °C-аар "
            f"халаахад {time} с зарцуулав. Шингэний хувийн дулааныг ол."
        ),
        "answer": f"{specific} Ж/(кг·°C)",
        "wrong": [
            f"{specific // 2} Ж/(кг·°C)",
            f"{specific * 2} Ж/(кг·°C)",
            f"{specific + 500} Ж/(кг·°C)",
            f"{max(100, specific - 500)} Ж/(кг·°C)",
        ],
        "solution": (
            "Q = Pt = mcΔT, иймд c = Pt/(mΔT). "
            f"c = {power}·{time}/({mass:g}·{delta_t}) = "
            f"{specific} Ж/(кг·°C)."
        ),
        "figure": {
            "kind": "heating_curve",
            "power_w": power,
            "mass_kg": mass,
            "delta_t": delta_t,
            "time_s": time,
        },
    }


def q18(rng: random.Random, year: int) -> dict:
    segment = rng.choice(["1–2", "2–3"])
    if segment == "1–2":
        answer = "Изобар"
        explanation = "1–2 хэсэгт даралт тогтмол, эзлэхүүн өсч байна."
    else:
        answer = "Изохор"
        explanation = "2–3 хэсэгт эзлэхүүн тогтмол, даралт өсч байна."
    return {
        "skill": "Идеал хийн процесс",
        "prompt": (
            "Зурагт нэг моль идеал хийн 1–2–3 процессыг p–V диаграммаар "
            f"үзүүлэв. {segment} процессын нэрийг тодорхойл."
        ),
        "answer": answer,
        "wrong": [item for item in ["Изобар", "Изохор", "Изотерм", "Адиабат", "Цикл"] if item != answer],
        "solution": explanation,
        "figure": {
            "kind": "p_v_diagram",
            "points": [[8.31, 200], [16.62, 200], [16.62, 300]],
            "labels": ["1", "2", "3"],
        },
    }


def q19(rng: random.Random, year: int) -> dict:
    pressure, volume = rng.choice([(100, 8.31), (150, 8.31), (200, 8.31), (200, 16.62), (250, 24.93)])
    internal = 1.5 * pressure * 1000 * volume / 1000
    answer = f"{internal / 1000:.2f} кЖ"
    wrong = [
        f"{internal / 2 / 1000:.2f} кЖ",
        f"{internal * 2 / 1000:.2f} кЖ",
        f"{internal * 1.5 / 1000:.2f} кЖ",
        f"{internal * 0.75 / 1000:.2f} кЖ",
    ]
    return {
        "skill": "Идеал хийн дотоод энерги",
        "prompt": (
            f"1 моль нэг атомт идеал хий {pressure} кПа даралттай, "
            f"{volume:g} л эзлэхүүнтэй байна. Дотоод энергийг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Нэг атомт идеал хийн дотоод энерги U = (3/2)pV. "
            f"U = 1.5·{pressure}·10³·{volume:g}·10⁻³ = "
            f"{internal / 1000:.2f} кЖ."
        ),
        "figure": {
            "kind": "gas_state",
            "pressure_kpa": pressure,
            "volume_l": volume,
        },
    }


def q20(rng: random.Random, year: int) -> dict:
    pressure1 = rng.choice([100, 150, 200])
    pressure2 = pressure1 + rng.choice([50, 100, 150])
    volume = rng.choice([8.31, 16.62])
    heat = 1.5 * (pressure2 - pressure1) * 1000 * volume / 1000
    answer = f"{heat / 1000:.2f} кЖ"
    wrong = [
        f"{heat / 2 / 1000:.2f} кЖ",
        f"{heat * 2 / 1000:.2f} кЖ",
        f"{heat * 1.5 / 1000:.2f} кЖ",
        f"{heat * 0.75 / 1000:.2f} кЖ",
    ]
    return {
        "skill": "Изохор процессын дулаан",
        "prompt": (
            f"1 моль нэг атомт идеал хийн эзлэхүүн тогтмол байхад даралт "
            f"{pressure1} кПа-аас {pressure2} кПа хүртэл өсөв. Хийнд өгсөн "
            "дулааны хэмжээг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Изохор процесст A = 0, иймд Q = ΔU = (3/2)VΔp. "
            f"Q = 1.5·{volume:g}·10⁻³·({pressure2 - pressure1})·10³ = "
            f"{heat / 1000:.2f} кЖ."
        ),
        "figure": {
            "kind": "p_v_diagram",
            "points": [[volume, pressure1], [volume, pressure2]],
            "labels": ["1", "2"],
        },
    }


def q21(rng: random.Random, year: int) -> dict:
    symbols = {
        "конденсатор": ("конденсаторыг", "зэрэгцээ хоёр шугам"),
        "гүйдлийн эх үүсвэр": (
            "гүйдлийн эх үүсвэрийг",
            "урт ба богино зэрэгцээ шугам",
        ),
        "эсэргүүцэл": ("эсэргүүцлийг", "тэгш өнцөгт"),
        "ороомог": ("ороомгийг", "ороомог шугам"),
        "амперметр": ("амперметрийг", "тойрог дотор A"),
        "вольтметр": ("вольтметрийг", "тойрог дотор V"),
    }
    target = rng.choice(list(symbols))
    accusative, answer = symbols[target]
    wrong = rng.sample(
        [description for name, (_, description) in symbols.items() if name != target],
        4,
    )
    return {
        "skill": "Хэлхээний тэмдэглэгээ",
        "prompt": (
            f"Цахилгаан хэлхээний тэмдэглэгээнүүдээс {accusative} зөв "
            "дүрсэлсэн хувилбарыг сонго."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": f"{accusative.capitalize()} {answer} гэж тэмдэглэнэ.",
        "figure": {"kind": "circuit_symbols", "target": target},
    }


def q22(rng: random.Random, year: int) -> dict:
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


def q23(rng: random.Random, year: int) -> dict:
    tables = {
        "AND": [("0", "0", "0"), ("0", "1", "0"), ("1", "0", "0"), ("1", "1", "1")],
        "OR": [("0", "0", "0"), ("0", "1", "1"), ("1", "0", "1"), ("1", "1", "1")],
        "NAND": [("0", "0", "1"), ("0", "1", "1"), ("1", "0", "1"), ("1", "1", "0")],
        "NOR": [("0", "0", "1"), ("0", "1", "0"), ("1", "0", "0"), ("1", "1", "0")],
        "XOR": [("0", "0", "0"), ("0", "1", "1"), ("1", "0", "1"), ("1", "1", "0")],
    }
    gate = rng.choice(list(tables))
    return {
        "skill": "Логик элемент",
        "prompt": (
            "Хүснэгтэд хоёр оролттой логик элементийн үнэний хүснэгтийг "
            "үзүүлэв. Энэ нь ямар логик элемент вэ?"
        ),
        "answer": gate,
        "wrong": [name for name in tables if name != gate],
        "solution": f"Хүснэгтийн гаралтын утгууд нь {gate} элементийн үнэний хүснэгттэй тохирч байна.",
        "figure": {
            "kind": "truth_table",
            "columns": ["A", "B", "Y"],
            "rows": [list(row) for row in tables[gate]],
        },
    }


def q24(rng: random.Random, year: int) -> dict:
    identities = [
        {
            "prompt": "A⊕B илэрхийллийг зөв хувиргасан хувилбарыг сонго.",
            "answer": "A·B̄ + Ā·B",
            "wrong": ["A·B + Ā·B̄", "A + B", "A·B", "Ā + B̄"],
            "solution": (
                "XOR буюу онцгой эсрэг үйлдэл нь нэг оролт 1, нөгөө нь 0 "
                "үед 1 болно: A·B̄ + Ā·B."
            ),
        },
        {
            "prompt": "A⊙B (XNOR) илэрхийллийг зөв хувиргасан хувилбарыг сонго.",
            "answer": "A·B + Ā·B̄",
            "wrong": ["A·B̄ + Ā·B", "A + B", "A·B", "Ā + B̄"],
            "solution": (
                "XNOR нь оролтууд ижил үед 1 болно: A·B + Ā·B̄."
            ),
        },
        {
            "prompt": "¬(A·B)-г зөв хувиргасан хувилбарыг сонго.",
            "answer": "Ā + B̄",
            "wrong": ["A + B", "Ā·B̄", "A·B", "A⊕B"],
            "solution": "Де Морганы хуулиар ¬(A·B) = Ā + B̄.",
        },
        {
            "prompt": "¬(A+B)-г зөв хувиргасан хувилбарыг сонго.",
            "answer": "Ā·B̄",
            "wrong": ["A·B", "Ā + B̄", "A+B", "A⊕B"],
            "solution": "Де Морганы хуулиар ¬(A+B) = Ā·B̄.",
        },
        {
            "prompt": "A + A·B илэрхийллийг зөв хялбарчилсан хувилбарыг сонго.",
            "answer": "A",
            "wrong": ["B", "A·B", "A+B", "Ā"],
            "solution": "Шингээх хуулиар A + A·B = A·(1+B) = A.",
        },
    ]
    chosen = rng.choice(identities)
    return {
        "skill": "Булийн алгебр",
        "prompt": chosen["prompt"],
        "answer": chosen["answer"],
        "wrong": chosen["wrong"],
        "solution": chosen["solution"],
    }


def q25(rng: random.Random, year: int) -> dict:
    left = rng.choice(["out", "in"])
    right = rng.choice(["out", "in"])
    if left == right:
        answer = "Тэг"
    elif left == "out" and right == "in":
        answer = "Дээш"
    else:
        answer = "Доош"
    left_text = "хуудаснаас гарч" if left == "out" else "хуудас руу орж"
    right_text = "хуудаснаас гарч" if right == "out" else "хуудас руу орж"
    return {
        "skill": "Параллель утасны соронзон орон",
        "prompt": (
            f"Хоёр параллель утасны зүүн утасны гүйдэл {left_text}, баруун "
            f"утасны гүйдэл {right_text} чиглэлтэй байна. Хоёр утасны "
            "дунд цэгт соронзон орны чиглэлийг ол."
        ),
        "answer": answer,
        "wrong": [item for item in ["Дээш", "Доош", "Зүүн", "Баруун", "Тэг"] if item != answer],
        "solution": (
            "Баруун гарын дүрмээр утас бүрийн талбарын чиглэлийг тодорхойлно. "
            "Гүйдэл ижил чиглэлтэй бол дунд цэгт талбарууд эсрэг чиглэж "
            "нэгдэн тэг болно; эсрэг чиглэлтэй бол нэмэгдэнэ."
        ),
        "figure": {
            "kind": "parallel_wires",
            "left_current": left,
            "right_current": right,
        },
    }


def q26(rng: random.Random, year: int) -> dict:
    frequency, capacitance = rng.choice([(50, 10), (50, 20), (50, 25), (60, 20), (100, 10)])
    reactance = 1 / (2 * math.pi * frequency * capacitance * 1e-6)
    answer = f"{reactance:.0f} Ом"
    wrong = [
        f"{reactance / 2:.0f} Ом",
        f"{reactance * 2:.0f} Ом",
        f"{reactance * 3:.0f} Ом",
        f"{reactance / 3:.0f} Ом",
    ]
    return {
        "skill": "Багтаамжийн эсэргүүцэл",
        "prompt": (
            f"{capacitance} мкФ багтаамжтай конденсаторыг {frequency} Гц "
            "давтамжтай хувьсах гүйдлийн хэлхээнд холбов. Багтаамжийн "
            "эсэргүүцлийг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "X_C = 1/(2πfC). "
            f"X_C = 1/(2π·{frequency}·{capacitance}·10⁻⁶) = {reactance:.0f} Ом."
        ),
        "figure": {
            "kind": "capacitor_ac",
            "capacitance_uf": capacitance,
            "frequency_hz": frequency,
        },
    }


def q27(rng: random.Random, year: int) -> dict:
    distance_factor = rng.choice([2, 3])
    charge_factor = rng.choice([2, 3])
    force_factor = charge_factor * distance_factor ** 2
    return {
        "skill": "Кулоны хууль",
        "prompt": (
            f"Хоёр цэгийн цэнэгийн хоорондох зайг {distance_factor} дахин "
            f"багасгаж, нэг цэнэгийг {charge_factor} дахин ихэсгэвэл "
            "Кулоны хүч хэрхэн өөрчлөгдөх вэ?"
        ),
        "answer": f"{force_factor} дахин ихэснэ",
        "wrong": pick_wrongs(
            f"{force_factor} дахин ихэснэ",
            [
                f"{distance_factor} дахин ихэснэ",
                f"{charge_factor} дахин ихэснэ",
                f"{force_factor // 2} дахин ихэснэ",
                f"{force_factor * 2} дахин ихэснэ",
                f"{max(2, force_factor // 3)} дахин ихэснэ",
                f"{force_factor + 3} дахин ихэснэ",
            ],
        ),
        "solution": (
            "F ∝ q1q2/r². Зай d дахин багасвал хүч d² дахин, цэнэг q дахин "
            f"ихэсвэл q дахин нэмэгдэнэ. Иймд {distance_factor}²·{charge_factor} "
            f"= {force_factor} дахин ихэснэ."
        ),
    }


def q28(rng: random.Random, year: int) -> dict:
    capacitance1, capacitance2, voltage = rng.choice(
        [(2, 3, 10), (3, 4, 12), (4, 6, 20), (6, 12, 24), (2, 6, 12)]
    )
    equivalent = capacitance1 + capacitance2
    charge = equivalent * voltage
    answer = f"{charge} мкКл"
    wrong = [
        f"{capacitance1 * voltage} мкКл",
        f"{capacitance2 * voltage} мкКл",
        f"{charge // 2} мкКл",
        f"{charge * 2} мкКл",
    ]
    return {
        "skill": "Конденсаторын параллель холболт",
        "prompt": (
            f"{capacitance1} мкФ ба {capacitance2} мкФ конденсаторуудыг "
            f"параллель холбож {voltage} В хүчдэл өгөв. Нийт цэнэгийг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Параллель холболтод C_экв = C1 + C2. "
            f"Q = C_экв·U = ({capacitance1}+{capacitance2})·{voltage} = {charge} мкКл."
        ),
        "figure": {
            "kind": "capacitor_circuit",
            "capacitances_uf": [capacitance1, capacitance2],
            "voltage_v": voltage,
        },
    }


CIRCUIT_SCENARIOS = [
    (4, 12, 4, 16, 2.0, 1.5, 0.5),
    (9, 18, 6, 36, 2.0, 1.5, 0.5),
    (1, 6, 3, 4, 2.0, 4 / 3, 2 / 3),
    (4, 6, 12, 16, 2.0, 2 / 3, 4 / 3),
    (2, 9, 18, 8, 2.0, 2 / 3, 4 / 3),
]


def q29(rng: random.Random, year: int) -> dict:
    r1, r2, r3, power1, total, current3, current2 = rng.choice(CIRCUIT_SCENARIOS)
    answer = f"{fmt(current3)} А"
    wrong = pick_wrongs(
        answer,
        [
            f"{fmt(current2)} А",
            f"{fmt(total)} А",
            f"{fmt(current3 * 2)} А",
            f"{fmt(current3 / 2)} А",
            f"{fmt(current2 * 2)} А",
            f"{fmt(current2 / 2)} А",
        ],
    )
    return {
        "skill": "Хэлхээний гүйдэл",
        "prompt": (
            f"R1 = {r1} Ом нь эх үүсвэртэй цуваа, R2 = {r2} Ом ба "
            f"R3 = {r3} Ом нь хоорондоо параллель холбогдсон. R1 нь "
            f"{power1} Вт чадалтай бол R3-аар гүйх гүйдлийг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            f"R1-ийн гүйдэл I = √(P1/R1) = √({power1}/{r1}) = {fmt(total)} А. "
            f"Параллель хэсгийн эквивалент эсэргүүцэл R_p = {r2}·{r3}/({r2}+{r3}) Ом, "
            f"түүний хүчдэл U_p = I·R_p. R3-аар гүйх гүйдэл I3 = U_p/R3 = {fmt(current3)} А."
        ),
        "figure": {
            "kind": "resistor_network",
            "r1": r1,
            "r2": r2,
            "r3": r3,
            "power1_w": power1,
        },
    }


def q30(rng: random.Random, year: int) -> dict:
    r1, r2, r3, power1, total, current3, current2 = rng.choice(CIRCUIT_SCENARIOS)
    answer = f"{fmt(current2)} А"
    wrong = pick_wrongs(
        answer,
        [
            f"{fmt(current3)} А",
            f"{fmt(total)} А",
            f"{fmt(current2 * 2)} А",
            f"{fmt(current2 / 2)} А",
            f"{fmt(current3 * 2)} А",
            f"{fmt(current3 / 2)} А",
        ],
    )
    return {
        "skill": "Хэлхээний гүйдэл",
        "prompt": (
            f"R1 = {r1} Ом нь эх үүсвэртэй цуваа, R2 = {r2} Ом ба "
            f"R3 = {r3} Ом нь хоорондоо параллель холбогдсон. R1 нь "
            f"{power1} Вт чадалтай бол R2-оор гүйх гүйдлийг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            f"R1-ийн гүйдэл I = √(P1/R1) = {fmt(total)} А. Параллель хэсгийн "
            f"эквивалент эсэргүүцэл R_p = {r2}·{r3}/({r2}+{r3}) Ом, "
            f"U_p = I·R_p. R2-оор гүйх гүйдэл I2 = U_p/R2 = {fmt(current2)} А."
        ),
        "figure": {
            "kind": "resistor_network",
            "r1": r1,
            "r2": r2,
            "r3": r3,
            "power1_w": power1,
        },
    }


def q31(rng: random.Random, year: int) -> dict:
    end = rng.choice(["бэхэлсэн", "сул"])
    if end == "бэхэлсэн":
        answer = "Фаз нь 180° өөрчлөгдөж, дээш чиглэсэн хэсэг нь доош болно."
    else:
        answer = "Фаз өөрчлөгдөхгүй, эсрэг чиглэлд ойно."
    wrong = [
        "Фаз нь 180° өөрчлөгдөж, дээш чиглэсэн хэсэг нь доош болно.",
        "Фаз өөрчлөгдөхгүй, ижил чиглэлээр ойно.",
        "Долгион ойхгүй, зөвхөн дамжина.",
        "Давтамж нь хоёр дахин ихэснэ.",
        "Долгионы урт нь хоёр дахин багасна.",
    ]
    wrong = [item for item in wrong if item != answer][:4]
    return {
        "skill": "Долгионы ойлт",
        "prompt": (
            f"Олсны нэг үзүүрийг {end} байхаар тогтоож, нөгөө үзүүрээс "
            "долгион илгээв. Ойсон долгион хэрхэн харагдах вэ?"
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            "Бэхэлсэн үзүүрээс ойход фазын өөрчлөлт 180° болж, долгион "
            "урвуу харагдана. Сул үзүүрээс ойход фаз өөрчлөгдөхгүй, "
            "ойсон долгион эсрэг чиглэлд тархана."
        ),
        "figure": {"kind": "wave_reflection", "end": end},
    }


def q32(rng: random.Random, year: int) -> dict:
    speed, half_wavelength, frequency = rng.choice(
        [(4, 0.1, 20), (2, 0.05, 20), (6, 0.1, 30), (8, 0.2, 20), (4, 0.2, 10)]
    )
    return {
        "skill": "Долгионы хурд ба давтамж",
        "prompt": (
            f"Долгион {speed} м/с хурдтай тархана. Хамгийн ойр орших "
            f"эсрэг фазтай цэгүүдийн хоорондох зай {half_wavelength:g} м бол "
            "долгионы давтамжийг ол."
        ),
        "answer": f"{frequency} Гц",
        "wrong": [f"{frequency // 2} Гц", f"{frequency * 2} Гц", f"{frequency * 10} Гц", f"{frequency // 10} Гц"],
        "solution": (
            "Эсрэг фазтай хамгийн ойр цэгүүдийн зай нь λ/2. "
            f"λ = 2·{half_wavelength:g} = {2 * half_wavelength:g} м; "
            f"f = v/λ = {speed}/{2 * half_wavelength:g} = {frequency} Гц."
        ),
        "figure": {
            "kind": "wave_profile",
            "speed_m_s": speed,
            "half_wavelength_m": half_wavelength,
        },
    }


def q33(rng: random.Random, year: int) -> dict:
    ratio = rng.choice([2, 3, 4])
    return {
        "skill": "Долгионы шилжилт",
        "prompt": (
            "Дууны долгион нэг орчноос нөгөө орчин руу нэвтрэхэд долгионы "
            f"урт нь {ratio} дахин багассан бол дууны давтамж хэрхэн өөрчлөгдөх вэ?"
        ),
        "answer": "Өөрчлөгдөхгүй.",
        "wrong": [
            f"{ratio} дахин багасна.",
            f"{ratio} дахин ихэснэ.",
            f"{ratio * 2} дахин багасна.",
            f"{ratio * 2} дахин ихэснэ.",
        ],
        "solution": (
            "Орчин солигдоход давтамж өөрчлөгдөхгүй; зөвхөн долгионы урт "
            "ба хурд өөрчлөгдөнө."
        ),
    }


def q34(rng: random.Random, year: int) -> dict:
    temperature = rng.choice([15, 20, 25, 30, 35])
    speed = 331 + 0.6 * temperature
    return {
        "skill": "Дууны хурд ба температур",
        "prompt": (
            "Агаарт тархах дууны хурд-температурын хамаарлын график өгөгджээ. "
            f"Агаарын температур {temperature} °C байх үед дуу тархах хурдыг ол."
        ),
        "answer": f"{speed:.0f} м/с",
        "wrong": pick_wrongs(
            f"{speed:.0f} м/с",
            [
                "331 м/с",
                "343 м/с",
                "345 м/с",
                "541 м/с",
                f"{speed - 6:.0f} м/с",
                f"{speed + 6:.0f} м/с",
            ],
        ),
        "solution": (
            "Графикийн шугаман хамаарлаас v ≈ 331 + 0.6T. "
            f"T = {temperature} °C үед v ≈ {speed:.0f} м/с."
        ),
        "figure": {
            "kind": "sound_speed_temperature",
            "intercept": 331,
            "slope": 0.6,
            "temperature_c": temperature,
        },
    }


def q35(rng: random.Random, year: int) -> dict:
    amplitude, frequency = rng.choice([(10, 20), (15, 25), (20, 50), (10, 25), (15, 50)])
    answer = f"{amplitude} мм, {frequency} Гц"
    wrong = [
        f"{amplitude} см, {frequency} Гц",
        f"{amplitude} мм, {frequency * 2} Гц",
        f"{amplitude} мм, {1 / frequency:.3f} Гц",
        f"{amplitude} мм, {1 / (2 * frequency):.3f} Гц",
    ]
    return {
        "skill": "Гармоник хэлбэлзэл",
        "prompt": (
            "Гармоник хэлбэлзэл хийж буй биеийн шилжилт-хугацааны график "
            "өгөгджээ. Хэлбэлзлийн далайц ба давтамжийг ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            f"Графикийн хамгийн их шилжилт {amplitude} мм, нэг бүтэн "
            f"хэлбэлзлийн хугацаа 1/{frequency} с тул давтамж {frequency} Гц."
        ),
        "figure": {
            "kind": "shm_displacement_time",
            "amplitude_mm": amplitude,
            "frequency_hz": frequency,
        },
    }


def q36(rng: random.Random, year: int) -> dict:
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


def q37(rng: random.Random, year: int) -> dict:
    false_statements = {
        "Зогсонги долгионоор энерги зөөгдөнө.": (
            "Зогсонги долгион энергийг нэг цэгээс нөгөө рүү зөөдөггүй; "
            "энерги зангилаа ба гүйлтийн цэгүүдийн хооронд тархана."
        ),
        "Долгионы давтамж орчин солигдоход өөрчлөгдөнө.": (
            "Орчин солигдоход давтамж өөрчлөгдөхгүй; зөвхөн долгионы урт ба "
            "хурд өөрчлөгдөнө."
        ),
        "Дууны хурд орчны нягтаас хамаарахгүй.": (
            "Дууны хурд орчны уян хатан чанар ба нягтаас хамаарна."
        ),
    }
    true_statements = [
        "Агаарт дуу тархах хурд агаарын температураас хамаардаг.",
        "Пүршийг түүний тэнхлэгийн дагуу хэлбэлзүүлэхэд үүсэх долгион тууш байна.",
        "Долгион тархахад бодис зөөгдөхгүй.",
        "Дууны өндөр нам нь хэлбэлзлийн давтамжаас хамаарна.",
        "Долгионы хурд нь орчны шинж чанараас хамаарна.",
        "Хөндлөн долгион нь хатуу биетийн гадаргуу болон шингэний гадаргуу дээгүүр тархаж болно.",
    ]
    answer = rng.choice(list(false_statements))
    wrong = rng.sample(true_statements, 4)
    return {
        "skill": "Долгионы шинж чанар",
        "prompt": "Долгионы тухай дараах мэдэгдлүүдээс БУРУУГИЙГ ол.",
        "answer": answer,
        "wrong": wrong,
        "solution": false_statements[answer],
    }


def q38(rng: random.Random, year: int) -> dict:
    oscillations, time, wavelength, speed = rng.choice(
        [(20, 10, 2, 4), (10, 5, 2, 4), (25, 5, 2, 10), (30, 10, 3, 9), (20, 5, 1, 4)]
    )
    return {
        "skill": "Долгионы хурд",
        "prompt": (
            f"Загасчин {time} с хугацаанд загасны уургын хөвөгч {oscillations} "
            f"удаа хэлбэлзэхийг ажиглав. Усны гадаргуугаар тархах долгионуудын "
            f"хоорондох зай {wavelength} м бол долгион ямар хурдтай тархаж байсан бэ?"
        ),
        "answer": f"{speed} м/с",
        "wrong": pick_wrongs(
            f"{speed} м/с",
            [
                f"{speed // 2} м/с",
                f"{speed * 2} м/с",
                f"{oscillations} м/с",
                f"{wavelength} м/с",
                f"{speed + 2} м/с",
                f"{max(1, speed - 1)} м/с",
            ],
        ),
        "solution": (
            f"f = N/t = {oscillations}/{time} = {oscillations / time:g} Гц; "
            f"v = fλ = {oscillations / time:g}·{wavelength} = {speed} м/с."
        ),
        "figure": {
            "kind": "water_waves",
            "oscillations": oscillations,
            "time_s": time,
            "wavelength_m": wavelength,
        },
    }


def q39(rng: random.Random, year: int) -> dict:
    statements = [
        (
            "Ойрын хараа муу хүн гүдгэр линз зүүдэг.",
            False,
            "Буруу: ойрын хараа муу хүн хүнхэр линз зүүдэг.",
        ),
        (
            "Холын хараа муу хүн хүнхэр линз зүүдэг.",
            False,
            "Буруу: холын хараа муу хүн гүдгэр линз зүүдэг.",
        ),
        (
            "Ойрын хараа муу хүний нүд дүрсийг торлог бүрхэвчийн өмнө үүсгэдэг.",
            True,
            "Зөв: ойрын хараа муу үед фокус торлог бүрхэвчийн өмнө байна.",
        ),
        (
            "Холын хараа муу хүний нүд дүрсийг торлог бүрхэвчийн ард үүсгэдэг.",
            True,
            "Зөв: холын хараа муу үед фокус торлог бүрхэвчийн ард байна.",
        ),
        (
            "Ойрын харааг гүдгэр линзээр засна.",
            False,
            "Буруу: ойрын харааг хүнхэр линзээр засна.",
        ),
        (
            "Холын харааг гүдгэр линзээр засна.",
            True,
            "Зөв: холын харааг гүдгэр линзээр засна.",
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


def q40(rng: random.Random, year: int) -> dict:
    if rng.random() < 0.5:
        prompt = "Агаараас ус руу гэрэл тусах үед n1 < n2 байна. Аль дүрслэл зөв вэ?"
        answer = (
            "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормаль руу ойртоно."
        )
        wrong = [
            "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормалаас холдоно.",
            "Ойсон туяа нормаль руу, хугарсан туяа нормалаас холдоно.",
            "Ойсон туяа байхгүй.",
            "Хугарсан туяа тусах туяатай параллель.",
        ]
        solution = (
            "Ойлтын хууль: ойлтын өнцөг = тусах өнцөг. Оптик нягт орчин руу "
            "нэвтрэхэд хугарсан туяа нормаль руу ойртоно."
        )
        figure = {"kind": "refraction", "from": "агаар", "to": "ус", "n1_less": True}
    else:
        prompt = "Уснаас агаар руу гэрэл тусах үед n1 > n2 байна. Аль дүрслэл зөв вэ?"
        answer = (
            "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормалаас холдоно."
        )
        wrong = [
            "Ойсон туяа тусах туяатай ижил өнцгөөр, хугарсан туяа нормаль руу ойртоно.",
            "Ойсон туяа нормаль руу, хугарсан туяа нормаль руу ойртоно.",
            "Ойсон туяа байхгүй.",
            "Хугарсан туяа тусах туяатай параллель.",
        ]
        solution = (
            "Ойлтын хууль: ойлтын өнцөг = тусах өнцөг. Оптик бага нягт орчин "
            "руу нэвтрэхэд хугарсан туяа нормалаас холдоно."
        )
        figure = {"kind": "refraction", "from": "ус", "to": "агаар", "n1_less": False}
    return {
        "skill": "Гэрлийн хугарал",
        "prompt": prompt,
        "answer": answer,
        "wrong": wrong,
        "solution": solution,
        "figure": figure,
    }


def q41(rng: random.Random, year: int) -> dict:
    intensity, distance = rng.choice([(50, 5), (100, 5), (150, 5), (200, 10), (100, 2)])
    illuminance = intensity / distance ** 2
    return {
        "skill": "Гэрэлтүүлэг",
        "prompt": (
            f"{distance:g} м өндөртэй гэрлийн шонгийн оройд I = {intensity} кд "
            "гэрлийн хүчтэй гэрэл үүсгэгч байрлана. Гэрэл үүсгэгчийн эгц "
            "доор газар дээрх гэрэлтүүлгийг ол."
        ),
        "answer": f"{illuminance:g} лк",
        "wrong": pick_wrongs(
            f"{illuminance:g} лк",
            [
                f"{intensity / distance:g} лк",
                f"{intensity * distance:g} лк",
                f"{illuminance * 2:g} лк",
                f"{illuminance / 2:g} лк",
                f"{illuminance * 3:g} лк",
                f"{illuminance + 5:g} лк",
            ],
        ),
        "solution": (
            "E = I/r². "
            f"E = {intensity}/{distance:g}² = {illuminance:g} лк."
        ),
        "figure": {
            "kind": "illuminance",
            "intensity_cd": intensity,
            "distance_m": distance,
        },
    }


def q42(rng: random.Random, year: int) -> dict:
    instruments = [
        {
            "name": "Интерферометрийг",
            "answer": "Гэрлийн долгионы урт, хугарлын илтгэгч, шугаман хэмжээг хэмжих",
            "wrong": [
                "Зөвхөн биеийн температурыг хэмжих",
                "Зөвхөн цахилгаан гүйдлийг хэмжих",
                "Зөвхөн дууны давтамжийг хэмжих",
                "Зөвхөн соронзон орны индукцийг хэмжих",
            ],
            "solution": (
                "Интерферометр нь гэрлийн интерференцийн үзэгдэлд үндэслэж, "
                "долгионы урт, хугарлын илтгэгч, шугаман хэмжээг нарийвчлан "
                "хэмжихэд ашиглагдана."
            ),
        },
        {
            "name": "Спектрометрийг",
            "answer": "Гэрлийн спектрийн бүрэлдэхүүн ба долгионы уртыг тодорхойлох",
            "wrong": [
                "Зөвхөн массыг хэмжих",
                "Зөвхөн даралтыг хэмжих",
                "Зөвхөн цахилгаан хүчдэлийг хэмжих",
                "Зөвхөн дууны хүчийг хэмжих",
            ],
            "solution": (
                "Спектрометр нь гэрлийг спектрд задалж, спектрийн шугамуудын "
                "байрлалаар бодисын бүрэлдэхүүн ба долгионы уртыг тодорхойлно."
            ),
        },
        {
            "name": "Поляриметрийг",
            "answer": "Гэрлийн поляризацийн чиглэл ба оптик идэвхийг хэмжих",
            "wrong": [
                "Зөвхөн гэрэлтүүлгийг хэмжих",
                "Зөвхөн температурыг хэмжих",
                "Зөвхөн соронзон орныг хэмжих",
                "Зөвхөн цахилгаан гүйдлийг хэмжих",
            ],
            "solution": (
                "Поляриметр нь гэрлийн поляризацийн чиглэл ба оптик идэвхт "
                "бодисын эргэлтийн өнцгийг хэмжихэд ашиглагдана."
            ),
        },
        {
            "name": "Люксметрийг",
            "answer": "Гэрэлтүүлгийг люксээр хэмжих",
            "wrong": [
                "Гэрлийн долгионы уртыг хэмжих",
                "Дууны давтамжийг хэмжих",
                "Хугарлын илтгэгчийг хэмжих",
                "Соронзон индукцийг хэмжих",
            ],
            "solution": "Люксметр нь гадаргуу дээрх гэрэлтүүлгийг люксээр хэмждэг.",
        },
        {
            "name": "Рефрактометрийг",
            "answer": "Шингэний хугарлын илтгэгчийг хэмжих",
            "wrong": [
                "Гэрэлтүүлгийг хэмжих",
                "Дууны хурдыг хэмжих",
                "Цахилгаан эсэргүүцлийг хэмжих",
                "Массыг хэмжих",
            ],
            "solution": (
                "Рефрактометр нь гэрлийн хугарлын өнцгөөс хамааруулан "
                "шингэний хугарлын илтгэгчийг хэмждэг."
            ),
        },
    ]
    chosen = rng.choice(instruments)
    return {
        "skill": "Оптик багаж",
        "prompt": f"{chosen['name']} юунд ашигладаг вэ?",
        "answer": chosen["answer"],
        "wrong": chosen["wrong"],
        "solution": chosen["solution"],
    }


TRANSITION_SETS = [
    [(1, 2), (2, 1), (2, 3), (3, 1), (4, 2)],
    [(1, 3), (3, 1), (2, 4), (4, 2), (3, 2)],
    [(1, 4), (4, 1), (2, 3), (3, 2), (4, 3)],
    [(1, 2), (2, 3), (3, 4), (4, 1), (1, 3)],
    [(2, 4), (4, 2), (1, 3), (3, 1), (2, 3)],
    [(1, 2), (2, 1), (3, 4), (4, 3), (2, 3)],
    [(1, 3), (3, 2), (2, 4), (4, 1), (3, 4)],
    [(1, 4), (4, 3), (3, 2), (2, 1), (1, 2)],
]


def q43(rng: random.Random, year: int) -> dict:
    transitions = rng.choice(TRANSITION_SETS)
    absorbed = [str(index + 1) for index, (start, end) in enumerate(transitions) if end > start]
    emitted = [str(index + 1) for index, (start, end) in enumerate(transitions) if end < start]
    answer = f"{', '.join(absorbed)} шингээнэ; {', '.join(emitted)} цацаргана"
    return {
        "skill": "Атомын энергийн шилжилт",
        "prompt": (
            "Диаграммд атомын энергийн түвшний хоорондох электроны боломжит "
            "шилжилтүүдийг үзүүлжээ. Аль шилжилтүүдэд фотон шингээгдэж, "
            "аль нь цацаргах вэ?"
        ),
        "answer": answer,
        "wrong": [
            f"{', '.join(emitted)} шингээнэ; {', '.join(absorbed)} цацаргана",
            "Бүх тохиолдолд зөвхөн шингээнэ",
            "Бүх тохиолдолд зөвхөн цацаргана",
            "Эдгээр шилжилтүүдэд фотон шингээгдэхгүй, цацаргахгүй",
        ],
        "solution": (
            "Бага энергийн түвшнээс их энергийн түвшин рүү шилжихэд фотон "
            "шингээгдэж, ихээс бага руу шилжихэд фотон цацарна."
        ),
        "figure": {
            "kind": "energy_levels",
            "levels": [1, 2, 3, 4],
            "transitions": transitions,
        },
    }


def q44(rng: random.Random, year: int) -> dict:
    transitions = rng.choice(TRANSITION_SETS)

    def energy_gap(start: int, end: int) -> float:
        return abs(-13.6 / start ** 2 + 13.6 / end ** 2)

    emitted = [
        (index, transition)
        for index, transition in enumerate(transitions)
        if transition[1] < transition[0]
    ]
    best, _ = max(emitted, key=lambda item: energy_gap(*item[1]))
    return {
        "skill": "Фотоны давтамж",
        "prompt": (
            "Устөрөгчийн атомын энергийн түвшин ба шилжилтүүдийг диаграммд "
            "үзүүлэв. Аль шилжилтэд хамгийн их давтамжтай фотон цацаргасан бэ?"
        ),
        "answer": str(best + 1),
        "wrong": [str(index + 1) for index in range(len(transitions)) if index != best],
        "solution": (
            "Устөрөгчийн түвшний энерги E_n = −13.6/n² эВ. Фотоны энерги "
            "E = hf, иймд хамгийн их энергийн ялгаатай цацаргах шилжилт нь "
            f"хамгийн их давтамжтай фотон өгнө. Энэ нь {best + 1}-р шилжилт."
        ),
        "figure": {
            "kind": "energy_levels",
            "levels": [1, 2, 3, 4],
            "energies_ev": [-13.6, -3.4, -1.51, -0.85],
            "transitions": transitions,
        },
    }


def q45(rng: random.Random, year: int) -> dict:
    isotope = rng.choice([("Тори", 232, 90), ("Уран", 235, 92), ("Уран", 238, 92), ("Радон", 220, 86)])
    name, mass_number, protons = isotope
    neutrons = mass_number - protons
    answer = f"{protons} протон, {neutrons} нейтрон"
    wrong = [
        f"{protons} протон, {mass_number} нейтрон",
        f"{mass_number} протон, {protons} нейтрон",
        f"{neutrons} протон, {protons} нейтрон",
        f"{neutrons} протон, {mass_number} нейтрон",
    ]
    return {
        "skill": "Изотопын бүтэц",
        "prompt": (
            f"{name}-{mass_number} (Z = {protons}) изотопын протон ба "
            "нейтроны тоог ол."
        ),
        "answer": answer,
        "wrong": wrong,
        "solution": (
            f"Протоны тоо Z = {protons}, нейтроны тоо N = A − Z = "
            f"{mass_number} − {protons} = {neutrons}."
        ),
        "figure": {
            "kind": "nuclide",
            "element": name,
            "mass_number": mass_number,
            "atomic_number": protons,
        },
    }


def q46(rng: random.Random, year: int) -> dict:
    chains = [
        ("Тори", 232, 90, "Радон", 220, 86),
        ("Уран", 238, 92, "Хар тугалга", 206, 82),
        ("Уран", 235, 92, "Хар тугалга", 207, 82),
        ("Ради", 226, 88, "Радон", 222, 86),
        ("Тори", 232, 90, "Хар тугалга", 208, 82),
    ]
    parent, parent_a, parent_z, daughter, daughter_a, daughter_z = rng.choice(chains)
    alpha_count = (parent_a - daughter_a) // 4
    beta_count = 2 * alpha_count - (parent_z - daughter_z)

    numbers = [
        "тэг",
        "нэг",
        "хоёр",
        "гурван",
        "дөрвөн",
        "таван",
        "зургаан",
        "долоон",
        "найман",
        "есөн",
        "арав",
    ]

    def alpha_text(count: int) -> str:
        return f"{numbers[count]} альфа"

    def beta_text(count: int) -> str:
        return "бетагүй" if count == 0 else f"{numbers[count]} бета"

    answer = f"{alpha_text(alpha_count)}, {beta_text(beta_count)}"
    return {
        "skill": "Цацраг идэвхт задрал",
        "prompt": (
            f"{parent} {parent_a} (Z = {parent_z}) изотоп хэд хэдэн цацраг "
            f"идэвхт задралын дараа {daughter} {daughter_a} (Z = {daughter_z}) "
            "изотопын цөм болж хувирсан. Ямар задралууд явагдсан бэ?"
        ),
        "answer": answer,
        "wrong": pick_wrongs(
            answer,
            [
                f"{alpha_text(alpha_count + 1)}, {beta_text(beta_count)}",
                f"{alpha_text(max(1, alpha_count - 1))}, {beta_text(beta_count)}",
                f"{alpha_text(alpha_count + 2)}, {beta_text(beta_count)}",
                f"{alpha_text(alpha_count)}, {beta_text(beta_count + 1)}",
                f"{alpha_text(alpha_count)}, {beta_text(max(0, beta_count - 1))}",
                f"{alpha_text(beta_count)}, {beta_text(alpha_count)}",
            ],
        ),
        "solution": (
            "Альфа задралд A 4-өөр, Z 2-оор буурна; бета задралд A өөрчлөгдөхгүй, "
            f"Z 1-ээр өснө. ΔA = {parent_a}−{daughter_a} = "
            f"{parent_a - daughter_a} = 4a тул a = {alpha_count}. "
            f"ΔZ = {parent_z}−{daughter_z} = {parent_z - daughter_z} = "
            f"2a − b = {2 * alpha_count} − b тул b = {beta_count}."
        ),
        "figure": {
            "kind": "decay_chain",
            "parent": [parent_a, parent_z],
            "daughter": [daughter_a, daughter_z],
        },
    }


# ---------------------------------------------------------------------------
# Part II item generators
# ---------------------------------------------------------------------------

CONNECTED_SCENARIOS = [
    dict(m2=10, mu_s=0.4, mu_k=0.2, m1_initial=2, m1_test=5),
    dict(m2=15, mu_s=11 / 30, mu_k=0.23, m1_initial=3, m1_test=6),
    dict(m2=20, mu_s=0.3, mu_k=0.12, m1_initial=3, m1_test=8),
    dict(m2=12, mu_s=0.5, mu_k=1 / 3, m1_initial=4, m1_test=8),
    dict(m2=8, mu_s=0.5, mu_k=0.4, m1_initial=2, m1_test=6),
]


def s21(rng: random.Random, year: int) -> dict:
    scenario = rng.choice(CONNECTED_SCENARIOS)
    m2 = scenario["m2"]
    mu_s = scenario["mu_s"]
    mu_k = scenario["mu_k"]
    m1_initial = scenario["m1_initial"]
    m1_test = scenario["m1_test"]
    weight = m2 * G
    friction = m1_initial * G
    threshold = mu_s * m2
    acceleration = (m1_test * G - mu_k * m2 * G) / (m1_test + m2)
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
                "answer": f"{threshold:g}",
            },
            {
                "prompt": f"m2 масстай бие m1 = {m1_test:g} кг үед [d] м/с² хурдатгалтай гулсана.",
                "answer": fmt(acceleration),
            },
        ],
        "solution": (
            f"1) P2 = m2g = {m2}·10 = {weight:g} Н. "
            f"2) m1 = {m1_initial} кг үед тайвны үрэлт m1g = {friction:g} Н; "
            f"хязгаар μс·m2g = {mu_s * m2 * G:g} Н тул хөдлөхгүй. "
            f"3) Гулсаж эхлэх нөхцөл m1g = μс·m2g, иймд m1 = μс·m2 = {threshold:g} кг. "
            f"4) m1 = {m1_test:g} кг үед a = (m1g − μ·m2g)/(m1+m2) = "
            f"{fmt(acceleration)} м/с²."
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
    dict(p1=200, v1=8.31, v2=16.62, p3=300),
    dict(p1=100, v1=8.31, v2=24.93, p3=200),
    dict(p1=150, v1=8.31, v2=16.62, p3=250),
    dict(p1=200, v1=8.31, v2=24.93, p3=400),
    dict(p1=120, v1=8.31, v2=16.62, p3=180),
]


def s22(rng: random.Random, year: int) -> dict:
    scenario = rng.choice(GAS_SCENARIOS)
    p1 = scenario["p1"]
    v1 = scenario["v1"]
    v2 = scenario["v2"]
    p3 = scenario["p3"]
    temperature1 = p1 * v1 / R
    work = p1 * (v2 - v1) / 1000
    max_state = "3" if p3 > p1 else "1"
    return {
        "skill": "Идеал хийн процесс",
        "prompt": (
            "Зурагт нэг моль, нэг атомт идеал хий явагдсан 1–2–3 процессыг "
            "p–V диаграммаар үзүүлэв. 1-р төлөвийн даралт p1 = "
            f"{p1} кПа, эзлэхүүн V1 = {v1:g} л, R = 8.31 Ж/(моль·К)."
        ),
        "parts": [
            {"prompt": "[a] төлөвт даралт хамгийн их байна.", "answer": max_state},
            {"prompt": "1-р төлөвийн температур [b] К.", "answer": f"{temperature1:.0f}"},
            {"prompt": "3-р төлөвт даралт [c] кПа.", "answer": f"{p3:g}"},
            {"prompt": "1–2 процесст хийн хийсэн ажил [d] кЖ.", "answer": f"{work:.1f}"},
        ],
        "solution": (
            f"1) p3 = {p3} кПа > p1 = {p1} кПа тул 3-р төлөвт даралт хамгийн их. "
            f"2) T1 = p1V1/(νR) = {p1}·10³·{v1:g}·10⁻³/(1·8.31) = {temperature1:.0f} К. "
            f"3) 2–3 изохор процесс тул p3 = {p3} кПа. "
            f"4) 1–2 изобар процесс: A = p1(V2−V1) = {p1}·10³·({v2:g}−{v1:g})·10⁻³ = {work:.1f} кЖ."
        ),
        "figure": {
            "kind": "p_v_diagram",
            "points": [[v1, p1], [v2, p1], [v2, p3]],
            "labels": ["1", "2", "3"],
        },
    }


CHARGE_SCENARIOS = [
    dict(B=2.5e-3, v=3e6, m=5e-23, q=2e-12),
    dict(B=0.1, v=1e6, m=1e-26, q=1e-19),
    dict(B=0.2, v=2e6, m=4e-26, q=2e-19),
    dict(B=0.02, v=5e6, m=2e-26, q=1e-19),
    dict(B=0.05, v=4e6, m=3e-26, q=2e-19),
]


def s23(rng: random.Random, year: int) -> dict:
    scenario = rng.choice(CHARGE_SCENARIOS)
    B = scenario["B"]
    v = scenario["v"]
    m = scenario["m"]
    q = scenario["q"]
    force = q * v * B
    radius = m * v / (q * B)
    period = 2 * math.pi * m / (q * B)
    radius_cm = radius * 100
    return {
        "skill": "Соронзон орон дахь цэнэгт бөөм",
        "prompt": (
            "Зургийн хавтгайд перпендикуляр цааш чиглэсэн "
            f"B = {sci(B)} Тл индукцтэй нэгэн төрлийн соронзон орон байв. "
            "Энэ орны соронзон индукцийн векторт перпендикуляраар "
            f"v = {sci(v)} м/с хурдтай, m = {sci(m)} кг масстай, эерэг "
            f"q = {sci(q)} Кл цэнэгтэй бөөм оруулахад R радиустай тойргоор хөдлөв."
        ),
        "parts": [
            {"prompt": "Соронзон орны зүгээс энэ цэнэгт бөөмд үйлчлэх Лоренцын хүч [a] чиглэлд үйлчилнэ.", "answer": "тойргийн төв рүү"},
            {"prompt": "Лоренцын хүчний хэмжээ [b] Н.", "answer": sci(force)},
            {"prompt": "Цэнэгт бөөм соронзон орон дотор [c] см радиустай тойргоор хөдөлнө.", "answer": fmt(radius_cm)},
            {"prompt": "Бөөмийн тойргоор нэг бүтэн эргэх хугацаа [d] с болно.", "answer": f"2π·{sci(period / (2 * math.pi))}"},
        ],
        "solution": (
            "Лоренцын хүч F = qvB, чиглэл нь эерэг цэнэгийн хувьд хурд ба "
            "соронзон орны векторт перпендикуляр, тойргийн төв рүү. "
            f"F = {sci(force)} Н. Радиус r = mv/(qB) = {fmt(radius_cm)} см. "
            f"Үе T = 2πm/(qB) = 2π·{sci(period / (2 * math.pi))} с."
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
    dict(m=0.2, A=0.5, omega=2 * math.pi, phi=math.pi / 3),
    dict(m=0.1, A=0.4, omega=4 * math.pi, phi=math.pi / 6),
    dict(m=0.5, A=0.3, omega=math.pi, phi=math.pi / 4),
    dict(m=0.2, A=0.2, omega=5 * math.pi, phi=math.pi / 2),
    dict(m=0.4, A=0.6, omega=2 * math.pi, phi=math.pi / 6),
]


def s24(rng: random.Random, year: int) -> dict:
    scenario = rng.choice(SHM_SCENARIOS)
    m = scenario["m"]
    A = scenario["A"]
    omega = scenario["omega"]
    phi = scenario["phi"]
    phase_denominator = round(math.pi / phi)
    period = 2 * math.pi / omega
    acceleration_coefficient = A * omega ** 2 / math.pi ** 2
    energy_coefficient = 0.5 * m * omega ** 2 * A ** 2 / math.pi ** 2
    return {
        "skill": "Гармоник хэлбэлзэл",
        "prompt": (
            f"{m:g} кг масстай бие x = {A:g} sin({fmt(omega / math.pi)}πt + "
            f"π/{phase_denominator}) хуулиар хэлбэлзэж байна (СИ)."
        ),
        "parts": [
            {"prompt": "Хэлбэлзлийн анхны фаз π/[a] рад.", "answer": str(phase_denominator)},
            {"prompt": "Хэлбэлзлийн үе [b] с.", "answer": fmt(period)},
            {"prompt": "Хурдатгалын далайц [c]·π² м/с².", "answer": fmt(acceleration_coefficient)},
            {"prompt": "Хэлбэлзлийн бүрэн энерги [d]·π² Ж.", "answer": fmt(energy_coefficient)},
        ],
        "solution": (
            f"1) Анхны фаз π/{phase_denominator} тул [a] = {phase_denominator}. "
            f"2) T = 2π/ω = {fmt(period)} с. "
            f"3) a_max = Aω² = {fmt(acceleration_coefficient)}π² м/с². "
            f"4) E = ½mω²A² = {fmt(energy_coefficient)}π² Ж."
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
        )
        paper.mc(number, data, 1 if one_point(year, number) else 2)
    for index, generator in enumerate(STRUCTURED_GENERATORS, start=1):
        data = generator(
            random.Random(year * 100_000 + variant * 1_000 + 100 + index),
            year,
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
