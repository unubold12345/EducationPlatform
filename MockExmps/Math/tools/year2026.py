from common import *

def make(v):
 p=Paper(2026,v);k=v+2
 p.mc('Radical exponent simplification',f'(y^(1/{2*k}))²/y, y>0, илэрхийллийг нэг зэрэгт бич.',f'y^({F(1,k)-1})','Язгуурын зэргийг 2/(2k)=1/k гэж бичээд −1-ийг нэм.',[f'y^({F(1,2*k)-1})',f'y^({-F(1,k)})',f'y^({1+F(1,k)})',f'y^({F(1,k)})'])
 n=[6,7,8,10,11][v-1]
 p.mc('Compare irrational values',f'√{n}−1,−√{n}+1,−√{n}−1,1/√{n},1^(√{n}+1) тоонуудаас хамгийн ихийг сонго.',f'√{n}−1','n>4 тул √n−1>1; бусад утгууд ≤1.',[f'−√{n}+1',f'−√{n}−1',f'1/√{n}',f'1^(√{n}+1)'])
 p.mc('Power antiderivative',f'∫{k+2}x^{k+1} dx-г ол.',f'x^{k+2}+C','Зэргийг нэгээр нэмээд шинэ илтгэгчид хуваана.',[f'{k+2}x^{k+2}+C',f'x^{k+1}+C',f'{(k+1)*(k+2)}x^{k}+C',f'x^{k+2}/{k+2}+C'])
 p.mc('Absolute equation roots sum',f'|3t−{k}|={k+2} тэгшитгэлийн шийдүүдийн нийлбэрийг ол.',F(2*k,3),'Хоёр тэгшитгэл 3t−k=±(k+2); шийдүүд k/3 цэгээс тэнцүү зайтай.')
 p.mc('Vector equality parameter',f'A({k+2},x,4),B({k+5},1,y),a=(3,{2*k+7},9). AB=a байх x-г ол.',-2*k-6,'AB-ийн хоёр дахь координат 1−x=2k+7.')
 p.mc('Round robin count',f'Шатрын тэмцээнд {k+6} тоглогч оролцож,хос бүр нэг удаа тоглов. Тоглолтын тоог ол.',math.comb(k+6,2),'Тоглогчдын эрэмбэгүй хосын тоо C(n,2).')
 theta=min(42,20+5*v)
 p.mc('Tangent chord angle to central angle',f'O төвтэй тойргийн A дээрх шүргэгч PA. PO хэрчим B дээр тойргийг огтолно. ∠PAB={theta}°. Бага ∠AOB-г ол.',2*theta,'Шүргэгч-хөвчийн өнцөг нь тухайн бага нумын төв өнцгийн хагас.')
 p.mc('Boxplot interquartile range',f'Хайрцган диаграммын min={k},Q₁={k+2},медиан={k+5},Q₃={k+9},max={k+14}. Квартил хоорондын далайцыг ол.',7,'Q₃−Q₁=7.',figure={'kind':'boxplot','minimum':k,'lowerQuartile':k+2,'median':k+5,'upperQuartile':k+9,'maximum':k+14})
 angle=[15,75,165,195,255][v-1];answer=S.simplify(S.sin(S.pi*angle/180))
 p.mc('Angle addition sine',f'sin({angle}°)-ын яг утгыг ол.',answer,'15°=45°−30°,75°=45°+30°; бусад өнцгийг эдгээрт шилжүүлж тэмдгийг харгалз.',[a for a in [S.simplify((S.sqrt(6)+S.sqrt(2))/4),S.simplify((S.sqrt(6)-S.sqrt(2))/4),S.simplify(-(S.sqrt(6)+S.sqrt(2))/4),S.simplify(-(S.sqrt(6)-S.sqrt(2))/4),S.sqrt(3)/2] if a!=answer])
 a=k+1
 p.mc('Cubic quartic rational cancellation',f'(({a*a}m³+{a}m²n+mn²)/({a*a}m²+n²)) ÷ (({a**3}m³−n³)/({a**4}m⁴−n⁴))-г хялбарчил. Анхны илэрхийлэл тодорхой утгуудад.',f'{a}m²+mn','t=am. Кубын ялгавар (t−n)(t²+tn+n²), дөрөвдүгээр зэргийн ялгавар (t−n)(t+n)(t²+n²)-г хэрэглэ.',[f'{a}m²−mn',f'{a}m+n',f'm/({a}m+n)',f'{a*a}m²+mn'])
 scale=v+1
 p.mc('Complex quotient modulus',f'|({3*scale}−{5*scale}i)/(4+i)|-ийг ол.',f'{scale}√2','Ноогдворын модуль нь модулиудын ноогдвор: s√34/√17=s√2.',[f'{scale}√17',f'{scale}√34',f'{2*scale}',f'{scale}/√2'])
 gap=F(17*(k+1),10)
 p.mc('Catch up mixed fraction speeds',f'Эхний аялагч 13/3 км/ц,араас нь нөгөө нь 23/4 км/ц хурдтай явна. Анхны зай {gap} км. Хэдэн цагийн дараа гүйцэх вэ?',F(6*(k+1),5),'Харьцангуй хурд 23/4−13/3=17/12. t=зай/(17/12).')
 p.mc('Logarithmic arithmetic difference',f'Арифметик прогрессийн a₁=log₃{k+2},a₇=log₃{81*(k+2)}. Ялгаврыг ол.',F(2,3),'a₇−a₁=log₃81=4; 6d=4.')
 weights=[k,k+8,k+3];N=sum(weights);mean=F(5*weights[0]+15*weights[1]+25*weights[2],2*N)
 p.mc('Grouped mean',f'Хүлээлгийн минутын [0;5),[5;10),[10;15) завсрын үйлчлүүлэгчдийн тоо {weights}. Ангийн төвөөр дундаж хугацааг ол.',mean,'Ангийн төвүүд 2.5,7.5,12.5. Давтамжаар жигнэсэн нийлбэрийг нийт тоонд хуваа.')
 p.mc('Parametric derivative',f'x=3t²−{4*k}t,y=t³−{k}t². dx/dt≠0 үед dy/dx-г ол.','t/2','dy/dt=t(3t−2k), dx/dt=2(3t−2k); ноогдвор t/2.', ['2t','t²/2','1/(2t)','t/3'])
 p.mc('Circle center from equidistance',f'O({8+v},b) төвтэй тойрог A({3+v},2),B({1+v},6) цэгүүдийг дайрна. b-г ол.',7,'OA²=OB²: 25+(b−2)²=49+(b−6)² →8b=56.')
 end=3*(k+2)**2
 p.mc('Antiderivative difference at roots',f'f′(x)=1/√(3x),f(3)=0. f({end})-г ол.',2*k+2,'Эх функц (2/3)√(3x)+C. Утгын зөрөө (2/3)[3(k+2)−3].')
 length=F(19*k,5)
 p.mc('Three segment ratios',f'{length} м туузыг I:II=4:5,II:III=1:2 харьцаатай хуваав. Хамгийн урт хэсгийг ол.',2*k,'Нэгдсэн харьцаа4:5:10,нийт19. Урт хэсэг10/19 нийт урт.')
 p.mc('Separable differential equation',f'dy/dx={2*k}x/y-ийн ерөнхий шийдийг ол.',f'y²={2*k}x²+C','y dy=2k x dx; интегралдаад 2-оор үржүүл.',[f'y²={k}x²+C',f'y²=−{2*k}x²+C',f'y={2*k}x²+C',f'y²={2*k}x+C'])
 p.mc('Expectation unknown probabilities',f'X нь {k},{k+1},{k+2} утгыг a,b,3/10 магадлалаар авна. E(X)={F(5*k+6,5)}. a-г ол.',F(1,10),'a+b=.7. Дундаж k+b+.6=k+1.2 →b=.6,a=.1.')
 p.mc('Cosine transformation statements',f'y−{k}=cos2x. (1) π үетэй; (2)0≤y≤2; (3)O төвийн хувьд тэгш хэмтэй; (4)cos2x графикийг (0,{k})-ээр зөөсөн. Үнэн дүгнэлтүүдийг сонго.','1,4','Үеπ,утгын муж[k−1,k+1],Oy-ийн хувьд тэгш хэмтэй; босоо шилжилт k.', ['1,2','2,3','1,3,4','1,2,4'])
 p.mc('Polynomial quotient coefficient sum',f'P(x)=12x⁸+x⁷+2x⁶+{k+5}x. P(x)=(x+1)Q(x)+c бол Q-ийн коэффициентүүдийн нийлбэрийг ол.',k+6,'c=P(−1)=8−k. Q(1)=[P(1)−c]/2=[20+k−8+k]/2=k+6.')
 first=[S.Matrix([[0,1],[-1,0]]),S.Matrix([[0,-1],[1,0]]),S.Matrix([[0,1],[-1,0]]),S.Matrix([[0,-1],[1,0]]),S.Matrix([[0,1],[-1,0]])][v-1]
 second=[S.Matrix([[0,-1],[-1,0]]),S.Matrix([[0,-1],[-1,0]]),S.Matrix([[0,1],[1,0]]),S.Matrix([[0,1],[1,0]]),S.diag(1,-1)][v-1]
 rotname='цагийн зүүний дагуу' if v in [1,3,5] else 'цагийн зүүний эсрэг';mirror=['y=−x','y=−x','y=x','y=x','Ox'][v-1];M=second*first;ans=str(M.tolist());candidates=[S.diag(1,-1),S.diag(-1,1),S.eye(2),-S.eye(2),S.Matrix([[0,1],[1,0]]),S.Matrix([[0,-1],[-1,0]])]
 p.mc('Rotation then reflection matrix',f'O төвтэй {rotname}90° эргүүлээд {mirror}-ийн хувьд тольдоно. Нийлмэл матрицыг ол.',ans,'Баганан векторын хувьд хоёр дахь матриц эхний матрицын зүүнээс үржигдэнэ.',[str(a.tolist()) for a in candidates if a!=M][:4])
 p.mc('Interval containment parameter',f'n>0. A:|x−{k}|≤n, B:(x−{k-8})(x−{k+4})≤0. A⊂B байхаар n-ийн мужийг ол. Энд ⊂ нь дэд олонлог гэсэн утгатай.','(0;4]','B=[k−8,k+4],A=[k−n,k+n]. n≤8 ба n≤4 тул 0<n≤4.', ['(0;4)','[4;8]','(0;8]','[4;+∞)'])
 aa,bb,cc=[(4,3,5),(12,5,13),(15,8,17),(24,7,25),(21,20,29)][v-1]
 p.mc('Half angle inverse sine',f'tan((1/2)arcsin({aa}/{cc}))-г ол.',F(aa,cc+bb),'θ=arcsin(a/c) хурц; cosθ=b/c. tan(θ/2)=sinθ/(1+cosθ).')
 p.mc('Log tangent slope',f'f(x)=ln(2x−1). x={k+2} дээрх шүргэгчийн налалтыг ол.',F(2,2*k+3),'f′(x)=2/(2x−1).')
 scale=v+1
 p.mc('Mixture percentage point decrease',f'{72*scale} кг зэс-төмрийн хайлшид {18*scale} кг төмөр нэмэхэд зэсийн хувь 12.5 хувийн нэгжээр буурав. Анхны зэсийн массыг ол.',45*scale,'Зэс c хадгалагдана. c/(72s)−c/(90s)=1/8; c=45s.')
 p.mc('Discrete variance',f'X-ийн утгууд {v},{v+1},{v+2}, магадлалууд2/7,4/7,1/7. Var(X)-г ол.',F(20,49),'X-ээс v-г хасахад дисперс хадгалагдана. E(Y)=6/7,E(Y²)=8/7; ялгавар20/49.')
 n=5*(v+2);j=2*(v+2)
 p.mc('Constant term binomial',f'(x²−1/x³)^{n} задаргааны сул гишүүнийг ол.',f'C({n},{j})','Ерөнхий гишүүний x зэрэг2n−5j; тэгтэй тэнцүүлбэл j=2n/5. j тэгш тул тэмдэг эерэг.',[f'−C({n},{j})',f'C({n},{j-1})',f'C({n},{j+1})',f'C({n},2)'])
 R=k+1
 p.mc('Line tangent to circle parameter',f'y−x−t=0,x²+y²={R*R} систем яг нэг бодит шийдтэй байх t-ийн бүх утгыг ол.',f'{{−{R}√2;{R}√2}}','Төвөөс шулуунд зай |t|/√2 радиустай R тэнцүү.',[f'{{−{R};{R}}}',f'{{−{2*R};{2*R}}}',f'{{{R}√2}}',f'{{0}}'])
 w=k+2;h=k+4
 p.mc('Plane equation through pyramid face',f'M(0,0,0),N({w},0,0),P({w},{h},0),Q(0,{h},0) суурьтай пирамидын S({w-1},2,4). NPS хавтгай ax+by+cz−{4*w}=0. a+b+c-г ол.',5,'N,P-ийг орлуулбал a=4,b=0. S-ээс c=1.')
 p.mc('Exponential productivity maximum',f'E(t)=(12+t e^(−2t/{k+7}))/2,0≤t≤24. Хамгийн их бүтээмжтэй агшныг ол.',F(k+7,2),'E′=e^(−2t/(k+7))(1−2t/(k+7))/2; тэмдэг +→− солигдоно.')
 trace=k+2
 p.mc('Matrix inverse relation',f'A=[[x,−3],[−2,y]], A−3A⁻¹={trace}I. x²+y²-г ол.',trace*trace-6,'Диагональ бус гишүүдээс detA=−3→xy=3; диагоналиас x+y=trace. Тэгвэл x²+y²=trace²−6.')
 initial=100*(k+8);time=6+v
 p.mc('Exponential decay initial value',f'Туршилтын бодисын хэмжээ V′=−0.4V,V(0)={initial} мг. {time} цагийн дараах хэмжээг яг утгаар ол.',f'{initial}e^({-F(2*time,5)})','V(t)=V₀e^(−0.4t). Өгсөн хугацааг орлуул.',[f'{initial}e^({F(2*time,5)})',f'{initial}e^({-F(time,5)})',f'{initial}e^({-F(4*time,5)})',f'{initial-time}'])
 scale=v+1
 p.mc('Circle tangent in right trapezoid area',f'AB∥DC,AD⊥AB тэгш өнцөгт трапецад AB:DC=7:5,дундаж шугам {30*scale},AD={18*scale}. Тойрог AB-г M,AD-г N дээр шүргэж,C-г дайрна; DC-ийн нөгөө огтлол L. M,N нь талууд дээр оршино. AMLD талбайг ол.',126*scale*scale,'AB=35s,DC=25s. Төв(r,r),C=(25s,18s) нөхцөлөөс r=13s эсвэл73s; M тал дээр тул13s. L=(s,18s). S=(13s+s)18s/2.')
 t=k+2;ratio=F(t-4,2*t-3);A=2-ratio;cos=S.Rational(ratio.numerator,ratio.denominator)/S.sqrt(S.Rational(A.numerator,A.denominator))
 p.mc('Vector orthogonality angle',f'a+2b ⟂ a−b, 2a−b ⟂ a+{t}b. a,b нь тэгээс ялгаатай. cos∠(a,b)-г ол.',S.simplify(cos),'U=|a|²,V=|b|²,W=a·b. U+W−2V=0,2U+(2t−1)W−tV=0. W/V=(t−4)/(2t−3), U/V=(3t−2)/(2t−3); cos=W/√UV.',wrong=[S.simplify(-cos),S.simplify(2*cos),S.simplify(cos/2),S.simplify(1-cos)])
 h=v
 p.multi('2.1','Rational inverse range fixed points',f'u=x−{h},f(x)={h}+(3u−4)/(u−2).', [('Мужаас хасагдах x',h+2),(f'f({h+3})',h+5),(f'f⁻¹({h+5})',h+3),('Урвуу функц',simplest(h+(2*(x-h)-4)/(x-h-3))),('Утгын мужаас хасагдах y',h+3),('f ба f⁻¹ графикийн огтлолцлын x',(h+1,h+4))],'Суурь функц v=(3u−4)/(u−2). Урвуу u=(2v−4)/(v−3). Тогтмол цэгүүд u²−5u+4=0→u=1,4.')
 scale=v+1
 p.multi('2.2','Cube plane section and angle',f'ABCDA₁B₁C₁D₁ кубийн B₁C₁-ийн дундаж N;CC₁ дээр C₁M=2MC. MN={5*scale}.', [('Кубийн ирмэг',6*scale),('AMN огтлолын өнцгийн тоо',5),('AN',9*scale),('AM²',76*scale*scale),('cos∠NAM','11√19/57')],'Ирмэг a гэвэл MN²=(a/2)²+(2a/3)²=25a²/36. Координат A=0,N=(6s,3s,6s),M=(6s,6s,2s). AN=9s,AM²=76s²,скаляр үржвэр66s². Хавтгай −5x+4y+3z=0 кубийг таван оройд огтолно.')
 a=v+4;alpha=3*a;lo=alpha-8;hi=alpha-5
 p.multi('2.3','Parabola line area function',f'y={alpha}x−3x² ба y=tx, t<{alpha}. Хоорондох талбай S(t).', [('Тэгээс өөр огтлолын x',f'{a}−t/3'),('S(t)',f'({alpha}−t)³/54'),('Парабол ба Ox хоорондох талбай',F(a**3,2)),(f'y={lo}x,y={hi}x ба параболоор хүрээлсэн талбай',F(43,6))],'Ялгавар x(3a−t−3x). Интеграл (3a−t)³/54. Сүүлчийн хэсэг S(lo)−S(hi)=(8³−5³)/54=43/6.')
 q=F(30+5*v,100);d1=F(v+1,100);d2=F(v+2,100);total=q*d1+(1-q)*d2
 p.multi('2.4','Total probability Bayes production',f'Бүтээгдэхүүний {30+5*v}%-ийг I,үлдсэнийг II цех үйлдвэрлэнэ. Гологдлын магадлалууд харгалзан {d1},{d2}. Бүтээгдэхүүн бүр ижил сонголттой.', [('II цехийн бүтээгдэхүүн байх магадлал',1-q),('Гологдол байх магадлал',total),('Гологдол бүтээгдэхүүн II цехийнх байх магадлал',(1-q)*d2/total)],'Нийт магадлал q·d₁+(1−q)d₂. Байесын хүртвэр (1−q)d₂; нийт гологдлын магадлалд хуваа.')
 p.save()

if __name__=='__main__':
 for v in range(1,6):make(v)
