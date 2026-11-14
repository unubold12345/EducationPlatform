import os
import subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ORIGIN={"Origin":BASE}
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/"artifacts";ART.mkdir(exist_ok=True)

def fixture(*args):
    return subprocess.check_output(["node","tests/subscription_fixture.mjs",*args],cwd=ROOT)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(color_scheme="dark",viewport={"width":1440,"height":1000})
    page=context.new_page();errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    # The old address leads to the plans page inside the Workspace, which guests can still read.
    page.goto(BASE+"/plans");page.wait_for_load_state("networkidle")
    expect(page).to_have_url(BASE+"/workspace/plans")
    expect(page.locator('.wsp-nav a[href="/workspace/plans"]')).to_have_attribute("aria-current","page")
    # Three plans (owner rule 2026-11-13): the free account, ЭЕШ and Гадаад хэл.
    expect(page.locator(".pricing-card")).to_have_count(3)
    expect(page.locator(".pricing-card h3")).to_have_text(["Үнэгүй","ЭЕШ","Гадаад хэл"])
    expect(page.locator(".pricing-price strong")).to_have_text(["₮0","₮40,000","₮60,000"])
    free=page.locator('.pricing-card[data-program="free"]')
    expect(free.get_by_role("heading",name="Үнэгүй",exact=True)).to_be_visible()
    expect(free).to_contain_text("AI кредит / сар")
    expect(free).to_contain_text("10 үнэгүй хагас mock")
    expect(free).to_contain_text("файлаас 5 шалгалт")
    expect(free.get_by_role("link",name="Үнэгүй бүртгүүлэх",exact=False)).to_have_attribute("href","/register")
    language=page.locator('.pricing-card[data-program="language"]')
    expect(language).to_contain_text("Сар бүр 15 mock сонгоно")
    expect(language).to_contain_text("файлаас 15 шалгалт")
    expect(page.locator('.pricing-card[data-program="ielts"], .pricing-card[data-program="sat"]')).to_have_count(0)
    expect(page.locator(".pricing-table thead th")).to_have_text(["Багц","Үнэгүй","ЭЕШ","Гадаад хэл"])
    expect(page.locator("#credits")).to_contain_text("Кредит")
    page.screenshot(path=str(ART/"plans-desktop-dark.png"),full_page=True)
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==401
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==401
    # The retired plans are not sold: their checkout pages are gone.
    for program in ["ielts","sat"]:
        assert context.request.get(BASE+"/subscribe/"+program).status==404,program
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".program-gate")).to_be_visible()
    expect(page.locator(".program-gate")).to_contain_text("Гадаад хэл багцаар IELTS Writing & Speaking workshop")
    expect(page.locator('.program-gate > a')).to_have_attribute("href","/workspace/workshop")
    expect(page.locator('.wsp-nav a[href="/workspace/workshop"]')).to_have_attribute("aria-current","page")
    expect(page.locator(".site-header")).to_be_hidden()
    assert "Commuting in a fictional town" not in page.content()
    page.get_by_role("link",name="Сарын эрх нээх",exact=False).click()
    expect(page).to_have_url(BASE+"/login?next=%2Fsubscribe%2Flanguage")
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    page.mouse.move(0, 0)
    email="qa-sub-"+uuid4().hex[:12]+"@example.invalid"
    page.get_by_label("Нэр",exact=True).fill("Subscription QA")
    page.get_by_label("Имэйл",exact=True).fill(email)
    page.get_by_label("Нууц үг",exact=True).fill("Local-Test-"+uuid4().hex)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click()
    expect(page).to_have_url(BASE+"/subscribe/language",timeout=20000)
    # Plan purchase opens inside the Workspace, under its Plans tab, without the site header.
    expect(page.locator('.wsp-nav a[href="/workspace/plans"]')).to_have_attribute("aria-current","page")
    expect(page.locator(".site-header")).to_be_hidden()
    expect(page.locator(".checkout-summary")).to_contain_text("сар бүр 15 mock сонгоно")
    user_id=context.request.get(BASE+"/api/auth/get-session").json()["user"]["id"]
    page.get_by_role("button",name="Амжилтгүй төлбөр турших",exact=True).click()
    expect(page.locator(".subscription-payment .error-message")).to_contain_text("амжилтгүй")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==402
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==402,"no plan, no pick"
    for payload in [{"program":"language","amountMnt":1},{"program":"language","userId":"other"},{"program":"language","status":"PAID"}]:
        assert context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data=payload).status==400
    assert context.request.post(BASE+"/api/subscriptions/orders",headers={"Origin":"https://untrusted.invalid"},data={"program":"language"}).status==403
    for program in ["all","ielts","sat"]:
        assert context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":program}).status==404,program
    with page.expect_response(lambda response:"/api/subscriptions/orders/" in response.url and response.url.endswith("/confirm")) as first_paid:
        page.get_by_role("button",name="Сарын эрх нээх",exact=False).click()
    first_receipt=first_paid.value.json()
    expect(page.locator(".subscription-receipt")).to_contain_text("Бодит мөнгө суутгаагүй")
    expect(page.locator(".subscription-receipt .button")).to_have_attribute("href","/exams")
    page.screenshot(path=str(ART/"subscription-paid.png"),full_page=True)
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".workshop-response")).to_be_visible()
    expect(page.locator('.wsp-nav a[href="/workspace/workshop"]')).to_have_attribute("aria-current","page")
    page.get_by_label("Өөрийн хариуг бичээрэй").fill("A workshop response written inside the Workspace.")
    page.get_by_role("button",name="Өөрийгөө шалгах",exact=False).click()
    expect(page.locator(".self-review")).to_be_visible()
    page.screenshot(path=str(ART/"subscription-language-workshop.png"),full_page=True)
    # Гадаад хэл opens a mock once it is picked; picking is shown on the briefing and decided on the server.
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==402
    assert context.request.get(BASE+"/api/exam-practice/ielts-academic-01").status==402,"practice only on a picked mock"
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"eesh-math-2024-m1"}).status==402
    for bad in [{},{"slug":""},{"slug":"x"*81},{"slug":"ielts-academic-01","extra":1}]:
        assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data=bad).status==400,bad
    assert context.request.post(BASE+"/api/mock-picks",headers={"Origin":"https://untrusted.invalid"},data={"slug":"ielts-academic-01"}).status==403
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"no-such-mock"}).status==404
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"eesh-math-2024-m1"}).status==402,"ЭЕШ is not in Гадаад хэл"
    page.goto(BASE+"/exams/ielts-academic-01")
    pick=page.locator('.mock-pick[data-pick="open"]')
    expect(pick).to_contain_text("ЭНЭ САР 15 СОНГОЛТ ҮЛДСЭН")
    expect(page.locator(".practice-entry")).to_contain_text("сонгосны дараа нээгдэнэ")
    page.screenshot(path=str(ART/"subscription-pick-briefing.png"),full_page=True)
    with page.expect_response(lambda response:response.url.endswith("/api/mock-picks")) as picked:
        pick.get_by_role("button",name="Сонгох",exact=False).click()
    assert picked.value.ok and picked.value.json()["month"]["used"]==1,picked.value.text()
    expect(page.locator(".exam-preflight .status")).to_contain_text("ЭНЭ САР СОНГОСОН")
    expect(page.get_by_role("link",name="Дадлагын горим нээх",exact=False)).to_be_visible()
    assert context.request.get(BASE+"/api/exam-practice/ielts-academic-01").status==200
    again=context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-01"}).json()
    assert again["kind"]=="picked" and again["month"]["used"]==1,"a picked mock uses no second pick"
    mock=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"})
    assert mock.status==200
    mock_id=mock.json()["id"]
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402,"another mock still needs its own pick"
    page.goto(BASE+"/checkout/ielts-academic-01")
    expect(page.get_by_role("heading",name="Сарын багцад багтсан.")).to_be_visible()
    page.goto(BASE+"/checkout/sat-full-01")
    expect(page.locator(".checkout-pick-note")).to_contain_text("14 mock үнэгүй сонгох боломжтой")
    page.goto(BASE+"/workspace/plans")
    expect(page.locator('.pricing-card[data-program="language"] .pricing-picks')).to_contain_text("Энэ сар 1/15 mock сонгосон")
    # Renewal order/confirmation is idempotent and adds exactly one month once.
    orders=page.evaluate("""async()=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/subscriptions/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({program:'language'})});return await r.json()}))""")
    assert orders[0]["id"]==orders[1]["id"] and orders[0]["amountMnt"]==60000
    order_id=orders[0]["id"]
    other=browser.new_context()
    assert other.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Other subscription QA","email":"qa-sub-other-"+uuid4().hex[:10]+"@example.invalid","password":"Local-Test-"+uuid4().hex}).status==200
    assert other.request.post(BASE+"/api/subscriptions/orders/"+order_id+"/confirm",headers=ORIGIN,data={"decision":"success"}).status==404
    assert other.request.get(BASE+"/api/mock-attempts/"+mock_id).status==404
    receipts=page.evaluate("""async id=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/subscriptions/orders/'+id+'/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:'success'})});return await r.json()}))""",order_id)
    assert receipts[0]["status"]==receipts[1]["status"]=="PAID"
    assert receipts[0]["periodEnd"]==receipts[1]["periodEnd"]
    assert receipts[0]["periodStart"]==first_receipt["periodEnd"]
    repeat=context.request.post(BASE+"/api/subscriptions/orders/"+order_id+"/confirm",headers=ORIGIN,data={"decision":"success"}).json()
    assert repeat["periodEnd"]==receipts[0]["periodEnd"]
    # A renewal keeps the plan month: the pick made this month is still counted.
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-01"}).json()["month"]["used"]==1
    # The ЭЕШ plan opens every ЭЕШ mock with no picks.
    order=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"entrance"}).json()
    assert order["amountMnt"]==40000
    paid=context.request.post(BASE+"/api/subscriptions/orders/"+order["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"})
    assert paid.status==200 and paid.json()["status"]=="PAID"
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"eesh-math-2024-m1"}).ok
    # Practice access passes (no 402); only the open timed sittings keep practice closed for now (403).
    open_sitting=context.request.get(BASE+"/api/exam-practice/eesh-physics-2024-p1")
    assert open_sitting.status==403 and "Хугацаатай шалгалт нээлттэй" in open_sitting.json()["error"],open_sitting.text()
    page.goto(BASE+"/workspace/profile")
    page.get_by_role("tab",name="Багц ба эрх",exact=True).click()
    expect(page.locator(".subscription-row")).to_have_count(2)
    page.screenshot(path=str(ART/"profile-subscriptions.png"),full_page=True)
    fixture("expire",user_id,"language")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-02"}).status==402
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-02"}).status==402
    assert context.request.get(BASE+"/api/exam-practice/ielts-academic-01").status==402,"the pick ended with the plan"
    assert context.request.get(BASE+"/api/mock-attempts/"+mock_id).status==200
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).json()["id"]==mock_id
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".program-gate")).to_be_visible()
    # A plan of a retired kind bought before 2026-11-13 keeps its rules until it ends: every IELTS mock, the workshops, no picks.
    fixture("legacy",user_id,"ielts")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-05"}).ok
    legacy_practice=context.request.get(BASE+"/api/exam-practice/ielts-academic-07")
    assert legacy_practice.status==403 and "Хугацаатай шалгалт нээлттэй" in legacy_practice.json()["error"],legacy_practice.text()
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-02"}).status==402
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".workshop-response")).to_be_visible()
    page.goto(BASE+"/workspace/profile")
    page.get_by_role("tab",name="Багц ба эрх",exact=True).click()
    legacy=page.locator(".subscription-row").filter(has_text="IELTS (хуучин багц)")
    expect(legacy.get_by_role("link",name="Гадаад хэл авах",exact=True)).to_have_attribute("href","/subscribe/language")
    fixture("expire",user_id,"ielts")
    # Explicit renewal after expiry restores the plan with a new plan month and fresh picks.
    page.goto(BASE+"/subscribe/language")
    expect(page.locator(".subscription-current")).to_contain_text("ХУГАЦАА ДУУССАН")
    page.get_by_role("button",name="Сарын эрх нээх",exact=False).click()
    expect(page.locator(".subscription-receipt")).to_be_visible()
    fresh=context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-02"}).json()
    assert fresh["kind"]=="picked" and fresh["month"]["used"]==1,fresh
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".workshop-response")).to_be_visible()
    for route in ["/workspace/plans","/subscribe/entrance","/subscribe/language","/exams/sat-full-01","/workspace/profile","/workspace"]:
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":844});page.goto(BASE+route);page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(route,width)
            if width==390 and route=="/workspace/plans":page.screenshot(path=str(ART/"plans-mobile-dark.png"),full_page=True)
            if width==390 and route=="/exams/sat-full-01":page.screenshot(path=str(ART/"subscription-pick-mobile.png"),full_page=True)
    page.emulate_media(color_scheme="light");page.goto(BASE+"/workspace/plans");page.wait_for_load_state("networkidle")
    page.screenshot(path=str(ART/"plans-mobile-light.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("PASS: three plans (free, ЭЕШ, Гадаад хэл), retired IELTS/SAT plans honoured until they end and never sold, monthly picks opening sittings and practice, decline, tamper/origin/owner checks, idempotent renewal, expiry/restoration, saved-attempt continuation and mobile plans/profile")
