import os,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/')
ARCHIVE=json.loads((ROOT/'assets/papers/english-archive.json').read_text(encoding='utf-8'))
ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    archive_requests=[]
    def block(route):archive_requests.append(route.request.url);route.abort()
    context.route('**://help.eec.mn/**',block)
    context.route('**://highschool.num.edu.mn/**',block)
    page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/exams');page.locator('.english-archive-entry a').click()
    expect(page).to_have_url(BASE+'/exams/eec-english')
    expect(page.locator('.english-year')).to_have_count(9)
    expect(page.locator('.english-variation')).to_have_count(37)
    for excluded in ARCHIVE['excluded']:
        for year in excluded['years']:assert page.locator('#year-'+str(year)).count()==0
    for theme in ['light','dark']:
        for width in [1440,390,320]:
            page.set_viewport_size({'width':width,'height':1000});page.evaluate('theme=>document.documentElement.dataset.theme=theme',theme)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.screenshot(path=str(ART/f'english-library-{theme}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    # Every published asset must be in the real build, not merely present on disk.
    for image in ARCHIVE['files']:
        response=context.request.get(BASE+image['url']);assert response.status==200,(image['url'],response.status)
        assert response.headers.get('content-type','').startswith('image/jpeg')
        assert hashlib.sha256(response.body()).hexdigest()==image['sha256']
    reviewed_years=set()
    for paper in ARCHIVE['papers']:
        url=BASE+'/exams/eec-english/'+paper['slug'];page.goto(url);page.wait_for_load_state('networkidle')
        expect(page.locator('h1')).to_have_text(f"{paper['year']} · Англи хэл · {paper['variant']} хувилбар")
        image=page.locator('.english-page img');page.wait_for_function("document.querySelector('.english-page img')?.naturalWidth>500")
        assert image.get_attribute('src')==paper['pages'][0]
        selector=page.get_by_label('Материалын хуудас',exact=True)
        expect(selector.locator('option')).to_have_count(len(paper['pages']))
        selector.select_option(str(len(paper['pages'])-1));page.wait_for_function("document.querySelector('.english-page img')?.naturalWidth>500")
        assert image.get_attribute('src')==paper['pages'][-1]
        expect(page.get_by_role('button',name='Дараах хуудас',exact=True)).to_be_disabled()
        page.get_by_role('button',name='Хариуны түлхүүр',exact=True).click()
        expect(page.get_by_role('status')).to_contain_text(paper['variant']+' хувилбарын баганыг')
        expect(selector.locator('option')).to_have_count(len(paper['keyPages']))
        for i,key in enumerate(paper['keyPages']):
            selector.select_option(str(i));page.wait_for_function("document.querySelector('.english-page img')?.naturalWidth>500")
            assert image.get_attribute('src')==key
        if paper['year'] not in reviewed_years:
            reviewed_years.add(paper['year']);page.screenshot(path=str(ART/f"english-key-{paper['year']}.png"),full_page=True)
        page.get_by_role('button',name='Сэдэв',exact=True).click()
        expect(selector).to_have_value(str(len(paper['pages'])-1))
        assert image.get_attribute('src')==paper['pages'][-1]
        if paper['variant'] in ['E','F','H','I']:page.screenshot(path=str(ART/f"english-boundary-{paper['year']}-{paper['variant']}.png"),full_page=True)
    for theme in ['light','dark']:
        for width in [390,320]:
            page.set_viewport_size({'width':width,'height':900});page.evaluate('theme=>document.documentElement.dataset.theme=theme',theme)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.screenshot(path=str(ART/f'english-reader-{theme}-{width}.png'),full_page=True)
    for slug in ['eec-english-2021-a','eec-english-2025-a','eec-english-2007-d','eec-english-2009-a']:
        assert page.goto(BASE+'/exams/eec-english/'+slug).status==404
    page.goto(BASE+'/programs/entrance');expect(page.locator('.english-archive-entry a')).to_have_attribute('href','/exams/eec-english')
    assert not errors,errors
    assert not archive_requests,archive_requests
    browser.close()
print('PASS: English archive 37 matched variants / 9 years, all 218 same-origin assets and hashes, source/key viewers, excluded 404s, source outage, responsive themes and program/library discovery.')
