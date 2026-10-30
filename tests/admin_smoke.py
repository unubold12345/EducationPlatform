import os,json,csv,io
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/"artifacts";ART.mkdir(exist_ok=True)
ORIGIN={"Origin":BASE}
demos=json.loads((ROOT/"src/data/demo-accounts.json").read_text(encoding="utf-8"))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    guest=browser.new_context()
    page=guest.new_page();page.goto(BASE+"/admin")
    expect(page).to_have_url(BASE+"/login?next=%2Fadmin")
    assert guest.request.post(BASE+"/api/admin",headers=ORIGIN,data={}).status==401
    assert guest.request.get(BASE+"/api/admin/export?kind=users").status==401
    student=browser.new_context()
    password="Admin-QA-"+uuid4().hex
    response=student.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"email":"qa-admin-"+uuid4().hex[:12]+"@example.invalid","name":"=SUM(1,2)","password":password,"role":"admin","adminMembership":{"userId":"forged"}})
    assert response.ok,response.status
    target=response.json()["user"]["id"]
    for action in ["grant-month","expire-plan","revoke-sessions","review-content","suspend","unsuspend","add-note"]:
        assert student.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":action,"target":target,"reason":"Unauthorized attempt","program":"sat"}).status==403
    assert student.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":"set-price","target":"sat","amount":100,"reason":"Unauthorized attempt"}).status==403
    assert student.request.post(BASE+"/api/admin/content/sat-algebra",headers=ORIGIN,data={"action":"fix","revision":0,"path":["questions",0],"patch":{"correct":1},"reason":"Unauthorized attempt"}).status==403
    assert student.request.get(BASE+"/api/admin/export?kind=users").status==403
    member=student.new_page();member.goto(BASE+"/admin")
    expect(member.get_by_role("heading",name="Админ эрх шаардлагатай.")).to_be_visible()
    member.goto(BASE+"/admin/content/sat-algebra");assert member.locator(".admin-main").count()==0
    member.goto(BASE+"/admin/users/"+target);assert member.locator(".admin-main").count()==0
    admin=browser.new_context(viewport={"width":1440,"height":1000},color_scheme="light")
    assert admin.request.post(BASE+"/api/auth/sign-in/email",headers=ORIGIN,data={"email":demos[0]["email"],"password":demos[0]["password"]}).ok
    page=admin.new_page();errors=[];page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(BASE+"/profile");page.get_by_role("link",name="Удирдлагын төв",exact=True).click()
    expect(page.get_by_role("heading",name="Удирдлагын төв",exact=False)).to_be_visible()
    page.screenshot(path=str(ART/"admin-overview-light.png"),full_page=True)
    for tab in ["users","subscriptions","payments","attempts","content","pricing","audit","settings"]:
        page.goto(BASE+"/admin?tab="+tab);page.wait_for_load_state("networkidle")
        assert page.locator(".admin-main").count()==1
    page.goto(BASE+"/admin/content/sat-algebra")
    expect(page.locator(".admin-questions > li")).to_have_count(8)
    page.locator(".admin-questions > li").first.get_by_role("button",name="Засах").click()
    expect(page.locator(".admin-fix-form")).to_be_visible();expect(page.locator(".admin-fix-form input[type=radio]")).to_have_count(4)
    page.locator(".admin-questions > li").first.get_by_role("button",name="Хаах").click()
    page.goto(BASE+"/admin/content/sat-full-02");expect(page.locator(".admin-fixer-bar span")).to_contain_text("асуулт")
    expect(page.locator(".admin-questions > li")).to_have_count(15);expect(page.locator(".admin-fixer .admin-pager button[aria-current=page]")).to_have_text("1")
    for key in ["sat-full-01","ielts-academic-01","ielts-writing-data"]+[f"{prefix}-{n:02}" for n in range(2,7) for prefix in ["sat-full","ielts-academic"]]:
        page.goto(BASE+"/admin/content/"+key);expect(page.locator(".admin-main")).to_be_visible()
    for variant in "ABCD":
        page.goto(BASE+"/admin/content/eec-math-2020-"+variant.lower())
        expect(page.locator(".admin-section-heading h2")).to_contain_text(("А" if variant=="A" else variant)+" хувилбар")
        expect(page.locator(".admin-main a[href*=\"/2020/mat/"+variant+"/\"]")).to_have_count(8)
        expect(page.locator(".admin-main a[href*=\"2020Key\"]")).to_have_count(3)
    for slug,total in [("eec-english-2006-a",60),("eec-english-2010-a",50),("eec-english-2019-a",88),("eec-english-2020-d",99)]:
        page.goto(BASE+"/admin/content/"+slug)
        expect(page.locator(".admin-section-heading h2")).to_contain_text("Англи хэл")
        expect(page.locator(".admin-panel h3").last).to_have_text("Түлхүүр · "+str(total)+" оноо")
        assert page.locator('.admin-main a[href*="/exam-assets/eec-english/"]').count()>0
    member.goto(BASE+"/admin/content/eec-english-2020-a");assert member.locator(".admin-main").count()==0
    for subject in ["math","english"]:
        page.goto(BASE+"/admin/content/dornod-2026-"+subject+"-online-4")
        assert page.locator(".admin-main").count()==0
    page.goto(BASE+"/admin?tab=content");assert page.locator('a[href*="dornod-2026"]').count()==0
    assert admin.request.post(BASE+"/api/admin",headers={"Origin":"https://untrusted.invalid"},data={}).status==403
    for body in [{"action":"drop-db","target":target,"reason":"Invalid operation"},{"action":"grant-month","target":target,"program":"all","reason":"Unknown program"},{"action":"grant-month","target":target,"program":"sat","reason":"bad"},{"action":"grant-month","target":target,"program":"sat","reason":"Unknown fields","amountMnt":1}]:
        assert admin.request.post(BASE+"/api/admin",headers=ORIGIN,data=body).status==400
    assert admin.request.post(BASE+"/api/admin",headers={**ORIGIN,"Content-Type":"application/json"},data="x"*9000).status==413
    assert admin.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":"grant-month","target":"missing-user","program":"sat","reason":"Missing user test"}).status==404
    def mutate(action,**kwargs):
        response=admin.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":action,"target":target,"program":"sat","reason":"Local admin browser verification",**kwargs})
        assert response.ok,(response.status,response.text())
    assert student.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"sat-algebra-v1"}).status==402
    mutate("grant-month")
    assert student.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"sat-algebra-v1"}).ok
    assert student.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"entrance-math-v1"}).status==402
    mutate("expire-plan")
    assert student.request.post(BASE+"/api/exercises/sat-algebra",headers=ORIGIN,data={"answers":[0]*8}).status==402
    page.goto(BASE+"/admin?tab=users&data=test&q="+response.json()["user"]["email"])
    expect(page.locator("tbody tr")).to_have_count(1)
    page.locator("tbody tr a").first.click();page.wait_for_url("**/admin/users/"+target)
    expect(page.locator(".admin-user-email")).to_have_text(response.json()["user"]["email"])
    expect(page.locator(".admin-table-wrap tbody tr").last).to_contain_text("Бүртгүүлсэн")
    page.on("dialog",lambda dialog:dialog.accept())
    page.locator(".admin-user-actions textarea").fill("Local admin UI verification note")
    page.get_by_role("button",name="Тэмдэглэл нэмэх").click()
    expect(page.locator(".admin-user-actions [role=status]")).to_contain_text("Хадгаллаа")
    expect(page.locator(".admin-log")).to_contain_text("Local admin UI verification note")
    mutate("review-content",target="sat-algebra",status="IN_REVIEW")
    mutate("review-content",target="sat-algebra",status="PENDING",reason="Local smoke verification completed; independent editorial review remains pending")
    for kind in ["users","subscriptions","payments","audit"]:
        exported=admin.request.get(BASE+"/api/admin/export?kind="+kind+"&data=test")
        assert exported.ok and "private, no-store" in exported.headers["cache-control"]
        assert not any(key in exported.text() for key in ["accessToken","refreshToken","password","sessionToken"])
        if kind=="users":assert "'=SUM(1,2)" in exported.text()
    assert admin.request.get(BASE+"/api/admin/export?kind=unknown").status==400
    page.goto(BASE+"/admin?tab=audit&q=Local%20admin%20browser")
    expect(page.locator("tbody tr").first).to_be_visible()
    mutate("revoke-sessions")
    revoked_session=student.request.get(BASE+"/api/auth/get-session")
    assert revoked_session.status==200,(revoked_session.status,revoked_session.text())
    assert revoked_session.json() is None,(revoked_session.status,revoked_session.text())
    assert student.request.post(BASE+"/api/admin",headers=ORIGIN,data={}).status==401
    # Suspension: refused at sign-in until lifted; admins and self cannot be suspended.
    email=response.json()["user"]["email"]
    assert student.request.post(BASE+"/api/auth/sign-in/email",headers=ORIGIN,data={"email":email,"password":password}).ok
    assert student.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"entrance-math-v1"}).status==402
    mutate("suspend",reason="Local suspension verification")
    assert student.request.get(BASE+"/api/auth/get-session").json() is None
    refused=student.request.post(BASE+"/api/auth/sign-in/email",headers=ORIGIN,data={"email":email,"password":password})
    assert refused.status==403 and "ACCOUNT_SUSPENDED" in refused.text(),(refused.status,refused.text())
    assert student.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"entrance-math-v1"}).status==401
    me=admin.request.get(BASE+"/api/auth/get-session").json()["user"]["id"]
    assert admin.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":"suspend","target":me,"reason":"Self suspension attempt"}).status==400
    page.goto(BASE+"/admin/users/"+target);expect(page.locator(".admin-warning")).to_contain_text("Local suspension verification")
    page.goto(BASE+"/admin?tab=users&data=test&filter=suspended");expect(page.locator("tbody")).to_contain_text(email)
    mutate("unsuspend",reason="Local suspension lifted")
    assert student.request.post(BASE+"/api/auth/sign-in/email",headers=ORIGIN,data={"email":email,"password":password}).ok
    page.goto(BASE+"/admin/users/"+target+"?view=activity");expect(page.locator(".admin-table-wrap tbody")).to_contain_text("Нэвтэрсэн")
    page.goto(BASE+"/admin/users/"+target+"?view=admin");expect(page.locator(".admin-table-wrap tbody")).to_contain_text("unsuspend")
    # Prices: validated, audited, shown on /plans and used for new orders; restored afterwards.
    for bad in [{"amount":999},{"amount":45050},{"amount":"45000"},{"amount":45000,"target":"all"}]:
        assert admin.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":"set-price","target":"sat","reason":"Invalid price check",**bad}).status==400,bad
    def price(value,reason):
        r=admin.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":"set-price","target":"sat","amount":value,"reason":reason});assert r.ok,(r.status,r.text())
    price(45500,"Local price change verification")
    page.goto(BASE+"/plans");expect(page.locator("main")).to_contain_text("45,500")
    page.goto(BASE+"/admin?tab=pricing");expect(page.locator(".admin-table-wrap tbody tr").first).to_contain_text("₮45,500")
    price(60000,"Local price restored after verification")
    page.goto(BASE+"/plans");expect(page.locator("main")).to_contain_text("60,000")
    # Single-question fix publishes a new version through validation; invalid fixes are refused.
    detail=admin.request.get(BASE+"/api/admin/content/sat-algebra").json()
    revision=(detail["draft"] or {}).get("revision",0)
    body=detail["history"][0]["body"] if detail["history"] else detail["source"]
    for bad in [{"path":["slug"],"patch":{"prompt":"x"}},{"path":["questions",0],"patch":{"id":"forged"}},{"path":["questions",0],"patch":{"correct":9}},{"path":["questions",0],"patch":{"options":["one"]}}]:
        assert admin.request.post(BASE+"/api/admin/content/sat-algebra",headers=ORIGIN,data={"action":"fix","revision":revision,"reason":"Invalid fix check",**bad}).status==400,bad
    old=body["questions"][0]["explanation"]
    fixed=admin.request.post(BASE+"/api/admin/content/sat-algebra",headers=ORIGIN,data={"action":"fix","revision":revision,"path":["questions",0],"patch":{"explanation":old+" (verified)"},"reason":"Local question fix verification"})
    assert fixed.ok,(fixed.status,fixed.text())
    restored=admin.request.post(BASE+"/api/admin/content/sat-algebra",headers=ORIGIN,data={"action":"fix","revision":fixed.json()["revision"],"path":["questions",0],"patch":{"explanation":old},"reason":"Local question fix restored"})
    assert restored.ok,(restored.status,restored.text())
    assert admin.request.post(BASE+"/api/admin/content/sat-algebra",headers=ORIGIN,data={"action":"fix","revision":0,"path":["questions",0],"patch":{"explanation":"stale"},"reason":"Stale revision check"}).status==409
    page.goto(BASE+"/admin?tab=audit&filter=content-fix");expect(page.locator("tbody tr").first).to_contain_text("sat-algebra")
    expect(page.locator(".admin-pager")).to_contain_text("нийт")
    page.goto(BASE+"/admin?tab=content");page.screenshot(path=str(ART/"admin-content-light.png"),full_page=True)
    for theme in ["light","dark"]:
        page.evaluate("theme=>{localStorage.setItem('education-theme',theme);document.documentElement.dataset.theme=theme}",theme)
        for width in [390,320]:
            page.set_viewport_size({"width":width,"height":900});page.goto(BASE+"/admin")
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
            page.screenshot(path=str(ART/f"admin-{theme}-{width}.png"),full_page=True)
            page.goto(BASE+"/admin?tab=users");assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
    page.set_viewport_size({"width":1440,"height":1000});page.evaluate("localStorage.setItem('education-theme','light')")
    page.goto(BASE+"/")
    assert float(page.locator(".education-backdrop").evaluate("el=>getComputedStyle(el).opacity"))>=.4
    page.screenshot(path=str(ART/"background-vivid-light.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("Admin authorization, controls, user records, notes, suspension, sign-in activity, prices, question fixes, audit, exports, content pages, pagination and responsive themes passed.")
