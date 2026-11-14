"""Build and validate every free half-length mock.

Run from the repository root:

    python -B MockExmps/Free/_source/build.py

It writes the site-shaped JSON files and SVG figures inside MockExmps/Free, then manifest.json and
validation-report.json. It never touches website code, assets, the database or git.
"""

from __future__ import annotations

import datetime
import importlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import FREE, write_json  # noqa: E402
from validate import validate_definition, validate_entrance  # noqa: E402

# module, program folder, shape, limits. Full timings: Math/Physics/Chemistry 100 min, Biology/English 80 min,
# SAT 134 min of modules, IELTS about 165 min, JLPT N5 90 min, N4 115 min, HSK 1 32 min on screen.
MOCKS = [
    ("eesh_math", "eesh", "entrance", dict(expect_points=50, max_minutes=50)),
    ("eesh_physics", "eesh", "entrance", dict(expect_points=50, max_minutes=50)),
    ("eesh_chemistry", "eesh", "entrance", dict(expect_points=50, max_minutes=50)),
    ("eesh_biology", "eesh", "entrance", dict(expect_points=50, max_minutes=40)),
    ("eesh_english", "eesh", "entrance", dict(expect_points=50, max_minutes=40)),
    ("sat", "sat", "definition", dict(max_minutes=67, expect_questions=49)),
    ("ielts", "ielts", "definition", dict(max_minutes=85, expect_questions=46)),
    ("jlpt_n5", "jlpt", "definition", dict(max_minutes=45, expect_points=34, expect_questions=34)),
    ("jlpt_n4", "jlpt", "definition", dict(max_minutes=58, expect_points=43, expect_questions=43)),
    ("hsk1", "hsk", "definition", dict(max_minutes=17, expect_points=20, expect_questions=20)),
]


def main(selected: set[str]) -> int:
    report = {"generated": datetime.date.today().isoformat(), "mocks": [], "problems": []}
    manifest = {"pack": "free-half-mocks", "generated": report["generated"], "files": {}}
    for module_name, folder, shape, limits in MOCKS:
        if selected and module_name not in selected:
            continue
        try:
            module = importlib.import_module(module_name)
        except ModuleNotFoundError as error:
            if error.name == module_name:
                report["problems"].append(f"{module_name}: not written yet")
                continue
            raise
        program_dir = FREE / folder
        mock, figures = module.build(program_dir)
        if figures is not None:
            # The figure folder is the one the mock's Figures object writes to (IELTS uses "ielts-free", not its slug).
            for name, digest in figures.write().items():
                manifest["files"][(figures.dir / name).relative_to(FREE).as_posix()] = digest
        manifest["files"][f"{folder}/{mock['slug']}.json"] = write_json(program_dir / f"{mock['slug']}.json", mock)
        if shape == "entrance":
            problems, summary = validate_entrance(mock, program_dir, **limits)
        else:
            problems, summary = validate_definition(mock, program_dir, **limits)
        report["mocks"].append(summary)
        report["problems"].extend(problems)
        print(f"{mock['slug']}: {'OK' if not problems else f'{len(problems)} problem(s)'}")
        for problem in problems:
            print("   ", problem)
    if not selected:
        write_json(FREE / "validation-report.json", report)
        write_json(FREE / "manifest.json", manifest)
    elif report["problems"]:
        print("\n".join(report["problems"]))
    return 1 if report["problems"] else 0


if __name__ == "__main__":
    raise SystemExit(main(set(sys.argv[1:])))
