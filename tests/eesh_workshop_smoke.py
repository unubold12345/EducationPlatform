"""Workshop → ЭЕШ: the tab and its five subject tiles, a subject page (format by year, topic points by year, recurring
topics), «Дасгал» opening the drill page (/labs/eesh/<subject>/drill), the topic drill for a free account (free paper, by domain only) and an ЭЕШ plan (ten questions across years,
checked by the practice API, not repeated once checked, then shown as a weak topic), API guards, the open-sitting block
and the phone layout. Real pages, real server code, real database; simulated payment; no AI call.
"""
import os,re
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/');ORIGIN={'Origin':BASE}
DRILL=BASE+'/api/labs/eesh-drill'
SUBJECTS=['math','physics','chemistry','biology','english']

def signup(context,name):
 r=context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':name,'email':'qa-exam-eesh-'+uuid4().hex[:12]+'@example.invalid','password':'Local-Test-'+uuid4().hex});assert r.ok,r.status
def subscribe(context,program):
 order=context.request.post(BASE+'/api/subscriptions/orders',headers=ORIGIN,data={'program':program}).json()
 assert context.request.post(BASE+'/api/subscriptions/orders/'+order['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
def no_keys(body):
 for item in body['items']:
  assert not {'answers','answer','answerDisplay','explanation','answerValue'}&set(item),item.keys()
def fits(page):
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),page.url
def answer_all(page):
 items=page.locator('#drill li[aria-labelledby^="drill-"]');expect(items).to_have_count(10)
 for i in range(10):
  item=items.nth(i);item.locator('.answer-option').first.click();item.get_by_role('button',name='Шалгах').click()
  expect(item).to_have_attribute('data-result',re.compile('correct|wrong'))
  expect(item.get_by_text(re.compile('^(Зөв|Буруу)$'))).to_be_visible()

with sync_playwright() as p:
 browser=p.chromium.launch();errors=[]
 # Guest: the tab, the tiles and a subject page are public; the drill asks for sign-in and its API refuses.
 guest=browser.new_context(viewport={'width':1440,'height':950});gp=guest.new_page();gp.on('pageerror',lambda e:errors.append(str(e)))
 gp.goto(BASE+'/workspace/workshop?exam=eesh');tabs=gp.get_by_role('navigation',name='Шалгалт')
 expect(tabs.get_by_role('link',name='ЭЕШ')).to_have_attribute('aria-current','page')
 tiles=gp.locator('.workshop-tile');expect(tiles).to_have_count(5)
 for index,subject in enumerate(SUBJECTS):expect(tiles.nth(index)).to_have_attribute('href','/labs/eesh/'+subject)
 expect(tiles.first.locator('svg[role=img]')).to_be_visible()
 gp.screenshot(path=str(ART/'eesh-workshop-tab.png'),full_page=True)
 tiles.first.click();expect(gp).to_have_url(BASE+'/labs/eesh/math')
 expect(gp.get_by_role('heading',name='Математик: жилээс жилд юу өөрчлөгдсөн бэ?')).to_be_visible()
 for name in ['Бүтэц жилээр','Сэдвийн оноо жилээр','Хамгийн их давтагддаг даалгавар','Сэдвээр дасгал']:expect(gp.get_by_role('heading',name=name,exact=True)).to_be_visible()
 expect(gp.get_by_role('heading',name='Таны сул сэдэв')).to_have_count(0)
 expect(gp.locator('table').first).to_contain_text('2015–2026');expect(gp.locator('table').first).to_contain_text('2020 оны mock байхгүй')
 expect(gp.locator('table').nth(1).locator('tbody tr')).to_have_count(6)
 launch=gp.locator('section',has=gp.get_by_role('heading',name='Сэдвээр дасгал',exact=True));expect(launch).to_contain_text('Нэвтэрч')
 expect(launch.get_by_role('link',name='Дасгал нээх →')).to_have_attribute('href','/labs/eesh/math/drill')
 # «Дасгал» opens the drill page on that topic; a guest is asked to sign in and comes back to the drill page.
 gp.locator('a[aria-label$=": дасгал хийх"]').first.click();expect(gp).to_have_url(re.compile(r'/labs/eesh/math/drill\?topic=[a-z-]+$'))
 expect(gp.locator('#drill').get_by_role('link',name='Нэвтэрч')).to_have_attribute('href','/login?next=%2Flabs%2Feesh%2Fmath%2Fdrill')
 # An older ?topic= link on the subject page goes on to the drill page.
 gp.goto(BASE+'/labs/eesh/math?topic=logarithm');expect(gp).to_have_url(BASE+'/labs/eesh/math/drill?topic=logarithm');expect(gp.get_by_role('heading',level=1)).to_have_text('Логарифм')
 assert gp.goto(BASE+'/labs/eesh/history/drill').status==404
 # The 2027 forecast: linked from the subject page, public, with the predicted make-up, chances and the backtest.
 gp.goto(BASE+'/labs/eesh/math');gp.get_by_role('link',name='Таамаг үзэх →').click();expect(gp).to_have_url(BASE+'/labs/eesh/math/forecast')
 expect(gp.get_by_role('heading',level=1)).to_have_text('2027 оны ЭЕШ: Математик хичээлд юу гарч болох вэ?')
 for name in ['Таамагласан бүтэц','Гарч болох сэдэв ба даалгавар','Даалгавар бүрээр','Чиглэлийн оноо','Хэр найдвартай вэ?']:expect(gp.get_by_role('heading',name=name,exact=True)).to_be_visible()
 makeup=gp.locator('section',has=gp.get_by_role('heading',name='Таамагласан бүтэц',exact=True))
 assert sum(int(n) for n in makeup.locator('li b').all_inner_texts())==40,'math make-up adds up to 36 + 4'
 expect(gp.get_by_role('heading',name=re.compile('^Бараг заавал гарна'))).to_be_visible()
 expect(gp.locator('a[aria-label$=": дасгал хийх"]').first).to_have_attribute('href',re.compile(r'^/labs/eesh/math/drill\?topic=[a-z-]+$'))
 expect(gp.locator('section',has=gp.get_by_role('heading',name='Хэр найдвартай вэ?')).locator('tbody tr')).to_have_count(3)
 # Physics follows each year's own paper (2026-11-20): chances and a backtest like the others; 2024 copies 2026 and is left out.
 gp.goto(BASE+'/labs/eesh/physics/forecast');reliable=gp.locator('section',has=gp.get_by_role('heading',name='Хэр найдвартай вэ?'));expect(reliable).to_contain_text('2024 оны хувилбар олдоогүй');expect(reliable.locator('tbody tr')).to_have_count(3)
 gp.goto(BASE+'/labs/eesh/biology/forecast');expect(gp.locator('section',has=gp.get_by_role('heading',name='Таамагласан бүтэц',exact=True))).to_contain_text('II хэсэг · 4 бүтээх даалгавар · чиглэлээр')
 assert gp.goto(BASE+'/labs/eesh/history/forecast').status==404
 gp.goto(BASE+'/labs/eesh/physics');expect(gp.locator('table').first).to_contain_text('I хэсгийн оноо 80 → 76')
 gp.goto(BASE+'/labs/eesh/biology');expect(gp.locator('table').first).to_contain_text('Сонгох асуулт 50 → 46')
 gp.goto(BASE+'/labs/eesh/english');expect(gp.locator('table').first).to_contain_text('Хасагдсан: Сонсож ойлгох')
 assert gp.goto(BASE+'/labs/eesh/history').status==404
 assert guest.request.get(DRILL+'?subject=math&topic=logarithm').status==401
 guest.close()

 # Free account: no topic drill; a domain drill comes from the free paper and is checked by the practice API.
 free=browser.new_context(viewport={'width':1440,'height':950});signup(free,'ЭЕШ Workshop free')
 assert free.request.get(DRILL+'?subject=math&topic=logarithm').status==402
 for query in ['?subject=math','?subject=history&topic=logarithm','?subject=math&topic=nope','?subject=math&topic=logarithm&domain=Алгебр','?subject=english&topic=reading-mc']:
  assert free.request.get(DRILL+query).status==400,query
 body=free.request.get(DRILL+'?subject=math&domain=Алгебр').json();no_keys(body)
 assert body['freeOnly'] and body['items'] and all(item['slug']=='eesh-math-free' and item['year'] is None for item in body['items']),body
 fp=free.new_page();fp.on('pageerror',lambda e:errors.append(str(e)))
 # A topic the free account cannot drill: a plan notice, and the picker offers the areas it can drill.
 fp.goto(BASE+'/labs/eesh/math/drill?topic=logarithm');expect(fp.get_by_role('heading',level=1)).to_have_text('Сэдвээр дасгал')
 expect(fp.locator('p',has_text='«Логарифм» сэдвээр')).to_contain_text('ЭЕШ багц');select=fp.get_by_label('Сэдэв',exact=True)
 assert all(value.startswith('domain:') for value in select.locator('option').evaluate_all('o=>o.map(x=>x.value)'))
 expect(fp.locator('#drill')).to_contain_text('ЭЕШ багц')
 # The picker's choice gets its own address and loads there.
 with fp.expect_response(lambda r:'/api/labs/eesh-drill' in r.url):select.select_option('domain:Алгебр');fp.get_by_role('button',name='10 асуулт авах').click()
 expect(fp).to_have_url(re.compile(r'/labs/eesh/math/drill\?domain='));expect(fp.get_by_role('heading',level=1)).to_have_text('Алгебр')
 first=fp.locator('#drill li[aria-labelledby^="drill-"]').first;expect(first).to_contain_text('Үнэгүй туршилт')
 first.locator('.answer-option').first.click();first.get_by_role('button',name='Шалгах').click();expect(first).to_have_attribute('data-result',re.compile('correct|wrong'))
 fp.goto(BASE+'/labs/eesh/math');expect(fp.get_by_role('heading',name='Таны сул сэдэв')).to_be_visible()
 free.close()

 # ЭЕШ plan: ten questions of one topic from different years; checked ones do not come back; the topic is then a weak-topic card.
 plan=browser.new_context(viewport={'width':1440,'height':950});signup(plan,'ЭЕШ Workshop plan');subscribe(plan,'entrance')
 body=plan.request.get(DRILL+'?subject=chemistry&topic=equilibrium').json();no_keys(body)
 assert len(body['items'])==10 and body['open']==body['total']==18 and not body['freeOnly'],body
 assert len({item['year'] for item in body['items']})>=5 and len({(item['year'],item['label']) for item in body['items']})==10
 page=plan.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/labs/eesh/math')
 # Logarithm ranks below the top ten, in the «Бусад … сэдэв» block.
 page.locator('details').filter(has_text='Бусад').locator('summary').click()
 with page.expect_response(lambda r:'/api/labs/eesh-drill' in r.url) as loaded:page.get_by_role('link',name='Логарифм: дасгал хийх').click()
 expect(page).to_have_url(re.compile(r'/labs/eesh/math/drill\?topic=logarithm$'));expect(page.get_by_role('heading',level=1)).to_have_text('Логарифм')
 expect(page.get_by_label('Сэдэв',exact=True)).to_have_value('topic:logarithm')
 answered={(item['slug'],item['id']) for item in loaded.value.json()['items']};assert len(answered)==10
 answer_all(page);expect(page.locator('#drill').get_by_text(re.compile(r'10/10 шалгасан'))).to_be_visible()
 expect(page.locator('#drill').get_by_role('button',name='Шинэ 10 асуулт').last).to_be_visible()
 page.screenshot(path=str(ART/'eesh-drill-1440.png'),full_page=True)
 # The ten answered questions are in their mocks' practice records and are not offered again.
 for slug,qid in answered:assert qid in plan.request.get(BASE+'/api/exam-practice/'+slug).json()['reveals']
 again=plan.request.get(DRILL+'?subject=math&topic=logarithm').json()
 assert again['items'] and not answered&{(item['slug'],item['id']) for item in again['items']}
 # Another topic from the picker gets its own address, heading and questions.
 with page.expect_response(lambda r:'/api/labs/eesh-drill' in r.url) as switched:
  page.get_by_label('Сэдэв',exact=True).select_option('topic:quadratic');page.locator('#drill').get_by_role('button',name='Шинэ 10 асуулт').first.click()
 assert switched.value.ok;expect(page).to_have_url(re.compile(r'/labs/eesh/math/drill\?topic=quadratic$'));expect(page.get_by_role('heading',level=1)).to_have_text('Квадрат тэгшитгэл, Виет')
 page.goto(BASE+'/labs/eesh/math');weak=page.locator('section',has=page.get_by_role('heading',name='Таны сул сэдэв'))
 expect(weak).to_contain_text('Логарифм');expect(weak).to_contain_text('/10 зөв')
 expect(weak.get_by_role('link',name='Дасгал').first).to_have_attribute('href',re.compile(r'^/labs/eesh/math/drill\?(topic|domain)='))
 page.screenshot(path=str(ART/'eesh-math-1440.png'),full_page=True)

 # Phone width: no sideways scroll; the wide tables scroll inside their frame.
 page.set_viewport_size({'width':390,'height':900})
 # Drill pages are measured once their questions show: figures are up to 900 px wide and long topic names fill the picker.
 for path in ['/workspace/workshop?exam=eesh','/labs/eesh/english','/labs/eesh/math/drill?topic=logarithm','/labs/eesh/physics/drill?topic=heat','/labs/eesh/biology/drill','/labs/eesh/math/forecast','/labs/eesh/chemistry/forecast','/labs/eesh/biology/forecast']:
  page.goto(BASE+path)
  if '/drill?' in path:expect(page.locator('#drill li[aria-labelledby^="drill-"]')).to_have_count(10)
  page.wait_for_timeout(300);fits(page)
 page.goto(BASE+'/labs/eesh/english');page.screenshot(path=str(ART/'eesh-english-390.png'),full_page=True)

 # An open timed sitting closes the drill, as it closes practice.
 attempt=plan.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':'eesh-math-free'});assert attempt.ok,attempt.status
 blocked=plan.request.get(DRILL+'?subject=math&topic=logarithm');assert blocked.status==403 and blocked.json()['href'].startswith('/exams/attempts/'),blocked.status
 plan.close();browser.close()
 assert not errors,errors
print('PASS: Workshop ЭЕШ tab (5 subject tiles), subject pages (format changes, topic points by year, recurring topics), drill for a free account '
      '(free paper by domain, 402 for topics) and an ЭЕШ plan (10 across years, no keys, checked ones not repeated, weak-topic card), 400/401 guards, '
      'open-sitting block, phone layout')
