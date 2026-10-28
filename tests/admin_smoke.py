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
    for action in ["grant-month","expire-plan","revoke-sessions","review-content"]:
        assert student.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":action,"target":target,"reason":"Unauthorized attempt","program":"sat"}).status==403
    assert student.request.get(BASE+"/api/admin/export?kind=users").status==403
    member=student.new_page();member.goto(BASE+"/admin")
    expect(member.get_by_role("heading",name="Админ эрх шаардлагатай.")).to_be_visible()
    member.goto(BASE+"/admin/content/sat-algebra");assert member.locator(".admin-preview").count()==0
    admin=browser.new_context(viewport={"width":1440,"height":1000},color_scheme="light")
    assert admin.request.post(BASE+"/api/auth/sign-in/email",headers=ORIGIN,data={"email":demos[0]["email"],"password":demos[0]["password"]}).ok
    page=admin.new_page();errors=[];page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(BASE+"/profile");page.get_by_role("link",name="Удирдлагын төв →").click()
    expect(page.get_by_role("heading",name="Удирдлагын төв",exact=False)).to_be_visible()
    page.screenshot(path=str(ART/"admin-overview-light.png"),full_page=True)
    for tab in ["users","subscriptions","payments","attempts","content","audit","settings"]:
        page.goto(BASE+"/admin?tab="+tab);page.wait_for_load_state("networkidle")
        assert page.locator(".admin-main").count()==1
    page.goto(BASE+"/admin/content/sat-algebra")
    expect(page.locator(".admin-preview article")).to_have_count(8)
    page.locator(".admin-preview article details").first.click()
    expect(page.locator(".admin-preview article details p").first).to_be_visible()
    for key in ["sat-full-01","ielts-academic-01","ielts-writing-data"]:
        page.goto(BASE+"/admin/content/"+key);expect(page.locator(".admin-preview")).to_be_visible()
    for variant in "ABCD":
        page.goto(BASE+"/admin/content/eec-math-2020-"+variant.lower())
        expect(page.locator(".admin-preview h1")).to_contain_text(("А" if variant=="A" else variant)+" хувилбар")
        expect(page.locator(".admin-preview a[href*=\"/2020/mat/"+variant+"/\"]")).to_have_count(8)
        expect(page.locator(".admin-preview a[href*=\"2020Key\"]")).to_have_count(3)
    for slug,total in [("eec-english-2006-a",60),("eec-english-2010-a",50),("eec-english-2019-a",88),("eec-english-2020-d",99)]:
        page.goto(BASE+"/admin/content/"+slug)
        expect(page.locator(".admin-preview h1")).to_contain_text("Англи хэл")
        expect(page.locator(".admin-preview h2").last).to_have_text("Түлхүүр · "+str(total)+" оноо")
        assert page.locator('.admin-preview a[href*="/exam-assets/eec-english/"]').count()>0
    member.goto(BASE+"/admin/content/eec-english-2020-a");assert member.locator(".admin-preview").count()==0
    for subject in ["math","english"]:
        page.goto(BASE+"/admin/content/dornod-2026-"+subject+"-online-4")
        assert page.locator(".admin-preview").count()==0
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
    page.get_by_role("button",name="Удирдах ↗").click()
    page.locator(".admin-action textarea").fill("Local admin UI verification")
    page.on("dialog",lambda dialog:dialog.accept())
    page.locator(".admin-action button[type=submit]").click() if page.locator(".admin-action button[type=submit]").count() else page.get_by_role("button",name="Хадгалах",exact=True).click()
    expect(page.get_by_role("status")).to_contain_text("Амжилттай хадгаллаа")
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
print("Admin authorization, controls, audit, exports, previews and responsive themes passed.")
