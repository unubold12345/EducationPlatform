"""Build the Chemistry ЭЕШ mock JSON files, figures, manifest and validation report.

Usage:  python MockExmps/Chemistry/tools/build.py
Content lives in tools/content_<year>.py (one module per reference year).
"""
import collections
import hashlib
import importlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

AUTHOR = 'Claude Code (Claude Opus 5.5)'
YEARS = [2020, 2021, 2022, 2023, 2025, 2026]
LETTERS = 'ABCDE'


def mcq_points(n, points=None):
    if points:
        return points[n - 1]
    return 1 if n <= 22 else 2 if n <= 30 else 3


def describe_points(points):
    groups, start = [], 1
    for n in range(2, 42):
        if n == 41 or points[n - 1] != points[start - 1]:
            groups.append(f'{start}–{n - 1}: {points[start - 1]} оноо' if n - 1 > start else f'{start}: {points[start - 1]} оноо')
            start = n
    return '; '.join(groups)


def norm_options(o):
    if isinstance(o, dict):
        return o
    assert len(o) == 5, o
    return dict(zip(LETTERS, o))


def rebalance(items):
    """Rotate option order (content unchanged) so answer letters are spread evenly.
    Items whose options are the figure letters A–E themselves are left fixed."""
    counts = collections.Counter()
    fixed = [list(norm_options(it['o']).values()) == list(LETTERS) or it.get('fix') for it in items]
    for it, fx in zip(items, fixed):
        if fx:
            counts[it['a']] += 1
    prev = None
    out = []
    for it, fx in zip(items, fixed):
        it = dict(it)
        if not fx:
            target = min(LETTERS, key=lambda L: (counts[L] + (0.5 if L == prev else 0), (ord(L) * 7 + len(out) * 3) % 5))
            vals = list(norm_options(it['o']).values())
            src = LETTERS.index(it['a'])
            shift = (LETTERS.index(target) - src) % 5
            rot = [vals[(i - shift) % 5] for i in range(5)]
            it['o'] = rot
            it['a'] = target
            counts[target] += 1
        prev = it['a']
        out.append(it)
    return out


def write_fig(year, mock, name, svg_text):
    rel = f'images/mock-{mock:02d}/{name}.svg'
    path = ROOT / str(year) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg_text, encoding='utf-8')
    return rel


def build_year(year):
    mod = importlib.import_module(f'content_{year}')
    out = []
    for k, mock in enumerate(mod.MOCKS, start=1):
        qs = []
        for n, it in enumerate(rebalance(mock['mcq']), start=1):
            opts = norm_options(it['o'])
            q = {
                'id': str(n), 'type': 'multiple-choice', 'points': mcq_points(n, getattr(mod, 'POINTS', None)),
                'skill': it['skill'], 'referenceItem': str(it.get('ref', n)),
                'prompt': it['q'],
            }
            if it.get('cols'):
                q['optionColumns'] = it['cols']
            q['options'] = opts
            q['answer'] = it['a']
            q['answerText'] = opts[it['a']]
            q['explanation'] = it['ex']
            if it.get('fig'):
                q['figure'] = {'path': write_fig(year, k, f'q{n:02d}', it['fig']),
                               'alt': it.get('alt', f'{n}-р даалгаврын зураг'),
                               'origin': f'Original SVG authored by {AUTHOR}.'}
            qs.append(q)
        tasks = []
        for t in mock['part2']:
            task = {'id': t['ref'], 'type': 'constructed', 'topic': t['topic'], 'points': 8,
                    'referenceItem': t['ref'], 'prompt': t['prompt']}
            if t.get('choices'):
                task['choices'] = t['choices']
            task['parts'] = [{'id': pid, 'prompt': pp, 'answer': str(ans), 'points': 1, 'explanation': ex}
                             for pid, pp, ans, ex in t['parts']]
            if t.get('provisional'):
                task['provisional'] = True
            if t.get('fig'):
                task['figure'] = {'path': write_fig(year, k, 'task-' + t['ref'].replace('.', '-'), t['fig']),
                                  'alt': t.get('alt', t['topic']),
                                  'origin': f'Original SVG authored by {AUTHOR}.'}
            tasks.append(task)
        doc = {
            'schemaVersion': 1, 'subject': 'chemistry', 'language': 'mn',
            'referenceYear': year, 'mockVariant': f'M{k}',
            'title': f'Хими · Элсэлтийн шалгалт {year} оны загвар · Хувилбар M{k}',
            'official': False, 'author': AUTHOR, 'referenceVariant': 'A',
            'reference': mod.REFERENCE, 'durationMinutes': 100, 'totalPoints': 100,
            'difficulty': {'target': 'Same level and item format as the reference; only contexts, substances and numbers change.',
                           'verified': False,
                           'note': 'No teacher review or student-based equating has been performed.'},
            'completionStatus': mod.STATUS,
            'limitations': mod.LIMITATIONS,
            'answerProvenance': f'Answers and explanations authored by {AUTHOR}; unofficial. No official key was used.',
            'instructions': [
                '100 минут. Нийт 100 оноо.',
                'Нэгдүгээр хэсэг: 40 сонгох даалгавар, 68 оноо. ' + describe_points([mcq_points(i, getattr(mod, 'POINTS', None)) for i in range(1, 41)]) + '.',
                'Хоёрдугаар хэсэг: 4 бүтээх даалгавар, нийт 32 оноо; a–h нүд бүр 1 оноо.',
                'Бутархай гарвал таслалын арын тоо 5 ба түүнээс их бол өмнөх тоог нэгээр нэмэгдүүлнэ.',
                'Энэ бол албан бус бэлтгэлийн хувилбар.'],
            'sections': [
                {'id': 'I', 'title': 'Нэгдүгээр хэсэг. Сонгох даалгавар', 'points': 68, 'questions': qs},
                {'id': 'II', 'title': 'Хоёрдугаар хэсэг. Бүтээх даалгавар', 'points': 32, 'tasks': tasks}],
        }
        path = ROOT / str(year) / f'mock-{k:02d}.json'
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        out.append(path)
    blueprint = {'year': year, 'referenceVariant': 'A', 'reference': mod.REFERENCE,
                 'items': [{'item': str(n), 'points': mcq_points(n, getattr(mod, 'POINTS', None)), 'skill': it['skill'],
                            'referenceSummary': it.get('refnote', '')}
                           for n, it in enumerate(mod.MOCKS[0]['mcq'], start=1)],
                 'tasks': [{'item': t['ref'], 'points': 8, 'topic': t['topic'],
                            'referenceSummary': t.get('refnote', '')} for t in mod.MOCKS[0]['part2']]}
    (ROOT / str(year) / 'blueprint.json').write_text(json.dumps(blueprint, ensure_ascii=False, indent=2) + '\n',
                                                    encoding='utf-8')
    return mod, out


def validate(path):
    d = json.loads(path.read_text(encoding='utf-8'))
    errs = []
    qs = d['sections'][0]['questions']
    tasks = d['sections'][1]['tasks']
    if len(qs) != 40:
        errs.append(f'{len(qs)} MCQ')
    if sum(q['points'] for q in qs) != 68:
        errs.append('MCQ points != 68')
    for q in qs:
        if set(q['options']) != set(LETTERS):
            errs.append(f"q{q['id']} options")
        if q['answer'] not in LETTERS:
            errs.append(f"q{q['id']} answer")
        if len(set(q['options'].values())) != 5:
            errs.append(f"q{q['id']} duplicate options")
        if not q['explanation'].strip() or not q['prompt'].strip():
            errs.append(f"q{q['id']} empty text")
        if 'figure' in q and not (path.parent / q['figure']['path']).exists():
            errs.append(f"q{q['id']} missing figure")
    if len(tasks) != 4 or sum(t['points'] for t in tasks) != 32:
        errs.append('Part II shape')
    for t in tasks:
        if [p['id'] for p in t['parts']] != list('abcdefgh'):
            errs.append(f"{t['id']} parts {[p['id'] for p in t['parts']]}")
        for p in t['parts']:
            if p['answer'] in ('', 'None'):
                errs.append(f"{t['id']}{p['id']} answer")
        if 'figure' in t and not (path.parent / t['figure']['path']).exists():
            errs.append(f"{t['id']} missing figure")
    dist = collections.Counter(q['answer'] for q in qs)
    return d, errs, dist


def main():
    years = [int(a) for a in sys.argv[1:]] or YEARS
    report, manifest = [], {'subject': 'chemistry', 'language': 'mn', 'author': AUTHOR,
                            'websiteIntegrated': False, 'years': []}
    for year in years:
        mod, paths = build_year(year)
        forms = []
        for p in paths:
            d, errs, dist = validate(p)
            report.append({'file': str(p.relative_to(ROOT)).replace('\\', '/'), 'errors': errs,
                           'answerDistribution': dict(sorted(dist.items())),
                           'figures': sum('figure' in q for q in d['sections'][0]['questions'])
                           + sum('figure' in t for t in d['sections'][1]['tasks'])})
            forms.append({'path': f'{year}/{p.name}', 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
            print(p.relative_to(ROOT), 'OK' if not errs else errs, dict(sorted(dist.items())))
        manifest['years'].append({'year': year, 'variantCount': len(paths), 'reference': mod.REFERENCE,
                                  'forms': forms})
    if years == YEARS:
        (ROOT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (ROOT / 'validation-report.json').write_text(json.dumps(
            {'checked': ['40 MCQ / 68 points using the reference year point split', 'four 8-point Part II tasks with a-h',
                         'A-E options present and distinct', 'answer key present', 'figure files exist'],
             'notChecked': ['teacher review of chemistry accuracy and Mongolian terminology',
                            'statistical difficulty equating with the official paper'],
             'files': report}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
