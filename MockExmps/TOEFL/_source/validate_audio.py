"""Validate the TOEFL pack recordings: completeness, manifests, decoding, durations and a Whisper round trip.

Run from the repository root (Python with numpy and faster-whisper; FFmpeg on PATH):
  python -B MockExmps/TOEFL/_source/validate_audio.py [--forms 1 2 ...] [--no-asr]
Structural problems (a missing, extra, stale or undecodable file, a hash or duration mismatch) fail the run.
The round trip transcribes every recording with Whisper small.en (long files in pieces cut at sentence pauses); a
recording whose transcript differs from the script is transcribed again with medium.en, and the recordings still
differing are listed by name as needing a human ear, ordinary-word differences before name spellings. Writes
audio-validation.json and refreshes AUDIO.md; transcripts are cached in the system temp folder.
"""
from __future__ import annotations

import argparse
import datetime
import difflib
import json
import re
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import audio_items as A  # noqa: E402

CACHE = Path(tempfile.gettempdir()) / "education-toefl-offline-asr-cache"
LEAD, TAIL = 0.3, 0.6
# A recording passes the round trip when the normalised transcript matches the script within this many word errors.
ALLOWED_ERRORS = 0
RESULT = ("errors", "wordErrors", "nameErrors", "wer", "diffs")

# ---- text normalisation for comparing a transcript with a script -------------------------------------------------
UNITS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen "
                                    "fourteen fifteen sixteen seventeen eighteen nineteen".split())}
TENS = {w: 10 * i for i, w in enumerate("twenty thirty forty fifty sixty seventy eighty ninety".split(), start=2)}
SCALES = {"hundred": 100, "thousand": 1000, "million": 1000000}
# Decades and centuries: "the eighteen eighties" and "the 1880s" both become "1880 s".
PLURALS = {"hundreds": 100, **{w[:-1] + "ies": v for w, v in TENS.items()}}
ORDINALS = {w: i for i, w in enumerate("zeroth first second third fourth fifth sixth seventh eighth ninth tenth "
                                       "eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth "
                                       "eighteenth nineteenth".split())}
ORDINALS.update({w[:-1] + "ieth": v for w, v in TENS.items()})  # twentieth ... ninetieth
CONTRACTIONS = {"can't": "can not", "won't": "will not", "shan't": "shall not", "let's": "let us",
                "alright": "all right"}
IS_CONTRACTIONS = {"it's", "that's", "what's", "there's", "here's", "he's", "she's", "where's", "who's", "how's"}
FILLERS = {"hmm", "hm", "hmmm", "hum", "um", "umm", "uh", "uhm", "er", "erm", "mm", "mhm"}
FILLER = "<f>"  # a filler stays in the alignment as this token; Whisper writes "Hmm" as hmm, hum, him or nothing
HEARD_AS_FILLER = {"him", "hem", "ham", "huh", "m", FILLER}
IGNORED_INSERTS = {"you", "thank", "thanks", "bye"}  # Whisper's usual additions at the end of a clip
# Words that sound the same; a script word heard as its homophone is not an audio fault.
HOMOPHONES = [{"2", "too", "to"}, {"1", "won"}, {"4", "for"}, {"8", "ate"}, {"there", "their"}, {"its", "it"},
              {"patients", "patience"}, {"hall", "haul"}, {"add", "ad"}, {"barrens", "barons"}, {"know", "no"},
              {"right", "write"}, {"hear", "here"}, {"whole", "hole"}, {"weather", "whether"}, {"by", "buy", "bye"},
              {"seen", "scene"}, {"sea", "see"}, {"would", "wood"}, {"wait", "weight"}, {"week", "weak"},
              {"peace", "piece"}, {"plane", "plain"}, {"through", "threw"}, {"wear", "where"}, {"hour", "our"},
              {"principal", "principle"}, {"aloud", "allowed"}, {"cents", "sense", "scents"}, {"flower", "flour"},
              {"higher", "hire"}, {"fair", "fare"}, {"meet", "meat"}, {"site", "sight", "cite"}, {"road", "rode"}]
NOT_NAMES = set("january february march april may june july august september october november december monday "
                "tuesday wednesday thursday friday saturday sunday mondays tuesdays thursdays fridays saturdays "
                "sundays dr mr mrs ms i ok id b t x wi fi mom shall starting strength stream rays belt kettle "
                "biscuit corner career central college introduction optional arts astronomical professor united "
                "states north south".split())  # capitalised in titles ("Career Center"), but ordinary words
SPELLING = {"okay": "ok", "centre": "center", "centres": "centers", "colour": "color", "colours": "colors",
            "favourite": "favorite", "theatre": "theater", "programme": "program", "neighbour": "neighbor",
            "neighbours": "neighbors", "behaviour": "behavior", "grey": "gray", "travelling": "traveling",
            "organise": "organize", "organised": "organized", "realise": "realize", "realised": "realized",
            "recognise": "recognize", "licence": "license", "catalogue": "catalog", "metre": "meter",
            "metres": "meters", "kilometre": "kilometer", "kilometres": "kilometers", "labour": "labor",
            "practise": "practice", "defence": "defense", "analyse": "analyze", "cancelled": "canceled",
            "harbour": "harbor", "flavour": "flavor", "honour": "honor", "jewellery": "jewelry", "mould": "mold",
            "aeroplane": "airplane", "cheque": "check", "tyre": "tire", "pyjamas": "pajamas",
            "doctor": "dr", "mister": "mr", "miz": "ms", "miss": "ms", "missus": "mrs", "advisor": "adviser",
            "advisors": "advisers"}


def is_number(word: str) -> bool:
    return (word.isdigit() or word in UNITS or word in TENS or word in SCALES or word in PLURALS
            or word in ORDINALS)


def american(word: str) -> str:
    """British spellings Whisper sometimes writes for a British voice, in their American form."""
    word = SPELLING.get(word, word)
    word = re.sub(r"^(col|fav|flav|hon|lab|neighb|behavi|harb|hum|rum|vap|arm|endeav)our", r"\1or", word)
    word = re.sub(r"^(analy|paraly)s(e|ed|es|ing)$", r"\1z\2", word)
    word = re.sub(r"^(organ|real|recogn|apolog|special|minim|maxim|categor|summar|memor|util|priorit|emphas|"
                  r"standard|civil|critic|visual|optim|modern|central|social|character|general|personal)is"
                  r"(e|ed|es|ing|ation|ations)$", r"\1iz\2", word)
    word = re.sub(r"^(cent|theat|met|lit|fib|kilomet|centimet|millimet)re(s?)$", r"\1er\2", word)
    word = re.sub(r"^(trave|cance|labe|mode|fue|signa)ll(ed|ing|er|ers)$", r"\1l\2", word)
    return word


def expand(word: str) -> list[str]:
    """Contractions written out, the same way on both sides."""
    if word in CONTRACTIONS:
        return CONTRACTIONS[word].split()
    if word in IS_CONTRACTIONS:
        return [word[:-2], "is"]
    for ending, full in (("n't", "not"), ("'re", "are"), ("'m", "am"), ("'ve", "have"), ("'ll", "will"),
                         ("'d", "would")):
        if word.endswith(ending) and len(word) > len(ending):
            return [word[: -len(ending)], full]
    if len(word) > 3 and not word.startswith("'") and (word.endswith("'s") or word.endswith("s'")):
        return [word[:-2]]  # possessives sound like the plain word: animal's, animals' -> animal
    return [word]


def number_value(run: list[str]) -> str:
    """Spelled or written numbers in one canonical digit string. Adjacent small numbers are joined, so 'two oh
    four', 'two ten', 'nineteen ninety-nine' and 'four thirty' compare equal to '204', '210', '1999' and '4:30'."""
    groups, total, current, previous = [], None, None, None

    def flush():
        nonlocal total, current
        if total is not None or current is not None:
            groups.append(str((total or 0) + (current or 0)))
        total = current = None

    for word in run:
        if word.isdigit():
            flush()
            groups.append(word)
        elif word == "oh":
            flush()
            groups.append("0")
        elif word == "a":
            current = 1
        elif word == "and":
            pass
        elif word in ORDINALS:
            value = ORDINALS[word]
            if current is not None and (previous in SCALES or previous == "and" or (
                    previous in TENS and value < 10 and current % 10 == 0)):
                current += value
            else:
                flush()
                current = value
            flush()
            groups.append(" th ")
        elif word in PLURALS:
            value = PLURALS[word]
            if value == 100:
                current = (current or 1) * 100
            elif current is not None and previous not in SCALES and previous != "and":
                flush()
                current = value
            else:
                current = (current or 0) + value
            flush()
            groups.append(" s ")
        elif word in SCALES:
            if SCALES[word] == 100:
                current = (current or 1) * 100
            else:
                total, current = (total or 0) + (current or 1) * SCALES[word], 0
        else:
            value = UNITS.get(word, TENS.get(word))
            if current is None and total is None:
                current = value
            elif previous in SCALES or previous == "and" or (previous in TENS and value < 10 and current % 10 == 0):
                current = (current or 0) + value
            else:
                flush()
                current = value
        previous = word
    flush()
    return "".join(groups).strip()


def words(text: str) -> list[str]:
    t = unicodedata.normalize("NFKD", text.lower().replace("’", "'"))
    t = "".join(c for c in t if not unicodedata.combining(c))  # résumé, Māori
    t = re.sub(r"\b(\d+)'?s\b", r"\1 s", t)  # 1880s
    t = re.sub(r"\b(\d+)(st|nd|rd|th)\b", r"\1 th", t)  # 24th -> 24 th, like "twenty-fourth"
    # Prices: "$19.99" is "nineteen ninety-nine" and "$22" may be "twenty-two dollars"; the word dollar is dropped.
    t = re.sub(r"\$(\d[\d,]*)(?:\.(\d\d))?", lambda m: m.group(1) + (
        f" {m.group(2)}" if m.group(2) and m.group(2) != "00" else ""), t)
    t = re.sub(r"\bdollars?\b", " ", t)
    t = re.sub(r"(\d)\s?%", r"\1 percent", t)
    t = re.sub(r"(\d),(?=\d{3}\b)", r"\1", t)
    t = re.sub(r"\b(\d{1,2})[:.](\d\d)\b", r"\1 \2", t)
    t = re.sub(r"\bevery one\b", "everyone", t)
    t = t.replace("-", " ")
    t = re.sub(r"[.!?;:,](?=\s|$)", " | ", t)  # a number never runs across a sentence or clause break
    t = re.sub(r"[^a-z0-9'| ]+", " ", t)
    raw = [x.strip("'") for w in t.split() for x in expand(w.lstrip("'"))]  # 'that's a good point'; animals'
    raw = [FILLER if w in FILLERS else american(w) for w in raw if w]
    out, i = [], 0
    while i < len(raw):
        word = raw[i]
        following = raw[i + 1] if i + 1 < len(raw) else None
        if is_number(word) or (word == "a" and following in SCALES):
            run = []
            while i < len(raw):
                w = raw[i]
                nxt = raw[i + 1] if i + 1 < len(raw) else None
                prev = run[-1] if run else None
                if is_number(w) or (w == "a" and not run and nxt in SCALES):
                    run.append(w)
                elif w == "and" and prev in SCALES and nxt and (nxt in UNITS or nxt in TENS):
                    run.append(w)
                elif w == "oh" and prev and (prev.isdigit() or prev in UNITS or prev in TENS) and nxt and (
                        nxt.isdigit() or nxt in UNITS):
                    run.append(w)
                else:
                    break
                i += 1
            out.extend(number_value(run).split())
        else:
            if word != "|":
                out.append(word)
            i += 1
    return out


def homophones(a: list[str], b: list[str]) -> bool:
    return len(a) == len(b) and all(x == y or any(x in g and y in g for g in HOMOPHONES) for x, y in zip(a, b))


def pack_names() -> set[str]:
    """Personal and place names: words written with a capital inside a sentence (or at its start, directly before
    another capitalised word, as in "Elena Petrova") somewhere in the pack's scripts and never in lower case. A
    transcript that spells a name differently is reported apart from word differences."""
    capital, lower = set(), set()
    for form in A.FORMS:
        for item in A.recordings(A.load(form)):
            for segment in item["segments"]:
                text = segment["text"]
                matches = list(re.finditer(r"[A-Za-zÀ-ɏ'’-]+", text))
                for index, match in enumerate(matches):
                    word = match.group(0)
                    before = re.sub(r"\b(Dr|Mr|Mrs|Ms|St)\.$", r"\1", text[:match.start()].rstrip())
                    following = matches[index + 1] if index + 1 < len(matches) else None
                    joined = (following is not None and following.group(0)[0].isupper()
                              and text[match.end():following.start()] == " ")
                    for part in words(word):
                        if word[0].isupper() and (joined or (before and before[-1] not in ".!?\"'")):
                            capital.add(part)
                        elif word[0].islower():
                            lower.add(part)
    return capital - lower - NOT_NAMES


def compare(expected: str, heard: str, names: set[str] = frozenset()) -> dict:
    ref, hyp = words(expected), words(heard)
    matcher = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    word_errors = name_errors = 0
    diffs = []
    for op, i1, i2, j1, j2 in matcher.get_opcodes():
        if op == "equal":
            continue
        a, b = ref[i1:i2], hyp[j1:j2]
        if FILLER in a:  # a filler may be heard as "him", "hum" or not at all
            a = [w for w in a if w != FILLER]
            b = [w for w in b if w not in HEARD_AS_FILLER]
        b = [w for w in b if w != FILLER]
        if not a and all(w in IGNORED_INSERTS for w in b):
            continue
        if "".join(a) == "".join(b) or homophones(a, b):
            continue  # "wifi" for "wi fi"; "too" for "two"
        count = max(len(a), len(b))
        category = "name" if a and all(w in names for w in a) else "word"
        if category == "name":
            name_errors += count
        else:
            word_errors += count
        context = lambda seq, x1, x2: " ".join(w for w in seq[max(0, x1 - 1):x2 + 1] if w != FILLER) or "-"  # noqa
        diffs.append((context(ref, i1, i2), context(hyp, j1, j2), category))
    total = len([w for w in ref if w != FILLER])
    errors = word_errors + name_errors
    return dict(words=total, errors=errors, wordErrors=word_errors, nameErrors=name_errors,
                wer=round(errors / max(total, 1), 4), diffs=diffs)


# ---- audio ---------------------------------------------------------------------------------------------------------
def probe(path: Path) -> tuple[float, str]:
    info = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json",
                                               str(path)], text=True))
    stream = info["streams"][0]
    problem = ""
    if (stream["codec_name"], stream["sample_rate"], stream["channels"]) != ("mp3", "24000", 1):
        problem = f"format {stream['codec_name']} {stream['sample_rate']} Hz {stream['channels']} ch"
    decoded = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"], capture_output=True,
                             text=True)
    if decoded.returncode or decoded.stderr.strip():
        problem = (problem + "; " if problem else "") + "decoder errors: " + decoded.stderr.strip()[:200]
    return float(info["format"]["duration"]), problem


def pcm16k(path: Path) -> np.ndarray:
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32)


PIECE_SECONDS = 25.0
SILENCE_DB, SILENCE_SECONDS, FRAME = -50.0, 0.25, 160  # 10 ms frames at 16 kHz


def pieces(pcm: np.ndarray, rate: int = 16000) -> list[np.ndarray]:
    """Cut a recording in the middle of its sentence pauses into pieces of at most 25 s. Whisper hears a long file
    in 30-second windows that can start mid-sentence, and it then drops words next to the window edge; a piece that
    fits one window and starts at a pause avoids that."""
    limit = int(PIECE_SECONDS * rate)
    if len(pcm) <= limit:
        return [pcm]
    frames = len(pcm) // FRAME
    rms = np.sqrt(np.mean(pcm[:frames * FRAME].reshape(frames, FRAME).astype(np.float64) ** 2, axis=1) + 1e-12)
    silent = 20 * np.log10(rms) < SILENCE_DB
    cuts, run = [], 0
    for index, quiet in enumerate(np.append(silent, False)):
        if quiet:
            run += 1
            continue
        if run * FRAME >= SILENCE_SECONDS * rate:
            cuts.append((index - run // 2) * FRAME)
        run = 0
    cuts = [c for c in cuts if 2 * rate < c < len(pcm) - 2 * rate]  # not the lead-in or the tail
    out, start = [], 0
    while len(pcm) - start > limit:
        options = [c for c in cuts if start < c <= start + limit]
        end = options[-1] if options else start + limit
        out.append(pcm[start:end])
        start = end
    out.append(pcm[start:])
    return out


class Listener:
    def __init__(self, threads: int):
        self.threads, self.models, self.made = threads, {}, 0
        CACHE.mkdir(parents=True, exist_ok=True)

    def hear(self, path: Path, digest: str, name: str) -> str:
        pcm = pcm16k(path)
        parts = pieces(pcm)
        key = f"{name}-{digest}" if len(parts) == 1 else f"{name}-p{int(PIECE_SECONDS)}-{digest}"
        cached = CACHE / f"{key}.txt"
        if cached.exists():
            return cached.read_text(encoding="utf-8")
        if name not in self.models:
            from faster_whisper import WhisperModel
            self.models[name] = WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=self.threads)
        texts = []
        for part in parts:
            segments, _ = self.models[name].transcribe(part, language="en", beam_size=5, temperature=0.0,
                                                       condition_on_previous_text=False, vad_filter=False)
            texts.append(" ".join(s.text.strip() for s in segments).strip())
        text = " ".join(t for t in texts if t)
        cached.write_text(text, encoding="utf-8")
        self.made += 1
        return text


def better(check: dict, other: dict) -> bool:
    return (other["wordErrors"], other["errors"]) < (check["wordErrors"], check["errors"])


def validate_form(form: int, listener: Listener | None, problems: list[str], names: set[str]) -> dict:
    mock = A.load(form)
    items = A.recordings(mock)
    folder = A.PACK / f"mock-{form:02d}" / "audio"
    where = f"form {form:02d}"
    path = A.manifest_path(form)
    if not path.exists():
        problems.append(f"{where}: no audio-manifest.json")
        return dict(form=form, recordings=[])
    manifest = json.loads(path.read_text(encoding="utf-8"))
    records = {r["id"]: r for r in manifest["recordings"]}
    expected = {i["file"] for i in items} | {"audio-manifest.json"}
    present = {p.name for p in folder.iterdir()}
    for name in sorted(expected - present):
        problems.append(f"{where}: missing {name}")
    for name in sorted(present - expected):
        problems.append(f"{where}: unexpected file {name}")
    if not manifest.get("complete") or [r["id"] for r in manifest["recordings"]] != [i["id"] for i in items]:
        problems.append(f"{where}: manifest does not list every recording in order")
    results = []
    for item in items:
        record = records.get(item["id"])
        audio = folder / item["file"]
        if not record or not audio.exists():
            continue
        name = f"{where} {item['id']}"
        digest = A.sha256(audio.read_bytes())
        if digest != record["sha256"]:
            problems.append(f"{name}: file hash differs from the manifest")
        if record["sourceSha256"] != item["sourceSha256"]:
            problems.append(f"{name}: script changed since recording (stale; run generate_audio.py)")
        for segment, source in zip(record["segments"], item["segments"]):
            if (segment["speaker"], segment["code"], segment["voice"], segment["text"]) != (
                    source["speaker"], source["code"], source["voice"], source["text"]):
                problems.append(f"{name}: segment speaker/voice/text differs from mock.json")
                break
        if len(record["segments"]) != len(item["segments"]):
            problems.append(f"{name}: {len(record['segments'])} segments, script has {len(item['segments'])}")
        seconds, problem = probe(audio)
        if problem:
            problems.append(f"{name}: {problem}")
        if abs(seconds - record["seconds"]) > 0.05 or abs(seconds - record["pcmSeconds"]) > 0.15:
            problems.append(f"{name}: duration {seconds:.2f} s, manifest {record['seconds']} s")
        cursor = LEAD
        for segment in record["segments"]:
            if segment["start"] + 1e-3 < cursor:
                problems.append(f"{name}: overlapping segment timings")
            cursor = segment["start"] + segment["seconds"]
        if abs(cursor + TAIL - record["pcmSeconds"]) > 0.01:
            problems.append(f"{name}: segment timings do not add up to the file length")
        spoken = " ".join(s.get("spoken", s["text"]) for s in record["segments"])
        count = len(re.findall(r"[A-Za-z0-9']+", spoken))
        speech = sum(s["seconds"] for s in record["segments"])
        per_word = speech / max(count, 1)
        if not 0.12 <= per_word <= 0.65:
            problems.append(f"{name}: implausible {per_word:.2f} s per word ({count} words in {speech:.1f} s)")
        row = dict(id=item["id"], file=f"mock-{form:02d}/audio/{item['file']}", seconds=round(seconds, 2),
                   words=count, wordsPerMinute=round(count / speech * 60), voices=sorted({s["voice"] for s in
                                                                                         record["segments"]}),
                   revision=record.get("revision", 1))
        if listener:
            script = " ".join(s["text"] for s in record["segments"])  # the pack's own text, not the rendering
            heard = listener.hear(audio, digest, "small.en")
            check = compare(script, heard, names)
            row.update(model="small.en", heard=heard, **{k: check[k] for k in RESULT})
            if check["errors"] > ALLOWED_ERRORS:
                second = listener.hear(audio, digest, "medium.en")
                recheck = compare(script, second, names)
                row["recheck"] = dict(model="medium.en", heard=second, **{k: recheck[k] for k in RESULT})
                if better(check, recheck):
                    row.update({k: recheck[k] for k in RESULT}, kept="medium.en")
        results.append(row)
    timing = manifest.get("timing") or {}
    for module, t in timing.items():
        if not 0.75 <= t["ratioToBlueprint"] <= 1.25 and module != "speaking":
            problems.append(f"{where}: {module} sitting time {A.clock(t['totalSeconds'])} is far from the "
                            f"blueprint's {t['blueprintMinutes']} min")
    return dict(form=form, recordings=results, timing=timing)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--forms", nargs="+", type=int, default=list(A.FORMS))
    parser.add_argument("--no-asr", action="store_true", help="structural checks only")
    parser.add_argument("--threads", type=int, default=8)
    parser.add_argument("--show", type=int, default=15, help="how many of the worst recordings to print")
    args = parser.parse_args()
    listener = None if args.no_asr else Listener(args.threads)
    names = pack_names()
    problems: list[str] = []
    forms = []
    for form in args.forms:
        forms.append(validate_form(form, listener, problems, names))
        done = forms[-1]["recordings"]
        flagged = sum(1 for r in done if r.get("errors", 0) > ALLOWED_ERRORS)
        print(f"Form {form:02d}: {len(done)} recordings checked" + ("" if args.no_asr else f", {flagged} differ from "
                                                                     "the script after the second transcription"),
              flush=True)
    rows = [dict(r, form=f["form"]) for f in forms for r in f["recordings"]]
    # Word differences first (they may be audio faults), then name spellings; worst first inside each group.
    review = sorted((r for r in rows if r.get("errors", 0) > ALLOWED_ERRORS),
                    key=lambda r: (r["wordErrors"] == 0, -r["wordErrors"] / r["words"], -r["errors"]))
    status = "failed" if problems else ("needs review" if review else "passed")
    checked = [r for r in rows if "errors" in r]
    total_words = sum(r["words"] for r in checked)
    word_errors = sum(r["wordErrors"] for r in checked)
    name_errors = sum(r["nameErrors"] for r in checked)
    with_words = sum(1 for r in review if r["wordErrors"])
    summary = (f"{len(rows)} recordings in {len(forms)} forms: files, manifests, hashes, source-text hashes, voices, "
               f"decoding and durations " + ("passed" if not problems else f"have {len(problems)} problems") + ". ")
    if listener:
        summary += (f"Whisper round trip: {len(rows) - len(review)} recordings match their script word for word after "
                    f"normalisation; {with_words} differ in ordinary words ({word_errors} word errors in "
                    f"{total_words} words, {word_errors / max(total_words, 1):.2%}) and {len(review) - with_words} "
                    f"only in the spelling of names ({name_errors} name differences in all).")
    else:
        summary += "Whisper round trip not run (--no-asr)."
    report = dict(date=datetime.date.today().isoformat(), status=status, summary=summary, problems=problems,
                  method=dict(asr="faster-whisper small.en (int8, CPU, beam 5, no prompt, no context between "
                                  "windows); files longer than 25 s are cut in the middle of sentence pauses into "
                                  "pieces of at most 25 s, transcribed one by one; a recording that differs is "
                                  "transcribed again with medium.en and the result with fewer word errors kept",
                              normalisation="lower case, accents, punctuation and hyphens removed; contractions and "
                                            "possessives expanded; fillers (hmm, um) matched loosely; British "
                                            "spellings, okay and titles (Doctor, Dr.) mapped; spoken and written "
                                            "numbers, years, decades, ordinals, prices and times to digits; joined "
                                            "compounds and common homophones accepted; a trailing 'you' or "
                                            "'thank you' that Whisper adds is ignored",
                              categories="'name' when every differing script word is a personal or place name "
                                         "(capitalised mid-sentence and never lower case in the pack); otherwise "
                                         "'word'",
                              allowedErrors=ALLOWED_ERRORS),
                  needsHumanEar=[dict(form=r["form"], id=r["id"], file=r["file"],
                                      category="word" if r["wordErrors"] else "name", errors=r["errors"],
                                      wordErrors=r["wordErrors"], nameErrors=r["nameErrors"], words=r["words"],
                                      expected=" / ".join(d[0] for d in r["diffs"]),
                                      heard=" / ".join(d[1] for d in r["diffs"])) for r in review],
                  forms=forms,
                  limits="A machine round trip shows the words are recoverable; it does not judge accent, pace, "
                         "stress or naturalness. A person should listen before the recordings are used.")
    # Only a full run (every form, with the round trip) replaces the pack's report; a partial one goes to temp.
    partial = args.forms != list(A.FORMS) or args.no_asr
    target = (Path(tempfile.gettempdir()) / "education-toefl-audio-validation.partial.json" if partial
              else A.PACK / "audio-validation.json")
    A.write_json(target, report)
    if not partial:
        A.render_index()
    for line in problems:
        print("PROBLEM:", line)
    if review:
        print(f"Recordings that need a human ear (worst first, {min(args.show, len(review))} of {len(review)}):")
        for r in review[:args.show]:
            print(f"  form {r['form']:02d} {r['id']}: {r['wordErrors']} word + {r['nameErrors']} name / "
                  f"{r['words']} -- " + "; ".join(f"[{c}] '{a}' heard as '{b}'" for a, b, c in r["diffs"]))
    print(f"{status.upper()}: {summary}" + (f" Report: {target}" if partial else ""))
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
