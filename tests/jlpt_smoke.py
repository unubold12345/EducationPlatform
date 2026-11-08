"""Local JLPT purchase -> focused practice -> three timed sections -> review.
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

def fixture(action,attempt):
    return json.loads(subprocess.check_output(['node','tests/mock_fixture.mjs',action,attempt],cwd=ROOT,text=True,encoding='utf-8'))

def fits(page,label):
    for width in [1440,390,320]:
        page.set_viewport_size({'width':width,'height':950})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(label,width)
        page.screenshot(path=str(ART/f'jlpt-{label}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':950})

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':950},reduced_motion='reduce',color_scheme='dark')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/exams')
    expect(page.locator('.exam-card.jlpt')).to_be_visible()
    page.goto(BASE+'/exams/jlpt')
    expect(page.locator('.jlpt-card')).to_have_count(3)
    fits(page,'hub-n5')
    page.get_by_role('link',name='N4 · Суурь шат',exact=True).click()
    expect(page.locator('.jlpt-cards')).to_contain_text('85')
    fits(page,'hub-n4')
    assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':'jlpt-n5-01'}).status==401
    email='qa-exam-jlpt-'+uuid4().hex[:12]+'@example.invalid'
    password='Local-Test-'+uuid4().hex
    assert context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'JLPT QA','email':email,'password':password}).ok
    for level,count,stage_counts in [('N5',67,[21,22,24]),('N4',85,[28,29,28])]:
        slug='jlpt-'+level.lower()+'-01'
        practice=BASE+'/api/exam-practice/'+slug
        denied=context.request.get(practice)
        assert denied.status==402,(denied.status,denied.text())
        assert context.request.post(BASE+'/api/mock-attempts',headers=ORIGIN,data={'slug':slug}).status==402
        order=context.request.post(BASE+'/api/mock-payments',headers=ORIGIN,data={'slug':slug})
        assert order.ok
        assert context.request.post(BASE+'/api/mock-payments/'+order.json()['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
        view=context.request.get(practice).json()
        assert len(view['form']['questions'])==count
        assert all(not any(field in q for field in ['answers','explanation','answerDisplay','listening','script']) for q in view['form']['questions'])
        page.goto(BASE+'/exams/'+slug+'/practice?section=jlpt-l-1')
        expect(page.locator('.jlpt-practice-audio')).to_be_visible()
        expect(page.locator('.practice-transcript')).to_have_count(0)
        audio=page.locator('.jlpt-practice-audio audio')
        audio.evaluate('(a)=>a.load()')
        expect(audio).to_have_js_property('readyState',4,timeout=15000)
        first=view['form']['questions'][0]
        checked=context.request.post(practice+'/check',headers=ORIGIN,data={'questionId':first['id'],'response':first['options'][0]})
        assert checked.ok and 'answer' in checked.json()['reveal']
        first_listening=next(q for q in view['form']['questions'] if q.get('audioPart')==1)
        checked=context.request.post(practice+'/check',headers=ORIGIN,data={'questionId':first_listening['id'],'response':first_listening['options'][0]})
        assert checked.ok and checked.json()['reveal']['transcript']
        page.reload()
        page.get_by_role('button',name='Асуулт L01',exact=False).click()
        expect(page.locator('.practice-transcript')).to_be_visible()
        fits(page,'practice-'+level.lower())
        # The practice server rejects forged choices and cross-origin mutations.
        assert context.request.post(practice+'/check',headers=ORIGIN,data={'questionId':first['id'],'response':'forged'}).status==400
        assert context.request.patch(practice,headers={'Origin':'https://untrusted.invalid'},data={'flags':[]}).status==403
        page.goto(BASE+'/exams/'+slug)
        expect(page.locator('.subscription-alternative')).to_have_count(0)
        fits(page,'briefing-'+level.lower())
        page.get_by_label('Дууг тод сонсож байна').check()
        page.locator('.exam-agreement input').check()
        page.get_by_role('button',name='Шалгалт эхлэх / үргэлжлүүлэх',exact=False).click()
        page.wait_for_url('**/exams/attempts/*')
        attempt=page.url.rsplit('/',1)[1]
        endpoint=BASE+'/api/mock-attempts/'+attempt
        expect(page.locator('.jlpt-item')).to_have_count(1)
        page.get_by_role('radio').first.check()
        expect(page.locator('.exam-session-meta [role=status]')).to_have_text('Хадгалсан')
        saved=context.request.get(endpoint).json()
        deadline=saved['deadline']
        page.reload()
        expect(page.get_by_role('radio').first).to_be_checked()
        assert context.request.get(endpoint).json()['deadline']==deadline
        fits(page,'timed-vocab-'+level.lower())
        assert context.request.get(practice).status==403
        for index,stage_id in enumerate(['jlpt-v','jlpt-g','jlpt-l']):
            data=context.request.get(endpoint).json()
            assert data['stage']['id']==stage_id and len(data['stage']['questions'])==stage_counts[index]
            assert data['report'] is None
            assert all(not any(field in q for field in ['answers','answerDisplay','explanation','listening','script']) for q in data['stage']['questions'])
            if stage_id=='jlpt-g':
                page.goto(BASE+'/exams/attempts/'+attempt)
                page.locator('.jlpt-skills button').nth(2).click()
                expect(page.locator('.jlpt-passage')).to_be_visible()
                expect(page.locator('.jlpt-item')).to_have_count(4)
                if level=='N4':
                    assert page.locator('.jlpt-passage rt').count()>0
                    page.get_by_role('button',name='ふりがな',exact=False).click()
                    expect(page.locator('.jlpt-passage rt')).to_have_count(0)
                    page.get_by_role('button',name='ふりがな',exact=False).click()
                fits(page,'timed-reading-'+level.lower())
            if stage_id=='jlpt-l':
                page.goto(BASE+'/exams/attempts/'+attempt)
                expect(page.locator('[data-listening-player] audio')).to_be_visible(visible=False)
                source=page.locator('[data-listening-player] audio').get_attribute('src')
                assert source.endswith('part=1')
                track=context.request.get(BASE+source,headers={'Range':'bytes=0-127'})
                assert track.status==206 and len(track.body())==128
                assert context.request.get(endpoint+'/audio?part=2').status==403
                assert context.request.get(practice+'/audio?part=1').status==403
                # Oral-response options are numbers only; no spoken choices or transcript in the UI payload.
                oral=[q for q in data['stage']['questions'] if q['groupId'].endswith('-3') or q['groupId'].endswith('-4')]
                assert all(q['options']==['1','2','3'] for q in oral)
                fits(page,'timed-listening-'+level.lower())
            answers=fixture('answers',attempt)
            if level=='N4' and index==0:
                target=data['stage']['questions'][0]
                answers['responses'][target['id']]=next(value for value in target['options'] if value!=answers['responses'][target['id']])
            response=context.request.patch(endpoint,headers=ORIGIN,data={'revision':data['revision'],'stageId':stage_id,'responses':answers['responses'],'flags':[]})
            assert response.ok,response.text()
            fixture('deadline',attempt)
        done=context.request.get(endpoint).json()
        earned=count if level=='N5' else count-1
        assert done['finishedAt'] and done['report']['points']=={'total':count,'earned':earned}
        assert [s['total'] for s in done['report']['sections']]==stage_counts
        page.goto(BASE+'/exams/attempts/'+attempt)
        expect(page.locator('.jlpt-results')).to_be_visible()
        page.get_by_role('button',name='Бүгд',exact=True).click()
        expect(page.locator('.jlpt-results .exam-review')).to_have_count(count)
        fits(page,'results-'+level.lower())
        if level=='N4':
            expect(page.locator('.jlpt-recommend a')).to_have_count(1)
            page.locator('.jlpt-recommend a').click()
            expect(page.locator('.practice-sections button[aria-current=true]')).to_contain_text('漢字の読み')
        assert context.request.get(practice).ok
        other=browser.new_context()
        assert other.request.get(endpoint).status==401
        other.close()
    assert not errors,errors
    browser.close()
print('JLPT: N5/N4 discovery, purchase, practice/audio, saved timed sections, no key leakage, raw marking and responsive views passed.')
