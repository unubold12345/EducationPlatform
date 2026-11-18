"""Generate TOPIK Ⅰ and Ⅱ listening audio locally with VoxCPM2 (openbmb/VoxCPM2, Apache-2.0) through VoiceStudio.

Three voices, each made once with VoxCPM2 voice design and then cloned for every line: a narrator (item numbers,
block instructions, the 보기 examples), a woman (여자) and a man (남자). The reference clips live in
assets/topik-audio/voices/ (not deployed). Each script line is synthesised once and reused when the paper reads the
recording a second time (TOPIK Ⅰ: every recording twice; TOPIK Ⅱ: 1–20 once, 21–50 twice).

Layout per mock, as on the paper: an opening line, then each block ([1～4] …) with its number range and printed
instruction (and its example), then each recording with its item number, then the answer time. The recording is cut
into four part tracks (the split matches scripts/build-topik-mocks.mjs); any time left in the Listening stage after
the last part is for checking answers.

Setup: VoiceStudio with VoxCPM2 installed from its Model Manager; ffmpeg/ffprobe on PATH. From the repo root:
  $env:HF_HUB_CACHE="$env:LOCALAPPDATA/OmniVoice/hf_cache"; $env:HF_HUB_OFFLINE="1"
  & "$env:APPDATA/OmniVoice/engines/voxcpm2/voxcpm2/.venv/Scripts/python.exe" scripts/generate-topik-audio.py [--only=topik1-mock-01] [--lines]
--lines synthesises and caches every line and writes artifacts/voicestudio/topik-cache/lines-<slug>.json for the
Whisper round trip, without writing tracks. Lines are cached in artifacts/voicestudio/topik-cache keyed by voice,
speech text and seed; scripts/topik-audio-lines.json may give a line another seed or a speech-only respelling.
Writes assets/topik-audio/<slug>-part-<n>.mp3, assets/topik-audio/<slug>-audio.json (provenance, hashes) and the
answer-free timing catalogue src/modules/exams/topik/audio-catalog.json. Then run scripts/build-topik-mocks.mjs.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
import torch

ROOT = Path(__file__).resolve().parents[1]
FORMS = ROOT / 'MockExmps' / 'TOPIK'
STRUCTURE = json.loads((FORMS / '_source' / 'structure.json').read_text(encoding='utf-8'))
OUT = ROOT / 'assets' / 'topik-audio'
VOICE_DIR = OUT / 'voices'
CACHE = ROOT / 'artifacts' / 'voicestudio' / 'topik-cache'
CATALOG = ROOT / 'src' / 'modules' / 'exams' / 'topik' / 'audio-catalog.json'
SIDECAR = Path(os.environ['APPDATA']) / 'VoiceStudio' / 'runtime' / 'project' / 'backend' / 'engines' / 'voxcpm2_subprocess' / 'main.py'
RATE = 24000
STEPS = 10
# Role -> (voice-design description, reference transcript). Changing either makes a new voice.
VOICES = {
    'narrator': ('A Korean woman in her thirties, a calm, clear and professional announcer voice, standard Seoul Korean, steady moderate pace, like a national exam listening test.',
                 '지금부터 한국어능력시험 듣기 시험을 시작하겠습니다. 문제를 잘 듣고 알맞은 답을 고르십시오.'),
    'woman': ('A Korean woman in her twenties, bright, natural and friendly conversational voice, standard Seoul Korean, natural pace.',
              '안녕하세요. 저는 요즘 주말마다 친구하고 같이 공원에서 자전거를 타요.'),
    'man': ('A Korean man in his thirties, warm and natural conversational voice, standard Seoul Korean, natural pace.',
            '네, 맞아요. 저도 회사 근처에 새로 생긴 식당에 가 보고 싶었어요.'),
}
DESIGN_SEED, LINE_SEED = 11, 7
PACE = {'I': 0.94, 'II': 1.0}  # TOPIK Ⅰ is read a little slower (ffmpeg atempo)
LEVEL_RMS = 0.075
LISTENING_PARTS = {'I': [(1, 14), (15, 21), (22, 26), (27, 30)], 'II': [(1, 16), (17, 30), (31, 40), (41, 50)]}
STAGE_SECONDS = {'I': 40 * 60, 'II': 60 * 60}
# Answer time after a recording, per question it asks (seconds), by level and item number; shrunk evenly if a form
# would not leave two minutes of the stage free.
def answer_time(level, number):
    if level == 'I':
        return 10 if number <= 14 else 13 if number <= 24 else 16
    return 10 if number <= 12 else 13 if number <= 20 else 16 if number <= 30 else 20
GAP_BETWEEN_READINGS = 2.0
LONG_TURN, SENTENCE_GAP = 110, 0.28  # turns longer than this many characters are synthesised per sentence
SPEAKER = {'남자': 'man', '여자': 'woman'}  # the only speaker labels a form may use
EXTRA = ROOT / 'scripts' / 'topik-audio-lines.json'
EXTRA_DATA = json.loads(EXTRA.read_text(encoding='utf-8')) if EXTRA.exists() else {}

UNITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']


def sino(n):
    """1–99 in Sino-Korean, as an item number is read (이십일 번)."""
    tens, ones = divmod(n, 10)
    return ('' if tens == 0 else ('십' if tens == 1 else UNITS[tens] + '십')) + UNITS[ones]


def speech_text(text):
    text = re.sub(r'[<>〈〉《》「」『』‘’“”\'"]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    for pattern, spoken in EXTRA_DATA.get('readings', []):
        text = re.sub(pattern, spoken, text)
    return text


def silence(seconds):
    return np.zeros(int(round(seconds * RATE)), np.float32)


class Sink:
    """Stands in for the sidecar's stdout pipe: its progress frames are discarded."""
    def write(self, _b): pass
    def flush(self): pass


def load(path, pace=1.0):
    filters = ['-af', f'atempo={pace}'] if pace != 1.0 else []
    cmd = ['ffmpeg', '-v', 'error', '-i', str(path), *filters, '-f', 'f32le', '-ac', '1', '-ar', str(RATE), '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)


def trim(x, threshold=0.01, pad=0.06):
    loud = np.where(np.abs(x) > threshold * max(float(np.abs(x).max()), 1e-4))[0]
    if not len(loud):
        return x
    return x[max(loud[0] - int(pad * RATE), 0):min(loud[-1] + int(pad * RATE), len(x))]


def even_out(x):
    voiced = x[np.abs(x) > 0.02 * max(float(np.abs(x).max()), 1e-4)]
    rms = float(np.sqrt(np.mean(voiced ** 2))) if voiced.size else 0.0
    return x * (LEVEL_RMS / rms) if rms > 1e-5 else x


def forms(only):
    for level, folder in (('I', 'topik-i'), ('II', 'topik-ii')):
        for number in (1, 2, 3):
            slug = f'topik{len(level)}-mock-0{number}'
            path = FORMS / folder / f'mock-0{number}.json'
            if path.exists() and (not only or slug in only):
                yield level, number, slug, json.loads(path.read_text(encoding='utf-8'))


def main():
    lines_only = '--lines' in sys.argv
    only = next((arg[7:].split(',') for arg in sys.argv if arg.startswith('--only=')), None)
    spec = importlib.util.spec_from_file_location('voicestudio_voxcpm2', SIDECAR)
    side = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(side)
    model = side._load_model(Sink())
    model_rate = side._sample_rate(model)
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    refs = {}
    for role, (description, ref_text) in VOICES.items():
        key = hashlib.sha256(json.dumps([description, ref_text, DESIGN_SEED], ensure_ascii=False).encode()).hexdigest()[:12]
        path = VOICE_DIR / f'{role}-{key}.wav'
        if not path.exists():
            torch.manual_seed(DESIGN_SEED)
            audio = np.asarray(model.generate(**side.generation_kwargs(ref_text, description=description, num_step=STEPS)), np.float32).reshape(-1)
            sf.write(path, audio, model_rate)
        seconds = sf.info(str(path)).duration
        assert 2.5 < seconds < 0.25 * len(ref_text) + 3, f'{path.name}: {seconds:.1f} s reference; delete it and change the seed'
        refs[role] = (path, ref_text)

    used = []

    def say(text, role, level):
        spoken = speech_text(text)
        assert spoken, repr(text)
        ref, ref_text = refs[role]
        seed = EXTRA_DATA.get('seeds', {}).get(spoken, LINE_SEED)
        digest = hashlib.sha256(json.dumps([ref.name, spoken, STEPS] + ([seed] if seed != LINE_SEED else []), ensure_ascii=False).encode()).hexdigest()[:24]
        path = CACHE / f'{digest}.wav'
        if not path.exists():
            torch.manual_seed(seed)
            audio = np.asarray(model.generate(**side.generation_kwargs(spoken, ref_audio=str(ref), ref_text=ref_text, num_step=STEPS)), np.float32).reshape(-1)
            sf.write(path, audio, model_rate)
            print(f'  {role}: {spoken}', flush=True)
        used.append({'file': path.name, 'text': spoken, 'role': role, 'seed': seed})
        return even_out(trim(load(path, PACE[level])))

    def say_turn(text, role, level):
        """A turn longer than a sentence or two is read sentence by sentence (each cached on its own, so one bad take
        can be redone with a seed in scripts/topik-audio-lines.json) and joined with a short breath."""
        sentences = [part for part in re.split(r'(?<=[.?!])\s+', text.strip()) if part] if len(text) > LONG_TURN else [text]
        clips = []
        for index, sentence in enumerate(sentences):
            if index:
                clips.append(silence(SENTENCE_GAP))
            clips.append(say(sentence, role, level))
        return np.concatenate(clips)

    timing = json.loads(CATALOG.read_text(encoding='utf-8')) if CATALOG.exists() else {}
    OUT.mkdir(parents=True, exist_ok=True)
    for level, number, slug, form in forms(only):
        used.clear()
        spec_level = STRUCTURE[level]
        repeats = spec_level['repeats']
        sets = form['listening']
        # Build the whole recording as events first: (kind, payload, number). Pauses are filled in after synthesis.
        events = [('say', ('narrator', f"한국어능력시험 토픽 {'일' if level == 'I' else '이'}, 듣기 시험을 시작하겠습니다."), None), ('pause', 3.0, None)]
        for block in spec_level['sections']['listening']:
            head = f"{sino(block['from'])} 번." if block['from'] == block['to'] else f"{sino(block['from'])} 번부터 {sino(block['to'])} 번까지."
            events.append(('mark', 'block', block['from']))
            events += [('say', ('narrator', head + ' ' + block['instruction']), None), ('pause', 1.5, None)]
            example = block.get('example')
            if example:
                events += [('say', ('narrator', '보기.'), None), ('pause', 0.8, None)]
                for turn in example['script']:
                    events += [('say', (SPEAKER[turn['speaker']], turn['text']), None), ('pause', 0.5, None)]
                events.append(('pause', 2.5, None))
            numbers = [int(n) for n in block['questions']]
            block_sets = [s for s in sets if s['numbers'][0] in numbers]
            assert sum(len(s['numbers']) for s in block_sets) == len(numbers), f"{slug}: block {block['from']} sets"
            for s in block_sets:
                first = s['numbers'][0]
                events.append(('mark', 'set', first))
                if not block.get('set'):
                    events += [('say', ('narrator', f'{sino(first)} 번.'), None), ('pause', 1.0, None)]
                reads = repeats[str(first)]
                for reading in range(reads):
                    for turn in s['script']:
                        events += [('say', (SPEAKER[turn['speaker']], turn['text']), None), ('pause', 0.55, None)]
                    if reading < reads - 1:
                        events.append(('pause', GAP_BETWEEN_READINGS, None))
                events.append(('mark', 'end', first))
                events.append(('answer', sum(answer_time(level, n) for n in s['numbers']), first))
        events += [('say', ('narrator', '이것으로 듣기 시험을 마치겠습니다.'), None), ('pause', 2.0, None)]

        # Synthesise (cached), then fit the answer time to the stage.
        audio = [say_turn(payload[1], payload[0], level) if kind == 'say' else None for kind, payload, _ in events]
        if lines_only:
            (CACHE / f'lines-{slug}.json').write_text(json.dumps(used, ensure_ascii=False, indent=1), encoding='utf-8')
            print(f'{slug}: {len(used)} lines cached', flush=True)
            continue
        spoken = sum(len(a) for a in audio if a is not None) / RATE + sum(p for k, p, _ in events if k == 'pause')
        answers = sum(p for k, p, _ in events if k == 'answer')
        budget = STAGE_SECONDS[level] - 120 - spoken
        scale = min(1.0, max(0.0, budget) / answers) if answers else 1.0
        assert scale >= 0.55, f'{slug}: {spoken:.0f} s of speech leaves too little answer time (scale {scale:.2f})'

        parts, chunks, starts, ends, part, block_start = [], [], {}, {}, 1, None
        bounds = LISTENING_PARTS[level]

        def length():
            return sum(len(c) for c in chunks) / RATE

        def flush(index):
            samples = np.concatenate(chunks)
            peak = max(float(np.max(np.abs(samples))), .001)
            pcm = (np.clip(samples / peak * .89, -1, 1) * 32767).astype('<i2').tobytes()
            filename = f'{slug}-part-{index}.mp3'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-', '-b:a', '48k', '-ac', '1', str(OUT / filename)], input=pcm, check=True)
            seconds = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(OUT / filename)], text=True))
            qs = {}
            for first, start in starts.items():
                for n in next(s['numbers'] for s in sets if s['numbers'][0] == first):
                    qs[f"topik{len(level)}-0{number}-l{n:02}"] = {'start': round(start, 3), 'end': round(ends[first], 3)}
            parts.append({'part': index, 'file': filename, 'seconds': round(seconds, 3), 'sha256': hashlib.sha256((OUT / filename).read_bytes()).hexdigest(), 'questions': qs})
            print(f'FINISHED {filename}: {seconds:.1f}s', flush=True)

        for (kind, payload, first), clip in zip(events, audio):
            if kind == 'mark' and payload == 'block':
                # A new part starts at the block that holds its first item.
                if first > bounds[part - 1][1]:
                    flush(part)
                    chunks, starts, ends, part = [], {}, {}, part + 1
                block_start = length()
            elif kind == 'mark' and payload == 'set':
                starts[first] = block_start if block_start is not None else length()
                block_start = None
            elif kind == 'mark' and payload == 'end':
                ends[first] = length()
            elif kind == 'say':
                chunks.append(clip)
            elif kind == 'pause':
                chunks.append(silence(payload))
            elif kind == 'answer':
                chunks.append(silence(max(6.0, payload * scale)))
        flush(part)
        assert len(parts) == 4, f'{slug}: {len(parts)} parts'
        total = sum(p['seconds'] for p in parts)
        assert total <= STAGE_SECONDS[level] - 60, f'{slug}: {total:.0f} s leaves under a minute of the Listening stage'
        for p in parts:
            lo, hi = bounds[p['part'] - 1]
            expected = {f"topik{len(level)}-0{number}-l{n:02}" for n in range(lo, hi + 1)}
            assert set(p['questions']) == expected, f"{slug} part {p['part']}: {sorted(set(p['questions']) ^ expected)}"
        manifest = {'slug': slug, 'source': 'Original synthetic Korean practice audio: VoxCPM2 (openbmb/VoxCPM2, Apache-2.0) run locally through VoiceStudio; three designed voices cloned for every line.',
                    'modelUrl': 'https://huggingface.co/openbmb/VoxCPM2', 'voices': {role: refs[role][0].name for role in refs},
                    'voiceDesign': {role: VOICES[role][0] for role in VOICES}, 'pace': PACE[level], 'steps': STEPS, 'answerScale': round(scale, 3),
                    'formSha256': hashlib.sha256(json.dumps(sets, ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
                    'parts': parts, 'humanListeningReview': False}
        (OUT / f'{slug}-audio.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (CACHE / f'lines-{slug}.json').write_text(json.dumps(used, ensure_ascii=False, indent=1), encoding='utf-8')
        timing[slug] = {'seconds': [p['seconds'] for p in parts], 'questions': {key: dict(value, part=p['part']) for p in parts for key, value in p['questions'].items()}}
        CATALOG.write_text(json.dumps(timing, indent=2) + '\n', encoding='utf-8')
        print(f'{slug}: {total:.0f} s (answer time x{scale:.2f})', flush=True)


if __name__ == '__main__':
    main()
