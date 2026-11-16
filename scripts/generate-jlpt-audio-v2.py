"""Generate JLPT N5/N4 listening audio revision 2 locally: a new narrator, the same dialogue voices (no API key).

Revision 1 (scripts/generate-jlpt-audio.py, Kokoro-82M, assets/exams/jlpt-*-part-*.mp3) stays untouched: attempts
started on it keep it. Revision 2 changes only the narrator. Narrator lines (instructions, item numbers, questions,
spoken answer choices) are read by VoxCPM2 (openbmb/VoxCPM2, Apache-2.0) as installed by VoiceStudio's one-click
engine installer. The woman and man keep revision 1's exact Kokoro takes, read from its utterance cache
(<system temp>/codex-jlpt-utterances-v1, keyed like scripts/generate-jlpt-audio.py); run that script first if the cache
is gone. Same track layout and pauses as revision 1; each line is levelled so the two engines sit at one loudness.

Setup: install VoiceStudio, then VoxCPM2 from its Model Manager (or POST /engines/sidecar/voxcpm2/install on the
running app). Run from the repo root with that engine's venv, the VoiceStudio model cache and ffmpeg/ffprobe on PATH:
  $env:HF_HUB_CACHE="$env:LOCALAPPDATA/OmniVoice/hf_cache"; $env:HF_HUB_OFFLINE="1"
  & "$env:APPDATA/OmniVoice/engines/voxcpm2/voxcpm2/.venv/Scripts/python.exe" scripts/generate-jlpt-audio-v2.py [--lines]
--lines only synthesizes and caches every line (for the Whisper check) without writing tracks.

Narrator voice: one reference clip (assets/jlpt-audio/voices/narrator-*.wav, made once with VoxCPM2 voice design from
the description in VOICES, picked by the owner) that every narrator line clones. Narrator lines are cached in
artifacts/voicestudio/jlpt-v2-cache keyed by reference, speech text and seed. Writes
assets/jlpt-audio/<slug>-part-<n>.mp3, assets/jlpt-audio/<slug>-audio.json (provenance, hashes) and the answer-free
timing catalogue src/modules/exams/jlpt/audio-catalog-v2.json.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unicodedata

import numpy as np
import soundfile as sf
import torch

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'jlpt-audio'
VOICE_DIR = OUT / 'voices'
CACHE = ROOT / 'artifacts' / 'voicestudio' / 'jlpt-v2-cache'
CATALOG = ROOT / 'src' / 'modules' / 'exams' / 'jlpt' / 'audio-catalog-v2.json'
SIDECAR = Path(os.environ['APPDATA']) / 'VoiceStudio' / 'runtime' / 'project' / 'backend' / 'engines' / 'voxcpm2_subprocess' / 'main.py'
RATE = 24000
PACE = {'N5': 0.92, 'N4': 1.0}  # narrator lines in N5 are slowed slightly (ffmpeg atempo), like revision 1's 0.9 speed
STEPS = 10
# Role -> (VoxCPM2 voice-design description, reference transcript). Changing either makes a new voice.
VOICES = {
    'narrator': ('A friendly Japanese man in his thirties with a warm, mellow baritone voice, clear standard Japanese, gentle and steady pace, like an NHK educational program.',
                 'みなさん、こんにちは。これから日本語の聞き取りの練習を始めます。問題用紙を開けてください。'),
}
SEEDS = {'narrator': 11}
# Dialogue roles keep revision 1's Kokoro takes (voices jf_tebukuro / jm_kumo, speed 0.9 for N5 and 1.0 for N4).
KOKORO_CACHE = Path(tempfile.gettempdir()) / 'codex-jlpt-utterances-v1'
KOKORO_VOICES = {'woman': 'jf_tebukuro', 'man': 'jm_kumo'}
KOKORO_SPEED = {'N5': 0.9, 'N4': 1.0}
LEVEL_RMS = 0.075  # loudness of the voiced part of every line before the track is peak-normalised

DIGITS = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう']


def kana_number(n):
    """1-99 as read before 番 and as a choice number (よん, なな, きゅう)."""
    tens, ones = divmod(n, 10)
    head = '' if tens == 0 else ('じゅう' if tens == 1 else DIGITS[tens] + 'じゅう')
    return head + DIGITS[ones]


HOURS = ['れい', 'いち', 'に', 'さん', 'よ', 'ご', 'ろく', 'しち', 'はち', 'く', 'じゅう', 'じゅういち', 'じゅうに']
WEEKDAYS = dict(zip('日月火水木金土何', ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど', 'なん']))
# Speech-only kana for words the voice may misread; the printed scripts keep their kanji.
READINGS = (
    (r'問題([0-9]+)', lambda m: 'もんだい' + kana_number(int(m.group(1)))),
    (r'([0-9]+)番', lambda m: kana_number(int(m.group(1))) + 'ばん'),
    (r'^([1-4])[。.．、]\s*', lambda m: kana_number(int(m.group(1))) + '、'),
    (r'何時', 'なんじ'), (r'何を', 'なにを'), (r'何が', 'なにが'), (r'何です', 'なんです'), (r'何で(?!す)', 'なにで'), (r'何人', 'なんにん'), (r'何曜日', 'なんようび'),
    (r'(?<![0-9])(1[0-2]|[0-9])時', lambda m: HOURS[int(m.group(1))] + 'じ'),
    (r'([日月火水木金土])曜日', lambda m: WEEKDAYS[m.group(1)] + 'ようび'),
    (r'名札', 'なふだ'), (r'申込書', 'もうしこみしょ'), (r'一日中', 'いちにちじゅう'), (r'男の人', 'おとこのひと'), (r'女の人', 'おんなのひと'),
)
# Filled after the Whisper check: {"readings": [[pattern, kana], ...], "seeds": {speech text: seed}}. A line whose
# take came out garbled or clipped gets another seed; every other line uses seed 7.
EXTRA = ROOT / 'scripts' / 'jlpt-audio-v2-lines.json'
EXTRA_DATA = json.loads(EXTRA.read_text(encoding='utf-8')) if EXTRA.exists() else {}


def furigana(match):
    """Authored furigana, with or without okurigana (健康（けんこう）, 含まれ（ふくまれ）): speak the reading once."""
    _kanji, okurigana, reading = match.groups()
    return reading if reading.endswith(okurigana) else reading + okurigana


def speech_text(text):
    text = re.sub(r'([㐀-鿿]+)([ぁ-ゖ]*)（([ぁ-ゖァ-ヺー]+)）', furigana, text)
    text = unicodedata.normalize('NFKC', text).replace('・', '、')
    text = re.sub(r'(?<=[^\x00-\x7f])\s+(?=[^\x00-\x7f])', '', text).strip()  # beginner word spacing is for reading only
    rules = list(READINGS) + [tuple(rule) for rule in EXTRA_DATA.get('readings', [])]
    for pattern, kana in rules:
        text = re.sub(pattern, kana, text)
    return text


def silence(seconds):
    return np.zeros(int(seconds * RATE), np.float32)


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


def kokoro_text(text):
    """Revision 1's speech text (scripts/generate-jlpt-audio.py speech_text), which keys its utterance cache."""
    text = re.sub(r'[\u3400-\u9fff]+（([ぁ-ゖァ-ヺー]+)）', r'\1', text)
    return unicodedata.normalize('NFKC', text).replace('・', '、')


def even_out(x):
    voiced = x[np.abs(x) > 0.02 * max(float(np.abs(x).max()), 1e-4)]
    rms = float(np.sqrt(np.mean(voiced ** 2))) if voiced.size else 0.0
    return x * (LEVEL_RMS / rms) if rms > 1e-5 else x


def mock_sources():
    for level in ['N5', 'N4']:
        for number in [1, 2, 3]:
            yield level, json.loads((ROOT / 'MockExmps' / 'JLPT' / level / f'mock-{number:02}' / 'mock.json').read_text(encoding='utf-8'))


def main():
    lines_only = '--lines' in sys.argv
    spec = importlib.util.spec_from_file_location('voicestudio_voxcpm2', SIDECAR)
    side = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(side)
    model = side._load_model(Sink())
    model_rate = side._sample_rate(model)
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    refs = {}
    for role, (description, ref_text) in VOICES.items():
        key = hashlib.sha256(json.dumps([description, ref_text, SEEDS[role]], ensure_ascii=False).encode()).hexdigest()[:12]
        path = VOICE_DIR / f'{role}-{key}.wav'
        if not path.exists():
            torch.manual_seed(SEEDS[role])
            audio = np.asarray(model.generate(**side.generation_kwargs(ref_text, description=description, num_step=STEPS)), np.float32).reshape(-1)
            sf.write(path, audio, model_rate)
        seconds = sf.info(str(path)).duration
        # A designed voice that rambles past its sentence would be cloned into every line.
        assert 2.5 < seconds < 0.2 * len(ref_text) + 3, f'{path.name}: {seconds:.1f} s reference; delete it and change the seed'
        refs[role] = (path, ref_text)

    index = {}

    def say(text, role, level_name):
        if role in KOKORO_VOICES:
            key = kokoro_text(text)
            path = KOKORO_CACHE / (hashlib.sha256(json.dumps([key, role, KOKORO_SPEED[level_name]], ensure_ascii=False).encode()).hexdigest() + '.npy')
            assert path.exists(), f'revision 1 Kokoro take missing for {role}: {key} (run scripts/generate-jlpt-audio.py first)'
            return even_out(np.load(path).astype(np.float32))
        spoken = speech_text(text)
        assert spoken, repr(text)
        ref, ref_text = refs[role]
        seed = EXTRA_DATA.get('seeds', {}).get(spoken, 7)
        digest = hashlib.sha256(json.dumps([ref.name, spoken, STEPS] + ([seed] if seed != 7 else []), ensure_ascii=False).encode()).hexdigest()[:24]
        path = CACHE / f'{digest}.wav'
        if not path.exists():
            torch.manual_seed(seed)
            audio = np.asarray(model.generate(**side.generation_kwargs(spoken, ref_audio=str(ref), ref_text=ref_text, num_step=STEPS)), np.float32).reshape(-1)
            sf.write(path, audio, model_rate)
            print(f'  line {len(index) + 1}: {spoken}', flush=True)
        index[digest] = {'text': text, 'speech': spoken, 'role': role, 'seed': seed}
        return even_out(trim(load(path, PACE[level_name])))

    def dialogue(text, level):
        chunks = []
        for line in text.splitlines():
            pieces = re.split(r'(ナレーター|男|女)：', line)
            if pieces[0].strip():
                chunks.extend([say(pieces[0], 'narrator', level), silence(.6)])
            for i in range(1, len(pieces), 2):
                role = {'男': 'man', '女': 'woman', 'ナレーター': 'narrator'}[pieces[i]]
                chunks.extend([say(pieces[i + 1], role, level), silence(.55)])
        return chunks

    OUT.mkdir(parents=True, exist_ok=True)
    timing = {}
    for level, source in mock_sources():
        slug = source['id']
        parts = []
        for group in source['sections'][2]['groups']:
            part = group['number']
            chunks = [say(f'問題{part}。' + group['instructions'], 'narrator', level), silence(4)]
            starts = {}

            def length():
                return sum(len(chunk) for chunk in chunks) / RATE
            for q in group['questions']:
                start = length()
                chunks.extend([say(f"{q['number']}番。", 'narrator', level), silence(1)])
                if group['type'] == 'key-points':
                    chunks.extend([say(q['prompt'], 'narrator', level), silence(8)])
                    chunks.extend(dialogue(q['script'], level))
                    chunks.extend([say(q['prompt'], 'narrator', level)])
                elif group['type'] == 'task-comprehension':
                    chunks.append(silence(8))
                    chunks.extend(dialogue(q['script'], level))
                    chunks.append(say(q['prompt'], 'narrator', level))
                else:
                    chunks.extend(dialogue(q['examinerReadout'], level))
                end = length()
                chunks.append(silence(12 if part <= 2 else 8 if part == 3 else 6))
                starts[q['id']] = {'start': round(start, 3), 'end': round(end, 3)}
            chunks.extend([say(f'問題{part}は、これで終わりです。', 'narrator', level), silence(8)])
            if lines_only:
                continue
            samples = np.concatenate(chunks)
            peak = max(float(np.max(np.abs(samples))), .001)
            pcm = (np.clip(samples / peak * .89, -1, 1) * 32767).astype('<i2').tobytes()
            filename = f'{slug}-part-{part}.mp3'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-', '-b:a', '48k', '-ac', '1', str(OUT / filename)], input=pcm, check=True)
            seconds = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(OUT / filename)], text=True))
            script_hash = hashlib.sha256(json.dumps(group, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
            parts.append({'part': part, 'file': filename, 'seconds': round(seconds, 3), 'sha256': hashlib.sha256((OUT / filename).read_bytes()).hexdigest(), 'scriptSha256': script_hash, 'questions': starts})
            print(f'FINISHED {filename}: {seconds:.1f}s', flush=True)
        if lines_only:
            continue
        total = sum(p['seconds'] for p in parts)
        assert total < (1800 if level == 'N5' else 2100) - 60, f'{slug}: {total:.0f} s leaves under a minute of the Listening stage'
        manifest = {'slug': slug, 'revision': 2,
                    'source': 'Original synthetic Japanese practice audio. Narrator: VoxCPM2 (openbmb/VoxCPM2, Apache-2.0) run locally through VoiceStudio. Woman and man: revision 1 Kokoro-82M v1.0 takes (Apache-2.0).',
                    'modelUrls': ['https://huggingface.co/openbmb/VoxCPM2', 'https://huggingface.co/hexgrad/Kokoro-82M'],
                    'voices': {'narrator': refs['narrator'][0].name, **KOKORO_VOICES},
                    'voiceDesign': {role: VOICES[role][0] for role in VOICES}, 'narratorPace': PACE[level], 'kokoroSpeed': KOKORO_SPEED[level], 'steps': STEPS,
                    'parts': parts, 'humanListeningReview': False}
        (OUT / f'{slug}-audio.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        timing[slug] = {'seconds': [p['seconds'] for p in parts], 'questions': {key: dict(value, part=p['part']) for p in parts for key, value in p['questions'].items()}}
        print(f'{slug}: {total:.0f} s', flush=True)
    (CACHE / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding='utf-8')
    if not lines_only:
        CATALOG.write_text(json.dumps(timing, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
