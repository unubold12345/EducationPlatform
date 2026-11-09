"""Generate the IELTS Listening recordings with Kokoro neural voices (Apache-2.0, runs locally).

Setup (outside the repo):
  python -m venv <env> && <env>/Scripts/python -m pip install kokoro-onnx soundfile
  download kokoro-v1.0.onnx and voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 into <model-dir>
Run from the repo root:
  <env>/Scripts/python -I scripts/generate-ielts-audio.py <model-dir> [paper ...]
Writes version-2 recordings, manifests and the answer-free audio timing catalogue.
Original version-1 recordings are retained for existing attempts. Needs node and ffmpeg/ffprobe on PATH.
For independent parallel paper jobs set IELTS_AUDIO_NO_CATALOG=1, then rebuild the catalogue from all
manifest-v2-0N.json files after every job finishes. Never revise a released recording set in place.
"""
import hashlib, json, os, subprocess, sys
import numpy as np
import onnxruntime as ort
import tempfile
from kokoro_onnx import Kokoro

RATE = 24000
VOICES = {"narrator": "bf_emma", "woman": "af_heart", "man": "am_michael", "tutor": "bf_emma"}
SPEED = 1.0                      # one pace for every part
TURN_GAP, NARRATION_GAP = 0.45, 1.0
PAUSES = (30.0, 30.0, 30.0)      # read questions, midpoint, check answers
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets", "exams")


def load(paper):
    code = ("import {additionalListening} from './src/modules/exams/ielts-additional-listening.ts';"
            "import {createHash} from 'node:crypto';"
            f"const scripts=additionalListening({paper}).scripts;"
            "console.log(JSON.stringify({scripts,sha256:createHash('sha256').update(JSON.stringify(scripts)).digest('hex')}));")
    out = subprocess.run(["node", "--input-type=module", "-e", code], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def silence(seconds):
    return np.zeros(int(seconds * RATE), dtype=np.float32)


def say(kokoro, voice, text):
    language="en-gb" if VOICES[voice].startswith("b") else "en-us"
    key=hashlib.sha256(f"{VOICES[voice]}:{SPEED}:{language}:{text}".encode()).hexdigest()
    cache=os.path.join(tempfile.gettempdir(),"education-ielts-tts-cache")
    os.makedirs(cache,exist_ok=True)
    filename=os.path.join(cache,key+".npy")
    if os.path.exists(filename): return np.load(filename)
    samples, rate = kokoro.create(text, voice=VOICES[voice], speed=SPEED, lang=language)
    np.save(filename,samples.astype(np.float32))
    assert rate == RATE
    return samples.astype(np.float32)


def turns(kokoro, items):
    chunks = []
    for item in items:
        chunks += [say(kokoro, item["voice"], item["text"]), silence(TURN_GAP)]
    return chunks


def build_part(kokoro, number, part):
    start = (number - 1) * 10 + 1
    mid, end = start + 5, start + 9
    narrate = lambda text: [say(kokoro, "narrator", text), silence(NARRATION_GAP)]
    audio = (narrate(f"Part {number}. {part['title'].split('·')[-1].strip()}. You now have time to read questions {start} to {mid - 1}.")
             + [silence(PAUSES[0])] + turns(kokoro, part["halves"][0])
             + narrate(f"Now look at questions {mid} to {end}.") + [silence(PAUSES[1])]
             + turns(kokoro, part["halves"][1])
             + narrate(f"That is the end of part {number}. You now have time to check your answers.") + [silence(PAUSES[2])])
    if number == 4:
        audio = (narrate(f"Part four. {part['title'].split('·')[-1].strip()}. You now have time to read questions thirty-one to forty.")
                 + [silence(60)] + turns(kokoro, part["halves"][0] + part["halves"][1])
                 + narrate("That is the end of the listening test.") + [silence(PAUSES[2])])
    return np.concatenate(audio)


def encode(samples, path):
    peak = float(np.max(np.abs(samples))) or 1.0
    pcm = (np.clip(samples / peak * 0.89, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(RATE), "-ac", "1", "-i", "-",
                    "-b:a", "64k", path], input=pcm, check=True)
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path],
                           capture_output=True, text=True, check=True)
    return float(probe.stdout)


def main():
    model_dir, papers = sys.argv[1], [int(p) for p in sys.argv[2:]] or [2, 3, 4, 5, 6]
    if any(p not in (2,3,4,5,6) for p in papers):
        raise ValueError("This revision generator accepts papers 2–6 only; legacy audio is immutable")
    options=ort.SessionOptions()
    options.intra_op_num_threads=2
    options.inter_op_num_threads=1
    session=ort.InferenceSession(os.path.join(model_dir,"kokoro-v1.0.onnx"),sess_options=options,providers=["CPUExecutionProvider"])
    kokoro=Kokoro.from_session(session,os.path.join(model_dir,"voices-v1.0.bin"))
    for paper in papers:
        data, prefix = load(paper), f"ielts-{paper:02d}-v2"
        parts = []
        for index, part in enumerate(data["scripts"]):
            path = os.path.join(ASSETS, f"{prefix}-part-{index + 1}.mp3")
            seconds = encode(build_part(kokoro, index + 1, part), path)
            body = open(path, "rb").read()
            parts.append({"part": index + 1, "seconds": round(seconds, 3), "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()})
            print(f"{prefix} part {index + 1}: {seconds:.2f} s", flush=True)
        manifest = {"source": "Original authored synthetic practice recordings; Kokoro-82M neural voices (Apache-2.0)",
                    "voices": VOICES, "speed": SPEED, "pauses": list(PAUSES), "parts": parts}
        manifest.update(paper=paper, scriptsSha256=data["sha256"], part4PreviewSeconds=60, part4MidpointBreak=False)
        name = f"manifest-v2-{paper:02d}.json"
        with open(os.path.join(ASSETS, name), "w", encoding="utf-8", newline="\n") as handle:
            handle.write(json.dumps(manifest, indent=2) + "\n")
        if not os.environ.get("IELTS_AUDIO_NO_CATALOG"):
            catalog_path = os.path.join(ROOT, "src", "modules", "exams", "ielts-audio-v2.json")
            catalog = json.load(open(catalog_path, encoding="utf-8")) if os.path.exists(catalog_path) else {}
            catalog[f"ielts-academic-{paper:02d}"] = {"prefix": prefix, "seconds": [p["seconds"] for p in parts]}
            with open(catalog_path, "w", encoding="utf-8") as handle:
                handle.write(json.dumps(catalog, indent=2) + "\n")
        print(f'"{prefix}":[{",".join(f"{p["seconds"]:.2f}" for p in parts)}], total {sum(p["seconds"] for p in parts):.1f} s', flush=True)


if __name__ == "__main__":
    main()
