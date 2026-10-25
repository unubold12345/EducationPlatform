import os,json,subprocess,hashlib
from pathlib import Path
from uuid import uuid4
from datetime import datetime
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/');ORIGIN={'Origin':BASE};ART=ROOT/'artifacts'
archive=json.loads((ROOT/'assets/papers/dornod-2026.json').read_text(encoding='utf-8'));keys=json.loads((ROOT/'src/modules/papers/regional-keys.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True);context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 external=[]
 def block(route):external.append(route.request.url);route.abort()
 context.route('**://dornodedu.mn/**',block)
 page.goto(BASE+'/exams');page.locator('.regional-exam-entry a').click();expect(page.locator('.regional-exam-card')).to_have_count(2)
 for theme in ['light','dark']:
  for width in [1440,390,320]:
   page.set_viewport_size({'width':width,'height':1000});page.evaluate('t=>document.documentElement.dataset.theme=t',theme);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(ART/f'regional-category-{theme}-{width}.png'),full_page=True)
 for image in archive['files']:
  response=context.request.get(BASE+image['url']);assert response.status==200;assert hashlib.sha256(response.body()).hexdigest()==image['sha256']
 for paper in archive['papers']:
  page.goto(BASE+'/exams/'+paper['slug']);expect(page.locator('.official-briefing')).to_contain_text('Дорнод');assert context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':paper['slug']}).status==401
 def register(ctx):
  r=ctx.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'Regional QA','email':'qa-regional-'+uuid4().hex[:12]+'@example.invalid','password':'Local-Regional-'+uuid4().hex});assert r.ok,r.status
 register(context);other=browser.new_context();register(other)
 math=archive['papers'][0]['slug'];english=archive['papers'][1]['slug']
 assert context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':math}).status==402
 page.goto(BASE+'/checkout/'+math);expect(page.locator('.checkout-summary')).to_contain_text('ДОРНОД');expect(page.locator('.checkout-summary')).to_contain_text('100 минут')
 page.get_by_role('button',name='Туршилтаар төлөх',exact=False).click();expect(page.get_by_role('heading',name='Эрх нээгдсэн')).to_be_visible()
 assert context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':english}).status==402
 order=context.request.post(BASE+'/api/subscriptions/orders',headers=ORIGIN,data={'program':'entrance'}).json();assert context.request.post(BASE+'/api/subscriptions/orders/'+order['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
 for paper in archive['papers']:
  slug=paper['slug'];key=keys[slug];math=paper['subject']=='math';r=context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':slug});assert r.ok,(slug,r.text());id=r.json()['id'];endpoint=BASE+'/api/paper-attempts/'+id
  initial=context.request.get(endpoint).json();assert initial['report'] is None and initial['keySources']==[];assert key['version'] not in json.dumps(initial)
  assert initial['paper']['publisher']==archive['publisher'];assert initial['paper']['regional']
  seconds=(datetime.fromisoformat(initial['deadline'])-datetime.fromisoformat(initial['serverNow'])).total_seconds();assert (5990<=seconds<=6000 if math else 4790<=seconds<=4800)
  assert context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':slug}).json()['id']==id
  assert other.request.get(endpoint).status==404;assert other.request.put(endpoint,headers=ORIGIN,data={}).status==404
  page.goto(BASE+'/papers/attempts/'+id);page.wait_for_load_state('networkidle');expect(page.locator('.paper-toolbar')).to_contain_text('ДОРНОД')
  expect(page.locator('.paper-choice')).to_have_count(len(key['choices']));expect(page.locator('.paper-fill')).to_have_count(len(key['fills']));assert page.locator('.math-scratchpad').count()==(1 if math else 0)
  assert '"choices":' not in page.content() and key['version'] not in page.content()
  for n,url in enumerate(paper['pages'],1):
   page.get_by_label('Албан материалын хуудас',exact=True).select_option(str(n));page.wait_for_function("document.querySelector('.official-page-image')?.naturalWidth>500");assert page.locator('.official-page-image').get_attribute('src')==url;assert '/key/' not in url
  page.get_by_label('1 · '+key['choices'][0],exact=True).check()
  eight=next(f for f in key['fills'] if len(f['digits'])==8)
  page.get_by_label(eight['id']+' · h',exact=True).fill(eight['digits'][-1]);expect(page.get_by_role('status')).to_have_text('Бүх өөрчлөлт хадгалагдсан',timeout=15000)
  page.reload();expect(page.get_by_label(eight['id']+' · h',exact=True)).to_have_value(eight['digits'][-1]);assert context.request.get(endpoint).json()['deadline']==initial['deadline']
  state=context.request.get(endpoint).json()
  for responses in [{'1':'F'},{str(len(key['choices'])+1):'A'},{eight['id']:'123456789'}]:assert context.request.put(endpoint,headers=ORIGIN,data={'revision':state['revision'],'responses':responses,'submit':False}).status==400
  assert context.request.put(endpoint,headers={'Origin':'https://untrusted.invalid'},data={}).status==403
  assert context.request.put(endpoint,headers=ORIGIN,data={'revision':0,'responses':{},'submit':False}).status==409
  for i,a in enumerate(key['choices']):page.get_by_label(f'{i+1} · {a}',exact=True).check()
  for fill in key['fills']:
   for label,digit in zip('abcdefgh',fill['digits']):page.get_by_label(fill['id']+' · '+label,exact=True).fill(digit)
  expect(page.get_by_role('status')).to_have_text('Бүх өөрчлөлт хадгалагдсан',timeout=15000)
  for theme in ['light','dark']:
   for width in [1440,390,320]:
    page.set_viewport_size({'width':width,'height':1000});page.evaluate('t=>document.documentElement.dataset.theme=t',theme);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(slug,width);page.screenshot(path=str(ART/f'regional-{paper["subject"]}-{theme}-{width}.png'),full_page=True)
  if math:expect(page.locator('.paper-answer-sheet')).to_contain_text('хэсэгчилсэн оноо тооцохгүй')
  page.once('dialog',lambda dialog:dialog.accept());page.get_by_role('button',name='Шалгалтыг эцэслэн илгээх',exact=True).click();expect(page.locator('.paper-result h2')).to_have_text('100 / 100',timeout=15000)
  result=context.request.get(endpoint).json();assert result['keySources']==paper['keyPages'];assert context.request.put(endpoint,headers=ORIGIN,data={'revision':0,'responses':{},'submit':True}).json()['report']==result['report']
  page.get_by_role('link',name='Дахин өгөх / заавар').click();expect(page.locator('.official-briefing h1')).to_contain_text('Онлайн сорил-4')
  # Expiry uses only saved answers and preserves the original server deadline.
  retry=context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':slug}).json()['id'];url=BASE+'/api/paper-attempts/'+retry
  assert context.request.put(url,headers=ORIGIN,data={'revision':0,'responses':{'1':key['choices'][0]},'submit':False}).ok
  subprocess.check_output(['node','--import','tsx','tests/regional_paper_fixture.mjs',retry],cwd=ROOT)
  result=context.request.put(url,headers=ORIGIN,data={'revision':1,'responses':{},'submit':True}).json();assert result['status']=='SUBMITTED' and result['report']['score']==key['choiceMarks'][0]
  page.goto(BASE+'/dashboard');expect(page.locator('a[href="/papers/attempts/'+retry+'"] h3')).to_contain_text('2026 · Дорнод')
 page.goto(BASE+'/exams/eec-english');expect(page.locator('.regional-english-entry a')).to_have_attribute('href','/exams/dornod-2026-english-online-4')
 page.goto(BASE+'/programs/entrance');expect(page.locator('.regional-exam-entry a')).to_have_attribute('href','/exams/dornod-2026')
 assert not external,external;assert not errors,errors;browser.close()
print('PASS: both 2026 regional timed exams, all 33 image hashes/source outage, 8-cell UI/autosave, full UI 100/100 submissions, key privacy, checkout/plan isolation, ownership, stale writes, immutable reports, expiry/history, discovery and responsive themes.')
