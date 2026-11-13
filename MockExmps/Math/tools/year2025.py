from common import *
from itertools import permutations

def make(v):
 p=Paper(2025,v);k=v+2
 p.mc('Nested powers and roots',f'⁵√(√({(k+3)**2}⁵))-ын утгыг ол.',k+3,'Дотоод язгуурын дараах нийт зэрэг 5·(1/2)·(1/5)=1/2.')
 angle=60+360*(v+3)
 p.mc('Periodic sine',f'sin({angle}°)-ын утгыг ол.','√3/2','360°-ын бүхэл эргэлтүүдийг хасвал sin60°.', ['1/2','−√3/2','−1/2','1'])
 n=[2,3,5,6,7][v-1]
 p.mc('Irrational subset',f'{{√{n},π,1.(23),0,⁷√2,12/7,√49}}-ын зөвхөн иррационал элементүүдээс тогтсон дэд олонлогийг сонго.',f'{{√{n},π,⁷√2}}','Үет бутархай,бүхэл,энгийн бутархай рационал; өгсөн төгс бус язгуурууд ба π иррационал.',[f'{{π,0,⁷√2}}',f'{{√{n},1.(23),π}}','{π,√49}','{12/7,⁷√2}'])
 p.mc('Cosine chain integral',f'∫cos({k}x)dx-г ол.',f'sin({k}x)/{k}+C','Дотоод уламжлал k-г нөхөхийн тулд k-д хуваа.',[f'{k}sin({k}x)+C',f'−sin({k}x)/{k}+C',f'cos({k}x)/{k}+C',f'−{k}cos({k}x)+C'])
 p.mc('Absolute inequality endpoints sum',f'|{k+2}x−{k}|<7-ийн шийд a<x<b. a+b-г ол.',F(2*k,k+2),'Хоёр зах (k−7)/(k+2),(k+7)/(k+2); нийлбэр 2k/(k+2).')
 data=[2+k,3+k,1+k,4+k,5+k,12+k,3+k,10+k,9+k,8+k]
 p.mc('Upper quartile',f'{data} өгөгдлийн дээд квартилийг ол. Доод ба дээд таван утгын медиануудыг квартиль гэж ав.',9+k,'Эрэмбэлсэн дээд тавны төв нь 9+k.')
 p.mc('Probability normalization formula',f'P(Y=y)=c({k}+y), y∈{{0,1,2,3}}. P(Y=2)-ыг ол.',F(k+2,4*k+6),'Нийлбэр c(4k+6)=1; y=2-г орлуул.')
 p.mc('Line plane intersection',f'(x−{k})/1=(y+1)/1=(z−{k})/2 шулуун Oxz хавтгайг хаана огтлох вэ?',(k+1,0,k+2),'Параметр t: y=t−1. y=0 үед t=1.',[(k,0,k),(k-1,0,k-2),(k+1,1,k+2),(0,k,k)])
 coeff=2309+10*k
 p.mc('Scientific notation addition',f'2.3×10⁷+{k}.9×10⁵ нийлбэрийг стандарт хэлбэрт бич.',f'{thousandths(coeff)}×10^7','Хоёр дахь тоог 10⁷ суурьт шилжүүлж үржигдэхүүнүүдийг нэм.',[f'{thousandths(coeff)}×10^5',f'{thousandths(coeff)}×10^6',f'{thousandths(coeff+1000)}×10^7',f'{thousandths(coeff-1000)}×10^7'])
 b=k+5;c=k+3
 p.mc('Rational cancellation',f'((x²+{c}x)/(x²−{b+2}x+{2*b}))·((x−2)/x)+x/({b}−x)-г хялбарчил. x≠0,2,{b}.',f'{c}/(x−{b})','Хуваарь (x−2)(x−b). Эхний үржвэр (x+c)/(x−b), хоёр дахь −x/(x−b).',[f'{c}/({b}−x)',f'x/(x−{b})',f'(2x+{c})/(x−{b})',f'{c}/(x+{b})'])
 p.mc('Separable differential equation',f'dy/dx=x/(y+{k}) тэгшитгэлийн ерөнхий шийдийг ол.',f'(y+{k})²=x²+C','(y+k)dy=x dx; интегралдаад хоёроор үржүүл. y≠−k нөхцөлтэй салбарыг авч үз.',[f'(y+{k})²=−x²+C',f'y+{k}=x²+C',f'(y+{k})²=2x+C',f'(y+{k})²=x³+C'])
 exp=2025+v
 z=S.simplify(S.I**exp-(-S.I)**(exp-3))
 p.mc('Complex powers cycle',f'i^{exp}−(−i)^{exp-3}-г хялбарчил.',pretty(S.sstr(z)).replace('I','i'),'i-ийн зэргүүд 4 мөчлөгтэй. Илтгэгч бүрийг 4-т хуваасан үлдэгдлээр тооц.',[pretty(S.sstr(c)).replace('I','i') for c in distinct_from(z,[-z,S.conjugate(z),S.I*z,-S.conjugate(z),1+S.I,1-S.I,-1+S.I,-1-S.I,2*S.I,0])])
 positive=v%2==1;b=k if positive else -k;correct='Дээш нээгдэнэ; язгуурууд 0 ба сөрөг тоо' if positive else 'Дээш нээгдэнэ; язгуурууд 0 ба эерэг тоо'
 opts=['Дээш нээгдэнэ; язгуурууд 0 ба сөрөг тоо','Дээш нээгдэнэ; язгуурууд 0 ба эерэг тоо','Доош нээгдэнэ; язгуурууд 0 ба сөрөг тоо','Доош нээгдэнэ; язгуурууд 0 ба эерэг тоо','Дээш нээгдэнэ; цорын ганц язгуур 0']
 p.mc('Line to quadratic graph signs',f'y=ax+b шулуун өсөх бөгөөд Oy-г {b} дээр огтлоно. y=ax²+bx графикийн зөв дүрслэлийг сонго.',correct,'a>0 тул дээш нээгдэнэ. x(ax+b)=0 тул хоёр дахь язгуур −b/a.',[a for a in opts if a!=correct],figure={'kind':'line_signs','slopeSign':1,'yIntercept':b})
 p.mc('Increasing interval logarithmic function',f'y=x−ln(x−{k}) өсөх завсрыг ол.',f'({k+1};+∞)','y′=1−1/(x−k)=(x−k−1)/(x−k). Муж x>k.',[f'({k};+∞)',f'({k};{k+1})',f'(−∞;{k})',f'(−∞;{k+1})'])
 N=100+v;res=v+1;count=sum(n%9==res for n in range(1,N+1))
 p.mc('Residue class cardinality',f'A={{1,…,{N}}}, B={{9-д хуваахад {res} үлдэх натурал тоонууд}}. |A∩B|-г ол.',count,'res,res+9,…≤N прогрессийн гишүүний тоог ол.')
 p.mc('Piecewise definite integral',f'u=x−{v}. f(x)={k}u+1−{k}, −1≤u≤1; f(x)=u²,1<u≤3. ∫[{v-1}→{v+3}]f(x)dx-г ол.',F(32-6*k,3),'Зааг u=1 дээр салга. Эхний интеграл 2(1−k); хоёр дахь (27−1)/3.')
 big=F(4,5);small=F(v,10)
 p.mc('External secant angle',f'A цэгээс тойрогт татсан хоёр огтлогчийн холын нум {big}π, ойрын нум {small}π радиан. Огтлогчдын A өнцгийг радианаар ол.',f'{(big-small)/2}π','Тойргийн гаднах хоёр огтлогчийн өнцөг холын ба ойрын нумын ялгаврын хагас.',[f'{big-small}π',f'{(big+small)/2}π',f'{big+small}π',f'{big}π'])
 p.mc('Trig solution count',f'3sin²(x−{v}π)+sin(x−{v}π)cos(x−{v}π)=2, {v}π≤x≤{v}π+3π/2. Хэдэн шийдтэй вэ?',3,'u=x−vπ; cosu=0 шийд биш. t=tanu гэвэл t²+t−2=0; t=1 нь хоёр, t=−2 нь нэг шийдтэй.',[1,2,4,5])
 p.mc('Normal to reciprocal curve',f'f(x)=1/(x−{k}). x={k+1} дээрх нормалыг ол.',f'y=x−{k}','Цэг (k+1,1), f′=−1 тул нормалын налалт 1.',[f'y=−x+{k+2}',f'y=x−{k+1}',f'y=x+{k}',f'y=−x−{k}'])
 # Circle translated from source, preserving center-to-point slope 1/2.
 p.mc('Circle center parallel line',f'(x+{k})²+(y+{k})²=4 тойргийн төв ба A({2-k},{1-k})-ийг дайрсан шулуунтай параллель, P({1-k},{3-k})-г дайрсан шулууныг ол.',f'x−2y+{5-k}=0','Төв (−k,−k)-өөс A хүртэл вектор (2,1), налалт 1/2. P-г цэг-налалтын томьёонд орлуул.',[f'x+2y+{5-k}=0',f'2x−y+{5-k}=0',f'x−2y+{6-k}=0',f'x−2y+{k+5}=0'])
 N=2030+v;r=v+3
 p.mc('Difference of finite sums',f'Σ[j=1…{N}](j²+1)−Σ[j={r}…{N}](j²+1)-г ол.',sum(j*j+1 for j in range(1,r)),'Нийтлэг сүүл гишүүд хасагдаж j=1,…,r−1 үлдэнэ.')
 delta=20+v;D=40*delta
 p.mc('Travel fractions speed difference',f'Хоёр боомтын замын 3/5-ийг эхний тээвэр 9 цагт,7/12-ийг хоёр дахь нь 14 цагт явна. Хурдны зөрүү {delta} км/ц. Замын уртыг ол.',D,'v₁=D/15,v₂=D/24. Ялгавар D/40=delta.')
 A=(v,v+1,v-4);B=tuple(a+b for a,b in zip(A,(-6,4,-2)));C=(10+v,-4+v,v);D=tuple(a+b for a,b in zip(C,(3,-2,1)))
 p.mc('3D vector angle',f'A{A},B{B},C{C},D{D}. AB ба CD векторын өнцгийг ол.','180°','AB=−2CD тул эсрэг чиглэлтэй.', ['0°','30°','60°','90°'])
 unknown=k+1;known=18+k;weighted=61+6*k;mean=F(weighted+4*unknown,known+unknown)
 p.mc('Frequency table unknown',f'Шооны 1,2,3,4,5,6 нүдний давтамж 4,4,2,x,5,{k+3}. Дундаж нь {mean}. x-г ол.',unknown,'Жигнэсэн нийлбэр weighted+4x, нийт known+x. Өгсөн дундажтай тэнцүүлж шугаман тэгшитгэл бод.')
 p.mc('Binomial variance',f'Шударга зоосыг {k+1} удаа орхино. X нь сүлдээр буусан тоо. Var(X)-г ол.',F(k+1,4),'Bin(n,1/2)-ийн дисперс np(1−p)=n/4.')
 scale=v+1
 p.mc('Inscribed circle area probability',f'{18*scale},{8*scale} суурьтай адил хажуут трапецад дугуй багтана. Трапец дотор жигд сонгосон цэг дугуй дотор байх магадлалыг ол.','3π/13','Багтсан тойргоос хажуу тал 13s; өндөр √(169−25)s=12s, радиус6s. Харьцаа 36πs²/(156s²).',['π/13','6π/13','3π/26','9π/26'])
 limit=54+v
 p.mc('Integer ratio after removal',f'Хайрцагт хөх ба шар жетоны тоо 4:9, нийт {limit}-өөс цөөн. Дөрвөн жетон авсны дараа хөх:шар=1:3 болов. Анхны нийт тоог үлдсэн нийт тоонд харьцуул.',F(13,12),'Анх (4t,9t). Хөхөөс r,шараас 4−r авбал 3t+4=4r. 0≤r≤4 ба 13t<limit тул t=4,r=4. Нийт52→48.')
 p.mc('Remainders in geometric progression',f'u=x−{v}, f(x)=u²+3u+c. u+1,u+3,u−2-т хуваах үлдэгдлүүд дараалсан геометр прогресс бол c-г ол.',F(5,2),'Үлдэгдлүүд c−2,c,c+10. c²=(c−2)(c+10) →8c=20; олдсон утга 0 биш, GP үүсгэнэ.')
 a=v;b=v+4
 p.mc('Repeated digit permutations nonadjacent',f'{a},{a},{a},{b},{b} цифрүүдээр {b}-үүд залгаа ороогүй таван оронтой тоо хэдийг бичих вэ?',6,'Гурван ижил a-гийн хооронд ба захад 4 завсар бий. Хоёр b-д C(4,2)=6.',[3,4,5,10])
 p.mc('Coefficient parameter roots product',f'(z²+z+a)⁴-ийн z³ коэффициент {12*k}. Бүх бодит a шийдийн үржвэрийг ол.',-k,'z³ коэффициент 12a²+4a. 12a²+4a−12k=0; Виетээр үржвэр −k.')
 r=k
 p.mc('Rectangle inscribed circle chord',f'P(0,0),Q(0,{2*r}),R({4*r},{2*r}),S({4*r},0). Тойрог PQ,QR,PS-г шүргэнэ. QS дээрх тойргийн огтлолуудаас x нь ихийг B, PB шулууны тойргийн нөгөө огтлолыг A гэв. AB-г ол.',f'{4*r}√5/5','Төв(r,r),радиусr. B=(2r,r). PB:y=x/2; тойрогтой огтлолын x нь 2r/5,2r. Хөвчийн урт (8r/5)√5/2.',[f'{2*r}√5/5',f'{4*r}√5',f'{r}√5/5',f'{8*r}√5/5'],figure={'kind':'circle_rectangle_chord','width':4*r,'height':2*r,'radius':r,'center':[r,r]})
 p.mc('Composed transformation unknown coordinates',f'A({k+1},{k+2}),B(m,n)-ийг y=−x-д тольдоод [[0,1],[−1,0]]-оор хувиргав. A₂(p,q), B₂(−{k+3},{1-k}) бол p+q+m+n-г ол.',5,'Нийлмэл (x,y)→(−x,y). p+q=1,m=k+3,n=1−k; нийлбэр5.')
 rr=k+1;ss=k
 p.mc('Bisector and midpoint vectors',f'ABC гурвалжинд AB:AC={rr}:{ss}, A-ийн биссектрис BC-г P дээр огтолно. Q нь AB-ийн дундаж; AB=b,AC=c. PQ-г ол.',f'b/{2*(rr+ss)}−{rr}c/{rr+ss}','P=(ss·b+rr·c)/(rr+ss), Q=b/2. PQ=Q−P.',[f'−b/{2*(rr+ss)}−{rr}c/{rr+ss}',f'b/{2*(rr+ss)}+{rr}c/{rr+ss}',f'{rr}b/{rr+ss}−c/2',f'b/2−{ss}c/{rr+ss}'])
 ambient=20+v
 p.mc('Newton cooling repeated interval',f'Цай анх {ambient+50}°,өрөө {ambient}°. T′=−c(T−{ambient}),c>0. Арван минутын дараа {ambient+30}° болов. Хорин минутын температурыг ол.',ambient+18,'Өрөөнөөс зөрөх температур 10 минут бүр 30/50=3/5 дахин. 20 минутын дараа зөрүү50(3/5)²=18.')
 inv=S.Matrix([[k+2,-2],[2,k+5]]);sol=inv*S.Matrix([3,-3])
 p.mc('Linear system inverse matrix',f'A[[x],[y]]=[[3],[−3]], A⁻¹=[[{k+2},−2],[2,{k+5}]]. x−y-г ол.',sol[0]-sol[1],'Шийдийн багана A⁻¹·(3,−3)ᵀ. Хоёр координатын ялгаврыг ав.')
 p.mc('Maximum horizontal graph distance',f'{v-4}≤x≤{v+2} мужид y=x−{v}+4 ба y=e^(x−{v}−1/2) график дээр ижил y-тэй A,B цэгүүд авав. AB-ийн хамгийн их уртыг ол.',F(7,2),'Ижил өндөр t>0 үед x₁=t+v−4, x₂=ln t+v+1/2. Ялгавар ln t−t+9/2. t=1-д максимум7/2; хоёр захын абсолют ялгавар үүнээс бага.')
 h=v;left=h-10;right=h+10;intercept=F(100-h*h,2)
 p.multi('2.1','Absolute quadratic four intersections',f'Квадрат f-ийн Ox огтлолууд ({left},0),({right},0), Oy огтлол (0,{intercept}). |f(x)|=t дөрвөн ялгаатай бодит шийдтэй байх t-г ол.', [('f(x)',f'−(x−{h})²/2+50'),('Орой',(h,50)),('t-ийн муж','(0;50)')],'f=a(x−h+10)(x−h−10). Oy огтлолоос a=−1/2. Оргил50 тул 0<t<50 үед хоёр дотоод,хоёр гадна огтлолтой.')
 offset=2*v;AA=[4+offset,5+offset,6+offset,9+offset];BB=[2+offset,3+offset,7+offset,8+offset];win=sum(a>b for a in AA for b in BB);both=sum(b1>a1 and b2>a2 for a1 in AA for a2 in AA if a1!=a2 for b1 in BB for b2 in BB if b1!=b2)
 prob=F(win,16)
 p.multi('2.2','Card comparison replacement dependence',f'А-ийн картууд {AA},Б-ийн картууд {BB}. Тус бүр нэгийг жигд авч,их дугаар авсан нь хожно.', [('А нэг тоглолтод хожих магадлал',prob),('Буцаан хийж хоёр тоглоход тус бүр нэг хожих магадлал',2*prob*(1-prob)),('Буцаахгүй хоёр тоглоход хоёуланд Б хожих магадлал',F(both,144))],'Нэг тоглолтын16 хосыг тоол. Буцаалттай тоглолтууд үл хамаарна. Буцаахгүй үед хоёр тал тус бүр4·3 дараалалтай, нийт144; хоёр удаа Б их байх хосуудыг тоол.')
 a=k+5
 p.multi('2.3','Square root tangent area and rotation volume',f'y=√({a}x), y=x муруйнууд өгөгдөв.', [('Огтлолцлын x-үүд',(0,a)),(f'Язгуурын муруйн x={a} дээрх шүргэгч',f'y=x/2+{simplest(S.Rational(a,2))}'),('Шүргэгч,язгуурын муруй,Oy-ээр хүрээлэгдэх талбай',F(a*a,12)),('Хоёр муруйн хоорондох дүрсийг Ox тойруулсан эзлэхүүн',simplest(S.Rational(a**3,6)*S.pi))],'Огтлол x²=ax. f′(a)=1/2. Талбай ∫₀ᵃ[(x+a)/2−√(ax)]dx=a²/12. Угаагчийн V=π∫₀ᵃ(ax−x²)dx=πa³/6.')
 scale=v+1;R=20*scale;r=15*scale;H=6*scale;hsmall=F(H,2)*r/(R-r);Vsmall=r*r*hsmall/3;Vtotal=F(H,3)*(R*R+R*r+r*r)
 p.multi('2.4','Two joined conical frustums',f'Ижил хоёр огтлогдсон конусыг бага сууриар нийлүүлэв. Нийт өндөр {H},бага диаметр {2*r},их диаметр {2*R}.', [('Бага конусыг гүйцээх өндөр',hsmall),('Гүйцээсэн бага конусын эзлэхүүний π коэффициент',Vsmall),('Нийлмэл биетийн эзлэхүүний π коэффициент',Vtotal)],'Нэг огтлогдсон конусын өндөр H/2. Төсөөгөөр бага конусын h=(H/2)r/(R−r). Хоёр фрустумын нийт V=πH(R²+Rr+r²)/3.')
 p.save()

if __name__=='__main__':
 for v in range(1,6):make(v)
