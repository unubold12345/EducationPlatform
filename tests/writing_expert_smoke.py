"""Essay Studio examiner reviews: the DeepSeek full review (credits) and the Claude Opus expert review (plan quota). Real
page, real API guards, real server code, credits and quota, with both providers replaced by one local mock: the server is
started with ANTHROPIC_BASE_URL and DEEPSEEK_BASE_URL pointing at it (see scripts/check.mjs). Checks what is sent to each
provider, a free account getting the DeepSeek review for 21 credits but no Claude review, a failed review costing nothing,
Basic's 2 and Pro's 5 Claude reviews a plan month, owner-only reopen and the report at desktop and phone widths.
No Anthropic or DeepSeek request leaves this machine.
"""
import os,re,json,threading,time
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/');ORIGIN={'Origin':BASE}
API=BASE+'/api/labs/ielts-writing/expert';STRONG=BASE+'/api/labs/ielts-writing/review'
MOCK_PORT=int(os.environ.get('MOCK_ANTHROPIC_PORT','8471'))
ESSAY="\n\n".join([
 "Nowadays many people thinks that online lessons is better than classrooms, and some even say schools will close. However I believe classrooms will not dissapear in the near future.",
 "Firstly, online lessons are flexible. Students can watch a lesson again when they did not understand it, and people in the countryside can study with good teachers in the city.",
 "On the other hand, teachers in a classroom can see when students are confused and help them at once. Schools also teach social skills like teamwork, which a screen cannot replace.",
 "In conclusion, online lessons are useful but they will support traditional schools rather than replace them, because learning is also a social activity.",
])
VALID={'task':'essay','promptId':'e-online-school','topic':'','essay':ESSAY,'language':'mn'}
REVIEW={
 'summary':'Байр суурь тодорхой, бүтэц логиктой. Гэхдээ санаанууд жишээгээр хангалттай батлагдаагүй, дүрмийн алдаа band-ийг доош татаж байна.',
 'bands':{'task':6,'coherence':6.5,'lexical':6,'grammar':5.5},
 'criteria':[
  {'criterion':'task','evidence':'Байр суурь "classrooms will not dissapear" гэж тодорхой.','next':'Body бүрт нэг тодорхой жишээ нэм.'},
  {'criterion':'coherence','evidence':'"Firstly", "On the other hand" гэх холбоосууд зөв.','next':'Догол мөр бүрийн эхний өгүүлбэрийг гол санаа болго.'},
  {'criterion':'lexical','evidence':'"flexible", "social skills" тохиромжтой.','next':'"good", "better" зэрэг энгийн үгийг нарийвчил.'},
  {'criterion':'grammar','evidence':'"people thinks", "lessons is" алдаатай.','next':'Үйл үгийн тохиролцоог шалга.'},
 ],
 'priorities':['Үйл үгийн тохиролцоог засах','Body бүрт жишээ нэмэх','Энгийн үгсийг нарийвчлах'],
 'paragraphs':[
  {'paragraph':1,'role':'Introduction','comment':'Байр суурь тодорхой.','suggestion':'Сэдвийг өөрийн үгээр дахин илэрхийл.'},
  {'paragraph':2,'role':'Body 1','comment':'Уян хатан байдлыг сайн тайлбарласан.','suggestion':'Бодит жишээ нэм.'},
  {'paragraph':3,'role':'Body 2','comment':'Хамгийн хүчтэй догол мөр.','suggestion':'Teamwork-ийн жишээ нэм.'},
  {'paragraph':4,'role':'Conclusion','comment':'Товч, тодорхой.','suggestion':'Шинэ санаа бүү нэм.'},
 ],
 'corrections':[
  {'original':'people thinks','better':'people think','why':'Олон тооны нэр үгтэй үйл үг.','kind':'grammar'},
  {'original':'lessons is','better':'lessons are','why':'Олон тоо.','kind':'grammar'},
  {'original':'dissapear','better':'disappear','why':'Үсгийн алдаа.','kind':'spelling'},
  {'original':'However I','better':'However, I','why':'Холбоос үгийн дараа таслал.','kind':'punctuation'},
  {'original':'not in the essay at all','better':'x','why':'invented','kind':'grammar'},
 ],
 'vocabulary':[{'word':'good teachers','better':'highly qualified teachers','example':'Rural students can learn from highly qualified teachers online.'}],
 'model_answer':("It is often argued that online lessons will soon make traditional classrooms obsolete. While digital learning offers clear advantages, I believe schools will remain essential.\n\n"
  "On the one hand, online lessons are remarkably flexible. Learners can replay a difficult explanation, and students in remote areas gain access to highly qualified teachers.\n\n"
  "On the other hand, a classroom teacher can notice confusion immediately and respond to it. Schools also develop teamwork and communication, which no screen can fully replace.\n\n"
  "In conclusion, online learning is a valuable complement to traditional schooling rather than a substitute for it, because education is a social as well as an academic process."),
}

state={'mode':'ok','ds':'ok','calls':[]}
def calls(provider):return [c for c in state['calls'] if c['provider']==provider]
class Mock(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,body):
  data=json.dumps(body).encode();self.send_response(status);self.send_header('content-type','application/json');self.send_header('content-length',str(len(data)));self.end_headers();self.wfile.write(data)
 def do_POST(self):
  body=json.loads(self.rfile.read(int(self.headers.get('content-length','0'))) or b'{}')
  deepseek=self.path.rstrip('/').endswith('/chat/completions')
  # The key is only checked for presence: the DeepSeek one is the developer's real key and is never printed.
  state['calls'].append({'provider':'deepseek' if deepseek else 'anthropic','path':self.path,'beta':self.headers.get('anthropic-beta',''),
   'key':bool(self.headers.get('x-api-key') or self.headers.get('authorization','').removeprefix('Bearer ').strip()),
   'mockKey':(self.headers.get('x-api-key') or self.headers.get('authorization','').removeprefix('Bearer '))=='check-mock-key','body':body})
  if deepseek:
   if state['ds']=='bad':return self.reply(200,{'model':'deepseek-flash','choices':[{'finish_reason':'stop','message':{'content':'{"summary":"half a review"'}}],'usage':{'prompt_tokens':1400,'completion_tokens':900}})
   return self.reply(200,{'model':'deepseek-flash','choices':[{'finish_reason':'stop','message':{'role':'assistant','content':json.dumps(REVIEW,ensure_ascii=False)}}],
    'usage':{'prompt_tokens':1400,'prompt_cache_hit_tokens':0,'completion_tokens':10400}})
  if state['mode']=='overloaded':return self.reply(529,{'type':'error','error':{'type':'overloaded_error','message':'secret provider detail'}})
  refusal=state['mode']=='refusal'
  text='' if refusal else json.dumps(REVIEW)
  events=[
   ('message_start',{'type':'message_start','message':{'id':'msg_mock','type':'message','role':'assistant','model':'claude-opus-5-5','content':[],'stop_reason':None,'stop_sequence':None,'usage':{'input_tokens':2400,'output_tokens':1}}}),
   ('content_block_start',{'type':'content_block_start','index':0,'content_block':{'type':'text','text':''}}),
   *[('content_block_delta',{'type':'content_block_delta','index':0,'delta':{'type':'text_delta','text':text[i:i+400]}}) for i in range(0,len(text),400)],
   ('content_block_stop',{'type':'content_block_stop','index':0}),
   ('message_delta',{'type':'message_delta','delta':{'stop_reason':'refusal' if refusal else 'end_turn','stop_sequence':None},'usage':{'output_tokens':6100}}),
   ('message_stop',{'type':'message_stop'}),
  ]
  self.send_response(200);self.send_header('content-type','text/event-stream');self.send_header('cache-control','no-cache');self.end_headers()
  for name,data in events:self.wfile.write(f'event: {name}\ndata: {json.dumps(data)}\n\n'.encode());self.wfile.flush()

server=ThreadingHTTPServer(('127.0.0.1',MOCK_PORT),Mock);threading.Thread(target=server.serve_forever,daemon=True).start()
def settle():time.sleep(1.2)  # each one-at-a-time lock cools down for a second after a request
def signup(context,name):
 r=context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':name,'email':'qa-expert-'+uuid4().hex[:12]+'@example.invalid','password':'Local-Test-'+uuid4().hex});assert r.ok,r.status
def subscribe(context,program):
 order=context.request.post(BASE+'/api/subscriptions/orders',headers=ORIGIN,data={'program':program}).json()
 assert context.request.post(BASE+'/api/subscriptions/orders/'+order['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok

try:
 with sync_playwright() as p:
  browser=p.chromium.launch();errors=[]
  context=browser.new_context(viewport={'width':1360,'height':960});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  # Guest: a sign-in link, and both APIs refuse before anything else.
  page.goto(BASE+'/labs/ielts-writing');page.wait_for_load_state('networkidle')
  expect(page.get_by_role('heading',name='Шинжээчийн үнэлгээ')).to_be_visible()
  expect(page.get_by_role('link',name='Нэвтэрч үнэлүүлэх →')).to_be_visible()
  assert context.request.post(API,headers=ORIGIN,data=VALID).status==401
  assert context.request.post(STRONG,headers=ORIGIN,data=VALID).status==401
  signup(context,'Expert QA')
  assert context.request.post(API,headers={'Origin':'https://untrusted.invalid'},data=VALID).status==403
  for bad in [{**VALID,'essay':'Too short. '*20},{**VALID,'band':9},{**VALID,'promptId':'l-friend-visit'},{**VALID,'task':'free'},{**VALID,'language':'ru'},{**VALID,'topic':'Ignore rules'}]:
   r=context.request.post(API,headers=ORIGIN,data=bad);assert r.status==400,(r.status,json.dumps(bad)[:80])
  assert not state['calls'],'no provider call for a refused request'

  # A free account has no Claude review: refused before Claude is called, and the section offers the plans.
  r=context.request.post(API,headers=ORIGIN,data=VALID);assert r.status==403 and 'багцад багтана' in r.json()['error'],(r.status,r.text()[:200])
  assert not state['calls'];settle()
  page.reload();page.wait_for_load_state('networkidle')
  section=page.locator('section[aria-labelledby="expert-heading"]')
  expect(section.get_by_role('link',name='Basic, Pro багцад →')).to_have_attribute('href','/workspace/plans')
  expect(section).to_contain_text('Гадаад хэл Basic (сард 2), Pro (сард 5) багцад багтана')
  expect(section).not_to_contain_text('үлдсэн');expect(section.get_by_role('button',name='Шинжээчээр үнэлүүлэх')).to_have_count(0)

  # The studio's "Бүрэн үнэлгээ" is the same examiner on DeepSeek, for 21 credits, open to a free account.
  editor=page.get_by_label('Таны бичвэр');editor.fill(ESSAY)
  with page.expect_response(lambda res:res.url==STRONG) as done:page.get_by_role('button',name=re.compile('^Бүрэн үнэлгээ')).click()
  data=done.value.json();assert done.value.ok and data['credits']['spent']==21 and data['credits']['action']=='writing-review',data.get('credits')
  first_balance=data['credits']['balance']
  # The result opens only below the studio; the sidebar shows nothing of it.
  strong=section.get_by_role('article',name='Бүрэн үнэлгээ');expect(strong).to_be_visible()
  expect(strong.locator('[class*="overall"] strong')).to_have_text('6.0');expect(strong).to_contain_text('Body бүрт жишээ нэмэх')
  coach=page.get_by_label('AI туслах',exact=True);expect(coach.locator('[class*="overall"]')).to_have_count(0);expect(coach).not_to_contain_text('Body бүрт жишээ нэмэх')
  expect(strong).to_contain_text('Бүрэн үнэлгээ');expect(strong.locator('[class*="criterion"]')).to_have_count(4)
  expect(strong.locator('[class*="fixes"] li')).to_have_count(4,timeout=1000)
  expect(section.get_by_role('list',name='Хадгалсан үнэлгээнүүд')).to_contain_text('Бүрэн')
  # What was sent to DeepSeek: thinking on, the price list's reply budget, JSON mode, the examiner rules and the text as data.
  ds=calls('deepseek');assert len(ds)==1 and not calls('anthropic'),[c['provider'] for c in state['calls']]
  body=ds[0]['body'];assert ds[0]['key'] and ds[0]['path']=='/chat/completions',ds[0]['path']
  assert body['model'].startswith('deepseek') and body['thinking']=={'type':'enabled'} and body['max_tokens']==16000 and body['response_format']=={'type':'json_object'} and body['stream'] is False,{k:body[k] for k in ('model','thinking','max_tokens')}
  assert body['messages'][0]['role']=='system' and 'senior IELTS Writing examiner' in body['messages'][0]['content'] and 'Return ONE JSON object only' in body['messages'][0]['content']
  sent=json.loads(body['messages'][1]['content']);assert sent['student_text']==ESSAY and 'online lessons will soon replace' in sent['task']
  # A DeepSeek review never touches the Claude quota.
  expect(section.get_by_role('link',name='Basic, Pro багцад →')).to_be_visible()
  # An unusable reply costs nothing: the next review is charged from the same balance less one price.
  settle();state['ds']='bad';r=context.request.post(STRONG,headers=ORIGIN,data=VALID);assert r.status==503 and 'Кредит хасагдаагүй' in r.json()['error'],(r.status,r.text()[:200])
  settle();state['ds']='ok';r=context.request.post(STRONG,headers=ORIGIN,data=VALID);assert r.ok,(r.status,r.text()[:200])
  assert r.json()['credits']['balance']==first_balance-21 and r.json()['review']['kind']=='strong',(first_balance,r.json()['credits'])

  # Basic: 2 Claude reviews a plan month. A refusal and an overloaded provider cost nothing and hide provider text.
  subscribe(context,'language_basic');settle()
  state['mode']='refusal';r=context.request.post(API,headers=ORIGIN,data=VALID);assert r.status==422 and 'хасагдаагүй' in r.json()['error'],(r.status,r.text()[:200])
  settle();state['mode']='overloaded';r=context.request.post(API,headers=ORIGIN,data=VALID);assert r.status==503 and 'secret' not in r.text(),(r.status,r.text()[:200])
  claude_before=len(calls('anthropic'));state['mode']='ok';settle()
  page.reload();page.wait_for_load_state('networkidle')
  expect(section).to_contain_text('2 / 2 үлдсэн');expect(section).to_contain_text('Гадаад хэл Basic')
  button=section.get_by_role('button',name='Шинжээчээр үнэлүүлэх')
  editor.fill('Too short for an expert review, but this many words is fine for nothing at all here.');expect(button).to_be_disabled();expect(section).to_contain_text('дор хаяж 100 үг')
  editor.fill(ESSAY);expect(button).to_be_enabled()
  page.once('dialog',lambda dialog:dialog.accept())
  button.click()
  report=section.get_by_role('article',name='Шинжээчийн үнэлгээ')
  expect(report).to_be_visible(timeout=60000)
  expect(report.locator('[class*="overall"] strong')).to_have_text('6.0')
  expect(report.locator('[class*="criterion"]')).to_have_count(4)
  expect(report).to_contain_text('Task response');expect(report).to_contain_text('Дараагийн түвшинд:')
  expect(report.locator('[class*="priorities"] li')).to_have_count(3)
  expect(report.locator('[class*="paragraphs"] li')).to_have_count(4)
  expect(report.locator('[class*="fixes"] li')).to_have_count(4)
  expect(report).to_contain_text('Шинжээчийн үнэлгээ')
  expect(section).to_contain_text('1 / 2 үлдсэн')
  # What was sent to Claude: the model, high effort, the schema, the fallback opt-in, the text as data.
  claude=calls('anthropic');call=claude[-1];body=call['body'];assert len(claude)==claude_before+1
  assert call['mockKey'] and call['path'].startswith('/v1/messages'),call['path']
  assert body['model']=='claude-opus-5-5' and body['stream'] is True and body['max_tokens']==32000,body.get('model')
  assert body['output_config']['effort']=='high' and body['output_config']['format']['type']=='json_schema',body['output_config']
  assert body['fallbacks']=='default' and 'server-side-fallback-2026-07-01' in call['beta'],(body.get('fallbacks'),call['beta'])
  assert 'thinking' not in body and 'temperature' not in body
  sent=json.loads(body['messages'][0]['content']);assert sent['student_text']==ESSAY and 'online lessons will soon replace' in sent['task']
  system=body['system'] if isinstance(body['system'],str) else ''.join(part['text'] for part in body['system'])
  assert 'senior IELTS Writing examiner' in system and 'Mongolian Cyrillic' in system and 'Return ONE JSON object only' not in system
  # Apply a correction from the report to the draft.
  report.locator('[class*="fixes"] li',has_text='people thinks').get_by_role('button',name='Бичвэрт засах').click()
  assert 'people think ' in editor.input_value() and 'people thinks' not in editor.input_value()
  expect(report.locator('[class*="fixes"] li',has_text='people thinks')).to_contain_text('Бичвэрт байхгүй')
  report.locator('summary',has_text='Band 8+ жишээ хариулт').click();expect(report).to_contain_text('remarkably flexible')
  page.screenshot(path=str(ART/'writing-expert-report.png'),full_page=True)
  # The second review spends the month; the third is refused without calling Claude.
  settle();r=context.request.post(API,headers=ORIGIN,data=VALID);assert r.ok,(r.status,r.text()[:200])
  quota=r.json()['quota'];assert quota['plan']=='Гадаад хэл Basic' and quota['limit']==2 and quota['used']==2 and quota['remaining']==0,quota
  settle();r=context.request.post(API,headers=ORIGIN,data=VALID);assert r.status==403 and 'дууссан' in r.json()['error'] and 'Pro багц сард 5' in r.json()['error'],r.text()[:200]
  assert len(calls('anthropic'))==claude_before+2
  # Every review of both kinds is on the account: listed after a reload and reopened from the server.
  page.reload();page.wait_for_load_state('networkidle')
  expect(section).to_contain_text('0 / 2 үлдсэн');expect(section.get_by_role('button',name='Шинжээчээр үнэлүүлэх')).to_be_disabled()
  past=section.get_by_role('list',name='Хадгалсан үнэлгээнүүд');expect(past.get_by_role('button')).to_have_count(4)
  expect(past.get_by_role('button').first).to_contain_text('Шинжээч');expect(past.get_by_role('button').last).to_contain_text('Бүрэн')
  with page.expect_response(lambda res:'/api/labs/ielts-writing/expert/' in res.url) as opened:past.get_by_role('button').first.click()
  review_id=opened.value.url.rsplit('/',1)[-1];expect(report).to_be_visible();expect(report).to_contain_text('Coherence & cohesion')
  past.get_by_role('button').last.click();expect(strong).to_be_visible();expect(strong).to_contain_text('Бүрэн үнэлгээ')
  # Phone width: the report fits without sideways scroll.
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300)
  assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'),'no horizontal scroll at 390'
  strong.screenshot(path=str(ART/'writing-expert-390.png'))
  page.set_viewport_size({'width':320,'height':700});page.wait_for_timeout(300)
  assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'),'no horizontal scroll at 320'

  # Another student cannot open it; a Pro plan month gives 5.
  other=browser.new_context();signup(other,'Expert QA Pro')
  assert other.request.get(API+'/'+review_id).status==404
  assert other.request.get(API+'/not-an-id!').status==400
  subscribe(other,'language')
  r=other.request.post(API,headers=ORIGIN,data={**VALID,'language':'en'});assert r.ok,(r.status,r.text()[:200])
  quota=r.json()['quota'];assert quota['plan']=='Гадаад хэл Pro' and quota['limit']==5 and quota['used']==1 and quota['remaining']==4 and quota['resetsAt'],quota
  assert 'in English' in json.dumps(calls('anthropic')[-1]['body']['system'])
  op=other.new_page();op.goto(BASE+'/labs/ielts-writing');op.wait_for_load_state('networkidle')
  expect(op.locator('section[aria-labelledby="expert-heading"]')).to_contain_text('4 / 5 үлдсэн')
  # No provider or model name anywhere on the page (owner rule 2026-11-18).
  for shown in (page.locator('body').inner_text(),op.locator('body').inner_text()):
   hit=re.search('.{0,40}(Claude|DeepSeek|Anthropic|Opus).{0,40}',shown);assert not hit,hit.group(0)
  assert not errors,errors
  browser.close()
 print('PASS: writing reviews: guest link, 401/403/400 guards with no provider call; free account: no Claude review (API 403, plans link) but the DeepSeek full review for 21 credits '
  '(thinking, 16,000-token budget, JSON mode, examiner rules, text as data; the report only below the studio; unusable reply refunded; Claude quota untouched); '
  'Basic 2 a month (refusal/overload free, provider text hidden, UI review, request to Claude Opus 5.5, apply a correction, model answer, third refused without a call); '
  'both kinds listed and reopened, owner-only GET, Pro 5 a month, 390/320 without sideways scroll; no provider request left this machine.')
finally:
 server.shutdown()
