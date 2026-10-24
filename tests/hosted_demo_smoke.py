"""Owner-enabled shared demo security on the canonical hosted pilot only."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent
BASE='https://education-platform-seven-neon.vercel.app'
accounts=json.loads((ROOT/'src/data/demo-accounts.json').read_text(encoding='utf-8'))
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for index,account in enumerate(accounts):
  context=browser.new_context(viewport={'width':1440,'height':1000},color_scheme='dark')
  page=context.new_page();page.goto(BASE+'/login?next=%2Fprofile');page.wait_for_load_state('networkidle')
  expect(page.locator('.demo-account-button')).to_have_count(5)
  expect(page.locator('.demo-accounts .status')).to_have_text('SHARED DEMO')
  page.locator('.demo-account-button').nth(index).click()
  expect(page.get_by_label('Имэйл',exact=True)).to_have_value(account['email'])
  expect(page.get_by_label('Нууц үг',exact=True)).to_have_value(account['password'])
  if index==0:
   page.screenshot(path=str(ROOT/'artifacts/hosted-demo-desktop.png'),full_page=True)
   page.set_viewport_size({'width':320,'height':844})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(ROOT/'artifacts/hosted-demo-320.png'),full_page=True)
  page.get_by_role('button',name='Нэвтрэх',exact=True).click();expect(page).to_have_url(BASE+'/profile')
  expect(page.locator('.identity-body h2')).to_have_text(account['name'])
  expect(page.locator('.identity-badge')).to_have_text('Education суралцагч')
  expect(page.locator('.profile-email')).to_contain_text('бодит имэйл хүлээн авахгүй')
  assert context.request.get(BASE+'/api/admin').status==403
  assert context.request.post(BASE+'/api/auth/update-user',headers={'Origin':BASE},data={'name':'Must not change'}).status==403
  assert context.request.post(BASE+'/api/auth/change-password',headers={'Origin':BASE},data={'currentPassword':account['password'],'newPassword':'Must-not-change-123!','revokeOtherSessions':True}).status==403
  session=context.request.get(BASE+'/api/auth/get-session').json();assert session['user']['email']==account['email'] and not session['user']['emailVerified']
  page.get_by_role('button',name='Гарах',exact=True).click();expect(page).to_have_url(BASE+'/login')
  context.close()
 browser.close()
print('PASS: all five hosted shared learner logins, public-demo disclosure, fill buttons, profile identity, no false email verification, admin denial, server-side name/password mutation denial, logout and 320px layout')
