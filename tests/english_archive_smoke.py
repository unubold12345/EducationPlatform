import os,json,hashlib,subprocess
from pathlib import Path
from uuid import uuid4
from datetime import datetime
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/');ORIGIN={'Origin':BASE}
ARCHIVE=json.loads((ROOT/'assets/papers/english-archive.json').read_text(encoding='utf-8'))
KEYS=json.loads((ROOT/'src/modules/papers/english-keys.json').read_text(encoding='utf-8'))
STRUCTURES=json.loads((ROOT/'src/modules/papers/english-structure.json').read_text(encoding='utf-8'))
ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    requests=[]
    def block(route):requests.append(route.request.url);route.abort()
    context.route('**://help.eec.mn/**',block);context.route('**://highschool.num.edu.mn/**',block)
    page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/exams');page.locator('.english-archive-entry a').click()
    expect(page.locator('.english-year')).to_have_count(9);expect(page.locator('.english-variation')).to_have_count(37)
    for theme in ['light','dark']:
        for width in [1440,390,320]:
            page.set_viewport_size({'width':width,'height':1000});page.evaluate('theme=>document.documentElement.dataset.theme=theme',theme)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.screenshot(path=str(ART/f'english-exams-library-{theme}-{width}.png'),full_page=True)
    for image in ARCHIVE['files']:
        response=context.request.get(BASE+image['url']);assert response.status==200,(image['url'],response.status)
        assert hashlib.sha256(response.body()).hexdigest()==image['sha256']
    slug='eec-english-2020-a'
    page.goto(BASE+'/exams/eec-english/'+slug)
    expect(page.locator('.official-facts')).to_contain_text('80')
    assert context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':slug}).status==401
    # Sign-in/registration preserves the English briefing route through the real form.
    page.get_by_role('link',name='Нэвтэрч эхлэх →').click()
    expect(page).to_have_url(BASE+'/login?next=%2Fexams%2F'+slug)
    page.get_by_role('link',name='Бүртгүүлэх',exact=True).click();page.mouse.move(0,0)
    page.get_by_label('Нэр',exact=True).fill('English QA')
    page.get_by_label('Имэйл',exact=True).fill('qa-english-'+uuid4().hex[:12]+'@example.invalid')
    page.get_by_label('Нууц үг',exact=True).fill('Local-English-'+uuid4().hex)
    page.get_by_role('button',name='Бүртгүүлэх',exact=True).click();expect(page).to_have_url(BASE+'/exams/'+slug,timeout=20000)
    assert context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':slug}).status==402
    page.get_by_role('link',name='Шалгалтын эрх авах · ₮10,000').click()
    expect(page.locator('.checkout-summary')).to_contain_text('46 сонгох + 4 нөхөх · 80 минут')
    page.get_by_role('button',name='Туршилтаар төлөх',exact=False).click()
    expect(page.get_by_role('heading',name='Эрх нээгдсэн')).to_be_visible()
    assert context.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':'eec-english-2020-b'}).status==402
    other=browser.new_context();other.route('**://help.eec.mn/**',block);other.route('**://highschool.num.edu.mn/**',block)
    registered=other.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'English Plan QA','email':'qa-english-'+uuid4().hex[:12]+'@example.invalid','password':'Local-English-'+uuid4().hex});assert registered.ok,registered.status
    order=other.request.post(BASE+'/api/subscriptions/orders',headers=ORIGIN,data={'program':'entrance'}).json()
    assert other.request.post(BASE+'/api/subscriptions/orders/'+order['id']+'/confirm',headers=ORIGIN,data={'decision':'success'}).ok
    reader=other.new_page();reader.on('pageerror',lambda error:errors.append(str(error)))
    for paper in ARCHIVE['papers']:
        slug=paper['slug'];key=KEYS[slug];structure=STRUCTURES[slug]
        response=other.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':slug});assert response.ok,(slug,response.status,response.text())
        id=response.json()['id'];endpoint=BASE+'/api/paper-attempts/'+id
        initial=other.request.get(endpoint).json()
        assert initial['report'] is None and initial['keySources']==[]
        assert 'key' not in initial and 'choices' not in json.dumps(initial) and key['version'] not in json.dumps(initial)
        assert 4790<=(datetime.fromisoformat(initial['deadline'])-datetime.fromisoformat(initial['serverNow'])).total_seconds()<=4800
        assert other.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':slug}).json()['id']==id
        assert context.request.get(endpoint).status==404
        reader.goto(BASE+'/papers/attempts/'+id);reader.wait_for_load_state('networkidle')
        expect(reader.locator('.paper-toolbar h1')).to_have_text(f"ЭЕШ {paper['year']} · Англи хэл · {paper['variant']} хувилбар")
        expect(reader.locator('.paper-choice')).to_have_count(len(key['choices']))
        expect(reader.locator('.paper-fill')).to_have_count(len(key['fills']))
        assert reader.locator('.math-scratchpad').count()==0
        assert key['version'] not in reader.content() and '"choices":' not in reader.content()
        for n in [1,len(paper['pages'])]:
            reader.get_by_label('Албан материалын хуудас',exact=True).select_option(str(n))
            reader.wait_for_function("document.querySelector('.official-page-image')?.naturalWidth>500")
            assert reader.locator('.official-page-image').get_attribute('src')==paper['pages'][n-1]
        reader.get_by_label('1 · '+key['choices'][0],exact=True).check()
        if key['fills']:
            slot=next(s for s in structure['slots'] if s['kind']=='digits')
            reader.get_by_label(slot['id']+' · '+slot['cellLabels'][0],exact=True).fill(key['fills'][0]['digits'][0])
        expect(reader.get_by_role('status')).to_have_text('Бүх өөрчлөлт хадгалагдсан',timeout=15000)
        reader.reload();expect(reader.get_by_label('1 · '+key['choices'][0],exact=True)).to_be_checked()
        state=other.request.get(endpoint).json();assert state['deadline']==initial['deadline']
        assert other.request.put(endpoint,headers=ORIGIN,data={'revision':state['revision']-1,'responses':{},'submit':False}).status==409
        for bad in [{'1':'F'},{str(len(key['choices'])+1):'A'},{'2.9':'123'}]:
            assert other.request.put(endpoint,headers=ORIGIN,data={'revision':state['revision'],'responses':bad,'submit':False}).status==400
        assert other.request.put(endpoint,headers={'Origin':'https://untrusted.invalid'},data={}).status==403
        if slug in ['eec-english-2006-a','eec-english-2011-a','eec-english-2019-a','eec-english-2020-d']:
            for theme in ['light','dark']:
                for width in [1440,390,320]:
                    reader.set_viewport_size({'width':width,'height':900});reader.evaluate('theme=>document.documentElement.dataset.theme=theme',theme)
                    assert reader.evaluate('document.documentElement.scrollWidth<=innerWidth'),(slug,theme,width)
                    reader.screenshot(path=str(ART/f'english-sitting-{slug}-{theme}-{width}.png'),full_page=True)
        answers={str(i+1):a for i,a in enumerate(key['choices'])};answers.update({f['id']:f['digits'] for f in key['fills']})
        # One full sitting is completed through real UI controls and its final confirmation.
        if slug=='eec-english-2020-a':
            for i,a in enumerate(key['choices']):reader.get_by_label(f'{i+1} · {a}',exact=True).check()
            for f in key['fills']:
                slot=next(s for s in structure['slots'] if s['id']==f['id'])
                for label,digit in zip(slot['cellLabels'],f['digits']):reader.get_by_label(f['id']+' · '+label,exact=True).fill(digit)
            expect(reader.get_by_role('status')).to_have_text('Бүх өөрчлөлт хадгалагдсан',timeout=15000)
            reader.on('dialog',lambda dialog:dialog.accept());reader.get_by_role('button',name='Шалгалтыг эцэслэн илгээх',exact=True).click()
            expect(reader.locator('.paper-result h2')).to_have_text('100 / 100',timeout=15000)
            result=other.request.get(endpoint).json()
        else:
            result=other.request.put(endpoint,headers=ORIGIN,data={'revision':state['revision'],'responses':answers,'submit':True}).json()
        assert result['status']=='SUBMITTED' and result['report']['score']==structure['totalMarks'],(slug,result)
        assert result['report']['total']==structure['totalMarks'] and result['keySources']==paper['keyPages']
        assert other.request.put(endpoint,headers=ORIGIN,data={'revision':0,'responses':{},'submit':True}).json()['report']==result['report']
        if slug=='eec-english-2020-d':
            reader.reload();expect(reader.locator('.paper-result h2')).to_have_text('99 / 99');expect(reader.locator('.paper-result')).to_contain_text('e17')
        if slug=='eec-english-2019-a':
            reader.reload();expect(reader.locator('.paper-result h2')).to_have_text('88 / 88')
    # Expiration finalizes saved responses, ignoring a late replacement payload.
    response=other.request.post(BASE+'/api/paper-attempts',headers=ORIGIN,data={'slug':'eec-english-2020-a'});id=response.json()['id'];endpoint=BASE+'/api/paper-attempts/'+id
    assert other.request.put(endpoint,headers=ORIGIN,data={'revision':0,'responses':{'1':'D'},'submit':False}).ok
    subprocess.check_output(['node','--import','tsx','tests/english_paper_fixture.mjs',id],cwd=ROOT)
    result=other.request.put(endpoint,headers=ORIGIN,data={'revision':1,'responses':{'1':'A'},'submit':True}).json()
    assert result['status']=='SUBMITTED' and result['report']['score']==1 and result['responses']=={'1':'D'}
    reader.goto(BASE+'/dashboard');expect(reader.get_by_role('heading',name='Миний албан материалын шалгалтууд')).to_be_visible()
    assert reader.locator('a[href="/papers/attempts/'+id+'"] h3').inner_text()=='ЭЕШ 2020 · Англи хэл · A хувилбар'
    for slug in ['eec-english-2021-a','eec-english-2025-a','eec-english-2007-d']:
        assert page.goto(BASE+'/exams/eec-english/'+slug).status==404
    assert not errors,errors
    assert not requests,requests
    browser.close()
print('PASS: all 37 English timed exams; 218 asset hashes; independent keys/layouts/scoring, checkout/plan access, ownership, autosave/resume, deadlines/expiry, stale edits, immutable reports, UI submission and desktop/mobile themes.')
