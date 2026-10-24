from scratchpad_checks import check_scratchpad
import os,json,subprocess
from pathlib import Path
from uuid import uuid4
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/"artifacts";ART.mkdir(exist_ok=True)
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/");ORIGIN={"Origin":BASE};SLUG="eec-math-2020-a"
KEY=json.loads(subprocess.check_output(["node","--input-type=module","-e","import {officialKey} from './src/modules/papers/key.ts';console.log(JSON.stringify(officialKey));"],cwd=ROOT,text=True,encoding="utf-8"))
answers={str(i+1):a for i,a in enumerate(KEY["choices"])};answers.update({q["id"]:q["digits"] for q in KEY["fills"]})
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True);context=browser.new_context(viewport={"width":1440,"height":1000},color_scheme="dark")
    page=context.new_page();errors=[];page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(BASE+"/exams");expect(page.locator(".official-exam-card")).to_contain_text("2020")
    page.goto(BASE+"/exams/"+SLUG);expect(page.locator(".official-facts")).to_contain_text("100")
    page.screenshot(path=str(ART/"official-paper-briefing.png"),full_page=True)
    assert context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG}).status==401
    page.get_by_role("link",name="Нэвтэрч эхлэх →").click();expect(page).to_have_url(BASE+"/login?next=%2Fexams%2F"+SLUG)
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    page.mouse.move(0, 0)

    page.get_by_label("Нэр",exact=True).fill("Official paper QA");page.get_by_label("Имэйл",exact=True).fill("qa-paper-"+uuid4().hex[:12]+"@example.invalid");page.get_by_label("Нууц үг",exact=True).fill("Local-Paper-"+uuid4().hex)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click();expect(page).to_have_url(BASE+"/exams/"+SLUG,timeout=20000)
    assert context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG}).status==402
    page.get_by_role("link",name="Шалгалтын эрх авах · ₮10,000").click()
    expect(page.locator(".checkout-summary")).to_contain_text("100 минут")
    page.get_by_role("button",name="Туршилтаар төлөх",exact=False).click();expect(page.get_by_role("heading",name="Эрх нээгдсэн")).to_be_visible()
    page.get_by_role("link",name="Шалгалтаа нээх →",exact=True).click();page.get_by_role("button",name="Эхлэх / үргэлжлүүлэх →").click()
    page.wait_for_url("**/papers/attempts/*");attempt_id=page.url.rsplit("/",1)[1];endpoint=BASE+"/api/paper-attempts/"+attempt_id
    check_scratchpad(page,context,endpoint,ART,"official-paper")
    initial=context.request.get(endpoint).json();assert initial["report"] is None and initial["keySources"]==[]
    assert 5990<=(datetime.fromisoformat(initial["deadline"])-datetime.fromisoformat(initial["serverNow"])).total_seconds()<=6000
    assert '"choices":' not in page.content() and '"fills":' not in page.content()
    image=page.locator(".official-page-image");expect(image).to_be_visible()
    # This verifies the actual external archive, without intercepting or replacing pages.
    page.wait_for_function("document.querySelector('.official-page-image')?.naturalWidth>500",timeout=45000)
    for n in range(1,9):
        page.get_by_label("Албан материалын хуудас",exact=True).select_option(str(n))
        page.wait_for_function("document.querySelector('.official-page-image')?.naturalWidth>500",timeout=45000)
        assert image.get_attribute("src")==f"http://help.eec.mn/modelItems/2020/mat/A/{n}.jpg"
    page.get_by_label("Албан материалын хуудас",exact=True).select_option("2")
    page.screenshot(path=str(ART/"official-paper-desktop.png"),full_page=True)
    page.get_by_label("1 · B",exact=True).check();expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан",timeout=10000)
    deadline=context.request.get(endpoint).json()["deadline"];page.reload();expect(page.get_by_label("1 · B",exact=True)).to_be_checked()
    assert context.request.get(endpoint).json()["deadline"]==deadline
    other=browser.new_context()
    assert other.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Other paper QA","email":"qa-paper-"+uuid4().hex[:12]+"@example.invalid","password":"Local-Paper-"+uuid4().hex}).ok
    assert other.request.get(endpoint).status==404
    assert other.request.put(endpoint,headers=ORIGIN,data={"revision":0,"responses":{},"submit":True}).status==404
    saved=context.request.get(endpoint).json()
    for body in [{"revision":saved["revision"],"responses":{"1":"F"},"submit":False},{"revision":saved["revision"],"responses":{"2.1":"abcdefgh"},"submit":False},{"revision":saved["revision"],"responses":{},"submit":False,"score":100}]:
        assert context.request.put(endpoint,headers=ORIGIN,data=body).status==400
    assert context.request.put(endpoint,headers={"Origin":"https://untrusted.invalid"},data={}).status==403
    assert context.request.put(endpoint,headers=ORIGIN,data={"revision":saved["revision"]-1,"responses":{},"submit":False}).status==409
    # Complete all choices and all 28 original digit positions through the UI.
    for i,letter in enumerate(KEY["choices"]):page.get_by_label(f"{i+1} · {letter}",exact=True).check()
    for q in KEY["fills"]:
        for letter,digit in zip("abcdefg",q["digits"]):page.get_by_label(q["id"]+" · "+letter,exact=True).fill(digit)
    expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан",timeout=15000)
    for width in [390,320]:
        page.set_viewport_size({"width":width,"height":900});assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
        page.screenshot(path=str(ART/f"official-paper-{width}.png"),full_page=True)
    page.on("dialog",lambda dialog:dialog.accept());page.get_by_role("button",name="Шалгалтыг эцэслэн илгээх",exact=True).click()
    expect(page.locator(".paper-result h2")).to_have_text("100 / 100",timeout=15000)
    result=context.request.get(endpoint).json();assert result["report"]["score"]==100 and len(result["keySources"])==3
    assert context.request.put(endpoint,headers=ORIGIN,data={"revision":0,"responses":{},"submit":True}).json()["report"]==result["report"]
    page.goto(BASE+"/dashboard");expect(page.get_by_role("heading",name="Миний албан материалын шалгалтууд")).to_be_visible()
    # A second sitting uses the same permanent purchase. Expiry retains only saved answers.
    retry=context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG});assert retry.ok;second_id=retry.json()["id"]
    second_endpoint=BASE+"/api/paper-attempts/"+second_id
    assert context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG}).json()["id"]==second_id
    assert context.request.put(second_endpoint,headers=ORIGIN,data={"revision":0,"responses":{"1":"B"},"submit":False}).ok
    subprocess.check_output(["node","--import","tsx","tests/paper_fixture.mjs","expire",second_id],cwd=ROOT)
    late=context.request.put(second_endpoint,headers=ORIGIN,data={"revision":1,"responses":answers,"submit":True}).json();assert late["status"]=="SUBMITTED" and late["report"]["score"]==1
    # Concurrent finalisation is immutable and returns the same authoritative result.
    third=context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG}).json()["id"]
    results=page.evaluate("""async({id,responses})=>Promise.all([1,2].map(async()=>{const r=await fetch('/api/paper-attempts/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:0,responses,submit:true})});return {status:r.status,body:await r.json()}}))""",{"id":third,"responses":answers})
    assert all(r["status"]==200 and r["body"]["report"]["score"]==100 for r in results)
    assert results[0]["body"]["report"]==results[1]["body"]["report"]
    # University Prep includes this paper without a standalone purchase.
    order=other.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"entrance"}).json()
    assert other.request.post(BASE+"/api/subscriptions/orders/"+order["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"}).ok
    included=other.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG});assert included.ok
    included_id=included.json()["id"];included_endpoint=BASE+"/api/paper-attempts/"+included_id
    subprocess.check_output(["node","--import","tsx","tests/paper_fixture.mjs","expire-plan",included_id],cwd=ROOT)
    assert other.request.get(included_endpoint).ok
    assert other.request.put(included_endpoint,headers=ORIGIN,data={"revision":0,"responses":{},"submit":True}).ok
    assert other.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG}).status==402
    assert not errors,errors
    browser.close()
print("PASS: official 2020 A source pages live, 100-minute clock, per-exam access, all 36 choices/28 digit cells, exact 100-mark scoring, autosave/resume, privacy, stale writes, immutable concurrent submit, expiry and responsive layouts")

