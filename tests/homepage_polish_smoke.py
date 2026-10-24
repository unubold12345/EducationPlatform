"""Homepage motion/accessibility, Speaking discovery/return path and Google-link recovery UI."""
import json
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect
BASE='http://localhost:3001'
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
        section=page.locator('.speaking-invitation')
        page.evaluate("window.scrollTo(0, document.querySelector('.speaking-invitation').offsetTop - 700)")
        page.wait_for_function("window.motionLog.some(event => event.className === 'speaking-invitation' && event.keyframes[0].opacity === 0 && event.keyframes[1].opacity === 1)")
        page.wait_for_function("document.querySelector('.speaking-invitation').getAnimations().length === 0")
        expect(section).to_be_visible()
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(ART/f'home-polish-{theme}-desktop.png'),full_page=True)
        assert not errors, errors
        section.get_by_role('link').click();expect(page).to_have_url(BASE+'/labs/ielts-speaking')
        page.locator('.sl-signin a').click();expect(page).to_have_url(BASE+'/login?next=%2Flabs%2Fielts-speaking')
        # Real local email sign-up: the successful redirect returns to Speaking, not dashboard.
        page.locator('.auth-switch a[href^="/register"]').click()
        page.get_by_label('Нэр',exact=True).fill('Homepage QA')
        page.get_by_label('Имэйл',exact=True).fill('qa-home-'+uuid4().hex[:12]+'@example.invalid')
        page.get_by_label('Нууц үг',exact=True).fill('Homepage-Test-'+uuid4().hex)
        page.get_by_role('button',name='Бүртгүүлэх',exact=True).click()
        expect(page).to_have_url(BASE+'/labs/ielts-speaking',timeout=20000)
        page.goto(BASE+'/profile');expect(page.get_by_role('button',name='Google холбох',exact=True)).to_be_visible()
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
            for route in ['/', '/programs/ielts','/login?error=account_not_linked','/profile?error=email_does_not_match']:
                page.goto(BASE+route);page.wait_for_load_state('networkidle')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(theme,width,route)
                if route=='/':
                    assert page.evaluate('document.getAnimations().length')==0
                    page.screenshot(path=str(ART/f'home-polish-{theme}-{width}.png'),full_page=True)
                if route=='/login?error=account_not_linked':
                    expect(page.locator('.auth-card .error-message[role="alert"]')).to_contain_text('Google холбох')
                    expect(page.locator('.auth-card .error-message[role="alert"] a[href="/verify-email"]')).to_be_visible()
        page.goto(BASE+'/programs/ielts');expect(page.locator('.speaking-invitation a')).to_have_attribute('href','/labs/ielts-speaking')
        context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page();page.goto(BASE)
    expect(page.locator('.hero h1')).to_be_visible();expect(page.locator('.speaking-invitation')).to_be_visible()
    assert page.locator('[data-reveal]').count()>=8
    context.close();browser.close()
print('PASS: homepage motion, reduced motion/no JS, themes/mobile, Speaking discovery/login return and Google linking UI recovery (mocked failure).')
