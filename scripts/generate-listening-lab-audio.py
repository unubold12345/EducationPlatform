"""Generate the Workshop Listening Lab recordings in the same format and voices as the IELTS mocks.

Uses the same setup as scripts/generate-ielts-audio.py (kokoro-onnx with kokoro-v1.0.onnx and voices-v1.0.bin).
Run from the repo root:
  <env>/Scripts/python -I scripts/generate-listening-lab-audio.py <model-dir> [drill-id ...]
Writes public/listening-lab/<id>.mp3 and src/modules/listening-lab/timings.json (line start times for the
clickable transcript). Needs node and ffmpeg/ffprobe on PATH.
"""
import json, os, subprocess, sys
import numpy as np
from kokoro_onnx import Kokoro

RATE = 24000
VOICES = {"narrator": "bf_emma", "woman": "af_heart", "man": "am_michael", "tutor": "af_bella"}
SPEED = 1.0
LEAD, TURN_GAP, NARRATION_GAP = 0.5, 0.45, 1.0
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "listening-lab")
TIMINGS = os.path.join(ROOT, "src", "modules", "listening-lab", "timings.json")


def load():
    code = ("import {listeningDrills,recordingLines} from './src/modules/listening-lab/drills.ts';"
            "import {drillAudioKey} from './src/modules/listening-lab/audio-key.ts';"
            "console.log(JSON.stringify(listeningDrills.map(d=>({id:d.id,key:drillAudioKey(d),lines:recordingLines(d)}))));")
    out = subprocess.run(["node", "--input-type=module", "-e", code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)


def silence(seconds):
    return np.zeros(int(round(seconds * RATE)), dtype=np.float32)


def build(kokoro, lines):
    chunks, starts, length = [silence(LEAD)], [], int(round(LEAD * RATE))
    for line in lines:
        samples, rate = kokoro.create(line.get("say") or line["text"], voice=VOICES[line["voice"]], speed=SPEED,
                                      lang="en-gb" if line["voice"] == "narrator" else "en-us")
        assert rate == RATE
        starts.append(round(length / RATE, 2))
        gap = silence((NARRATION_GAP if line["voice"] == "narrator" else TURN_GAP) + line.get("pauseAfter", 0))
        chunks += [samples.astype(np.float32), gap]
        length += len(samples) + len(gap)
    return np.concatenate(chunks), starts


def encode(samples, path):
    peak = float(np.max(np.abs(samples))) or 1.0
    pcm = (np.clip(samples / peak * 0.89, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(RATE), "-ac", "1", "-i", "-",
                    "-b:a", "64k", path], input=pcm, check=True)
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path],
                           capture_output=True, text=True, check=True)
    return round(float(probe.stdout), 2)


def main():
    model_dir, only = sys.argv[1], sys.argv[2:]
    kokoro = Kokoro(os.path.join(model_dir, "kokoro-v1.0.onnx"), os.path.join(model_dir, "voices-v1.0.bin"))
    drills = load()
    timings = json.load(open(TIMINGS, encoding="utf-8")) if os.path.exists(TIMINGS) else {}
    os.makedirs(OUT, exist_ok=True)
    for drill in drills:
        if only and drill["id"] not in only:
            continue
        samples, starts = build(kokoro, drill["lines"])
        duration = encode(samples, os.path.join(OUT, drill["id"] + ".mp3"))
        timings[drill["id"]] = {"key": drill["key"], "duration": duration, "starts": starts}
        print(f"{drill['id']}: {duration:.1f} s, {len(starts)} lines", flush=True)
    ordered = {d["id"]: timings[d["id"]] for d in drills if d["id"] in timings}
    with open(TIMINGS, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(ordered, indent=1) + "\n")


if __name__ == "__main__":
    main()
