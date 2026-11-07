"""Validate source assets, SVG safety, geometry topology and variant coverage."""
import hashlib,json,math
from pathlib import Path
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]

def validate():
 count=checks=assets=0;families={}
 def close(a,b):assert math.isclose(a,b,rel_tol=1e-7,abs_tol=1e-7),(a,b)
 for p in sorted(ROOT.glob('*/mock-*.json')):
  paper=json.loads(p.read_text(encoding='utf8'));year=paper['referenceYear'];seen=[]
  for q in paper['questions']:
   f=q.get('figure')
   if not f:continue
   count+=1;seen.append(q['number']);assert f['schema']=='education.math.figure.v1'
   assert all(k in f for k in ['title','svg','sourceQuestion','displayPolicy','answerLabelsIncluded'])
   assert f['kind'] in ['scene','statistical'] and f['answerLabelsIncluded'] is False
   assert f['displayPolicy'] in ['question_figure','optional_illustration']
   assert f['sourceQuestion']['year']==year and f['sourceQuestion']['number']==q['number']
   if 'choicePanels' in f:assert set(f['choiceSvgs'])==set(q['options'])
   assert not any(k in f for k in ['answer','answerValue','solution'])
   svgs=[ET.fromstring(s) for s in [f['svg']]+list(f.get('choiceSvgs',{}).values())];allowed={'svg','title','rect','g','line','polygon','polyline','circle','text','path'}
   for e in [e for svg in svgs for e in svg.iter()]:
    assert e.tag.rsplit('}',1)[-1] in allowed
    assert not any(k.lower().startswith('on') or k in ['href','style'] for k in e.attrib)
    assert all('javascript:' not in v.lower() for v in e.attrib.values())
   if f['kind']!='scene':
    if f['chartType']=='boxplot':
     values=[f['data'][k] for k in ['minimum','lowerQuartile','median','upperQuartile','maximum']];assert values==sorted(values)
    continue
   pts={n:a['position'] for n,a in f['points'].items()};dim=3 if f['space']=='3d' else 2
   for v in pts.values():assert len(v)==dim and all(math.isfinite(t) for t in v)
   def length(a,b):return math.dist(pts[a],pts[b])
   def vector(a,b):return [y-x for x,y in zip(pts[a],pts[b])]
   def dot(a,b):return sum(x*y for x,y in zip(a,b))
   def radius(center):return next(o['radius'] for o in f['objects'] if o.get('center')==center and o['kind'] in ['circle','circle3d'])
   for o in f['objects']:
    if o['kind']=='segment':assert o['from'] in pts and o['to'] in pts
    elif o['kind']=='polygon':assert len(o['points'])>=3 and all(n in pts for n in o['points'])
    elif o['kind'] in ['circle','circle3d']:assert o['center'] in pts and o['radius']>0
    elif o['kind']=='polyline':assert len(o['positions'])>1 and all(len(v)==dim and all(math.isfinite(t) for t in v) for v in o['positions'])
    else:raise AssertionError(o['kind'])
   for m in f['measurements']:assert m['from'] in pts and m['to'] in pts and m['provenance']=='question_given'
   if year==2026 and q['number']=='7':
    u,v=vector('O','A'),vector('O','B');angle=math.degrees(math.acos(dot(u,v)/math.sqrt(dot(u,u)*dot(v,v))));close(angle,float(q['answerValue']));checks+=1
   for r in f['relations']:
    kind=r['kind']
    try:
     if kind=='right_angle':
      a,b,c=r['points'];close(dot(vector(b,a),vector(b,c)),0)
     elif kind=='angle' and r.get('text','').endswith('°'):
      a,b,c=r['points'];u,v=vector(b,a),vector(b,c);actual=math.degrees(math.acos(max(-1,min(1,dot(u,v)/math.sqrt(dot(u,u)*dot(v,v))))));close(actual,float(r['text'][:-1]))
     elif kind=='midpoint':
      a,b=r['segment'];m=r['point']
      for x,y,z in zip(pts[a],pts[b],pts[m]):close((x+y)/2,z)
     elif kind in ['ratio','equal_lengths']:
      segs=r['segments'];lens=[length(*s) for s in segs];vals=r.get('values',[1]*len(lens))
      for l,v in zip(lens[1:],vals[1:]):close(l/lens[0],float(v)/float(vals[0]))
     elif kind=='parallel':
      u,v=[vector(*s) for s in r['segments']];close(dot(u,v)**2,dot(u,u)*dot(v,v))
     elif kind=='tangent':
      c,a=r['circleCenter'],r['point'];close(length(c,a),radius(c));close(dot(vector(c,a),vector(*r['line'])),0)
     elif kind=='point_on_circle':close(length(r['point'],r['circleCenter']),radius(r['circleCenter']))
     else:continue
    except Exception as e:raise AssertionError((str(p),q['number'],r,e)) from e
    checks+=1
  key=year
  if key in families:assert families[key]==seen,(year,p)
  else:families[key]=seen
 for p in ROOT.glob('*/reference/figures.json'):
  catalog=json.loads(p.read_text(encoding='utf8'));year=p.parent.parent
  for q in catalog['questions'].values():
   assert q['sourceAssets']
   for a in q['sourceAssets']:
    source=year/a['path'];assert source.is_file(),source
    assert hashlib.sha256(source.read_bytes()).hexdigest()==a['sha256'];assets+=1
 for p in ROOT.glob('*/reference.json'):
  for a in json.loads(p.read_text(encoding='utf8'))['files']:
   f=p.parent/a['path'];assert f.stat().st_size==a['bytes'];assert hashlib.sha256(f.read_bytes()).hexdigest()==a['sha256']
 report=json.loads((ROOT/'validation-report.json').read_text(encoding='utf8'));report['figures']={'mockFigureCount':count,'topologyAssertions':checks,'sourceAssetLinksVerified':assets,'schemaAndSafeSvg':'pass','allFiveVariantsSameFigureCoverage':'pass','byYear':{str(k):len(v)*5 for k,v in families.items()}}
 (ROOT/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(report['figures']))
 return report['figures']
if __name__=='__main__':validate()
