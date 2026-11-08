"""Rebuild the six offline packs with Python's standard library. No app or DB access."""
import copy
import hashlib
import json
from pathlib import Path
import random
import re
import sys

sys.dont_write_bytecode = True
import n5
import n4

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    'https://www.jlpt.jp/e/guideline/testsections.html',
    'https://www.jlpt.jp/e/topics/202009091599642827.html',
    'https://www.jlpt.jp/e/samples/forlearners.html',
    'https://www.jlpt.jp/e/samples/n5/index.html',
    'https://www.jlpt.jp/e/samples/n4/index.html',
]
V_TYPES = ['kanji-reading', 'orthography', 'context', 'paraphrase', 'usage']
G_TYPES = ['grammar-form', 'sentence-order', 'text-grammar', 'short-reading', 'medium-reading', 'information-retrieval']
L_TYPES = ['task-comprehension', 'key-points', 'verbal-expressions', 'quick-response']
COUNTS = {
    'N5': [[7, 5, 6, 3], [9, 4, 4, 2, 2, 1], [7, 6, 5, 6]],
    'N4': [[7, 5, 8, 4, 4], [13, 4, 4, 3, 3, 2], [8, 7, 5, 8]],
}
TIMES = {'N5': [20, 40, 30], 'N4': [25, 55, 35]}
INSTRUCTIONS = {
    'kanji-reading': '【　】の ことばは どう よみますか。',
    'orthography': '【　】の ことばは どう かきますか。',
    'context': '（　）に 入る いちばん いい ことばを えらんでください。',
    'paraphrase': '【　】の 文と だいたい 同じ いみの 文を えらんでください。',
    'usage': 'ことばの 使い方が 正しい 文を えらんでください。',
    'grammar-form': '（　）に 入る いちばん いい ものを えらんでください。',
    'sentence-order': '四つの ことばを ならべて 文を 作ります。★に 入る ことばを えらんでください。',
    'text-grammar': '文を 読んで、【1】〜【4】に 入る ものを えらんでください。',
    'short-reading': '文を 読んで、しつもんに こたえてください。',
    'medium-reading': '文を 読んで、しつもんに こたえてください。',
    'information-retrieval': 'お知らせを 見て、しつもんに こたえてください。',
    'task-comprehension': '話を 聞いて、さいごの しつもんに こたえてください。',
    'key-points': 'しつもんを 聞いてから、話を 聞きます。大切な ことを えらんでください。',
    'verbal-expressions': '場面を 見て、三つの ことばを 聞きます。何と 言うか えらんでください。',
    'quick-response': '短い ことばと 三つの 返事を 聞いて、いちばん いい 返事を えらんでください。',
}

# Readings for less basic kanji in grammar/reading and visible listening material.
# Vocabulary items deliberately retain their tested orthography without added clues.
READINGS = dict(pair.split(':') for pair in '''
市民:しみん 工事:こうじ 休館日:きゅうかんび 開館日:かいかんび 入口:いりぐち
食欲:しょくよく 夕方:ゆうがた 無理:むり 医者:いしゃ 毎月:まいつき
無料:むりょう 全員:ぜんいん 参加:さんか 受けつけ:うけつけ 近所:きんじょ
写真展:しゃしんてん 題名:だいめい 予定:よてい 準備:じゅんび 注文:ちゅうもん
先輩:せんぱい 確認:かくにん 点検:てんけん 利用:りよう 階段:かいだん
荷物:にもつ 避けて:さけて 予約:よやく 面接:めんせつ 受付:うけつけ
履歴書:りれきしょ 持参:じさん 必要:ひつよう 身分証明書:みぶんしょうめいしょ
有名:ゆうめい 見学:けんがく 自由:じゆう 昔:むかし 心:こころ
普通:ふつう 電動:でんどう 営業時間:えいぎょうじかん 当日:とうじつ
以上:いじょう 前日:ぜんじつ 合計:ごうけい 道具:どうぐ 料金:りょうきん
健康:けんこう 最初:さいしょ 疲れて:つかれて 続き:つづき 続け:つづけ
集合:しゅうごう 場合:ばあい 延期:えんき 中止:ちゅうし 連絡:れんらく
食事:しょくじ 二錠:にじょう 運転:うんてん 相談:そうだん 約束:やくそく
急に:きゅうに 出張:しゅっちょう 宅:たく 届け:とどけ 半年前:はんとしまえ
音楽:おんがく 楽器:がっき 習う:ならう 初めて:はじめて 指:ゆび
痛くて:いたくて 簡単:かんたん 曲:きょく 最後:さいご 比べ:くらべ
練習:れんしゅう 録音:ろくおん 発表会:はっぴょうかい 緊張:きんちょう
失敗:しっぱい 大切:たいせつ 栄養:えいよう 材料費:ざいりょうひ 含まれ:ふくまれ
敬語:けいご 急行:きゅうこう 目的:もくてき 申込書:もうしこみしょ
変更:へんこう 南口:みなみぐち 北口:きたぐち 窓口:まどぐち 棚:たな
配達:はいたつ 駐車場:ちゅうしゃじょう 症状:しょうじょう 保険証:ほけんしょう
冷蔵庫:れいぞうこ 警察官:けいさつかん 財布:さいふ 体操:たいそう
社員:しゃいん 授業:じゅぎょう 発表:はっぴょう 受け取って:うけとって
'''.split())

READINGS.pop('心')  # 心配 is not read こころはい.
READINGS['心配'] = 'しんぱい'
READING_PATTERN = re.compile('|'.join(re.escape(word) for word in sorted(READINGS, key=len, reverse=True)))

def support(text):
    return READING_PATTERN.sub(lambda match: f'{match[0]}（{READINGS[match[0]]}）', text)

def make_pack(level, form_number, source):
    rng = random.Random(f'jlpt-offline-v1-{level}-{form_number}')
    pack = dict(id=f'jlpt-{level.lower()}-{form_number:02}', level=level,
                title=f'Original JLPT {level} Mock {form_number:02}', theme=source['theme'],
                version=1, authoredDate='2026-11-08', status='draft-awaiting-Japanese-teacher-review',
                author='Codex (GPT-6)', official=False, offlineOnly=True,
                referenceUrls=SOURCES, scoring='One raw practice mark per item; no scaled score or official pass prediction.',
                listeningDelivery='Human reader script only; no audio recording. Written situation cues replace illustrations in verbal-expression items.',
                sections=[])
    banks = [source['vocabulary'],
             [source['grammar'], source['order'], source['text'],
              [q for passage in source['short'] for q in passage], source['medium'], source['info']],
             [source['task'], source['points'], source['utterance'], source['quick']]]
    for si, (banks_section, types, code, minutes, expected) in enumerate(zip(
            banks, [V_TYPES, G_TYPES, L_TYPES], ['V', 'G', 'L'], TIMES[level], COUNTS[level])):
        assert [len(bank) for bank in banks_section] == expected, (level, form_number, code)
        section = dict(id=code, minutes=minutes, title=['Vocabulary', 'Grammar and reading', 'Listening'][si], groups=[])
        number = 0
        for group_number, (bank, kind) in enumerate(zip(banks_section, types), 1):
            group = dict(number=group_number, type=kind, instructions=INSTRUCTIONS[kind], questions=[])
            for raw in bank:
                number += 1
                q = copy.deepcopy(raw)
                q['id'] = f'{level}-{form_number:02}-{code}{number:02}'
                q['number'] = number
                q['rawMarks'] = 1
                if kind == 'sentence-order':
                    correct = q['orderedChunks'][2]
                    q['choices'] = list(q['orderedChunks'])
                    q['prompt'] = q['prefix'] + ' ____  ____  ★  ____ ' + q['suffix']
                    q['solutionSentence'] = q['prefix'] + ' '.join(q['orderedChunks']) + q['suffix']
                else:
                    correct = q['choices'][0]
                rng.shuffle(q['choices'])
                q['answer'] = q['choices'].index(correct) + 1
                if si != 0:
                    for field in ['prompt', 'passage', 'solutionSentence']:
                        if field in q:
                            q[field] = support(q[field])
                    q['choices'] = [support(c) for c in q['choices']]
                    if 'orderedChunks' in q:
                        q['orderedChunks'] = [support(c) for c in q['orderedChunks']]
                        assert q['choices'][q['answer'] - 1] == q['orderedChunks'][2]
                if si == 2:
                    q['delivery'] = 'spoken-options' if kind in L_TYPES[2:] else 'printed-options'
                    if kind == 'verbal-expressions':
                        # Strip authoring-time option numbers; render fresh shuffled options below.
                        q['script'] = q['script'].split('１：')[0].strip()
                    if q['delivery'] == 'spoken-options':
                        q['examinerReadout'] = q['script'] + '\n' + '\n'.join(f'{i}。{c}' for i, c in enumerate(q['choices'], 1))
                    elif kind == 'key-points':
                        q['examinerReadout'] = q['prompt'] + '\n' + q['script'] + '\n' + q['prompt']
                    else:
                        q['examinerReadout'] = '話を 聞いてください。\n' + q['script'] + '\n' + q['prompt']
                assert len(q['choices']) == (3 if kind in L_TYPES[2:] else 4), q['id']
                assert len(set(q['choices'])) == len(q['choices']), q['id']
                assert q['explanation'] and all(q['choices']), q['id']
                group['questions'].append(q)
            section['groups'].append(group)
        section['itemCount'] = number
        pack['sections'].append(section)
    pack['itemCount'] = sum(s['itemCount'] for s in pack['sections'])
    assert pack['itemCount'] == {'N5': 67, 'N4': 85}[level]
    return pack

def render(pack):
    header = f"# {pack['title']}\n\n{pack['theme']}\n\nOriginal unofficial practice material. Draft; teacher review pending.\n\n"
    student = [header, 'Name: ____________________  Date: ____________________\n\nChoose ONE numbered answer per question. Do not open the key or examiner script during the mock.\n\n',
               'N5 uses mostly kana. Parenthetical readings support less basic kanji in N4 grammar/reading. 【 】 marks the target word in vocabulary questions. ★ is the third blank in sentence-order questions.\n\n',
               '**Listening requires a separate reader.** Questions and choices for spoken-response items are heard only; keep this booklet open to the numbered answer rows. Verbal-expression situations are supplied as written cues, an adaptation of the official picture format.\n\n']
    key = [header, 'One point per correct response; zero for wrong or blank. Report raw totals only. There is no conversion to JLPT scaled scores or pass/fail.\n\n']
    script = [header, '## Examiner instructions\n\nKeep this file from candidates. Follow the timing protocol in ../../ADMINISTRATION.md. Read dialogue naturally with different speaker voices. Do not read the labels 男/女/ナレーター, parenthetical kanji readings, answer explanations, or the answer key. Read option numbers for spoken-option groups only. Read each item once.\n\n']
    sheet = [header, 'Name: ____________________  Date: ____________________\n\nCircle ONE number per row. Numbers restart for each section.\n\n']
    for section in pack['sections']:
        heading = f"## {section['id']} · {section['title']} · {section['minutes']} minutes · {section['itemCount']} questions\n\n"
        student.append(heading)
        key.append(heading)
        sheet.append(heading + '| Question | Answer |\n| --- | --- |\n')
        if section['id'] == 'L':
            script.append(heading)
        for group in section['groups']:
            gh = f"### 問題 {group['number']} · {group['type']}\n\n{group['instructions']}\n\n"
            student.append(gh)
            last_passage = None
            for q in group['questions']:
                tag = f"{section['id']}{q['number']:02}"
                key.append(f"- **{tag}: {q['answer']}** — {q['choices'][q['answer'] - 1]} — {q['explanation']}\n")
                if 'solutionSentence' in q:
                    key.append(f"  Full sentence: {q['solutionSentence']}\n")
                sheet.append(f"| {tag} | {'　 '.join(str(i) for i in range(1, len(q['choices']) + 1))} |\n")
                if q.get('passage') and q['passage'] != last_passage:
                    student.append('\n'.join('> ' + line for line in q['passage'].splitlines()) + '\n\n')
                    last_passage = q['passage']
                if section['id'] == 'L':
                    script.append(f"### {tag} · {group['type']}\n\n{q['examinerReadout']}\n\n")
                if group['type'] == 'quick-response':
                    student.append(f"**{tag}**　1　2　3\n\n")
                elif group['type'] == 'verbal-expressions':
                    student.append(f"**{tag}**　{q['prompt']}\n\n1　2　3 （音声で 聞きます）\n\n")
                else:
                    # First two listening groups show alternatives; the question is spoken only.
                    student.append(f"**{tag}**\n\n" if section['id'] == 'L' else f"**{tag}**　{q['prompt']}\n\n")
                    student.extend(f"{i}. {c}\n" for i, c in enumerate(q['choices'], 1))
                    student.append('\n')
            key.append('\n')
        sheet.append('\n')
    return {'questions.md': ''.join(student), 'answers.md': ''.join(key),
            'examiner-listening.md': ''.join(script), 'answer-sheet.md': ''.join(sheet)}

def main():
    manifest = []
    all_ids = set()
    all_fingerprints = set()
    for level, module in [('N5', n5), ('N4', n4)]:
        for number, source in enumerate(module.FORMS, 1):
            pack = make_pack(level, number, source)
            dest = ROOT / level / f'mock-{number:02}'
            dest.mkdir(parents=True, exist_ok=True)
            outputs = render(pack)
            outputs['mock.json'] = json.dumps(pack, ensure_ascii=False, indent=2) + '\n'
            for filename, content in outputs.items():
                assert '\ufffd' not in content
                (dest / filename).write_text(content, encoding='utf-8', newline='\n')
            for section in pack['sections']:
                for group in section['groups']:
                    for q in group['questions']:
                        assert q['id'] not in all_ids
                        all_ids.add(q['id'])
                        # Generic quick-response instructions repeat; actual stimulus must be unique.
                        stimulus = q.get('script', q.get('passage', '') + q['prompt'])
                        fingerprint = (level, group['type'], stimulus)
                        if group['type'] == 'sentence-order':
                            fingerprint += (tuple(q['orderedChunks']),)
                        # Shared passages intentionally serve multiple questions within a form.
                        if group['type'] in ['text-grammar', 'medium-reading', 'information-retrieval']:
                            fingerprint += (q['prompt'],)
                        assert fingerprint not in all_fingerprints, q['id']
                        all_fingerprints.add(fingerprint)
            manifest.append(dict(id=pack['id'], items=pack['itemCount'],
                                 sections=[dict(id=s['id'], minutes=s['minutes'], items=s['itemCount']) for s in pack['sections']],
                                 files={name: hashlib.sha256((dest / name).read_bytes()).hexdigest() for name in outputs}))
            print(f"Validated {pack['id']}: {pack['itemCount']} items; all item types, options and keys present")
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Total: {len(manifest)} mocks, {len(all_ids)} unique question IDs. No website files accessed.')

if __name__ == '__main__':
    main()
