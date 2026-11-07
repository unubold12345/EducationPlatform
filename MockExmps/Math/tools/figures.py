"""Offline, answer-free figure specifications for the Math review pack.

Positions are schematic unless coordinateSystem explicitly says cartesian.
No application code imports this module. Scene data contains no executable code.
"""
import math,re
from fractions import Fraction as F

SCHEMA='education.math.figure.v1'
SOURCE_DIAGRAMS={
 2015:{'10','16','19','24','29','32','2.1','2.3'},
 2016:{'14','34','35','36','2.4'},
 2017:{'21','24','27','29','31','36','2.4'},
 2018:{'20','2.4'},2019:{'8','24','2.2'},2021:{'25','29','34','2.1','2.3'},
 2022:{'7','27','31','35','2.3'},2023:{'3','8','33','2.2','2.4'},
 2024:{'2','5','7','12','18','33','34','36','2.1','2.2','2.3','2.4'},
 2025:{'13','17','31','2.4'},2026:{'7','8','35','2.2','2.3'},
}

class Scene:
 def __init__(self,title,space='2d',cartesian=False):
  self.data={'schema':SCHEMA,'kind':'scene','title':title,'space':space,'coordinateSystem':'cartesian' if cartesian else 'schematic','notToScale':not cartesian,'points':{},'objects':[],'measurements':[],'relations':[],'notes':['Зураг нь зөвхөн өгөгдлийн холбоог дүрслэнэ; хэмжээг зургаас хэмжиж болохгүй.'] if not cartesian else []}
 def point(self,name,coords,label=None):
  self.data['points'][name]={'position':list(map(float,coords)),'label':name if label is None else label};return name
 def line(self,a,b,style='solid',arrow=False):
  self.data['objects'].append({'kind':'segment','from':a,'to':b,'style':style,'arrow':arrow})
 def polygon(self,names,fill=None):
  self.data['objects'].append({'kind':'polygon','points':names,'fill':fill})
 def circle(self,center,radius,style='solid',fill=None):
  self.data['objects'].append({'kind':'circle3d' if self.data['space']=='3d' else 'circle','center':center,'radius':float(radius),'style':style,'fill':fill})
 def curve(self,points,label=None,style='solid'):
  self.data['objects'].append({'kind':'polyline','positions':[list(map(float,p)) for p in points],'label':label,'style':style})
 def measure(self,a,b,text):self.data['measurements'].append({'kind':'length','from':a,'to':b,'text':str(text),'provenance':'question_given'})
 def angle(self,a,o,b,text=None,right=False):
  self.data['relations'].append({'kind':'right_angle' if right else 'angle','points':[a,o,b],**({'text':str(text),'provenance':'question_given'} if text is not None else {})})
 def relation(self,kind,**kwargs):self.data['relations'].append({'kind':kind,**kwargs})
 def done(self):return self.data

def triangle(title='Гурвалжин',names='ABC',points=None):
 s=Scene(title);points=points or [(0,0),(6,0),(2,4)]
 for n,p in zip(names,points):s.point(n,p)
 s.polygon(list(names));return s

def coordinate_polygon(points,names=None,title='Координатын дүрс',space='2d'):
 s=Scene(title,space,True);names=names or list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[:len(points)])
 for n,p in zip(names,points):s.point(n,p)
 s.polygon(names);return s

def cuboid(a=6,b=4,h=5,names=('A','B','C','D','A1','B1','C1','D1')):
 s=Scene('Тэгш өнцөгт параллелепипед','3d')
 pts=[(0,0,0),(a,0,0),(a,b,0),(0,b,0),(0,0,h),(a,0,h),(a,b,h),(0,b,h)]
 for n,p in zip(names,pts):s.point(n,p,label=n.replace('1','₁'))
 for i,j in [(0,1),(1,2),(2,3),(3,0),(4,5),(5,6),(6,7),(7,4),(0,4),(1,5),(2,6),(3,7)]:s.line(names[i],names[j],'dashed' if (i,j) in [(2,3),(3,0),(3,7)] else 'solid')
 return s

def pyramid(a=6,h=5,triangular=False):
 s=Scene('Пирамид','3d');pts=[(0,0,0),(a,0,0),(a/2,a*math.sqrt(3)/2,0)] if triangular else [(0,0,0),(a,0,0),(a,a,0),(0,a,0)]
 names=list('ABC' if triangular else 'ABCD')
 for n,p in zip(names,pts):s.point(n,p)
 center=[sum(p[j] for p in pts)/len(pts) for j in range(2)]
 s.point('S',center+[h]);s.polygon(names)
 for n in names:s.line(n,'S')
 return s

def cone(r=3,h=6,upper=None,cylinder=False):
 s=Scene('Цилиндр' if cylinder else 'Конус','3d');s.point('O',(0,0,0));s.circle('O',r);s.point('H',(0,0,h),'O₁' if cylinder or upper else 'S')
 if cylinder or upper:
  rr=r if cylinder else upper;s.circle('H',rr)
  for sign,n in [(-1,'L'),(1,'R')]:
   s.point(n,(sign*r,0,0),'');s.point(n+'1',(sign*rr,0,h),'');s.line(n,n+'1')
 else:
  for sign,n in [(-1,'L'),(1,'R')]:s.point(n,(sign*r,0,0),'');s.line(n,'H')
 s.line('O','H','dashed');return s

def plot(curves,xmin=-3,xmax=5,yrange=None,title='Функцийн график'):
 s=Scene(title,cartesian=True)
 for label,fn in curves:
  pieces=[];piece=[]
  for i in range(241):
   x=xmin+(xmax-xmin)*i/240
   try:y=float(fn(x))
   except (ValueError,ZeroDivisionError,OverflowError):y=float('nan')
   if math.isfinite(y) and (yrange is None or yrange[0]<=y<=yrange[1]):piece.append((x,y))
   elif piece:pieces.append(piece);piece=[]
  if piece:pieces.append(piece)
  for j,p in enumerate(pieces):
   if len(p)>1:s.curve(p,label if j==0 else None)
 return s

def tangent_circle(theta,variant='central'):
 s=Scene('Тойрог, шүргэгч ба хөвч');theta=math.radians(theta);s.point('O',(0,0));s.circle('O',3)
 s.point('A',(3*math.cos(theta),3*math.sin(theta)));s.point('B',(3/math.cos(theta),0))
 s.point('C',(3,0));s.line('O','A');s.line('O','B');s.line('A','B');s.line('A','C')
 s.angle('O','A','B',right=True);s.relation('tangent',circleCenter='O',point='A',line=['A','B'])
 if variant=='central':s.angle('A','O','B',str(round(math.degrees(theta),6))+'°')
 return s

def bisector_triangle(ratio=F(2,3),vertex='A',names='ABC'):
 s=triangle('Өнцгийн биссектрис',names);A,B,C=names
 # Vertex is the first point; drawing ratios are schematic, not asserted lengths.
 s.point('P',(6*(1-float(ratio)),4*float(ratio)));s.line(A,'P');s.relation('angle_bisector',vertex=A,ray=[A,'P'],sides=[[A,B],[A,C]])
 return s

def trapezoid(bottom=8,top=4,height=4,names='ABCD',right=False):
 shift=0 if right else (bottom-top)/2
 s=Scene('Трапец');pts=[(0,0),(bottom,0),(shift+top,height),(shift,height)]
 for n,p in zip(names,pts):s.point(n,p)
 s.polygon(list(names));s.relation('parallel',segments=[[names[0],names[1]],[names[2],names[3]]])
 if right:s.angle(names[1],names[0],names[3],right=True)
 return s

def square_pyramid_figure(a,height):
 s=pyramid(6,height);s.measure('A','B',a);s.relation('regular_pyramid',base=['A','B','C','D'],apex='S');s.point('O',(3,3,0));s.line('S','O','dashed')
 return s

def circumcircle(A,B,C):
 ax,ay=A;bx,by=B;cx,cy=C;D=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
 ux=((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/D
 uy=((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/D
 return (ux,uy),math.dist((ux,uy),A)

def circle_intersections(A,r,B,t):
 d=math.dist(A,B);a=(r*r-t*t+d*d)/(2*d);h=math.sqrt(max(0,r*r-a*a));dx=(B[0]-A[0])/d;dy=(B[1]-A[1])/d
 return [(A[0]+a*dx+sign*h*(-dy),A[1]+a*dy+sign*h*dx) for sign in [-1,1]]

def rename_points(scene,mapping):
 def walk(obj):
  if isinstance(obj,str):return mapping.get(obj,obj)
  if isinstance(obj,list):return [walk(a) for a in obj]
  if isinstance(obj,dict):return {k:walk(v) for k,v in obj.items()}
  return obj
 points=scene.data['points'];scene.data=walk(scene.data);scene.data['points']={mapping.get(k,k):walk(v) for k,v in points.items()};return scene

def figure_for(year,v,q):
 """Only question givens are used; this function never accesses an answer key."""
 n=q['number'];k=v+2;s=None
 if year==2015:
  if n=='5':
   theta=15+5*v;s=triangle('Тэгш өнцөгт гурвалжин',points=[(0,0),(6,0),(0,6*math.tan(math.radians(theta)))]);s.angle('B','A','C',right=True);s.angle('A','B','C',f'{theta}°')
  elif n=='10':
   s=triangle(points=[(0,0),(3,0),(4,4*math.sqrt(3))]);s.measure('A','B',3*k);s.measure('A','C',8*k);s.angle('B','A','C','60°')
  elif n=='12':
   s=Scene('Төвтэй хоёр дугуй');s.point('O',(0,0));s.circle('O',3);s.circle('O',.75,fill='shade');s.point('R',(3,0),'');s.point('r',(0,.75),'');s.measure('O','R',k);s.measure('O','r',F(k,4))
  elif n=='16':
   s=coordinate_polygon([(-3,-3),(3,-3),(3,3),(-3,3)],title='Квадратад багтсан тойрог');s.data['coordinateSystem']='schematic';s.data['notToScale']=True;s.point('O',(0,0));s.circle('O',3);s.measure('A','B',2*k);s.relation('inscribed_circle',polygon=['A','B','C','D'],circleCenter='O')
  elif n=='19':
   base=2.5*(k+1);xx=((2*k)**2+base**2-(3*k)**2)/(2*base);s=triangle(names='QPR',points=[(xx,math.sqrt((2*k)**2-xx**2)),(0,0),(base,0)]);s.point('K',(k+1,0));s.line('Q','K');s.measure('Q','P',2*k);s.measure('Q','R',3*k);s.measure('P','K',k+1);s.relation('angle_bisector',vertex='Q',ray=['Q','K'],sides=[['Q','P'],['Q','R']])
  elif n=='24':
   s=cone(r=3,h=4.8,cylinder=True);s.point('U',(-2.4,1.8,0));s.point('V',(2.4,1.8,0));s.point('U1',(-2.4,1.8,4.8),'U₁');s.point('V1',(2.4,1.8,4.8),'V₁');s.polygon(['U','V','V1','U1'],'shade');s.measure('R','R1',8*k);s.measure('O','R',5*k);s.relation('parallel',segments=[['O','H'],['U','U1']]);s.relation('square',vertices=['U','V','V1','U1'])
  elif n=='29':
   s=coordinate_polygon([(0,0),(10,0),(30,3),(10,3)],list('PQRS'));s.data['coordinateSystem']='schematic';s.data['notToScale']=True;s.line('P','R');s.line('Q','S');s.point('O',(10,1));s.measure('Q','O',k);s.measure('O','S',2*k);s.measure('P','Q',10*k)
  elif n=='32':
   s=coordinate_polygon([(0,1),(1,k+1),(2*k+2,1)]);s.point('M',(k+1,1));s.line('B','M');s.relation('midpoint',point='M',segment=['A','C'])
  elif n=='2.1':
   s=trapezoid(10,10/6,4);s.data['points']['D']['position']=[3,4];s.data['points']['C']['position']=[14/3,4];s.measure('A','B',30*k);s.measure('C','D',5*k);s.measure('B','C',20*k);s.measure('D','A',15*k)
  elif n=='2.3':
   h=k;s=plot([('y=f(x)',lambda x:(x-h)/(x-h-1))],h+1.15,h+7,(0,8));s.data['constructionRequests']=[{'kind':'tangent_line','abscissa':h+2},{'kind':'bounded_area','verticalLines':[h+2,h+4],'horizontalLine':0}]
 elif year==2016:
  if n=='14':
   s=cone(r=2.5,h=6);s.measure('H','R',13*k);s.measure('O','H',12*k);s.angle('H','O','R',right=True)
  elif n=='34':
   s=triangle(points=[(0,4),(-1,0),(3,0)]);s.point('E',(0,0));s.point('D',(39/25,48/25));s.line('A','E');s.line('B','D');s.angle('A','E','C',right=True);s.angle('B','D','C',right=True);s.measure('A','E',4*k);s.measure('B','D',F(16*k,5));s.relation('ratio',segments=[['B','E'],['E','C']],values=[1,3])
  elif n=='35':
   s=Scene('Гадна шүргэлцсэн хоёр тойрог ба ерөнхий шүргэгч');s.point('O1',(0,0),'O₁');s.point('O2',(5,0),'O₂');s.circle('O1',.5);s.circle('O2',4.5)
   # Tangency radius normal (-0.8,0.6), exact for R-r=4 and center separation 5.
   s.point('A',(-.4,.3));s.point('B',(1.4,2.7));s.line('A','B');s.line('O1','A');s.line('O2','B');s.line('O1','O2');s.measure('O1','A',2*k);s.measure('O2','B',18*k);s.angle('O1','A','B',right=True);s.angle('O2','B','A',right=True)
  elif n=='36':
   s=pyramid(6,6,True);s.data['title']='Зөв гурвалжин огтлогдсон пирамид';s.data['objects']=[o for o in s.data['objects'] if o['kind']=='polygon'];del s.data['points']['S']
   for name in 'ABC':
    pos=s.data['points'][name]['position'];s.point(name+'1',[pos[0]*2/3+1,pos[1]*2/3+math.sqrt(3)/3,2/3],name+'₁');s.line(name,name+'1')
   s.polygon(['A1','B1','C1']);s.measure('A','B',6*k);s.measure('A1','B1',4*k);s.relation('edge_to_base_angle',edge=['A','A1'],degrees=30)
  elif n=='2.4':
   s=pyramid(6,5,True);s.data['points']['S']['position']=[3,3*math.sqrt(3),5];s.point('E',(4.5,1.5*math.sqrt(3),0));s.point('D',(3,0,0));s.line('S','E');s.line('C','D');s.line('S','C','dashed');s.measure('A','B',f'{8*k}√2');s.measure('C','S',8*k);s.relation('perpendicular_to_plane',line=['S','C'],plane=['A','B','C']);s.relation('midpoint',point='E',segment=['B','C']);s.relation('midpoint',point='D',segment=['A','B'])
 elif year==2017:
  if n=='21':
   s=coordinate_polygon([(0,0),(6,0),(6,6),(0,6)]);s.data['coordinateSystem']='schematic';s.data['notToScale']=True;s.point('M',(6*(k+2)/(2*k+8),6*(k+2)/(2*k+8)));s.line('A','C');s.line('B','M');s.measure('A','M',k+2);s.measure('M','C',k+6);s.relation('square',vertices=['A','B','C','D'])
  elif n=='24':
   s=Scene('Координатын тойрог',cartesian=True);s.point('O',(k,4));s.circle('O',2);s.point('R',(k+2,4),'');s.measure('O','R',2)
  elif n=='27':
   # A common tangent at A=(0,0), external point T on x=0.
   s=Scene('Дотоод шүргэлцсэн тойргууд');s.point('A',(0,0));s.point('T',(0,-2));s.point('O',(math.sqrt(3),0));s.circle('O',math.sqrt(3));s.point('o',(2/math.sqrt(3),0),'O₁');s.circle('o',2/math.sqrt(3))
   for name,t in [('B',1),('C',2),('D',4)]:s.point(name,(t*math.sqrt(3)/2,-2+t/2))
   s.line('T','A');s.line('T','D');s.measure('B','C',k);s.measure('C','D',2*k);s.relation('ordered_collinear',points=['T','B','C','D']);s.relation('tangent',circleCenter='o',point='C',line=['T','C']);s.relation('internally_tangent',circles=['O','o'],point='A')
  elif n=='29':s=plot([(f'y={k}x³',lambda x:k*x**3),(f'y={k}x',lambda x:k*x)],-1.35,1.35,(-5,5))
  elif n=='31':
   s=Scene('Нэгж тойрог');s.point('O',(0,0));s.circle('O',3)
   for name,deg in [('A',15*v+45),('B',15*v-45),('C',15*v+180)]:s.point(name,(3*math.cos(math.radians(deg)),3*math.sin(math.radians(deg))))
   s.polygon(['A','B','C']);s.relation('point_on_circle',point='C',circleCenter='O');s.data['notes'].append('C нь дурын байрлалыг төлөөлсөн жишээ; магадлалын таатай мужийг будаагүй.')
  elif n=='36':
   s=cone(cylinder=True);s.data['title']='Налуу хавтгайгаар огтолсон цилиндр';s.data['points']['L1']['position'][2]=4.5;s.data['points']['R1']['position'][2]=6.5;s.measure('O','R',k);s.measure('L','L1',6+k);s.measure('R','R1',10+k);s.curve([(3*math.cos(t),3*math.sin(t),5.5+math.cos(t)) for t in [i*2*math.pi/80 for i in range(81)]])
  elif n=='2.4':
   s=square_pyramid_figure(k+2,3*math.sqrt(2));s.data['notes'].append('Бөмбөрцөг болон хайрцаг нь тусдаа дэд бодлогын байгууламж; оновчтой хэмжээг зурагт өгөгдөөгүй.');s.relation('all_edges_equal',vertices=['A','B','C','D','S'],length=str(k+2));s.data['constructionRequests']=[{'kind':'insphere','solid':'pyramid'},{'kind':'inscribed_rectangular_box','upperVerticesOnLateralEdges':True,'height':'variable'}]
 elif year==2018:
  k=v+1
  if n=='6':
   s=coordinate_polygon([(0,0),(6,0),(6,4),(0,4)]);s.data['coordinateSystem']='schematic';s.data['notToScale']=True;s.relation('ratio',segments=[['A','B'],['B','C']],values=[3,2]);s.data['givenArea']=str(6*(k+2)**2)
  elif n=='7':
   N=k+3;s=Scene(f'{N} өнцөгт суурьтай призм','3d');lower=[];upper=[]
   for i in range(N):
    name='P'+str(i+1);pos=[3*math.cos(2*math.pi*i/N),3*math.sin(2*math.pi*i/N),0];s.point(name,pos,str(i+1));s.point(name+'u',pos[:2]+[4],'');lower.append(name);upper.append(name+'u');s.line(name,name+'u')
   s.polygon(lower);s.polygon(upper)
  elif n=='17':
   theta=math.radians(40+2*v);Q=(0,5*math.cos(theta/2));P=(-5*math.sin(theta/2),0);R=(5*math.sin(theta/2),0);s=triangle(names='PQR',points=[P,Q,R]);t=math.dist(P,Q)/(2*math.cos(theta));m=(Q[0]+t*(R[0]-Q[0])/math.dist(Q,R),Q[1]+t*(R[1]-Q[1])/math.dist(Q,R));s.point('M',m);s.line('P','M');s.angle('P','Q','R',f'{40+2*v}°');s.relation('equal_lengths',segments=[['P','Q'],['Q','R']]);s.relation('equal_lengths',segments=[['P','M'],['Q','M']])
  elif n=='18':
   s=Scene('Нумуудын харьцаа');s.point('O',(0,0));s.circle('O',3);total=k+5;cum=0
   for i,weight in enumerate([1,2,k+2]):
    deg=360*cum/total;name='ABC'[i];s.point(name,(3*math.cos(math.radians(deg)),3*math.sin(math.radians(deg))));s.line('O',name);cum+=weight
   s.relation('arc_ratio',circleCenter='O',endpoints=['A','B','C'],values=[1,2,k+2])
  elif n=='20':
   via=[(1,1),(1,2),(2,1),(2,2),(1,3)][v-1];s=Scene('Торон зам',cartesian=True);s.point('A',(0,0));s.point('B',via);s.point('C',(3,3))
   for i in range(4):s.curve([(i,0),(i,3)]);s.curve([(0,i),(3,i)])
   s.relation('allowed_moves',vectors=[[1,0],[0,1]])
  elif n=='30':
   s=cone(cylinder=True);s.measure('L','R1',f'{k+3}√2');s.relation('square_axial_section',vertices=['L','R','R1','L1'])
  elif n=='31':
   s=cuboid();s.data['givenScaleDecreasePercent']=[10,15,25,30,40][v-1];s.relation('uniform_scaling',solid='cuboid',factor=str(F(100-s.data['givenScaleDecreasePercent'],100)))
  elif n=='2.4':
   s=cone();s.measure('O','H',k);s.measure('L','R',k+3);base=[];top=[]
   for i in range(3):
    xy=[1.45*math.cos(2*math.pi*i/3),1.45*math.sin(2*math.pi*i/3)];a='ABC'[i];s.point(a,xy+[0]);s.point(a+'1',xy+[3.1],a+'₁');base.append(a);top.append(a+'1');s.line(a,a+'1')
   s.polygon(base);s.polygon(top);s.measure('A','B','x');s.relation('regular_triangular_prism_in_cone',base=base,top=top,coneApex='H')
 elif year==2019:
  if n=='7':
   s=cone(r=k,h=k+2,cylinder=True);s.measure('O','R',k);s.measure('O','H',k+2);s.polygon(['L','R','R1','L1'],'shade')
  elif n=='20':
   s=cone(r=k+6,h=8,upper=k);s.measure('O','R',k+6);s.point('r',(k,0,8),'');s.measure('H','r',k);s.measure('O','H',8)
  elif n=='22':
   cx=k;cy=1;A=[(k-1,2),(k+1,4),(k+2,1)];B=[(cx+3*(x-cx),cy+3*(y-cy)) for x,y in A];s=coordinate_polygon(A)
   for name,pos in zip(['A1','B1','C1'],B):s.point(name,pos,name[0]+'′')
   s.polygon(['A1','B1','C1']);s.relation('correspondence',pairs=[['A','A1'],['B','B1'],['C','C1']])
  elif n=='23':
   Q=(3,0);R=(0,0);S=(-2.5,5*math.sqrt(3)/2);O,r=circumcircle(Q,R,S);P=(O[0],O[1]+r);s=Scene('Тойрогт багтсан дөрвөн өнцөгт')
   for name,pos in zip('PQRS',[P,Q,R,S]):s.point(name,pos)
   s.point('O',O);s.circle('O',r);s.polygon(list('PQRS'));s.line('Q','S');s.measure('Q','R',3*k);s.measure('R','S',5*k);s.angle('Q','P','S','60°')
  elif n=='24':
   s=square_pyramid_figure(2*k,3*math.sqrt(3));s.data['points']['S']['position'][2]=3*math.sqrt(3);s.point('M',(3,0,0));s.line('S','M');s.line('M','O');s.angle('S','M','O','60°');s.relation('midpoint',point='M',segment=['A','B'])
  elif n=='34':
   s=coordinate_polygon([(k-4,0),(k-2,8),(k+2,8),(k+4,0)]);s.curve([(k-2+4*i/100,(-2+4*i/100)**2+4) for i in range(101)],f'y=(x−{k})²+4')
  elif n=='2.2':
   s=plot([('y=√x',math.sqrt)],0,15);s.point('A',(10+v,0));s.relation('distance_to_curve',point='A',curveLabel='y=√x');s.data['notes'].append('Хамгийн ойр цэгийг тэмдэглээгүй; түүнийг бодлогоор олно.')
  elif n=='2.4':
   A=[(k,1),(k,4),(k+2,1)];s=coordinate_polygon(A);s.data['givenTransformation']={'kind':'rotation','center':[0,0],'degrees':90};s.data['notes'].append('Дүрсийн оройнуудыг хариу болгон нэмж зураагүй.')
 elif year==2021:
  if n=='7':
   s=Scene('Цэг ба координатын эх',cartesian=True);s.point('O',(0,0));s.point('M',(-k,k*math.sqrt(2)),f'M(−{k},{k}√2)');s.line('O','M')
  elif n=='20':
   s=cone(r=2,h=3);s.measure('H','R',3*k);s.measure('O','R',2*k);s.data['constructionRequests']=[{'kind':'lateral_surface_net','shape':'sector','radiusGiven':str(3*k),'arcLengthGiven':f'{4*k}π','angle':'unknown'}]
  elif n=='25':
   s=triangle(names='OAB');a=s.data['points']['A']['position'];b=s.data['points']['B']['position'];s.point('C',[(a[i]+k*b[i])/(k+1) for i in range(2)]);s.line('O','C');s.relation('ratio',segments=[['A','C'],['C','B']],values=[k,1]);s.measure('O','A','a⃗');s.measure('O','B','b⃗')
  elif n=='29':
   A=[(k,1),(k+3,1),(k+3,3)];B=[(-y,x) for x,y in A];s=coordinate_polygon(A)
   for name,pos in zip(['A1','B1','C1'],B):s.point(name,pos,name[0]+'′')
   s.polygon(['A1','B1','C1']);s.relation('correspondence',pairs=[['A','A1'],['B','B1'],['C','C1']])
  elif n=='33':
   s=Scene('Тойрогт багтсан тэгш өнцөгт гурвалжин');s.point('O',(0,0));s.circle('O',3);s.point('A',(-3,0));s.point('B',(3,0));s.point('C',(1,math.sqrt(8)));s.polygon(['A','B','C']);s.angle('A','C','B',right=True);s.data['givenRadius']=str(k);s.data['givenPerimeter']=f'{2*k}+{k}√6'
  elif n=='34':
   s=cuboid(6,6,6);s.point('N',(6/(k+1),0,6));s.point('M',(6/(k+1),6,6));s.polygon(['N','M','C','B'],'shade');s.relation('ratio',segments=[['A1','N'],['N','B1']],values=[1,k]);s.relation('ratio',segments=[['D1','M'],['M','C1']],values=[1,k]);s.data['givenEdgeLength']='1'
  elif n=='35':
   s=plot([(f'y=3x+{k-2}',lambda x:3*x+k-2)],-2,7,(-3,10));s.point('A',(k+2,1));s.data['constructionRequests']=[{'kind':'reflection','point':'A','axisLabel':f'y=3x+{k-2}','imagePoint':'unknown'}]
  elif n=='2.1':
   P=(3,0);Q=(0,0);R=(4,4*math.sqrt(3));O,r=circumcircle(P,Q,R);poss=circle_intersections(O,r,R,5);orient=lambda A,B,C:(B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]);S=next(pos for pos in poss if orient(P,R,pos)*orient(P,R,Q)<0);s=Scene('Тойрогт багтсан PQRS')
   for name,pos in zip('PQRS',[P,Q,R,S]):s.point(name,pos)
   s.point('O',O);s.circle('O',r);s.polygon(list('PQRS'));s.line('P','R');s.measure('P','Q',3*k);s.measure('Q','R',8*k);s.measure('R','S',5*k);s.angle('P','Q','R','60°')
  elif n=='2.3':
   fn=lambda x:x**3/3-2.5*x*x+4*x+7/6+v;s=plot([('y=f(x)',fn)],-1,6,(-5,10));s.data['notes'].append('Экстремум цэг, утгуудыг зураг дээр хариу болгон тэмдэглээгүй.')
 elif year==2022:
  if n=='7':
   A=[(-4,-1),(-2,2),(-1,0)];B=[(x+v+2,y-v-1) for x,y in A];s=coordinate_polygon(A)
   for name,pos in zip(['A1','B1','C1'],B):s.point(name,pos,name[0]+'′')
   s.polygon(['A1','B1','C1']);s.relation('correspondence',pairs=[['A','A1'],['B','B1'],['C','C1']])
  elif n=='12':
   s=coordinate_polygon([(2,-2),(3,-2),(2*k-6,2*k)]);s.point('M',(k-2,k-1));s.line('B','M');s.relation('midpoint',point='M',segment=['A','C'])
  elif n=='14':
   s=cone(cylinder=True);s.polygon(['L','R','R1','L1'],'shade');s.relation('square',vertices=['L','R','R1','L1']);s.data['givenBaseArea']=f'{k*k}π'
  elif n=='27':
   s=trapezoid(6,3,4,right=True);s.point('O',(2,2));s.circle('O',2);s.data['givenRadius']=str(2*k);s.relation('base_length_difference',segments=[['A','B'],['D','C']],value=str(3*k));s.relation('inscribed_circle',polygon=['A','B','C','D'],circleCenter='O')
  elif n=='29':
   a=k;b=k-1;s=coordinate_polygon([(a,b),(-2*a,-2*b),(-a,b)]);s.data['givenTransformations']=[{'kind':'homothety','source':'A','image':'B','center':[0,0],'factor':-2},{'kind':'reflection','source':'A','image':'C','axis':'y'}]
  elif n=='31':s=plot([('y=f(x)',lambda x:-(x-v+1)**2+k+3),('y=g(x)',lambda x:(x-v-1)**2+k-7)],v-3,v+3,(-8,8))
  elif n=='33':
   s=Scene('Төвтэй тойрог ба шүргэгч',cartesian=True);s.point('O',(0,0));s.data['constructionRequests']=[{'kind':'circle_tangent_to_line','center':'O','line':{'coefficients':[2,math.sqrt(5),-2*k*math.sqrt(5)],'label':f'2x+√5y−{2*k}√5=0'},'radius':'unknown'}];s.curve([(-4,(2*k*math.sqrt(5)+8)/math.sqrt(5)),(6,(2*k*math.sqrt(5)-12)/math.sqrt(5))],f'2x+√5y−{2*k}√5=0')
  elif n=='35':
   s=coordinate_polygon([(0,0),(5,0),(7,3),(2,3)],['O','A','B','C']);a=k;b=k+1;t=a/(a+b);B=(7,3);C=(2,3);E=((1-t)*B[0]+t*C[0],3);s.point('E',E);s.line('O','E');s.line('A','C');u=(a+b)/(a+2*b);s.point('M',(u*E[0],u*E[1]));s.relation('ratio',segments=[['B','E'],['E','C']],values=[a,b])
  elif n=='2.2':
   s=cuboid(6,3,4);s.measure('A','B','2x');s.measure('B','C','x');s.measure('A','A1','h');s.data['givenTotalEdgeLength']=str(36*(v+1));s.data['notes'].append('h ба x нь хувьсах хэмжээнүүд; оновчтой харьцааг зурагт өгөөгүй.')
  elif n=='2.3':
   s=Scene('Суурьтай ижил хоёр талт өнцөгтэй пирамид','3d');A=(0,0,0);B=(5,0,0);C=(0,12,0);I=(2,2,0);S=(2,2,2*math.sqrt(3))
   for name,pos in zip(['A','B','C','I','S'],[A,B,C,I,S]):s.point(name,pos)
   s.polygon(['A','B','C']);s.point('F',(2,0,0));s.line('S','I','dashed');s.line('I','F');s.line('S','F')
   for name in 'ABC':s.line('S',name)
   scale=v+1;s.measure('A','B',5*scale);s.measure('A','C',12*scale);s.measure('B','C',13*scale);s.angle('S','F','I','60°');s.relation('incenter',point='I',triangle=['A','B','C'])
 elif year==2023:
  if n=='3':
   s=Scene('Өгсөн вектор',cartesian=True);s.point('O',(0,0));s.point('P',(k,-k-1),'a⃗');s.line('O','P',arrow=True);s.data['notes'].append('Эсрэг векторыг хариу болгон зураагүй.')
  elif n=='8':
   theta=math.radians(50+2*v);s=Scene('Диаметрт тулсан гурвалжин');s.point('O',(0,0));s.circle('O',3);s.point('A',(-3,0));s.point('B',(3,0));s.point('C',(3*math.cos(2*theta),3*math.sin(2*theta)));s.polygon(['A','B','C']);s.angle('A','C','B',right=True);s.angle('B','A','C',f'{50+2*v}°')
  elif n=='23':
   s=Scene('Өгсөн хэрчим',cartesian=True);s.point('A',(k,1));s.point('B',(1,k+1));s.line('A','B');s.data['givenTransformation']={'matrix':[[0,-1],[1,0]],'image':'not drawn'}
  elif n=='24':
   s=triangle(points=[(0,5),(12,0),(0,0)]);s.angle('A','C','B',right=True);s.measure('A','B',13*k);s.measure('B','C',12*k);s.relation('axis_of_revolution',segment=['A','C'])
  elif n=='33':
   s=triangle(points=[(0,0),(9,0),(5,math.sqrt(20))]);s.point('D',(5,0));s.line('C','D');s.angle('A','C','B',right=True);s.angle('C','D','B',right=True);s.measure('A','D',5*k);s.measure('B','C',6*k);s.measure('A','C','x')
  elif n=='2.2':
   H=3*math.sqrt(3);s=coordinate_polygon([(0,0),(6,0),(3,H),(-3,H)]);s.data['coordinateSystem']='schematic';s.data['notToScale']=True;s.point('K',(0,H));s.point('L',(2,2*math.sqrt(3)));s.line('A','C');s.line('K','B');s.relation('midpoint',point='K',segment=['D','C']);s.data['givenCases']=[{'appliesToParts':['2','3','4'],'givenArea':{'polygon':['A','K','L'],'value':str(6*(v+1))}},{'appliesToParts':['5'],'length':{'segment':['L','B'],'value':str(4*(v+1))},'angle':{'points':['K','A','L'],'degrees':30}}]
  elif n=='2.4':
   a=6+v;s=plot([(f'y={a}x−x²',lambda x:a*x-x*x),('y=tx',lambda x:a*.42*x)],0,a,(-1,a*a/3));s.data['parameterNotes']={'t':'illustrative slope, unspecified by question','intersections':'not labelled numerically'}
 elif year==2024:
  if n=='5':s=tangent_circle(60+2*v)
  elif n=='7':
   s=cuboid(k,k+2,k+1,('A','B','C','D','E','F','G','H'));s.line('B','G',arrow=True);s.line('A','E',arrow=True);s.data['coordinateSystem']='cartesian'
  elif n=='12':
   a=k;b=k+1;s=coordinate_polygon([(-2*a,0),(0,2*b),(2*a,-2*b)]);s.data['coordinateSystem']='schematic';s.data['notToScale']=True;s.point('O',(0,0));s.point('N',(a,0));s.point('M',(0,-b));s.line('A','N');s.line('B','M');s.polygon(['O','N','C','M'],'shade');s.angle('N','O','B',right=True);s.measure('A','N',3*a);s.measure('B','M',3*b)
  elif n=='18':
   s=Scene('Будсан цагираг');s.point('O',(0,0));s.circle('O',3);s.circle('O',3*k/(k+2));s.data['shadedRegions']=[{'kind':'annular_sector','center':'O','innerRadius':3*k/(k+2),'outerRadius':3,'startDegrees':135,'endDegrees':225},{'kind':'annular_sector','center':'O','innerRadius':3*k/(k+2),'outerRadius':3,'startDegrees':315,'endDegrees':405}];s.data['givenRadii']=[str(k),str(k+2)];s.curve([(-3/math.sqrt(2),-3/math.sqrt(2)),(3/math.sqrt(2),3/math.sqrt(2))]);s.curve([(-3/math.sqrt(2),3/math.sqrt(2)),(3/math.sqrt(2),-3/math.sqrt(2))])
  elif n=='25':
   s=cone(r=5,h=12);s.measure('O','R',5*k);s.relation('sin_edge_to_base_angle',edge=['H','R'],baseRadius=['O','R'],value='12/13');s.angle('H','O','R',right=True)
  elif n=='27':
   s=Scene('Тойрог ба гаднах цэг',cartesian=True);s.point('O',(0,0));s.circle('O',2*k);s.point('A',(4*k,3*k));s.line('O','A','dashed');s.data['notes'].append('Хамгийн ойр цэгийн координатыг зурагт хариу болгон өгөөгүй.')
  elif n=='33':
   h=math.sqrt(20);b=-math.sqrt(44);c=math.sqrt(80);s=triangle(points=[(0,h),(b,0),(c,0)]);s.point('D',(0,0));s.circle('D',h);s.point('M',(b*5/8,h*3/8));s.point('N',(c*.4,h*.6));s.line('A','D');s.angle('A','D','C',right=True);scale=v+1;s.measure('A','M',5*scale);s.measure('M','B',3*scale);s.measure('A','N',4*scale)
  elif n=='34':s=plot([("y=f′(x)",lambda x:-(x-v-1)**2+4)],v-1.6,v+3.6,(-1,5));s.data['represents']='derivative';s.data['givenInitialValue']={'x':v,'value':-4}
  elif n=='36':
   s=triangle(names='OAB');A=s.data['points']['A']['position'];B=s.data['points']['B']['position'];s.point('M',[a/2 for a in A]);s.point('N',[k*b/(k+2) for b in B]);s.line('B','M');s.line('A','N');s.point('P',[(2*A[i]+k*B[i])/(k+4) for i in range(2)]);s.relation('ratio',segments=[['O','N'],['N','B']],values=[k,2]);s.relation('midpoint',point='M',segment=['O','A'])
  elif n=='2.1':
   h=v;s=plot([('y=f(x)',lambda x:h+math.sqrt(7*(x-h)-3)-1)],h+3/7,h+7);s.data['constructionRequests']=[{'kind':'inverse_function_graph','derivedFrom':'y=f(x)','draw':'on request, not supplied as an answer'}]
  elif n=='2.2':
   s=Scene('Тэгш өнцөгт хайрцгийн огтлогч хавтгай','3d');a=2*math.sqrt(5);b=2*math.sqrt(11);h=math.sqrt(5)
   for name,pos in {'D':(0,0,0),'A':(a,0,0),'C':(0,b,0),'B':(a,b,0),'H':(0,0,h),'E':(a,0,h),'G':(0,b,h),'F':(a,b,h)}.items():s.point(name,pos)
   for u,w in [('D','A'),('A','B'),('B','C'),('C','D'),('H','E'),('E','F'),('F','G'),('G','H'),('D','H'),('A','E'),('B','F'),('C','G')]:s.line(u,w)
   s.polygon(['A','C','H'],'shade');scale=v+1;s.measure('D','A',f'{2*scale}√5');s.measure('D','C',f'{2*scale}√11');s.measure('D','H',f'{scale}√5')
  elif n=='2.4':
   h=v;scale=v+1;s=plot([('y=f(x)',lambda x:scale*abs((x-h)**2-7*(x-h))/2),('l',lambda x:scale*(x-h+9)/2)],h-1.5,h+9.5,(-3,scale*10));s.point('T',(h+3,6*scale));s.relation('tangent_to_curve',point='T',curveLabel='y=f(x)',lineLabel='l')
 elif year==2025:
  if n=='13':
   b=k if v%2 else -k;s=plot([('y=ax+b',lambda x:x+b)],-k-2,k+2,(-k-4,k+4));s.data['choicePanels']=[{'option':letter,'description':text,'geometry':{'kind':'parabola','opening':'up' if 'Дээш' in text else 'down','roots':'zero_only' if 'цорын' in text else 'zero_and_negative' if 'сөрөг' in text else 'zero_and_positive'}} for letter,text in q['options'].items()]
  elif n=='17':
   near=math.pi*v/10;far=4*math.pi/5;R=3;s=Scene('Хоёр огтлогчийн хоорондох өнцөг');s.point('O',(0,0));s.circle('O',R);D=(-R*math.cos(near/2),R*math.sin(near/2));E=(D[0],-D[1]);B=(R*math.cos(far/2),R*math.sin(far/2));C=(B[0],-B[1]);A=(D[0]-D[1]*(B[0]-D[0])/(B[1]-D[1]),0)
   for name,pos in zip(['A','B','C','D','E'],[A,B,C,D,E]):s.point(name,pos)
   s.line('A','B');s.line('A','C');s.angle('B','A','C');s.relation('arc_measure',center='O',endpoints=['B','C'],value='4π/5',unit='radian');s.relation('arc_measure',center='O',endpoints=['D','E'],value=f'{F(v,10)}π',unit='radian')
  elif n=='20':
   s=Scene('Тойргийн төв ба параллель шулуун',cartesian=True);s.point('O',(-k,-k));s.circle('O',2);s.point('A',(2-k,1-k));s.point('P',(1-k,3-k));s.line('O','A');s.data['constructionRequests']=[{'kind':'parallel_line','through':'P','parallelTo':['O','A'],'draw':'not supplied as answer'}]
  elif n=='26':
   s=trapezoid(9,4,6);s.point('O',(4.5,3));s.circle('O',3,fill='shade');s.measure('A','B',18*(v+1));s.measure('C','D',8*(v+1));s.relation('inscribed_circle',polygon=['A','B','C','D'],circleCenter='O')
  elif n=='31':
   r=k;s=coordinate_polygon([(0,0),(0,2*r),(4*r,2*r),(4*r,0)],list('PQRS'));s.point('O',(r,r));s.circle('O',r);s.point('B',(2*r,r));s.point('A',(2*r/5,r/5));s.line('Q','S');s.line('P','B');s.line('A','B',style='highlight')
  elif n=='33':
   a=k+1;b=k;L=math.sqrt(a*a+b*b-a*b);A=(0,0);B=(a,0);C=(b/2,b*math.sqrt(3)/2);s=triangle(points=[A,B,C]);P=((b*B[0]+a*C[0])/(a+b),(b*B[1]+a*C[1])/(a+b));s.point('P',P);s.point('Q',(a/2,0));s.line('A','P');s.line('P','Q',arrow=True);s.relation('angle_bisector',vertex='A',ray=['A','P'],sides=[['A','B'],['A','C']]);s.relation('midpoint',point='Q',segment=['A','B']);s.relation('ratio',segments=[['A','B'],['A','C']],values=[a,b])
  elif n=='36':
   s=plot([('y=x−h+4',lambda x:x-v+4),('y=e^(x−h−1/2)',lambda x:math.exp(x-v-.5))],v-4,v+2,(0,6));s.data['constructionRequests']=[{'kind':'horizontal_connector','pointOnEachCurve':True,'height':'variable','maximum':'not marked'}]
  elif n=='2.1':
   h=v;s=plot([('y=f(x)',lambda x:-(x-h)**2/2+50)],h-12,h+12,(-15,55));s.point('A',(h-10,0));s.point('B',(h+10,0));s.point('C',(0,(100-h*h)/2));s.data['constructionRequests']=[{'kind':'absolute_value_graph','curveLabel':'y=f(x)'},{'kind':'horizontal_line','height':'variable'}]
  elif n=='2.3':
   a=k+5;s=plot([('y=√(ax)',lambda x:math.sqrt(a*x)),('y=x',lambda x:x)],0,a*1.15);s.point('T',(a,a));s.data['givenTangencyAbscissa']=a;s.data['constructionRequests']=[{'kind':'tangent_line','point':'T','equation':'not supplied as answer'},{'kind':'solid_of_revolution','axis':'Ox','betweenCurves':['y=√(ax)','y=x']}]
  elif n=='2.4':
   s=Scene('Бага сууриараа нийлсэн хоёр огтлогдсон конус','3d');s.point('O0',(0,0,0),'');s.point('O1',(0,0,3),'');s.point('O2',(0,0,6),'');s.circle('O0',4);s.circle('O1',3);s.circle('O2',4)
   for sign in [-1,1]:
    names=[]
    for i,(r,z) in enumerate([(4,0),(3,3),(4,6)]):name=f'P{sign}_{i}';s.point(name,(sign*r,0,z),'');names.append(name)
    s.line(names[0],names[1]);s.line(names[1],names[2])
   scale=v+1;s.data['givenDimensions']={'totalHeight':6*scale,'smallDiameter':30*scale,'largeDiameter':40*scale}
 elif year==2026:
  if n=='7':
   theta=min(42,20+5*v);s=rename_points(tangent_circle(2*theta),{'B':'P','C':'B'});s.data['relations']=[r for r in s.data['relations'] if r.get('kind')!='angle'];s.angle('P','A','B',f'{theta}°')
  elif n=='30':
   r=k+1;s=Scene('Тойрог ба хувьсах шулуун',cartesian=True);s.point('O',(0,0));s.circle('O',r);s.curve([(-r*1.2,-r*.8),(r*.8,r*1.2)],'y=x+t');s.data['parameterNotes']={'t':'unspecified; illustrative non-tangent line','requiredCase':'exactly one intersection'}
  elif n=='31':
   w=k+2;h=k+4;s=Scene('Пирамидын талсын хавтгай','3d',True)
   for name,pos in {'M':(0,0,0),'N':(w,0,0),'P':(w,h,0),'Q':(0,h,0),'S':(w-1,2,4)}.items():s.point(name,pos)
   s.polygon(list('MNPQ'))
   for name in 'MNPQ':s.line(name,'S')
   s.polygon(['N','P','S'],'shade')
  elif n=='35':
   s=trapezoid(7,5,3.6,right=True);s.point('O',(2.6,2.6));s.circle('O',2.6);s.point('M',(2.6,0));s.point('N',(0,2.6));s.point('L',(.2,3.6));s.polygon(['A','M','L','D'],'shade');scale=v+1;s.measure('A','D',18*scale);s.relation('ratio',segments=[['A','B'],['D','C']],values=[7,5]);s.data['givenMeanBaseLength']=str(30*scale)
  elif n=='2.2':
   s=cuboid(6,6,6);s.point('N',(6,3,6));s.point('M',(6,6,2));s.polygon(['A','N','M'],'shade');s.relation('midpoint',point='N',segment=['B1','C1']);s.relation('ratio',segments=[['C1','M'],['M','C']],values=[2,1]);s.measure('M','N',5*(v+1));s.data['constructionRequests']=[{'kind':'plane_section','through':['A','N','M'],'solid':'cube','fullPolygon':'to construct; not supplied as answer'}]
  elif n=='2.3':
   a=v+4;alpha=3*a;s=plot([('y=αx−3x²',lambda x:alpha*x-3*x*x),('y=tx',lambda x:(alpha-6.5)*x)],0,a,(-1,alpha*a*.3));s.data['parameterNotes']={'t':'illustrative slope, unspecified; intersection abscissa is not labelled'}

 # Preserve and standardize the existing statistical diagrams as renderable data too.
 if s is None and q.get('figure'):
  old=q['figure'];old=old.get('constructionData',old)
  if old.get('kind') in ['stem_leaf','histogram','boxplot','probability_bars']:
   return {'schema':SCHEMA,'kind':'statistical','chartType':old['kind'],'data':old,'notToScale':False,'title':q['skill']}
 if year==2024 and n=='2.3':
  scale=v+1;return {'schema':SCHEMA,'kind':'statistical','chartType':'histogram','data':{'bins':[[1+v,3+v],[3+v,5+v],[5+v,7+v],[7+v,9+v]],'frequencyDensity':[2*scale,6*scale,3*scale,scale]},'notToScale':False,'title':'Давтамжийн нягтын гистограмм'}
 if s is None:return None
 result=s.done();result['sourceQuestion']={'year':year,'variant':{2016:'C',2017:'D'}.get(year,'A'),'number':n,'figureCatalog':f'{year}/reference/figures.json'}
 result['displayPolicy']='question_figure' if n in SOURCE_DIAGRAMS[year] else 'optional_illustration'
 result['answerLabelsIncluded']=False
 return result

def enrich(paper):
 for q in paper['questions']:
  figure=figure_for(paper['referenceYear'],int(paper['mockVariant'][1:]),q)
  if figure:
   figure.setdefault('sourceQuestion',{'year':paper['referenceYear'],'variant':paper['referenceVariant'],'number':q['number'],'figureCatalog':f"{paper['referenceYear']}/reference/figures.json"})
   figure.setdefault('displayPolicy','question_figure' if q['number'] in SOURCE_DIAGRAMS[paper['referenceYear']] else 'optional_illustration')
   figure.setdefault('answerLabelsIncluded',False)
   q['figure']=figure
 paper['figureSchema']=SCHEMA
 return paper
