"""Shared helpers for the free half-length mocks.

Every free mock is written in the JSON shape the website already loads, so a later
integration only has to copy the file and register its slug:

* ЭЕШ papers use the stored-paper shape read by ``src/modules/exams/entrance/content.ts``
  (``assets/entrance-mocks/<subject>/<slug>.json``).
* SAT, IELTS, JLPT and HSK use a complete ``ExamDefinition`` (``src/modules/exams/types.ts``),
  the same shape as ``assets/jlpt/*.json`` and ``assets/hsk/*.json``.

Nothing here imports or changes website code.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

FREE = Path(__file__).resolve().parents[1]
ROOT = FREE.parents[1]
LETTERS = "ABCDE"


def write_json(path: Path, value) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    path.write_text(text, encoding="utf-8", newline="\n")
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write_text(path: Path, text: str) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not text.endswith("\n"):
        text += "\n"
    path.write_text(text, encoding="utf-8", newline="\n")
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def svg_size(svg: str) -> tuple[int, int]:
    import re
    root = re.search(r"<svg\b([^>]*)>", svg).group(1)
    box = re.search(r'viewBox="([^"]+)"', root)
    width = re.search(r'\bwidth="([\d.]+)"', root)
    height = re.search(r'\bheight="([\d.]+)"', root)
    if width and height:
        return round(float(width.group(1))), round(float(height.group(1)))
    parts = [float(p) for p in box.group(1).replace(",", " ").split()]
    return round(parts[2]), round(parts[3])


class Figures:
    """Collects SVG figures for one mock and writes them under ``<program>/images/<slug>/``."""

    def __init__(self, program_dir: Path, slug: str, public_prefix: str):
        self.dir = program_dir / "images" / slug
        self.prefix = public_prefix.rstrip("/")
        self.files: dict[str, str] = {}

    def add(self, name: str, svg: str, alt: str, expandable: bool = False) -> dict:
        if "<script" in svg or "foreignObject" in svg or "javascript:" in svg:
            raise ValueError(f"unsafe SVG {name}")
        self.files[name + ".svg"] = svg.strip() + "\n"
        w, h = svg_size(svg)
        figure = {"kind": "image", "src": f"{self.prefix}/{name}.svg", "alt": alt, "width": w, "height": h}
        if expandable:
            figure["expandable"] = True
        return figure

    def write(self) -> dict[str, str]:
        hashes = {}
        if self.dir.exists():
            for old in self.dir.glob("*.svg"):
                if old.name not in self.files:
                    old.unlink()
        for name, svg in self.files.items():
            hashes[name] = write_text(self.dir / name, svg)
        return hashes


# --------------------------------------------------------------------------- ЭЕШ papers

class EntrancePaper:
    """Builds one stored ЭЕШ paper (the shape of assets/entrance-mocks/<subject>/<slug>.json)."""

    def __init__(self, *, subject: str, slug: str, title: str, description: str, minutes: int,
                 instructions: list[str], source_note: str, language: str = "mn", calculator: bool = False):
        self.subject, self.slug = subject, slug
        self.meta = dict(title=title, description=description, minutes=minutes, instructions=instructions,
                         source_note=source_note, language=language, calculator=calculator)
        self.groups: list[dict] = []
        self.questions: list[dict] = []
        self.passages: list[dict] = []

    def group(self, group_id: str, title: str, section: str, instructions: str, **extra) -> str:
        self.groups.append({"id": group_id, "title": title, "section": section, "instructions": instructions, **extra})
        return group_id

    def choice(self, number: str, group_id: str, points: int, domain: str, prompt: str, options: list[str],
               answer: str, explanation: str, labels: str | list[str] = LETTERS, figure: dict | None = None,
               qid: str | None = None, **extra) -> dict:
        labels = list(labels)
        if len(options) != len(labels):
            raise ValueError(f"{self.slug} {number}: {len(options)} options for {len(labels)} labels")
        if len(set(options)) != len(options):
            raise ValueError(f"{self.slug} {number}: duplicate options {options}")
        if answer not in labels:
            raise ValueError(f"{self.slug} {number}: answer {answer} not a label")
        value = options[labels.index(answer)]
        question = {
            "id": qid or f"{self.slug}-q{number}", "number": number, "groupId": group_id, "kind": "choice",
            "points": points, "domain": domain, "prompt": prompt, "options": options, "optionLabels": labels,
            "answers": [value], "answerDisplay": value if labels == list(LETTERS) else f"{answer}. {value}",
            "explanation": explanation,
        }
        if figure:
            question["figure"] = figure
        question.update(extra)
        self.questions.append(question)
        return question

    def typed(self, number: str, group_id: str, points: int, domain: str, prompt: str, answers: list[str],
              explanation: str, matcher: str = "numeric", display: str | None = None, qid: str | None = None) -> dict:
        kind = "number" if matcher == "numeric" else "short"
        question = {
            "id": qid or f"{self.slug}-{group_id}-{number.split('.')[-1][-1]}", "number": number, "groupId": group_id,
            "kind": kind, "matcher": matcher, "points": points, "domain": domain, "prompt": prompt,
            "answers": answers, "answerDisplay": display or answers[0], "explanation": explanation,
        }
        self.questions.append(question)
        return question

    def build(self) -> dict:
        points = sum(q["points"] for q in self.questions)
        m = self.meta
        return {
            "slug": self.slug, "subject": self.subject, "year": 2026, "form": "Үнэгүй",
            "title": m["title"], "description": m["description"], "durationMinutes": m["minutes"],
            "points": points, "calculator": m["calculator"], "language": m["language"],
            "instructions": m["instructions"], "groups": self.groups, "questions": self.questions,
            "passages": self.passages, "sourceNote": m["source_note"],
        }
