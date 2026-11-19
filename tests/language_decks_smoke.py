"""JLPT/HSK word decks in Workshop: exam tabs (remembered), paid-only access (Ази хэл Basic/Pro; free accounts and the
Англи хэл plans get no level, only the IELTS and TOEFL tabs), the deck page (lessons, furigana/pinyin toggle, examples, cards, quiz), progress saved on the account, API
guards, and the phone layout. Real page, real server code, real database; no AI call.
"""
import json,os,re
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/');ORIGIN={'Origin':BASE}
REVIEW=BASE+'/api/labs/words/{}/review'
ROOT=Path(__file__).resolve().parents[1]
def deck_words(deck):
 data=json.loads((ROOT/'assets'/'language-decks'/f'{deck}.json').read_text(encoding='utf-8'))
 return [word for lesson in data['lessons'] for word in lesson['words']]

def run_drill(page,words=None):
 '''Answers a Workshop quiz to the end: "meaning", "term" and pairs from the deck file when given, the first tone choice,
 and skips the rest (a skipped exercise comes back once). Returns the number of exercise screens.'''
 by_term={w['term']:w for w in words or []};by_meaning={}
 for w in words or []: by_meaning.setdefault(w['meaning'],w)
 screens=0
 for _ in range(120):
  if page.locator('#drill-result-heading').count(): return screens
  section=page.locator('section[data-kind]');kind=section.get_attribute('data-kind');screens+=1
  options=page.get_by_role('group',name='Хариултууд')
  prompt=page.locator('[data-prompt]').inner_text() if page.locator('[data-prompt]').count() else ''
  if kind=='match':
   left=page.get_by_role('group',name='Зүүн тал').get_by_role('button')
   for i in range(left.count()):
    button=left.nth(i);term=button.inner_text().strip();button.click()
    page.get_by_role('group',name='Баруун тал').get_by_role('button',name=by_term[term]['meaning'],exact=True).click()
  elif kind=='meaning' and prompt in by_term:
   options.get_by_role('button',name=by_term[prompt]['meaning'],exact=True).click();page.get_by_role('button',name='Шалгах').click()
  elif kind=='term' and prompt in by_meaning:  # kana charts only: deck word options also show their reading
   options.get_by_role('button',name=by_meaning[prompt]['term'],exact=True).click();page.get_by_role('button',name='Шалгах').click()
  elif kind=='tone':
   options.get_by_role('button').first.click();page.get_by_role('button',name='Шалгах').click()
  else:
   page.get_by_role('button',name='Алгасах').click()
  page.get_by_role('button',name='Үргэлжлүүлэх').click()
 raise AssertionError('quiz did not end')


def signup(context,name):
 r=context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':name,'email':'qa-decks-'+uuid4().hex[:12]+'@example.invalid','password':'Local-Test-'+uuid4().hex});assert r.ok,r.status
def subscribe(context,program):
 order=context.request.post(BASE+'/api/subscriptions/orders',headers=ORIGIN,data={'program':program}).json()
 assert context.request.post(BASE+'/api/subscriptions/orders/'+order['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok

with sync_playwright() as p:
 browser=p.chromium.launch();errors=[]
 # Signed out: the deck page sends to sign-in, the route refuses.
 guest=browser.new_context();gp=guest.new_page()
 for path in ['/labs/words/jlpt-n5','/labs/kana','/labs/pinyin']:
  gp.goto(BASE+path);expect(gp).to_have_url(re.compile(r'/login\?next='))
 assert guest.request.post(REVIEW.format('jlpt-n5'),headers=ORIGIN,data={'results':[{'id':'0123456789','grade':'good'}]}).status==401
 guest.close()

 # Free account: tabs, no IELTS tiles on the JLPT tab, locked tiles, locked page, 403 from the route.
 free=browser.new_context(viewport={'width':1280,'height':900});signup(free,'Free Decks');fp=free.new_page();fp.on('pageerror',lambda e:errors.append(str(e)))
 fp.goto(BASE+'/workspace/workshop');tabs=fp.get_by_role('navigation',name='Шалгалт')
 expect(tabs.get_by_role('link',name='IELTS')).to_have_attribute('aria-current','page')
 expect(fp.get_by_text('Сонсгол лаб')).to_be_visible()
 tabs.get_by_role('link',name='JLPT').click();expect(fp).to_have_url(re.compile(r'exam=jlpt'))
 expect(tabs.get_by_role('link',name='JLPT')).to_have_attribute('aria-current','page')
 expect(fp.get_by_role('heading',name='N5 үгсийн сан')).to_be_visible();expect(fp.get_by_role('heading',name='N4 үгсийн сан')).to_be_visible()
 assert fp.get_by_text('Сонсгол лаб').count()==0 and fp.get_by_text('IELTS даалгавар').count()==0,'JLPT tab shows only JLPT'
 expect(fp.locator('.workshop-tile').first).to_contain_text('Ази хэл Basic, Ази хэл Pro багцад багтана')
 expect(fp.locator('.workshop-tile').first).to_have_attribute('href','/workspace/plans')
 # The last tab is remembered.
 fp.goto(BASE+'/workspace/workshop');expect(tabs.get_by_role('link',name='JLPT')).to_have_attribute('aria-current','page')
 fp.goto(BASE+'/labs/words/jlpt-n5');expect(fp.get_by_role('heading',name='JLPT N5 үгсийн сан')).to_be_visible()
 expect(fp.get_by_text('Ази хэл Basic, Ази хэл Pro багцад багтана')).to_be_visible();assert fp.get_by_text('おはよう').count()==0
 assert free.request.post(REVIEW.format('jlpt-n5'),headers=ORIGIN,data={'results':[{'id':'0123456789','grade':'good'}]}).status==403
 fp.goto(BASE+'/workspace/workshop?exam=jlpt');expect(fp.locator('.workshop-tile').first).to_contain_text('Үсгийн хүснэгт')
 for path,title in [('/labs/kana','Хирагана · Катакана'),('/labs/pinyin','Pinyin · аялгуу')]:
  fp.goto(BASE+path);expect(fp.get_by_role('heading',name=title)).to_be_visible()
  expect(fp.get_by_text('Ази хэл Basic, Ази хэл Pro багцад багтана')).to_be_visible();assert fp.locator('table').count()==0,path
 assert free.request.post(REVIEW.format('kana-hiragana'),headers=ORIGIN,data={'results':[{'id':'0123456789','grade':'good'}]}).status==403
 fp.goto(BASE+'/labs/words/jlpt-kanji-n5');expect(fp.get_by_role('heading',name='JLPT N5 ханз')).to_be_visible()
 expect(fp.get_by_text('Ази хэл Basic, Ази хэл Pro багцад багтана')).to_be_visible();assert fp.get_by_text('イチ').count()==0
 assert free.request.post(REVIEW.format('jlpt-kanji-n5'),headers=ORIGIN,data={'results':[{'id':'0123456789','grade':'good'}]}).status==403
 # The TOEFL tab (owner requests 2026-11-19): speaking and writing practice, and the nine mocks' listening and reading labs,
 # open to every account to browse, in the IELTS tab's order.
 fp.goto(BASE+'/workspace/workshop?exam=toefl');expect(tabs.get_by_role('link',name='TOEFL')).to_have_attribute('aria-current','page')
 expect(fp.locator('.workshop-tile')).to_have_count(4)
 for index,href in enumerate(['/labs/toefl-speaking','/labs/toefl-writing','/labs/toefl-listening','/labs/toefl-reading']):expect(fp.locator('.workshop-tile').nth(index)).to_have_attribute('href',href)
 assert fp.get_by_text('N5 үгсийн сан').count()==0 and fp.get_by_text('Speaking Lab').count()==0,'TOEFL tab shows only TOEFL'
 fp.screenshot(path=str(ART/'workshop-toefl-tab.png'),full_page=True)
 # TOEFL Speaking: five Listen and Repeat scenes (no AI) and six interview topics, under the Workshop tab.
 fp.goto(BASE+'/labs/toefl-speaking');expect(fp.get_by_role('heading',name='Listen and Repeat')).to_be_visible()
 expect(fp.get_by_role('tablist',name='Нөхцөл байдал').get_by_role('tab')).to_have_count(5)
 expect(fp.get_by_text('Өгүүлбэр далд байна')).to_be_visible();expect(fp.get_by_role('button',name='▶ Сонсох')).to_be_visible()
 fp.get_by_role('tab',name='Take an Interview').click();expect(fp.get_by_role('tablist',name='Сэдэв').get_by_role('tab')).to_have_count(6)
 expect(fp.get_by_role('button',name='Ярилцлага эхлэх →')).to_be_visible()
 fp.screenshot(path=str(ART/'toefl-speaking.png'),full_page=True)
 # TOEFL Essay Studio: Build a Sentence first, checked here with no AI; then the email and discussion tasks.
 fp.goto(BASE+'/labs/toefl-writing');expect(fp.get_by_role('heading',name='Build a Sentence')).to_be_visible()
 expect(fp.locator('.toefl-practice .toefl-build')).to_have_count(1)
 fp.get_by_role('tab',name='Discussion').click();expect(fp.locator('.toefl-task')).to_be_visible()
 fp.screenshot(path=str(ART/'toefl-writing-discussion.png'),full_page=True)
 # A free account sees the mocks with their briefing links, not the lab pages.
 fp.goto(BASE+'/labs/toefl-listening');expect(fp.locator('a[data-mock^="toefl-"]')).to_have_count(9)
 assert fp.locator('a[href^="/labs/mock/"]').count()==0,'a locked mock links to its briefing'
 free.close()

 # Англи хэл Basic: the IELTS and TOEFL tabs, never the JLPT/HSK/TOPIK decks (owner rule 2026-11-19).
 english=browser.new_context(viewport={'width':1280,'height':900});signup(english,'English Decks');subscribe(english,'english_basic')
 ep=english.new_page();ep.on('pageerror',lambda e:errors.append(str(e)))
 ep.goto(BASE+'/workspace/workshop?exam=hsk');expect(ep.locator('.workshop-tile').nth(1)).to_contain_text('Ази хэл Basic, Ази хэл Pro багцад багтана')
 expect(ep.locator('.workshop-tile').nth(1)).to_have_attribute('href','/workspace/plans')
 ep.goto(BASE+'/labs/words/hsk-1');expect(ep.get_by_text('Ази хэл Basic, Ази хэл Pro багцад багтана')).to_be_visible()
 for deck in ['hsk-1','jlpt-n5','kana-hiragana']:
  assert english.request.post(REVIEW.format(deck),headers=ORIGIN,data={'results':[{'id':'0123456789','grade':'good'}]}).status==403,deck
 ep.goto(BASE+'/labs/toefl-reading');expect(ep.locator('a[href^="/labs/mock/reading/toefl-"]')).to_have_count(9)
 english.close()

 # Basic: decks open; the page, cards, quiz and saved progress.
 basic=browser.new_context(viewport={'width':1280,'height':900});signup(basic,'Basic Decks');subscribe(basic,'asian_basic')
 page=basic.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/workspace/workshop?exam=hsk');expect(page.get_by_role('heading',name='HSK 1 үгсийн сан')).to_be_visible()
 expect(page.locator('.workshop-tile').first).to_have_attribute('href','/labs/pinyin')
 expect(page.locator('.workshop-tile').nth(1)).to_have_attribute('href','/labs/words/hsk-1');expect(page.locator('.workshop-tile').nth(1)).to_contain_text('Суралцаж эхлэх')
 page.goto(BASE+'/workspace/workshop?exam=jlpt');expect(page.locator('.workshop-tile').first).to_have_attribute('href','/labs/kana')
 page.locator('.workshop-tile').nth(1).click();expect(page).to_have_url(BASE+'/labs/words/jlpt-n5')
 expect(page.get_by_role('heading',name='JLPT N5',exact=True)).to_be_visible()
 expect(page.get_by_role('navigation',name='Workspace цэс').get_by_role('link',name='Workshop')).to_have_attribute('aria-current','page')
 lessons=page.get_by_role('navigation',name='Хичээлүүд');expect(lessons.get_by_role('button')).to_have_count(29)
 words=page.locator('[aria-labelledby="deck-words-heading"] li')
 expect(words.first).to_contain_text('おはよう');expect(words).to_have_count(23)
 # Furigana toggle: kanji words show their reading; off hides it and is remembered.
 lessons.get_by_role('button').nth(1).click();expect(page.get_by_role('heading',name='Хүмүүс, гэр бүл',exact=True)).to_be_visible()
 row=words.filter(has_text='家族');expect(row).to_contain_text('かぞく')
 toggle=page.get_by_role('button',name='ふりがな');expect(toggle).to_have_attribute('aria-pressed','true')
 toggle.click();expect(toggle).to_have_attribute('aria-pressed','false');expect(row).not_to_contain_text('かぞく')
 page.reload();expect(page.get_by_role('button',name='ふりがな')).to_have_attribute('aria-pressed','false')
 page.get_by_role('button',name='ふりがな').click()
 lessons.get_by_role('button').nth(1).click();romaji=page.get_by_role('button',name='Romaji');expect(romaji).to_have_attribute('aria-pressed','false');expect(row).not_to_contain_text('kazoku')
 romaji.click();expect(row).to_contain_text('kazoku');page.reload();expect(page.get_by_role('button',name='Romaji')).to_have_attribute('aria-pressed','true')
 lessons.get_by_role('button').nth(1).click();expect(row).to_contain_text('kazoku')
 page.get_by_role('button',name='Romaji').click();expect(page.get_by_role('button',name='Romaji')).to_have_attribute('aria-pressed','false')
 lessons.get_by_role('button').nth(0).click()
 # A card opens its example (reading, meaning) as a panel after the card's row; the card keeps its place.
 words.first.get_by_role('button').first.click();example=page.locator('#deck-word-example');expect(example.locator('p[lang="ja-JP"]')).to_be_visible()
 expect(example.locator('p').nth(2)).to_contain_text(re.compile('[А-Яа-яӨөҮү]'))
 assert words.first.bounding_box()['y']==words.nth(1).bounding_box()['y'],'the open card left its row'
 # Cards (the lesson's Карт tab): grading saves progress through the deck route.
 page.get_by_role('tab',name='Карт').click();card=page.locator('[data-study-word]');expect(card).to_be_visible();first_id=card.get_attribute('data-study-word')
 page.get_by_role('button',name='Утгыг харах').click()
 with page.expect_response(lambda r:'/api/labs/words/jlpt-n5/review' in r.url) as hit:page.get_by_role('button',name='Мэдсэн').click()
 assert hit.value.ok,hit.value.status;assert hit.value.json()['words'][0]['box']==1
 expect(page.locator('[data-study-word]')).not_to_have_attribute('data-study-word',first_id)
 page.reload();page.get_by_role('navigation',name='Хичээлүүд').get_by_role('button').nth(0).click()
 expect(page.locator('[aria-labelledby="deck-words-heading"] li').first).to_contain_text('Сурч буй')
 # Today's review starts a quiz at once; the close button returns to the deck.
 page.get_by_role('button',name=re.compile('^Өнөөдрийн давталт')).click();expect(page.get_by_role('progressbar',name='Явц')).to_be_visible()
 page.get_by_role('button',name='Дасгалаас гарах').click();expect(page.get_by_role('heading',name='JLPT N5',exact=True)).to_be_visible()
 # Quiz maker: 29 lessons, kinds, count; a 5-question quiz answered from the deck file, grades saved through the route.
 page.get_by_role('button',name='Quiz үүсгэх').click();expect(page.get_by_role('heading',name='JLPT N5 quiz')).to_be_visible()
 expect(page.get_by_role('group',name='Хичээл').get_by_role('button',name=re.compile(r'^\d+\. '))).to_have_count(29)
 kinds=page.get_by_role('group',name='Дасгалын төрөл')
 for name in ['Үг сонгох','Бичих','Бүрдүүлэх','Өгүүлбэр','Сонсох']:
  button=kinds.get_by_role('button',name=re.compile('^'+name))
  if button.count() and button.get_attribute('aria-pressed')=='true': button.click()
 counts=page.get_by_role('group',name='Асуултын тоо');expect(counts.get_by_role('button')).to_have_text(['5','10','20','30','50','Бүгд'])
 page.get_by_role('group',name='Асуултын тоо').get_by_role('button',name='5',exact=True).click()
 page.get_by_role('group',name='Аль үгсийг').get_by_role('button',name='Бүгд').click()
 expect(page.get_by_text('5 асуулт · 23 үгнээс')).to_be_visible()
 n5=deck_words('jlpt-n5')
 with page.expect_response(lambda r:'/api/labs/words/jlpt-n5/review' in r.url) as hit:
  page.get_by_role('button',name='Эхлэх').click();screens=run_drill(page,n5)
 assert hit.value.ok and len(hit.value.json()['words'])==5,hit.value.status
 assert screens==6,screens
 expect(page.get_by_role('heading',name='Гайхалтай!')).to_be_visible();expect(page.get_by_text('100%')).to_be_visible()
 expect(page.get_by_text(re.compile('Явц хадгалагдлаа'))).to_be_visible()
 page.get_by_role('button',name='Дуусгах').click();expect(page.get_by_role('heading',name='JLPT N5',exact=True)).to_be_visible()
 # The maker remembers its settings in this browser.
 page.get_by_role('button',name='Quiz үүсгэх').click();expect(page.get_by_role('group',name='Асуултын тоо').get_by_role('button',name='5',exact=True)).to_have_attribute('aria-pressed','true')
 page.get_by_role('button',name='Буцах').click()
 # Route guards.
 assert basic.request.post(REVIEW.format('jlpt-n5'),data={'results':[{'id':first_id,'grade':'good'}]}).status==403,'no origin'
 assert basic.request.post(REVIEW.format('jlpt-n9'),headers=ORIGIN,data={'results':[{'id':first_id,'grade':'good'}]}).status==404
 assert basic.request.post(REVIEW.format('jlpt-n5'),headers=ORIGIN,data={'results':[{'id':'0123456789','grade':'good'}]}).status==400,'word not in deck'
 assert basic.request.post(REVIEW.format('hsk-1'),headers=ORIGIN,data={'results':[{'id':first_id,'grade':'good'}]}).status==400,'word from another deck'
 assert basic.request.post(REVIEW.format('jlpt-n5'),headers=ORIGIN,data={'results':[{'id':first_id,'grade':'perfect'}]}).status==400
 assert basic.request.post(REVIEW.format('jlpt-n5'),headers=ORIGIN,data={'results':[{'id':first_id,'grade':'good','box':5}]}).status==400
 assert basic.request.post(REVIEW.format('jlpt-n5'),headers=ORIGIN,data={'results':[{'id':'%010x'%i,'grade':'good'} for i in range(61)]}).status==400
 # HSK: pinyin and Chinese voice language on the page.
 page.goto(BASE+'/labs/words/hsk-1');expect(page.locator('[aria-labelledby="deck-words-heading"] li').first).to_contain_text('wǒ')
 expect(page.get_by_role('button',name='Pinyin')).to_be_visible();expect(page.locator('[lang="zh-CN"]').first).to_be_visible()
 page.screenshot(path=str(ART/'language-decks-desktop.png'))
 # Kanji: tiles after the word decks, on/kun readings on the card, example words, no voice for a lone kanji, a lesson quiz saved.
 page.goto(BASE+'/workspace/workshop?exam=jlpt');expect(page.get_by_role('heading',name='N5 ханз')).to_be_visible();expect(page.get_by_role('heading',name='N4 ханз')).to_be_visible()
 page.goto(BASE+'/labs/words/jlpt-kanji-n5');expect(page.get_by_role('heading',name='JLPT N5 ханз',exact=True)).to_be_visible()
 card=page.locator('[aria-labelledby="deck-words-heading"] > ul > li').first;expect(card).to_contain_text('一');expect(card).to_contain_text('イチ');expect(card).to_contain_text('нэг')
 assert card.get_by_role('button',name=re.compile('сонсох$')).count()==0,'a lone kanji is not read aloud'
 card.get_by_role('button').first.click();expect(page.locator('#deck-word-example')).to_contain_text('ひとつ')
 page.get_by_role('button',name='Уншлага').click();expect(card).not_to_contain_text('イチ');page.get_by_role('button',name='Уншлага').click()
 with page.expect_response(lambda r:'/api/labs/words/jlpt-kanji-n5/review' in r.url) as hit:
  page.get_by_role('button',name='Энэ хичээлийн quiz').click();run_drill(page,deck_words('jlpt-kanji-n5'))
 assert hit.value.ok and len(hit.value.json()['words'])==10,hit.value.status
 page.get_by_role('button',name='Дуусгах').click();expect(page.get_by_role('heading',name='JLPT N5 ханз',exact=True)).to_be_visible()
 page.screenshot(path=str(ART/'language-kanji-desktop.png'))
 # HSK characters (owner 2026-11-19: a filter in the word deck, no decks of their own, no writing): the «Ханз» tab shows the
 # lesson's new characters with pinyin and meaning; a card opens the deck words that hold it; nothing reads a lone character.
 page.goto(BASE+'/workspace/workshop?exam=hsk');expect(page.locator('a[href^="/labs/words/hsk-hanzi"]')).to_have_count(0)
 assert basic.request.get(BASE+'/labs/words/hsk-hanzi-1').status==404
 page.goto(BASE+'/labs/words/hsk-1');page.get_by_role('tab',name='Ханз').click()
 chars=page.locator('[aria-labelledby="deck-chars-heading"] > ul > li');expect(chars).to_have_count(27)
 card=chars.first;expect(card).to_contain_text('我');expect(card).to_contain_text('wǒ');expect(card).to_contain_text('би')
 assert card.get_by_role('button',name=re.compile('сонсох$')).count()==0,'a lone character is not read aloud'
 card.get_by_role('button').first.click();expect(page.locator('#deck-char-words')).to_contain_text('我们')
 page.get_by_role('button',name='Pinyin').click();expect(card).not_to_contain_text('wǒ');page.get_by_role('button',name='Pinyin').click()
 expect(page.locator('[aria-labelledby="deck-words-heading"]')).to_be_hidden()
 page.screenshot(path=str(ART/'language-hanzi-desktop.png'))
 page.get_by_role('tab',name='Үгс').click();expect(page.locator('[aria-labelledby="deck-words-heading"] li').first).to_contain_text('wǒ')
 # Kana: chart first, romaji on, katakana, sections; one plain test (script or both, sections, count), answered and saved.
 page.goto(BASE+'/labs/kana');expect(page.get_by_role('heading',name='Хирагана · Катакана')).to_be_visible()
 chart=page.locator('table');expect(chart.get_by_role('button',name=re.compile('^し shi'))).to_be_visible();expect(chart).to_contain_text('shi')
 page.get_by_role('button',name='Romaji').click();expect(chart).not_to_contain_text('shi');page.get_by_role('button',name='Romaji').click()
 page.get_by_role('navigation',name='Үсэг').get_by_role('button',name='カタカナ').click();expect(chart.get_by_role('button',name=re.compile('^シ shi'))).to_be_visible()
 page.get_by_role('navigation',name='Хүснэгтийн хэсэг').get_by_role('button',name='Дауны тэмдэг').click();expect(chart.get_by_role('button',name=re.compile('^ガ ga'))).to_be_visible()
 page.get_by_role('navigation',name='Хүснэгтийн хэсэг').get_by_role('button',name='Нийлмэл').click();expect(chart.get_by_role('button',name=re.compile('^キャ kya'))).to_be_visible()
 page.get_by_role('navigation',name='Үсэг').get_by_role('button',name='ひらがな').click()
 page.get_by_role('button',name='Шалгалт өгөх').click();kana_test=page.get_by_role('dialog',name='Шалгалт');expect(kana_test.get_by_role('button',name='Эхлэх · 20 асуулт')).to_be_visible()
 kana_test.get_by_role('button',name='Болих').click();expect(kana_test).to_be_hidden();page.get_by_role('button',name='Шалгалт өгөх').click()
 kana_test.get_by_role('group',name='Асуулт').get_by_role('button',name='Бүгд').click();expect(kana_test.get_by_role('button',name='Эхлэх · 46 асуулт')).to_be_visible()
 kana_test.get_by_role('group',name='Үсэг').get_by_role('button',name='Хоёулаа').click();expect(kana_test.get_by_role('button',name='Эхлэх · 92 асуулт')).to_be_visible()
 sections=kana_test.get_by_role('group',name='Хэсэг');sections.get_by_role('button',name=re.compile('^Үндсэн')).click()
 expect(kana_test.get_by_role('button',name='Хэсэг сонгоно уу')).to_be_disabled()
 sections.get_by_role('button',name=re.compile('^Нийлмэл')).click();expect(kana_test.get_by_role('button',name='Эхлэх · 66 асуулт')).to_be_visible()
 # All 66 combined kana of both scripts: the first answered wrong (the answer is shown), the rest right from the chart files.
 romaji_of={w['term']:w['romaji'] for deck in ['kana-hiragana','kana-katakana'] for w in deck_words(deck)}
 with page.expect_response(lambda r:'/api/labs/words/kana-hiragana/review' in r.url) as hira, page.expect_response(lambda r:'/api/labs/words/kana-katakana/review' in r.url) as kata:
  kana_test.get_by_role('button',name='Эхлэх · 66 асуулт').click()
  for i in range(66):
   expect(page.get_by_text(f'{i+1} / 66',exact=True)).to_be_visible()
   right=romaji_of[page.locator('[data-kana]').inner_text().strip()];options=page.get_by_role('group',name='Хариултууд').get_by_role('button')
   expect(options).to_have_count(4)
   if i==0:
    wrong=next(k for k in range(4) if options.nth(k).inner_text()[1:].strip()!=right);options.nth(wrong).click();expect(page.get_by_text('Зөв хариулт:')).to_be_visible()
    page.get_by_role('button',name='Дараах').click()
   else:
    page.get_by_role('group',name='Хариултууд').get_by_role('button',name=right,exact=True).click()
    if i<65: page.keyboard.press('Enter')
 expect(page.get_by_role('heading',name='Гайхалтай!')).to_be_visible();expect(page.locator('#kana-result-heading + p')).to_have_text('65 / 66')
 assert hira.value.ok and kata.value.ok and len(hira.value.json()['words'])==33 and len(kata.value.json()['words'])==33,(hira.value.status,kata.value.status)
 expect(page.get_by_text('Явц хадгалагдлаа.')).to_be_visible()
 # The missed letter comes back alone; then the chart shows the saved progress.
 page.get_by_role('button',name='Алдсанаа давтах').click();expect(page.get_by_text('1 / 1',exact=True)).to_be_visible()
 page.get_by_role('group',name='Хариултууд').get_by_role('button',name=romaji_of[page.locator('[data-kana]').inner_text().strip()],exact=True).click()
 expect(page.locator('#kana-result-heading + p')).to_have_text('1 / 1');expect(page.get_by_text('Явц хадгалагдлаа.')).to_be_visible()
 page.get_by_role('button',name='Буцах').click();expect(page.locator('table')).to_be_visible()
 page.reload();page.get_by_role('navigation',name='Хүснэгтийн хэсэг').get_by_role('button',name='Нийлмэл').click()
 expect(page.locator('table [data-box="1"]')).to_have_count(33)
 assert basic.request.post(REVIEW.format('kana-hiragana'),headers=ORIGIN,data={'results':[{'id':first_id,'grade':'good'}]}).status==400,'deck word on the kana chart'
 page.screenshot(path=str(ART/'language-kana-desktop.png'))
 # Pinyin: tones, chart cells play their example character, the tone drill saves through the route.
 page.goto(BASE+'/labs/pinyin');expect(page.get_by_role('heading',name='Pinyin · аялгуу')).to_be_visible()
 expect(page.locator('button[aria-label*="аялгуу"]')).to_have_count(5);expect(page.get_by_text('3 + 3 → 2 + 3')).to_be_visible()
 sections=page.get_by_role('navigation',name='Хүснэгтийн хэсэг');sections.get_by_role('button',name='ü').click()
 page.locator('table').get_by_role('button',name='xue',exact=True).click();expect(page.locator('p[aria-live]').first).to_contain_text('xu')
 sections.get_by_role('button',name='a · o · e').click();page.locator('table').get_by_role('button',name='zhi',exact=True).click()
 page.screenshot(path=str(ART/'language-pinyin-desktop.png'))
 with page.expect_response(lambda r:'/api/labs/words/hsk-tones/review' in r.url) as hit:
  page.get_by_role('button',name='Эхлэх').click();expect(page.get_by_role('heading',name='Зөв аялгууг сонго')).to_be_visible();run_drill(page)
 assert hit.value.ok and len(hit.value.json()['words'])==10,hit.value.status
 expect(page.get_by_text(re.compile('Явц хадгалагдлаа'))).to_be_visible()
 page.get_by_role('button',name='Дуусгах').click();expect(page.get_by_role('heading',name='Pinyin · аялгуу')).to_be_visible()
 # Phone: one column, no sideways scroll.
 page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/labs/words/jlpt-n5')
 expect(page.get_by_role('heading',name='JLPT N5',exact=True)).to_be_visible()
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'no horizontal page scroll'
 page.screenshot(path=str(ART/'language-decks-phone.png'),full_page=False)
 page.goto(BASE+'/workspace/workshop?exam=jlpt');assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
 for path,name in [('/labs/kana','kana'),('/labs/pinyin','pinyin'),('/labs/words/jlpt-kanji-n4','kanji')]:
  page.goto(BASE+path);expect(page.locator('h1')).to_be_visible()
  if path=='/labs/pinyin': page.get_by_role('navigation',name='Хүснэгтийн хэсэг').get_by_role('button',name='i',exact=True).click()
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),path+': no horizontal page scroll'
  page.screenshot(path=str(ART/f'language-{name}-phone.png'),full_page=True)
 basic.close()
 assert not errors,errors
 browser.close()
print('PASS: Workshop exam tabs (remembered, one exam at a time), JLPT/HSK decks paid only (free: locked tiles/page, 403), '
 'guest sign-in redirect and 401, Basic opens N5/HSK 1, 29 lessons, furigana toggle remembered, examples, card grade saved through '
 'the deck route and kept after reload, shared quiz with lessons, origin/deck/word/grade/shape/size guards, pinyin, romaji toggle, '
 'N5/N4 kanji decks (paid, on/kun readings, example words, no voice, lesson quiz saved), '
 'HSK characters as a «Ханз» tab in the word deck (pinyin, meaning, deck words, no voice; no character decks), '
 'Kana chart (romaji, katakana, sections, a test set up in a modal: 66 letters of both scripts with a miss and its retry, saved to both charts, paid), Pinyin (tones, chart, tone quiz saved, paid), deck quiz maker (kinds, count, remembered) and a 5-question quiz answered 100% and saved, phone layout')
