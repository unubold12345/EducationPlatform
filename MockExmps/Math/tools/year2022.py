from common import *

def make(v):
 p=Paper(2022,v);k=v+2
 p.mc('Negative exponent',f'{k+1}^(−2)-ын утгыг ол.',F(1,(k+1)**2),'a^(−2)=1/a².')
 data=[k+1,k,k+2,k+4,k,k+1,k+3,k,k+2]
 p.mc('Median',f'Есөн сурагчийн гүйцэтгэсэн даалгаврын тоо {data}. Медианыг ол.',k+1,'Эрэмбэлсний дараах тав дахь утга медиан.')
 p.mc('Function evaluation',f'f(x)={k}x−1 бол f({k}) хэд вэ?',k*k-1,'x-ийн оронд k-г орлуул.')
 p.mc('Union cardinality',f'A={{1,2,3,4,{k+5}}}, B={{3,{k+5},{k+7}}}. |A∪B|-г ол.',6,'Давхардсан элементүүдийг нэг удаа тоол.')
 p.mc('Matrix product dimensions',f'A=[{k},1] ба B=[[2,3],[−3,−8]]. AB үржвэрийн хэмжээс хэд вэ?','1×2','(1×2)(2×2) үржвэр 1×2 хэмжээтэй.', ['2×1','2×2','1×1','Үржүүлэх боломжгүй'])
 p.mc('Vector linear combination',f'a=(1,−{k}), b=({k},3). 2a+b-г ол.',(k+2,3-2*k),'Координат бүрийг үржүүлж нэм.',[(k+1,3-k),(2*k+1,6-k),(k+2,3+2*k),(-k-2,2*k-3)])
 A=[(-4, -1),(-2,2),(-1,0)];shift=(v+2,-v-1);B=[(a+shift[0],b+shift[1]) for a,b in A]
 p.mc('Translation vector',f'Гурвалжны оройнууд {A}, дүрсийн оройнууд харгалзан {B}. Параллель зөөлтийн векторыг ол.',shift,'Дүрсийн координатаас эх дүрсний координатыг хас.',[(shift[0],-shift[1]),(-shift[0],shift[1]),(-shift[0],-shift[1]),(shift[0]+1,shift[1])],figure={'kind':'coordinate_polygons','source':A,'image':B})
 p.mc('Sine chain derivative',f'y=sin({k}x) функцийн уламжлалыг ол.',f'{k}cos({k}x)','Гадаад sin-ийн уламжлал cos, дотоодынх k.',[f'cos({k}x)',f'−{k}sin({k}x)',f'{k}sin({k}x)',f'cos(x)/{k}'])
 p.mc('Fraction arithmetic',f'({k}/30) ÷ (7/6−7/8)-ын утгыг ол.',F(4*k,35),'7/6−7/8=7/24. Ноогдвор k/30·24/7.')
 p.mc('Ratio substitution',f'a/{k}=b/{k+1}, a,b≠0. (3a−b)/(a+2b)-г ол.',F(2*k-1,3*k+2),'a=kt,b=(k+1)t гэж орлуулж t-г хураа.')
 p.mc('Radical product equation',f'({k}x+{3*k})√(x−{k})=0-г бод.',k,'x≥k тул шугаман үржигдэхүүний x=−3 язгуур тохирохгүй. Язгуурт үржигдэхүүнээс x=k.')
 p.mc('Median length',f'A(2,−2),B(3,−2),C({2*k-6},{2*k}) гурвалжны B оройн медианы уртыг ол.',S.sqrt((k-5)**2+(k+1)**2),'AC-ийн дундаж (k−2,k−1). B-ээс координатын зөрөө (k−5,k+1).',distinct_from(S.sqrt((k-5)**2+(k+1)**2),[S.sqrt((k-5)**2+(k-1)**2),S.sqrt((k-2)**2+(k+1)**2),abs(k-5)+abs(k+1),S.sqrt((k-5)**2+(k+3)**2),2*S.sqrt((k-5)**2+(k+1)**2)]))
 N=60+15*v;count=sum(n%3==0 or n%5==0 for n in range(1,N+1))
 p.mc('Union probability',f'1-ээс {N} хүртэлх натурал тооноос нэгийг сонгов. 3 эсвэл 5-д хуваагдах магадлалыг ол.',F(count,N),'3 ба 5-ын үржвэрүүдийг нэмж, 15-ын үржвэрийг нэг удаа хас.')
 p.mc('Cylinder square axial section',f'Цилиндрийн суурийн талбай {k*k}π. Тэнхлэг огтлол квадрат бол өндрийг ол.',2*k,'Суурийн радиус k; квадрат огтлолын өндөр диаметртэй тэнцүү.')
 p.mc('Log tangent slope',f'f(x)=ln(x+2). x={k+1} дээрх шүргэгчийн налалтыг ол.',F(1,k+3),'f′(x)=1/(x+2).')
 p.mc('Sine rule',f'ABC гурвалжны ∠A=30°,∠C=105°, AC={2*k}. BC-г ол.',f'{k}√2','∠B=45°; BC=AC sin30°/sin45°.',[f'{2*k}√2',f'{k}√3',f'{k}',f'{k}√6'])
 z=S.simplify((k+S.I)/(2-S.I));re,im=S.re(z),S.im(z)
 p.mc('Complex quotient',f'({k}+i)/(2−i)-г a+bi хэлбэрт бич.',f'{re}+({im})i','Хүртвэр, хуваарийг 2+i хосмогоор үржүүл. Хуваарь 5.',[f'{re}−({im})i',f'−{re}+({im})i',f'{2*k}+i',f'{re}+({im+1})i'])
 p.mc('Discrete expectation',f'X нь {k},{k+1},{k+2} утгуудтай; магадлалууд 1/8,a,3/4. E(X)-г ол.',F(8*k+13,8),'Магадлалын нийлбэрээс a=1/8. E=Σxp.')
 p.mc('Dot product parameter',f'a=(3,−2,t), b=(t+1,4,2), a·b={5*k-5}. t-г ол.',k,'3(t+1)−8+2t=5t−5.')
 p.mc('Antiderivative initial value',f'f′(x)=4x−{k}, f(0)=−3. f(x)-г ол.',f'2x²−{k}x−3','Гишүүн бүрийг интегралчилж, f(0)-оос тогтмолыг ол.',[f'4x²−{k}x−3',f'2x²+{k}x−3',f'2x²−{k}x+3',f'4x−{k}'])
 a=9*k*k;b=7*k*k
 p.mc('Radical simplification',f'a={a},b={b} үед ((a−b)/(a+b))√((a²+ab)/(a²−2ab+b²))-г ол.',F(3,4),'a>b>0 тул √((a−b)²)=a−b. Нийт √(a/(a+b))=3/4.')
 p.mc('Geometric middle term',f'Эерэг геометр прогрессийн b₃={2*k}, b₉={16*k}. b₆-г ол.',f'{4*k}√2','b₆²=b₃b₉=32k²; эерэг язгуурыг ав.',[f'{8*k}',f'{2*k}√2',f'{8*k}√2',f'{4*k}'])
 # Translate the solvable log system to keep branch and domain checks.
 p.mc('Logarithmic system',f'log₂(x−{v})=log₂(y+2), 2y²−(x−{v})²=17 системийн шийдийг ол.',(v+9,7),'u=x−v=y+2>0. 2y²−(y+2)²=17 →y=7 эсвэл −3; зөвхөн 7 домэйнд орно.',[(v-1,-3),(v+7,9),(v+9,-7),(v+2,0)])
 p.mc('Polynomial factorization',f'P(x)=x²+2x+c-ийн нэг язгуур −{k}. Үржигдэхүүнд задал.',f'(x+{k})(x−{k-2})','Язгууруудын нийлбэр −2 тул хоёр дахь нь k−2.',[f'(x−{k})(x+{k-2})',f'(x+{k})(x+{k-2})',f'(x−{k})(x−{k-2})',f'(x+{k})²'])
 # Shift source composition equation; the two roots remain simple.
 p.mc('Function composition equation',f'f(x)=x−{k}, g(x)=x²+3. g(f(x))=x−{k}+3 тэгшитгэлийг бод.',f'{{{k}; {k+1}}}','u=x−k гэвэл u²+3=u+3; u=0,1.',[f'{{{k-1}; {k}}}',f'{{{k}; {k+2}}}',f'{{−{k}; {k+1}}}',f'{{{k+1}}}'])
 p.mc('Trig rational identity',f'tan α={k}. (cosα/(1+sinα)+(1+sinα)/cosα)²-г ол.',4*(1+k*k),'Хаалт дотор 2/cosα; квадрат нь 4sec²α=4(1+tan²α).')
 p.mc('Tangential right trapezoid',f'Радиус {2*k} тойргийг багтаасан тэгш өнцөгт трапецийн сууриудын зөрүү {3*k}. Периметрийг ол.',18*k,'Өндөр 4k, налуу хажуу 5k. Багтсан тойрогтой тул сууриудын нийлбэр хажуу талуудын нийлбэр 9k.')
 p.mc('Exponential definite integral',f'∫[0→1](e^x−{k})/e^x dx-г ол.',f'{1-k}+{k}/e','Интегралын эх функц x+k e^(−x).',[f'{1+k}−{k}/e',f'1−{k}/e',f'{k}−1/e',f'{1-k}−{k}/e'])
 a=k;b=k-1
 p.mc('Transform triangle area',f'A({a},{b})-г төв O, коэффициент −2 гомотетоор B, харин Oy тэнхлэгээр тольдоход C цэг үүсэв. ABC талбайг ол.',3*a*b,'B=(−2a,−2b), C=(−a,b). AC=2a, түүнд буусан өндөр 3b.')
 values1=[k,k+1,k+2,k+3,k+4];values2=[k-1,k+1,k+2,k+3,k+5];vals=values1+values2;mean=S.Rational(sum(vals),10);sd=S.sqrt(sum(S.Rational(t*t) for t in vals)/10-mean**2)
 p.mc('Combined standard deviation',f'Хоёр баг тус бүр 5 тоглогчтой. Эхний багийн Σx={sum(values1)},Σx²={sum(t*t for t in values1)}; нөгөөгийн Σy={sum(values2)},Σy²={sum(t*t for t in values2)}. Арван тоглогчийн стандарт хазайлтыг ол.',sd,'Нийлбэр ба квадратуудын нийлбэрийг нэгтгэ. σ²=Σz²/10−(Σz/10)².',distinct_from(sd,[sd**2,S.sqrt(sum(S.Rational(t*t) for t in vals)/10),sd*S.sqrt(S.Rational(10,9)),sd/2,2*sd]))
 p.mc('Area between parabolas',f'y=−(x−{v}+1)²+{k+3}, y=(x−{v}−1)²+{k-7} параболуудын хоорондох талбайг ол.',S.Rational(64,3),'u=x−v. Дээд−доод=8−2u²; огтлол u=±2. Интеграл 64/3.')
 p.mc('Exactly three integer solutions',f'a>0. (x−{v})²−(a−1)(x−{v})−a<0 яг гурван бүхэл шийдтэй байх a мужийг ол.','(2; 3]','u=x−v: (u+1)(u−a)<0 →−1<u<a. Бүхэл u=0,1,2 л байхын тулд 2<a≤3.', ['[2; 3)','[2; 3]','(3; 4]','(1; 2]'])
 p.mc('Circle tangent to line',f'Төв O(0,0), 2x+√5y−{2*k}√5=0 шулууныг шүргэх тойргийн тэгшитгэлийг ол.',f'x²+y²={F(20*k*k,9)}','Төвөөс шулуунд хүртэлх зай 2k√5/3 радиустай.',[f'x²+y²={20*k*k}',f'x²+y²={F(4*k*k,9)}',f'x²+y²={F(10*k*k,9)}',f'x²+y²={F(20*k*k,3)}'])
 red=k;white=k+1;N=red+white
 variance=F(2*white*red*(N-2),N*N*(N-1))
 p.mc('Hypergeometric variance',f'Уутанд {red} улаан,{white} цагаан бөмбөг байна. Буцаахгүйгээр хоёрыг сонгоход цагаан бөмбөгийн тоог X гэв. Var(X)-г ол.',variance,'P(X=j)-г C(white,j)C(red,2−j)/C(N,2)-оор олж E(X²)−E(X)²-г тооц.')
 r=k;s=k+1
 p.mc('Parallelogram vector intersection',f'OABC параллелограммын BC тал дээр BE:EC={r}:{s}. AC ба OE нь M дээр огтолно. OA=a,OC=c. OM-г илэрхийл.',f'({s}a+{r+s}c)/{r+2*s}','O эх, B=a+c. E=c+s a/(r+s). AC дээрх коэффициентүүдийн нийлбэр 1 байхыг ашигла.',[f'({r}a+{r+s}c)/{2*r+s}',f'({s}a+{r}c)/{r+s}',f'({r+s}a+{s}c)/{r+2*s}',f'({s}a+{r+s}c)/{r+s}'])
 # CRT remainder with a shifted desired remainder; all degrees preserved.
 R=x*x+v*x+k
 a=S.expand(R).subs(x,-1);rem=S.rem(R,x*x-x+1)
 p.mc('Polynomial remainder reconstruction',f'P(x)-ийг x+1-д хуваахад {a}, x²−x+1-д хуваахад {val(rem)} үлдэнэ. Үржвэр (x+1)(x²−x+1)-д хуваах үлдэгдлийг ол.',S.expand(R),'R=A(x²−x+1)+(өгсөн шугаман үлдэгдэл) гэж тавь. R(−1)-ээр A-г ол.',distinct_from(S.expand(R),[S.expand(rem),S.expand(x*x-v*x+k),S.expand(x*x+v*x-k),S.expand(2*x*x+v*x+k),S.expand(x*x+(v+1)*x+k)]))
 C=v+3;t=-v-1;center=v+2;K=center+3
 p.multi('2.1','Parametric quadratic vertex extrema and translation',f'f(x)=x²−2tx+t²−t+{C}. Параметрийг t гэе.',[(f't={t} үеийн орой',(t,C-t)),(f't={t} үед [{t-2};{t+1}] дээрх хамгийн бага,их утга',(C-t,C-t+4)),('Ox тэнхлэгийг шүргэх t',C),(f'Графикийг 3 нэгж зүүн, 1 нэгж дээш зөөхөд y=(x−{center})²−1 болох t',K)],'f=(x−t)²+C−t. Тэнхлэг шүргэхэд C−t=0. Сүүлийн нөхцөлд шинэ оройн x=t−3=center, y=C−t+1=−1.')
 scale=v+1;L=9*scale
 p.multi('2.2','Box volume optimization',f'Тэгш өнцөгт хайрцгийн 12 ирмэгийн уртын нийлбэр {4*L}. Урт нь өргөнөөс хоёр дахин их. Өргөн x.', [('Урт+өргөн+өндөр',L),('Эзлэхүүний функц',f'{2*L}x²−6x³'),('x-ийн муж',f'(0;{L//3})'),('Эзлэхүүн ихсэх үеийн x',2*scale),('Хамгийн их эзлэхүүн',24*scale**3)],'Өндөр L−3x. V=2x²(L−3x). V′=4Lx−18x²; x=2L/9. Хилийн эзлэхүүн 0.')
 scale=v+1
 p.multi('2.3','Triangular pyramid dihedral angle',f'Пирамидын суурь {5*scale},{12*scale},{13*scale} талтай гурвалжин. Хажуу талс бүр суурьтай 60° өнцөг үүсгэнэ.', [('Суурийн талбай',30*scale**2),('Багтсан тойргийн радиус',2*scale),('Бүтэн гадаргуугийн талбай',90*scale**2),('Эзлэхүүн',f'{20*scale**3}√3')],'Суурь тэгш өнцөгт, S=30s²; r=S/p=2s. Өндөр r tan60°=2s√3. Хажуу талбай S/cos60°=2S; эзлэхүүн Sh/3.')
 left=[1,2,4,5,4][v-1];step=v+1;prob=F(left,6);ps=[F(math.comb(3,j))*prob**j*(1-prob)**(3-j) for j in range(4)];j=max(range(4),key=lambda j:ps[j])
 p.multi('2.4','Biased random walk',f'Цэг O-оос эхэлнэ. Шударга шооны {left} буюу түүнээс бага нүд буувал зүүн {step} нэгж, бусад үед баруун {step} нэгж шилжинэ.', [('Нэг алхмын дараа зүүн талд байх магадлал',prob),('Хоёр алхмын дараа O-д ирэх магадлал',2*prob*(1-prob)),('Гурван алхмын дараах байрлалын тоо',4),('Хамгийн магадлалтай эцсийн координат',(3-2*j)*step),('Тэр байрлалын магадлал',ps[j])],'Зүүн алхмын тоо J нь Bin(3,p). Байрлал (3−2J)·step, P(J=j)=C(3,j)p^j(1−p)^(3−j).')
 p.save()

if __name__=='__main__':
 for v in range(1,6):make(v)
