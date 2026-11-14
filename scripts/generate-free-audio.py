r"""Generate the listening recordings of the four free half-length mocks locally (no API key or provider).

The mocks come from the offline pack in MockExmps/Free (read only): ielts-academic-free (Listening Parts 1-2),
jlpt-n5-free, jlpt-n4-free and hsk1-free. They are made the way the paid mocks' audio was made; the paid generators
are imported read-only for their voices, speeds, gaps and text rules:
- IELTS as scripts/generate-ielts-audio.py (version 2): Kokoro English at one pace (1.0), espeak-ng phonemes (en-gb
  for b* voices, en-us otherwise), 0.45 s after a turn and 1.0 s after narration. The script file's own narrator
  lines, pause rows and suggested voices are used. Synthesis follows the paid v2 run (style row = phoneme count,
  silence trimmed), which reproduces its cached utterances.
- JLPT as scripts/generate-jlpt-audio.py: misaki[ja] phonemes; jf_alpha, jf_tebukuro, jm_kumo; speed N5 0.9, N4 1.0;
  one track per mondai: "問題n" and its instructions, then per item "n番", the 8-s preview (task and key-point
  items), the talk, the closing question and a 12/12/8/6-s answer gap; synthesized by kokoro-onnx 0.6.1, which
  reproduces the paid run's cached utterances exactly.
- HSK 1 as scripts/generate-hsk-audio.py: Mandarin from the authored pinyin with 3-3 sandhi; zm_yunxia, zf_xiaoyi,
  zm_yunxi at 0.9; per part the instruction and the worked example (the shared examples of MockExmps/HSK, whose
  pictures the free pack shows), then every item read twice, 5 s after the first reading and 10 s after the second.
Speech-only renderings (the pack text is not changed): a name spelled with hyphens is read letter by letter, as the
paid v2 scripts write it ("H, A, R, ..."); "in 1987" is read as a year; JA_READINGS gives kana for the kanji that
misaki reads wrongly in these scripts, like the "漢字（かな）" readings of the paid JLPT scripts.

Setup (outside the repo, Python 3.12; add --offline to both uv commands to install from a warm uv cache only):
  uv venv --python 3.12 $env:TEMP/education-free-audio-py312
  uv pip install --python $env:TEMP/education-free-audio-py312/Scripts/python.exe "misaki[ja,zh]==0.7.4"
      "kokoro-onnx==0.6.1" "pypinyin==0.55.0" "jieba==0.42.1" "cn2an==0.5.24" "onnxruntime==1.31.1" "numpy==2.5.4"
Model: onnx-community/Kokoro-82M-v1.0-ONNX, fp32 onnx/model.onnx and tokenizer.json (original hexgrad/Kokoro-82M,
Apache-2.0); by default the Speaking Lab's cached copy in artifacts/speaking-voice-cache. Voice tables: the ones
kokoro-js ships in node_modules/kokoro-js/voices. ffmpeg and ffprobe must be on PATH.
Run from the repo root (PowerShell):
  & "$env:TEMP/education-free-audio-py312/Scripts/python.exe" -I scripts/generate-free-audio.py [model-dir]
Re-runnable: utterances are cached in <system temp>/education-free-audio-utterances-v1, keyed by model, voice, speed
and phonemes, so after a script edit only the changed lines are synthesized again. Writes only
assets/free-audio/<slug>-part-<n>.mp3 (48 kbps mono, like assets/hsk-audio), assets/free-audio/manifest.json and the
answer-free timing catalogue src/modules/exams/free/audio-catalog.json. Nothing is written if a recording would leave
under a minute of its listening stage for checking answers; the run then prints the measured length and a stage
length that fits.
"""
import datetime
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import warnings

import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[1]
FREE = ROOT / 'MockExmps' / 'Free'
PACKS = {
    'ielts-listening': FREE / 'ielts' / 'ielts-academic-free-listening.json',
    'ielts': FREE / 'ielts' / 'ielts-academic-free.json',
    'jlpt-n5': FREE / 'jlpt' / 'jlpt-n5-free.json',
    'jlpt-n4': FREE / 'jlpt' / 'jlpt-n4-free.json',
    'hsk': FREE / 'hsk' / 'hsk1-free.json',
    'hsk-examples': ROOT / 'MockExmps' / 'HSK' / 'mock-01' / 'mock.json',  # the worked examples every HSK mock shares
}
OUT = ROOT / 'assets' / 'free-audio'
MANIFEST = OUT / 'manifest.json'
CATALOG = ROOT / 'src' / 'modules' / 'exams' / 'free' / 'audio-catalog.json'
VOICE_TABLES = ROOT / 'node_modules' / 'kokoro-js' / 'voices'
CACHE = Path(tempfile.gettempdir()) / 'education-free-audio-utterances-v1'
GENERATOR = 'scripts/generate-free-audio.py'
MIN_SPARE = 60.0  # seconds of each listening stage left after the recording, for checking answers


def paid_generator(name):
    """Import a paid-mock generator read-only (its main() does not run)."""
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), ROOT / 'scripts' / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


warnings.filterwarnings('ignore', category=SyntaxWarning)  # jieba's regular expressions, on its first import
IELTS = paid_generator('generate-ielts-audio')
JLPT = paid_generator('generate-jlpt-audio')
HSK = paid_generator('generate-hsk-audio')
from kokoro_onnx import Kokoro  # noqa: E402  (installed for the paid generators)
from kokoro_onnx.trim import trim  # noqa: E402
RATE = HSK.RATE


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def silence(seconds):
    return np.zeros(int(seconds * RATE), np.float32)


class Track:
    """The samples of one part in order; `now` is the length so far in seconds, as the paid generators measure it."""

    def __init__(self):
        self.chunks, self.size, self.voices = [], 0, {}

    def add(self, samples):
        self.chunks.append(samples)
        self.size += len(samples)

    def pause(self, seconds):
        self.add(silence(seconds))

    @property
    def now(self):
        return self.size / RATE


# ---- speech-only renderings -------------------------------------------------------------------------------------
SPELLED = re.compile(r'\b[A-Z](?:-[A-Z]){2,}\b')
YEAR = re.compile(r'\b(in|since|from|until|by) (1[1-9])(\d\d)\b')
ONES = ('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen '
        'seventeen eighteen nineteen').split()
TENS = 'twenty thirty forty fifty sixty seventy eighty ninety'.split()


def words(n):
    return ONES[n] if n < 20 else TENS[n // 10 - 2] + (f'-{ONES[n % 10]}' if n % 10 else '')


def english_speech(text):
    """'H-A-R-T-L-E-Y' is read letter by letter ('H, A, R, ...'); espeak-ng would run the letters together and read
    A as 'uh'. 'in 1987' is read 'in nineteen eighty-seven' instead of 'nineteen hundred and eighty-seven'."""
    def year(match):
        rest = int(match.group(3))
        if not rest: return match.group(0)
        return f"{match.group(1)} {words(int(match.group(2)))} {'oh ' + ONES[rest] if rest < 10 else words(rest)}"
    return YEAR.sub(year, SPELLED.sub(lambda match: ', '.join(match.group(0).split('-')), text))


HOURS = 'れい いち に さん よ ご ろく しち はち く じゅう じゅういち じゅうに'.split()
WEEKDAYS = {'日': 'にち', '月': 'げつ', '火': 'か', '水': 'すい', '木': 'もく', '金': 'きん', '土': 'ど', '何': 'なん'}
# Kana for kanji that misaki[ja] (unidic-lite) reads wrongly in these scripts: 何を/何が/何で as なん…, 何時 as いつ,
# 2時 as にとき, 曜日 and 誕生日 with ひ.
JA_READINGS = (
    (r'何時', 'なんじ'), (r'何を', 'なにを'), (r'何が', 'なにが'), (r'何で', 'なにで'),
    (r'(?<![0-9])(1[0-2]|[0-9])時', lambda match: HOURS[int(match.group(1))] + 'じ'),
    (r'([日月火水木金土何])曜日', lambda match: WEEKDAYS[match.group(1)] + 'ようび'), (r'誕生日', 'たんじょうび'),
)


def japanese_speech(text):
    text = JLPT.speech_text(text)
    for pattern, kana in JA_READINGS:
        text = re.sub(pattern, kana, text)
    return text


def split_v04(phonemes, limit=510):
    """kokoro-onnx 0.4's batching at . , ! ? ; (the paid IELTS v2 run), for a line over the model's 510 phonemes."""
    if len(phonemes) < limit: return [phonemes]
    batches, current = [], ''
    for part in re.split(r'([.,!?;])', phonemes):
        part = part.strip()
        if not part: continue
        if len(current) + len(part) + 1 >= limit:
            batches.append(current.strip())
            current = part
        elif part in '.,!?;': current += part
        else: current += (' ' if current else '') + part
    return batches + [current.strip()] if current else batches


class Engine:
    """One Kokoro session, the synthesis path each paid generator used, and a disk cache of utterances."""

    def __init__(self, model_dir):
        model = model_dir / 'onnx' / 'model.onnx'
        with open(model, 'rb') as handle: digest = hashlib.file_digest(handle, 'sha256').hexdigest()
        self.model = {'name': 'onnx-community/Kokoro-82M-v1.0-ONNX', 'file': 'onnx/model.onnx', 'sha256': digest}
        self.vocab = json.loads((model_dir / 'tokenizer.json').read_text(encoding='utf-8'))['model']['vocab']
        options = ort.SessionOptions(); options.intra_op_num_threads = 4; options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(str(model), sess_options=options, providers=['CPUExecutionProvider'])
        self.tables, self.memory, self.made, self.loaded = {}, {}, 0, 0
        CACHE.mkdir(parents=True, exist_ok=True)
        # The JLPT run went through kokoro-onnx 0.6.1 (style row = phoneme count - 1, silence trimmed); reuse it as is.
        voices = CACHE / 'kokoro-js-ja-voices.npz'
        np.savez(voices, **{name: self.table(name).reshape(-1, 1, 256) for name in JLPT.VOICES.values()})
        self.kokoro = Kokoro.from_session(self.session, str(voices))
        self.ja = JLPT.ja.JAG2P()

    def table(self, name):
        if name not in self.tables:
            self.tables[name] = np.fromfile(VOICE_TABLES / f'{name}.bin', dtype=np.float32).reshape(-1, 256)
        return self.tables[name]

    def infer(self, ids, voice, row, speed):
        table = self.table(voice)
        inputs = {'input_ids': np.array([[0] + ids + [0]], dtype=np.int64), 'style': table[min(row, len(table) - 1)][None, :],
                  'speed': np.array([speed], dtype=np.float32)}
        return self.session.run(None, inputs)[0].reshape(-1).astype(np.float32)

    def cached(self, path, voice, speed, phonemes, make):
        key = sha256(canonical([path, self.model['sha256'], voice, speed, phonemes]).encode())
        if key not in self.memory:
            file = CACHE / f'{key}.npy'
            if file.exists():
                self.memory[key] = np.load(file); self.loaded += 1
            else:
                samples = np.asarray(make(), dtype=np.float32)
                partial = CACHE / f'{key}.{os.getpid()}.partial.npy'
                np.save(partial, samples); os.replace(partial, file)
                self.memory[key] = samples; self.made += 1
        return self.memory[key]

    def english(self, text, voice, speed):
        """IELTS v2: espeak-ng phonemes; per batch style row = phoneme count, leading/trailing silence trimmed."""
        phonemes = ' '.join(self.kokoro.tokenizer.phonemize(text, 'en-gb' if voice.startswith('b') else 'en-us').split())
        def make():
            ids = [self.kokoro.tokenizer.tokenize(batch) for batch in split_v04(phonemes)]
            return np.concatenate([trim(self.infer(batch, voice, len(batch), speed))[0] for batch in ids])
        return self.cached('en/kokoro-onnx-0.4', voice, speed, phonemes, make)

    def japanese(self, text, voice, speed):
        """JLPT: misaki[ja] phonemes through kokoro-onnx 0.6.1, as generate-jlpt-audio.py."""
        converted = self.ja(text)
        phonemes = converted if isinstance(converted, str) else converted[0]
        assert phonemes.strip(), repr(text)
        def make():
            samples, rate = self.kokoro.create(phonemes, voice=voice, speed=speed, is_phonemes=True)
            assert rate == RATE and samples.size > 0
            return samples
        return self.cached('ja/kokoro-onnx-0.6.1', voice, speed, phonemes, make)

    def mandarin(self, text, pinyin, voice):
        """HSK: phonemes from the authored pinyin (generate-hsk-audio.py), one pass, style row = phoneme count."""
        sounds = HSK.phonemes(text, pinyin)
        ids = [self.vocab[c] for c in sounds if c in self.vocab]
        missing = {c for c in sounds if c not in self.vocab and c != ' '}
        assert not missing and ids, (text, missing)
        def make():
            samples = self.infer(ids, voice, len(ids), HSK.SPEED)
            assert samples.size > RATE // 4, text
            return samples
        return self.cached('zh/onnxruntime', voice, HSK.SPEED, sounds, make)


def stage_of(definition, stage_id):
    return next(stage for stage in definition['stages'] if stage['id'] == stage_id)


# ---- IELTS -----------------------------------------------------------------------------------------------------
QUOTES = str.maketrans({'’': "'", '‘': "'", '“': '"', '”': '"'})


def evidence_spans(turns, items, length):
    """Practice spans of IELTS questions: from the first turn after the previous answer's turn (or the start of that
    stretch of dialogue between narration) to the end of the turn that holds the question's evidence quote."""
    norm = lambda text: ' '.join(text.translate(QUOTES).lower().split())
    talk = [turn for turn in turns if not turn['narrator']]
    stretch = []
    for i, turn in enumerate(talk):
        stretch.append(0 if i == 0 else stretch[-1] + (turn['line'] != talk[i - 1]['line'] + 1))
    opening = {}
    for i, number in enumerate(stretch): opening.setdefault(number, i)
    spans, fallbacks, last, last_first = {}, [], None, None
    for question in items:
        quote, begin = norm(question['listening']['script']), last or 0
        found = next((i for i in list(range(begin, len(talk))) + list(range(begin)) if quote in norm(talk[i]['text'])), None)
        if found is None:
            print(f"WARNING {question['id']}: evidence quote not found in the script; its span is the whole part", flush=True)
            spans[question['id']] = {'start': 0.0, 'end': round(length, 3)}
            fallbacks.append(question['id'])
            continue
        if last is not None and last == found: first = last_first
        elif last is not None and last < found and stretch[last] == stretch[found]: first = last + 1
        else: first = opening[stretch[found]]
        spans[question['id']] = {'start': round(talk[first]['start'], 3), 'end': round(talk[found]['end'], 3)}
        last, last_first = found, first
    return spans, fallbacks


def build_ielts(engine, listening, definition):
    stage, voices = stage_of(definition, 'ielts-listening'), listening['suggestedVoices']
    assert listening['slug'] == definition['slug'], 'script file and definition name different mocks'
    parts, questions, fallbacks = [], {}, []
    for part in listening['parts']:
        number, track, turns = part['part'], Track(), []
        for index, line in enumerate(part['lines']):
            if 'pause' in line:
                track.pause(float(line['pause']))
                continue
            speaker = line['speaker']
            narrator = speaker.lower() == 'narrator'
            track.voices[speaker] = voices[speaker]
            start = track.now
            track.add(engine.english(english_speech(line['text']), voices[speaker], IELTS.SPEED))
            turns.append({'line': index, 'text': line['text'], 'narrator': narrator, 'start': start, 'end': track.now})
            track.pause(IELTS.NARRATION_GAP if narrator else IELTS.TURN_GAP)
        items = [q for q in stage['questions'] if q['listening']['part'] == number]
        spans, missed = evidence_spans(turns, items, track.now)
        questions.update({key: dict(span, part=number) for key, span in spans.items()})
        fallbacks += missed
        parts.append({'part': number, 'track': track, 'speed': IELTS.SPEED, 'script': part})
        print(f"{definition['slug']} part {number}: {len(items)} questions, {track.now:.1f} s", flush=True)
    timing = ('Each question from the first turn after the previous answer (or the start of its stretch of dialogue) '
              'to the end of the turn holding its evidence quote')
    return {'slug': definition['slug'], 'stage': stage, 'parts': parts, 'questions': questions,
            'timing': timing + (f'; whole part for {", ".join(fallbacks)}' if fallbacks else '')}


# ---- JLPT ------------------------------------------------------------------------------------------------------
JLPT_KINDS = {'課題理解': 'task', 'ポイント理解': 'points', '発話表現': 'expressions', '即時応答': 'response'}
AFTER_ITEM = {'task': 12, 'points': 12, 'expressions': 8, 'response': 6}  # generate-jlpt-audio.py: mondai 1-2, 3, 4
LABEL = re.compile(r'(ナレーター|男|女)：')


def build_jlpt(engine, definition, level):
    stage, speed, slug = stage_of(definition, 'jlpt-l'), JLPT.SPEED[level], definition['slug']
    parts, questions = [], {}
    for number, group in enumerate(stage['groups'], 1):
        kind = next((kind for prefix, kind in JLPT_KINDS.items() if group['title'].startswith(prefix)), None)
        if kind is None: raise ValueError(f"{slug} {group['id']}: unknown listening task type")
        track = Track()
        def say(text, role='narrator'):
            track.voices[role] = JLPT.VOICES[role]
            track.add(engine.japanese(japanese_speech(text), JLPT.VOICES[role], speed))
        def dialogue(lines):  # as dialogue() in generate-jlpt-audio.py
            for line in lines:
                pieces = LABEL.split(line)
                if pieces[0].strip(): say(pieces[0]); track.pause(.6)
                for i in range(1, len(pieces), 2):
                    say(pieces[i + 1], {'男': 'man', '女': 'woman', 'ナレーター': 'narrator'}[pieces[i]]); track.pause(.55)
        def question_line(line):  # the narrator's question before or after the talk: unlabelled or ナレーター
            return None if re.match(r'\s*(男|女)：', line) else re.sub(r'^\s*ナレーター：', '', line)
        say(f'問題{number}。' + group['instructions']); track.pause(4)
        items = [q for q in stage['questions'] if q['groupId'] == group['id']]
        for q in items:
            if q['listening']['part'] != number: raise ValueError(f"{q['id']}: script part {q['listening']['part']} is not group {number}")
            lines = [line for line in q['listening']['script'].split('\n') if line.strip()]
            start = track.now
            say(f"{int(re.sub(r'[^0-9]', '', q['number']))}番。"); track.pause(1)
            if kind == 'points':  # the question, 8 s to read the options, the talk, the question again
                first, last = question_line(lines[0]), question_line(lines[-1])
                if first is None or last is None or len(lines) < 3: raise ValueError(f"{q['id']}: expected question, talk, question")
                say(first); track.pause(8); dialogue(lines[1:-1]); say(last)
            elif kind == 'task':  # 8 s to look at the options, the scene and talk, the question again
                last = question_line(lines[-1])
                if last is None or len(lines) < 2: raise ValueError(f"{q['id']}: expected the talk, then the question")
                track.pause(8); dialogue(lines[:-1]); say(last)
            else:  # the scene or remark and three spoken answers
                dialogue(lines)
            questions[q['id']] = {'start': round(start, 3), 'end': round(track.now, 3), 'part': number}
            track.pause(AFTER_ITEM[kind])
        say(f'問題{number}は、これで終わりです。'); track.pause(8)
        parts.append({'part': number, 'track': track, 'speed': speed, 'script': {'group': group, 'questions': [
            {'id': q['id'], 'number': q['number'], 'listening': q['listening']} for q in items]}})
        print(f'{slug} part {number}: {len(items)} items, {track.now:.1f} s', flush=True)
    return {'slug': slug, 'stage': stage, 'parts': parts, 'questions': questions,
            'timing': 'Each item from its number to the end of its closing question or last spoken answer'}


# ---- HSK 1 -----------------------------------------------------------------------------------------------------
def hsk_item(question, part):
    """A free-pack item in the paid pack's shape, so that readings() of generate-hsk-audio.py voices it."""
    lines = [line.strip() for line in question['listening']['script'].split('\n') if line.strip()]
    pairs = list(zip(lines[0::2], lines[1::2]))
    expected = {1: 1, 2: 1, 4: 2}.get(part)
    if len(lines) % 2 or (expected and len(pairs) != expected):
        raise ValueError(f"{question['id']}: expected {expected or 'pairs of'} Chinese and pinyin lines")
    if part == 1: return {'phrase': pairs[0][0], 'pinyin': pairs[0][1]}
    if part == 2: return {'sentence': pairs[0][0], 'pinyin': pairs[0][1]}
    if part == 3:
        turns = [(re.match(r'(男|女)：(.+)', text), pinyin) for text, pinyin in pairs]
        if not all(match for match, _ in turns): raise ValueError(f"{question['id']}: every turn needs 男： or 女：")
        return {'dialogue': [{'speaker': match.group(1), 'text': match.group(2), 'pinyin': pinyin} for match, pinyin in turns]}
    (statement, statement_pinyin), (asked, asked_pinyin) = pairs
    return {'statement': statement, 'statementPinyin': statement_pinyin, 'question': asked.removeprefix('问：'),
            'questionPinyin': re.sub(r'^W[eè]n\s*:\s*', '', asked_pinyin)}


def check_example(group, example, part):
    """The worked example printed in the free pack must be the one the recording reads."""
    printed = group.get('hsk', {}).get('example', {})
    if part == 4: same = [c['text'] for c in printed.get('choices', [])] == [o['text'] for o in example['options']]
    else:
        names = {Path(p['image']).name for p in example.get('options') or example.get('pictures') or [example]}
        same = bool(printed.get('pictures')) and all(Path(p['src']).name in names for p in printed['pictures'])
    if not same or printed.get('answer') != example['answer']:
        raise ValueError(f"{group['id']}: the printed worked example is not the shared HSK example the recording reads")


def count(n):
    """'n 个' in characters and pinyin: yí gè, liǎng gè, sān gè ..."""
    return {1: ('一', 'yí'), 2: ('两', 'liǎng')}.get(n, (HSK.number_han(n), HSK.number_pinyin(n)))


def build_hsk(engine, definition, examples):
    stage, slug = stage_of(definition, 'hsk-l'), definition['slug']
    parts, questions, groups = [], {}, stage['groups']
    for part, group in enumerate(groups, 1):
        if group['instructions'].split('\n')[0] != HSK.PART_TASKS[part][0]:
            raise ValueError(f"{group['id']}: its task is not the one of HSK 1 listening part {part}")
        example, items, track = examples[f'part{part}'], [q for q in stage['questions'] if q['groupId'] == group['id']], Track()
        check_example(group, example, part)
        def speak(turns, gap_after):  # as speak() in generate-hsk-audio.py
            for i, (text, pinyin, role) in enumerate(turns):
                track.voices[role] = HSK.VOICES[role]
                track.add(engine.mandarin(text, pinyin, HSK.VOICES[role]))
                track.pause(0.55 if i < len(turns) - 1 else gap_after)
        if part == 1:
            speak([('汉语水平考试一级模拟考试。听力考试现在开始。', 'Hànyǔ Shuǐpíng Kǎoshì yī jí mónǐ kǎoshì. Tīnglì kǎoshì xiànzài kāishǐ.', 'narrator')], 2.0)
        han, pinyin = count(len(items))
        speak([(f'第{HSK.PART_NAMES[part - 1]}部分，一共{han}个题，每题听两次。', f'Dì {HSK.number_pinyin(part)} bùfen, yígòng {pinyin} gè tí, měi tí tīng liǎng cì.', 'narrator'),
               HSK.PART_TASKS[part] + ('narrator',)], 1.5)
        example_turns = HSK.readings(example, part, 0)
        speak([('例如：', 'Lìrú:', 'narrator')], 0.6)
        speak(example_turns, 2.5)
        speak(example_turns, 3.0)
        for index, q in enumerate(items):
            if q['listening']['part'] != part: raise ValueError(f"{q['id']}: script part {q['listening']['part']} is not part {part}")
            n, start = int(q['number']), track.now
            speak([(f'第{HSK.number_han(n)}题。', f'Dì {HSK.number_pinyin(n)} tí.', 'narrator')], 0.8)
            turns = HSK.readings(hsk_item(q, part), part, index)
            speak(turns, HSK.FIRST_GAP)
            speak(turns, 0.01)
            questions[q['id']] = {'start': round(start, 3), 'end': round(track.now, 3), 'part': part}
            track.pause(HSK.SECOND_GAP)
        if part == len(groups):
            speak([('听力考试现在结束。', 'Tīnglì kǎoshì xiànzài jiéshù.', 'narrator')], 2.0)
        parts.append({'part': part, 'track': track, 'speed': HSK.SPEED, 'script': {'group': group, 'example': example, 'questions': [
            {'id': q['id'], 'number': q['number'], 'listening': q['listening']} for q in items]}})
        print(f'{slug} part {part}: {len(items)} items, {track.now:.1f} s', flush=True)
    return {'slug': slug, 'stage': stage, 'parts': parts, 'questions': questions,
            'timing': 'Each item from its number to the end of its second reading'}


# ---- output ----------------------------------------------------------------------------------------------------
def encode(samples, path):
    """As the paid generators: peak to 0.89, 16-bit PCM, then MP3 48 kbps mono; returns ffprobe's length."""
    peak = max(float(np.max(np.abs(samples))), .001)
    pcm = (np.clip(samples / peak * .89, -1, 1) * 32767).astype('<i2').tobytes()
    partial = path.with_name(path.stem + '.partial.mp3')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-',
                    '-b:a', '48k', '-ac', '1', str(partial)], input=pcm, check=True)
    os.replace(partial, path)
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of',
                                          'default=noprint_wrappers=1:nokey=1', str(path)], text=True))


def main():
    for stream in (sys.stdout, sys.stderr): stream.reconfigure(encoding='utf-8', errors='backslashreplace')
    model_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'artifacts' / 'speaking-voice-cache' / 'onnx-community' / 'Kokoro-82M-v1.0-ONNX'
    raw = {name: path.read_bytes() for name, path in PACKS.items()}
    data = {name: json.loads(body.decode('utf-8')) for name, body in raw.items()}
    print(f'utterance cache: {CACHE}', flush=True)
    engine = Engine(model_dir)
    mocks = [build_ielts(engine, data['ielts-listening'], data['ielts']), build_jlpt(engine, data['jlpt-n5'], 'N5'),
             build_jlpt(engine, data['jlpt-n4'], 'N4'), build_hsk(engine, data['hsk'], data['hsk-examples']['examples']['listening'])]
    print(f'{engine.made} utterances synthesized, {engine.loaded} read from the cache', flush=True)

    problems = []
    for mock in mocks:
        ids, seconds = [q['id'] for q in mock['stage']['questions']], mock['stage']['seconds']
        if sorted(ids) != sorted(mock['questions']):
            problems.append(f"{mock['slug']}: timed {sorted(mock['questions'])} but the stage has {ids}")
        mock['questions'] = {key: mock['questions'][key] for key in ids if key in mock['questions']}
        total = sum(part['track'].size for part in mock['parts']) / RATE
        if total > seconds - MIN_SPARE:
            problems.append(f"{mock['slug']}: the recording lasts {total:.1f} s, leaving {seconds - total:.1f} s of the {seconds}-s "
                            f"stage '{mock['stage']['id']}'; a {math.ceil((total + MIN_SPARE) / 60) * 60}-s stage would leave a minute to check")
    if problems:
        print('Nothing written:\n' + '\n'.join(problems), flush=True)
        sys.exit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    previous = json.loads(MANIFEST.read_text(encoding='utf-8')).get('tracks', {}) if MANIFEST.exists() else {}
    today, tracks, summary, catalog = datetime.date.today().isoformat(), {}, {}, {}
    for mock in mocks:
        lengths = []
        for part in mock['parts']:
            name = f"{mock['slug']}-part-{part['part']}.mp3"
            seconds = round(encode(np.concatenate(part['track'].chunks), OUT / name), 3)
            body = (OUT / name).read_bytes()
            digest, old = sha256(body), previous.get(name, {})
            tracks[name] = {'slug': mock['slug'], 'part': part['part'], 'seconds': seconds, 'bytes': len(body), 'sha256': digest,
                            'scriptSha256': sha256(canonical(part['script']).encode()), 'voices': part['track'].voices,
                            'speed': part['speed'], 'generator': GENERATOR,
                            'date': old['date'] if old.get('sha256') == digest and old.get('date') else today}
            lengths.append(seconds)
            print(f'FINISHED {name}: {seconds:.1f}s', flush=True)
        stage = mock['stage']
        summary[mock['slug']] = {'stage': stage['id'], 'stageSeconds': stage['seconds'], 'audioSeconds': round(sum(lengths), 3),
                                 'checkSeconds': round(stage['seconds'] - sum(lengths), 3), 'questionTiming': mock['timing']}
        catalog[mock['slug']] = {'seconds': lengths, 'questions': mock['questions']}
    for stale in OUT.glob('*-part-*.mp3'):
        if stale.name not in tracks and any(stale.name.startswith(mock['slug'] + '-part-') for mock in mocks):
            stale.unlink(); print(f'removed {stale.name}', flush=True)
    manifest = {
        'generator': GENERATOR,
        'source': 'Original synthetic practice audio for the free half-length mocks; Kokoro-82M v1.0, Apache-2.0',
        'modelUrl': 'https://huggingface.co/hexgrad/Kokoro-82M', 'model': engine.model,
        'voiceTables': 'node_modules/kokoro-js/voices/<voice>.bin',
        'packs': {path.relative_to(ROOT).as_posix(): sha256(raw[name]) for name, path in PACKS.items()},
        'delivery': {
            'ielts-academic-free': 'One pace (1.0); 0.45 s after a turn, 1.0 s after narration; the script file\'s pause rows; '
                                   'spelled names read letter by letter, "in 1987" as a year.',
            'jlpt': 'Per mondai: 問題n and its instructions; per item n番, an 8-s preview (task, key points), the talk and question, '
                    'then 12/12/8/6 s to answer; kana readings for 何を/何が/何で/何時/n時/曜日/誕生日.',
            'hsk1-free': 'Per part: task, worked example read twice; every item twice, 5 s after the first reading, 10 s after the second.'},
        'mocks': summary, 'tracks': tracks, 'humanListeningReview': False}
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8', newline='\n')
    for slug, row in summary.items():
        print(f"{slug}: {' + '.join(f'{s:.1f}' for s in catalog[slug]['seconds'])} = {row['audioSeconds']:.1f} s of the "
              f"{row['stageSeconds']}-s stage, {row['checkSeconds']:.1f} s left to check", flush=True)


if __name__ == '__main__':
    main()
