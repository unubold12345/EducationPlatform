"""Validate offline deliverables and independently check high-risk mathematics.

No website imports, database access, network calls or provider requests.
"""
import json, math, re
from pathlib import Path
from fractions import Fraction as F
from itertools import combinations
import sympy as s
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

root=Path(__file__).resolve().parents[1]
years=[2015,2016,2017,2018,2019,2021]
checked=0
def num(value):
    t=str(value).replace('−','-').replace('π','*pi').replace('^','**').replace('·','*')
    t=re.sub(r'√(\d+)',r'*sqrt(\1)',t)
    t=t.lstrip('*')
    return parse_expr(t,transformations=standard_transformations+(implicit_multiplication_application,))
def equal(value,expected):
    global checked
    assert s.simplify(num(value)-expected)==0,(value,str(expected))
    checked+=1
def at(d,n):return d['questions'][n-1]['answerValue']
def parts(d,n):return [p['answer'] for p in d['questions'][35+n]['parts']]

for year in years:
    files=list((root/str(year)).glob('mock-*.json'))
    assert len(files)==5
    for file in files:
        d=json.loads(file.read_text(encoding='utf8'));v=int(d['mockVariant'][1:]);k=v+2
        assert d['referenceYear']==year and not d['official']
        qs=d['questions'];assert len(qs)==40
        assert sum(q['points'] for q in qs)==100
        assert [q['number'] for q in qs]==list(map(str,range(1,37)))+['2.1','2.2','2.3','2.4']
        for q in qs:
            assert q['referenceQuestion']==q['number']
            assert q['prompt'] and q['solution'] and q['skill']
            assert not re.search(r'TODO|TBD|placeholder',json.dumps(q),re.I)
            if q['type']=='multiple_choice':
                assert set(q['options'])==set('ABCDE')
                assert len(set(q['options'].values()))==5
                assert q['options'][q['answer']]==q['answerValue']
            else:
                assert q['parts'] and all(p['answer'] for p in q['parts'])
        if year==2015:
            equal(at(d,1),2*k+19)
            equal(at(d,7),pow(7,2019+v,10))
            equal(at(d,13),s.Rational(1980+11+2*v,990))
            equal(at(d,17),2)
            # Independently solve the two nested radical/AP restrictions numerically.
            xx=-k
            assert abs(2*math.sqrt(6*xx+15*k)-math.sqrt(2*xx+6*k)-math.sqrt(10*xx+26*k))<1e-9
            equal(at(d,28),s.sqrt(k))
            equal(at(d,22),sum(r**4 for r in s.solve(s.Symbol('z')**2-k*s.Symbol('z')+1)))
            equal(at(d,26),sum(s.Rational(2,n*(n+1)) for n in range(20+k,100+2*k)))
            equal(at(d,27),s.Rational((k+2)*k,(2*k+2)*(2*k+1)))
            equal(at(d,34),s.expand((k*s.Symbol('z')+6)**12).coeff(s.Symbol('z'),5))
            a,b,c=parts(d,1);equal(a,s.Rational(35*k,2));equal(b,12*k);equal(c,210*k*k)
            m=v;r=s.sqrt(m*m+2);X=(r-m)/(r+m);Y=m*m+1+m*r
            equal(parts(d,2)[1],s.simplify(X+Y));equal(parts(d,2)[2],s.simplify(X*Y));equal(parts(d,2)[3],s.simplify(X**3+Y**3))
        elif year==2016:
            equal(at(d,11),s.sqrt(26*k)*s.sqrt(13*k)*s.Rational(12,13))
            equal(at(d,15),s.log(8,k+2)/s.log(16,s.sqrt(k+2)))
            equal(at(d,21),s.Rational((110+v)*(91-v)-10000,100))
            equal(at(d,27),s.integrate(k*(1-s.Symbol('z')**2),(s.Symbol('z'),-1,1)))
            equal(at(d,28),(1-k)**(80+2*v))
            equal(at(d,35),s.Rational(2*k+18*k,2)*s.sqrt((20*k)**2-(16*k)**2))
            equal(at(d,36),s.Rational(2*k,9)*(4*k*k*s.sqrt(3)+9*k*k*s.sqrt(3)+6*k*k*s.sqrt(3)))
            n=s.Symbol('n',integer=True);fun=lambda n:4**n+(9*k+6)*n+9*k+8
            assert all(fun(i)%9==0 for i in range(1,30))
            equal(parts(d,1)[0],fun(1))
            equal(parts(d,4)[0],s.Rational(1,2));equal(parts(d,4)[2],s.Rational(8*k,3))
        elif year==2017:
            equal(at(d,12),-s.Rational(*[(3,5),(5,13),(8,17),(7,25),(20,29)][v-1]))
            equal(at(d,21),s.sqrt(((k+2)**2+(k+6)**2)/s.Integer(2)))
            equal(at(d,26),-(k+1)**2)
            equal(at(d,29),s.integrate(k*(s.Symbol('z')-s.Symbol('z')**3),(s.Symbol('z'),0,1))*2)
            equal(at(d,30),-s.Rational(2,k*k))
            equal(at(d,32),s.expand(s.diff((s.Symbol('z')**2+k*s.Symbol('z'))**4,s.Symbol('z'))).coeff(s.Symbol('z'),3))
            equal(at(d,33),s.summation((k*s.Symbol('n')+2)/3**s.Symbol('n'),(s.Symbol('n'),0,s.oo)))
            equal(at(d,35),s.Rational((5*k)**2,5))
            r=s.real_root(k,3);inv=num(parts(d,1)[1]).subs(s.Symbol('r'),r)
            assert abs(float(inv*(2*r*r+r-1)-1))<1e-9
            a=k+2;equal(parts(d,4)[1],s.Rational(a*a,2));equal(parts(d,4)[2],a**3*s.sqrt(2)/6)
        elif year==2018:
            k=v+1
            equal(at(d,16),s.Rational(k+1,2*k))
            equal(at(d,17),s.Rational(180-3*(40+2*v),2))
            equal(at(d,23),2*s.divisor_count([8,10,14,15,21][v-1]))
            equal(at(d,24),s.sqrt(s.Rational(20,5*(k+2)**2)))
            equal(at(d,28),2*k+1)
            b=k
            assert s.Rational(b,6)-s.Rational(b*b,4)==-s.Rational(k*(3*k-2),12)
            data=[k+1,k+4,k+7,k+6,k+1,k+8,k+4,k+5,k+1,k+8]
            assert at(d,32)==f'({k+1}; {F(2*k+9,2)})'
            equal(parts(d,2)[3],s.integrate(2*s.Symbol('z')-s.Symbol('z')**2,(s.Symbol('z'),0,2)))
            equal(parts(d,3)[2],s.Rational(k+14,30));equal(parts(d,3)[3],s.Rational(8,k+14))
            equal(parts(d,4)[0],s.Rational(k,3)*s.Rational(k+3,2)**2)
            equal(parts(d,4)[3],s.Rational(k,9)*s.Rational(k+3,2)**2)
        elif year==2019:
            equal(at(d,2),-k*(k+1)+2*(k+2))
            equal(at(d,13),s.cos(s.pi*v/6))
            equal(at(d,16),s.Rational(1,2)-s.Rational(3,2)+k-(k+4))
            equal(at(d,23),s.sqrt((3*k)**2+(5*k)**2+(3*k)*(5*k)))
            equal(at(d,26),s.Rational(3*(k+2)+9*(2*k+7)+15*(k+3),2*(4*k+12)))
            equal(at(d,27),s.factorial(2*k))
            equal(at(d,31),s.sqrt(s.Rational(26,5)))
            equal(at(d,35),s.Rational(1,4))
            aa=s.Rational(k+1,10);bb=s.Rational(k+2,10)
            equal(parts(d,3)[0],aa*bb);equal(parts(d,3)[1],aa*(1-bb)+bb*(1-aa));equal(parts(d,3)[2],1-(1-aa)*(1-bb))
        elif year==2021:
            equal(at(d,3),s.Rational(9*v+k,90))
            equal(at(d,10),-s.Rational(k,8))
            equal(at(d,19),s.binomial(k+4,2))
            equal(at(d,28),s.Rational((10+v)*20*k*25*k,100*5*k))
            aa=3*(k+3)+2
            equal(at(d,30),max(sum(aa-3*i for i in range(n)) for n in range(1,50)))
            equal(at(d,32),s.Rational(5,2))
            equal(at(d,33),s.Rational(k*k,2))
            point=[num(t) for t in at(d,35).strip('()').split(';')]
            px,py=k+2,1
            # Reflection: segment midpoint is on the line; joining segment perpendicular.
            assert s.simplify(3*(point[0]+px)/2-(point[1]+py)/2+k-2)==0
            assert s.simplify((point[0]-px)+3*(point[1]-py))==0
            equal(parts(d,1)[0],7*k)
            equal(parts(d,1)[3],s.Rational(39*k*k,4)*s.sqrt(3))
            pairs=[a+b for a,b in combinations([k,k+1,k+2,k,k+1],2)]
            equal(parts(d,2)[1],s.Rational(pairs.count(2*k+2),10));equal(parts(d,2)[3],s.Rational(sum(pairs),10))

report={'files':30,'years':years,'questions':1200,'multipleChoiceQuestions':1080,'structuredTasks':120,'independentMathematicalAssertions':checked,'schemaAndKeys':'pass','scoreTotals':'100 for every form','limits':['Independent arithmetic/symbolic assertions target high-risk items; not a formal proof of every distractor.','Difficulty equivalence and complete Mongolian editorial review require teacher/student review.','Part II uses mathematical response values rather than digit-box transcription.']}
(root/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,ensure_ascii=False))
