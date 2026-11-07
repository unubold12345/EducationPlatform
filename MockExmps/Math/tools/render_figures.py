"""Small offline SVG renderer. No browser/app imports; no scripts or remote resources."""
import math
from html import escape

def render(f):
 if f['kind']!='scene':return render_chart(f)
 points=f['points'];three=f['space']=='3d'
 def project(p):return (p[0]+.42*p[1],p[2]+.28*p[1]) if three else p[:2]
 positions=[project(p['position']) for p in points.values()]
 for o in f['objects']:
  if o['kind']=='polyline':positions.extend(project(p) for p in o['positions'])
  if o['kind'] in ['circle','circle3d']:
   c=points[o['center']]['position'];r=o['radius']
   positions.extend(project([c[0]+r*math.cos(i*math.pi/24),c[1]+r*math.sin(i*math.pi/24)]+([c[2]] if three else [])) for i in range(48))
 if not positions:return None
 xmin=min(p[0] for p in positions);xmax=max(p[0] for p in positions);ymin=min(p[1] for p in positions);ymax=max(p[1] for p in positions)
 scale=min(340/max(xmax-xmin,.1),220/max(ymax-ymin,.1));cx=(xmin+xmax)/2;cy=(ymin+ymax)/2
 def xy(p):
  x,y=project(p);return (210+(x-cx)*scale,150-(y-cy)*scale)
 def named(n):return xy(points[n]['position'])
 def pair(p):return f'{p[0]:.2f},{p[1]:.2f}'
 out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 300" role="img">',f'<title>{escape(f["title"])}</title>','<rect width="420" height="300" fill="white"/>','<g stroke="#172b4d" stroke-width="1.6" fill="none" stroke-linejoin="round">']
 def line(a,b,dash=False):out.append(f'<line x1="{a[0]:.2f}" y1="{a[1]:.2f}" x2="{b[0]:.2f}" y2="{b[1]:.2f}"'+(' stroke-dasharray="5 4"' if dash else '')+'/>')
 if f['coordinateSystem']=='cartesian' and not three:
  if xmin<=0<=xmax:line(xy((0,ymin)),xy((0,ymax)),True)
  if ymin<=0<=ymax:line(xy((xmin,0)),xy((xmax,0)),True)
 for region in f.get('shadedRegions',[]):
  c=points[region['center']]['position'];a,b=region['startDegrees'],region['endDegrees'];angles=[math.radians(a+(b-a)*i/40) for i in range(41)]
  coords=[xy((c[0]+region['outerRadius']*math.cos(t),c[1]+region['outerRadius']*math.sin(t))) for t in angles]+[xy((c[0]+region['innerRadius']*math.cos(t),c[1]+region['innerRadius']*math.sin(t))) for t in reversed(angles)]
  out.append('<polygon points="'+' '.join(map(pair,coords))+'" fill="#bbcce5" stroke="none"/>')
 for o in f['objects']:
  kind=o['kind'];fill='#dce6f5' if o.get('fill') else 'none';dash=' stroke-dasharray="5 4"' if o.get('style')=='dashed' else ''
  if kind=='segment':
   a,b=named(o['from']),named(o['to']);line(a,b,o.get('style')=='dashed')
   if o.get('arrow'):
    dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy)
    if length:
     for sign in [-1,1]:line(b,(b[0]-9*dx/length+sign*4*dy/length,b[1]-9*dy/length-sign*4*dx/length))
  elif kind in ['polygon','polyline']:
   coords=[named(n) for n in o['points']] if kind=='polygon' else [xy(p) for p in o['positions']]
   out.append(f'<{kind} points="'+ ' '.join(map(pair,coords))+f'" fill="{fill}"{dash}/>')
  elif kind=='circle':
   c=named(o['center']);out.append(f'<circle cx="{c[0]:.2f}" cy="{c[1]:.2f}" r="{o["radius"]*scale:.2f}" fill="{fill}"{dash}/>')
  elif kind=='circle3d':
   c=points[o['center']]['position'];r=o['radius'];coords=[xy([c[0]+r*math.cos(i*math.pi/32),c[1]+r*math.sin(i*math.pi/32),c[2]]) for i in range(65)]
   out.append('<polyline points="'+' '.join(map(pair,coords))+'"/>')
 # Right-angle marks are topology cues, not computed answer labels.
 for r in f['relations']:
  if r['kind']=='right_angle':
   a,o,b=map(named,r['points']);u=(a[0]-o[0],a[1]-o[1]);v=(b[0]-o[0],b[1]-o[1]);ul=math.hypot(*u);vl=math.hypot(*v)
   if ul and vl:
    p=(o[0]+9*u[0]/ul,o[1]+9*u[1]/ul);q=(p[0]+9*v[0]/vl,p[1]+9*v[1]/vl);t=(o[0]+9*v[0]/vl,o[1]+9*v[1]/vl);line(p,q);line(q,t)
 out.append('</g><g font-family="Segoe UI, sans-serif" font-size="13" fill="#172b4d">')
 def label(p,text):
  text=str(text);w=max(8,len(text)*7);x=max(4,min(p[0],414-w));y=max(15,min(p[1],288))
  out.append(f'<rect x="{x-2:.2f}" y="{y-12:.2f}" width="{w+3}" height="16" fill="white"/><text x="{x:.2f}" y="{y:.2f}">{escape(text)}</text>')
 for i,o in enumerate(o for o in f['objects'] if o.get('label')):label((22,20+16*i),o['label'])
 if f['coordinateSystem']=='cartesian' and not three:
  # Integer ticks retain graph-reading information without highlighting roots/extrema.
  for axis,lo,hi in [('x',xmin,xmax),('y',ymin,ymax)]:
   step=max(1,math.ceil((hi-lo)/10))
   if (axis=='x' and ymin<=0<=ymax) or (axis=='y' and xmin<=0<=xmax):
    for t in range(math.ceil(lo/step)*step,math.floor(hi/step)*step+1,step):
     p=xy((t,0) if axis=='x' else (0,t));label((p[0]+3,p[1]+15),t)
 for name,p in points.items():
  if p['label']:
   x,y=named(name);label((x+5,y-6),p['label'])
 for m in f['measurements']:
  a,b=named(m['from']),named(m['to']);label(((a[0]+b[0])/2+5,(a[1]+b[1])/2-5),m['text'])
 for r in f['relations']:
  if r['kind']=='angle' and 'text' in r:
   a,o,b=map(named,r['points']);u=(a[0]-o[0],a[1]-o[1]);v=(b[0]-o[0],b[1]-o[1]);ul=math.hypot(*u);vl=math.hypot(*v)
   if ul and vl:label((o[0]+18*(u[0]/ul+v[0]/vl),o[1]+18*(u[1]/ul+v[1]/vl)),r['text'])
 out.append('</g></svg>');return ''.join(out)

def render_chart(f):
 d=f['data'];kind=f['chartType'];out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 300" role="img">',f'<title>{escape(f["title"])}</title>','<rect width="420" height="300" fill="white"/>','<g stroke="#172b4d" fill="none" stroke-width="1.5">'];labels=[]
 def line(x1,y1,x2,y2):out.append(f'<path d="M{x1},{y1} L{x2},{y2}"/>')
 def rect(x,y,w,h):out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#dce6f5"/>')
 if kind=='boxplot':
  a,b,c,e,z=[d[k] for k in ['minimum','lowerQuartile','median','upperQuartile','maximum']];xx=lambda v:45+330*(v-a)/(z-a)
  line(xx(a),145,xx(z),145);rect(xx(b),115,xx(e)-xx(b),60)
  for v in [a,c,z]:line(xx(v),115,xx(v),175)
  labels=[(xx(v)-5,200,str(v)) for v in [a,b,c,e,z]]
 elif kind=='histogram':
  bins=d['bins'];heights=d['frequencyDensity'];lo=bins[0][0];hi=bins[-1][1];xx=lambda v:45+330*(v-lo)/(hi-lo);line(45,250,380,250);line(45,250,45,35)
  for (a,b),h in zip(bins,heights):
   hh=190*h/max(heights);rect(xx(a),250-hh,xx(b)-xx(a),hh);labels.append((xx(a)+5,240-hh,str(h)));labels.append((xx(a)-5,270,str(a)))
  labels.append((xx(hi)-5,270,str(hi)))
 elif kind=='stem_leaf':
  # Retain exact source table values and the key, rather than inventing bins.
  rows=d.get('rows',d.get('stems',{}));labels=[(35,35,'stem | leaf')]
  if isinstance(rows,dict):rows=list(rows.items())
  for i,row in enumerate(rows):labels.append((40,65+25*i,str(row[0])+' | '+' '.join(map(str,row[1]))))
  labels.append((35,275,str(d.get('key',''))))
 elif kind=='probability_bars':
  values=d.get('values',d.get('x',[]));probs=d.get('probabilities',d.get('p',[]));line(45,250,380,250)
  if isinstance(probs,dict):values=list(probs);probs=list(probs.values())
  for i,(v,p) in enumerate(zip(values,probs)):
   from fractions import Fraction
   h=float(Fraction(str(p)))*190;x=55+i*300/max(1,len(values));rect(x,250-h,35,h);labels.extend([(x,270,str(v)),(x,240-h,str(p))])
 out.append('</g><g font-family="Segoe UI, sans-serif" font-size="14" fill="#172b4d">')
 for x,y,t in labels:out.append(f'<text x="{x}" y="{y}">{escape(t)}</text>')
 out.append('</g></svg>');return ''.join(out)

def attach_svg(paper):
 for q in paper['questions']:
  f=q.get('figure')
  if f:
   svg=render(f)
   if svg:f['svg']=svg
   if f.get('choicePanels'):
    from figures import plot
    f['choiceSvgs']={}
    for panel in f['choicePanels']:
     g=panel['geometry'];sign=1 if g['opening']=='up' else -1;root={'zero_only':0,'zero_and_negative':-2,'zero_and_positive':2}[g['roots']]
     scene=plot([(panel['option'],lambda x:sign*x*(x-root))],-3,3,(-4,5),title=panel['description']).done()
     f['choiceSvgs'][panel['option']]=render(scene)
 return paper
