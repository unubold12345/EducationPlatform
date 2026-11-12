"""Structural checks for the free mocks.

It checks what a later site integration depends on: unique IDs, every key inside its options, point totals,
group and passage references, figure and picture files, listening scripts in listening stages, and the
half-length targets. It cannot judge whether a question is well written; that needs teacher review.
"""

from __future__ import annotations

import collections
import re
from pathlib import Path

CHOICE_KINDS = {"choice", "number", "short", "essay", "speaking"}
STAGE_KINDS = {"questions", "break", "listening", "writing", "speaking", "preparation"}
NUMERIC = re.compile(r"^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:/\d+(?:\.\d+)?)?$")


def _figure_file(program_dir: Path, src: str, problems: list[str], where: str) -> None:
    # Public paths look like /exam-assets/<program>/.../<slug>/<file>.svg or /ielts-mocks/<file>.svg; the pack keeps
    # the files in <program>/images/<slug>/<file>.svg.
    parts = src.strip("/").split("/")
    if len(parts) < 2:
        problems.append(f"{where}: odd figure path {src}")
        return
    candidates = [program_dir / "images" / parts[-2] / parts[-1], program_dir / "images" / parts[-1]]
    if src.startswith("/exam-assets/hsk/examples/"):
        candidates.append(program_dir.parents[2] / "public" / "exam-assets" / "hsk" / "examples" / parts[-1])
    if not any(path.exists() for path in candidates):
        problems.append(f"{where}: missing figure file for {src}")


def _check_question(question: dict, where: str, program_dir: Path, problems: list[str]) -> None:
    kind = question.get("kind")
    if kind not in CHOICE_KINDS:
        problems.append(f"{where}: unknown kind {kind}")
    if not str(question.get("explanation", "")).strip():
        problems.append(f"{where}: empty explanation")
    if kind == "choice":
        options = question.get("options") or []
        labels = question.get("optionLabels") or options
        answers = question.get("answers") or []
        if len(options) < 2:
            problems.append(f"{where}: fewer than two options")
        if len(set(options)) != len(options):
            problems.append(f"{where}: duplicate options")
        if len(labels) != len(options):
            problems.append(f"{where}: {len(labels)} labels for {len(options)} options")
        if len(answers) != 1 or answers[0] not in options:
            problems.append(f"{where}: answer {answers} not among options")
    elif kind in {"number", "short"}:
        answers = question.get("answers") or []
        if not answers or not all(str(answer).strip() for answer in answers):
            problems.append(f"{where}: missing typed answer")
        matcher = question.get("matcher") or ("numeric" if kind == "number" else "text")
        if matcher == "numeric" and not all(NUMERIC.match(str(a).replace("−", "-")) for a in answers):
            problems.append(f"{where}: non-numeric answer {answers}")
    elif kind in {"essay", "speaking"}:
        if question.get("answers"):
            problems.append(f"{where}: {kind} should have no key")
    figure = question.get("figure")
    if figure and figure.get("kind") == "image":
        _figure_file(program_dir, figure["src"], problems, where)
    for picture in (question.get("hsk") or {}).get("pictures", []) or []:
        _figure_file(program_dir, picture["src"], problems, where)


def validate_entrance(mock: dict, program_dir: Path, expect_points: int, max_minutes: int) -> tuple[list[str], dict]:
    problems: list[str] = []
    for key in ["slug", "subject", "year", "form", "title", "description", "durationMinutes", "points", "calculator",
                "language", "instructions", "groups", "questions", "passages"]:
        if key not in mock:
            problems.append(f"missing key {key}")
    groups = [g["id"] for g in mock["groups"]]
    if len(groups) != len(set(groups)):
        problems.append("duplicate group ids")
    ids = [q["id"] for q in mock["questions"]]
    if len(ids) != len(set(ids)):
        problems.append("duplicate question ids")
    numbers = [q["number"] for q in mock["questions"]]
    if len(numbers) != len(set(numbers)):
        problems.append("duplicate question numbers")
    titles = {p["title"] for p in mock["passages"]}
    for question in mock["questions"]:
        where = f"{mock['slug']} {question['number']}"
        if question.get("groupId") not in groups:
            problems.append(f"{where}: unknown group {question.get('groupId')}")
        if question.get("passage") and question["passage"] not in titles:
            problems.append(f"{where}: unknown passage {question['passage']}")
        if not isinstance(question.get("points"), int) or question["points"] <= 0:
            problems.append(f"{where}: bad points")
        _check_question(question, where, program_dir, problems)
    for group in mock["groups"]:
        if not any(q["groupId"] == group["id"] for q in mock["questions"]):
            problems.append(f"{mock['slug']}: empty group {group['id']}")
        if group.get("figure"):
            _figure_file(program_dir, group["figure"]["src"], problems, f"{mock['slug']} {group['id']}")
    total = sum(q["points"] for q in mock["questions"])
    if total != mock["points"] or total != expect_points:
        problems.append(f"{mock['slug']}: points {total} (stored {mock['points']}, expected {expect_points})")
    if mock["durationMinutes"] > max_minutes:
        problems.append(f"{mock['slug']}: {mock['durationMinutes']} minutes is more than half")
    letters = collections.Counter(
        q["optionLabels"][q["options"].index(q["answers"][0])]
        for q in mock["questions"] if q["kind"] == "choice" and q.get("optionLabels") == list("ABCDE"))
    summary = {"slug": mock["slug"], "questions": len(ids), "points": total, "minutes": mock["durationMinutes"],
               "choiceKeyLetters": dict(sorted(letters.items()))}
    return problems, summary


def validate_definition(definition: dict, program_dir: Path, *, max_minutes: float, expect_points: int | None = None,
                        expect_questions: int | None = None) -> tuple[list[str], dict]:
    problems: list[str] = []
    for key in ["slug", "version", "program", "title", "description", "stages", "sources"]:
        if key not in definition:
            problems.append(f"missing key {key}")
    stage_ids = [s["id"] for s in definition["stages"]]
    if len(stage_ids) != len(set(stage_ids)):
        problems.append("duplicate stage ids")
    seen: dict[str, dict] = {}
    scored = 0
    points = 0
    for stage in definition["stages"]:
        if stage["kind"] not in STAGE_KINDS:
            problems.append(f"{stage['id']}: unknown kind {stage['kind']}")
        if stage["seconds"] <= 0:
            problems.append(f"{stage['id']}: no time")
        group_ids = [g["id"] for g in stage.get("groups", [])]
        if len(group_ids) != len(set(group_ids)):
            problems.append(f"{stage['id']}: duplicate group ids")
        titles = {p["title"] for p in stage.get("passages", [])}
        for group in stage.get("groups", []):
            for picture in ((group.get("hsk") or {}).get("pictures") or []) + (((group.get("hsk") or {}).get("example") or {}).get("pictures") or []):
                _figure_file(program_dir, picture["src"], problems, f"{stage['id']} {group['id']}")
            if group.get("figure"):
                _figure_file(program_dir, group["figure"]["src"], problems, f"{stage['id']} {group['id']}")
        for question in stage["questions"]:
            where = f"{definition['slug']} {stage['id']} {question.get('number', question['id'])}"
            previous = seen.get(question["id"])
            if previous is not None and previous is not question and previous != question:
                problems.append(f"{where}: id {question['id']} reused for a different question")
            repeated = previous is not None
            seen[question["id"]] = question
            if group_ids and question.get("groupId") not in group_ids:
                problems.append(f"{where}: unknown group {question.get('groupId')}")
            if question.get("passage") and titles and question["passage"] not in titles:
                problems.append(f"{where}: unknown passage {question['passage']}")
            if stage["kind"] == "listening" and not (question.get("listening") or {}).get("script", "").strip():
                problems.append(f"{where}: listening question without a script")
            _check_question(question, where, program_dir, problems)
            if not repeated and question["kind"] in {"choice", "number", "short"}:
                scored += 1
                points += question.get("points", 1)
    minutes = sum(s["seconds"] for s in definition["stages"]) / 60
    if minutes > max_minutes:
        problems.append(f"{definition['slug']}: {minutes:.1f} minutes is more than the half-length limit {max_minutes}")
    if expect_points is not None and definition.get("points") not in (None, points):
        problems.append(f"{definition['slug']}: stored points {definition.get('points')} but questions give {points}")
    if expect_points is not None and points != expect_points:
        problems.append(f"{definition['slug']}: {points} points, expected {expect_points}")
    if expect_questions is not None and scored != expect_questions:
        problems.append(f"{definition['slug']}: {scored} scored questions, expected {expect_questions}")
    summary = {"slug": definition["slug"], "stages": [f"{s['title']} ({s['seconds'] // 60} min)" for s in definition["stages"]],
               "scoredQuestions": scored, "points": points, "minutes": round(minutes, 1)}
    return problems, summary
