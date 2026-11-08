"""Offline content QA: structure, references, SVG parsing and independent arithmetic."""
from pathlib import Path
import collections
import hashlib
import json
import math
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]

def close(actual,expected):
    assert math.isclose(actual,expected,rel_tol=1e-7,abs_tol=1e-7),(actual,expected)

def arithmetic(c):
    op=c['operation']
    if op=='subtract':close(c['result'],c['operands'][0]-c['operands'][1])
    elif op=='multiply':close(c['result'],math.prod(c['operands']))
    elif op=='divide':close(c['result'],c['operands'][0]/c['operands'][1])
    elif op=='percent':close(c['result'],100*c['numerator']/c['denominator'])
    elif op=='weighted_sum':close(c['result'],sum(a*b for a,b in zip(c['counts'],c['weights'])))
    elif op=='hw_p2':close(c['result'],(1-c['q'])**2)
    elif op=='product_percent':close(c['result'],100*math.prod(c['probabilities']))
    elif op=='pcr_reverse':close(c['result'],c['final']/2**c['cycles'])
    elif op=='mark_recapture':close(c['result'],c['s']*c['n']/c['x'])
    elif op=='chi_square':close(c['result'],sum((o-e)**2/e for o,e in zip(c['observed'],c['expected'])))
    elif op=='simpson':
        for suffix in ['A','B']:
            values=c['counts'+suffix]
            close(c['result'+suffix],1-sum((n/sum(values))**2 for n in values))
    elif op=='hw':
        q=c['q'];p=1-q;pop=c['population']
        for a,b in zip(c['results'],[q,p,2*p*q,pop*p*p]):close(a,b)
    elif op=='spearman':
        # Derive the ranks independently from raw abundances.
        ranks=[]
        for name in ['x','y']:
            values=c[name]
            assert len(values)==len(set(values))
            ranks.append([sorted(values,reverse=True).index(a)+1 for a in values])
        sq=sum((a-b)**2 for a,b in zip(*ranks));n=len(c['x'])
        close(c['sumD2'],sq);close(c['result'],1-6*sq/(n**3-n))
    elif op=='genetic_probability':
        cross=c['cross'].replace('×','x').replace(' ','').split('x')
        target=c['target'].lower()
        count=sum(a.lower()==target[0] and b.lower()==target[1] and a.islower() and b.islower() for a in cross[0] for b in cross[1])
        close(c['result'],count/4*100)
    elif op in ['identity','graph_lookup']:pass
    else:raise ValueError(op)

def validate():
    report={'forms':0,'multipleChoice':0,'tasks':0,'subanswers':0,'figures':0,'arithmeticChecks':0,'years':[],
            'scientificExpertReviewed':False,'empiricallyEquated':False,'websiteIntegrated':False}
    for year in range(2020,2027):
        yr={'year':year,'forms':3,'sourceGaps':[], 'referenceVisualGaps':[], 'duplicatePrompts':[]}
        for variant in range(1,4):
            path=ROOT/str(year)/f'mock-{variant:02d}.json'
            exam=json.loads(path.read_text(encoding='utf-8'))
            assert exam['referenceYear']==year and not exam['official']
            assert exam['durationMinutes']==80
            questions=exam['sections'][0]['questions'];tasks=exam['sections'][1]['tasks']
            assert len(questions)==(46 if year==2026 else 50)
            assert [q['id'] for q in questions]==[str(i) for i in range(1,len(questions)+1)]
            assert sum(q['points'] for q in questions)==76
            assert len(tasks)==4 and sum(t['points'] for t in tasks)==24
            assert sum(p['points'] for t in tasks for p in t['parts'])==24
            for q in questions:
                assert set(q['options'])==set('ABCDE')
                assert len(set(q['options'].values()))==5
                assert q['answer'] in q['options']
                assert q['options'][q['answer']]==q['answerText']
                assert q['prompt'] and q['explanation']
                if 'referenceImageGap' in q:yr['referenceVisualGaps'].append(f'B{variant}:{q["id"]}')
            duplicates=[p for p,c in collections.Counter(q['prompt'] for q in questions).items() if c>1]
            yr['duplicatePrompts']+=duplicates
            for q in questions+tasks:
                if 'figure' in q:
                    p=(path.parent/q['figure']['path']).resolve()
                    assert p.is_relative_to(path.parent.resolve()) and p.is_file()
                    tree=ET.parse(p)
                    assert tree.getroot().tag.endswith('svg')
                    assert not any(e.tag.endswith(('script','foreignObject')) for e in tree.iter())
                    report['figures']+=1
                if 'calculation' in q:
                    arithmetic(q['calculation']);report['arithmeticChecks']+=1
            report['forms']+=1;report['multipleChoice']+=len(questions);report['tasks']+=len(tasks)
            report['subanswers']+=sum(len(t['parts']) for t in tasks)
            yr['sourceGaps']=exam['reference']['gaps']
        report['years'].append(yr)
    manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
    for yr in manifest['years']:
        for form in yr['forms']:
            assert hashlib.sha256((ROOT/form['path']).read_bytes()).hexdigest()==form['sha256']
    report['structuralStatus']='passed'
    report['deliveryStatus']='draft; source gaps and fidelity review remain'
    (ROOT/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='years'},ensure_ascii=False,indent=2))

if __name__=='__main__':validate()
