import os
import subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ORIGIN={"Origin":BASE}
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/"artifacts";ART.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(color_scheme="dark",viewport={"width":1440,"height":1000})
    page=context.new_page();errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(BASE+"/plans");page.wait_for_load_state("networkidle")
    expect(page.locator(".plan-card")).to_have_count(3)
    expect(page.locator(".plan-price strong")).to_have_text(["₮40,000","₮60,000","₮60,000"])
    page.screenshot(path=str(ART/"plans-desktop-dark.png"),full_page=True)
    assert context.request.post(BASE+"/api/exercises/ielts-reading-library",headers=ORIGIN,data={"answers":[0]*8}).status==401
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".program-gate")).to_be_visible()
    assert "Commuting in a fictional town" not in page.content()
    page.get_by_role("link",name="Сарын эрх нээх",exact=False).click()
    expect(page).to_have_url(BASE+"/login?next=%2Fsubscribe%2Fielts")
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    page.mouse.move(0, 0)
    email="qa-sub-"+uuid4().hex[:12]+"@example.invalid"
    page.get_by_label("Нэр",exact=True).fill("Subscription QA")
    page.get_by_label("Имэйл",exact=True).fill(email)
    page.get_by_label("Нууц үг",exact=True).fill("Local-Test-"+uuid4().hex)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click()
    expect(page).to_have_url(BASE+"/subscribe/ielts",timeout=20000)
    user_id=context.request.get(BASE+"/api/auth/get-session").json()["user"]["id"]
    assert context.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"ielts-reading-library-v1"}).status==402
    page.get_by_role("button",name="Амжилтгүй төлбөр турших",exact=True).click()
    expect(page.locator(".subscription-payment .error-message")).to_contain_text("амжилтгүй")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==402
    for payload in [{"program":"ielts","amountMnt":1},{"program":"ielts","userId":"other"},{"program":"ielts","status":"PAID"}]:
        assert context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data=payload).status==400
    assert context.request.post(BASE+"/api/subscriptions/orders",headers={"Origin":"https://untrusted.invalid"},data={"program":"ielts"}).status==403
    assert context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"all"}).status==404
    with page.expect_response(lambda response:"/api/subscriptions/orders/" in response.url and response.url.endswith("/confirm")) as first_paid:
        page.get_by_role("button",name="Сарын эрх нээх",exact=False).click()
    first_receipt=first_paid.value.json()
    expect(page.locator(".subscription-receipt")).to_contain_text("Бодит мөнгө суутгаагүй")
    page.screenshot(path=str(ART/"subscription-paid.png"),full_page=True)
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".workshop-response")).to_be_visible()
    page.screenshot(path=str(ART/"subscription-ielts-workshop.png"),full_page=True)
    assert context.request.post(BASE+"/api/exercises/sat-algebra",headers=ORIGIN,data={"answers":[0]*8}).status==402
    assert context.request.post(BASE+"/api/exercises/entrance-math",headers=ORIGIN,data={"answers":[0]*8}).status==402
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402
    saved=context.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"ielts-reading-library-v1"})
    assert saved.status==200,saved.status
    saved_id=saved.json()["id"]
    mock=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"})
    assert mock.status==200
    mock_id=mock.json()["id"]
    page.goto(BASE+"/checkout/ielts-academic-01")
    expect(page.get_by_role("heading",name="Сарын багцад багтсан.")).to_be_visible()
    # Renewal order/confirmation is idempotent and adds exactly one month once.
    orders=page.evaluate("""async()=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/subscriptions/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({program:'ielts'})});return await r.json()}))""")
    assert orders[0]["id"]==orders[1]["id"] and orders[0]["amountMnt"]==60000
    order_id=orders[0]["id"]
    other=browser.new_context()
    assert other.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Other subscription QA","email":"qa-sub-other-"+uuid4().hex[:10]+"@example.invalid","password":"Local-Test-"+uuid4().hex}).status==200
    assert other.request.post(BASE+"/api/subscriptions/orders/"+order_id+"/confirm",headers=ORIGIN,data={"decision":"success"}).status==404
    assert other.request.get(BASE+"/api/attempts/"+saved_id).status==404
    receipts=page.evaluate("""async id=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/subscriptions/orders/'+id+'/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:'success'})});return await r.json()}))""",order_id)
    assert receipts[0]["status"]==receipts[1]["status"]=="PAID"
    assert receipts[0]["periodEnd"]==receipts[1]["periodEnd"]
    assert receipts[0]["periodStart"]==first_receipt["periodEnd"]
    repeat=context.request.post(BASE+"/api/subscriptions/orders/"+order_id+"/confirm",headers=ORIGIN,data={"decision":"success"}).json()
    assert repeat["periodEnd"]==receipts[0]["periodEnd"]
    for program,amount in [("entrance",40000),("sat",60000)]:
        order=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":program}).json()
        assert order["amountMnt"]==amount
        paid=context.request.post(BASE+"/api/subscriptions/orders/"+order["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"})
        assert paid.status==200 and paid.json()["status"]=="PAID"
    assert context.request.post(BASE+"/api/exercises/entrance-math",headers=ORIGIN,data={"answers":[0]*8}).status==200
    assert context.request.post(BASE+"/api/exercises/sat-algebra",headers=ORIGIN,data={"answers":[0]*8}).status==200
    page.goto(BASE+"/profile")
    expect(page.locator(".subscription-row")).to_have_count(3)
    page.screenshot(path=str(ART/"profile-subscriptions.png"),full_page=True)
    for program in ["ielts","sat"]:
        subprocess.check_output(["node","tests/subscription_fixture.mjs","expire",user_id,program],cwd=ROOT)
    assert context.request.post(BASE+"/api/exercises/ielts-reading-library",headers=ORIGIN,data={"answers":[0]*8}).status==402
    assert context.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"ielts-language-v1"}).status==402
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402
    assert context.request.get(BASE+"/api/attempts/"+saved_id).status==200
    assert context.request.get(BASE+"/api/mock-attempts/"+mock_id).status==200
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).json()["id"]==mock_id
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".program-gate")).to_be_visible()
    # Explicit renewal after expiry restores the program, not unrelated plans.
    page.goto(BASE+"/subscribe/ielts")
    expect(page.locator(".subscription-current")).to_contain_text("ХУГАЦАА ДУУССАН")
    page.get_by_role("button",name="Сарын эрх нээх",exact=False).click()
    expect(page.locator(".subscription-receipt")).to_be_visible()
    assert context.request.post(BASE+"/api/exercises/ielts-reading-library",headers=ORIGIN,data={"answers":[0]*8}).status==200
    for route in ["/plans","/subscribe/entrance","/subscribe/ielts","/profile","/dashboard"]:
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":844});page.goto(BASE+route);page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(route,width)
            if width==390 and route=="/plans":page.screenshot(path=str(ART/"plans-mobile-dark.png"),full_page=True)
    page.emulate_media(color_scheme="light");page.goto(BASE+"/plans");page.wait_for_load_state("networkidle")
    page.screenshot(path=str(ART/"plans-mobile-light.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("PASS: three monthly prices, program-scoped content/mock access, decline, tamper/origin/owner checks, idempotent renewal, expiry/restoration, saved-attempt continuation and mobile plans/profile")
