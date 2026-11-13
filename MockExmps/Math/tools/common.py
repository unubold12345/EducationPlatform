"""Offline content authoring helpers; never imported by the application."""
import json, math, random, re
from fractions import Fraction as F
from pathlib import Path
import sympy as S

ROOT = Path(__file__).resolve().parents[1]
x = S.Symbol('x', real=True)
SUPERSCRIPT = str.maketrans('0123456789-', '⁰¹²³⁴⁵⁶⁷⁸⁹⁻')
SYNTAX = re.compile(r'\*|\bsqrt\(|\bpi\b')
def pretty(text):
    """Python/SymPy syntax (x**2, 3*x, sqrt(5), pi) in the notation students read: x², 3x, √5, π."""
    t = text.replace(' ', '')
    t = re.sub(r'\*\*\((-?\d+)\)|\*\*(\d+)', lambda m: (m.group(1) or m.group(2)).translate(SUPERSCRIPT), t)
    t = t.replace('**', '^')
    t = re.sub(r'sqrt\((\d+)\)', r'√\1', t).replace('sqrt(', '√(')
    t = re.sub(r'\bpi\b', 'π', t)
    t = re.sub(r'\boo\b', '∞', t)
    t = re.sub(r'\bI\b', 'i', t)
    t = re.sub(r'(?<=[\d)a-zA-Zπ])\*(?=[a-zA-Z(√π])', '', t)
    return t.replace('*', '·').replace('-', '−')
def val(v):
    if isinstance(v, (list, tuple)): return '(' + '; '.join(map(val,v)) + ')'
    text = str(v)
    return pretty(text) if SYNTAX.search(text) else text
def simplest(expr):
    """The shortest of the usual closed forms, printed for students (6π/6 → π, 270√11/3 → 90√11)."""
    expr = S.nsimplify(expr) if not isinstance(expr, S.Basic) else expr
    forms = []
    for f in (S.simplify, S.radsimp, S.together, S.factor, S.expand, S.cancel):
        for rank, order in enumerate(('lex', 'rev-lex')):
            try: forms.append((pretty(S.sstr(f(expr), order=order)), rank))
            except Exception: pass
    # Shortest first; then a leading positive term (2−√3, not −√3+2); then descending powers (x³−7x²…).
    return min(forms, key=lambda form: (len(form[0]), form[0].startswith('−'), form[1], form[0]))[0]
def spacing(text):
    """Spaces the source text dropped: 'Оргил50' → 'Оргил 50', 'радиусr' → 'радиус r', 'бага,их' → 'бага, их'."""
    text = re.sub(r'(?<=[а-яөүёА-ЯӨҮЁ]{2})(?=[0-9a-zA-Zπ√])', ' ', text)
    return re.sub(r',(?=[А-ЯӨҮЁа-яөүё])', ', ', text)
def signed(value):
    """A term written after another term: +3, −2 (never +-2)."""
    return f'−{-value}' if value < 0 else f'+{value}'
def distinct_from(key, candidates, count=4):
    """The first plausible-error candidates whose values differ from the key and from each other."""
    chosen = []
    for c in candidates:
        c = S.simplify(S.sympify(c))
        if S.simplify(c - key) != 0 and all(S.simplify(c - d) != 0 for d in chosen): chosen.append(c)
        if len(chosen) == count: return chosen
    raise ValueError(f'not enough distinct distractors for {key}: {chosen}')
def thousandths(n):
    """A decimal from an integer count of thousandths, with no binary floating-point noise: 2349 → 2.349."""
    whole, part = divmod(n, 1000)
    return f'{whole}.{part:03d}'.rstrip('0').rstrip('.')
def pick_around(rng, key, lower, upper):
    """Four distractors with the key at a random rank, nearest candidates first, so the middle value is no clue."""
    lower = [c for c in dict.fromkeys(lower) if c < key]
    upper = [c for c in dict.fromkeys(upper) if c > key]
    below = min(rng.randrange(5), len(lower))
    if 4 - below > len(upper): below = 4 - len(upper)
    chosen = sorted(lower, key=lambda c: key - c)[:below] + sorted(upper, key=lambda c: c - key)[:4 - below]
    assert len(chosen) == 4, (key, lower, upper)
    return chosen

class Paper:
    def __init__(self,year,variant,reference='A'):
        self.year,self.variant,self.reference=year,variant,reference
        self.items=[]
    def mc(self,skill,prompt,answer,solution,wrong=None,points=None,figure=None):
        n=len(self.items)+1
        raw=answer
        answer=val(answer)
        if wrong is None:
            # Generated distractors put the key at a random rank: with a−2…a+2 it was always the middle value.
            rng=random.Random(self.year*7919+self.variant*104729+n)
            try:
                a=S.sympify(raw)
                if a.is_Rational and a.q>1:
                    # Fraction distractors remain in the natural scale of the item.
                    num,den=int(a.p),int(a.q)
                    pool=[S.Rational(num+i,den+j) for i in (-2,-1,0,1,2) for j in (-2,-1,0,1,2) if den+j>0 and (i,j)!=(0,0)]
                    if 'probability' in skill.lower() or skill in ['Expectation','Variance','Independent misses','Complement probability']:
                        pool=[c for c in pool if 0<=c<=1]+[S.Rational(j,den+3) for j in range(den+4)]
                    pool=[c for c in pool if c!=a]
                    wrong=[str(c) for c in pick_around(rng,a,pool,pool)]
                elif a.is_Integer:
                    lowest=0 if a>=0 else a-4   # a non-negative count never gets negative distractors
                    wrong=[str(c) for c in pick_around(rng,a,[a-d for d in range(1,5) if a-d>=lowest],[a+d for d in range(1,5)])]
                else:
                    wrong=[]
                    for c in [2*a,a/2,-a,a+1,a-1,a+2]:
                        c=S.simplify(c)
                        if c!=a and val(c) not in wrong: wrong.append(val(c))
                        if len(wrong)==4: break
            except Exception: raise ValueError(f'Explicit distractors required: {self.year}/{n}')
        opts=[answer]+list(map(val,wrong))
        assert len(opts)==len(set(opts))==5,(self.year,n,opts)
        random.Random(self.year*1000+self.variant*50+n).shuffle(opts)
        self.items.append(dict(number=str(n),referenceQuestion=str(n),skill=skill,type='multiple_choice',points=points or ((1 if n<=10 else 2 if n<=26 else 3) if self.year==2021 else (1 if n<=8 else 2 if n<=28 else 3)),prompt=prompt,options=dict(zip('ABCDE',opts)),answer='ABCDE'[opts.index(answer)],answerValue=answer,solution=solution,**({'figure':figure} if figure else {})))
    def multi(self,n,skill,prompt,parts,solution,figure=None):
        # A part is (prompt, answer) or (prompt, answer, {'accept': [...], 'exactForm': True}): other accepted
        # spellings, and a flag for tasks whose written form is the point (factorise, rationalise).
        built=[]
        for i,part in enumerate(parts):
            item=dict(id=str(i+1),prompt=part[0],answer=val(part[1]))
            extra=part[2] if len(part)>2 else {}
            if extra.get('accept'): item['accept']=[val(a) for a in extra['accept']]
            if extra.get('exactForm'): item['exactForm']=True
            built.append(item)
        self.items.append(dict(number=n,referenceQuestion=n,skill=skill,type='structured_response',points=7,prompt=prompt,parts=built,solution=solution,**({'figure':figure} if figure else {})))
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
        # Prompts and explanations only (never answers or options): restore the spaces the transcriptions dropped.
        for q in d['questions']:
            for field in ('prompt','solution'): q[field]=spacing(q[field])
            for part in q.get('parts',[]): part['prompt']=spacing(part['prompt'])
        from figures import enrich
        from render_figures import attach_svg
        d=attach_svg(enrich(d))
        p=ROOT/str(self.year);p.mkdir(exist_ok=True)
        (p/f'mock-{self.variant:02}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

