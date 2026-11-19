"""Helpers shared by the physics mock templates: number formatting, distractors and version pools.

Moved out of generate.py (2026-11-20) so the per-year template modules can use them without importing the
generator itself.
"""
from __future__ import annotations

import math
import random
import re
from decimal import ROUND_HALF_UP, Decimal
from fractions import Fraction

G = 10.0
R = 8.31


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


PAPERS = 60


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


def factor_text(factor: Fraction) -> str | None:
    if factor == 1:
        return "Өөрчлөгдөхгүй"
    if factor > 1 and factor.denominator == 1:
        return f"{factor} дахин ихэснэ"
    if factor < 1 and factor.numerator == 1:
        return f"{factor.denominator} дахин багасна"
    return None


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
