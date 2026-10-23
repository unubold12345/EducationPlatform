import os,json,copy
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/"artifacts";ART.mkdir(exist_ok=True)
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/");ORIGIN={"Origin":BASE}
demo=json.loads((ROOT/"src/data/demo-accounts.json").read_text(encoding="utf-8"))[0]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True);admin=browser.new_context(viewport={"width":1440,"height":1000},color_scheme="light")
    assert admin.request.post(BASE+"/api/auth/sign-in/email",headers=ORIGIN,data={"email":demo["email"],"password":demo["password"]}).ok
    student=browser.new_context();other=browser.new_context();guest=browser.new_context()
    ids=[]
    for context in [student,other]:
        response=context.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"email":"qa-publish-"+uuid4().hex[:12]+"@example.invalid","name":"Publishing QA","password":"Local-Publishing-"+uuid4().hex})
        assert response.ok,(response.status,response.text());ids.append(response.json()["user"]["id"])
    for context in [student,guest]:
        for method in ["get","post"]:
            result=getattr(context.request,method)(BASE+"/api/admin/content/sat-algebra",**({"headers":ORIGIN,"data":{}} if method=="post" else {}))
            assert result.status==(403 if context==student else 401)
    for user in ids:
        for program in ["sat","ielts"]:
            assert admin.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":"grant-month","target":user,"program":program,"reason":"Isolated publishing regression access"}).ok
    page=admin.new_page();errors=[];page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(BASE+"/admin?tab=users");assert "@example.invalid" not in page.locator(".admin-main tbody").inner_text() if page.locator(".admin-main tbody").count() else True
    page.goto(BASE+"/admin?tab=payments");expect(page.locator(".admin-help")).to_contain_text("Туршилтын гүйлгээ энд харагдахгүй")
    page.goto(BASE+"/admin?data=test&tab=users");expect(page.locator("tbody tr").first).to_be_visible()
    page.goto(BASE+"/admin");page.wait_for_load_state("networkidle");page.screenshot(path=str(ART/"admin-real-data.png"),full_page=True)
    assert "@example.invalid" not in admin.request.get(BASE+"/api/admin/export?kind=users").text()
    keys=["sat-algebra","sat-full-01","ielts-writing-data"]
    originals={};touched=[]
    def state(key):
        response=admin.request.get(BASE+"/api/admin/content/"+key);assert response.ok;return response.json()
    def post(key,action,**kwargs):
        revision=(state(key).get("draft") or {}).get("revision",0)
        return admin.request.post(BASE+"/api/admin/content/"+key,headers=ORIGIN,data={"action":action,"revision":revision,"reason":"Local publishing regression verification",**kwargs})
    def publish(key,body,provenance):
        for action in ["save","review","publish"]:
            response=post(key,action,**({"body":body,"provenance":provenance} if action=="save" else {}));assert response.ok,(action,response.status,response.text())
    old_id=student.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":"sat-algebra-v1"}).json()["id"]
    old_mock=student.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).json()
    old_mock=student.request.get(BASE+"/api/mock-attempts/"+old_mock["id"]).json()
    try:
        for key in keys:
            data=state(key);originals[key]=copy.deepcopy(data["history"][0]["body"] if data["history"] else data["source"])
            body=copy.deepcopy(originals[key]);body["title"]="Publishing verification "+key
            if key=="sat-algebra":body["questions"][0]["correct"]=(body["questions"][0]["correct"]+1)%4
            if key=="sat-full-01":body["stages"][0]["questions"][0]["prompt"]="Publishing verification prompt"
            initial_revision=(data.get("draft") or {}).get("revision",0)
            invalid=copy.deepcopy(body)
            if key=="sat-full-01":invalid["stages"][0]["seconds"]=1
            else:invalid["slug"]="forged-slug"
            assert post(key,"save",body=invalid,provenance="Original material; local QA validation").status==400
            assert post(key,"save",body=body,provenance="Original EducationPlatform material; isolated QA validation").ok;touched.append(key)
            assert post(key,"publish").status==409
            stale=admin.request.post(BASE+"/api/admin/content/"+key,headers=ORIGIN,data={"action":"review","revision":initial_revision,"reason":"Stale revision rejection"});assert stale.status==409
            assert post(key,"review").ok
            assert post(key,"publish").ok
            # Repeating publish cannot create another version from an already published draft.
            assert post(key,"publish").status==409
            assert state(key)["history"][0]["body"]["title"]==body["title"]
        member=student.new_page();member.goto(BASE+"/exercises/sat-algebra");expect(member.get_by_role("heading",name="Publishing verification sat-algebra",exact=True)).to_be_visible()
        new_version=state("sat-algebra")["history"][0]["version"]
        fresh=other.request.post(BASE+"/api/attempts",headers=ORIGIN,data={"examId":f"sat-algebra-published-v{new_version}"});assert fresh.ok
        snapshot=student.request.get(BASE+"/api/attempts/"+old_id).json();assert snapshot["title"]!="Publishing verification sat-algebra"
        answers=[item["correct"] for item in state("sat-algebra")["source"]["questions"]]
        graded=student.request.post(BASE+"/api/exercises/sat-algebra",headers=ORIGIN,data={"answers":answers,"examId":"sat-algebra-v1"});assert graded.json()["score"]==8
        latest=student.request.post(BASE+"/api/exercises/sat-algebra",headers=ORIGIN,data={"answers":answers});assert latest.json()["score"]==7
        existing=student.request.get(BASE+"/api/mock-attempts/"+old_mock["id"]).json();assert existing["stage"]["questions"][0]["prompt"]==old_mock["stage"]["questions"][0]["prompt"]
        fresh_mock=other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).json()
        fresh_mock=other.request.get(BASE+"/api/mock-attempts/"+fresh_mock["id"]).json();assert fresh_mock["stage"]["questions"][0]["prompt"]=="Publishing verification prompt"
        member.goto(BASE+"/workshops/ielts-writing-data");expect(member.get_by_role("heading",name="Publishing verification ielts-writing-data",exact=True)).to_be_visible()
        page.goto(BASE+"/admin/content/sat-algebra");expect(page.locator(".content-editor")).to_be_visible()
        page.get_by_text("Агуулга засах / урьдчилж харах",exact=True).click();page.get_by_label("title",exact=True).fill("Unsaved editorial draft")
        page.get_by_label("Эх сурвалж, ашиглах зөвшөөрөл ба хяналтын хариуцлага").fill("Original EducationPlatform material; local QA only")
        page.get_by_label("Үйлдлийн шалтгаан").fill("Verify editor save control")
        page.get_by_role("button",name="Ноорог хадгалах",exact=True).click();expect(page.locator(".content-editor [role=status]")).to_contain_text("Ноорог хадгалагдлаа")
        # Saving a new draft does not change the published title.
        assert state("sat-algebra")["history"][0]["body"]["title"]=="Publishing verification sat-algebra"
        page.screenshot(path=str(ART/"content-editor-desktop.png"),full_page=False)
        page.set_viewport_size({"width":320,"height":900});assert page.evaluate("document.documentElement.scrollWidth<=innerWidth");page.screenshot(path=str(ART/"content-editor-mobile.png"),full_page=False)
        assert not errors,errors
    finally:
        for key in touched:
            publish(key,originals[key],"Original EducationPlatform material restored after isolated local publishing verification; independent accuracy review remains pending")
            # The browser exercised the workflow, not an editorial accuracy review.
            assert admin.request.post(BASE+"/api/admin",headers=ORIGIN,data={"action":"review-content","target":key,"status":"PENDING","reason":"Original content restored after local workflow verification; independent editorial review remains pending"}).ok
    browser.close()
print("PASS: real/test reporting, protected editor, validation, drafts, stale conflicts, review-before-publish, immutable versions, old attempt preservation, exact-version grading, live exercise/mock/workshop changes and responsive editor")
