"""Validate authored TOPIK forms against the official structure (structure.py) and the pack's own rules.

usage: python validate.py [path/to/mock.json ...]     (no argument: every topik-*/mock-*.json in the pack)
Exit code 1 when any error is found. Warnings do not fail.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from structure import LEVELS, blocks, question_spec  # noqa: E402

PACK = Path(__file__).resolve().parents[1]
CIRCLED = ['㉠', '㉡', '㉢', '㉣']
ORDER_LABELS = ['(가)', '(나)', '(다)', '(라)']
SPEAKERS = {'남자', '여자'}
HANGUL = re.compile(r'[가-힣]')
CYRILLIC = re.compile(r'[А-Яа-яЁёӨөҮү]')
CHART_TYPES = {'bar', 'hbar', 'line', 'pie', 'table'}
DOC_KINDS = {'notice', 'ticket', 'memo', 'message', 'email', 'ad', 'menu', 'schedule', 'poster', 'receipt', 'card', 'sign'}


def chars(text: str) -> int:
    """Characters as TOPIK counts them on manuscript paper: every character including spaces, no line breaks."""
    return len(text.replace('\r', '').replace('\n', ''))


class Report:
    def __init__(self, name):
        self.name, self.errors, self.warnings = name, [], []

    def err(self, where, msg):
        self.errors.append(f'{where}: {msg}')

    def warn(self, where, msg):
        self.warnings.append(f'{where}: {msg}')


def check_chart(r, where, chart):
    if not isinstance(chart, dict) or chart.get('type') not in CHART_TYPES:
        return r.err(where, f'chart needs type in {sorted(CHART_TYPES)}')
    if not HANGUL.search(chart.get('title', '')):
        r.err(where, 'chart needs a Korean title')
    labels, series = chart.get('labels'), chart.get('series')
    if not isinstance(labels, list) or not (2 <= len(labels) <= 8) or not all(isinstance(x, str) and x for x in labels):
        r.err(where, 'chart labels: 2-8 strings')
        return
    if not isinstance(series, list) or not (1 <= len(series) <= 3):
        r.err(where, 'chart series: 1-3 entries')
        return
    for s in series:
        values = s.get('values') if isinstance(s, dict) else None
        if not isinstance(values, list) or len(values) != len(labels) or not all(isinstance(v, (int, float)) for v in values):
            r.err(where, 'each series needs one number per label')
        if len(series) > 1 and not s.get('name'):
            r.err(where, 'several series need names')
    if chart['type'] == 'pie' and len(series) == 1 and abs(sum(series[0]['values']) - 100) > 0.6 and chart.get('unit') == '%':
        r.err(where, 'a percentage pie must add up to 100')


def check_doc(r, where, doc):
    if not isinstance(doc, dict) or doc.get('kind') not in DOC_KINDS:
        return r.err(where, f'doc.kind must be one of {sorted(DOC_KINDS)}')
    lines = doc.get('lines')
    if not isinstance(lines, list) or not lines or not all(isinstance(x, str) for x in lines):
        r.err(where, 'doc.lines: a list of strings')
    if not HANGUL.search(json.dumps(doc, ensure_ascii=False)):
        r.err(where, 'doc has no Korean text')


def check_script(r, where, script, one_speaker=False):
    if not isinstance(script, list) or not script:
        return r.err(where, 'script: a list of turns')
    for i, turn in enumerate(script):
        if not isinstance(turn, dict) or turn.get('speaker') not in SPEAKERS or not isinstance(turn.get('text'), str) or not turn['text'].strip():
            r.err(where, f'turn {i + 1}: needs speaker 남자/여자 and text')
            continue
        text = turn['text']
        if re.search(r'[0-9]', text):
            r.err(where, f'turn {i + 1}: write numbers as spoken Hangul, no digits: {text[:40]}')
        if re.search(r'[A-Za-z]', text):
            r.err(where, f'turn {i + 1}: no Latin letters in a script (the voice reads Hangul): {text[:40]}')
        if re.search(r'[()\[\]【】㉠㉡㉢㉣]', text):
            r.err(where, f'turn {i + 1}: no brackets or markers in spoken text')
    if one_speaker and len({t.get('speaker') for t in script}) != 1:
        r.err(where, 'this task is one speaker')


def check_choice(r, where, q, spec):
    opts = q.get('options')
    if not isinstance(opts, list) or len(opts) != 4 or not all(isinstance(o, str) and o.strip() for o in opts):
        return r.err(where, 'options: four non-empty strings')
    if len(set(o.strip() for o in opts)) != 4:
        r.err(where, 'options must differ')
    if any(re.match(r'^\s*[①②③④1-4][.)]?\s', o) for o in opts):
        r.err(where, 'do not number the options yourself')


def check_question(r, level, section, where, q, block, spec):
    n = q.get('number')
    # printed question line
    if 'prompt' in spec:
        if q.get('prompt') != spec['prompt']:
            r.err(where, f'prompt must be exactly: {spec["prompt"]}')
    elif 'pattern' in spec:
        if not isinstance(q.get('prompt'), str) or not re.fullmatch(spec['pattern'], q['prompt']):
            r.err(where, f'prompt must match /{spec["pattern"]}/')
    elif q.get('prompt'):
        r.err(where, 'this block prints no question line; leave prompt out')
    task = spec.get('task', block['task'])
    if section == 'writing':
        return
    expl = q.get('explanation', '')
    if not isinstance(expl, str) or len(expl) < 25 or not CYRILLIC.search(expl):
        r.err(where, 'explanation: Mongolian (Cyrillic), at least one full sentence')
    ans = q.get('answer')
    if ans not in (1, 2, 3, 4):
        r.err(where, 'answer: 1-4')
    if task in ('picture',):
        pics = q.get('pictures')
        if not isinstance(pics, list) or len(pics) != 4 or not all(isinstance(p, dict) and len(p.get('scene', '')) >= 40 for p in pics):
            r.err(where, 'pictures: four {scene} descriptions of at least 40 characters')
        if 'options' in q:
            r.err(where, 'a picture item has no text options')
        return
    if task == 'graph' and section == 'listening':
        charts = q.get('charts')
        if not isinstance(charts, list) or len(charts) != 4:
            r.err(where, 'charts: four chart specs')
        else:
            for i, c in enumerate(charts):
                check_chart(r, f'{where} chart {i + 1}', c)
        return
    check_choice(r, where, q, spec)
    opts = q.get('options') or []
    if level == 'I' and section == 'listening' and task == 'yes-no' and len(opts) == 4:
        yes = sum(o.startswith('네') for o in opts)
        no = sum(o.startswith('아니요') for o in opts)
        if (yes, no) != (2, 2):
            r.err(where, 'yes/no item: two options start with 네, and two with 아니요,')
    if task in ('place', 'topic') and section == 'listening' and level == 'I' or (level == 'I' and section == 'reading' and block['task'] == 'topic'):
        if any(' ' in o.strip() for o in opts):
            r.warn(where, 'place/topic options are single nouns on the paper')
    if task == 'insert' and opts != CIRCLED:
        r.err(where, f'insert options are exactly {CIRCLED}')
    if task == 'order':
        for o in opts:
            if not re.fullmatch(r'\((가|나|다|라)\)(-\((가|나|다|라)\)){3}', o) or len(set(re.findall(r'\((.)\)', o))) != 4:
                r.err(where, f'order option format (가)-(다)-(라)-(나): {o}')
    if task == 'insert' and not isinstance(q.get('sentence'), str):
        r.err(where, 'insert item needs the given sentence in "sentence"')


def check_set(r, level, section, s, idx):
    nums = s.get('numbers')
    where = f'{section} set {nums}'
    qs = s.get('questions')
    if not isinstance(qs, list) or not qs or [q.get('number') for q in qs] != nums:
        r.err(where, 'questions must list the set numbers in order')
        return []
    block, _ = question_spec(level, section, nums[0])
    if block.get('set'):
        if nums != list(range(block['from'], block['to'] + 1)):
            r.err(where, f'block [{block["from"]}~{block["to"]}] is one set')
    elif len(nums) != 1:
        r.err(where, 'this block has one material per question: one number per set')
    task = block['task']
    if section == 'listening':
        one = (task in ('answer', 'continue') or (level == 'I' and task == 'announcement') or block.get('kind') == 'monologue'
               or (level == 'II' and nums[0] in (3, 14, 15)))
        check_script(r, where, s.get('script'), one_speaker=one)
        script_text = ' '.join(t.get('text', '') for t in s.get('script') or [] if isinstance(t, dict))
        size = len(script_text)
        lo, hi = {('I', 'answer'): (4, 40), ('I', 'continue'): (4, 40)}.get((level, task), (12, 2000))
        if not lo <= size <= hi:
            r.err(where, f'script length {size} outside {lo}-{hi}')
        if level == 'II' and nums[0] >= 31 and size < 330:
            r.warn(where, f'script only {size} characters; official 31-50 talks are about 400-700')
        if level == 'I' and nums[0] >= 25 and size < 150:
            r.warn(where, f'script only {size} characters for a two-question set')
    elif section == 'reading':
        material = [k for k in ('passage', 'doc', 'chart') if k in s]
        if not material:
            r.err(where, 'reading set needs passage, doc or chart')
        if 'doc' in s:
            check_doc(r, where, s['doc'])
        if 'chart' in s:
            check_chart(r, where, s['chart'])
        text = s.get('passage', '') if isinstance(s.get('passage'), str) else ''
        spec_tasks = {question_spec(level, section, n)[1].get('task', task) for n in nums}
        if task in ('doc-not',) or (level == 'I' and nums == [63, 64]) or (level == 'II' and nums[0] in (5, 6, 7, 8, 9)):
            if 'doc' not in s:
                r.err(where, 'this item reads a document: give "doc"')
        if level == 'II' and nums[0] == 10 and 'chart' not in s:
            r.err(where, 'item 10 reads a graph: give "chart"')
        if 'blank' in spec_tasks and nums[0] >= 49 and level == 'I' and '㉠' not in text:
            r.err(where, 'blank item: mark ( ㉠ ) in the passage')
        if level == 'I' and task == 'blank' and '(    )' not in text:
            r.err(where, 'blank item: mark (    ) (four spaces) in the passage')
        if level == 'II' and task in ('blank-grammar', 'blank-content') and '(    )' not in text:
            r.err(where, 'blank item: mark (    ) (four spaces) in the passage')
        if level == 'II' and nums[0] in (19, 21, 28, 29, 30, 31, 44, 48, 16, 17, 18) and '(    )' not in text:
            r.err(where, 'blank item: mark (    ) (four spaces) in the passage')
        if 'insert' in spec_tasks or task == 'insert':
            for c in CIRCLED:
                if text.count(f'( {c} )') != 1:
                    r.err(where, f'insert passage: ( {c} ) exactly once')
        if task == 'order':
            for label in ORDER_LABELS:
                if text.count(label) != 1:
                    r.err(where, f'order passage: {label} exactly once')
        if (level == 'II' and (task == 'similar' or nums[0] in (23, 42, 48))) and not re.search(r'【[^】]+】', text):
            r.err(where, 'underlined part: mark it with 【 】 in the passage')
        if level == 'II' and task == 'headline' and len(text) > 60:
            r.warn(where, 'a headline is one short line')
    elif section == 'writing':
        w = s.get('writing')
        n = nums[0]
        if not isinstance(w, dict):
            r.err(where, 'writing set needs "writing"')
        elif n in (51, 52):
            text = s.get('passage') or json.dumps(s.get('doc', {}), ensure_ascii=False)
            for c in CIRCLED[:2]:
                if f'( {c} )' not in text:
                    r.err(where, f'mark ( {c} ) in the text')
            if n == 51 and 'doc' not in s:
                r.err(where, '51 is a practical text: give "doc"')
            if n == 52 and 'passage' not in s:
                r.err(where, '52 is an explanatory paragraph: give "passage"')
            models = w.get('models', {})
            for c in CIRCLED[:2]:
                if not isinstance(models.get(c), list) or not models[c]:
                    r.err(where, f'models.{c}: one or more model sentences')
        elif n == 53:
            if not w.get('topic') or not isinstance(w.get('charts'), list) or not w['charts']:
                r.err(where, '53 needs topic and charts')
            for i, c in enumerate(w.get('charts') or []):
                check_chart(r, f'{where} chart {i + 1}', c)
            m = w.get('model', '')
            if not 200 <= chars(m) <= 300:
                r.err(where, f'53 model answer is {chars(m)} characters (200-300)')
        elif n == 54:
            if not w.get('prompt') or not isinstance(w.get('bullets'), list) or len(w['bullets']) != 3:
                r.err(where, '54 needs prompt and three bullets')
            m = w.get('model', '')
            if not 600 <= chars(m) <= 700:
                r.err(where, f'54 model answer is {chars(m)} characters (600-700)')
        if isinstance(w, dict) and (not isinstance(w.get('rubric'), str) or not CYRILLIC.search(w.get('rubric', ''))):
            r.err(where, 'writing.rubric: Mongolian scoring notes')
    for q in qs:
        n = q.get('number')
        try:
            blk, spec = question_spec(level, section, n)
        except KeyError:
            r.err(where, f'unknown number {n}')
            continue
        check_question(r, level, section, f'{section} {n}', q, blk, spec)
    return qs


def validate(path: Path) -> Report:
    form = json.loads(path.read_text(encoding='utf-8'))
    r = Report(path.relative_to(PACK).as_posix())
    level = form.get('level')
    if level not in LEVELS:
        r.err('form', 'level must be "I" or "II"')
        return r
    if not re.fullmatch(rf'topik-{level.lower()}-0[1-3]', form.get('id', '')):
        r.err('form', f'id must be topik-{level.lower()}-0N')
    for key in ('theme', 'themeMn'):
        if not isinstance(form.get(key), str) or not form[key].strip():
            r.err('form', f'{key} missing')
    data = LEVELS[level]
    for section, count in data['counts'].items():
        sets = form.get(section)
        if not isinstance(sets, list):
            r.err(section, 'missing section')
            continue
        questions = []
        for i, s in enumerate(sets):
            questions += check_set(r, level, section, s, i)
        numbers = [q.get('number') for q in questions]
        lo, hi = data['numbering'][section]
        if numbers != list(range(lo, hi + 1)):
            r.err(section, f'numbers must run {lo}-{hi} once each in order')
        if section == 'writing':
            continue
        answers = [q.get('answer') for q in questions]
        counts = Counter(answers)
        share = len(answers) / 4
        for k in (1, 2, 3, 4):
            if abs(counts.get(k, 0) - share) > max(2, share * 0.25):
                r.err(section, f'answer {k} is used {counts.get(k, 0)} times; keep each position near {share:.1f}')
        run = 1
        for a, b in zip(answers, answers[1:]):
            run = run + 1 if a == b else 1
            if run > 3:
                r.err(section, 'more than three equal answers in a row')
                break
    extra = set(form) - {'id', 'level', 'number', 'theme', 'themeMn', 'listening', 'reading', 'writing', 'notes'}
    if extra:
        r.warn('form', f'unknown keys {sorted(extra)}')
    return r


def main(argv):
    paths = [Path(p) for p in argv] or sorted(PACK.glob('topik-*/mock-*.json'))
    bad = 0
    for p in paths:
        rep = validate(p.resolve())
        status = 'OK' if not rep.errors else f'{len(rep.errors)} errors'
        print(f'{rep.name}: {status}, {len(rep.warnings)} warnings')
        for e in rep.errors:
            print('  ERROR', e)
        for w in rep.warnings:
            print('  warn ', w)
        bad += bool(rep.errors)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
