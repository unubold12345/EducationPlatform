"""Offline Kokoro recordings for the TOEFL iBT practice forms 01-09. Never reads or writes website content.

Run from the repository root with Python 3.12 and kokoro-onnx, onnxruntime and numpy (see AUDIO.md):
  python -B MockExmps/TOEFL/_source/generate_audio.py [--forms 1 2 ...] [--items "listening-m1-*" ...] [--force]
FFmpeg must be on PATH. Writes only mock-NN/audio/ (one MP3 per recording plus audio-manifest.json) and AUDIO.md;
synthesised sentences are cached in the system temp folder. A recording whose script, voices, settings, model and
voice tables are unchanged is kept as it is, so the script can be re-run after correcting one script.
"""
from __future__ import annotations

import argparse
import datetime
import fnmatch
import hashlib
import importlib.metadata
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro

sys.path.insert(0, str(Path(__file__).resolve().parent))
import audio_items as A  # noqa: E402

REPO = A.PACK.parents[1]
MODEL_DIR = REPO / "artifacts" / "speaking-voice-cache" / "onnx-community" / "Kokoro-82M-v1.0-ONNX"
VOICE_DIR = REPO / "node_modules" / "kokoro-js" / "voices"
CACHE = Path(tempfile.gettempdir()) / "education-toefl-offline-tts-cache"
RATE = 24000
SETTINGS = dict(speed=1.0, sampleRate=RATE, leadSeconds=0.3, tailSeconds=0.6, sentenceGapSeconds=0.35,
                turnGapSeconds=0.5, minSentencePhonemes=12, targetRmsDb=-20.0, peakCeiling=0.95, bitrate="64k",
                trim="kokoro-onnx trim per chunk (60 dB)")


def lang(voice: str) -> str:
    return "en-gb" if voice.startswith("b") else "en-us"


# Phoneme corrections for heteronyms that espeak-ng reads in the wrong form here (found by printing the phonemes of
# every heteronym in the pack). Each pattern includes enough phoneme context to hit only the intended words; the
# manifest records which corrections a recording received. Pack text is unchanged.
PHONEME_FIXES = [
    ("ɛkskjˈuːs mˌiː", "ɛkskjˈuːz mˌiː", "'Excuse me' is the verb, /z/"),
    ("jˈuːs ð", "jˈuːz ð", "'use the/this' is the verb, /z/"),
    ("ˈɛnɪwˌɒn jˈuːsɪz", "ˈɛnɪwˌɒn jˈuːzɪz", "'anyone uses' is the verb, /z/"),
    ("ˈɑːktəpəs jˈuːsᵻz", "ˈɑːktəpəs jˈuːzᵻz", "'the octopus uses' is the verb, /z/"),
    ("fˈaktəɹiz klˈəʊs", "fˈaktəɹiz klˈəʊz", "'factories close' is the verb, /z/"),
    ("ˌaplɪkˈeɪʃənz klˈəʊs", "ˌaplɪkˈeɪʃənz klˈəʊz", "'applications close' is the verb, /z/"),
    ("ʃiː lˈaɪv ðˈɛɹ", "ʃiː lˈɪv ðˈɛɹ", "'she live there' is the verb live"),
    ("hˈɑːɹdli lˈaɪv", "hˈɑːɹdli lˈɪv", "'hardly live without' is the verb live"),
    ("fɹˈɛndz lˈaɪv", "fɹˈɛndz lˈɪv", "'friends live far away' is the verb live"),
    ("θˈɪŋ juː ɹˈiːd fɔː", "θˈɪŋ juː ɹˈɛd fɔː", "'the last thing you read' is past tense"),
    ("ˈaktʃuːəli ɹˈiːd", "ˈaktʃuːəli ɹˈɛd", "'have you actually read' is the participle"),
    ("hiːz jˈuːzd tʊ", "hiːz jˈuːst tʊ", "'he's used to' (accustomed) has /s/"),
]
TEENS = "thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
NUMBER_WORDS = ("one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen "
                "seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand "
                "oh").split()
STRESS = str.maketrans("", "", "ˈˌ")


class Engine:
    def __init__(self, model_dir: Path, voice_dir: Path, threads: int):
        model = model_dir / "onnx" / "model.onnx"
        self.model = dict(model="onnx-community/Kokoro-82M-v1.0-ONNX onnx/model.onnx (fp32)",
                          modelSha256=A.sha256(model.read_bytes()))
        voices = sorted(set(A.VOICE_MAP.values()) | set(A.NARRATOR_FOR.values()))
        self.tables = {v: np.fromfile(voice_dir / f"{v}.bin", dtype=np.float32).reshape(-1, 1, 256) for v in voices}
        self.voiceSha256 = {v: A.sha256((voice_dir / f"{v}.bin").read_bytes()) for v in voices}
        CACHE.mkdir(parents=True, exist_ok=True)
        npz = CACHE / f"voices-{A.sha256(A.canonical(self.voiceSha256).encode())[:16]}.npz"
        if not npz.exists():
            partial = CACHE / f"voices.{os.getpid()}.partial.npz"
            np.savez(partial, **self.tables)
            os.replace(partial, npz)
        options = ort.SessionOptions()
        options.intra_op_num_threads = threads
        options.inter_op_num_threads = 1
        session = ort.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"])
        self.kokoro = Kokoro.from_session(session, str(npz))
        self.packages = {p: importlib.metadata.version(p) for p in ("kokoro-onnx", "onnxruntime", "numpy")}
        self.made = self.reused = 0
        self.fixes_used: dict[str, int] = {}
        # espeak stresses a teen on its first syllable ("FIFteen minutes"), which Whisper heard as "fifty". Where a
        # teen is a quantity, the stress moves to -teen; in years and larger numbers ("nineteen seventy",
        # "eighteen hundreds") it is left alone.
        self.teens, self.numbers = {}, {}
        for language in ("en-us", "en-gb"):
            say = lambda words: " ".join(self.kokoro.tokenizer.phonemize(words, language).split())  # noqa: E731
            self.teens[language] = {}
            for teen in TEENS:
                form = say(teen)
                assert form.endswith("iːn"), (teen, form)
                if "ˈ" in form[:-3]:
                    self.teens[language][form] = form.translate(STRESS)[:-3] + "ˈiːn"
            self.numbers[language] = tuple(say(w).translate(STRESS) for w in NUMBER_WORDS)

    def phonemes(self, text: str, voice: str) -> tuple[str, list[str]]:
        """espeak-ng phonemes of one segment with the corrections above; returns them and the corrections made."""
        language = lang(voice)
        out = " ".join(self.kokoro.tokenizer.phonemize(text, language).split())
        notes = []
        for old, new, note in PHONEME_FIXES:
            if old in out:
                notes += [note] * out.count(old)
                self.fixes_used[note] = self.fixes_used.get(note, 0) + out.count(old)
                out = out.replace(old, new)
        tokens = out.split(" ")
        for i, token in enumerate(tokens):
            for shifted, citation in self.teens[language].items():
                if not token.startswith(shifted):
                    continue
                rest = token[len(shifted):]
                following = rest if rest.strip(",.?!:;") else (tokens[i + 1] if i + 1 < len(tokens) else "")
                if following.translate(STRESS).startswith(self.numbers[language]):
                    continue  # part of a year or a larger number
                tokens[i] = citation + rest
                note = "teen number keeps its stress on -teen"
                notes.append(note)
                self.fixes_used[note] = self.fixes_used.get(note, 0) + 1
        return " ".join(tokens), notes

    def chunks(self, phonemes: str) -> list[str]:
        """One sentence per synthesis call. Inside one call Kokoro leaves almost no pause between sentences;
        separate calls joined by sentenceGapSeconds keep the sentence breaks audible. A very short sentence
        ("Hi.", "OK.", "Hmm.") is kept with the sentence after it."""
        sentences = [s for s in re.split(r"(?<=[.!?])\s+", phonemes) if s.strip()]
        out, carry = [], ""
        for sentence in sentences:
            sentence = f"{carry} {sentence}".strip()
            if len(sentence) < SETTINGS["minSentencePhonemes"]:
                carry = sentence
            else:
                out.append(sentence)
                carry = ""
        if carry:
            if out:
                out[-1] = f"{out[-1]} {carry}"
            else:
                out.append(carry)
        assert out, phonemes
        return out

    def chunk(self, phonemes: str, voice: str) -> np.ndarray:
        key = A.sha256(A.canonical([self.model["modelSha256"], self.voiceSha256[voice], voice,
                                    SETTINGS["speed"], phonemes]).encode())
        path = CACHE / f"{key}.npy"
        if path.exists():
            self.reused += 1
            return np.load(path, allow_pickle=False)
        samples, rate = self.kokoro.create(phonemes, voice=voice, speed=SETTINGS["speed"], is_phonemes=True,
                                           trim=True)
        samples = np.asarray(samples, dtype=np.float32)
        assert rate == RATE and samples.size > RATE * 0.15 and np.isfinite(samples).all(), (voice, phonemes)
        partial = CACHE / f"{key}.{os.getpid()}.partial.npy"
        np.save(partial, samples, allow_pickle=False)
        os.replace(partial, path)
        self.made += 1
        return samples


def silence(seconds: float) -> np.ndarray:
    return np.zeros(int(round(seconds * RATE)), dtype=np.float32)


def level(audio: np.ndarray) -> tuple[np.ndarray, float]:
    """One constant gain per file: speech RMS (20 ms frames above -50 dBFS) to the target, peak kept below the
    ceiling. No compression, stretching or per-sentence changes."""
    frames = audio[: len(audio) // 480 * 480].reshape(-1, 480)
    rms = np.sqrt((frames.astype(np.float64) ** 2).mean(axis=1))
    active = rms[rms > 10 ** (-50 / 20)]
    speech = float(np.sqrt((active ** 2).mean())) if active.size else 1e-3
    gain = 10 ** (SETTINGS["targetRmsDb"] / 20) / speech
    gain = min(gain, SETTINGS["peakCeiling"] / max(float(np.abs(audio).max()), 1e-6))
    return audio * gain, round(gain, 4)


def encode(audio: np.ndarray, path: Path, title: str) -> None:
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes()
    partial = path.with_suffix(".partial.mp3")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(RATE), "-ac", "1",
                    "-i", "-", "-codec:a", "libmp3lame", "-b:a", SETTINGS["bitrate"], "-fflags", "+bitexact",
                    "-flags:a", "+bitexact", "-metadata", f"title={title}", str(partial)], input=pcm, check=True)
    os.replace(partial, path)


def probe(path: Path) -> float:
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                          "default=noprint_wrappers=1:nokey=1", str(path)], text=True))


def title(form: int, item: dict) -> str:
    if item["section"] == "listening":
        numbers = item["questions"]
        span = f"Q{numbers[0]}" + (f"-{numbers[-1]}" if len(numbers) > 1 else "")
        kind = A.TYPES[item["type"]]
        return f"TOEFL practice {form:02d} - Listening {A.MODULE_TITLES[item['module']]} - {span} {kind}"
    what = item["type"].replace("_", " ")
    return f"TOEFL practice {form:02d} - Speaking - {what}" + (f" {item['questions'][0]}" if item["questions"] else "")


def make(engine: Engine, form: int, item: dict, previous: dict | None, force: bool) -> dict:
    folder = A.PACK / f"mock-{form:02d}" / "audio"
    path = folder / item["file"]
    segments = [dict(s, spoken=A.spoken(s["text"])) for s in item["segments"]]
    for s in segments:
        s["phonemes"], s["fixes"] = engine.phonemes(s["spoken"], s["voice"])
    basis = [item["sourceSha256"], [[s["speaker"], s["voice"], s["spoken"]] for s in segments], SETTINGS,
             engine.model["modelSha256"], sorted({engine.voiceSha256[s["voice"]] for s in segments})]
    if any(s["fixes"] for s in segments):  # only corrected recordings get a new fingerprint
        basis.append([[s["fixes"], s["phonemes"]] for s in segments])
    fingerprint = A.sha256(A.canonical(basis).encode())
    if (not force and previous and previous.get("fingerprint") == fingerprint and path.exists()
            and previous.get("sha256") == A.sha256(path.read_bytes())):
        return dict(previous, status="kept")
    parts, timeline, cursor = [silence(SETTINGS["leadSeconds"])], [], SETTINGS["leadSeconds"]
    for index, segment in enumerate(segments):
        if index:
            parts.append(silence(SETTINGS["turnGapSeconds"]))
            cursor += SETTINGS["turnGapSeconds"]
        start = cursor
        for n, chunk in enumerate(engine.chunks(segment["phonemes"])):
            if n:
                parts.append(silence(SETTINGS["sentenceGapSeconds"]))
                cursor += SETTINGS["sentenceGapSeconds"]
            samples = engine.chunk(chunk, segment["voice"])
            parts.append(samples)
            cursor += len(samples) / RATE
        entry = dict(speaker=segment["speaker"], code=segment["code"], voice=segment["voice"],
                     start=round(start, 3), seconds=round(cursor - start, 3), text=segment["text"])
        if segment["spoken"] != segment["text"]:
            entry["spoken"] = segment["spoken"]
        if segment["fixes"]:
            entry["phonemeFixes"] = segment["fixes"]
        timeline.append(entry)
    parts.append(silence(SETTINGS["tailSeconds"]))
    audio, gain = level(np.concatenate(parts))
    encode(audio, path, title(form, item))
    revision = 1 if not previous else previous.get("revision", 1) + (previous.get("fingerprint") != fingerprint)
    voices = {}
    for s in timeline:
        voices[s["speaker"] or "Speaker"] = dict(code=s["code"], voice=s["voice"])
    return dict(id=item["id"], file=item["file"], section=item["section"], module=item["module"], type=item["type"],
                questions=item["questions"], voices=voices, seconds=round(probe(path), 3),
                pcmSeconds=round(len(audio) / RATE, 3), pauseAfterSeconds=item["pause"], bytes=path.stat().st_size,
                sha256=A.sha256(path.read_bytes()), sourceSha256=item["sourceSha256"], fingerprint=fingerprint,
                revision=revision, gain=gain, segments=timeline, status="made")


def generate(engine: Engine, form: int, patterns: list[str] | None, force: bool) -> None:
    mock = A.load(form)
    items = A.recordings(mock)
    folder = A.PACK / f"mock-{form:02d}" / "audio"
    folder.mkdir(exist_ok=True)
    manifest_path = A.manifest_path(form)
    old = {}
    if manifest_path.exists():
        old = {r["id"]: r for r in json.loads(manifest_path.read_text(encoding="utf-8"))["recordings"]}
    records = []
    for item in items:
        selected = not patterns or any(fnmatch.fnmatch(item["id"], p) for p in patterns)
        previous = old.get(item["id"])
        if not selected:
            if previous:
                records.append(dict(previous, status="kept"))
            continue
        record = make(engine, form, item, previous, force)
        records.append(record)
        if record["status"] == "made":
            print(f"Form {form:02d} {item['id']}: {record['seconds']:.1f} s (revision {record['revision']})", flush=True)
    complete = [r["id"] for r in records] == [i["id"] for i in items]
    for record in records:
        record.pop("status", None)
    expected = {i["file"] for i in items} | {"audio-manifest.json"}
    stray = sorted(p.name for p in folder.iterdir() if p.name not in expected)
    if stray:
        print(f"Form {form:02d}: files not in the recording list (left untouched): {stray}", flush=True)
    seconds = {r["id"]: r["seconds"] for r in records}
    manifest = dict(form=form, id=mock["id"], generated=datetime.date.today().isoformat(),
                    generator="MockExmps/TOEFL/_source/generate_audio.py", complete=complete,
                    engine=dict(engine.model, packages=engine.packages, voiceTables="node_modules/kokoro-js/voices",
                                voiceSha256=engine.voiceSha256),
                    settings=SETTINGS, voiceMap=A.VOICE_MAP, narrators=A.NARRATOR_FOR,
                    renderings=[dict(pattern=p, spoken=r) for p, r in A.RENDERINGS],
                    phonemeFixes=[dict(espeak=o, corrected=n, why=w) for o, n, w in PHONEME_FIXES]
                    + [dict(espeak="teen with first-syllable stress before a non-number word",
                            corrected="citation stress on -teen",
                            why="a teen quantity ('fifteen minutes') keeps its stress on -teen, so it is not heard "
                                "as 'fifty'")],
                    timing=A.timing(items, seconds, mock) if complete else None, recordings=records)
    A.write_json(manifest_path, manifest)
    if complete:
        t = manifest["timing"]
        print(f"Form {form:02d}: {len(records)} recordings; sitting time " + ", ".join(
            f"{k} {A.clock(v['totalSeconds'])} (blueprint {v['blueprintMinutes']} min)" for k, v in t.items()),
            flush=True)
    else:
        print(f"Form {form:02d}: manifest written for {len(records)} of {len(items)} recordings", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--forms", nargs="+", type=int, default=list(A.FORMS))
    parser.add_argument("--items", nargs="+", help="recording ids or shell-style patterns, e.g. 'speaking-*'")
    parser.add_argument("--force", action="store_true", help="make the selected recordings again")
    parser.add_argument("--model-dir", type=Path, default=MODEL_DIR)
    parser.add_argument("--voice-dir", type=Path, default=VOICE_DIR)
    parser.add_argument("--threads", type=int, default=8)
    parser.add_argument("--speed", type=float, default=SETTINGS["speed"],
                        help="Kokoro speed for every voice (1.0 = the model's natural pace); a change remakes all")
    args = parser.parse_args()
    assert set(args.forms) <= set(A.FORMS), args.forms
    assert 0.7 <= args.speed <= 1.2, args.speed
    SETTINGS["speed"] = args.speed
    engine = Engine(args.model_dir, args.voice_dir, args.threads)
    for form in args.forms:
        generate(engine, form, args.items, args.force)
    A.render_index()
    print(f"Done: {engine.made} sentences synthesised, {engine.reused} reused from the cache", flush=True)
    print("Phoneme corrections in the selected recordings: " + "; ".join(
        f"{note} x{count}" for note, count in sorted(engine.fixes_used.items())), flush=True)
    if not args.items and args.forms == list(A.FORMS):
        unused = [w for _, _, w in PHONEME_FIXES if w not in engine.fixes_used]
        if unused:
            print(f"Warning: phoneme corrections that matched nothing (stale?): {unused}", flush=True)


if __name__ == "__main__":
    main()
