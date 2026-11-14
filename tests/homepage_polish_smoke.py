"""Homepage motion/accessibility, Speaking discovery/return path and Google-link recovery UI."""
import json
import os
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3001').rstrip('/')
ART=Path(__file__).resolve().parent.parent/'artifacts'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for theme in ['light','dark']:
        context=browser.new_context(color_scheme=theme,viewport={'width':1440,'height':950})
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script("window.motionLog=[];const animate=Element.prototype.animate;Element.prototype.animate=function(...args){window.motionLog.push({className:this.className,keyframes:args[0]});return animate.apply(this,args)}")
        page.route('**/api/labs/ielts-speaking/warm',lambda route:route.fulfill(status=200,body='{}'))
        page.goto(BASE);page.wait_for_load_state('networkidle')
        expect(page.locator('.home-sketches').first).to_be_visible()
        expect(page.locator('.education-backdrop svg:visible')).to_have_count(1)
        expect(page.locator('.home-page .program-card')).to_have_count(5)
        expect(page.locator('.home-program-detail')).to_have_count(5)
        expect(page.locator('.home-plan-card')).to_have_count(3)
        expect(page.locator('.home-plan-price strong')).to_have_text(['₮0','₮40,000','₮60,000'])
        expect(page.locator('.home-plan-card h3')).to_have_text(['Үнэгүй','ЭЕШ','Гадаад хэл'])
        expect(page.locator('#program-jlpt')).to_contain_text('Гадаад хэл · сард 15 mock')
        expect(page.locator('#program-entrance')).to_contain_text('ЭЕШ · хязгааргүй')
        expect(page.locator('.home-lab-card')).to_have_count(4)
        expect(page.locator('.home-feature-grid > article')).to_have_count(4)
        expect(page.locator('.home-program-image img')).to_have_count(5)
        expect(page.locator('.home-demo-screen video')).to_have_count(3)
        expect(page.locator('.home-page')).to_have_class('container home-page home-art-editorial')
        assert page.locator('.home-demo-screen video').evaluate_all("videos => videos.every(video => video.loop && video.muted && !video.controls && video.hasAttribute('playsinline') && video.tabIndex === -1)")
        for video in page.locator('.home-demo-screen video').all():
            video.scroll_into_view_if_needed()
            page.wait_for_function("src => { const video = [...document.querySelectorAll('video')].find(v => v.querySelector('source').getAttribute('src') === src); return video && !video.paused && video.currentTime > .1 && video.videoWidth === 1440 && !video.error; }", arg=video.locator('source').get_attribute('src'))
            video.evaluate("video => { video.currentTime = video.duration - .15; }")
            page.wait_for_function("src => { const video = [...document.querySelectorAll('video')].find(v => v.querySelector('source').getAttribute('src') === src); return video && !video.paused && video.currentTime < 2; }", arg=video.locator('source').get_attribute('src'))
        expect(page.locator('.site-header nav a[href="/#programs"]')).to_be_visible()
        first_question=page.locator('.home-question-list details').first
        first_question.locator('summary').click()
        expect(first_question).to_have_attribute('open','')
        expect(first_question.locator('p')).to_be_visible()
        first_question.locator('summary').click()
        page.locator('.program-card[href="#program-jlpt"]').click()
        expect(page).to_have_url(BASE+'/#program-jlpt')
        expect(page.locator('#program-jlpt a')).to_have_attribute('href','/exams/jlpt')
        section=page.locator('.home-lab-card[href="/labs/ielts-speaking"]')
        page.locator('.home-workshop-photo').scroll_into_view_if_needed()
        page.wait_for_function("window.motionLog.some(event => event.className === 'home-workshop-photo' && event.keyframes[0].opacity === 0 && event.keyframes[1].opacity === 1)")
        page.wait_for_function("document.querySelector('.home-workshop-photo').getAnimations().length === 0")
        expect(section).to_be_visible()
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(ART/f'home-polish-{theme}-desktop.png'),full_page=True)
        assert not errors, errors
        section.click();expect(page).to_have_url(BASE+'/labs/ielts-speaking')
        page.locator('.sl-signin a').click();expect(page).to_have_url(BASE+'/login?next=%2Flabs%2Fielts-speaking')
        # Real local email sign-up: the successful redirect returns to Speaking, not dashboard.
        page.locator('.auth-switch a[href^="/register"]').click()
        page.get_by_label('Нэр',exact=True).fill('Homepage QA')
        page.get_by_label('Имэйл',exact=True).fill('qa-home-'+uuid4().hex[:12]+'@example.invalid')
        page.get_by_label('Нууц үг',exact=True).fill('Homepage-Test-'+uuid4().hex)
        page.get_by_role('button',name='Бүртгүүлэх',exact=True).click()
        expect(page).to_have_url(BASE+'/labs/ielts-speaking',timeout=20000)
        page.goto(BASE+'/workspace/profile');page.get_by_role('tab',name='Аюулгүй байдал',exact=True).click();expect(page.get_by_role('button',name='Google холбох',exact=True)).to_be_visible()
        # UI failure recovery uses a mocked link response; OAuth policy has separate in-memory tests.
        page.route('**/api/auth/link-social',lambda route:route.fulfill(status=400,content_type='application/json',body=json.dumps({'message':'Unable to link','code':'TEST_FAILURE'})))
        page.get_by_role('button',name='Google холбох',exact=True).click()
        expect(page.locator('.google-connection [role="alert"]')).to_be_visible()
        expect(page.get_by_role('button',name='Google холбох',exact=True)).to_be_enabled()
        context.close()
        context=browser.new_context(color_scheme=theme,reduced_motion='reduce')
        page=context.new_page()
        for width in [390,320]:
            page.set_viewport_size({'width':width,'height':844})
            for route in ['/', '/programs/ielts','/login?error=account_not_linked','/workspace/profile?error=email_does_not_match']:
                page.goto(BASE+route);page.wait_for_load_state('networkidle')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(theme,width,route)
                if route=='/':
                    assert page.evaluate('document.getAnimations().length')==0
                    assert page.locator('video').evaluate_all('videos => videos.every(video => video.paused && !video.autoplay)')
                    page.locator('video').first.scroll_into_view_if_needed()
                    assert page.locator('video').evaluate_all('videos => videos.every(video => video.paused)')
                    page.evaluate('window.scrollTo(0,0)')
                    page.screenshot(path=str(ART/f'home-polish-{theme}-{width}.png'),full_page=True)
                if route=='/login?error=account_not_linked':
                    expect(page.locator('.auth-card .error-message[role="alert"]')).to_contain_text('Google холбох')
                    expect(page.locator('.auth-card a[href="/verify-email"]')).to_have_count(0)
        page.goto(BASE+'/programs/ielts');expect(page.locator('.speaking-invitation a')).to_have_attribute('href','/labs/ielts-speaking')
        context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page();page.goto(BASE)
    expect(page.locator('.hero h1')).to_be_visible();expect(page.locator('.home-lab-card[href="/labs/ielts-speaking"]')).to_be_visible()
    expect(page.locator('.home-demo-screen video')).to_have_count(3)
    page.locator('.home-program-more summary').first.click()
    expect(page.locator('.home-program-more dl').first).to_be_visible()
    expect(page.locator('.home-program-detail')).to_have_count(5)
    expect(page.locator('.home-plan-card')).to_have_count(3)
    assert page.locator('[data-reveal]').count()>=8
    context.close();browser.close()
print('PASS: editorial homepage, three automatic muted loops without controls, reduced motion/no JS, themes/mobile, Speaking discovery/login return and Google linking UI recovery (mocked failure).')
