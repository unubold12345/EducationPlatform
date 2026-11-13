from common import *
from itertools import product

def make(v):
 p=Paper(2024,v);k=v+2
 good=124+20*v
 p.mc('Divisibility by four','4-т хуваагдах тоог сонго.',good,'Сүүлийн хоёр цифрээс үүсэх тоо 4-т хуваагдах эсэхийг шалга.',[good+1,good+2,good+3,good+5])
 a=v+2;b=v+3;den=(a+b)**2
 p.mc('Probability bar chart',f'Хоёр удаагийн туршилтад амжилтын тоо X=0,1,2. Харгалзах магадлалууд {a*a}/{den},{2*a*b}/{den},{b*b}/{den}. P(X≥1)-ийг ол.',1-F(a*a,den),'Нэгээс бага цорын ганц утга X=0; эсрэг үзэгдлийн магадлалыг 1-ээс хас.',figure={'kind':'probability_bars','x':[0,1,2],'p':[str(F(a*a,den)),str(F(2*a*b,den)),str(F(b*b,den))]})
 p.mc('Linear fractional equation',f'(4/9)x+{k}+5/6={k+1}-г бод.',F(3,8),'Тогтмолуудын ялгавар 1/6. x=(1/6)/(4/9)=3/8.')
 p.mc('Rational powers',f'∛({k}²)·{k}^(1/3)-г хялбарчил.',k,'Илтгэгчүүд 2/3+1/3=1.')
 theta=60+2*v
 p.mc('Tangent chord central angle',f'O төвтэй тойргийн A дээрх шүргэгч B-г дайрна. B,O,C нэг шулуун дээр, C нь OB цацрагийн тойрог дээрх цэг. ∠AOB={theta}°. ∠BAC-г ол.',F(theta,2),'OA⊥AB, харин OAC адил хажуут тул ∠OAC=(180−θ)/2. ∠BAC=90−∠OAC=θ/2.')
 p.mc('Different color pairs',f'{k} улаан,{k+1} цагаан,{k+2} хөх бөмбөгөөс өөр өнгийн хоёрыг хэдэн янзаар сонгох вэ?',k*(k+1)+k*(k+2)+(k+1)*(k+2),'Өнгөний гурван хос тус бүрийн боломжийг үржүүлж нэм.')
 p.mc('Prism vector difference',f'Тэгш өнцөгт хайрцагт A(0,0,0),B({k},0,0),E(0,0,{k+1}),G({k},{k+2},{k+1}). BG−AE векторыг ол.',(0,k+2,0),'BG=(0,k+2,k+1), AE=(0,0,k+1); хас.',[(k,k+2,0),(0,0,k+1),(0,k+2,k+1),(0,-k-2,0)])
 p.mc('Log derivative',f'y=ln({k}x)−{k}x. y′-ийг ол.',f'1/x−{k}','ln(kx)-ийн уламжлал k/(kx)=1/x.',[f'{k}/x−{k}',f'1/({k}x)−{k}',f'1/x+{k}',f'ln({k}x)−{k}'])
 p.mc('Scientific mass multiplication',f'Нэг ширхэг нунтаг талст {k}×10^(−7) мг. 3000 талстын нийт массыг мг-аар ол.',f'{3*k}×10^(−4)','k·10^(−7)·3·10³=3k·10^(−4).',[f'{3*k}×10^(−10)',f'{k}×10^(−4)',f'{3*k}×10^(−3)',f'{3*k}×10^(−5)'])
 p.mc('Fraction proportion',f'{120*k}-ын 5/24 нь x-ийн 5/8-тай тэнцүү. x-г ол.',40*k,'Хоёр талаас 5-ыг хураахад x=(120k)/3.')
 p.mc('Rational cancellation',f'(x²+{k}x)/(x²−4)·(x+2)/x−(x+{k})/(2x−4)-г хялбарчил. x≠−2,0,2.',f'(x+{k})/(2(x−2))','Эхний үржвэр (x+k)/(x−2); түүнээс талыг нь хасна.',[f'(x+{k})/(x−2)',f'(x−{k})/(2(x−2))',f'(x+{k})/(2(x+2))',f'1/(2(x−2))'])
 a=k;b=k+1
 p.mc('Perpendicular medians area',f'ABC гурвалжны AN={3*a},BM={3*b} медианууд перпендикуляр, O дээр огтолно. N нь BC-ийн, M нь AC-ийн дундаж. ONCM талбайг ол.',2*a*b,'ON=a, OM=b. O=(0,0),N=(a,0),M=(0,−b),C=(2a,−2b) гэж координат сонгоход дөрвөн өнцөгтийн талбай 2ab.')
 aa,bb,cc=[(3,4,5),(5,12,13),(8,15,17),(7,24,25),(20,21,29)][v-1]
 p.mc('Quadrant cosine from tangent',f'tan α=−{aa}/{bb},90°<α<180°. cosα-г ол.',F(-bb,cc),'1+tan²α=sec²α. II мөчид cos сөрөг.')
 p.mc('Collinear points',f'A(−5,−2),B(5,4),C({v},a) нэг шулуун дээр. a-г ол.',F(3*v+5,5),'Налалт 3/5. y+2=(3/5)(x+5).')
 p.mc('Radical definite integral',f'∫[1→{F((k+2)**2-1,3)}] dx/√(3x+1)-г ол.',F(2*k,3),'Эх функц (2/3)√(3x+1); төгсгөлийн язгуурууд 2,k+2.')
 p.mc('Complex quadratic root',f'z²+{2*k}z+{k*k+36}=0. Im z>0 байх язгуурыг ол.',f'−{k}+6i','Квадрат гүйцээвэл (z+k)²=−36.',[f'−{k}−6i',f'{k}+6i',f'{k}−6i',f'−{k}+36i'])
 mean=F(10+v,10);p2=mean-1;p1=1-p2
 candidates=[(F(j,10),F(10-j,10)) for j in [1,2,3,4,6,7,8,9]]
 wrong=[t for t in candidates if t!=(p1,p2)][:4]
 p.mc('Expectation probability relation',f'X нь 1,2 утгыг p₁,p₂ магадлалаар авна. E(X)={mean}. p₁,p₂-ыг ол.',(p1,p2),'p₁+p₂=1, p₁+2p₂=mean; ялгавраас p₂=mean−1.',wrong)
 # Two opposite quadrants of the annulus are shaded, as in the reference figure.
 r=k;R=k+2
 p.mc('Shaded annulus probability',f'Нэг төвтэй {r},{R} радиустай дугуйн цагирагийг дөрвөн тэнцүү секторт хувааж, эсрэг хоёр секторыг буджээ. Том дугуйд цэг жигд сонгоход будсан хэсэгт байх магадлалыг ол.',F(R*R-r*r,2*R*R),'Будсан талбай нь цагирагийн тал: π(R²−r²)/2. Том дугуйн талбайд хуваа.',figure={'kind':'annulus','innerRadius':r,'outerRadius':R,'shadedQuarterIndices':[0,2]})
 p.mc('Trig antiderivative initial value',f'y′=sin x−sin3x, y(π/3)={k}−1/3. y-г ол.',f'−cosx+cos3x/3+{k}+1/2','Эх функц −cosx+cos3x/3+C. π/3 дээр −5/6 тул C=k+1/2.',[f'cosx−cos3x/3+{k}',f'−cosx−cos3x/3+{k}',f'−cosx+3cos3x+{k}',f'−cosx+cos3x/3+{k}−1/2'])
 rate=v+4;growth=F((100+rate)**2-10000,100)
 p.mc('Repeated percentage increase',f'Үнэ хоёр удаа ижил хувиар өсөөд анхнаасаа {growth}% нэмэгджээ. Нэг удаагийн өсөлтийн хувь хэд вэ?',rate,'(1+r/100)²=1+growth/100. Эерэг квадрат язгуур авч r-г ол.')
 p.mc('Intersection of inequalities',f'(x−{v})²−3(x−{v})<0, 2−(x−{v})≥0-ийг хамтад нь бод.',f'({v};{v+2}]','u=x−v: 0<u<3 ба u≤2; огтлол 0<u≤2.',[f'[{v};{v+2}]',f'({v};{v+2})',f'({v};{v+3})',f'(−∞;{v+2}]'])
 divisor=[3,4,6,8,9][v-1];count=sum((a*b)%divisor==0 for a in range(1,7) for b in range(1,7))
 p.mc('Two dice product probability',f'Хоёр шударга шооны нүдний үржвэр {divisor}-д хуваагдах магадлалыг ол.',F(count,36),'36 хосын үржвэрийн хуваагдах нөхцөлийг тоол.')
 b=k
 p.mc('Rational asymptotes',f'y=(3x+{3*b-3})/(x+{2*b-1}) график (1,3/2)-ийг дайрна. Босоо асимптотыг ол.',f'x=−{2*b-1}','Хуваарь тэг болох x=−(2b−1); хүртвэр тэнд тэг биш.',[f'x={2*b-1}','y=3',f'x=−{b}',f'y=−{2*b-1}'])
 p.mc('Sum of logarithm equation roots',f'log₂({k+1}−{k}x)+log₂x=0. Шийдүүдийн нийлбэрийг ол.',F(k+1,k),'x(k+1−kx)=1 →kx²−(k+1)x+1=0; язгуурууд 1,1/k, хоёулаа логийн мужид.')
 p.mc('Cone lateral area',f'Конусын байгуулагч суурийн хавтгайтай үүсгэх өнцгийн sin=12/13, суурийн радиус {5*k}. Хажуу талбайг ол.',f'{65*k*k}π','cos=5/13; байгуулагч l=r/(5/13)=13k. S=πrl.',[f'{60*k*k}π',f'{156*k*k}π',f'{25*k*k}π',f'{169*k*k}π'])
 poly=2*x**3+11*x**2+15*x-(4+v);rem=S.rem(poly,(x+3)**2)
 p.mc('Remainder modulo square',f'P(x)=2x³+11x²+15x−{4+v}. (x+3)²-д хуваах үлдэгдлийг ол.',S.expand(rem),'Шугаман R(x)=P(−3)+P′(−3)(x+3), эсвэл урт хуваалт хэрэглэ.',distinct_from(S.expand(rem),[S.expand(poly.subs(x,-3)-S.diff(poly,x).subs(x,-3)*(x+3)),S.expand(-poly.subs(x,-3)+S.diff(poly,x).subs(x,-3)*(x+3)),S.expand(poly.subs(x,-3)+S.diff(poly,x).subs(x,-3)*(x-3)),S.expand(poly.subs(x,-3)+S.diff(poly,x).subs(x,-3)*x),S.expand(rem+x)]))
 p.mc('Closest point on circle',f'x²+y²={4*k*k} тойрог дээр A({4*k},{3*k})-д хамгийн ойр цэгийн x-г ол.',F(8*k,5),'Хамгийн ойр цэг OA цацраг дээр: радиус 2k, |OA|=5k; x=4k·2/5.')
 digits=[str(k),str(k+1),str(k+2)];count=sum(max(t.count(d) for d in digits)<=2 for t in product(digits,repeat=4))
 p.mc('Digit arrangements bounded repetition',f'Зөвхөн {digits} цифрээр дөрвөн оронтой тоо бичнэ. Цифр бүр хоёроос олонгүй орсон боломж хэд вэ?',count,'Нийт 3⁴. Нэг цифр 3 эсвэл 4 орсон тоонуудыг хас: 3(4·2+1).')
 N=100+v
 p.mc('Sum excluding multiples',f'{N}-аас хэтрэхгүй, 3 ба 8-ын алинд ч хуваагдахгүй натурал тоонуудын нийлбэрийг ол.',sum(n for n in range(1,N+1) if n%3 and n%8),'Нийт нийлбэрээс 3 ба 8-ын үржвэрүүдийн нийлбэрийг хасаад 24-ийн үржвэрийн нийлбэрийг нэм.')
 ans=math.comb(3,2)*k*k-3*k*5+math.comb(5,2)
 p.mc('Coefficient in product of binomials',f'(1−{k}x)³(1+x)⁵-ийн x²-ийн коэффициентийг ол.',ans,'x²-ыг (2,0),(1,1),(0,2) зэргийн нийлбэрүүд үүсгэнэ: 3k²−15k+10.')
 p.mc('Exponential substitution integral',f'∫e^(2x)/(e^x−{k}) dx-г ол.',f'e^x+{k}ln|e^x−{k}|+C','u=e^x; ∫u/(u−k)du=∫(1+k/(u−k))du.',[f'e^x−{k}ln|e^x−{k}|+C',f'ln|e^x−{k}|+C',f'e^(2x)/2+C',f'{k}e^x+ln|e^x−{k}|+C'])
 mirrors=[S.Matrix([[0,1],[1,0]]),S.Matrix([[0,-1],[-1,0]]),S.diag(1,-1),S.diag(-1,1),S.Matrix([[0,1],[1,0]])];rot=S.Matrix([[0,1],[-1,0]]) if v<5 else S.Matrix([[0,-1],[1,0]]);M=rot*mirrors[v-1]
 labels=['y=x','y=−x','Ox','Oy','y=x'];direction='цагийн зүүний дагуу' if v<5 else 'цагийн зүүний эсрэг'
 opts=[str(S.eye(2).tolist()),str(S.diag(1,-1).tolist()),str(S.diag(-1,1).tolist()),str(S.Matrix([[0,1],[1,0]]).tolist()),str(S.Matrix([[0,-1],[-1,0]]).tolist()),str((-S.eye(2)).tolist())]
 answer=str(M.tolist());wrong=[a for a in opts if a!=answer][:4]
 p.mc('Composition of planar transformations',f'Эхлээд {labels[v-1]}-ийн хувьд тольдоод, дараа нь O төвтэй {direction} 90° эргүүлэв. Нийлмэл матрицыг ол.',answer,'Үйлдлийн дарааллаар эргэлтийн матрицыг тольдолтын матрицын зүүн талаас үржүүл.',wrong)
 scale=v+1
 p.mc('Circle and triangle secants',f'ABC гурвалжны AD өндөр. D төвтэй,DA радиустай тойрог AB,AC-г A-аас өөр M,N дээр огтолно. AM={5*scale},BM={3*scale},AN={4*scale}. AC-г ол.',10*scale,'Тэгш өнцөгт гурвалжин ба цэгийн зэргээс AB·AM=AC·AN=2AD². AB=8s, иймд AC=8s·5s/(4s).')
 p.mc('Reconstruct function from derivative graph',f'f′(x)=−(x−{v}−1)²+4 параболын графиктай; f({v})=−4. f-ийн локал максимум утгыг ол.',5,'u=x−v; f′=−u²+2u+3. Максимум u=3 дээр. f(3+v)=−4+∫₀³(−u²+2u+3)du=5.',figure={'kind':'parabola','equation':f'y=−(x−{v}−1)²+4','represents':'derivative'})
 t=k+3
 p.mc('Matrix inverse relation',f'A=[[x,−3],[1,y]], A−3A⁻¹={t}I. x²+y²-г ол.',t*t+12,'Диагональ бус гишүүнээс detA=−3. Иймд xy=−6, x+y=t. x²+y²=t²−2xy.')
 r=k;s=2
 p.mc('Triangle cevian vector',f'OAB гурвалжны OB дээр ON:NB={r}:{s}. BM медиан ба AN нь P дээр огтлолцоно. OA=a,OB=b. OP-г илэрхийл.',f'({s}a+{r}b)/{r+2*s}','M=a/2, N=rb/(r+s). Хоёр шулууны параметрүүдийг координатаар тэнцүүл.',[f'({r}a+{s}b)/{r+2*s}',f'({s}a+{r}b)/{r+s}',f'({r+s}a+{r}b)/{r+2*s}',f'({s}a+{r+s}b)/{r+2*s}'])
 h=v
 p.multi('2.1','Radical function inverse and inequality',f'f(x)=√(7(x−{h})−3){signed(h-1) if h!=1 else ""}.', [('Тодорхойлогдох мужийн доод хязгаар',F(7*h+3,7)),('Утгын мужийн доод хязгаар',h-1),('Урвуу функц',simplest(h+((x-h+1)**2+3)/S.Integer(7))),('Урвуугийн тодорхойлогдох мужийн доод хязгаар',h-1),('f(x)≥f⁻¹(x) шийд',f'[{h+1};{h+4}]')],'u=x−h гэж шилжүүл. Урвууг y+1=√(7u−3)-аас олно. Өсөх функцийн графикууд y=x дээр u=1,4-т огтлолцож, хооронд нь f≥f⁻¹ байна.')
 scale=v+1
 p.multi('2.2','Distance from cuboid vertex to plane',f'D оройд огтлолцох AD={2*scale}√5,DC={2*scale}√11,DH={scale}√5 ирмэгүүдтэй тэгш өнцөгт хайрцаг. D-ээс ACH хавтгай хүртэлх зайг ол.', [('S(ADH)',5*scale**2),('V(ADHC)',simplest(S.Rational(10*scale**3,3)*S.sqrt(11))),('AC',8*scale),('AH ба CH',(5*scale,7*scale)),('S(ACH)',f'{10*scale**2}√3'),('D-ээс ACH хүртэлх зай',simplest(scale*S.sqrt(33)/3))],'Ирмэгүүд харилцан перпендикуляр. V=AD·DC·DH/6; ACH-ийн талууд 5s,7s,8s, Героны талбай 10s²√3. Зай 3V/S.')
 scale=v+1;bins=[[1+v,3+v],[3+v,5+v],[5+v,7+v],[7+v,9+v]];dens=[2*scale,6*scale,3*scale,scale]
 p.multi('2.3','Frequency density histogram statistics',f'Аялагчдын замын гистограммын завсрууд {bins} км, давтамжийн нягтууд харгалзан {dens}.', [(f'[{5+v};{7+v}) км явсан хүний тоо',6*scale),('Нийт хүний тоо',24*scale),('Ангийн төвөөр тооцсон дундаж',F(2*v+9,2)),('Стандарт хазайлт','√11/2')],'Завсар бүрийн өргөн 2 тул давтамжууд 4s,12s,6s,2s. Суурь төвүүд 2,4,6,8 ба шилжилт v; дундаж v+4.5, дисперс 11/4.',figure={'kind':'histogram','bins':bins,'frequencyDensity':dens})
 scale=v+1;h=v
 p.multi('2.4','Absolute parabola tangent enclosed area',f'u=x−{h}, f(x)={"" if scale==2 else (scale//2 if scale%2==0 else f"({scale}/2)")}|u²−7u|. График ба ({h+3},{6*scale}) цэгт татсан шүргэгчээр хүрээлэгдэх талбайг ол.', [('Модулийн доторх илэрхийлэл сөрөг байх x муж',f'({h};{h+7})'),('Шүргэгчийн тэгшитгэл','y='+simplest(S.Rational(scale,2)*(x-h+9))),('Шүргэлтийн цэгээс өөр огтлолцлуудын x',(h-1,h+9)),('Талбай',F(157*scale,6))],'0<u<7 үед f=s(7u−u²)/2. u=3 дээр налалт s/2. Гадна салбаруудтай шүргэгчийн огтлол u=−1,9. [−1,0],[0,7],[7,9] хэсгүүдээр интегралын нийлбэр 157s/6.')
 p.save()

if __name__=='__main__':
 for v in range(1,6):make(v)
