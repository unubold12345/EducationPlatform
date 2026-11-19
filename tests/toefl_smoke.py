"""Local TOEFL iBT: library row -> hub -> purchase -> practice (gaps, Build a Sentence, a listening clip, reveal) ->
a full timed sitting (Reading routed Upper, Listening routed Lower, answer windows, the one-clip audio allowlist,
a speaking upload) -> results. Only disposable qa-exam-* rows use the trusted deadline fixture.
"""
import json
import os
from pathlib import Path
import subprocess
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/')
ORIGIN={'Origin':BASE}
ART=ROOT/'artifacts'
ART.mkdir(exist_ok=True)
SLUG='toefl-01'
PRIVATE=['"answers":','"answerDisplay":','"explanation":','"script"']
# The local DEV_PRACTICE_DURING_MOCK switch opens practice during a sitting; scripts/check.mjs turns it off.
PRACTICE_DURING_MOCK=os.environ.get('DEV_PRACTICE_DURING_MOCK')=='true'

def fixture(action,attempt):
    return json.loads(subprocess.check_output(['node','tests/mock_fixture.mjs',action,attempt],cwd=ROOT,text=True,encoding='utf-8'))

def fits(page,label,widths=(1440,390,320)):
    for width in widths:
        page.set_viewport_size({'width':width,'height':950})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(label,width)
        page.screenshot(path=str(ART/f'toefl-{label}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':950})

def private_free(payload):
    text=json.dumps(payload,ensure_ascii=False)
    for private in PRIVATE:assert private not in text,private

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'])
    context=browser.new_context(viewport={'width':1440,'height':950},reduced_motion='reduce',color_scheme='dark',permissions=['microphone'])
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/exams')
    expect(page.locator('.exam-card.toefl')).to_be_visible()
    page.goto(BASE+'/exams/toefl')
    expect(page.locator('.toefl-card')).to_have_count(9)
    fits(page,'hub')
    assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':SLUG}).status==401
    email='qa-exam-toefl-'+uuid4().hex[:12]+'@example.invalid'
    password='Local-Test-'+uuid4().hex
    assert context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'TOEFL QA','email':email,'password':password}).ok
    practice=BASE+'/api/exam-practice/'+SLUG
    assert context.request.get(practice).status==402
    assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':SLUG}).status==402
    order=context.request.post(BASE+'/api/mock-payments',headers=ORIGIN,data={'slug':SLUG})
    assert order.ok,order.text()
    assert context.request.post(BASE+'/api/mock-payments/'+order.json()['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
    view=context.request.get(practice).json()
    questions=view['form']['questions']
    assert view['form']['subject']=='toefl' and len(questions)==150,len(questions)
    assert all(not any(field in q for field in ['answers','explanation','answerDisplay','listening','script']) for q in questions)
    clips=[q['toeflGroup']['clip'] for q in questions if q.get('toeflGroup',{}).get('layout') in ('response','set')]
    assert len(clips)>=40,len(clips)
    # TOEFL recordings come only from their own route segment and only by an allowlisted clip name.
    ranged=context.request.get(practice+'/audio/toefl?clip='+clips[0],headers={'Range':'bytes=0-127'})
    assert ranged.status==206 and len(ranged.body())==128,ranged.status
    assert context.request.get(practice+'/audio/toefl?clip=..%2F..%2Fpackage.json').status in (400,404)
    assert context.request.get(practice+'/audio?part=1').status==404
    page.goto(BASE+'/exams/'+SLUG+'/practice?section=toefl01-r1-g1')
    expect(page.locator('.toefl-words')).to_be_visible()
    first_box=page.locator('.toefl-gap-box').first
    expect(first_box).to_be_visible()
    first_box.press_sequentially('zz')
    page.get_by_role('button',name='Шалгах',exact=True).click()
    expect(page.locator('.practice-feedback')).to_be_visible()
    fits(page,'practice-words')
    page.goto(BASE+'/exams/'+SLUG+'/practice?section=toefl01-w-build')
    expect(page.locator('.toefl-build')).to_be_visible()
    page.locator('.toefl-chip').first.click()
    expect(page.locator('.toefl-slot[data-filled]')).to_have_count(1)
    fits(page,'practice-build')
    page.goto(BASE+'/exams/'+SLUG+'/practice?section=toefl01-l1-g13')
    audio=page.locator('.toefl-practice-audio audio')
    expect(audio).to_be_visible()
    audio.evaluate('(a)=>a.load()')
    expect(audio).to_have_js_property('readyState',4,timeout=15000)
    expect(page.locator('.practice-transcript')).to_have_count(0)
    page.locator('label.answer-option').first.click()
    page.get_by_role('button',name='Шалгах',exact=True).click()
    expect(page.locator('.practice-transcript')).to_be_visible()
    fits(page,'practice-listening')
    assert context.request.patch(practice,headers={'Origin':'https://untrusted.invalid'},data={'flags':[]}).status==403
    # The timed sitting: headphones and microphone first, as for IELTS.
    page.goto(BASE+'/exams/'+SLUG)
    expect(page.locator('.toefl-plan')).to_be_visible()
    fits(page,'briefing')
    page.get_by_label('Дууг тод сонсож байна').check()
    page.get_by_role('button',name='Микрофон шалгах',exact=True).click()
    expect(page.get_by_role('button',name='Микрофон бэлэн ✓',exact=True)).to_be_visible()
    page.locator('.exam-agreement input').check()
    page.get_by_role('button',name='Шалгалт эхлэх / үргэлжлүүлэх',exact=False).click()
    page.wait_for_url('**/exams/attempts/*')
    attempt=page.url.rsplit('/',1)[1]
    endpoint=BASE+'/api/mock-attempts/'+attempt
    if not PRACTICE_DURING_MOCK:assert context.request.get(practice).status==403
    # Reading Module 1: the paragraph with letter boxes; a typed letter is saved.
    data=context.request.get(endpoint).json()
    assert data['stage']['id']=='toefl-r1' and len(data['stage']['questions'])==35 and data['report'] is None
    private_free(data['stage'])
    expect(page.locator('.toefl-words')).to_be_visible()
    expect(page.locator('.exam-sheet-group')).to_have_count(7)
    page.locator('.toefl-gap-box').first.press_sequentially('q')
    expect(page.locator(':is(.exam-session-meta,.exam-sheet,.study-rail) [role=status]')).to_have_text('Хадгалсан')
    page.reload()
    expect(page.locator('.toefl-gap-box').first).to_have_value('q')
    page.locator('.exam-sheet-group').nth(6).locator('button').first.click()
    expect(page.locator('.toefl-text h3')).to_be_visible()
    fits(page,'timed-r1')
    data=context.request.get(endpoint).json()
    answers=fixture('answers',attempt)
    response=context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':'toefl-r1','responses':answers['responses'],'flags':[]})
    assert response.ok,response.text()
    fixture('deadline',attempt)
    # 35 of 35 routes Reading Module 2 to the Upper set.
    data=context.request.get(endpoint).json()
    assert data['stage']['id']=='toefl-r2' and len(data['stage']['questions'])==15
    assert all('-r2u-' in q['id'] for q in data['stage']['questions'])
    private_free(data['stage'])
    answers=fixture('answers',attempt)
    assert context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':'toefl-r2','responses':answers['responses'],'flags':[]}).ok
    fixture('deadline',attempt)
    # Listening Module 1 on the server clock: only the playing clip is served and each answer has its window.
    data=context.request.get(endpoint).json()
    stage=data['stage']
    assert stage['id']=='toefl-l1' and len(stage['questions'])==32
    private_free(stage)
    assert all('window' in q for q in stage['questions'])
    page.goto(BASE+'/exams/attempts/'+attempt)
    expect(page.locator('.toefl-listening')).to_be_visible()
    source=page.locator('.toefl-player audio').get_attribute('src',timeout=15000)
    assert '/audio/toefl?clip=' in source,source
    track=context.request.get(BASE+source,headers={'Range':'bytes=0-127'})
    assert track.status==206 and len(track.body())==128
    later=source.split('clip=')[0]+'clip='+[clip for clip in clips if clip not in source][5]
    assert context.request.get(BASE+later).status==403
    first,late=stage['questions'][0],stage['questions'][20]
    keys=fixture('answers',attempt)['responses']
    refused=context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':'toefl-l1','responses':{late['id']:late['options'][0]},'flags':[]})
    assert refused.status==400,refused.status
    saved=context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':'toefl-l1','responses':{first['id']:keys[first['id']]},'flags':[]})
    assert saved.ok,saved.text()
    page.reload()
    expect(page.locator('.toefl-window')).to_be_visible(timeout=20000)
    expect(page.locator('.toefl-question')).to_have_count(1)
    fits(page,'timed-l1')
    fixture('deadline',attempt)
    # 1 of 32 routes Listening Module 2 to the Lower set, with its own length.
    data=context.request.get(endpoint).json()
    assert data['stage']['id']=='toefl-l2' and len(data['stage']['questions'])==15
    assert all('-l2l-' in q['id'] for q in data['stage']['questions'])
    lower_seconds=data['stage']['seconds']
    fixture('deadline',attempt)
    # Writing: Build a Sentence with tap-to-place boxes, then the two writing tasks.
    data=context.request.get(endpoint).json()
    assert data['stage']['id']=='toefl-w-build' and len(data['stage']['questions'])==10
    private_free(data['stage'])
    page.goto(BASE+'/exams/attempts/'+attempt)
    expect(page.locator('.toefl-build')).to_be_visible()
    page.locator('.toefl-chip').first.click()
    expect(page.locator('.toefl-slot[data-filled]')).to_have_count(1)
    expect(page.locator(':is(.exam-session-meta,.exam-sheet,.study-rail) [role=status]')).to_have_text('Хадгалсан')
    fits(page,'timed-build')
    data=context.request.get(endpoint).json()
    answers=fixture('answers',attempt)
    assert context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':'toefl-w-build','responses':answers['responses'],'flags':[]}).ok
    fixture('deadline',attempt)
    for stage_id in ['toefl-w-email','toefl-w-discussion']:
        data=context.request.get(endpoint).json()
        assert data['stage']['id']==stage_id,data['stage']['id']
        private_free(data['stage'])
        page.goto(BASE+'/exams/attempts/'+attempt)
        expect(page.locator('.toefl-writing textarea')).to_be_visible()
        fits(page,'timed-'+stage_id.rsplit('-',1)[1])
        answers=fixture('answers',attempt)
        assert context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':stage_id,'responses':answers['responses'],'flags':[]}).ok
        fixture('deadline',attempt)
    # Speaking: an introduction, then items with one clip each and a recording saved per item.
    data=context.request.get(endpoint).json()
    assert data['stage']['id']=='toefl-s-repeat-intro',data['stage']['id']
    page.goto(BASE+'/exams/attempts/'+attempt)
    expect(page.locator('.toefl-speaking .toefl-task')).to_be_visible()
    fixture('deadline',attempt)
    data=context.request.get(endpoint).json()
    assert data['stage']['id']=='toefl-s-repeat-1'
    private_free(data['stage'])
    page.goto(BASE+'/exams/attempts/'+attempt)
    expect(page.locator('.toefl-speak-card')).to_be_visible()
    fits(page,'timed-speaking')
    assert context.request.get(endpoint+'/audio/toefl?clip=speaking-01-repeat',headers={'Range':'bytes=0-127'}).status==206
    assert context.request.get(endpoint+'/audio/toefl?clip=speaking-02-repeat').status==403
    upload=context.request.put(endpoint+'/recordings/toefl-s-repeat-1',headers={**ORIGIN,'Content-Type':'audio/webm'},data=b'\x1aE\xdf\xa3'+b'\x00'*400)
    assert upload.ok,upload.text()
    for _ in range(20):
        data=context.request.get(endpoint).json()
        if data['finishedAt']:break
        assert data['stage']['id'].startswith('toefl-s-'),data['stage']['id']
        fixture('deadline',attempt)
    done=context.request.get(endpoint).json()
    assert done['finishedAt'],'sitting did not finish'
    sections={s['title']:s for s in done['report']['sections']}
    assert [sections['Reading']['correct'],sections['Reading']['total']]==[50,50],sections['Reading']
    assert [sections['Listening']['correct'],sections['Listening']['total']]==[1,47],sections['Listening']
    assert [sections['Writing']['correct'],sections['Writing']['total']]==[10,10],sections['Writing']
    assert len(done['recordings'])==1,done['recordings']
    page.goto(BASE+'/exams/attempts/'+attempt)
    # A finished mock's result is the Review page: modules, AI grades and recordings in its TOEFL panel.
    expect(page.locator('.wsp-review')).to_be_visible()
    expect(page).to_have_url(BASE+'/workspace/review/'+attempt)
    expect(page.locator('.wsp-extras')).to_contain_text('50')
    expect(page.locator('.wsp-recordings audio')).to_have_count(1)
    page.locator('.wsp-filter button',has_text='Бүгд').click()
    expect(page.locator('.wsp-question')).to_have_count(120)
    fits(page,'results')
    page.goto(BASE+'/workspace/review/'+attempt)
    expect(page.get_by_text('TOEFL').first).to_be_visible()
    other=browser.new_context()
    assert other.request.get(endpoint).status==401
    assert other.request.get(endpoint+'/audio/toefl?clip=speaking-01-repeat').status in (401,403,404)
    other.close()
    assert not errors,errors
    browser.close()
print(f'TOEFL iBT: library row, 9-card hub, purchase, practice (gaps, Build a Sentence, listening clip and transcript), timed sitting routed Reading Upper / Listening Lower ({lower_seconds}s), answer windows, one-clip allowlist, speaking upload, 50/50 Reading, 1/47 Listening, 10/10 Build and responsive views passed.')
