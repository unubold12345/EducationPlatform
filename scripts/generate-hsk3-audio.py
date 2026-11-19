"""Generate the HSK 3.0 listening audio (HSK 1 and HSK 2, forms 01-06, MockExmps/HSK3) locally (no API key or provider).

Same environment, model, voices and pinyin-driven speech as scripts/generate-hsk-audio.py (see its header): this
script loads that module for the synthesis. One track per listening part (HSK 1: four parts, 20 items; HSK 2: three
parts, 25 items), every item read twice, as on the paper.
Usage: python scripts/generate-hsk3-audio.py [model-dir] [slug ...]

It writes assets/hsk-audio/<slug>-part-P.mp3 with a provenance manifest, removes a part file the new paper no longer
has (HSK 2 part 4), and replaces the slug's answer-free item timings in src/modules/exams/hsk/audio-catalog.json.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('hsk1_audio', ROOT / 'scripts' / 'generate-hsk-audio.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

PACK = ROOT / 'MockExmps' / 'HSK3'
OUT, CATALOG, RATE, VOICES, SPEED = base.OUT, base.CATALOG, base.RATE, base.VOICES, base.SPEED
NARRATOR = 'narrator'
# Seconds after the first and the second reading; the Listening stage length (minutes) the track must leave time in.
GAPS = {1: (5.0, {1: 8.0, 2: 10.0, 3: 10.0, 4: 10.0}), 2: (3.0, {1: 8.0, 2: 8.0, 3: 10.0})}
STAGE_MINUTES = {1: 15, 2: 20}
LEVEL_HAN = {1: '一', 2: '二'}
LEVEL_PINYIN = {1: 'yī', 2: 'èr'}


def stable(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def speech_pinyin(pinyin):
    # 'yìdiǎnr' would split as yi-di-an-r and 'miàntiáor' as mian-ti-a-o-r; the erhua is spoken as its own light syllable.
    # The longest-first splitter also reads 'kěnéng' as ken-eng; an apostrophe keeps it ke-neng.
    return pinyin.replace('diǎnr', 'diǎn er').replace('tiáor', 'tiáo er').replace('ěnéng', "ě'néng")


def build(voice, slug):
    source = json.loads((PACK / slug / 'mock.json').read_text(encoding='utf-8'))
    level, number = source['level'], source['number']
    first_gap, second_gaps = GAPS[level]
    listening = next(stage for stage in source['stages'] if stage['id'] == 'hsk-l')
    parts = {}
    for entry in listening['sets']:
        parts.setdefault(int(entry['key'][1]), []).append(entry)
    tracks, questions = [], {}
    for part, sets in sorted(parts.items()):
        chunks = []
        length = lambda: sum(len(c) for c in chunks) / RATE  # noqa: E731

        def speak(turns, gap_after):
            for i, (text, pinyin, role) in enumerate(turns):
                chunks.append(voice.say(text, speech_pinyin(pinyin), role))
                chunks.append(base.silence(0.55 if i < len(turns) - 1 else gap_after))

        def turns_of(item):
            return [(turn['text'] if 'speaker' not in turn else f"{turn['text']}", turn['pinyin'], turn['role']) for turn in item['turns']]

        if part == 1:
            speak([(f'汉语水平考试{LEVEL_HAN[level]}级模拟考试。听力考试现在开始。', f'Hànyǔ Shuǐpíng Kǎoshì {LEVEL_PINYIN[level]} jí mónǐ kǎoshì. Tīnglì kǎoshì xiànzài kāishǐ.', NARRATOR)], 2.0)
        count = sum(len(entry['items']) for entry in sets)
        task, task_pinyin = sets[0]['audio']
        speak([(f'第{base.PART_NAMES[part - 1]}部分，一共{base.number_han(count)}个题，每题听两次。', f'Dì {base.number_pinyin(part)} bùfen, yígòng {base.number_pinyin(count)} gè tí, měi tí tīng liǎng cì.', NARRATOR),
               (task, task_pinyin, NARRATOR)], 1.5)
        example = sets[0].get('example')
        if example and example.get('turns'):
            speak([('例如：', 'Lìrú:', NARRATOR)], 0.6)
            speak(turns_of(example), 2.5)
            speak(turns_of(example), 3.0)
        for set_index, entry in enumerate(sets):
            if set_index:
                first, last = entry['items'][0]['n'], entry['items'][-1]['n']
                speak([(f'现在开始第{base.number_han(first)}到{base.number_han(last)}题。', f'Xiànzài kāishǐ dì {base.number_pinyin(first)} dào {base.number_pinyin(last)} tí.', NARRATOR)], 1.5)
            for item in entry['items']:
                start = length()
                speak([(f"第{base.number_han(item['n'])}题。", f"Dì {base.number_pinyin(item['n'])} tí.", NARRATOR)], 0.8)
                turns = turns_of(item)
                speak(turns, first_gap)
                speak(turns, 0.01)
                questions[f'hsk{level}-{number:02}-{item["n"]:02}'] = {'start': round(start, 3), 'end': round(length(), 3), 'part': part}
                chunks.append(base.silence(second_gaps[part]))
        if part == max(parts):
            speak([('听力考试现在结束。', 'Tīnglì kǎoshì xiànzài jiéshù.', NARRATOR)], 2.0)
        samples = np.concatenate(chunks)
        peak = max(float(np.max(np.abs(samples))), .001)
        pcm = (np.clip(samples / peak * .89, -1, 1) * 32767).astype('<i2').tobytes()
        filename = f'{slug}-part-{part}.mp3'
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-', '-b:a', '48k', '-ac', '1', str(OUT / filename)], input=pcm, check=True)
        seconds = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(OUT / filename)], text=True))
        tracks.append({'part': part, 'file': filename, 'seconds': round(seconds, 3), 'sha256': hashlib.sha256((OUT / filename).read_bytes()).hexdigest(), 'scriptSha256': hashlib.sha256(stable(sets).encode()).hexdigest()})
        print(f'FINISHED {filename}: {seconds:.1f}s', flush=True)
    for stale in range(len(tracks) + 1, 5):
        (OUT / f'{slug}-part-{stale}.mp3').unlink(missing_ok=True)
    total = sum(track['seconds'] for track in tracks)
    assert total < STAGE_MINUTES[level] * 60 - 60, f'{slug}: {total:.0f} s leaves under a minute of the {STAGE_MINUTES[level]}-minute Listening stage'
    manifest = {'slug': slug, 'paper': 'HSK 3.0', 'source': 'Original synthetic Mandarin practice audio; Kokoro-82M v1.0, Apache-2.0',
                'modelUrl': 'https://huggingface.co/hexgrad/Kokoro-82M', 'voices': VOICES, 'speed': SPEED,
                'readings': f'Every item twice: {first_gap:g} s after the first reading, then {", ".join(f"{s:g} s (Part {p})" for p, s in second_gaps.items())}.',
                'parts': tracks, 'humanListeningReview': False}
    (OUT / f'{slug}-audio.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{slug}: {total:.0f} s', flush=True)
    return {'seconds': [track['seconds'] for track in tracks], 'questions': questions}


def main():
    args = sys.argv[1:]
    model = Path(args.pop(0)) if args and not args[0].startswith('hsk') else ROOT / 'artifacts' / 'speaking-voice-cache' / 'onnx-community' / 'Kokoro-82M-v1.0-ONNX'
    slugs = args or [f'hsk{level}-mock-{number:02}' for level in (1, 2) for number in range(1, 7)]
    voice = base.Voice(model)
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in slugs:
        timings = build(voice, slug)
        catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
        catalog[slug] = timings
        CATALOG.write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
