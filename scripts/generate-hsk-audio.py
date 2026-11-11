"""Generate original Mandarin HSK 1 listening audio locally (no API key or provider).

Python 3.12 environment: misaki[zh]==0.9.4 (jieba, pypinyin, cn2an), onnxruntime, numpy.
Model: onnx-community/Kokoro-82M-v1.0-ONNX, fp32 (original hexgrad/Kokoro-82M, Apache-2.0). By default the
Speaking Lab's cached copy in artifacts/speaking-voice-cache; the Mandarin voice tables are the ones kokoro-js
ships in node_modules/kokoro-js/voices. ffmpeg/ffprobe must be on PATH.
Usage: python scripts/generate-hsk-audio.py [model-dir]

Speech comes from the pack's authored pinyin, not from automatic character-to-pinyin conversion, so polyphones,
neutral tones and 一/不 changes follow the pack; third-tone runs inside a clause are changed (all but the last
become second tone). Each item is read twice, as in the official HSK 1 listening, with 5 s after the first reading
and 10 s after the second. Only deliverable tracks, provenance and answer-free timing metadata are written inside
the repository (assets/hsk-audio and src/modules/exams/hsk/audio-catalog.json).
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

import numpy as np
import onnxruntime as ort
from misaki.transcription import pinyin_to_ipa
from misaki.zh import ZHG2P
from pypinyin import pinyin as han_pinyin, Style

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'MockExmps' / 'HSK'
OUT = ROOT / 'assets' / 'hsk-audio'
CATALOG = ROOT / 'src' / 'modules' / 'exams' / 'hsk' / 'audio-catalog.json'
RATE = 24000
SPEED = 0.9
VOICES = {'narrator': 'zm_yunxia', 'woman': 'zf_xiaoyi', 'man': 'zm_yunxi'}
FIRST_GAP, SECOND_GAP = 5.0, 10.0
TONES = {'ā': ('a', 1), 'á': ('a', 2), 'ǎ': ('a', 3), 'à': ('a', 4), 'ē': ('e', 1), 'é': ('e', 2), 'ě': ('e', 3), 'è': ('e', 4),
         'ī': ('i', 1), 'í': ('i', 2), 'ǐ': ('i', 3), 'ì': ('i', 4), 'ō': ('o', 1), 'ó': ('o', 2), 'ǒ': ('o', 3), 'ò': ('o', 4),
         'ū': ('u', 1), 'ú': ('u', 2), 'ǔ': ('u', 3), 'ù': ('u', 4), 'ǖ': ('v', 1), 'ǘ': ('v', 2), 'ǚ': ('v', 3), 'ǜ': ('v', 4), 'ü': ('v', 0)}
DIGITS = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ']

# Every toneless syllable pypinyin knows, as the segmentation dictionary (ü written v, as pinyin_to_ipa accepts).
SYLLABLES = {s.replace('ü', 'v') for code in range(0x4E00, 0x9FA6) for group in han_pinyin(chr(code), style=Style.NORMAL, heteronym=True) for s in group if s.isalpha()}
SYLLABLES -= {'m', 'n', 'ng', 'hm', 'hng', 'ê'}


HAN_DIGITS = '零一二三四五六七八九'


def number_pinyin(n):
    if n < 10: return DIGITS[n]
    tens, ones = divmod(n, 10)
    return ('' if tens == 1 else DIGITS[tens]) + 'shí' + (DIGITS[ones] if ones else '')


def number_han(n):
    if n < 10: return HAN_DIGITS[n]
    tens, ones = divmod(n, 10)
    return ('' if tens == 1 else HAN_DIGITS[tens]) + '十' + (HAN_DIGITS[ones] if ones else '')


def segment(plain):
    """Split one pinyin word (toneless, lower case) into dictionary syllables, longest first with backtracking."""
    if not plain: return []
    for size in range(min(6, len(plain)), 0, -1):
        head = plain[:size]
        if head in SYLLABLES:
            rest = segment(plain[size:])
            if rest is not None: return [head] + rest
    # Erhua (nǎr, zhèr): a syllable plus a final r, spoken as the syllable and a light er.
    for size in range(min(6, len(plain) - 1), 0, -1):
        if plain[size] == 'r' and plain[:size] in SYLLABLES:
            rest = segment(plain[size + 1:])
            if rest is not None: return [plain[:size], 'r'] + rest
    return None


def syllables_of(word):
    """'xǐhuan' -> [('xi', 3), ('huan', 5)]; erhua adds ('er', 5)."""
    plain, marks = '', []
    for char in unicodedata.normalize('NFC', word.lower()):
        if char in TONES:
            base, tone = TONES[char]
            if tone: marks.append((len(plain), tone))
            plain += base
        elif char.isalpha(): plain += char
    parts = segment(plain)
    if parts is None: raise ValueError(f'cannot split pinyin {word!r}')
    out, at = [], 0
    for part in parts:
        if part == 'r': out.append(('er', 5)); continue
        tone = next((t for position, t in marks if at <= position < at + len(part)), 5)
        out.append((part, tone)); at += len(part)
    return out


def sandhi(words):
    """Third-tone runs inside one clause: all but the last syllable rise (nǐ hǎo -> ní hǎo)."""
    flat = [s for word in words for s in word]
    index = 0
    while index < len(flat):
        if flat[index][1] != 3: index += 1; continue
        end = index
        while end + 1 < len(flat) and flat[end + 1][1] == 3: end += 1
        for k in range(index, end): flat[k] = (flat[k][0], 2)
        index = end + 1
    out, k = [], 0
    for word in words:
        out.append(flat[k:k + len(word)]); k += len(word)
    return out


def ipa(syllable, tone):
    text = syllable + (str(tone) if tone != 5 else '5')
    return ''.join(ZHG2P.retone(p) for p in pinyin_to_ipa(text)[0]).replace(chr(815), '')


def phonemes(text, pinyin):
    """Kokoro phonemes from authored pinyin, checked against the Chinese text's syllable count."""
    han = re.findall(r'[一-鿿]', text)
    clauses = re.split(r'([,.?!:;，。？！：；])', pinyin.replace('-', ' ').replace("'", ' ').replace('’', ' '))
    pieces, count = [], 0
    for chunk in clauses:
        if not chunk.strip(): continue
        if re.fullmatch(r'[,.?!:;，。？！：；]', chunk):
            mark = {'，': ',', '。': '.', '？': '?', '！': '!', '：': ':', '；': ';'}.get(chunk, chunk)
            if pieces: pieces[-1] += mark
            continue
        words = [syllables_of(w) for w in chunk.split() if re.search(r'[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]', w)]
        count += sum(len(w) for w in words)
        pieces.extend(''.join(ipa(s, t) for s, t in word) for word in sandhi(words))
    if count != len(han): raise ValueError(f'{text}: {len(han)} characters but {count} syllables in {pinyin!r}')
    return ' '.join(pieces)


class Voice:
    def __init__(self, model_dir):
        self.vocab = json.loads((model_dir / 'tokenizer.json').read_text(encoding='utf-8'))['model']['vocab']
        options = ort.SessionOptions(); options.intra_op_num_threads = 4; options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(str(model_dir / 'onnx' / 'model.onnx'), sess_options=options, providers=['CPUExecutionProvider'])
        self.tables = {name: np.fromfile(ROOT / 'node_modules' / 'kokoro-js' / 'voices' / f'{name}.bin', dtype=np.float32).reshape(-1, 256) for name in VOICES.values()}
        self.cache = {}

    def say(self, text, pinyin, role):
        sounds = phonemes(text, pinyin)
        key = (sounds, role)
        if key in self.cache: return self.cache[key]
        ids = [self.vocab[c] for c in sounds if c in self.vocab]
        missing = {c for c in sounds if c not in self.vocab and c != ' '}
        assert not missing and ids, (text, missing)
        table = self.tables[VOICES[role]]
        samples = self.session.run(None, {'input_ids': np.array([[0] + ids + [0]], dtype=np.int64), 'style': table[min(len(ids), len(table) - 1)][None, :], 'speed': np.array([SPEED], dtype=np.float32)})[0].reshape(-1).astype(np.float32)
        assert samples.size > RATE // 4, text
        self.cache[key] = samples
        return samples


def silence(seconds):
    return np.zeros(int(seconds * RATE), np.float32)


PART_TASKS = {
    1: ('听录音，判断对错。', 'Tīng lùyīn, pànduàn duì cuò.'),
    2: ('听录音，选择相应的图片。', 'Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.'),
    3: ('听录音，选择相应的图片。', 'Tīng lùyīn, xuǎnzé xiāngyìng de túpiàn.'),
    4: ('听录音，选择答案。', 'Tīng lùyīn, xuǎnzé dá\'àn.'),
}
PART_NAMES = ['一', '二', '三', '四']


def readings(item, part, index):
    """The spoken turns of one item: (text, pinyin, role)."""
    alternate = 'woman' if index % 2 == 0 else 'man'
    if part == 1: return [(item['phrase'], item['pinyin'], alternate)]
    if part == 2: return [(item['sentence'], item['pinyin'], alternate)]
    if part == 3: return [(turn['text'], turn['pinyin'], 'woman' if turn['speaker'] == '女' else 'man') for turn in item['dialogue']]
    speaker = 'woman' if '她' in item['question'] else 'man' if '他' in item['question'] else alternate
    return [(item['statement'], item['statementPinyin'], speaker), ('问：' + item['question'], 'Wèn: ' + item['questionPinyin'], 'narrator')]


def script_of(turns):
    return '\n'.join(text for text, _, _ in turns)


def main():
    model = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'artifacts' / 'speaking-voice-cache' / 'onnx-community' / 'Kokoro-82M-v1.0-ONNX'
    voice = Voice(model)
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = {}
    for number in (1, 2, 3):
        folder = PACK / f'mock-{number:02}'
        source = json.loads((folder / 'mock.json').read_text(encoding='utf-8'))
        slug = f'hsk1-mock-{number:02}'
        parts, questions = [], {}
        for part in (1, 2, 3, 4):
            chunks = []
            length = lambda: sum(len(c) for c in chunks) / RATE
            def speak(turns, gap_after):
                for i, (text, pinyin, role) in enumerate(turns):
                    chunks.append(voice.say(text, pinyin, role))
                    chunks.append(silence(0.55 if i < len(turns) - 1 else gap_after))
            if part == 1:
                speak([('汉语水平考试一级模拟考试。听力考试现在开始。', 'Hànyǔ Shuǐpíng Kǎoshì yī jí mónǐ kǎoshì. Tīnglì kǎoshì xiànzài kāishǐ.', 'narrator')], 2.0)
            name = PART_NAMES[part - 1]
            speak([(f'第{name}部分，一共五个题，每题听两次。', f'Dì {number_pinyin(part)} bùfen, yígòng wǔ gè tí, měi tí tīng liǎng cì.', 'narrator'),
                   PART_TASKS[part] + ('narrator',)], 1.5)
            group = source['listening'][f'part{part}']
            example = source['examples']['listening'][f'part{part}']
            example_turns = readings(example, part, 0)
            speak([('例如：', 'Lìrú:', 'narrator')], 0.6)
            speak(example_turns, 2.5)
            speak(example_turns, 3.0)
            items = group['items'] if isinstance(group, dict) else group
            for index, item in enumerate(items):
                start = length()
                speak([(f"第{number_han(item['n'])}题。", f"Dì {number_pinyin(item['n'])} tí.", 'narrator')], 0.8)
                turns = readings(item, part, index)
                speak(turns, FIRST_GAP)
                speak(turns, 0.01)
                end = length()
                chunks.append(silence(SECOND_GAP))
                questions[f'hsk1-{number:02}-{item["n"]:02}'] = {'start': round(start, 3), 'end': round(end, 3), 'part': part}
                print(f'{slug} part {part} item {item["n"]} synthesized', flush=True)
            if part == 4:
                speak([('听力考试现在结束。', 'Tīnglì kǎoshì xiànzài jiéshù.', 'narrator')], 2.0)
            samples = np.concatenate(chunks)
            peak = max(float(np.max(np.abs(samples))), .001)
            pcm = (np.clip(samples / peak * .89, -1, 1) * 32767).astype('<i2').tobytes()
            filename = f'{slug}-part-{part}.mp3'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-', '-b:a', '48k', '-ac', '1', str(OUT / filename)], input=pcm, check=True)
            seconds = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(OUT / filename)], text=True))
            body = (OUT / filename).read_bytes()
            script_hash = hashlib.sha256(json.dumps([group, example], ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
            parts.append({'part': part, 'file': filename, 'seconds': round(seconds, 3), 'sha256': hashlib.sha256(body).hexdigest(), 'scriptSha256': script_hash})
            print(f'FINISHED {filename}: {seconds:.1f}s', flush=True)
        total = sum(p['seconds'] for p in parts)
        assert total < 840, f'{slug}: {total:.0f} s leaves under a minute of the 15-minute Listening stage'
        manifest = {'slug': slug, 'source': 'Original synthetic Mandarin practice audio; Kokoro-82M v1.0, Apache-2.0',
                    'modelUrl': 'https://huggingface.co/hexgrad/Kokoro-82M', 'voices': VOICES, 'speed': SPEED,
                    'readings': 'Every item twice: 5 s after the first reading, 10 s after the second.',
                    'parts': parts, 'humanListeningReview': False}
        (OUT / f'{slug}-audio.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        catalog[slug] = {'seconds': [p['seconds'] for p in parts], 'questions': questions}
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
