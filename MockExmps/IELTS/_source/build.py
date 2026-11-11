"""Build and validate this offline pack only. Run: python -B MockExmps/IELTS/_source/build.py"""
import hashlib
import importlib
import json
from pathlib import Path
from common import words
from figures import charts

ROOT=Path(__file__).resolve().parents[1]

def write(path,text):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(text.rstrip().replace('|\n\n|','|\n|')+"\n",encoding="utf-8",newline="\n")

def dump(path,data):
    write(path,json.dumps(data,ensure_ascii=False,indent=2))

def render_groups(groups,start):
    out=[]
    for g in groups:
        end=start+len(g['items'])-1
        out += [f"#### Questions {start}–{end}",g['instruction']]
        if g.get('bank'):
            out += ["\n".join(f"- **{k}** {v}" for k,v in g['bank'].items())]
        for item in g['items']:
            item['number']=start
            out += [f"**{start}.** {item['prompt']}"]
            if item.get('options'):
                out += ["\n".join(f"- **{chr(65+i)}** {v}" for i,v in enumerate(item['options']))]
            start+=1
    return out,start

def validate(form):
    report={"form":form['number'],"listeningQuestions":0,"readingQuestions":0,"readingWords":[],"scriptWords":[]}
    assert len(form['listening'])==4 and len(form['reading'])==3
    for skill in ('listening','reading'):
        serial=[]
        for index,unit in enumerate(form[skill]):
            source=unit['script'] if skill=='listening' else ' '.join(unit['paragraphs'].values())
            count=0
            positions=[]
            if skill=='listening':
                assert unit['script'].count('\n---\n')==(1 if index<3 else 0)
            report['scriptWords' if skill=='listening' else 'readingWords'].append(len(words(source)))
            for g in unit['groups']:
                for item in g['items']:
                    count+=1
                    serial.append(item['number'])
                    assert item['evidence'] in source,(form['number'],skill,item['number'],'missing evidence')
                    if skill=='listening':positions.append(source.index(item['evidence']))
                    assert item['explanation'].strip()
                    assert item['answers'] and all(str(a).strip() for a in item['answers'])
                    if g['kind']=='completion':
                        assert '____' in item['prompt']
                        for answer in item['answers']:
                            token=words(answer)
                            numeric=[w for w in token if any(c.isdigit() for c in w)]
                            assert len(token)-len(numeric) <= g['maxWords']
                            assert not numeric or g['numbersAllowed']
                            if not numeric:
                                assert answer.casefold() in source.casefold(),(form['number'],skill,item['number'],'completion not verbatim')
                    if item.get('options'):
                        assert len(item['options'])==(3 if skill=='listening' else 4)
                        assert len(set(item['options']))==len(item['options'])
                        assert item['answers'][0] in [chr(65+i) for i in range(len(item['options']))]
                    if g.get('bank'):
                        assert all(a in g['bank'] for a in item['answers'])
                        if skill=='reading' and set(g['bank'])==set(unit['paragraphs']):
                            assert item['evidence'] in unit['paragraphs'][item['answers'][0]]
                    if g['kind']=='headings':
                        assert item['evidence'] in unit['paragraphs'][item['prompt'][-1]]
                    if g['kind']=='true-false-not-given': assert item['answers'][0] in ('TRUE','FALSE','NOT GIVEN')
                    if g['kind']=='yes-no-not-given': assert item['answers'][0] in ('YES','NO','NOT GIVEN')
            assert count==(10 if skill=='listening' else (13 if index<2 else 14))
            if skill=='listening':
                assert positions==sorted(positions),(form['number'],index+1,'listening order')
                if index<3:
                    boundary=source.index('\n---\n')
                    assert positions[4]<boundary<positions[5],(form['number'],index+1,'midpoint order')
            report[skill+'Questions']+=count
        assert serial==list(range(1,41))
    assert 2150<=sum(report['readingWords'])<=2750,(form['number'],report['readingWords'])
    assert 2200<=sum(report['scriptWords'])<=3200
    assert len(form['writing'])==2
    assert len(form['speaking']['part1'])==3
    assert len(form['speaking']['part3'])>=6
    return report

def main():
    charts()
    reports=[]
    titles=set()
    audio_path=ROOT/'audio-manifest.json'
    recordings=json.loads(audio_path.read_text(encoding='utf-8')) if audio_path.exists() else {}
    for number in range(7,13):
        f=importlib.import_module(f'form{number:02d}').FORM
        audio=next((entry for entry in recordings.get('fullTests',[]) if entry['form']==number),None)
        f.update(schemaVersion=1,number=number,title=f'IELTS Academic — Original Mock {number:02d}',
                 timing=dict(listeningMinutesApprox=[25,31],readingMinutes=60,writingMinutes=60,speakingMinutes=[11,14]),
                 writingMinimumWords=[150,250],
                 status='Original uncalibrated practice draft; teacher review pending',
                 audioStatus='Synthetic Listening recordings included' if audio else 'Reader-administered; no recording supplied',
                 provenance='Original authored text and fictional case studies/data; format references in SOURCES.md')
        if audio:
            f['audio']=audio
            f['timing']['listeningSeconds']=audio['seconds']
        folder=ROOT/f'mock-{number:02d}'
        candidate=[f"# {f['title']}","Candidate paper • Original independent practice material • Answers and scripts are in separate examiner files.",
                   "Use the separate answer sheet. Do not open the examiner script during the test.",
                   "## Listening — 40 questions", "Listen once. Four parts, ten questions each. Follow the word limits. See [ADMINISTRATION.md](../ADMINISTRATION.md) for the playback or reader-led protocol."]
        if audio:
            candidate += ["[Play the complete Listening test](audio/listening-full.mp3). Reading and checking pauses are already included. Play continuously without pausing or replaying during a timed sitting."]
        else:
            candidate += ["A separate reader administers Listening for this copy."]
        start=1
        for i,u in enumerate(f['listening'],1):
            candidate += [f"### Part {i} — {u['title']}"]
            if audio:candidate += [f"[Part {i} audio](audio/part-{i}.mp3) — use for separate-part practice."]
            if u.get('visual'): candidate += [u['visual']]
            content,start=render_groups(u['groups'],start); candidate+=content
        candidate += ["## Reading — 60 minutes, 40 questions","Spend about 20 minutes on each passage. All answers must be on the answer sheet within the 60 minutes; there is no extra transfer time."]
        start=1
        for i,u in enumerate(f['reading'],1):
            assert u['title'] not in titles
            titles.add(u['title'])
            candidate += [f"### Passage {i} — {u['title']}"]
            candidate += [f"**{letter}** {para}" for letter,para in u['paragraphs'].items()]
            content,start=render_groups(u['groups'],start);candidate+=content
        candidate += ["## Writing — 60 minutes","Complete both tasks in connected prose. Suggested time: Task 1, 20 minutes (at least 150 words); Task 2, 40 minutes (at least 250 words). Task 2 has twice the weight in IELTS assessment."]
        for i,task in enumerate(f['writing'],1):
            candidate += [f"### Task {i}",task['prompt']]
            if task.get('visual'):candidate += [task['visual']]
        candidate += ["## Speaking — 11–14 minutes","The examiner keeps the question list. In Part 2 you receive the cue card below, one minute to prepare and up to two minutes to speak. Parts 1 and 3 are an interview.",
                      "### Part 2 cue card",f['speaking']['part2']['cue'],"You should say:"]
        candidate += ['- '+p for p in f['speaking']['part2']['points']]
        candidate += ['and explain '+f['speaking']['part2']['explain']]
        write(folder/'candidate.md','\n\n'.join(candidate))
        key=[f"# Mock {number:02d} — Answer key and teaching notes","EXAMINER ONLY. Award one raw mark per Listening/Reading item. No official band conversion. Accept listed answers and the recognised spelling/numeric variants described in ADMINISTRATION.md, within the printed limit. Letter case is immaterial; normal spelling is required. See ADMINISTRATION.md."]
        for skill in ('listening','reading'):
            key += [f"## {skill.title()}","| Q | Accepted answer(s) | Evidence and reason |","| --- | --- | --- |"]
            for u in f[skill]:
                for g in u['groups']:
                    for item in g['items']:
                        reason=f"“{item['evidence']}” — {item['explanation']}".replace('|','/').replace('\n',' ')
                        key += [f"| {item['number']} | {' / '.join(item['answers'])} | {reason} |"]
        key += ["## Writing — content guidance, not model answers"]
        for i,t in enumerate(f['writing'],1):key += [f"### Task {i}",t['guidance']]
        key += ["Assess task achievement/response, coherence and cohesion, lexical resource, and grammatical range/accuracy. There is no single correct essay position. Do not reward agreement with these notes; reward a relevant developed response. For Task 1, use only the supplied visual; do not invent causes."]
        write(folder/'answers.md','\n\n'.join(key))
        examiner=[f"# Mock {number:02d} — Examiner script","Keep this file away from candidates. Spoken dialogue is labelled by role. Do not speak role labels or the --- break marker. Read continuously and naturally; do not emphasise answers. The marker divides questions 1–5/6–10 within Parts 1–3; pause 30 seconds there. Part 4 has no midpoint break. Full procedure: ../ADMINISTRATION.md.","## Listening"]
        for i,u in enumerate(f['listening'],1):examiner += [f"### Part {i} — {u['title']}",u['script']]
        examiner += ["## Speaking","Part 1: 4–5 minutes. Begin with the candidate’s name and a brief introduction; no real ID document is needed for practice. Ask the following familiar-topic questions, with brief neutral follow-ups as necessary."]
        for topic,questions in f['speaking']['part1'].items():examiner += [f"### {topic}"]+['- '+x for x in questions]
        sp=f['speaking']['part2']
        examiner += ["### Part 2 — 3–4 minutes including preparation",sp['cue'],"\n".join('- '+x for x in sp['points']),"and explain "+sp['explain'],"Give one minute for notes, then invite the candidate to speak for up to two minutes. Stop politely at two minutes. Ask one brief follow-up:"]+['- '+x for x in sp['followups']]
        examiner += ["### Part 3 — 4–5 minutes","Develop the linked general discussion. Choose follow-ups that invite reasons, comparisons, examples or speculation; do not teach or correct during the interview."]+['- '+x for x in f['speaking']['part3']]
        examiner += ["Assess fluency/coherence, lexical resource, grammatical range/accuracy, and pronunciation from actual speech. A transcript cannot establish pronunciation. Record only with the candidate’s consent; this pack contains no recording tool."]
        write(folder/'examiner.md','\n\n'.join(examiner))
        sheet=[f"# Mock {number:02d} — Answer sheet","Candidate: ____________________   Date: ____________________"]
        for skill in ('Listening','Reading'):
            sheet += [f"## {skill}","| Q | Answer | Q | Answer |","| --- | --- | --- | --- |"]
            sheet += [f"| {i} | __________________ | {i+20} | __________________ |" for i in range(1,21)]
        sheet += ["## Writing","Write Task 1 and Task 2 on separate lined paper or in a blank local document. Label each task and keep the word count yourself.","## Speaking preparation","Use a separate blank sheet for the one-minute Part 2 preparation."]
        write(folder/'answer-sheet.md','\n\n'.join(sheet))
        reports.append(validate(f));dump(folder/'mock.json',f)
    dump(ROOT/'validation-report.json',dict(status='passed',forms=reports,checks=['40 Listening and 40 Reading items per form','4 x 10 Listening; 13 + 13 + 14 Reading','Reading text 2150–2750 words per form','all keys in option banks','word completions verbatim and within limits; spoken numbers keyed as numerals','evidence excerpts present','Listening evidence and midpoint breaks in question order','paragraph-matching and heading evidence in the target paragraph','distinct passage titles','2 Writing tasks and 3 Speaking parts'],limits='Structural checks do not prove answer validity, difficulty calibration or teacher approval.'))
    files={str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ROOT.rglob('*')) if p.is_file() and p.name!='manifest.json' and '__pycache__' not in p.parts}
    dump(ROOT/'manifest.json',dict(sha256=files))
    print(json.dumps(reports,indent=2))

if __name__=='__main__':main()
