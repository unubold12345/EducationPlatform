"""Isolated Speaking Lab (studio): REAL DeepSeek start/answer/report, REAL streamed Kokoro voice frames,
REAL local Whisper transcription of generated speech, then the hands-free microphone loop with a
fixture microphone file. Only the UI-loop transcription/chat in the last section is mocked, and says so.
Not a human-accent or noisy-room benchmark.
"""
import os,json,struct,math,wave
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/');ORIGIN={'Origin':BASE}
START={'part':1,'topic':'everyday','target':6.5,'language':'en','action':'start','message':'','history':[],'stats':None,'timing':[]}

def frames(raw):
 out,i=[],0
 while i<len(raw):
  n=struct.unpack_from('>I',raw,i)[0];caption=raw[i+4:i+4+n].decode();i+=4+n
  m=struct.unpack_from('>I',raw,i)[0];out.append((caption,raw[i+4:i+4+m]));i+=4+m
 return out
def to_pcm16k(wav):
 fmt=struct.unpack_from('<H',wav,20)[0];rate=struct.unpack_from('<I',wav,24)[0];bits=struct.unpack_from('<H',wav,34)[0]
 data=wav[44:]
 values=struct.unpack_from('<'+'f'*(len(data)//4),data) if fmt==3 else [v/32768 for v in struct.unpack_from('<'+'h'*(len(data)//2),data)]
 samples=[max(-32768,min(32767,int(values[min(len(values)-1,int(i*rate/16000))]*32767))) for i in range(int(len(values)*16000/rate))]
 pcm=struct.pack('<'+'h'*len(samples),*samples)
 return struct.pack('<4sI4s4sIHHIIHH4sI',b'RIFF',36+len(pcm),b'WAVE',b'fmt ',16,1,1,16000,32000,2,16,b'data',len(pcm))+pcm
def fake_mic(path):
 sr=48000;data=[]
 data+=[0]*int(.4*sr)
 for i in range(3*sr):t=i/sr;data.append(int(.35*(0.6+0.4*math.sin(2*math.pi*3*t))*32767*(0.6*math.sin(2*math.pi*180*t)+0.4*math.sin(2*math.pi*420*t))))
 data+=[0]*int(6*sr)
 with wave.open(str(path),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(struct.pack('<%dh'%len(data),*data))

MIC=ART/'speaking-lab-fake-mic.wav';fake_mic(MIC)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+str(MIC)])
 context=browser.new_context(viewport={'width':1440,'height':1000},color_scheme='dark',permissions=['microphone'])
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/labs/ielts-speaking');page.wait_for_load_state('networkidle')
 expect(page.locator('.sl-signin')).to_be_visible()
 assert page.locator('meta[name="robots"]').get_attribute('content').find('noindex')>=0
 assert context.request.post(BASE+'/api/labs/ielts-speaking',headers=ORIGIN,data=START).status==401
 signup=context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'Speaking Lab QA','email':'qa-speaking-'+uuid4().hex[:12]+'@example.invalid','password':'Local-Test-'+uuid4().hex});assert signup.ok,signup.status
 # Signed-in pages warm the local models in the background. Cold downloads can
 # outlast networkidle's default timeout; wait for the actual 3D UI readiness.
 page.reload(wait_until='domcontentloaded')
 page.wait_for_selector('.speaking-avatar[data-ready="true"]',timeout=30000)
 expect(page.locator('.speaking-avatar canvas')).to_be_visible()
 # Guards before any provider use.
 assert context.request.post(BASE+'/api/labs/ielts-speaking',headers={'Origin':'https://untrusted.invalid'},data=START).status==403
 for bad in [{**START,'part':9},{**START,'action':'feedback'},{**START,'band':9},{**START,'target':9}]:
  assert context.request.post(BASE+'/api/labs/ielts-speaking',headers=ORIGIN,data=bad).status==400,bad
 assert context.request.post(BASE+'/api/labs/ielts-speaking/voice',headers=ORIGIN,data={'text':'hello','voice':'person-clone','speed':1}).status==400
 assert context.request.post(BASE+'/api/labs/ielts-speaking/warm',headers=ORIGIN,timeout=180000).status==200

 # REAL streamed Kokoro voice: several sentence frames, each a RIFF/WAVE file.
 voiced=context.request.post(BASE+'/api/labs/ielts-speaking/voice',headers=ORIGIN,data={'text':"Hello, I'm Milo, your speaking partner. Take your time. I'm here to listen.",'voice':'af_heart','speed':1},timeout=170000)
 assert voiced.status==200,(voiced.status,voiced.text()[:200])
 parts=frames(voiced.body());assert len(parts)>=2,[c for c,_ in parts]
 for caption,wav in parts:assert wav[:4]==b'RIFF' and wav[8:12]==b'WAVE' and len(wav)>12000,caption
 (ART/'speaking-lab-voice.wav').write_bytes(parts[0][1])
 # REAL local Whisper on that generated speech.
 transcribed=context.request.post(BASE+'/api/labs/ielts-speaking/transcribe',headers={**ORIGIN,'Content-Type':'audio/wav'},data=to_pcm16k(parts[0][1]),timeout=170000)
 assert transcribed.status==200,(transcribed.status,transcribed.text())
 assert any(w in transcribed.json()['text'].lower() for w in ['milo','speaking','partner','hello']),transcribed.json()

 # REAL DeepSeek conversation through the UI (voice off, typed answers): start, answer, report.
 page.get_by_text('Milo speaks aloud').click()
 page.get_by_role('radio',name='Practise one part').click()
 expect(page.get_by_role('button',name='Start practice →')).to_be_disabled()
 page.get_by_text('My answers (as text) are sent to DeepSeek').click()
 with page.expect_response(lambda r:r.url.endswith('/api/labs/ielts-speaking'),timeout=90000) as reply:
  page.get_by_role('button',name='Start practice →').click()
 assert reply.value.status==200,(reply.value.status,reply.value.text())
 expect(page.locator('.sl-msg.assistant')).to_have_count(1)
 page.wait_for_timeout(600)
 page.locator('#speaking-answer').fill('I very like learning English because I want to study engineering abroad. I practise by listening podcasts on my way to school.')
 with page.expect_response(lambda r:r.url.endswith('/api/labs/ielts-speaking'),timeout=90000) as answer:
  page.keyboard.press('Enter')
 assert answer.value.status==200,(answer.value.status,answer.value.text())
 expect(page.locator('.sl-msg.user')).to_have_count(1);expect(page.locator('.sl-msg.assistant')).to_have_count(2)
 page.wait_for_timeout(600)
 with page.expect_response(lambda r:r.url.endswith('/api/labs/ielts-speaking'),timeout=180000) as report:
  page.get_by_role('button',name='Finish & report').click()
 assert report.value.status==200,(report.value.status,report.value.text())
 data=report.value.json()['report'];assert set(data['bands'])=={'fluency','lexical','grammar'},data
 expect(page.locator('.sl-report')).to_contain_text('Pronunciation is not assessed')
 expect(page.locator('.sl-score strong')).to_be_visible()
 page.screenshot(path=str(ART/'speaking-lab-report.png'),full_page=True)
 with page.expect_download() as download:page.get_by_role('button',name='Download report ↓').click()
 assert download.value.suggested_filename=='speaking-lab-report.txt'
 stored=page.evaluate("localStorage.getItem('education-speaking-lab-v1')");assert stored and '"entries"' in stored

 for theme in ['light','dark']:
  page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
  for width in [390,320]:
   page.set_viewport_size({'width':width,'height':844})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(theme,width)
   page.screenshot(path=str(ART/f'speaking-lab-{theme}-{width}.png'),full_page=True)
 page.set_viewport_size({'width':1440,'height':1000})
 for route in ['/','/practice','/exams','/programs/ielts']:
  page.goto(BASE+route);expect(page.locator('a[href="/labs/ielts-speaking"]')).to_have_count(0)

 # Hands-free loop with REAL getUserMedia/MediaRecorder on a fixture microphone file (3s tone, then silence).
 # Chat and transcription are MOCKED in this section only, so the loop is deterministic.
 page.goto(BASE+'/labs/ielts-speaking');page.wait_for_selector('.speaking-avatar[data-ready="true"]',timeout=30000)
 page.route('**/api/labs/ielts-speaking',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'reply':'What do you like to read?','tip':None,'cue':None,'hint':None,'report':None})))
 page.route('**/api/labs/ielts-speaking/transcribe',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'text':'I like reading books in English.'})))
 page.get_by_text('Milo speaks aloud').click()
 page.get_by_text('My answers (as text) are sent to DeepSeek').click();page.get_by_text('Use my microphone').click()
 page.get_by_role('button',name='Start mock test →').click()
 expect(page.locator('.sl-msg.user')).to_have_count(1,timeout=30000)
 expect(page.locator('.sl-msg.user').first).to_contain_text('I like reading books in English.')
 expect(page.locator('.sl-msg.user .sl-chip').first).to_contain_text('words')
 page.screenshot(path=str(ART/'speaking-lab-desktop.png'))
 assert not errors,errors
 browser.close()
print('PASS: isolated noindex Speaking Lab studio, 3D character, REAL streamed Kokoro frames, REAL Whisper transcription, three REAL DeepSeek calls (start/answer/report), consent/auth/origin/shape guards, report download + local progress, 320/390px light/dark layout, no production links, hands-free mic loop with fixture microphone (mocked chat/transcription in that section)')
