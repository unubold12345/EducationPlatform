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
    # Five plans (owner rule 2026-11-19): the free account, ЭЕШ, Англи хэл Basic and Pro, Ази хэл Basic and Pro.
    expect(page.locator(".pricing-card")).to_have_count(6)
    expect(page.locator(".pricing-card h3")).to_have_text(["Үнэгүй","ЭЕШ","Англи хэл Basic","Англи хэл Pro","Ази хэл Basic","Ази хэл Pro"])
    expect(page.locator(".pricing-price strong")).to_have_text(["₮0","₮29,900","₮29,900","₮59,900","₮29,900","₮59,900"])
    free=page.locator('.pricing-card[data-program="free"]')
    expect(free.get_by_role("heading",name="Үнэгүй",exact=True)).to_be_visible()
    expect(free).to_contain_text("AI кредит / сар")
    expect(free).to_contain_text("10 үнэгүй хагас mock")
    expect(free).to_contain_text("файлаас 5 шалгалт")
    expect(free.get_by_role("link",name="Үнэгүй бүртгүүлэх",exact=False)).to_have_attribute("href","/register")
    basic=page.locator('.pricing-card[data-program="english_basic"]')
    expect(basic).to_contain_text("1,200")
    expect(basic).to_contain_text("SAT, IELTS, TOEFL-ийн бүх mock")
    expect(basic).to_contain_text("IELTS, TOEFL workshop")
    expect(basic).to_contain_text("Хязгааргүй өгөх")
    expect(basic).to_contain_text("Үгсийн санд 1,500 үг, файлаас 5 шалгалт")
    pro=page.locator('.pricing-card[data-program="english_pro"]')
    expect(pro).to_contain_text("3,000")
    expect(pro).to_contain_text("Үгсийн санд 3,000 үг, файлаас 15 шалгалт")
    for program,credits,words in [("asian_basic","1,200","Үгсийн санд 1,500 үг, файлаас 5 шалгалт"),("asian_pro","3,000","Үгсийн санд 3,000 үг, файлаас 15 шалгалт")]:
        asian=page.locator(f'.pricing-card[data-program="{program}"]')
        expect(asian).to_contain_text(credits)
        expect(asian).to_contain_text(words)
        expect(asian).to_contain_text("JLPT, HSK, TOPIK-ийн бүх mock")
        expect(asian).to_contain_text("Унших, бичих workshop")
    expect(page.locator('.pricing-card[data-program="entrance"]')).to_contain_text("Үгсийн санд 500 үг, файлаас 5 шалгалт")
    expect(page.locator('.pricing-card[data-program="entrance"]')).to_contain_text("1,200")
    expect(page.locator('.pricing-card[data-program="ielts"], .pricing-card[data-program="sat"], .pricing-card[data-program="language"], .pricing-card[data-program="language_basic"]')).to_have_count(0)
    expect(page.locator(".pricing-table thead th")).to_have_text(["Багц","Үнэгүй","ЭЕШ","Англи хэл Basic","Англи хэл Pro","Ази хэл Basic","Ази хэл Pro"])
    expect(page.locator("#credits")).to_contain_text("Кредит")
    expect(page.locator(".pricing-single").last).to_contain_text("7 хоног")
    page.screenshot(path=str(ART/"plans-desktop-dark.png"),full_page=True)
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==401
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==401
    # The retired plans are not sold: their checkout pages are gone.
    for program in ["ielts","sat","language_basic","language"]:
        assert context.request.get(BASE+"/subscribe/"+program).status==404,program
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".program-gate")).to_be_visible()
    expect(page.locator(".program-gate")).to_contain_text("Англи хэл Basic багцаар IELTS Writing & Speaking workshop")
    expect(page.locator('.program-gate > a')).to_have_attribute("href","/workspace/workshop")
    expect(page.locator('.wsp-nav a[href="/workspace/workshop"]')).to_have_attribute("aria-current","page")
    expect(page.locator(".site-header")).to_be_hidden()
    assert "Commuting in a fictional town" not in page.content()
    page.get_by_role("link",name="Сарын эрх нээх",exact=False).click()
    expect(page).to_have_url(BASE+"/login?next=%2Fsubscribe%2Fenglish_basic")
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    page.mouse.move(0, 0)
    email="qa-sub-"+uuid4().hex[:12]+"@example.invalid"
    page.get_by_label("Нэр",exact=True).fill("Subscription QA")
    page.get_by_label("Имэйл",exact=True).fill(email)
    page.get_by_label("Нууц үг",exact=True).fill("Local-Test-"+uuid4().hex)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click()
    expect(page).to_have_url(BASE+"/subscribe/english_basic",timeout=20000)
    # Plan purchase opens inside the Workspace, under its Plans tab, without the site header.
    expect(page.locator('.wsp-nav a[href="/workspace/plans"]')).to_have_attribute("aria-current","page")
    expect(page.locator(".site-header")).to_be_hidden()
    expect(page.locator(".checkout-summary")).to_contain_text("бүх mock хязгааргүй")
    user_id=context.request.get(BASE+"/api/auth/get-session").json()["user"]["id"]
    page.get_by_role("button",name="Амжилтгүй төлбөр турших",exact=True).click()
    expect(page.locator(".subscription-payment .error-message")).to_contain_text("амжилтгүй")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==402
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-01"}).status==402,"no plan, no pick"
    for payload in [{"program":"english_basic","amountMnt":1},{"program":"english_basic","userId":"other"},{"program":"english_basic","status":"PAID"}]:
        assert context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data=payload).status==400
    assert context.request.post(BASE+"/api/subscriptions/orders",headers={"Origin":"https://untrusted.invalid"},data={"program":"english_basic"}).status==403
    for program in ["all","ielts","sat","language_basic","language"]:
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
    # Англи хэл (owner rule 2026-11-19): the TOEFL labs list the nine mocks and open one skill of a mock without a clock; JLPT,
    # HSK and TOPIK stay closed, their mocks and workshops alike. Checked before any timed sitting opens.
    page.goto(BASE+"/labs/toefl-listening")
    expect(page.locator('.wsp-nav a[href="/workspace/workshop"]')).to_have_attribute("aria-current","page")
    expect(page.locator('a[href^="/labs/mock/listening/toefl-"]')).to_have_count(9)
    page.goto(BASE+"/labs/mock/listening/toefl-01")
    expect(page.locator(".study-rail-head .eyebrow")).to_have_text("Workshop · TOEFL сонсгол")
    expect(page.get_by_role("link",name="← TOEFL сонсгол",exact=True)).to_have_attribute("href","/labs/toefl-listening")
    page.screenshot(path=str(ART/"lab-mock-toefl-listening.png"),full_page=True)
    page.goto(BASE+"/labs/toefl-reading")
    expect(page.locator('a[href^="/labs/mock/reading/toefl-"]')).to_have_count(9)
    assert context.request.get(BASE+"/labs/mock/writing/toefl-01").status==404,"TOEFL writing is not a lab"
    for slug in ["jlpt-n5-01","hsk1-mock-01","topik1-mock-01"]:
        assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug}).status==402,slug
        assert context.request.get(BASE+"/api/exam-practice/"+slug).status==402,slug
    page.goto(BASE+"/labs/mock/reading/jlpt-n5-01")
    expect(page).to_have_url(BASE+"/exams/jlpt-n5-01")
    for path in ["/labs/reading/jlpt","/labs/reading/hsk","/labs/reading/topik","/labs/writing/hsk","/labs/writing/topik"]:
        page.goto(BASE+path)
        expect(page.get_by_text("Ази хэл Basic, Ази хэл Pro багцад багтана",exact=False)).to_be_visible()
    # Англи хэл Basic opens every SAT, IELTS and TOEFL mock with no picking, and its practice mode; ЭЕШ stays closed.
    assert context.request.get(BASE+"/api/exam-practice/ielts-academic-01").status==200,"practice on every covered mock"
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"eesh-math-2024-m1"}).status==402
    for bad in [{},{"slug":""},{"slug":"x"*81},{"slug":"ielts-academic-01","extra":1}]:
        assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data=bad).status==400,bad
    assert context.request.post(BASE+"/api/mock-picks",headers={"Origin":"https://untrusted.invalid"},data={"slug":"ielts-academic-01"}).status==403
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"no-such-mock"}).status==404
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"eesh-math-2024-m1"}).status==402,"ЭЕШ is not in Англи хэл"
    page.goto(BASE+"/exams/ielts-academic-01")
    expect(page.locator(".mock-pick")).to_have_count(0)
    expect(page.locator(".exam-preflight .status")).to_contain_text("ЭРХ НЭЭЛТТЭЙ")
    expect(page.get_by_role("link",name="Дадлагын горим нээх",exact=False)).to_be_visible()
    page.screenshot(path=str(ART/"subscription-plan-briefing.png"),full_page=True)
    opened=context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-01"}).json()
    assert opened["kind"]=="plan","an open mock needs and uses no pick"
    mock=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-01"})
    assert mock.status==200
    mock_id=mock.json()["id"]
    other_open=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"})
    assert other_open.status==200,"every other covered mock opens too"
    page.goto(BASE+"/checkout/ielts-academic-01")
    expect(page.get_by_role("heading",name="Сарын багцад багтсан.")).to_be_visible()
    page.goto(BASE+"/workspace/plans")
    expect(page.locator('.pricing-card[data-program="english_basic"] .pricing-picks')).to_have_count(0)
    # Renewal order/confirmation is idempotent and adds exactly one month once.
    orders=page.evaluate("""async()=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/subscriptions/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({program:'english_basic'})});return await r.json()}))""")
    assert orders[0]["id"]==orders[1]["id"] and orders[0]["amountMnt"]==29900
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
    # The renewal keeps the open sitting and the access.
    assert context.request.get(BASE+"/api/mock-attempts/"+mock_id).status==200
    # The ЭЕШ plan opens every ЭЕШ mock with no picks.
    order=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"entrance"}).json()
    assert order["amountMnt"]==29900
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
    fixture("expire",user_id,"english_basic")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-02"}).status==402
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"ielts-academic-02"}).status==402
    assert context.request.get(BASE+"/api/exam-practice/ielts-academic-01").status==402,"practice ended with the plan"
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
    expect(legacy.get_by_role("link",name="Шинэ багц сонгох",exact=True)).to_have_attribute("href","/workspace/plans")
    fixture("expire",user_id,"ielts")
    # A retired Гадаад хэл plan keeps every non-ЭЕШ mock and workshop until it ends, JLPT included, and an English Basic is not
    # sold on top of it (owner rule 2026-11-19).
    fixture("legacy",user_id,"language")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"jlpt-n5-02"}).ok,"a retired Гадаад хэл plan still opens JLPT"
    page.goto(BASE+"/labs/reading/jlpt")
    # The plan passes; only the open timed sittings keep the workshop closed now.
    expect(page.get_by_text("Цагтай шалгалт явагдаж байхад",exact=False)).to_be_visible()
    over_legacy=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"english_basic"})
    assert over_legacy.status==409 and "Гадаад хэл Pro" in over_legacy.json()["error"],over_legacy.text()
    page.goto(BASE+"/workspace/profile")
    page.get_by_role("tab",name="Багц ба эрх",exact=True).click()
    old=page.locator(".subscription-row").filter(has_text="Гадаад хэл Pro (хуучин багц)")
    expect(old.get_by_role("link",name="Шинэ багц сонгох",exact=True)).to_have_attribute("href","/workspace/plans")
    fixture("expire",user_id,"language")
    # Explicit renewal after expiry restores the plan.
    page.goto(BASE+"/subscribe/english_basic")
    expect(page.locator(".subscription-current")).to_contain_text("ХУГАЦАА ДУУССАН")
    page.get_by_role("button",name="Сарын эрх нээх",exact=False).click()
    expect(page.locator(".subscription-receipt")).to_be_visible()
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-02"}).status==200,"the renewed plan opens every mock again"
    # Basic is not sold on top of an active Pro of its family; the other family's Basic is.
    pro_order=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"english_pro"}).json()
    assert context.request.post(BASE+"/api/subscriptions/orders/"+pro_order["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"}).json()["status"]=="PAID" and pro_order["amountMnt"]==59900,pro_order
    blocked=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"english_basic"})
    assert blocked.status==409 and "Англи хэл Pro" in blocked.json()["error"],blocked.text()
    asian_order=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"asian_basic"})
    assert asian_order.status==200 and asian_order.json()["amountMnt"]==29900,asian_order.text()
    page.goto(BASE+"/workshops/ielts-writing-data")
    expect(page.locator(".workshop-response")).to_be_visible()
    for route in ["/workspace/plans","/subscribe/entrance","/subscribe/english_basic","/subscribe/asian_pro","/labs/toefl-reading","/exams/sat-full-01","/workspace/profile","/workspace"]:
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":844});page.goto(BASE+route);page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(route,width)
            if width==390 and route=="/workspace/plans":page.screenshot(path=str(ART/"plans-mobile-dark.png"),full_page=True)
            if width==390 and route=="/exams/sat-full-01":page.screenshot(path=str(ART/"subscription-plan-mobile.png"),full_page=True)
    page.emulate_media(color_scheme="light");page.goto(BASE+"/workspace/plans");page.wait_for_load_state("networkidle")
    page.screenshot(path=str(ART/"plans-mobile-light.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("PASS: plans (free, ЭЕШ, Англи хэл and Ази хэл Basic and Pro), retired IELTS/SAT/Гадаад хэл plans honoured until they end and never sold, Англи хэл opening every SAT/IELTS/TOEFL mock, its practice and the TOEFL labs with no picks while JLPT/HSK/TOPIK mocks and workshops stay closed, Basic refused on top of a Pro of its family, decline, tamper/origin/owner checks, idempotent renewal, expiry/restoration, saved-attempt continuation and mobile plans/profile")
