"""Generate original Mandarin HSK 2 listening audio locally (no API key or provider).

Same environment, model, voices and pinyin-driven speech as scripts/generate-hsk-audio.py (see its header); this
script loads that module for the synthesis and only adds the HSK 2 paper: four part tracks per mock, 35 items,
every item read twice (3 s after the first reading, then 8 s in Parts 1-2 and 10 s in Parts 3-4).
Usage: python scripts/generate-hsk2-audio.py [model-dir]

It writes assets/hsk-audio/hsk2-mock-0N-part-P.mp3 with a provenance manifest and merges answer-free item timings
into src/modules/exams/hsk/audio-catalog.json. HSK 1 files and entries are never touched.
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

PACK = ROOT / 'MockExmps' / 'HSK2'
OUT, CATALOG, RATE, VOICES, SPEED = base.OUT, base.CATALOG, base.RATE, base.VOICES, base.SPEED
FIRST_GAP = 3.0
SECOND_GAP = {1: 8.0, 2: 8.0, 3: 10.0, 4: 10.0}
LIMIT = 24 * 60  # the Listening stage is 25 minutes; at least one is left to check answers
NARRATOR = 'narrator'
TASKS = {
    1: ('听录音，判断对错。', 'Tīng lùyīn, pànduàn duì cuò.'),
    2: ('听对话，选择相应的图片。', 'Tīng duìhuà, xuǎnzé xiāngyìng de túpiàn.'),
    3: ('听对话，选择答案。', 'Tīng duìhuà, xuǎnzé dá\'àn.'),
    4: ('听对话，选择答案。', 'Tīng duìhuà, xuǎnzé dá\'àn.'),
}
COUNTS = {1: ('十', 'shí'), 2: ('十', 'shí'), 3: ('十', 'shí'), 4: ('五', 'wǔ')}
ROLE = {'女': 'woman', '男': 'man'}


def readings(item, part, index):
    """The spoken turns of one item: (text, pinyin, role)."""
    if part == 1:
        return [(item['sentence'], item['pinyin'], 'woman' if index % 2 == 0 else 'man')]
    turns = [(turn['text'], turn['pinyin'], ROLE[turn['speaker']]) for turn in item['dialogue']]
    if part >= 3:
        turns.append(('问：' + item['question'], 'Wèn: ' + item['questionPinyin'], NARRATOR))
    return turns


def stable(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def main():
    model = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'artifacts' / 'speaking-voice-cache' / 'onnx-community' / 'Kokoro-82M-v1.0-ONNX'
    voice = base.Voice(model)
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    for number in (1, 2, 3):
        source = json.loads((PACK / f'mock-{number:02}' / 'mock.json').read_text(encoding='utf-8'))
        slug = f'hsk2-mock-{number:02}'
        parts, questions = [], {}
        for part in (1, 2, 3, 4):
            chunks = []
            length = lambda: sum(len(c) for c in chunks) / RATE

            def speak(turns, gap_after):
                for i, (text, pinyin, role) in enumerate(turns):
                    # 'yìdiǎnr' would split as yi-di-an-r; the erhua is spoken as its own light syllable.
                    chunks.append(voice.say(text, pinyin.replace('diǎnr', 'diǎn er'), role))
                    chunks.append(base.silence(0.55 if i < len(turns) - 1 else gap_after))

            def item_block(item, index):
                start = length()
                speak([(f"第{base.number_han(item['n'])}题。", f"Dì {base.number_pinyin(item['n'])} tí.", NARRATOR)], 0.8)
                turns = readings(item, part, index)
                speak(turns, FIRST_GAP)
                speak(turns, 0.01)
                questions[f'hsk2-{number:02}-{item["n"]:02}'] = {'start': round(start, 3), 'end': round(length(), 3), 'part': part}
                chunks.append(base.silence(SECOND_GAP[part]))

            if part == 1:
                speak([('汉语水平考试二级模拟考试。听力考试现在开始。', 'Hànyǔ Shuǐpíng Kǎoshì èr jí mónǐ kǎoshì. Tīnglì kǎoshì xiànzài kāishǐ.', NARRATOR)], 2.0)
            count, count_pinyin = COUNTS[part]
            speak([(f'第{base.PART_NAMES[part - 1]}部分，一共{count}个题，每题听两次。', f'Dì {base.number_pinyin(part)} bùfen, yígòng {count_pinyin} gè tí, měi tí tīng liǎng cì.', NARRATOR),
                   TASKS[part] + (NARRATOR,)], 1.5)
            group = source['listening'][f'part{part}']
            example = group['setA']['example'] if part == 2 else source['examples']['listening'][f'part{part}']
            example_turns = readings(example, part, 0)
            speak([('例如：', 'Lìrú:', NARRATOR)], 0.6)
            speak(example_turns, 2.5)
            speak(example_turns, 3.0)
            if part == 2:
                for index, item in enumerate(group['setA']['items']):
                    item_block(item, index)
                speak([('现在开始第十六到二十题。', 'Xiànzài kāishǐ dì shíliù dào èrshí tí.', NARRATOR)], 1.5)
                for index, item in enumerate(group['setB']['items']):
                    item_block(item, index)
            else:
                for index, item in enumerate(group):
                    item_block(item, index)
            if part == 4:
                speak([('听力考试现在结束。', 'Tīnglì kǎoshì xiànzài jiéshù.', NARRATOR)], 2.0)
            samples = np.concatenate(chunks)
            peak = max(float(np.max(np.abs(samples))), .001)
            pcm = (np.clip(samples / peak * .89, -1, 1) * 32767).astype('<i2').tobytes()
            filename = f'{slug}-part-{part}.mp3'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-', '-b:a', '48k', '-ac', '1', str(OUT / filename)], input=pcm, check=True)
            seconds = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(OUT / filename)], text=True))
            script_hash = hashlib.sha256(stable([group, None if part == 2 else example]).encode()).hexdigest()
            parts.append({'part': part, 'file': filename, 'seconds': round(seconds, 3), 'sha256': hashlib.sha256((OUT / filename).read_bytes()).hexdigest(), 'scriptSha256': script_hash})
            print(f'FINISHED {filename}: {seconds:.1f}s', flush=True)
        total = sum(p['seconds'] for p in parts)
        assert total < LIMIT, f'{slug}: {total:.0f} s leaves under a minute of the 25-minute Listening stage'
        manifest = {'slug': slug, 'source': 'Original synthetic Mandarin practice audio; Kokoro-82M v1.0, Apache-2.0',
                    'modelUrl': 'https://huggingface.co/hexgrad/Kokoro-82M', 'voices': VOICES, 'speed': SPEED,
                    'readings': 'Every item twice: 3 s after the first reading, then 8 s (Parts 1-2) or 10 s (Parts 3-4).',
                    'parts': parts, 'humanListeningReview': False}
        (OUT / f'{slug}-audio.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        catalog[slug] = {'seconds': [p['seconds'] for p in parts], 'questions': questions}
        print(f'{slug}: {total:.0f} s', flush=True)
    CATALOG.write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
