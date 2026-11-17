"""What gets recorded for each TOEFL form, shared by generate_audio.py and validate_audio.py (standard library only).

The recordings are derived from mock-NN/mock.json alone; nothing here changes a script. One recording per spoken
item: each Choose a Response prompt, each conversation, announcement and talk, the two speaking scenario lines,
each Listen and Repeat sentence and each interview question.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

PACK = Path(__file__).resolve().parents[1]
FORMS = range(1, 10)
MODULES = {"router": "m1", "lower": "m2-lower", "upper": "m2-upper"}
MODULE_TITLES = {"router": "Module 1 (routing)", "lower": "Module 2 Lower", "upper": "Module 2 Upper"}
TYPES = {"choose_response": "response", "conversation": "conversation", "announcement": "announcement", "talk": "talk"}

# Kokoro-82M has American (a*) and British (b*) stock voices only. The two Australian codes use a second British
# woman and man: non-rhotic like Australian English, and distinct from the UK voices, so all six codes keep their
# own voice. Every conversation pairs a woman with a man, so its two speakers always differ.
VOICE_MAP = {
    "F-US": "af_heart",
    "M-US": "am_michael",
    "F-UK": "bf_emma",
    "M-UK": "bm_george",
    "F-AU": "bf_isabella",
    "M-AU": "bm_fable",
}
# The two speaking scenario lines are directions, read by a narrator of the other gender than the supervisor or
# interviewer who speaks next, so the narrator is never mistaken for that speaker.
NARRATOR_FOR = {"F": "am_fenrir", "M": "af_bella"}

# Administration pauses (ADMINISTRATION.md); used only for the sitting-time totals in the manifests.
RESPONSE_PAUSE = 20
SECONDS_PER_QUESTION = 25
REPEAT_WINDOWS = [8, 8, 10, 10, 10, 12, 12]
INTERVIEW_WINDOW = 45

# Speech-only renderings: the pack text is never changed; the manifest keeps both the source and the spoken text.
# espeak-ng reads "Dr." with a full stop pause, "Ms." as the letters M S, and three-digit labels as quantities
# ("two hundred and four"); room, course and building numbers are said digit by digit.
RENDERINGS = [
    (r"\bDr\. ", "Doctor "),
    (r"\bMr\. ", "Mister "),
    (r"\bMrs\. ", "Missus "),
    (r"\bMs\. ", "Miz "),
    (r"\bRoom 204\b", "Room two oh four"),
    (r"\bStatistics 210\b", "Statistics two ten"),
    (r"\bTaipei 101\b", "Taipei one oh one"),
]


def spoken(text: str) -> str:
    """The text handed to the speech engine. Fails on a number or abbreviation that has no rendering yet."""
    out = text
    for pattern, replacement in RENDERINGS:
        out = re.sub(pattern, replacement, out)
    leftover = re.findall(r"\d{3,}|\b(?:Dr|Mr|Mrs|Ms|St|etc|e\.g|i\.e)\.", out)
    if leftover:
        raise ValueError(f"No speech rendering for {leftover} in: {text}")
    return out


def canonical(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_hash(source) -> str:
    """SHA-256 of a recording's exact source text (a string, or a conversation's [speaker, line] list)."""
    return sha256(canonical(source).encode())


def load(form: int) -> dict:
    return json.loads((PACK / f"mock-{form:02d}" / "mock.json").read_text(encoding="utf-8"))


def gender(code: str) -> str:
    return code.split("-")[0]


def recordings(mock: dict) -> list[dict]:
    """Every recording of one form, in playing order.

    Each item: id, section, module, type, questions (numbers), source (exact pack text), pause (seconds the
    administrator allows after it) and segments [{speaker, code, voice, text}] in speaking order.
    """
    items = []
    for module, prefix in MODULES.items():
        for task in mock["listening"][module]:
            kind = task["type"]
            numbers = [task["number"]] if kind == "choose_response" else [q["number"] for q in task["questions"]]
            base = dict(section="listening", module=module, type=kind, questions=numbers,
                        id=f"listening-{prefix}-{numbers[0]:02d}-{TYPES[kind]}")
            if kind == "choose_response":
                source = task["prompt"]
                segments = [dict(speaker=None, code=task["voice"], text=source)]
                pause = RESPONSE_PAUSE
            elif kind == "conversation":
                source = task["script"]
                segments = [dict(speaker=who, code=task["voices"][who], text=line) for who, line in source]
                pause = SECONDS_PER_QUESTION * len(numbers)
            else:
                source = task["script"]
                segments = [dict(speaker=None, code=task["voice"], text=source)]
                pause = SECONDS_PER_QUESTION * len(numbers)
            items.append(dict(base, source=source, segments=segments, pause=pause))
    repeat, interview = mock["speaking"]["repeat"], mock["speaking"]["interview"]
    for task, kind, first in ((repeat, "repeat", 1), (interview, "interview", 8)):
        narrator = NARRATOR_FOR[gender(task["voice"])]
        items.append(dict(section="speaking", module=None, type=f"{kind}_scenario", questions=[],
                          id=f"speaking-{first:02d}-{kind}-scenario", source=task["scenario"], pause=0,
                          segments=[dict(speaker="Narrator", code="narrator", voice=narrator, text=task["scenario"])]))
        lines = task["sentences"] if kind == "repeat" else [q["q"] for q in task["questions"]]
        for i, line in enumerate(lines):
            number = first + i
            items.append(dict(section="speaking", module=None, type=kind, questions=[number],
                              id=f"speaking-{number:02d}-{kind}", source=line,
                              pause=REPEAT_WINDOWS[i] if kind == "repeat" else INTERVIEW_WINDOW,
                              segments=[dict(speaker=None, code=task["voice"], text=line)]))
    for item in items:
        for segment in item["segments"]:
            segment.setdefault("voice", VOICE_MAP.get(segment["code"]))
            assert segment["voice"], (item["id"], segment["code"])
        item["file"] = f"{item['id']}.mp3"
        item["sourceSha256"] = source_hash(item["source"])
    assert len({i["id"] for i in items}) == len(items)
    return items


def clock(seconds: float) -> str:
    total = round(seconds)
    return f"{total // 60}:{total % 60:02d}"


def timing(items: list[dict], seconds: dict[str, float], mock: dict) -> dict:
    """Sitting time per listening module and for speaking: recordings plus the administration pauses."""
    groups = {m: [i for i in items if i["module"] == m] for m in MODULES}
    groups["speaking"] = [i for i in items if i["section"] == "speaking"]
    out = {}
    for name, group in groups.items():
        speech = sum(seconds[i["id"]] for i in group)
        pauses = sum(i["pause"] for i in group)
        blueprint = mock["minutes"]["listening"][name] if name in MODULES else mock["minutes"]["speaking"]
        out[name] = dict(recordings=len(group), speechSeconds=round(speech, 2), pauseSeconds=pauses,
                         totalSeconds=round(speech + pauses, 2), blueprintMinutes=blueprint,
                         ratioToBlueprint=round((speech + pauses) / (blueprint * 60), 3))
    return out


def manifest_path(form: int) -> Path:
    return PACK / f"mock-{form:02d}" / "audio" / "audio-manifest.json"


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def render_index() -> None:
    """Write AUDIO.md from the per-form manifests and the latest audio-validation.json."""
    manifests = {}
    for form in FORMS:
        path = manifest_path(form)
        if path.exists():
            manifests[form] = json.loads(path.read_text(encoding="utf-8"))
    validation_path = PACK / "audio-validation.json"
    validation = json.loads(validation_path.read_text(encoding="utf-8")) if validation_path.exists() else None
    first = next(iter(manifests.values()), None)
    lines = [
        "# Recordings - TOEFL iBT practice forms 01-09",
        "",
        "Synthetic recordings of every Listening and Speaking script in this pack, made locally with Kokoro-82M stock "
        "voices. They are practice audio, not ETS recordings, and no person has listened to them yet. Never play "
        "them to a test taker before the matching module starts, and never show `examiner.md` or these manifests.",
        "",
        "## Files",
        "",
        "Each `mock-NN/audio/` folder holds one MP3 per recording (24 kHz mono) and `audio-manifest.json` (file, "
        "voice per speaker, duration, SHA-256 of the file and of its exact source text, speech-only renderings, "
        "revision). File names follow the paper:",
        "",
        "| Recording | File |",
        "| --- | --- |",
        "| Choose a Response, question 1 of Module 1 | `listening-m1-01-response.mp3` |",
        "| Conversation, questions 13-14 | `listening-m1-13-conversation.mp3` |",
        "| Announcement or talk, Module 2 Upper, from question 40 | `listening-m2-upper-40-talk.mp3` |",
        "| Listen and Repeat scenario, then sentence 1 | `speaking-01-repeat-scenario.mp3`, `speaking-01-repeat.mp3` |",
        "| Interview scenario, then question 8 | `speaking-08-interview-scenario.mp3`, `speaking-08-interview.mp3` |",
        "",
        "The files contain speech only (0.3 s of lead-in, 0.6 s at the end). The administrator adds the pauses of "
        "[ADMINISTRATION.md](ADMINISTRATION.md): 20 s after a Choose a Response prompt, 25 s per question after a "
        "set, the Listen and Repeat windows (8, 8, 10, 10, 10, 12, 12 s, after a beep the administrator sounds) and "
        "45 s per interview answer. The set intros (\"Listen to a conversation between...\") are printed on the "
        "candidate paper and are not spoken.",
        "",
        "## Voices",
        "",
        "| Code | Kokoro voice | Note |",
        "| --- | --- | --- |",
    ]
    notes = {"F-AU": "second British woman; Kokoro has no Australian voice",
             "M-AU": "second British man; Kokoro has no Australian voice"}
    for code, voice in VOICE_MAP.items():
        lines.append(f"| {code} | `{voice}` | {notes.get(code, 'American' if code.endswith('US') else 'British')} |")
    lines += [
        f"| scenario lines | `{NARRATOR_FOR['F']}` or `{NARRATOR_FOR['M']}` | narrator of the other gender than "
        "the supervisor or interviewer who speaks next |",
        "",
        "British voices are read with British (en-gb) phonemes, American voices with American (en-us) phonemes. The "
        "Australian accent itself is therefore not represented; every conversation still has two clearly "
        "different voices (always a woman and a man).",
        "",
        "Speech-only renderings (the scripts are unchanged; each manifest records the spoken text next to the "
        "source): " + "; ".join(f"`{re.sub(r'[\\\\]b?', '', p).strip()}` as \"{r.strip()}\"" for p, r in RENDERINGS)
        + ".",
        "",
        "Pronunciation corrections: espeak-ng, which turns text into phonemes for Kokoro, reads some words wrongly "
        "in context. The generator corrects those phonemes, never the text: " + (
            "; ".join(f["why"] for f in first.get("phonemeFixes", [])) if first else "none yet") + ". Each "
        "corrected recording lists its corrections in the manifest.",
        "",
        "## Forms",
        "",
        "Sitting time = recordings + administration pauses, against the module times of the blueprint.",
        "",
        "| Form | Recordings | Module 1 (18 min) | Lower (7 min) | Upper (11 min) | Speaking (8 min) | Manifest |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for form, manifest in manifests.items():
        t = manifest["timing"]
        if not t:
            lines.append(f"| {form:02d} | {len(manifest['recordings'])} (incomplete) | | | | | |")
            continue
        cells = [f"{form:02d}", str(len(manifest["recordings"]))]
        cells += [f"{clock(t[k]['totalSeconds'])} (speech {clock(t[k]['speechSeconds'])})"
                  for k in ("router", "lower", "upper", "speaking")]
        cells.append(f"[audio-manifest.json](mock-{form:02d}/audio/audio-manifest.json)")
        lines.append("| " + " | ".join(cells) + " |")
    if not manifests:
        lines.append("| - | not generated yet | | | | | |")
    lines += ["", "## Machine check", ""]
    if validation:
        lines.append(f"Last run {validation['date']}: **{validation['status']}**. {validation['summary']}")
        review = validation.get("needsHumanEar", [])
        if review:
            lines += ["", "Recordings that need a human ear: Whisper's transcript differs from the script in the "
                      "words shown. `word` rows come first, because a mispronounced or swallowed word would show "
                      "there; `name` rows differ only in how a personal or place name is spelled. Some rows are "
                      "Whisper's own mistakes, but each should be heard once.", "",
                      "| Form | Recording | Kind | Differences / words | Script says | Whisper heard |",
                      "| --- | --- | --- | --- | --- | --- |"]
            for row in review:
                lines.append(f"| {row['form']:02d} | `{row['id']}` | {row.get('category', '')} | "
                             f"{row['errors']}/{row['words']} | {row['expected']} | {row['heard']} |")
            lines += ["", "What the checks of 2026-11-18 showed about these rows: a doubled word (\"who who "
                      "tells\") is Whisper repeating itself; `goed` in form 02's talk is a child's error the script "
                      "quotes on purpose; the British voices end a sentence that stands alone with a breathy release "
                      "that Whisper hears as a plural *s* (\"Good afternoons\" in three announcements; heard "
                      "correctly when the greeting runs into the next sentence). Listen most carefully for "
                      "swallowed short words (\"and\", \"but\", \"I'd\"), lost endings (-ed, -s) and vowels "
                      "(\"bag\" heard as \"bug\")."]
        lines += ["", "Full results, per recording, are in [audio-validation.json](audio-validation.json)."]
    else:
        lines.append("Not run yet: `python -B MockExmps/TOEFL/_source/validate_audio.py`.")
    model = first["engine"] if first else None
    lines += [
        "",
        "## Regenerate",
        "",
        "The generator needs Python 3.12 with `kokoro-onnx`, `onnxruntime` and `numpy`, plus FFmpeg on PATH; it uses "
        "the fp32 `onnx-community/Kokoro-82M-v1.0-ONNX` model cached for the Speaking Lab "
        "(`artifacts/speaking-voice-cache`) and the voice tables in `node_modules/kokoro-js/voices`. No network or "
        "API key is used. The validator needs `faster-whisper` (models `small.en` and `medium.en`) and FFmpeg.",
        "",
        "```powershell",
        "& \"$env:TEMP/education-free-audio-py312/Scripts/python.exe\" -B MockExmps/TOEFL/_source/generate_audio.py",
        "& \"$env:TEMP/education-free-audio-py312/Scripts/python.exe\" -B MockExmps/TOEFL/_source/generate_audio.py "
        "--forms 3 --items \"listening-m1-13-*\"",
        "python -B MockExmps/TOEFL/_source/validate_audio.py",
        "python -B MockExmps/TOEFL/_source/build.py",
        "```",
        "",
        "Re-runnable per form (`--forms`) and per recording (`--items`, shell-style patterns). A recording is made "
        "again only when its script, voices, settings, model or voice tables changed; its `revision` in the "
        "manifest then goes up by one, so a corrected script yields a new revision of just that file. Synthesised "
        "sentences are cached in the system temp folder (`education-toefl-offline-tts-cache`).",
    ]
    if model:
        lines += ["", f"Model: `{model['model']}` (SHA-256 `{model['modelSha256'][:16]}...`), "
                      f"kokoro-onnx {model['packages']['kokoro-onnx']}, onnxruntime {model['packages']['onnxruntime']}."]
    (PACK / "AUDIO.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
