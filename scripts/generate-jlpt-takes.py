r"""Kokoro woman/man takes for the JLPT forms recorded only as audio revision 2 (N5 and N4 forms 04-06).

scripts/generate-jlpt-audio-v2.py reads every woman and man line from revision 1's Kokoro utterance cache
(<system temp>/codex-jlpt-utterances-v1), which scripts/generate-jlpt-audio.py filled for forms 01-03. Forms 04-06
never had a revision 1, so this script makes their takes the same way (misaki[ja] phonemes, kokoro-onnx 0.6.1,
jf_tebukuro / jm_kumo, speed N5 0.9 and N4 1.0) and saves each under the key generate-jlpt-audio-v2.py looks up
(the authored line, role and speed). Forms 01-03 and any take already in the cache from revision 1 are never touched.

Speech-only kana (READINGS) fix words misaki[ja] reads wrongly, like generate-free-audio.py's JA_READINGS; the pack
text is not changed. `--review` prints every kanji and number reading misaki will use, without synthesizing.

Setup: the Python 3.12 environment of scripts/generate-free-audio.py (misaki[ja] 0.7.4, kokoro-onnx 0.6.1,
onnxruntime 1.31.1), the Speaking Lab's cached onnx-community/Kokoro-82M-v1.0-ONNX and kokoro-js's voice tables.
Run from the repo root (PowerShell):
  & "$env:TEMP/education-free-audio-py312/Scripts/python.exe" -I scripts/generate-jlpt-takes.py [--review]
Then run scripts/generate-jlpt-audio-v2.py.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import unicodedata

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro
from misaki import ja

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / 'artifacts' / 'speaking-voice-cache' / 'onnx-community' / 'Kokoro-82M-v1.0-ONNX' / 'onnx' / 'model.onnx'
VOICE_TABLES = ROOT / 'node_modules' / 'kokoro-js' / 'voices'
CACHE = Path(tempfile.gettempdir()) / 'codex-jlpt-utterances-v1'
INDEX = CACHE / 'revision-2-takes.json'  # key -> phonemes of the takes this script made, so a reading fix remakes them
VOICES = {'woman': 'jf_tebukuro', 'man': 'jm_kumo'}
SPEED = {'N5': 0.9, 'N4': 1.0}
FORMS = [4, 5, 6]
RATE = 24000

HOURS = 'れい いち に さん よ ご ろく しち はち く じゅう じゅういち じゅうに'.split()
WEEKDAYS = dict(zip('日月火水木金土何', ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど', 'なん']))
DIGITS = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう']
MINUTES = {1: 'いっぷん', 2: 'にふん', 3: 'さんぷん', 4: 'よんぷん', 5: 'ごふん', 6: 'ろっぷん', 7: 'ななふん', 8: 'はっぷん', 9: 'きゅうふん', 0: 'じゅっぷん'}
HUNDREDS = {1: 'ひゃく', 2: 'にひゃく', 3: 'さんびゃく', 4: 'よんひゃく', 5: 'ごひゃく', 6: 'ろっぴゃく', 7: 'ななひゃく', 8: 'はっぴゃく', 9: 'きゅうひゃく'}
THOUSANDS = {1: 'せん', 2: 'にせん', 3: 'さんぜん', 4: 'よんせん', 5: 'ごせん', 6: 'ろくせん', 7: 'ななせん', 8: 'はっせん', 9: 'きゅうせん'}


def tens(n):
    t, o = divmod(n, 10)
    return ('' if t == 0 else 'じゅう' if t == 1 else DIGITS[t] + 'じゅう') + DIGITS[o]


def minutes(n):
    t, o = divmod(n, 10)
    return (('' if t == 1 else DIGITS[t]) + MINUTES[0] if o == 0 else tens(n - o) + MINUTES[o]) if n >= 10 else MINUTES[o]


def yen(n):
    """1-99,999 as said before 円."""
    man, rest = divmod(n, 10000)
    th, rest = divmod(rest, 1000)
    hu, rest = divmod(rest, 100)
    return (tens(man) + 'まん' if man else '') + THOUSANDS.get(th, '') + HUNDREDS.get(hu, '') + tens(rest)


# Kana for what misaki[ja] (unidic-lite) reads wrongly in these scripts. Order matters: longer patterns first.
READINGS = (
    (r'何時', 'なんじ'), (r'何を', 'なにを'), (r'何が', 'なにが'), (r'何で(?!す)', 'なにで'), (r'何人', 'なんにん'),
    (r'([0-9]+)時半', lambda m: HOURS[int(m.group(1))] + 'じはん'),
    (r'(?<![0-9])(1[0-2]|[0-9])時', lambda m: HOURS[int(m.group(1))] + 'じ'),
    (r'([0-9]+)分', lambda m: minutes(int(m.group(1)))),
    (r'([0-9]+)万円', lambda m: tens(int(m.group(1))) + 'まんえん'),
    (r'([0-9]+)千円', lambda m: THOUSANDS[int(m.group(1))] + 'えん'),
    (r'([0-9]+)千([0-9]+)百円', lambda m: THOUSANDS[int(m.group(1))] + HUNDREDS[int(m.group(2))] + 'えん'),
    (r'([0-9]+)百円', lambda m: HUNDREDS[int(m.group(1))] + 'えん'),
    (r'([0-9][0-9,]*)円', lambda m: yen(int(m.group(1).replace(',', ''))) + 'えん'),
    (r'([日月火水木金土何])曜日', lambda m: WEEKDAYS[m.group(1)] + 'ようび'), (r'誕生日', 'たんじょうび'),
    # N5 writes counters in kana after a digit (6じ, 20ぷん, 3つ); misaki turns the digit into a kanji numeral and
    # may read 2 as the particle に, so every digit is spoken from these rules and none may be left (see speech()).
    (r'([0-9]+)じはん', lambda m: HOURS[int(m.group(1))] + 'じはん'),
    (r'(?<![0-9])(1[0-2]|[0-9])じ', lambda m: HOURS[int(m.group(1))] + 'じ'),
    (r'([0-9]+)(?:ぷん|ふん)', lambda m: minutes(int(m.group(1)))),
    (r'([0-9]+)にん', lambda m: {1: 'ひとり', 2: 'ふたり', 4: 'よにん'}.get(int(m.group(1))) or tens(int(m.group(1))) + 'にん'),
    (r'([0-9][0-9,]*)えん', lambda m: yen(int(m.group(1).replace(',', ''))) + 'えん'),
    (r'(?<![0-9])([1-9]|10)つ', lambda m: 'ひと ふた みっ よっ いつ むっ なな やっ ここの とお'.split()[int(m.group(1)) - 1] + ('つ' if m.group(1) != '10' else '')),
    (r'(?<![0-9])([1-9]|10)(?:かい|がい)', lambda m: 'いっかい にかい さんがい よんかい ごかい ろっかい ななかい はっかい きゅうかい じゅっかい'.split()[int(m.group(1)) - 1]),
    (r'(?<![0-9])([1-9]|10)こ', lambda m: 'いっこ にこ さんこ よんこ ごこ ろっこ ななこ はっこ きゅうこ じゅっこ'.split()[int(m.group(1)) - 1]),
    (r'何か', 'なにか'), (r'何に', 'なにに'), (r'会員の 方', '会員の かた'), (r'(?<![一二三四五六七八九十0-9])階', 'かい'),
)
# Kanji words misaki[ja] reads wrongly in forms 04-06 (from the --review listing): 一日 as ついたち, 箱 as ばこ,
# 重そう as じゅうそう, counters without their sound change (一泊 いちはく, 一匹 いちひき, 三泊四日 さんはくしか).
WORDS = {
    '三泊四日': 'さんぱくよっか', '一泊': 'いっぱく', '一匹': 'いっぴき', '一週間': 'いっしゅうかん', '一日': 'いちにち',
    '五十回目': 'ごじゅっかいめ', '箱': 'はこ', '重そう': 'おもそう', '日本': 'にほん',
}


def kokoro_text(text):
    """The authored line as generate-jlpt-audio-v2.py keys its Kokoro takes (revision 1's speech text)."""
    text = re.sub(r'[㐀-鿿]+（([ぁ-ゖァ-ヺー]+)）', r'\1', text)
    return unicodedata.normalize('NFKC', text).replace('・', '、')


def speech(text):
    text = kokoro_text(text)
    for pattern, kana in READINGS:
        text = re.sub(pattern, kana, text)
    for word, kana in WORDS.items():
        text = text.replace(word, kana)
    assert not re.search(r'[0-9]', text), f'add a reading rule for the number in: {text}'
    return text


def take_key(text, role, level):
    return hashlib.sha256(json.dumps([kokoro_text(text), role, SPEED[level]], ensure_ascii=False).encode()).hexdigest()


def lines():
    """Every woman/man line of the new forms, split exactly as generate-jlpt-audio-v2.py's dialogue() splits it."""
    seen = {}
    for level in ['N5', 'N4']:
        for number in FORMS:
            source = json.loads((ROOT / 'MockExmps' / 'JLPT' / level / f'mock-{number:02}' / 'mock.json').read_text(encoding='utf-8'))
            for group in source['sections'][2]['groups']:
                for q in group['questions']:
                    text = q['script'] if group['type'] in ('task-comprehension', 'key-points') else q['examinerReadout']
                    for line in text.splitlines():
                        pieces = re.split(r'(ナレーター|男|女)：', line)
                        for i in range(1, len(pieces), 2):
                            role = {'男': 'man', '女': 'woman'}.get(pieces[i])
                            if role:
                                seen.setdefault(take_key(pieces[i + 1], role, level), (pieces[i + 1], role, level, q['id']))
    return seen


def main():
    sys.stdout.reconfigure(encoding='utf-8')  # -I ignores PYTHONIOENCODING
    g2p = ja.JAG2P()
    todo = lines()
    if '--review' in sys.argv:
        found = {}
        for text, role, level, qid in todo.values():
            spoken = speech(text)
            for word in g2p.tagger(g2p._normalize_text(spoken)):
                if re.search(r'[㐀-鿿0-9０-９]', word.surface):
                    reading = word.feature.pron or word.feature.kana or '?'
                    found.setdefault((word.surface, reading), []).append(qid)
        for (surface, reading), ids in sorted(found.items()):
            print(f'{surface}\t{reading}\t{len(ids)}\t{ids[0]}')
        print(f'{len(todo)} lines, {len(found)} kanji/number readings', file=sys.stderr)
        return
    options = ort.SessionOptions(); options.intra_op_num_threads = 4; options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(MODEL), sess_options=options, providers=['CPUExecutionProvider'])
    voices = Path(tempfile.gettempdir()) / 'jlpt-takes-voices.npz'
    np.savez(voices, **{name: np.fromfile(VOICE_TABLES / f'{name}.bin', dtype=np.float32).reshape(-1, 1, 256) for name in VOICES.values()})
    kokoro = Kokoro.from_session(session, str(voices))
    made = json.loads(INDEX.read_text(encoding='utf-8')) if INDEX.exists() else {}
    counts = {'made': 0, 'kept': 0, 'revision1': 0}
    for key, (text, role, level, _qid) in todo.items():
        converted = g2p(speech(text))
        phonemes = converted if isinstance(converted, str) else converted[0]
        assert phonemes.strip(), repr(text)
        path = CACHE / f'{key}.npy'
        if path.exists() and key not in made:
            counts['revision1'] += 1  # the same line, role and speed was recorded for forms 01-03
            continue
        if path.exists() and made[key] == phonemes:
            counts['kept'] += 1
            continue
        samples, rate = kokoro.create(phonemes, voice=VOICES[role], speed=SPEED[level], is_phonemes=True)
        assert rate == RATE and samples.size > 0
        partial = CACHE / f'{key}.{os.getpid()}.partial.npy'
        np.save(partial, samples.astype(np.float32)); os.replace(partial, path)
        made[key] = phonemes
        counts['made'] += 1
    INDEX.write_text(json.dumps(made, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(todo)} lines: {counts}')


if __name__ == '__main__':
    main()
