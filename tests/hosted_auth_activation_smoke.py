"""Canonical hosted auth activation: no real mail or Google token exchange."""
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright,expect
BASE='https://education-platform-seven-neon.vercel.app';ORIGIN={'Origin':BASE}
ART=Path(__file__).resolve().parent.parent/'artifacts'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1440,'height':1000},color_scheme='dark')
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/login');page.wait_for_load_state('networkidle')
 expect(page.get_by_role('button',name='Google-ээр үргэлжлүүлэх',exact=True)).to_be_visible()
 expect(page.locator('.demo-account-button')).to_have_count(5)
 for route in ['/forgot-password','/verify-email']:
  page.goto(BASE+route);page.wait_for_load_state('networkidle')
  expect(page.locator('.auth-form button[type="submit"]')).to_be_enabled()
 email='qa-hosted-auth-'+uuid4().hex[:12]+'@example.invalid';password='Hosted-Auth-QA-'+uuid4().hex
 signup=context.request.post(BASE+'/api/auth/sign-up/email',headers=ORIGIN,data={'name':'Hosted Auth QA','email':email,'password':password})
 assert signup.status==200,signup.status
 assert signup.json()['token'] is None
 assert context.request.get(BASE+'/api/auth/get-session').json() is None
 denied=context.request.post(BASE+'/api/auth/sign-in/email',headers=ORIGIN,data={'email':email,'password':password})
 assert denied.status==403 and denied.json()['code']=='EMAIL_NOT_VERIFIED'
 assert context.request.post(BASE+'/api/auth/send-verification-email',headers={'Origin':'https://untrusted.invalid'},data={'email':email,'callbackURL':'/profile'}).status==403
 assert context.request.post(BASE+'/api/auth/link-social',headers=ORIGIN,data={'provider':'google','callbackURL':'/profile'}).status==401
 social=context.request.post(BASE+'/api/auth/sign-in/social',headers=ORIGIN,data={'provider':'google','callbackURL':'/dashboard','errorCallbackURL':'/login','disableRedirect':True})
 assert social.status==200,social.status
 query=parse_qs(urlparse(social.json()['url']).query)
 assert urlparse(social.json()['url']).hostname=='accounts.google.com'
 assert query['redirect_uri']==[BASE+'/api/auth/callback/google']
 assert query.get('state') and query.get('code_challenge')
 assert context.request.post(BASE+'/api/auth/sign-in/social',headers=ORIGIN,data={'provider':'google','callbackURL':'https://untrusted.invalid','disableRedirect':True}).status==403
 assert context.request.get(BASE+'/api/auth/callback/google?state=invalid&code=unused',max_redirects=0).status in [302,400,401,403]
 # Visit the provider authorization page to detect a rejected redirect URI, without signing in.
 google=browser.new_context();provider=google.new_page()
 provider.goto(social.json()['url']);provider.wait_for_load_state('domcontentloaded')
 body=provider.locator('body').inner_text()
 callback_rejected='redirect_uri_mismatch' in body or 'invalid_client' in body
 print('Google authorization page: '+('provider rejected hosted callback/client' if callback_rejected else 'no callback/client rejection displayed; consent/token exchange not completed'))
 provider.screenshot(path=str(ART/'hosted-google-authorization.png'),full_page=True);google.close()
 for theme in ['light','dark']:
  page.emulate_media(color_scheme=theme)
  for width in [390,320]:
   page.set_viewport_size({'width':width,'height':844})
   for route in ['/login','/forgot-password','/verify-email']:
    page.goto(BASE+route);page.wait_for_load_state('networkidle')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(route,theme,width)
    if width==320:page.screenshot(path=str(ART/('hosted-auth-'+route[1:]+'-'+theme+'-320.png')),full_page=True)
 assert not errors,errors
 browser.close()
 assert not callback_rejected,'Google OAuth client needs the canonical hosted callback configured in Google Cloud'
print('PASS: hosted Google button/state/PKCE/callback guards, mandatory personal email verification, no unverified session, recovery UI, shared-demo discovery, origin protections and mobile/themes. No email sent to reserved QA addresses; no Google login completed.')
