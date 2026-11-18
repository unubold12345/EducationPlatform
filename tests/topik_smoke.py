"""Local TOPIK Ⅰ (full flow) and TOPIK Ⅱ (three timed sections through the API): library card -> two-level hub ->
purchase -> practice (pictures, audio, reveal) -> timed sections -> results. Only disposable qa-exam-* rows use the
existing trusted deadline fixture.
"""
import json
import os
from pathlib import Path
import subprocess
import time
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/')
ORIGIN={'Origin':BASE}
ART=ROOT/'artifacts'
ART.mkdir(exist_ok=True)
SLUG='topik1-mock-01'
SLUG2='topik2-mock-01'
CATALOG=json.loads((ROOT/'src/modules/exams/topik/catalog.json').read_text(encoding='utf-8'))
# The local DEV_PRACTICE_DURING_MOCK switch opens practice during a sitting; scripts/check.mjs turns it off.
PRACTICE_DURING_MOCK=os.environ.get('DEV_PRACTICE_DURING_MOCK')=='true'

def fixture(action,attempt):
    # The local database takes one connection at a time; while the open sitting polls, a fixture connection can be
    # dropped ("Connection terminated unexpectedly"), so try again after a pause.
    for tries in range(4):
        result=subprocess.run(['node','tests/mock_fixture.mjs',action,attempt],cwd=ROOT,text=True,encoding='utf-8',capture_output=True)
        if result.returncode==0:return json.loads(result.stdout)
        time.sleep(2)
    raise RuntimeError(result.stderr[-2000:])

def fits(page,label,widths=(1440,390,320)):
    for width in widths:
        page.set_viewport_size({'width':width,'height':950})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(label,width)
        page.screenshot(path=str(ART/f'topik-{label}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':950})

def script_line(slug):
    """A line of the form's first listening script: it must never reach the browser before results."""
    form=json.loads((ROOT/'assets/topik'/(slug+'.json')).read_text(encoding='utf-8'))
    return form['stages'][0]['questions'][0]['listening']['script'].split('\n')[0].split(': ',1)[1]

def buy(context,slug):
    order=context.request.post(BASE+'/api/mock-payments',headers=ORIGIN,data={'slug':slug})
    assert order.ok,order.text()
    assert context.request.post(BASE+'/api/mock-payments/'+order.json()['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok

def private_free(stage,slug):
    text=json.dumps(stage,ensure_ascii=False)
    for private in ['"answers":','"answerDisplay":','"explanation":','"script"','"model"',script_line(slug)]:assert private not in text,private

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':950},reduced_motion='reduce',color_scheme='dark')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/exams')
    expect(page.locator('.exam-card.topik')).to_be_visible()
    page.goto(BASE+'/exams/topik')
    expect(page.locator('.topik-card')).to_have_count(len(CATALOG))
    expect(page.locator('.topik-level')).to_have_count(2)
    fits(page,'hub')
    assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':SLUG}).status==401
    email='qa-exam-topik-'+uuid4().hex[:12]+'@example.invalid'
    password='Local-Test-'+uuid4().hex
    assert context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'TOPIK QA','email':email,'password':password}).ok
    practice=BASE+'/api/exam-practice/'+SLUG
    assert context.request.get(practice).status==402
    assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':SLUG}).status==402
    buy(context,SLUG)
    view=context.request.get(practice).json()
    questions=view['form']['questions']
    assert view['form']['subject']=='topik' and len(questions)==70
    assert all(not any(field in q for field in ['answers','explanation','answerDisplay','listening','script']) for q in questions)
    assert script_line(SLUG) not in json.dumps(view,ensure_ascii=False)
    # TOPIK recordings come only from their own route segment.
    assert context.request.get(practice+'/audio?part=1').status==404
    assert context.request.get(practice+'/audio/hsk?part=1').status==404
    ranged=context.request.get(practice+'/audio/topik?part=1',headers={'Range':'bytes=0-127'})
    assert ranged.status==206 and len(ranged.body())==128
    assert context.request.get(practice+'/audio/topik?part=5').status in (400,404)
    page.goto(BASE+'/exams/'+SLUG+'/practice?section=topik-l-15')
    expect(page.locator('.topik-practice-audio')).to_be_visible()
    expect(page.locator('.topik-options-pictures label')).to_have_count(4)
    expect(page.locator('.topik-options-pictures img')).to_have_count(4)
    expect(page.locator('.practice-transcript')).to_have_count(0)
    page.locator('.topik-options-pictures label').nth(1).click()
    page.get_by_role('button',name='Шалгах',exact=True).click()
    expect(page.locator('.practice-transcript')).to_be_visible()
    expect(page.locator('.topik-options label[data-correct]')).to_have_count(1)
    fits(page,'practice-l15')
    page.goto(BASE+'/exams/'+SLUG+'/practice?section=topik-r-40')
    expect(page.locator('.topik-instruction')).to_be_visible()
    fits(page,'practice-r40')
    assert context.request.post(practice+'/check',headers=ORIGIN,data={'questionId':questions[0]['id'],'response':'⑤'}).status==400
    assert context.request.patch(practice,headers={'Origin':'https://untrusted.invalid'},data={'flags':[]}).status==403
    page.goto(BASE+'/exams/'+SLUG)
    expect(page.get_by_text('TOPIK Ⅰ · БҮТЭН MOCK',exact=False)).to_be_visible()
    fits(page,'briefing')
    page.get_by_label('Дууг тод сонсож байна').check()
    page.locator('.exam-agreement input').check()
    page.get_by_role('button',name='Шалгалт эхлэх / үргэлжлүүлэх',exact=False).click()
    page.wait_for_url('**/exams/attempts/*')
    attempt=page.url.rsplit('/',1)[1]
    endpoint=BASE+'/api/mock-attempts/'+attempt
    expect(page.locator('.topik-sheet')).to_be_visible()
    expect(page.locator('.topik-item').first).to_be_visible()
    source=page.locator('[data-listening-player] audio').get_attribute('src')
    assert source.endswith('/audio/topik?part=1'),source
    track=context.request.get(BASE+source,headers={'Range':'bytes=0-127'})
    assert track.status==206 and len(track.body())==128
    assert context.request.get(endpoint+'/audio/topik?part=2').status==403
    assert context.request.get(endpoint+'/audio?part=1').status==404
    if not PRACTICE_DURING_MOCK:assert context.request.get(practice).status==403
    page.locator('.topik-options label').first.click()
    expect(page.locator('.exam-session-meta [role=status]')).to_have_text('Хадгалсан')
    page.reload()
    expect(page.locator('.topik-options input').first).to_be_checked()
    fits(page,'timed-l')
    for stage_id,count in [('topik-l',30),('topik-r',40)]:
        data=context.request.get(endpoint).json()
        assert data['stage']['id']==stage_id and len(data['stage']['questions'])==count and data['report'] is None
        private_free(data['stage'],SLUG)
        if stage_id=='topik-r':
            page.goto(BASE+'/exams/attempts/'+attempt)
            expect(page.locator('.topik-item').first).to_be_visible()
            expect(page.locator('[data-listening-player]')).to_have_count(0)
            fits(page,'timed-r')
        answers=fixture('answers',attempt)
        if stage_id=='topik-r':
            # One wrong two-point answer (the first reading item is worth 2).
            target=data['stage']['questions'][0]
            answers['responses'][target['id']]=next(value for value in target['options'] if value!=answers['responses'][target['id']])
        response=context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':stage_id,'responses':answers['responses'],'flags':[]})
        assert response.ok,response.text()
        fixture('deadline',attempt)
    done=context.request.get(endpoint).json()
    assert done['finishedAt'] and done['report']['points']=={'total':200,'earned':198},done['report']['points']
    assert [[s['correct'],s['total']] for s in done['report']['sections']]==[[30,30],[39,40]]
    page.goto(BASE+'/exams/attempts/'+attempt)
    expect(page.locator('.topik-results')).to_be_visible()
    expect(page.locator('.topik-score-line')).to_contain_text('198/200')
    expect(page.locator('.topik-score-line')).to_contain_text('2-р түвшин')
    page.locator('.review-filter button',has_text='Бүгд').click()
    expect(page.locator('.topik-results .exam-review')).to_have_count(70)
    fits(page,'results')
    page.goto(BASE+'/workspace/review/'+attempt)
    expect(page.get_by_text('TOPIK Ⅰ',exact=False).first).to_be_visible()
    # TOPIK Ⅱ: listening, writing (four written answers, not graded automatically) and reading.
    practice2=BASE+'/api/exam-practice/'+SLUG2
    assert context.request.get(practice2).status==402
    buy(context,SLUG2)
    view=context.request.get(practice2).json()
    assert len(view['form']['questions'])==104
    assert all(not any(field in q for field in ['answers','explanation','answerDisplay','listening','script']) for q in view['form']['questions'])
    ranged=context.request.get(practice2+'/audio/topik?part=4',headers={'Range':'bytes=0-127'})
    assert ranged.status==206 and len(ranged.body())==128
    page.goto(BASE+'/exams/'+SLUG2+'/practice?section=topik-w-53')
    expect(page.locator('.topik-writing')).to_be_visible()
    expect(page.locator('.topik-chart').first).to_be_visible()
    fits(page,'level2-practice-w53')
    page.goto(BASE+'/exams/'+SLUG2)
    expect(page.get_by_text('TOPIK Ⅱ · БҮТЭН MOCK',exact=False)).to_be_visible()
    started=context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':SLUG2})
    assert started.ok,started.text()
    attempt2=started.json()['id']
    endpoint2=BASE+'/api/mock-attempts/'+attempt2
    for stage_id,count in [('topik-l',50),('topik-w',4),('topik-r',50)]:
        data=context.request.get(endpoint2).json()
        assert data['stage']['id']==stage_id and len(data['stage']['questions'])==count and data['report'] is None
        private_free(data['stage'],SLUG2)
        if stage_id=='topik-w':
            page.goto(BASE+'/exams/attempts/'+attempt2)
            expect(page.locator('.topik-writing').first).to_be_visible()
            fits(page,'level2-timed-w')
        answers=fixture('answers',attempt2)
        response=context.request.patch(endpoint2,headers=ORIGIN,data={'revision':data['revision'],'stageId':stage_id,'responses':answers['responses'],'flags':[]})
        assert response.ok,response.text()
        fixture('deadline',attempt2)
    done=context.request.get(endpoint2).json()
    assert done['finishedAt'] and done['report']['points']=={'total':200,'earned':200},done['report']['points']
    page.goto(BASE+'/exams/attempts/'+attempt2)
    expect(page.locator('.topik-score-line')).to_contain_text('бичих')
    page.locator('.review-filter button',has_text='Бичих').click()
    expect(page.locator('.topik-writing-review')).to_have_count(4)
    expect(page.locator('.topik-model').first).to_be_visible()
    fits(page,'level2-results')
    other=browser.new_context()
    assert other.request.get(endpoint).status==401
    other.close()
    assert not errors,errors
    browser.close()
print('TOPIK Ⅰ and Ⅱ: library card, two-level hub, purchase, practice with pictures/audio/reveal, saved timed sections, no key or script leakage, 198/200 with level 2, TOPIK Ⅱ writing review and responsive views passed.')
