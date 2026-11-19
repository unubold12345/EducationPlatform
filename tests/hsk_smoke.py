"""Local HSK 3.0 HSK 1 (full flow) and HSK 2 (its own page types with Writing, a full sitting): library grid -> hub -> purchase -> practice (pictures, audio, reveal) -> timed sections -> results.
Only disposable qa-exam-* rows use the existing trusted deadline fixture.
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
SLUG='hsk1-mock-01'
# The local DEV_PRACTICE_DURING_MOCK switch opens practice during a sitting; scripts/check.mjs turns it off.
PRACTICE_DURING_MOCK=os.environ.get('DEV_PRACTICE_DURING_MOCK')=='true'

def fixture(action,attempt):
    return json.loads(subprocess.check_output(['node','tests/mock_fixture.mjs',action,attempt],cwd=ROOT,text=True,encoding='utf-8'))

def fits(page,label,widths=(1440,390,320)):
    for width in widths:
        page.set_viewport_size({'width':width,'height':950})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(label,width)
        page.screenshot(path=str(ART/f'hsk-{label}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':950})

def columns(page):
    return page.evaluate("getComputedStyle(document.querySelector('.library-list')).gridTemplateColumns.split(' ').length")

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':950},reduced_motion='reduce',color_scheme='dark')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/exams')
    expect(page.locator('.exam-card.hsk')).to_be_visible()
    # Each programme is one full-width row at every width (owner request 2026-11-15).
    assert columns(page)==1
    page.set_viewport_size({'width':1024,'height':950});assert columns(page)==1
    page.set_viewport_size({'width':390,'height':950});assert columns(page)==1
    fits(page,'library',(1440,1280,390,320))
    page.goto(BASE+'/exams/hsk')
    expect(page.locator('.hsk-card')).to_have_count(12)
    expect(page.locator('.hsk-level')).to_have_count(2)
    fits(page,'hub')
    assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':SLUG}).status==401
    email='qa-exam-hsk-'+uuid4().hex[:12]+'@example.invalid'
    password='Local-Test-'+uuid4().hex
    assert context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'HSK QA','email':email,'password':password}).ok
    practice=BASE+'/api/exam-practice/'+SLUG
    assert context.request.get(practice).status==402
    assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':SLUG}).status==402
    order=context.request.post(BASE+'/api/mock-payments',headers=ORIGIN,data={'slug':SLUG})
    assert order.ok
    assert context.request.post(BASE+'/api/mock-payments/'+order.json()['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
    view=context.request.get(practice).json()
    questions=view['form']['questions']
    assert view['form']['subject']=='hsk' and len(questions)==40
    assert all(not any(field in q for field in ['answers','explanation','answerDisplay','listening','script']) for q in questions)
    # HSK recordings come only from their own route segment.
    assert context.request.get(practice+'/audio?part=1').status==404
    assert context.request.get(practice+'/audio/forms?part=1').status==404
    ranged=context.request.get(practice+'/audio/hsk?part=1',headers={'Range':'bytes=0-127'})
    assert ranged.status==206 and len(ranged.body())==128
    page.goto(BASE+'/exams/'+SLUG+'/practice?section=hsk-l-1')
    expect(page.locator('.hsk-practice-audio')).to_be_visible()
    expect(page.locator('.hsk-options-pictures label')).to_have_count(3)
    expect(page.locator('.practice-transcript')).to_have_count(0)
    audio=page.locator('.hsk-practice-audio audio')
    audio.evaluate('(a)=>a.load()')
    expect(audio).to_have_js_property('readyState',4,timeout=15000)
    page.locator('.hsk-options-pictures label').nth(1).click()
    page.get_by_role('button',name='Шалгах',exact=True).click()
    expect(page.locator('.practice-transcript')).to_be_visible()
    expect(page.locator('.hsk-options label[data-correct]')).to_have_count(1)
    fits(page,'practice-l1')
    page.goto(BASE+'/exams/'+SLUG+'/practice?section=hsk-r-1')
    expect(page.locator('.hsk-picture-grid figure')).to_have_count(6)
    page.get_by_role('button',name='Pinyin',exact=False).click()
    expect(page.locator('.hsk-pinyin')).to_have_count(0)
    fits(page,'practice-r1')
    assert context.request.post(practice+'/check',headers=ORIGIN,data={'questionId':questions[0]['id'],'response':'G'}).status==400
    assert context.request.patch(practice,headers={'Origin':'https://untrusted.invalid'},data={'flags':[]}).status==403
    page.goto(BASE+'/exams/'+SLUG)
    expect(page.locator('.subscription-alternative')).to_have_count(0)
    fits(page,'briefing')
    page.get_by_label('Дууг тод сонсож байна').check()
    page.locator('.exam-agreement input').check()
    page.get_by_role('button',name='Шалгалт эхлэх / үргэлжлүүлэх',exact=False).click()
    page.wait_for_url('**/exams/attempts/*')
    attempt=page.url.rsplit('/',1)[1]
    endpoint=BASE+'/api/mock-attempts/'+attempt
    expect(page.locator('.hsk-item')).to_have_count(5)
    source=page.locator('[data-listening-player] audio').get_attribute('src')
    assert source.endswith('/audio/hsk?part=1'),source
    track=context.request.get(BASE+source,headers={'Range':'bytes=0-127'})
    assert track.status==206 and len(track.body())==128
    assert context.request.get(endpoint+'/audio/hsk?part=2').status==403
    assert context.request.get(endpoint+'/audio?part=1').status==404
    if not PRACTICE_DURING_MOCK:assert context.request.get(practice).status==403
    page.locator('.hsk-options-pictures label').first.click()
    expect(page.locator(':is(.exam-session-meta,.exam-sheet,.study-rail) [role=status]')).to_have_text('Хадгалсан')
    page.reload()
    expect(page.locator('.hsk-options-pictures input').first).to_be_checked()
    for stage_id in ['hsk-l','hsk-r']:
        data=context.request.get(endpoint).json()
        assert data['stage']['id']==stage_id and len(data['stage']['questions'])==20 and data['report'] is None
        stage=json.dumps(data['stage'],ensure_ascii=False)
        for private in ['"answers":','"answerDisplay":','"explanation":','"listening": {','"script"','他今天坐出租车上班。']:assert private not in stage,private
        page.goto(BASE+'/exams/attempts/'+attempt)
        expect(page.locator('.hsk-item')).to_have_count(5)
        page.locator('.exam-sheet-group').nth(2 if stage_id=='hsk-l' else 0).locator('button').first.click()
        expect(page.locator('.hsk-picture-grid figure')).to_have_count(6)
        fits(page,'timed-'+stage_id)
        answers=fixture('answers',attempt)
        if stage_id=='hsk-r':
            target=data['stage']['questions'][3]
            answers['responses'][target['id']]=next(value for value in target['options'] if value!=answers['responses'][target['id']])
        response=context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':stage_id,'responses':answers['responses'],'flags':[]})
        assert response.ok,response.text()
        fixture('deadline',attempt)
    done=context.request.get(endpoint).json()
    assert done['finishedAt'] and done['report']['points']=={'total':40,'earned':39}
    assert [[s['correct'],s['total']] for s in done['report']['sections']]==[[20,20],[19,20]]
    page.goto(BASE+'/exams/attempts/'+attempt)
    # A finished mock's result is the Review page, with the /200 practice score in its HSK panel.
    expect(page.locator('.wsp-review')).to_be_visible()
    expect(page).to_have_url(BASE+'/workspace/review/'+attempt)
    expect(page.locator('.hsk-score-line')).to_contain_text('195/200')
    page.locator('.wsp-filter button',has_text='Бүгд').click()
    expect(page.locator('.wsp-question')).to_have_count(40)
    fits(page,'results')
    page.locator('a.wsp-domain.is-link').first.click()
    expect(page.locator('.practice-sections button[aria-current=true]')).to_contain_text('阅读')
    page.goto(BASE+'/workspace/review/'+attempt)
    expect(page.get_by_text('HSK 1 · Mock 01').first).to_be_visible()
    # HSK 2 on the same views: two picture sets in Listening 2, the text + ★ question part, Writing, eleven groups.
    slug2='hsk2-mock-01'
    practice2=BASE+'/api/exam-practice/'+slug2
    assert context.request.get(practice2).status==402
    order=context.request.post(BASE+'/api/mock-payments',headers=ORIGIN,data={'slug':slug2})
    assert order.ok
    assert context.request.post(BASE+'/api/mock-payments/'+order.json()['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
    view=context.request.get(practice2).json()
    assert len(view['form']['questions'])==60 and len(view['form']['sections'])==11
    assert all(not any(field in q for field in ['answers','explanation','answerDisplay','listening','script']) for q in view['form']['questions'])
    ranged=context.request.get(practice2+'/audio/hsk?part=3',headers={'Range':'bytes=0-127'})
    assert ranged.status==206 and len(ranged.body())==128
    # The HSK 3.0 HSK 2 paper has three Listening parts.
    assert context.request.get(practice2+'/audio/hsk?part=4').status==404
    page.goto(BASE+'/exams/'+slug2+'/practice?section=hsk-l-2a')
    expect(page.locator('.hsk-practice-audio')).to_be_visible()
    expect(page.locator('.hsk-picture-grid figure')).to_have_count(6)
    expect(page.locator('.hsk-options-letters label')).to_have_count(6)
    fits(page,'level2-practice-l2a')
    page.goto(BASE+'/exams/'+slug2+'/practice?section=hsk-l-2b')
    expect(page.locator('.hsk-picture-grid figure')).to_have_count(5)
    page.goto(BASE+'/exams/'+slug2+'/practice?section=hsk-r-4')
    expect(page.locator('.hsk-question .hsk-statement')).to_have_count(1)
    expect(page.locator('.hsk-options-choices label')).to_have_count(3)
    page.locator('.hsk-options-choices label').first.click()
    page.get_by_role('button',name='Шалгах',exact=True).click()
    expect(page.locator('.hsk-options label[data-correct]')).to_have_count(1)
    fits(page,'level2-practice-r4')
    # Writing 1: the word with its missing component and the A-F component bank.
    page.goto(BASE+'/exams/'+slug2+'/practice?section=hsk-w-1')
    expect(page.locator('.hsk-question .hsk-compose')).to_have_count(1)
    expect(page.locator('.hsk-bank li')).to_have_count(6)
    expect(page.locator('.hsk-options-letters label')).to_have_count(6)
    fits(page,'level2-practice-w1')
    # Writing 2: one typed character (no second, generic answer box); a wrong one shows the key after the check.
    page.goto(BASE+'/exams/'+slug2+'/practice?section=hsk-w-2')
    expect(page.locator('.hsk-blank-input')).to_have_count(1)
    expect(page.locator('.exam-answer-panel input[type=text]')).to_have_count(1)
    page.locator('.hsk-blank-input').fill('我')
    page.get_by_role('button',name='Шалгах',exact=True).click()
    expect(page.locator('.hsk-blank-key')).to_contain_text('好')
    fits(page,'level2-practice-w2')
    page.goto(BASE+'/exams/'+slug2)
    expect(page.get_by_text('HSK 2 · БҮТЭН MOCK',exact=False)).to_be_visible()
    fits(page,'level2-briefing')
    page.get_by_label('Дууг тод сонсож байна').check()
    page.locator('.exam-agreement input').check()
    page.get_by_role('button',name='Шалгалт эхлэх / үргэлжлүүлэх',exact=False).click()
    page.wait_for_url('**/exams/attempts/*')
    attempt2=page.url.rsplit('/',1)[1]
    endpoint2=BASE+'/api/mock-attempts/'+attempt2
    expect(page.locator('.exam-sheet-group')).to_have_count(4)
    expect(page.locator('.hsk-item')).to_have_count(5)
    assert page.locator('[data-listening-player] audio').get_attribute('src').endswith('/audio/hsk?part=1')
    fits(page,'level2-timed-l1')
    page.locator('.exam-sheet-group').nth(1).locator('button').first.click()
    expect(page.locator('.hsk-picture-grid figure')).to_have_count(6)
    expect(page.locator('.hsk-item')).to_have_count(5)
    for stage_id,count in [('hsk-l',25),('hsk-r',25),('hsk-w',10)]:
        data=context.request.get(endpoint2).json()
        assert data['stage']['id']==stage_id and len(data['stage']['questions'])==count and data['report'] is None
        stage=json.dumps(data['stage'],ensure_ascii=False)
        for private in ['"answers":','"answerDisplay":','"explanation":','"script"','我早上吃了两个鸡蛋。']:assert private not in stage,private
        if stage_id=='hsk-r':
            page.goto(BASE+'/exams/attempts/'+attempt2)
            page.locator('.exam-sheet-group').nth(4).locator('button').first.click()
            expect(page.locator('.hsk-item .hsk-statement')).to_have_count(5)
            fits(page,'level2-timed-r4')
        if stage_id=='hsk-w':
            page.goto(BASE+'/exams/attempts/'+attempt2)
            expect(page.locator('.hsk-item .hsk-compose')).to_have_count(5)
            page.locator('.exam-sheet-group').nth(1).locator('button').first.click()
            expect(page.locator('.hsk-item .hsk-blank-input')).to_have_count(5)
            fits(page,'level2-timed-w2')
        answers=fixture('answers',attempt2)
        response=context.request.patch(endpoint2,headers=ORIGIN,data={'revision':data['revision'],'stageId':stage_id,'responses':answers['responses'],'flags':[]})
        assert response.ok,response.text()
        fixture('deadline',attempt2)
    done=context.request.get(endpoint2).json()
    assert done['finishedAt'] and done['report']['points']=={'total':60,'earned':60}
    assert [[s['correct'],s['total']] for s in done['report']['sections']]==[[25,25],[25,25],[10,10]]
    page.goto(BASE+'/exams/attempts/'+attempt2)
    expect(page.locator('.hsk-score-line')).to_contain_text('300/300')
    expect(page.locator('.wsp-extras h2').first).to_contain_text('HSK 2')
    expect(page.locator('.wsp-question')).to_have_count(60)
    expect(page.locator('.wsp-question').nth(45).locator('.hsk-statement')).to_have_count(1)
    expect(page.locator('.wsp-question').nth(50).locator('.hsk-compose')).to_have_count(1)
    expect(page.locator('.wsp-question').nth(55).locator('.hsk-blank')).to_have_count(1)
    fits(page,'level2-results')
    other=browser.new_context()
    assert other.request.get(endpoint).status==401
    other.close()
    assert not errors,errors
    browser.close()
print('HSK 3.0 HSK 1 and HSK 2: library, two-level hub, purchase, practice with pictures/audio and Writing, saved timed sections, no key or script leakage, 195/200 and 300/300 practice scores and responsive views passed.')
