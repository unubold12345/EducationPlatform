from common import *

def make(v):
    p=Paper(2017,v,'D');k=v+2
    dec=[125,375,625,875,225][v-1]
    p.mc('Decimal fraction',f'0.{dec:03} аравтын бутархайг энгийн бутархай болго.',F(dec,1000),'Гурван аравтын орон тул 1000-д хувааж хураана.')
    p.mc('Principal root',f'A=√{(k+3)**2}−1. A-г ол.',k+2,'Эерэг квадрат язгуур нь k+3.')
    p.mc('Power of a power',f'((−{k}²)³) утгыг зэрэг хэлбэрээр бич.',f'−{k}⁶','Сөрөг тооны сондгой зэрэг сөрөг; (k²)³=k⁶.',[f'{k}⁶',f'−{k}⁵',f'{k}⁵',f'{k}^(−6)'])
    p.mc('Difference of squares fraction',f'(c²−{k*k})/(c+{k})-г хураа, c≠−{k}.',f'c−{k}','(c−k)(c+k)/(c+k)=c−k.',[f'c+{k}',f'c−{k*k}',f'c²−{k}',f'1/(c−{k})'])
    p.mc('Square root of square',f'√({k}²)−√((−{k})²)-г хялбарчил.',0,'√(a²)=|a| тул k−k=0.')
    p.mc('Opposite parallel vectors',f'a=({4*k},−{k}), b=(−4,1). Ямар хамааралтай вэ?','Эсрэг чиглэлтэй параллель','a=−k b бөгөөд k>0.', ['Ижил чиглэлтэй параллель','Перпендикуляр','a=b','a=−b'])
    p.mc('Percentage of a book',f'Сурагч өгүүллэгийн 25%-ийг уншаад нэмж {k+7} хуудас уншихад нийт 37.5% болов. Нийт хуудасны тоог ол.',8*(k+7),'Нэмсэн хуудас нь 12.5%=1/8 хэсэг.')
    p.mc('Complement probability',f'Багийн гишүүдийн {60+5*v}% нь эмэгтэй. Нэгийг жигд сонгоход эрэгтэй байх магадлалыг ол.',F(40-5*v,100),'100%-аас эмэгтэй гишүүдийн хувийг хас.')
    dist=150+3*v
    p.mc('Scientific units speed',f'Гэрлийн хурд 3×10⁸ м/с. Нарнаас {dist} сая км зайд буй хэмжигчид гэрэл хэдэн секундэд хүрэх вэ?',F(dist*10,3),'Сая км-ийг 10⁹ м болгон хувирга. t=d/c.')
    N=k+6
    p.mc('Splitting teams',f'{N} хүнийг 2 хүнтэй ба {N-2} хүнтэй хоёр багт хэдэн янзаар хувааж болох вэ?',math.comb(N,2),'Хоёр хүнтэй багийн гишүүдийг сонговол нөгөө баг тогтоно.')
    p.mc('Repeated root parameter',f'x²+{2*k}x+{k+3}−a=0 тэнцэтгэлийн язгуурууд тэнцүү. a-г ол.',k+3-k*k,'Дискриминант 4k²−4(k+3−a)=0.')
    aa,bb,cc=[(4,3,5),(12,5,13),(15,8,17),(24,7,25),(21,20,29)][v-1]
    p.mc('Quadrant trig',f'tan α={aa}/{bb}, π<α<3π/2. cos α-г ол.',F(-bb,cc),'1+tan²α=1/cos²α; III мөчид cos сөрөг.')
    digitsum=8+v
    p.mc('Two digit algebra',f'a,b нь тэгээс ялгаатай цифр, a+b={digitsum}. ab̅+ba̅+aa̅+bb̅ нийлбэрийг ол. Энд ab̅=10a+b.',22*digitsum,'Гишүүн бүрийг аравт ба нэгжээр задлахад 22(a+b).')
    p.mc('Sine rule',f'ABC гурвалжны ∠B=75°, ∠C=45°, BC={k+3}. AB-г ол.',f'{k+3}√6/3','∠A=60°, AB=BC sin45°/sin60°=BC√6/3.',[f'{k+3}√3/2',f'{k+3}√2/2',f'{k+3}√6/2',f'{2*(k+3)}√6/3'])
    p.mc('Exponential integral',f'∫{k}e^({k}x)dx-г ол.',f'e^({k}x)+C','e^(kx)-ийн уламжлал k e^(kx).',[f'{k}e^({k}x)+C',f'e^({k}x)/{k}+C',f'e^x+C',f'{k*k}e^({k}x)+C'])
    # Compare a non-power argument with a nearby exact power.
    p.mc('Logarithm comparison',f'a=log₈{23+v}, b=log₂(1/2), c=log₄8. Эдгээрийг өсөхөөр эрэмбэл.','b<c<a','b=−1, c=3/2. 8^(3/2)=16√2<24 тул a>3/2.', ['b<a<c','a<b<c','c<a<b','a<c<b'])
    a=F(k,10);b=F(k+1,10)
    p.mc('Independent misses',f'Хоёр тоглогч байг онох магадлал {a}, {b}. Бие биеэс үл хамааран нэг нэг удаа буудахад хоёулаа алдах магадлалыг ол.',(1-a)*(1-b),'Алдах магадлалуудыг үржүүл.')
    p.mc('Largest integer exponential inequality',f'5^((x−{k})²−3(x−{k}))≤5²⁸ тэнцэтгэл бишийн хамгийн их бүхэл шийдийг ол.',k+7,'u²−3u−28=(u−7)(u+4)≤0 →−4≤u≤7.')
    p.mc('Rational decreasing interval',f'y=1/({k*k}−x²) функц хаана буурах вэ?',f'(−∞; −{k}) ∪ (−{k}; 0)','y′=2x/(k²−x²)²; x<0 үед сөрөг, ±k дээр тодорхойгүй.',[f'(0; {k}) ∪ ({k}; +∞)',f'(−{k}; {k})',f'(−∞; 0)','R'])
    p.mc('Sequence from partial sums',f'Sₙ={k}n²+{k}n. Дарааллын төрлийг ба тогтмол ялгавар/харьцааг сонго.',f'Арифметик; d={2*k}','aₙ=Sₙ−Sₙ₋₁=2kn.',[f'Геометр; q={k}',f'Арифметик; d={k}',f'Геометр; q={2*k}',f'Арифметик; d={k*k}'])
    am=k+2;mc=k+6
    p.mc('Square diagonal point distance',f'ABCD квадратын AC диагональ дээр M цэг авч AM={am}, MC={mc} гэв. BM уртыг ол.',S.sqrt(S.Rational(am*am+mc*mc,2)),'Диагоналын дундаж O-оос B хүртэл (AM+MC)/2, OM=(MC−AM)/2. Пифагор хэрэглэ.',distinct_from(S.sqrt(S.Rational(am*am+mc*mc,2)),[S.sqrt(am*am+mc*mc),S.Rational(am+mc,2),(am+mc)/S.sqrt(2),S.sqrt(am*mc),S.Rational(mc-am,2)]))
    p.mc('Shifted trig squares',f'sin²(90°+x−{v}°)+3sin²(180°+x−{v}°)=2, {90+v}°≤x≤{180+v}°. Шийдийг ол.',f'{135+v}°','cos²x+3sin²x=2 →sin²x=1/2. Өгсөн завсарт x=135°.', ['90°','120°','150°','180°'])
    # f(ax+b)=(ax+b)^2−k, so derivative of f is 2t.
    a=k;b=k+2
    p.mc('Functional substitution derivative',f'f({a}x+{b})={a*a}x²+{2*a*b}x+{b*b-k}. f′(−{k})-г ол.',-2*k,'t=ax+b гэж орлуулбал f(t)=t²−k, уламжлал 2t.')
    p.mc('Circle from center and radius',f'Тойргийн төв O({k},4), радиус 2. Тэгшитгэлийг бич.',f'(x−{k})²+(y−4)²=4','(x−h)²+(y−j)²=r².',[f'(x+{k})²+(y−4)²=4',f'(x−{k})²+(y+4)²=4',f'(x−{k})²+(y−4)²=2',f'(x−{k})²+(y−4)²=16'],figure={'kind':'circle','center':[k,4],'radius':2})
    p.mc('Absolute quadratic symmetric roots',f'x²−{2*k+1}|x|+{k*(k+1)}=0 тэгшитгэлийн бодит шийдүүдийн нийлбэрийг ол.',0,'u=|x|≥0 үед (u−k)(u−k−1)=0; язгуурууд ±k,±(k+1).')
    N=2*(k+1)
    p.mc('Reciprocal ratio system',f'(x−2y)/(5x+2y)+(5x+2y)/(x−2y)=2, x−y={N}. xy-г ол.',-(k+1)**2,'t+1/t=2→t=1. x−2y=5x+2y→x=−y. Иймд x=N/2,y=−N/2.')
    p.mc('Two internally tangent circles',f'Дотоод шүргэлцсэн хоёр тойргийн ерөнхий шүргэгч TA. Түүн дээрх A нь тойргуудын нийтлэг шүргэлтийн цэг. T-ээс татсан өөр шулуун том тойргийг B,D цэгт огтолж, жижиг тойргийг C дээр шүргэнэ. Дараалал T,B,C,D; BC={k}, CD={2*k}. TA-г ол.',2*k,'TA=TC=TB+k. TA²=TB·TD; x²=(x−k)(x+2k)→x=2k.')
    p.mc('Vieta reciprocal sum',f'x³+{k}x²−4x−{4*k}=0-ийн язгуурууд x₁,x₂,x₃. 1/x₁+1/x₂+1/x₃-г ол.',F(-1,k),'Хос үржвэрийн нийлбэр −4, гуравласан үржвэр 4k; харьцаа −1/k.')
    p.mc('Cubic and line area',f'y={k}x³ ба y={k}x функцийн графикуудаар хязгаарлагдсан нийт талбайг ол.',F(k,2),'Огтлолууд −1,0,1. Тэгш хэмээр 2∫₀¹ k(x−x³)dx=k/2.')
    p.mc('Cosine limit',f'lim[x→0] x²/(cos({k}x)−1)-г ол.',F(-2,k*k),'cos t−1=−2sin²(t/2), sin t/t→1.')
    # Rotate both fixed points, leaving arcs unchanged; no change of difficulty.
    ang=15*v
    p.mc('Acute inscribed triangle probability',f'Нэгж тойрог дээр A нь {ang+45}°, B нь {ang-45}° туйлын өнцөгтэй. C цэгийг тойргийн уртын дагуу жигд сонгоход ABC хурц өнцөгт болох магадлалыг ол.',F(1,4),'Диаметруудаар эсрэг талд хязгаарлагдсан 90° нум дээр C байрлахад гурван өнцөг хурц. Магадлал 90/360.')
    p.mc('Coefficient in derivative',f'f(x)=(x²+{k}x)⁴ бол f′(x)-ийн x³ гишүүний коэффициентийг ол.',4*k**4,'f-ийн x⁴ гишүүн k⁴x⁴. Уламжлалын x³ гишүүн зөвхөн үүнээс үүснэ.')
    p.mc('Arithmetic geometric infinite series',f'Σ[n=0…∞] ({k}n+2)/3ⁿ нийлбэрийг ол.',F(3*k,4)+3,'Σrⁿ=1/(1−r)=3/2; Σnrⁿ=r/(1−r)²=3/4.')
    p.mc('Integer exponential equation',f'(x−{k}+1)^((x−{k})²−3(x−{k})+2)=1 тэгшитгэл хэдэн бүхэл шийдтэй вэ?',4,'u=x−k: суурь1 үед u=0; суурь−1 үед u=−2 ба зэрэг12; зэрэг0 үед u=1,2. Бусад боломжгүй.')
    p.mc('Minimum quadratic under linear constraint',f'2x+y={5*k} нөхцөлд x²+y²-ийн хамгийн бага утгыг ол.',5*k*k,'Коши: (4+1)(x²+y²)≥(2x+y)². Тэнцэл x=2k,y=k.')
    p.mc('Oblique cylinder cap volume',f'Радиус {k} цилиндрийн дээд талыг налуу хавтгайгаар огтлов. Үлдсэн хамгийн урт байгуулагч {10+k}, хамгийн богино нь {6+k}. Эзлэхүүнийг ол.',f'{k*k*(8+k)}π','Хавтгайн өндрийн дугуйн дээрх дундаж нь төвийн өндөр=(урт+богино)/2. V=πr²h.',[f'{k*k*(10+k)}π',f'{k*k*(6+k)}π',f'{2*k*k*(8+k)}π',f'{4*k*k}π'])
    n=k
    # Algebra over Q(cuberoot(n)); invert (r+1)(2r-1).
    r=S.Symbol('r');den=2*r*r+r-1;mod=r**3-n;inverse=S.invert(den,mod);coefs=[S.expand(inverse).coeff(r,j) for j in range(3)]
    p.multi('2.1','Cubic radical rationalization',f'r=∛{n}. 1/(2r²+r−1) бутархайн хуваарийг иррационалиас чөлөөл.', [('Хуваарийн үржигдэхүүнд задаргаа','(r+1)(2r−1)',{'exactForm':True,'accept':['(2r−1)(r+1)']}),('Рационалчилсан хариу (r-ээр илэрхийл)',simplest(inverse)),('r²-ийн коэффициент',coefs[2]),('r-ийн коэффициент',coefs[1]),('Тогтмол гишүүн',coefs[0])],'(r+1)-ийг r²−r+1-ээр, (2r−1)-ийг 4r²+2r+1-ээр үржүүл. Хуваарь (n+1)(8n−1). r³=n-ийг ашиглан хүртвэрийг хураа.')
    freq=v+1
    p.multi('2.2','Harmonic function amplitude period inequality tangent',f'f(x)=cos({2*freq}πx)−√3 sin({2*freq}πx).', [('Нэг косинусын хэлбэр',f'2cos({2*freq}πx+π/3)',{'exactForm':True,'accept':[f'2cos(π/3+{2*freq}πx)']}),('Үндсэн үе',F(1,freq)),('f(x)≥1 шийд',f'[−1/{3*freq}+n/{freq}; n/{freq}], n∈Z'),('x=1 дээрх шүргэгч',f'y−1=−{2*freq}√3π(x−1)')],'cosθ−√3sinθ=2cos(θ+π/3). Үе 1/freq. cos≥1/2 нөхцөлийг аргументын завсарт буулган бодно. f(1)=1, f′(1)=−2freq√3π.')
    N=8+2*v;odd=N//2;maxv=k+3
    p.multi('2.3','Three cards without replacement',f'1-ээс {N} хүртэл дугаарласан {N} картаас гурвыг зэрэг жигд сонгоно.', [('Бүгд сондгой дугаартай байх магадлал',F(math.comb(odd,3),math.comb(N,3))),(f'Хамгийн их дугаар {maxv} байх магадлал',F(math.comb(maxv-1,2),math.comb(N,3))),('Үржвэр нь тэгш байх магадлал',1-F(math.comb(odd,3),math.comb(N,3)))],'Нийт C(N,3) сонголт. Бүгд сондгой C(N/2,3). Хамгийн их M үед M картыг тогтоож бусад хоёрыг 1,…,M−1-ээс сонго.')
    a=k+2;h=S.sqrt(2)*a/2;surface=a*a*(1+S.sqrt(3));volume=a**3*S.sqrt(2)/6;radius=S.simplify(3*volume/surface);vmax=S.simplify(S.Rational(4,27)*a*a*h)
    p.multi('2.4','Regular square pyramid and optimization',f'Бүх ирмэг нь {a} урттай зөв дөрвөн өнцөгт пирамид өгөгдөв.', [('Суурийн диагональ',f'{a}√2'),('Диагональ огтлолын талбай',F(a*a,2)),('Пирамидын эзлэхүүн',simplest(volume)),('Багтсан бөмбөрцгийн радиус',simplest(radius)),('Дөрвөн орой нь суурь дээр, бусад дөрөв нь хажуу ирмэг дээр байх тэгш өнцөгт хайрцгийн хамгийн их эзлэхүүн',simplest(vmax))],'Өндөр a/√2. Диагональ огтлол a²/2. V=a³√2/6. Бөмбөрцгийн r=3V/Sнийт=a√2/[2(1+√3)]. Төсөөгөөр хайрцгийн тал b=a(1−z/h); b²z хамгийн их үед z=h/3, Vmax=4a²h/27.')
    p.save()

if __name__=='__main__':
    for v in range(1,6):make(v)
