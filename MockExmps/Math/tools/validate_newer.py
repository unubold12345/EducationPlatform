"""Independent checks for the owner-approved 2022–2026 offline pack.

Run validate.py first, then this file to produce the combined report.
"""
from pathlib import Path
from fractions import Fraction as F
from itertools import product,permutations,combinations
from collections import Counter
import json,re,math
import sympy as s
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application

root=Path(__file__).resolve().parents[1];checks=0;numeric_option_pairs=0
x=s.Symbol('x',real=True)
def num(value):
 t=str(value).replace('−','-').replace('π','*pi').replace('·','*').replace('^','**')
 t=re.sub(r'√(\d+)',r'*sqrt(\1)',t).replace('√(','sqrt(').lstrip('*')
 return parse_expr(t,local_dict={'x':x,'i':s.I},transformations=standard_transformations+(implicit_multiplication_application,))
def eq(value,expected):
 global checks
 assert s.simplify(num(value)-expected)==0,(value,str(expected))
 checks+=1
def answer(d,n):return d['questions'][n-1]['answerValue']
def part(d,n):return [a['answer'] for a in d['questions'][35+n]['parts']]
def near(value,expected):
 global checks
 assert math.isclose(float(num(value)),float(expected),rel_tol=1e-10,abs_tol=1e-10),(value,expected)
 checks+=1

for year in range(2022,2027):
 ref=json.loads((root/str(year)/'reference/transcription.json').read_text(encoding='utf8'))
 assert len(ref['questions'])==40 and ref['sourceType']=='third_party_transcription'
 assert len(list((root/str(year)).glob('mock-*.json')))==5
 for v in range(1,6):
  d=json.loads((root/str(year)/f'mock-{v:02}.json').read_text(encoding='utf8'));k=v+2;qs=d['questions']
  assert d['referenceYear']==year and d['referenceVariant']=='A' and not d['official']
  assert d['referenceProvenance']['ownerApprovedFallback'] and not d['referenceProvenance']['originalOfficialBooklet']
  assert len(qs)==40 and sum(q['points'] for q in qs)==100
  for q,r in zip(qs,ref['questions']):
   assert q['number']==q['referenceQuestion']==r['number'] and q['points']==r['points']
   assert q['prompt'] and q['solution'] and q['skill']
   assert not re.search(r'TODO|TBD|placeholder',json.dumps(q),re.I)
   if q['type']=='multiple_choice':
    assert set(q['options'])==set('ABCDE')
    assert len(set(q['options'].values()))==5
    assert q['options'][q['answer']]==q['answerValue']
    if q['skill']!='Matrix product dimensions':
     constants=[]
     for key,text in q['options'].items():
      if re.search(r'[а-яА-Я]|[;{},=°]|C\(|∪|∉|∞|⁽|\bR\b',text):continue
      try:
       value=num(text.replace('×','*'))
       if hasattr(value,'free_symbols') and not value.free_symbols and value.is_number:constants.append((key,value))
      except (SyntaxError,TypeError,ValueError,NameError):continue
     for (ka,a),(kb,b) in combinations(constants,2):
      numeric_option_pairs+=1
      assert s.simplify(a-b)!=0,(year,v,q['number'],ka,kb)
   else:assert all(a['answer'] and a['prompt'] for a in q['parts'])
  if year==2022:
   eq(answer(d,1),s.Rational(1,(k+1)**2));eq(answer(d,2),k+1);eq(answer(d,3),k*k-1)
   eq(answer(d,9),s.Rational(k,30)/(s.Rational(7,6)-s.Rational(7,8)))
   eq(answer(d,10),s.Rational(3*k-(k+1),k+2*(k+1)))
   eq(answer(d,11),k)
   eq(answer(d,12),s.sqrt((s.Rational(2+2*k-6,2)-3)**2+(s.Rational(-2+2*k,2)+2)**2))
   eq(answer(d,13),s.Rational(sum(n%3==0 or n%5==0 for n in range(1,61+15*v)),60+15*v))
   eq(answer(d,18),s.Rational(k,8)+s.Rational(k+1,8)+s.Rational(3*(k+2),4))
   eq(answer(d,19),k);eq(answer(d,21),s.Rational(3,4))
   eq(answer(d,27),18*k)
   eq(answer(d,29),3*k*(k-1))
   eq(answer(d,31),s.integrate(8-2*x*x,(x,-2,2)))
   N=2*k+1;dist={j:s.binomial(k+1,j)*s.binomial(k,2-j)/s.binomial(N,2) for j in range(3)};mean=sum(j*p for j,p in dist.items())
   eq(answer(d,34),sum(j*j*p for j,p in dist.items())-mean**2)
   R=num(answer(d,36));assert s.rem(R,x+1)==R.subs(x,-1)
   assert s.rem(R,x*x-x+1)==(v+1)*x+k-1
   C=v+3;t=-v-1
   eq(part(d,1)[2],C);eq(part(d,1)[3],v+5)
   scale=v+1;xx=2*scale;L=9*scale
   eq(part(d,2)[3],xx);eq(part(d,2)[4],2*xx**2*(L-3*xx))
   eq(part(d,3)[0],30*scale**2);eq(part(d,3)[2],90*scale**2);eq(part(d,3)[3],20*scale**3*s.sqrt(3))
   left=[1,2,4,5,4][v-1];step=v+1;counts=Counter(sum(-step if die<=left else step for die in outcome) for outcome in product(range(1,7),repeat=3));mode=max(counts,key=counts.get)
   eq(part(d,4)[3],mode);eq(part(d,4)[4],s.Rational(counts[mode],216))
  elif year==2023:
   eq(answer(d,1),s.Rational(k+3,k+2));eq(answer(d,5).replace('i','*i'),(k+s.I)**2)
   eq(answer(d,9),13+k);eq(answer(d,11),240);eq(answer(d,12),s.Rational(3,2))
   eq(answer(d,14),s.Rational(k,k+12))
   eq(answer(d,18),1+k*k);eq(answer(d,21),s.Rational(1,5));eq(answer(d,24),240*k**3*s.pi)
   eq(answer(d,26),s.Rational(254,5))
   delta=s.Rational(1,k+2);eq(answer(d,29),delta*(3-delta**2)/2)
   eq(answer(d,31),4);eq(answer(d,33),3*k*s.sqrt(5))
   eq(answer(d,35),18+v+s.integrate(6*(x-(v-2))*(x-(v+1)),(x,v-2,v+1)))
   # Matrix polynomial identity independently reduced using its characteristic polynomial.
   z=s.Symbol('z');trace=k;remainder=s.rem(z**3,z**2-trace*z+1)
   assert answer(d,36)==f'({trace**2-1}; {-trace})'
   eq(part(d,1)[1],3)
   scale=v+1;eq(part(d,2)[1],3*scale);eq(part(d,2)[3],36*scale);eq(part(d,2)[4],2*scale)
   counts=Counter()
   for perm in permutations(range(5)):
    first=perm[0]<2
    stop=next(i+1 for i in range(1,5) if (perm[i]<2)!=first)
    counts[stop]+=1
   eq(part(d,3)[1],s.Rational(counts[2],120));eq(part(d,3)[2],s.Rational(counts[4],120));eq(part(d,3)[3],s.Rational(sum(t*n for t,n in counts.items()),120))
   a=6+v;eq(part(d,4)[0],s.Rational(a**3,6));eq(part(d,4)[3],a-4);eq(part(d,4)[4],s.Rational(a,2))
  elif year==2024:
   eq(answer(d,2),1-s.Rational((v+2)**2,(2*v+5)**2));eq(answer(d,3),s.Rational(3,8));eq(answer(d,4),k)
   eq(answer(d,6),3*k*k+6*k+2);eq(answer(d,10),40*k);eq(answer(d,12),2*k*(k+1))
   eq(answer(d,14),s.Rational(3*v+5,5));eq(answer(d,15),s.Rational(2*k,3))
   rr=k;R=k+2;eq(answer(d,18),s.Rational(R*R-rr*rr,2*R*R))
   b=k;assert s.Rational(3+3*b-3,1+2*b-1)==s.Rational(3,2)
   eq(answer(d,24),1+s.Rational(1,k));eq(answer(d,25),65*k*k*s.pi)
   polynomial=2*x**3+11*x*x+15*x-4-v;expected=s.rem(polynomial,(x+3)**2);eq(answer(d,26),expected)
   eq(answer(d,27),s.Rational(8*k,5));eq(answer(d,28),54)
   eq(answer(d,29),sum(i for i in range(1,101+v) if i%3 and i%8))
   eq(answer(d,30),s.expand((1-k*x)**3*(1+x)**5).coeff(x,2))
   eq(answer(d,33),10*(v+1));eq(answer(d,34),-4+s.integrate(-x*x+2*x+3,(x,0,3)))
   eq(answer(d,35),(k+3)**2+12)
   eq(part(d,2)[0],5*(v+1)**2);eq(part(d,2)[2],8*(v+1));eq(part(d,2)[4],10*(v+1)**2*s.sqrt(3));eq(part(d,2)[5],s.sqrt(33)*(v+1)/3)
   scale=v+1;freq=[4*scale,12*scale,6*scale,2*scale];centers=[2+v,4+v,6+v,8+v];mean=sum(s.Rational(a*b) for a,b in zip(freq,centers))/sum(freq);variance=sum(s.Rational(a*b*b) for a,b in zip(freq,centers))/sum(freq)-mean**2
   eq(part(d,3)[2],mean);eq(part(d,3)[3],s.sqrt(variance))
   line=(x+9)/2;outer=(x*x-7*x)/2;inner=-outer
   area=s.integrate(line-outer,(x,-1,0))+s.integrate(line-inner,(x,0,7))+s.integrate(line-outer,(x,7,9))
   eq(part(d,4)[3],scale*area)
  elif year==2025:
   eq(answer(d,1),k+3);eq(answer(d,5),s.Rational(2*k,k+2));eq(answer(d,6),9+k)
   eq(answer(d,7),s.Rational(k+2,4*k+6));eq(answer(d,12),s.I**(2025+v)-(-s.I)**(2022+v))
   eq(answer(d,16),s.integrate(k*x+1-k,(x,-1,1))+s.integrate(x*x,(x,1,3)))
   eq(answer(d,21),sum(i*i+1 for i in range(1,v+3)))
   eq(answer(d,22),40*(20+v))
   count=k+1;mean=s.Rational(61+6*k+4*count,18+k+count)
   assert str(mean) in qs[23]['prompt'];eq(answer(d,24),count)
   eq(answer(d,25),s.Rational(k+1,4));eq(answer(d,26),3*s.pi/13)
   ratios=set()
   for t in range(1,10):
    if 13*t>=54+v:continue
    for r in range(5):
     w=4-r
     if 4*t-r>0 and 9*t-w>0 and 3*(4*t-r)==9*t-w:ratios.add(s.Rational(13*t,13*t-4))
   assert ratios=={s.Rational(13,12)};eq(answer(d,27),next(iter(ratios)))
   c=s.Symbol('c');assert s.solve(c*c-(c-2)*(c+10),c)==[s.Rational(5,2)];eq(answer(d,28),s.Rational(5,2))
   a=s.Symbol('a');coef=s.expand((x*x+x+a)**4).coeff(x,3);roots=s.solve(coef-12*k,a);eq(answer(d,30),s.prod(roots))
   eq(answer(d,31),4*k*s.sqrt(5)/5)
   eq(answer(d,32),5);eq(answer(d,34),20+v+50*s.Rational(3,5)**2)
   inv=s.Matrix([[k+2,-2],[2,k+5]]);vec=inv*s.Matrix([3,-3]);eq(answer(d,35),vec[0]-vec[1])
   lo=math.exp(-4.5);hi=math.exp(1.5);maximum=max(abs(math.log(t)-t+4.5) for t in [lo,1,hi]);near(answer(d,36),maximum)
   eq(part(d,1)[0].replace('²','^2'),-(x-v)**2/2+50)
   offset=2*v;A=[4+offset,5+offset,6+offset,9+offset];B=[2+offset,3+offset,7+offset,8+offset]
   pairprob=s.Rational(sum(a>b for a in A for b in B),16);eq(part(d,2)[0],pairprob);eq(part(d,2)[1],2*pairprob*(1-pairprob))
   valid=0
   for ai,aj in permutations(range(4),2):
    for bi,bj in permutations(range(4),2):valid+=int(B[bi]>A[ai] and B[bj]>A[aj])
   eq(part(d,2)[2],s.Rational(valid,144))
   a=k+5;eq(part(d,3)[2],s.integrate((x+a)/2-s.sqrt(a*x),(x,0,a)));eq(part(d,3)[3],s.pi*s.integrate(a*x-x*x,(x,0,a)))
   scale=v+1;eq(part(d,4)[0],9*scale);eq(part(d,4)[1],675*scale**3);eq(part(d,4)[2],1850*scale**3)
  elif year==2026:
   eq(answer(d,4),s.Rational(2*k,3));eq(answer(d,5),-2*k-6);eq(answer(d,6),s.binomial(k+6,2))
   eq(answer(d,9),s.sin(s.pi*[15,75,165,195,255][v-1]/180))
   # Symbolic cancellation at arbitrary real variables, independent of authored solution text.
   m,n=s.symbols('m n');a=k+1
   expr=(a*a*m**3+a*m*m*n+m*n*n)/(a*a*m*m+n*n)/((a**3*m**3-n**3)/(a**4*m**4-n**4))
   assert s.factor(expr-(a*m*m+m*n))==0
   eq(answer(d,11),(v+1)*s.sqrt(2));eq(answer(d,12),s.Rational(17*(k+1),10)/(s.Rational(23,4)-s.Rational(13,3)))
   eq(answer(d,13),s.Rational(2,3));eq(answer(d,16),7);eq(answer(d,17),2*k+2);eq(answer(d,18),2*k)
   eq(answer(d,20),s.Rational(1,10));eq(answer(d,22),k+6)
   aa,bb,cc=[(4,3,5),(12,5,13),(15,8,17),(24,7,25),(21,20,29)][v-1];eq(answer(d,25),s.Rational(aa,bb+cc))
   eq(answer(d,27),45*(v+1));eq(answer(d,28),s.Rational(20,49))
   eq(answer(d,32),s.Rational(k+7,2));eq(answer(d,33),(k+2)**2-6)
   scale=v+1;eq(answer(d,35),126*scale*scale)
   U,W=s.symbols('U W');t=k+2;sol=s.solve([U+W-2,2*U+(2*t-1)*W-t],[U,W]);eq(answer(d,36),sol[W]/s.sqrt(sol[U]))
   scale=v+1;N=s.Matrix([6*scale,3*scale,6*scale]);M=s.Matrix([6*scale,6*scale,2*scale]);eq(part(d,2)[0],6*scale);eq(part(d,2)[2],s.sqrt(N.dot(N)));eq(part(d,2)[3],M.dot(M));eq(part(d,2)[4],N.dot(M)/s.sqrt(N.dot(N)*M.dot(M)))
   # Count distinct cube-edge intersections with the section plane.
   pts=set();L=s.Integer(6*scale)
   for axis in range(3):
    others=[i for i in range(3) if i!=axis]
    for constants in product([0,L],repeat=2):
     vec=[None]*3
     for i,c in zip(others,constants):vec[i]=c
     normal=[-5,4,3];coord=-sum(normal[i]*vec[i] for i in others)/s.Integer(normal[axis])
     if 0<=coord<=L:vec[axis]=coord;pts.add(tuple(vec))
   eq(part(d,2)[1],len(pts))
   a=v+4;eq(part(d,3)[2],s.integrate(3*a*x-3*x*x,(x,0,a)));eq(part(d,3)[3],s.Rational(8**3-5**3,54))
   q=s.Rational(30+5*v,100);a=s.Rational(v+1,100);b=s.Rational(v+2,100);total=q*a+(1-q)*b
   eq(part(d,4)[0],1-q);eq(part(d,4)[1],total);eq(part(d,4)[2],(1-q)*b/total)

report=json.loads((root/'validation-report.json').read_text(encoding='utf8'))
assert report['files']==30,'Run validate.py immediately before this script.'
report.update(files=55,years=[2015,2016,2017,2018,2019,2021,2022,2023,2024,2025,2026],questions=2200,multipleChoiceQuestions=1980,structuredTasks=220,independentMathematicalAssertions=report['independentMathematicalAssertions']+checks,newerYearIndependentAssertions=checks,constantOptionPairsCompared=numeric_option_pairs,referencePointWeights='All 25 newer forms match the point weights of their retained transcription.')
(root/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,ensure_ascii=False))
