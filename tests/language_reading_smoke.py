"""Workshop → JLPT/HSK/TOPIK → Унших дасгал: paid only (Ази хэл Basic/Pro; a free account gets a locked tile, a locked
page and 403), guest sign-in redirect and 401, request checks that charge nothing, one real AI text per exam through the
page (8 credits each, shown on the rail meter), the reading aids (furigana/pinyin/romanization, romaji, word gaps, a
translation per sentence or for all, sizes, and the voice with a stubbed speechSynthesis), texts kept in this browser after
a reload, history and delete, a timed sitting closing the page and the route, and the phone layout. Real page, real
server code, real database and real DeepSeek calls (three texts; a text the checks refuse twice is not charged).
"""
import os,re
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/');ORIGIN={'Origin':BASE}
API=BASE+'/api/labs/reading'
PLANS=re.compile('Ази хэл Basic.*багцад багтана')
CYRILLIC=re.compile('[А-Яа-яӨөҮүЁё]')
PRICE=8  # a short text
# The browser's voices are stubbed: every utterance is recorded and "ends" after a short pause, so the page's player
# (one sentence, the whole text in order, stop, slow) is checked without sound.
SPEECH='''(() => {
 const spoken = window.__spoken = [];
 let timers = [];
 const fake = {
  getVoices: () => [{ lang: "ja-JP", name: "QA ja" }, { lang: "zh-CN", name: "QA zh" }, { lang: "ko-KR", name: "QA ko" }],
  speak(u) { spoken.push({ text: u.text, lang: u.lang, rate: u.rate }); timers.push(setTimeout(() => u.onend && u.onend(), 700)); },
  cancel() { timers.forEach(clearTimeout); timers = []; },
  addEventListener() {}, removeEventListener() {}, speaking: false, pending: false, paused: false,
 };
 Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
})();'''

def signup(context,name):
 r=context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':name,'email':'qa-reading-'+uuid4().hex[:12]+'@example.invalid','password':'Local-Test-'+uuid4().hex});assert r.ok,r.status
def subscribe(context,program):
 order=context.request.post(BASE+'/api/subscriptions/orders',headers=ORIGIN,data={'program':program}).json()
 assert context.request.post(BASE+'/api/subscriptions/orders/'+order['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
def body(**patch):
 data={'exam':'jlpt','level':'n5-kanji','length':'short','topic':'food','custom':''};data.update(patch);return data
def meter(page):
 '''The rail's AI credit meter (credits left this month).'''
 text=page.locator('.wsp-credits:not(.is-yellow) strong').first.text_content().strip()
 return int(re.match(r'[\d,]+',text).group(0).replace(',',''))
def fits(page,what):
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),what+': no horizontal page scroll'

refused=[]
def generate(page,exam,level,topic=None,custom=None):
 '''One short text through the page. A reply the server's checks refuse twice is a 503 without a charge; that is
 recorded, the meter is checked, and the page tries again (at most twice more).'''
 for attempt in range(3):
  page.goto(BASE+'/labs/reading/'+exam);before=meter(page)
  setup=page.get_by_role('region',name='Шинэ текст')
  setup.get_by_role('group',name='Түвшин').get_by_role('button',name=level,exact=True).click()
  if topic: setup.get_by_role('group',name='Сэдэв').get_by_role('button',name=topic,exact=True).click()
  if custom: setup.get_by_label('Өөр сэдэв (заавал биш)').fill(custom)
  setup.get_by_role('group',name='Урт').get_by_role('button',name=re.compile('^Богино')).click()
  expect(setup.get_by_role('button',name=re.compile('^Текст үүсгэх'))).to_contain_text(f'{PRICE} кредит')
  page.wait_for_timeout(3000)  # the route keeps a short pause after each text (one request in flight, then 2 s)
  with page.expect_response(lambda r:r.url==API and r.request.method=='POST',timeout=200000) as hit:
   setup.get_by_role('button',name=re.compile('^Текст үүсгэх')).click()
  response=hit.value
  if response.status==503 and attempt<2:
   refused.append((exam,level,response.json().get('error')))
   expect(page.locator('[role="alert"]')).to_be_visible()
   page.reload();assert meter(page)==before,'a refused text is not charged'
   continue
  assert response.ok,(response.status,response.text())
  data=response.json();credits=data['credits'];reading=data['reading']
  assert credits['action']=='language-reading' and credits['spent']==PRICE,credits
  assert reading['exam']==exam and 4<=len(reading['sentences'])<=6,reading
  expect(page.get_by_text(f'Текст бэлэн боллоо. {PRICE} кредит зарцууллаа.')).to_be_visible()
  expect(page.locator('#reading-title')).to_have_text(reading['title'])
  # The page keeps the text after a reload; the rail meter shows the charge.
  page.reload();expect(page.locator('#reading-title')).to_have_text(reading['title'])
  assert meter(page)==before-PRICE,(before,meter(page))
  return reading
 raise AssertionError('no text after three tries')

with sync_playwright() as p:
 browser=p.chromium.launch();errors=[]
 # Signed out: the page sends to sign-in, the route refuses; an unknown exam is not found.
 guest=browser.new_context();gp=guest.new_page()
 gp.goto(BASE+'/labs/reading/jlpt');expect(gp).to_have_url(re.compile(r'/login\?next='))
 assert guest.request.post(API,headers=ORIGIN,data=body()).status==401
 assert gp.goto(BASE+'/labs/reading/ielts').status==404
 guest.close()

 # Free account: locked tile on each exam tab, locked page, 403 from the route.
 free=browser.new_context(viewport={'width':1280,'height':900});signup(free,'Free Reading');fp=free.new_page();fp.on('pageerror',lambda e:errors.append(str(e)))
 for exam,title,level in [('jlpt','JLPT','n5-kanji'),('hsk','HSK','hsk-1'),('topik','TOPIK','topik-1')]:
  fp.goto(BASE+'/workspace/workshop?exam='+exam);tile=fp.locator('.workshop-tile').filter(has_text='Унших дасгал')
  expect(tile).to_have_attribute('href','/workspace/plans');expect(tile).to_contain_text(PLANS)
  fp.goto(BASE+'/labs/reading/'+exam);expect(fp.get_by_role('heading',name=title+' · Унших дасгал')).to_be_visible()
  expect(fp.locator('main, .wsp-content').get_by_text(PLANS).first).to_be_visible();assert fp.get_by_role('button',name=re.compile('^Текст үүсгэх')).count()==0
  denied=free.request.post(API,headers=ORIGIN,data=body(exam=exam,level=level));assert denied.status==403 and 'Basic' in denied.json()['error'],denied.text()
 free.close()

 # Basic: the tile opens the page; request checks charge nothing.
 basic=browser.new_context(viewport={'width':1280,'height':900});signup(basic,'Basic Reading');subscribe(basic,'asian_basic')
 basic.add_init_script(SPEECH)
 page=basic.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/workspace/workshop?exam=jlpt');tile=page.locator('.workshop-tile').filter(has_text='Унших дасгал')
 expect(tile).to_have_attribute('href','/labs/reading/jlpt');expect(tile).to_contain_text('Уншиж эхлэх')
 tile.click();expect(page).to_have_url(BASE+'/labs/reading/jlpt');expect(page.get_by_role('heading',name='Унших дасгал',exact=True)).to_be_visible()
 expect(page.get_by_role('navigation',name='Workspace цэс').get_by_role('link',name='Workshop')).to_have_attribute('aria-current','page')
 expect(page.get_by_text('Эхний текстээ үүсгээрэй')).to_be_visible()
 start=meter(page)
 post=lambda data:basic.request.post(API,headers=ORIGIN,data=data)
 for response,status,why in [
  (basic.request.post(API,data=body()),403,'no origin'),
  (basic.request.post(API,headers={**ORIGIN,'Content-Type':'text/plain'},data='exam=jlpt'),415,'not JSON'),
  (post(body(level='hsk-1')),400,'a level of another exam'),
  (post(body(exam='ielts',level='hiragana')),400,'not a language exam'),
  (post(body(length='huge')),400,'unknown length'),
  (post(body(topic='politics')),400,'unknown topic'),
  (post(body(custom='а'*61)),400,'custom topic over 60 characters'),
  (post({**body(),'model':'deepseek-pro'}),400,'unknown field'),
  (post(body(custom='а'*1200)),413,'body over 2 KB'),
 ]: assert response.status==status,(why,response.status,response.text())
 page.reload();assert meter(page)==start,'refused requests are not charged'
 assert page.goto(BASE+'/labs/reading/ielts').status==404

 # JLPT: N5 with N5 kanji.
 jp=generate(page,'jlpt','N5 · ханзтай',topic='Хоол')
 article=page.locator('article[aria-labelledby="reading-title"]');tools=page.get_by_role('toolbar',name='Уншлагын туслах')
 lines=article.locator('ol > li');line=lines.first;count=len(jp['sentences']);expect(lines).to_have_count(count)
 expect(article).to_contain_text('JLPT · N5 · ханзтай · Хоол · Богино')
 # Furigana on by default, then off and on.
 rt=article.locator('rt');expect(rt.first).to_be_visible()
 first_reading=next(seg['r'] for token in jp['sentences'][0]['tokens'] for seg in token['seg'] if seg.get('r'))
 expect(line.locator('rt').first).to_have_text(first_reading)
 furigana=tools.get_by_role('button',name='ふりがな');expect(furigana).to_have_attribute('aria-pressed','true')
 furigana.click();expect(rt).to_have_count(0);furigana.click();expect(rt.first).to_be_visible()
 # Romaji under each word.
 romaji=article.locator('p[lang="ja"] span[lang="en"]');expect(romaji).to_have_count(0)
 tools.get_by_role('button',name='Romaji').click();expect(romaji.first).to_be_visible()
 expect(line.locator('span[lang="en"]').first).to_have_text(next(token['ro'] for token in jp['sentences'][0]['tokens'] if token.get('ro')))
 # Word gaps.
 gaps=tools.get_by_role('button',name='Үг салгах');expect(gaps).to_have_attribute('aria-pressed','false')
 plain=line.locator('p').first.get_attribute('class');gaps.click();expect(gaps).to_have_attribute('aria-pressed','true')
 assert line.locator('p').first.get_attribute('class')!=plain;gaps.click()
 # The translation is hidden until asked, per sentence or for all.
 mn=jp['sentences'][0]['mn'];assert CYRILLIC.search(mn),mn
 expect(line).not_to_contain_text(mn);expect(line.get_by_role('button',name='Орчуулга')).to_have_attribute('aria-expanded','false')
 line.get_by_role('button',name='Орчуулга').click();expect(line.get_by_role('button',name='Нуух')).to_have_attribute('aria-expanded','true')
 expect(line).to_contain_text(mn);line.get_by_role('button',name='Нуух').click();expect(line).not_to_contain_text(mn)
 tools.get_by_role('button',name='Орчуулга').click();expect(article.get_by_role('button',name='Нуух')).to_have_count(count)
 expect(lines.last).to_contain_text(jp['sentences'][-1]['mn'])
 # Sizes.
 sizes=tools.get_by_role('group',name='Үсгийн хэмжээ');sizes.get_by_role('button',name='Том үсэг').click();expect(article).to_have_attribute('data-size','2')
 sizes.get_by_role('button',name='Дунд үсэг').click();expect(article).to_have_attribute('data-size','1')
 # Read again hides the translations; the aids are remembered after a reload.
 article.get_by_role('button',name='Дахин унших').click();expect(article.get_by_role('button',name='Нуух')).to_have_count(0)
 page.reload();expect(tools.get_by_role('button',name='Romaji')).to_have_attribute('aria-pressed','true');expect(romaji.first).to_be_visible()
 # Voice: one sentence, the whole text in order, stop, slow.
 line.get_by_role('button',name='1-р өгүүлбэрийг сонсох').click();expect(line).to_have_attribute('data-playing','')
 page.wait_for_function('window.__spoken.length===1');expect(line).not_to_have_attribute('data-playing','')
 spoken=page.evaluate('window.__spoken');assert spoken[0]['text']==jp['sentences'][0]['text'] and spoken[0]['lang']=='ja-JP',spoken
 page.wait_for_timeout(900);assert page.evaluate('window.__spoken.length')==1,'one sentence only'
 page.evaluate('window.__spoken.length=0');tools.get_by_role('button',name='Бүгдийг сонсох').click();expect(tools.get_by_role('button',name='Зогсоох')).to_be_visible()
 expect(tools.get_by_role('button',name='Бүгдийг сонсох')).to_be_visible(timeout=20000)
 assert [item['text'] for item in page.evaluate('window.__spoken')]==[s['text'] for s in jp['sentences']],'the whole text in order'
 page.evaluate('window.__spoken.length=0');tools.get_by_role('button',name='Бүгдийг сонсох').click();page.wait_for_function('window.__spoken.length===2')
 tools.get_by_role('button',name='Зогсоох').click();heard=page.evaluate('window.__spoken.length');page.wait_for_timeout(1500)
 assert heard<count and page.evaluate('window.__spoken.length')==heard,'stop ends the run'
 tools.get_by_role('button',name='Удаан').click();line.get_by_role('button',name='1-р өгүүлбэрийг сонсох').click();page.wait_for_function('window.__spoken.length===3')
 assert abs(page.evaluate('window.__spoken[2].rate')-0.65)<0.01;tools.get_by_role('button',name='Удаан').click()
 # New text focuses the generate button; history lists the text.
 article.get_by_role('button',name='Шинэ текст').click();page.wait_for_function('document.activeElement?.textContent?.startsWith("Текст үүсгэх")')
 history=page.get_by_role('region',name='Сүүлийн текстүүд');expect(history.get_by_role('listitem')).to_have_count(1);expect(history).to_contain_text(jp['title'])
 expect(tools.get_by_role('button',name='Бүгдийг сонсох')).to_be_visible()
 line.get_by_role('button',name='Орчуулга').click();page.screenshot(path=str(ART/'language-reading-jlpt-desktop.png'),full_page=True)

 # HSK 1: pinyin with tone marks, the Chinese voice, no romaji; history per exam.
 zh=generate(page,'hsk','HSK 1',topic='Гэр бүл')
 article=page.locator('article[aria-labelledby="reading-title"]');tools=page.get_by_role('toolbar',name='Уншлагын туслах');line=article.locator('ol > li').first
 first_pinyin=next(seg['r'] for token in zh['sentences'][0]['tokens'] for seg in token['seg'] if seg.get('r'))
 expect(line.locator('rt').first).to_have_text(first_pinyin);assert re.search('[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]',''.join(seg.get('r','') for t in zh['sentences'][0]['tokens'] for seg in t['seg']))
 expect(line.locator('p[lang="zh-Hans"]')).to_be_visible();assert tools.get_by_role('button',name='Romaji').count()==0
 pinyin=tools.get_by_role('button',name='Pinyin');pinyin.click();expect(article.locator('rt')).to_have_count(0);pinyin.click()
 page.evaluate('window.__spoken.length=0');line.get_by_role('button',name='1-р өгүүлбэрийг сонсох').click();page.wait_for_function('window.__spoken.length===1')
 assert page.evaluate('window.__spoken[0].lang')=='zh-CN'
 history=page.get_by_role('region',name='Сүүлийн текстүүд');expect(history.get_by_role('listitem')).to_have_count(1);expect(history).to_contain_text(zh['title'])
 line.get_by_role('button',name='Орчуулга').click();expect(line).to_contain_text(zh['sentences'][0]['mn'])
 expect(tools.get_by_role('button',name='Бүгдийг сонсох')).to_be_visible()
 # Closing punctuation never starts a line: it sits in the same word group as the word before it.
 assert page.evaluate("[...document.querySelectorAll('article ol p > span')].every(group => !/^[。，、！？]/.test(group.textContent.trim()) || group === group.parentElement.firstElementChild)")
 page.screenshot(path=str(ART/'language-reading-hsk-desktop.png'),full_page=True)

 # TOPIK I with the student's own topic: Hangul with Revised Romanization, no ruby, no word-gap toggle.
 ko=generate(page,'topik','TOPIK Ⅰ',custom='миний муур')
 assert ko['topic']=='миний муур',ko['topic']
 article=page.locator('article[aria-labelledby="reading-title"]');tools=page.get_by_role('toolbar',name='Уншлагын туслах');line=article.locator('ol > li').first
 expect(article).to_contain_text('миний муур');assert article.locator('rt').count()==0 and tools.get_by_role('button',name='Үг салгах').count()==0
 roman=article.locator('p[lang="ko"] span[lang="en"]');expect(roman.first).to_have_text(ko['sentences'][0]['tokens'][0]['ro'])
 tools.get_by_role('button',name='Romanization').click();expect(roman).to_have_count(0);tools.get_by_role('button',name='Romanization').click()
 page.evaluate('window.__spoken.length=0');line.get_by_role('button',name='1-р өгүүлбэрийг сонсох').click();page.wait_for_function('window.__spoken.length===1')
 assert page.evaluate('window.__spoken[0].lang')=='ko-KR'
 expect(tools.get_by_role('button',name='Бүгдийг сонсох')).to_be_visible()
 # A wrapped line starts flush with the first one (the word gap is a real space, not a margin).
 boxes=page.evaluate("[...document.querySelectorAll('article ol li p')].map(line => [...line.children].map(word => { const box = word.getBoundingClientRect(); return [Math.round(box.left), Math.round(box.top)]; }))")
 for words in boxes:
  starts=[left for (left,top),(_,before) in zip(words[1:],words) if top>before+4]
  assert all(abs(left-words[0][0])<=1 for left in starts),words
 page.screenshot(path=str(ART/'language-reading-topik-desktop.png'),full_page=True)

 # Phone: one column, no sideways scroll, with romaji and every translation shown.
 page.set_viewport_size({'width':375,'height':812})
 for exam in ['jlpt','hsk','topik']:
  page.goto(BASE+'/labs/reading/'+exam);expect(page.locator('#reading-title')).to_be_visible()
  page.get_by_role('toolbar',name='Уншлагын туслах').get_by_role('button',name='Орчуулга').click()
  fits(page,exam);page.screenshot(path=str(ART/f'language-reading-{exam}-phone.png'),full_page=True)
 page.goto(BASE+'/workspace/workshop?exam=jlpt');fits(page,'workshop jlpt tab')
 page.set_viewport_size({'width':1280,'height':900})

 # Delete from history: the empty state comes back and stays after a reload.
 page.goto(BASE+'/labs/reading/hsk');page.get_by_role('button',name=f'«{zh["title"]}» устгах').click()
 expect(page.get_by_text('Эхний текстээ үүсгээрэй')).to_be_visible();page.reload();expect(page.get_by_text('Эхний текстээ үүсгээрэй')).to_be_visible()
 page.goto(BASE+'/labs/reading/jlpt');expect(page.locator('#reading-title')).to_have_text(jp['title'])

 # A timed sitting closes the page and the route, and nothing is charged.
 before=meter(page)
 started=basic.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':'jlpt-n5-01'})
 if started.status==402:
  order=basic.request.post(BASE+'/api/mock-payments',headers=ORIGIN,data={'slug':'jlpt-n5-01'});assert order.ok,order.text()
  assert basic.request.post(BASE+'/api/mock-payments/'+order.json()['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
  started=basic.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':'jlpt-n5-01'})
 assert started.ok,started.text()
 blocked=post(body());assert blocked.status==409,blocked.text()
 page.reload();expect(page.get_by_text('Цагтай шалгалт явагдаж байхад энэ хэсэг нээгдэхгүй.')).to_be_visible();assert meter(page)==before
 basic.close()
 # A Next dev-only performance measure can report a negative timestamp; it is not an app error.
 errors=[error for error in errors if 'negative time stamp' not in error]
 assert not errors,errors
 browser.close()
print('refused and retried (no charge):',refused or 'none')
print('PASS: reading practice paid only (free: locked tiles/pages, 403), guest redirect and 401, 404 for other exams, '
 'origin/JSON/level/length/topic/custom/unknown-field/size checks without a charge, one real text each for JLPT N5 kanji, '
 'HSK 1 and TOPIK I (8 credits each, receipt and rail meter, kept after reload), furigana/pinyin/romanization and romaji '
 'toggles, word gaps, translation per sentence and for all, sizes, read again, aids remembered, stubbed voice (one, all '
 'in order, stop, slow, language per exam), history per exam and delete, timed sitting closes page and route, phone '
 'layout at 375 px without sideways scroll')
