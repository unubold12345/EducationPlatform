"""Real DeepSeek calls (three bounded requests); other provider shapes are unit-mocked."""
import os, re, subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/')
ORIGIN={'Origin':BASE}
def quota(action,user):
    subprocess.check_output(['node','--import','tsx','tests/tutor_quota_fixture.mjs',action,user],cwd=ROOT)
def request_body(target,action='hint',language='mn'):
    return {'target':target,'action':action,'language':language,'message':'','history':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},color_scheme='dark')
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    demo={'kind':'practice','slug':'demo','questionId':'demo-algebra-001-v1','selected':0}
    assert context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body(demo)).status==401
    email='qa-exam-ai-'+uuid4().hex[:12]+'@example.invalid'
    signup=context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'AI Tutor QA','email':email,'password':'Local-Test-'+uuid4().hex})
    assert signup.ok,signup.status
    user=context.request.get(BASE+'/api/auth/get-session').json()['user']['id']
    assert context.request.post(BASE+'/api/math-tutor',headers={'Origin':'https://untrusted.invalid'},data=request_body(demo)).status==403
    assert context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data={**request_body(demo),'prompt':'forged problem'}).status==400
    assert context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body({**demo,'questionId':'not-a-question'})).status==404
    assert context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body({'kind':'practice','slug':'sat-algebra','examId':'sat-algebra-v1','questionId':'x'})).status==402
    # First live completion uses the actual practice question through the UI.
    page.goto(BASE+'/practice');page.wait_for_load_state('networkidle')
    # Nothing renders or calls the provider until the student opens the assistant.
    expect(page.locator('.tutor-drawer')).to_have_count(0)
    page.locator('.tutor-launch').click();panel=page.locator('.tutor-drawer');expect(panel).to_be_visible()
    with page.expect_response(lambda r:r.url.endswith('/api/math-tutor'),timeout=75000) as reply:
        panel.get_by_role('button',name='Санаа өгөх',exact=True).click()
    assert reply.value.status==200,(reply.value.status,reply.value.text())
    expect(panel.locator('[data-turn="assistant"]')).to_have_count(1)
    hint=panel.locator('[data-turn="assistant"]').inner_text()
    assert re.search('[А-Яа-яӨөҮү]',hint),hint
    assert not re.search(r'x\s*=\s*5\b',hint,re.I),hint
    page.screenshot(path=str(ART/'ai-tutor-desktop.png'),full_page=True)
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(ART/'ai-tutor-320.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    # Saved review uses the owner's immutable attempt answer, not client-supplied marks.
    attempt=context.request.post(BASE+'/api/attempts',headers=ORIGIN).json()['id']
    endpoint=BASE+'/api/attempts/'+attempt
    initial=context.request.get(endpoint).json()
    qid=initial['questions'][0]['id']
    saved={'kind':'saved','attemptId':attempt,'questionId':qid}
    assert context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body(saved,'review')).status==403
    result=context.request.post(endpoint+'/submit',headers=ORIGIN,data={'revision':initial['revision'],'answers':[0,0,0]}).json()
    assert result['result']['score']==0
    other=browser.new_context()
    assert other.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'AI Other QA','email':'qa-exam-ai-'+uuid4().hex[:12]+'@example.invalid','password':'Local-Test-'+uuid4().hex}).ok
    assert other.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body(saved,'review')).status==404
    quota('unlock',user)
    page.goto(BASE+'/learn/attempts/'+attempt)
    page.locator('.tutor-launch').first.click();review=page.locator('.tutor-drawer')
    with page.expect_response(lambda r:r.url.endswith('/api/math-tutor'),timeout=75000) as reply:
        review.get_by_role('button',name='Алдаагаа тайлбарлуулах',exact=True).click()
    assert reply.value.status==200,(reply.value.status,reply.value.text())
    expect(review.locator('[data-turn="assistant"]')).to_have_count(1)
    assert context.request.get(endpoint).json()['result']==result['result']
    page.screenshot(path=str(ART/'ai-mistake-review.png'),full_page=True)
    # Third live call asks an ungraded follow-up in English.
    quota('unlock',user)
    review.get_by_label('AI тайлбарын хэл').select_option('en')
    with page.expect_response(lambda r:r.url.endswith('/api/math-tutor'),timeout=75000) as reply:
        review.get_by_role('button',name='Бататгах асуулт',exact=True).click()
    assert reply.value.status==200,(reply.value.status,reply.value.text())
    expect(review.locator('[data-turn="assistant"]')).to_have_count(2)
    # Server guard also denies help requested from another tab during a mock.
    order=context.request.post(BASE+'/api/mock-payments',headers=ORIGIN,data={'slug':'sat-full-01'}).json()
    assert context.request.post(BASE+'/api/mock-payments/'+order['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
    mock=context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':'sat-full-01'}).json()['id']
    assert context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body(demo)).status==403
    mock_endpoint=BASE+'/api/mock-attempts/'+mock
    active=context.request.get(mock_endpoint).json()
    assert context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body({'kind':'mock','attemptId':mock,'questionId':active['stage']['questions'][0]['id']},'review')).status==403
    page.goto(BASE+'/exams/attempts/'+mock)
    expect(page.locator('.tutor-drawer')).to_have_count(0);expect(page.locator('.tutor-launch')).to_have_count(0)
    page.goto(BASE+'/practice')
    for _ in range(5):
        subprocess.check_output(['node','tests/mock_fixture.mjs','deadline',mock,'-1000'],cwd=ROOT)
        finished=context.request.get(mock_endpoint).json()
    assert finished['report'] is not None
    page.goto(BASE+'/exams/attempts/'+mock)
    expect(page.locator('.tutor-launch')).to_have_count(44);expect(page.locator('.tutor-drawer')).to_have_count(0)
    # Force only this QA account's daily budget to its limit; denied before API use.
    quota('exhaust',user)
    math_review=next(q for q in finished['report']['reviews'] if q['id'].startswith('sat-math'))
    limited=context.request.post(BASE+'/api/math-tutor',headers=ORIGIN,data=request_body({'kind':'mock','attemptId':mock,'questionId':math_review['id']},'review'))
    assert limited.status==429,limited.status
    assert not errors,errors
    browser.close()
print('PASS: three REAL DeepSeek tutor/review/follow-up completions, consent, Mongolian/English, 320px layout, auth/origin/shape/ownership/program guards, timed-exam blocking, completed SAT review controls, immutable scores and daily quota')

