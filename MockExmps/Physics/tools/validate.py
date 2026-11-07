"""Validate the generated physics mock papers."""

from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
YEARS = range(2015, 2027)
VARIANTS = range(1, 6)


def expected_points(year: int) -> tuple[int, int]:
    if year <= 2016:
        return 80, 20
    return 76, 24


def validate_figure(question: dict, label: str, errors: list[str]) -> None:
    figure = question.get("figure")
    if not figure:
        return
    if figure.get("mediaType") != "image/svg+xml":
        errors.append(f"{label}: figure mediaType must be image/svg+xml")
    svg = figure.get("svg")
    if not isinstance(svg, str) or not svg.startswith("<svg") or not svg.endswith("</svg>"):
        errors.append(f"{label}: figure must contain a complete embedded SVG")
        return
    if "xlink:href" in svg or "href=" in svg or "src=" in svg or "url(http" in svg:
        errors.append(f"{label}: figure SVG must be self-contained")
    try:
        ET.fromstring(svg)
    except ET.ParseError as exc:
        errors.append(f"{label}: invalid figure SVG: {exc}")


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []
    data = json.loads(path.read_text(encoding="utf-8"))
    year = int(path.parent.name)
    variant = int(path.stem.split("-")[1])
    mcq_points, structured_points = expected_points(year)

    if data.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1")
    if data.get("subject") != "physics":
        errors.append("subject must be physics")
    if data.get("language") != "mn":
        errors.append("language must be mn")
    if data.get("referenceYear") != year:
        errors.append(f"referenceYear must be {year}")
    if data.get("mockVariant") != f"P{variant}":
        errors.append(f"mockVariant must be P{variant}")
    if data.get("official") is not False:
        errors.append("official must be false")
    if data.get("durationMinutes") != 100:
        errors.append("durationMinutes must be 100")

    questions = data.get("questions", [])
    if len(questions) != 50:
        errors.append(f"expected 50 questions, got {len(questions)}")

    mcq = [q for q in questions if q.get("type") == "multiple_choice"]
    structured = [q for q in questions if q.get("type") == "structured_response"]
    if len(mcq) != 46:
        errors.append(f"expected 46 MCQ, got {len(mcq)}")
    if len(structured) != 4:
        errors.append(f"expected 4 structured tasks, got {len(structured)}")
    if sum(q.get("points", 0) for q in mcq) != mcq_points:
        errors.append(f"MCQ points must total {mcq_points}")
    if sum(q.get("points", 0) for q in structured) != structured_points:
        errors.append(f"structured points must total {structured_points}")

    for index, question in enumerate(mcq, start=1):
        if str(question.get("number")) != str(index):
            errors.append(f"MCQ number {question.get('number')} should be {index}")
        if question.get("points") not in (1, 2):
            errors.append(f"MCQ {index}: points must be 1 or 2")
        options = question.get("options", {})
        if list(options.keys()) != ["A", "B", "C", "D", "E"]:
            errors.append(f"MCQ {index}: options must be A-E")
        if len(set(options.values())) != 5:
            errors.append(f"MCQ {index}: options must be unique")
        answer = question.get("answer")
        if answer not in options:
            errors.append(f"MCQ {index}: answer {answer!r} not in options")
        elif question.get("answerValue") != options[answer]:
            errors.append(f"MCQ {index}: answerValue does not match answer")
        if not question.get("prompt"):
            errors.append(f"MCQ {index}: empty prompt")
        if not question.get("solution"):
            errors.append(f"MCQ {index}: empty solution")
        validate_figure(question, f"MCQ {index}", errors)

    for index, question in enumerate(structured, start=1):
        expected_number = f"2.{index}"
        if str(question.get("number")) != expected_number:
            errors.append(
                f"structured number {question.get('number')} should be {expected_number}"
            )
        parts = question.get("parts", [])
        if len(parts) != 4:
            errors.append(f"structured {expected_number}: expected 4 parts")
        if [str(p.get("id")) for p in parts] != ["1", "2", "3", "4"]:
            errors.append(f"structured {expected_number}: part ids must be 1-4")
        if sum(p.get("points", 0) for p in parts) != question.get("points"):
            errors.append(f"structured {expected_number}: part points do not add up")
        if any(not p.get("prompt") or not p.get("answer") for p in parts):
            errors.append(f"structured {expected_number}: empty part prompt or answer")
        if not question.get("prompt") or not question.get("solution"):
            errors.append(f"structured {expected_number}: empty prompt or solution")
        validate_figure(question, f"structured {expected_number}", errors)

    return errors


def main() -> int:
    all_errors: list[str] = []
    for year in YEARS:
        mcq_points, structured_points = expected_points(year)
        for variant in VARIANTS:
            path = ROOT / str(year) / f"mock-{variant:02d}.json"
            if not path.exists():
                all_errors.append(f"missing {path}")
                continue
            errors = validate_file(path)
            if errors:
                all_errors.extend(f"{path}: {error}" for error in errors)
        print(
            f"{year}: 5 files, {mcq_points} MCQ points + "
            f"{structured_points} structured points = 100"
        )

    if all_errors:
        print("\nValidation failed:")
        for error in all_errors:
            print(f"- {error}")
        return 1

    print("\nAll 60 physics mock papers are valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
