"""Offline content authoring helpers; never imported by the application."""
import json, math, random
from fractions import Fraction as F
from pathlib import Path
import sympy as S

ROOT = Path(__file__).resolve().parents[1]
x = S.Symbol('x', real=True)
def val(v):
    if isinstance(v, (list, tuple)): return '(' + '; '.join(map(val,v)) + ')'
    return str(v)

class Paper:
    def __init__(self,year,variant,reference='A'):
        self.year,self.variant,self.reference=year,variant,reference
        self.items=[]
    def mc(self,skill,prompt,answer,solution,wrong=None,points=None,figure=None):
        n=len(self.items)+1
        answer=val(answer)
        if wrong is None:
            try:
                a=S.sympify(answer)
                if a.is_Rational and a.q>1:
                    # Fraction distractors remain in the natural scale of the item.
                    num,den=int(a.p),int(a.q)
                    candidates=[S.Rational(num+1,den),S.Rational(num,den+1),S.Rational(num,den-1),S.Rational(num+2,den),S.Rational(num-1,den),S.Rational(num+1,den+1),S.Rational(num,den+2)]
                    if 'probability' in skill.lower() or skill in ['Expectation','Variance','Independent misses','Complement probability']:
                        candidates=[c for c in candidates if 0<=c<=1]
                        candidates += [S.Rational(j,den+3) for j in range(den+4)]
                    wrong=[]
                    for c in candidates:
                        if c!=a and str(c) not in wrong: wrong.append(str(c))
                        if len(wrong)==4: break
                else:
                    wrong=[str(S.simplify(a+d)) for d in [-2,-1,1,2]]
            except Exception: raise ValueError(f'Explicit distractors required: {self.year}/{n}')
        opts=[answer]+list(map(val,wrong))
        assert len(opts)==len(set(opts))==5,(self.year,n,opts)
        random.Random(self.year*1000+self.variant*50+n).shuffle(opts)
        self.items.append(dict(number=str(n),referenceQuestion=str(n),skill=skill,type='multiple_choice',points=points or ((1 if n<=10 else 2 if n<=26 else 3) if self.year==2021 else (1 if n<=8 else 2 if n<=28 else 3)),prompt=prompt,options=dict(zip('ABCDE',opts)),answer='ABCDE'[opts.index(answer)],answerValue=answer,solution=solution,**({'figure':figure} if figure else {})))
    def multi(self,n,skill,prompt,parts,solution,figure=None):
        self.items.append(dict(number=n,referenceQuestion=n,skill=skill,type='structured_response',points=7,prompt=prompt,parts=[dict(id=str(i+1),prompt=p,answer=val(a)) for i,(p,a) in enumerate(parts)],solution=solution,**({'figure':figure} if figure else {})))
    def save(self):
        assert [q['number'] for q in self.items]==list(map(str,range(1,37)))+['2.1','2.2','2.3','2.4']
        d=dict(schemaVersion=1,subject='mathematics',language='mn',referenceYear=self.year,mockVariant=f'M{self.variant}',title=f'ЭЕШ математик {self.year} оны жишиг — M{self.variant}',official=False,author='Codex (GPT-6)',referenceVariant=self.reference,referenceDirectory='reference',durationMinutes=100,calculatorAllowed=False,difficulty=dict(target='Match reference item order, tested operations and reasoning depth',status='Author review; empirical equivalence has not been established'),answerProvenance='Independently calculated by Codex; not an official answer key',responseFormat='A–E for Part I; exact mathematical values for Part II (not official digit-box encoding)',instructions=['Нэгдүгээр хэсэгт нэг зөв хариултыг сонгоно.','Хоёрдугаар хэсгийн дэд асуулт бүрийн хариуг нөхнө.','Тооцоолуур хэрэглэхгүй.'],questions=self.items)
        if self.year>=2022:
            d['referenceProvenance']={'kind':'third_party_transcription','sourceUrl':f'https://mathx.mn/eyesh/{self.year}-a/','originalOfficialBooklet':False,'ownerApprovedFallback':True,'accuracyAgainstOriginal':'not independently verified'}
            def tidy(value):
                if isinstance(value,str): return value.replace('+-','−').replace('+−','−').replace('**','^')
                if isinstance(value,list): return [tidy(item) for item in value]
                if isinstance(value,dict): return {key:tidy(item) for key,item in value.items()}
                return value
            d=tidy(d)
        from figures import enrich
        from render_figures import attach_svg
        d=attach_svg(enrich(d))
        p=ROOT/str(self.year);p.mkdir(exist_ok=True)
        (p/f'mock-{self.variant:02}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

