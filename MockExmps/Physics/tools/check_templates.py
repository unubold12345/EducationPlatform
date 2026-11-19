"""Smoke-check the Part I templates of one or more template modules.

    python check_templates.py items_mechanics items_fields

Each module exposes TEMPLATES = {template_id: function}. A function takes (rng, year, k) and returns the
dict Paper.mc expects: skill, prompt, answer, wrong (four or more), solution and optionally figure and rank.
For k = 0..179 this builds the five options the way Paper.mc does, renders any figure, and reports how many
distinct prompts the template gives (H4: a version may appear in at most three of the papers that use it).
"""
from __future__ import annotations

import importlib
import random
import sys

from common import balance_rank, option
from figures import render_svg

USES = 180


def options_of(data: dict, seed: int) -> list[str]:
    answer = option(data["answer"])
    wrongs = [option(wrong) for wrong in data["wrong"]]
    chosen = balance_rank(answer, wrongs, random.Random(seed)) if data.get("rank", True) else wrongs
    options = [answer]
    for text in chosen[:4]:
        if text not in options:
            options.append(text)
    return options


def check(module_name: str) -> int:
    module = importlib.import_module(module_name)
    failures = 0
    for name, function in module.TEMPLATES.items():
        prompts, problems = set(), []
        for k in range(USES):
            try:
                data = function(random.Random(k), 2020, k)
                for field in ("skill", "prompt", "answer", "wrong", "solution"):
                    if not data.get(field):
                        raise ValueError(f"empty {field}")
                options = options_of(data, k)
                if len(options) != 5:
                    raise ValueError(f"{len(options)} unique options: {options!r}")
                if option(data["answer"]) in [option(w) for w in data["wrong"]]:
                    raise ValueError("answer repeated among distractors")
                if data.get("figure"):
                    svg = render_svg(dict(data["figure"]))
                    if not svg.startswith("<svg"):
                        raise ValueError("figure did not render")
                prompts.add(data["prompt"] + repr(data.get("figure")))
            except Exception as exc:  # report and continue: every template is checked
                problems.append(f"k={k}: {exc}")
                if len(problems) >= 3:
                    break
        worst = -(-USES // max(len(prompts), 1))
        status = "ok" if not problems and len(prompts) >= 60 else "CHECK"
        if problems or len(prompts) < 60:
            failures += 1
        print(f"{status:5} {module_name}.{name}: {len(prompts)} distinct versions in {USES} uses (worst reuse {worst})")
        for problem in problems:
            print(f"      {problem}")
    return failures


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    total = sum(check(name) for name in sys.argv[1:])
    print("all templates passed" if total == 0 else f"{total} templates need attention")
    sys.exit(1 if total else 0)
