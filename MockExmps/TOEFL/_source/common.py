"""Small constructors shared by the TOEFL form files. See AUTHORING.md for the rules each field must follow."""

from __future__ import annotations


def q(stem: str, a: str, b: str, c: str, d: str, answer: str, kind: str, why: str) -> dict:
    """A four-option question. `answer` is "A"-"D", `why` is the explanation printed in answers.md."""
    return {"q": stem, "options": [a, b, c, d], "answer": answer, "kind": kind, "why": why}


def lcr(voice: str, prompt: str, a: str, b: str, c: str, d: str, answer: str, why: str) -> dict:
    """Listen and Choose a Response: one spoken sentence (never printed) and four printed replies."""
    return {"type": "choose_response", "voice": voice, "prompt": prompt, "options": [a, b, c, d], "answer": answer,
            "why": why}


def build(context: str, answer: str, chips: list[str], focus: str, prefix: str = "", suffix: str = "",
          extra: str = "", proper: list[str] | None = None) -> dict:
    """Build a Sentence. `chips` are listed in the correct order; build.py scrambles them for the paper.

    prefix/suffix are words already fixed on screen; `extra` is one distractor box that is not used.
    """
    item = {"context": context, "answer": answer, "chips": chips, "focus": focus}
    if prefix:
        item["prefix"] = prefix
    if suffix:
        item["suffix"] = suffix
    if extra:
        item["extra"] = extra
    if proper:
        item["proper"] = proper
    return item
