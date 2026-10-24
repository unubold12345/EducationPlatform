"""Real local Better Auth flows; mail captured in guarded local outbox, no real inbox/OAuth login claim."""
import json
import re
import subprocess
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent
BASE='http://localhost:3002'
NORMAL='http://localhost:3001'
EMAIL='qa-auth-recovery-'+uuid4().hex[:12]+'@example.invalid'
PASSWORD='Recovery-Test-'+uuid4().hex
NEW_PASSWORD='Recovery-New-'+uuid4().hex
ART=ROOT/'artifacts'; OUTBOX=ART/'auth-outbox/messages.jsonl'

def letters(address):
    if not OUTBOX.exists():return []
    return [json.loads(line) for line in OUTBOX.read_text(encoding='utf-8').splitlines() if json.loads(line)['to']==address]

def wait_letter(address,kind,after=0):
    deadline=time.monotonic()+20
    while time.monotonic()<deadline:
        found=[m for m in letters(address) if m['kind']==kind]
        if len(found)>after:return found[-1]
        time.sleep(.1)
    raise AssertionError('Expected local authentication email not captured')

def link(message):return re.search(r'https?://[^\s]+',message['text']).group(0)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},color_scheme='dark')
    origin={'Origin':BASE}
    assert context.request.post(BASE+'/api/auth/link-social',headers=origin,data={'provider':'google','callbackURL':'/profile'}).status==401
    # Existing unverified sessions from before verification activation cannot read protected pages/APIs.
    created=context.request.post(NORMAL+'/api/auth/sign-up/email',headers={'Origin':NORMAL},data={'name':'Recovery QA','email':EMAIL,'password':PASSWORD})
    assert created.status==200
    assert context.request.post(BASE+'/api/attempts',headers=origin,data={}).status==403
    page=context.new_page();page.goto(BASE+'/profile');expect(page).to_have_url(BASE+'/login?next=%2Fprofile')
    context.clear_cookies()
    blocked=context.request.post(BASE+'/api/auth/sign-in/email',headers=origin,data={'email':EMAIL,'password':PASSWORD})
    assert blocked.status==403 and blocked.json()['code']=='EMAIL_NOT_VERIFIED'
    wrong=context.request.post(BASE+'/api/auth/sign-in/email',headers=origin,data={'email':EMAIL,'password':'Wrong-password-123'})
    assert wrong.status==401
    second='qa-auth-recovery-'+uuid4().hex[:12]+'@example.invalid'
    signup=context.request.post(BASE+'/api/auth/sign-up/email',headers=origin,data={'name':'New verified QA','email':second,'password':PASSWORD,'callbackURL':'/verify-email?verified=1'})
    assert signup.status==200 and signup.json()['token'] is None
    unsigned=context.request.get(BASE+'/api/auth/get-session')
    assert unsigned.status==200 and unsigned.json() is None, {'status':unsigned.status,'hasSession':bool(unsigned.json().get('user')) if isinstance(unsigned.json(),dict) else False}
    wait_letter(second,'verify')
    # UI resend is explicit; malformed origins/callbacks never dispatch mail.
    assert context.request.post(BASE+'/api/auth/send-verification-email',headers={'Origin':'https://untrusted.invalid'},data={'email':EMAIL,'callbackURL':'/profile'}).status==403
    assert context.request.post(BASE+'/api/auth/send-verification-email',headers=origin,data={'email':EMAIL,'callbackURL':'/profile','padding':'x'*33000}).status==413
    page.goto(BASE+'/verify-email');page.get_by_label('Имэйл',exact=True).fill(EMAIL);page.get_by_role('button',name='Холбоос авах',exact=True).click()
    expect(page.locator('.form-success')).to_be_visible()
    verification=link(wait_letter(EMAIL,'verify'))
    invalid=verification.replace('token=','token=changed')
    rejected=context.request.get(invalid,max_redirects=0);assert rejected.status in [302,400,401,403]
    page.goto(verification);expect(page).to_have_url(BASE+'/verify-email?verified=1')
    page.goto(BASE+'/login');page.get_by_label('Имэйл',exact=True).fill(EMAIL);page.get_by_label('Нууц үг',exact=True).fill(PASSWORD);page.get_by_role('button',name='Нэвтрэх',exact=True).click()
    expect(page).to_have_url(BASE+'/dashboard')
    session=context.request.get(BASE+'/api/auth/get-session').json();assert session['user']['emailVerified'] is True
    assert context.request.post(BASE+'/api/auth/link-social',headers={'Origin':'https://untrusted.invalid'},data={'provider':'google','callbackURL':'/profile'}).status==403
    linked=context.request.post(BASE+'/api/auth/link-social',headers=origin,data={'provider':'google','callbackURL':'/profile','errorCallbackURL':'/profile'})
    assert linked.status==200 and urlparse(linked.json()['url']).hostname=='accounts.google.com'
    # Unknown and known reset requests have the same generic response.
    unknown=context.request.post(BASE+'/api/auth/request-password-reset',headers=origin,data={'email':'missing-'+uuid4().hex+'@example.invalid','redirectTo':'/reset-password'})
    before=len([m for m in letters(EMAIL) if m['kind']=='reset'])
    known=context.request.post(BASE+'/api/auth/request-password-reset',headers=origin,data={'email':EMAIL,'redirectTo':'/reset-password'})
    assert unknown.status==known.status==200 and unknown.json()==known.json()
    reset_link=link(wait_letter(EMAIL,'reset',before))
    assert context.request.post(BASE+'/api/auth/request-password-reset',headers=origin,data={'email':EMAIL,'redirectTo':'https://untrusted.invalid/reset'}).status==403
    reset_page=context.new_page();reset_page.goto(reset_link)
    token=parse_qs(urlparse(reset_page.url).query)['token'][0]
    assert context.request.post(BASE+'/api/auth/reset-password',headers=origin,data={'token':token,'newPassword':'short'}).status==400
    reset_page.get_by_label('Шинэ нууц үг',exact=True).fill(NEW_PASSWORD)
    reset_page.get_by_label('Шинэ нууц үг давтах',exact=True).fill(PASSWORD)
    reset_page.get_by_role('button',name='Нууц үг хадгалах',exact=True).click();expect(reset_page.locator('.error-message')).to_contain_text('таарахгүй')
    reset_page.get_by_label('Шинэ нууц үг давтах',exact=True).fill(NEW_PASSWORD)
    reset_page.screenshot(path=str(ART/'auth-reset-desktop.png'),full_page=True)
    reset_page.get_by_role('button',name='Нууц үг хадгалах',exact=True).click();expect(reset_page.locator('.form-success')).to_be_visible()
    unsigned=context.request.get(BASE+'/api/auth/get-session')
    assert unsigned.status==200 and unsigned.json() is None, {'status':unsigned.status,'hasSession':bool(unsigned.json().get('user')) if isinstance(unsigned.json(),dict) else False}
    assert context.request.post(BASE+'/api/auth/reset-password',headers=origin,data={'token':token,'newPassword':PASSWORD}).status==400
    assert context.request.post(BASE+'/api/auth/sign-in/email',headers=origin,data={'email':EMAIL,'password':PASSWORD}).status==401
    assert context.request.post(BASE+'/api/auth/sign-in/email',headers=origin,data={'email':EMAIL,'password':NEW_PASSWORD}).status==200
    # Only a trusted local fixture advances this disposable reset-token deadline.
    count=len([m for m in letters(EMAIL) if m['kind']=='reset'])
    assert context.request.post(BASE+'/api/auth/request-password-reset',headers=origin,data={'email':EMAIL,'redirectTo':'/reset-password'}).status==200
    expired_link=link(wait_letter(EMAIL,'reset',count));expired_token=urlparse(expired_link).path.rsplit('/',1)[1]
    fixture=subprocess.run(['node','tests/auth_fixture.mjs'],cwd=ROOT,input=json.dumps({'action':'expire-reset','email':EMAIL,'token':expired_token}),capture_output=True,text=True)
    assert fixture.returncode==0,'Local QA expiry fixture failed'
    assert context.request.post(BASE+'/api/auth/reset-password',headers=origin,data={'token':expired_token,'newPassword':PASSWORD}).status==400
    # OAuth authorization shape/state/PKCE are real; credentials are synthetic and no Google token exchange occurs.
    context.clear_cookies()
    social=context.request.post(BASE+'/api/auth/sign-in/social',headers=origin,data={'provider':'google','callbackURL':'/dashboard','disableRedirect':True})
    assert social.status==200
    authorization=urlparse(social.json()['url']);query=parse_qs(authorization.query)
    assert authorization.hostname=='accounts.google.com' and query['redirect_uri']==[BASE+'/api/auth/callback/google']
    assert query.get('state') and query.get('code_challenge')
    assert context.request.post(BASE+'/api/auth/sign-in/social',headers=origin,data={'provider':'google','callbackURL':'https://untrusted.invalid','disableRedirect':True}).status==403
    forged=context.request.get(BASE+'/api/auth/callback/google?state=invalid&code=unused',max_redirects=0)
    assert forged.status in [302,400,401,403] and context.request.get(BASE+'/api/auth/get-session').json() is None
    for theme in ['light','dark']:
        page.emulate_media(color_scheme=theme)
        for route in ['/forgot-password','/verify-email','/reset-password','/login','/register']:
            page.goto(BASE+route);page.wait_for_load_state('networkidle')
            for width in [390,320]:
                page.set_viewport_size({'width':width,'height':844})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(route,width)
                if route=='/forgot-password' and width==320:page.screenshot(path=str(ART/('auth-forgot-'+theme+'-320.png')),full_page=True)
    assert context.request.post(BASE+'/api/auth/request-password-reset',headers={'Origin':'https://untrusted.invalid'},data={'email':EMAIL,'redirectTo':'/reset-password'}).status==403
    limited=[context.request.post(BASE+'/api/auth/request-password-reset',headers=origin,data={'email':'missing-'+uuid4().hex+'@example.invalid','redirectTo':'/reset-password'}).status for _ in range(7)]
    assert 429 in limited
    browser.close()
print('PASS: real local email verification/session enforcement, reset UI, non-enumeration, origin/callback/body guards, password bounds, one-use/expired reset tokens, session revocation, rate limits, Google OAuth state/PKCE and forged-state rejection, 320/390px themes. Mail is local outbox; no real Google login or inbox delivery claimed.')
