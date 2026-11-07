"""Rebuild source locators and offline comparison page; preserve source assets."""
import hashlib,json
from pathlib import Path
from html import escape
from figures import SOURCE_DIAGRAMS,SCHEMA
ROOT=Path(__file__).resolve().parents[1]
def load(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def page(year,n):
 if n.startswith('2.'):
  return (5 if n in ['2.1','2.2'] else 6) if year in [2018,2019] else (7 if n in ['2.1','2.2'] else 8)
 q=int(n)
 if year==2018:return 2 if q<=13 else 3 if q<=25 else 4
 if year==2019:return 2 if q<=12 else 3 if q<=25 else 4
 return 2 if q<=10 else 3 if q<=20 else 4 if q<=27 else 5 if q<=33 else 6

def build():
 cards=[];total=0
 for year in SOURCE_DIAGRAMS:
  base=ROOT/str(year);ref=load(base/'reference.json');paper=load(base/'mock-01.json');trans=load(base/'reference/transcription.json') if year>=2022 else None
  original={q['number']:q for q in trans['questions']} if trans else {}
  questions={};mockqs={q['number']:q for q in paper['questions']}
  for n in sorted(SOURCE_DIAGRAMS[year],key=lambda n:float(n) if not n.startswith('2.') else 100+float(n)):
   assets=[]
   if trans:
    for a in original[n]['figures']:
     rel=a['path'];rel=rel if rel.startswith('reference/') else 'reference/'+rel
     assets.append({'path':rel,'mediaType':'image/png','sha256':a['sha256'],'sourceUrl':a['sourceUrl']})
   elif year>=2018:
    rel=f'reference/{page(year,n)}.jpg';p=base/rel
    assets=[{'path':rel,'mediaType':'image/jpeg','contains':'Complete source page; locate the question number','sha256':hashlib.sha256(p.read_bytes()).hexdigest()}]
   else:
    p=next((base/'reference').glob('*.pdf'));assets=[{'path':'reference/'+p.name,'mediaType':'application/pdf','questionNumber':n,'contains':'Annotated mirror booklet; locate the printed question number','sha256':hashlib.sha256(p.read_bytes()).hexdigest()}]
   f=mockqs[n].get('figure',{})
   questions[n]={'number':n,'sourceAssets':assets,'sourceAppearance':'Use the retained source asset as the authoritative appearance. Mock coordinates are adapted, not a transcription of original coordinates.','diagramFamily':f.get('title',mockqs[n]['skill']),'mockFigureLocation':f'questions[number={n}].figure','sourceKind':ref.get('referenceKind',ref.get('sourceType','retained_reference'))}
   if trans:questions[n]['sourcePrompt']=original[n]['prompt']
  catalog={'schemaVersion':1,'referenceYear':year,'referenceVariant':paper['referenceVariant'],'figureSchema':SCHEMA,'pathsRelativeTo':str(year)+'/','originalCoordinatesReconstructed':False,'notes':['Original source figures are preserved unchanged in sourceAssets.','Mock geometry is schematic unless explicitly Cartesian; never use drawn lengths as an answer.','Additional optional mock illustrations are not evidence of a printed source diagram.'],'questions':questions}
  save(base/'reference/figures.json',catalog)
  blueprint=load(base/'blueprint.json');blueprint['figureSchema']=SCHEMA;blueprint['sourceFigureCatalog']='reference/figures.json'
  for item in blueprint['mapping']:
   f=mockqs[item['mockQuestion']].get('figure')
   if f:item['figure']={'kind':f['kind'],'displayPolicy':f['displayPolicy'],'location':'questions[].figure'}
  save(base/'blueprint.json',blueprint)
  ref['figureCatalog']='reference/figures.json';ref['figureCatalogNotes']='Source assets are authoritative; adapted mock scenes are separate.'
  rel='reference/figures.json';p=base/rel;entry={'path':rel,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'provenance':'Locally authored source-figure catalog'}
  ref['files']=[a for a in ref['files'] if a['path']!=rel]+[entry];save(base/'reference.json',ref)
  for q in paper['questions']:
   f=q.get('figure')
   if not f:continue
   total+=5;source=questions.get(q['number']);links=''
   if source:
    links=' '.join(f'<a href="{year}/{escape(a["path"])}">Source {i+1}</a>' for i,a in enumerate(source['sourceAssets']))
   choices=''.join(f'<div><b>{letter}</b>{svg}</div>' for letter,svg in f.get('choiceSvgs',{}).items())
   cards.append(f'<article><h2>{year} · M1 · {q["number"]}</h2><p>{escape(f.get("displayPolicy","question_figure"))} {links}</p>{f.get("svg","")}{choices}<p>{escape(q["prompt"])}</p></article>')
 manifest=load(ROOT/'manifest.json');manifest['figureSchema']=SCHEMA;manifest['mockQuestionsWithFigures']=total;manifest['figureDocumentation']='FIGURES.md';manifest['offlineFigurePreview']='figures-preview.html';save(ROOT/'manifest.json',manifest)
 html='<!doctype html><html lang="mn"><meta charset="utf-8"><title>Math figure review</title><style>body{font:15px Segoe UI,sans-serif;background:#eef2f7;margin:24px;color:#172b4d}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px}article{background:white;padding:20px;border-radius:8px}svg{width:100%;max-height:300px}h2{font-size:18px}p{line-height:1.5}</style><h1>Offline Math figure review · M1 examples</h1><p>Answer-free diagrams from each year. Optional illustrations must remain hidden in exam mode unless teacher review approves them. Source links open retained originals. All five forms carry their own parameterized figures in JSON.</p><main>'+''.join(cards)+'</main></html>'
 (ROOT/'figures-preview.html').write_text(html,encoding='utf8')
 return total
if __name__=='__main__':print(build())
