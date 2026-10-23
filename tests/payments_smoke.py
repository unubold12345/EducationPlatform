import os
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ORIGIN={"Origin":BASE}
ART=Path(__file__).resolve().parent.parent/"artifacts"
ART.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(color_scheme="dark",viewport={"width":1440,"height":1000})
    page=context.new_page();errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(BASE)
    expect(page.locator(".account-entry")).to_have_text("Нэвтрэх")
    expect(page.locator(".account-entry")).to_have_attribute("href","/login")
    assert context.request.post(BASE+"/api/mock-payments",headers=ORIGIN,data={"slug":"sat-full-01"}).status==401
    page.goto(BASE+"/exams")
    expect(page.locator(".exam-price strong")).to_have_text(["₮10,000","₮10,000","₮10,000"])
    page.goto(BASE+"/checkout/sat-full-01")
    expect(page).to_have_url(BASE+"/login?next=%2Fcheckout%2Fsat-full-01")
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    email="qa-pay-"+uuid4().hex[:12]+"@example.invalid"
    password="Local-Test-"+uuid4().hex
    page.get_by_label("Нэр",exact=True).fill("Payment QA")
    page.get_by_label("Имэйл",exact=True).fill(email)
    page.get_by_label("Нууц үг",exact=True).fill(password)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click()
    expect(page).to_have_url(BASE+"/checkout/sat-full-01",timeout=20000)
    expect(page.locator(".account-entry")).to_have_text("Миний профайл")
    expect(page.locator(".account-entry")).to_have_attribute("href","/profile")
    expect(page.locator(".mock-payment-notice")).to_contain_text("Бодит мөнгө суутгахгүй")
    assert page.locator(".checkout-panel input").count()==0
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402
    assert context.request.post(BASE+"/api/mock-payments",headers={"Origin":"https://untrusted.invalid"},data={"slug":"sat-full-01"}).status==403
    for forged in [{"slug":"sat-full-01","amountMnt":1},{"slug":"sat-full-01","userId":"other"},{"slug":"sat-full-01","status":"PAID"}]:
        assert context.request.post(BASE+"/api/mock-payments",headers=ORIGIN,data=forged).status==400
    assert context.request.post(BASE+"/api/mock-payments",headers=ORIGIN,data={"slug":"missing-exam"}).status==404
    # Concurrent order creation stays one order at the authoritative price.
    orders=page.evaluate("""async()=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/mock-payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:'sat-full-01'})});return {status:r.status,body:await r.json()}}))""")
    assert all(o["status"]==200 and o["body"]["amountMnt"]==10000 and o["body"]["status"]=="PENDING" for o in orders),orders
    order_id=orders[0]["body"]["id"]
    assert all(o["body"]["id"]==order_id for o in orders)
    page.get_by_role("button",name="Амжилтгүй төлбөр турших",exact=True).click()
    expect(page.locator(".mock-checkout-actions .error-message")).to_contain_text("Эрх нээгдээгүй")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402
    page.screenshot(path=str(ART/"mock-checkout-declined.png"),full_page=True)
    page.get_by_role("link",name="Одоохондоо болих",exact=False).click()
    expect(page.locator(".exam-purchase-gate")).to_be_visible()
    # Another account cannot confirm or receive the first account's order/access.
    other=browser.new_context()
    signup=other.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Other payment QA","email":"qa-pay-other-"+uuid4().hex[:10]+"@example.invalid","password":"Local-Test-"+uuid4().hex})
    assert signup.status==200
    assert other.request.post(BASE+"/api/mock-payments/"+order_id+"/confirm",headers=ORIGIN,data={"decision":"success"}).status==404
    assert other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402
    assert context.request.post(BASE+"/api/mock-payments/"+order_id+"/confirm",headers=ORIGIN,data={"decision":"success","amountMnt":1}).status==400
    # Two confirmations return the same paid receipt and preserve paidAt.
    receipts=page.evaluate("""async id=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/mock-payments/'+id+'/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:'success'})});return {status:r.status,body:await r.json()}}))""",order_id)
    assert all(r["status"]==200 and r["body"]["status"]=="PAID" and r["body"]["amountMnt"]==10000 for r in receipts),receipts
    assert receipts[0]["body"]["paidAt"]==receipts[1]["body"]["paidAt"]
    repeated=context.request.post(BASE+"/api/mock-payments/"+order_id+"/confirm",headers=ORIGIN,data={"decision":"decline"}).json()
    assert repeated["status"]=="PAID" and repeated["paidAt"]==receipts[0]["body"]["paidAt"]
    page.goto(BASE+"/checkout/sat-full-01")
    expect(page.locator(".checkout-success")).to_contain_text("Бодит мөнгө суутгаагүй")
    page.screenshot(path=str(ART/"mock-checkout-paid.png"),full_page=True)
    page.goto(BASE+"/dashboard")
    expect(page.locator(".learning-stats strong")).to_have_text(["0","0","0"])
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==402
    sat=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"})
    assert sat.status==200
    sat_id=sat.json()["id"]
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).json()["id"]==sat_id
    assert other.request.get(BASE+"/api/mock-attempts/"+sat_id).status==404
    page.goto(BASE+"/checkout/ielts-academic-01")
    page.get_by_role("button",name="Туршилтаар төлөх",exact=False).click()
    expect(page.locator(".checkout-success")).to_be_visible()
    page.goto(BASE+"/profile")
    expect(page.locator(".purchase-row")).to_have_count(2)
    page.screenshot(path=str(ART/"profile-exam-access.png"),full_page=True)
    for route in ["/checkout/sat-full-01","/checkout/ielts-academic-01","/exams"]:
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":844})
            page.goto(BASE+route);page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(route,width)
            if width==390 and route=="/checkout/sat-full-01":page.screenshot(path=str(ART/"mock-checkout-mobile.png"),full_page=True)
    guest=other.new_page();guest.goto(BASE);other.clear_cookies();guest.reload()
    expect(guest.locator(".account-entry")).to_have_text("Нэвтрэх")
    guest.set_viewport_size({"width":320,"height":844})
    expect(guest.locator(".account-entry span")).to_be_visible()
    assert guest.evaluate("document.documentElement.scrollWidth<=innerWidth")
    guest.screenshot(path=str(ART/"navbar-guest-mobile.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("PASS: guest/member navbar, 10000 MNT per-exam access, no timer on payment, declined/cancelled flow, authoritative prices, order ownership/origin, concurrent idempotent orders/confirmations, separate entitlements, receipts and mobile checkout")
