from scratchpad_checks import check_scratchpad
import os,json,subprocess
from pathlib import Path
from uuid import uuid4
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/"artifacts";ART.mkdir(exist_ok=True)
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/");ORIGIN={"Origin":BASE};SLUG="eec-math-2020-a"
KEY=json.loads(subprocess.check_output(["node","--input-type=module","-e","import {officialKey} from './src/modules/papers/key.ts';console.log(JSON.stringify(officialKey));"],cwd=ROOT,text=True,encoding="utf-8"))
KEYS=json.loads(subprocess.check_output(["node","--input-type=module","-e","import {officialKeys} from './src/modules/papers/key.ts';console.log(JSON.stringify(officialKeys));"],cwd=ROOT,text=True,encoding="utf-8"))
answers={str(i+1):a for i,a in enumerate(KEY["choices"])};answers.update({q["id"]:q["digits"] for q in KEY["fills"]})
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True);context=browser.new_context(viewport={"width":1440,"height":1000},color_scheme="dark")
    context.route("**://help.eec.mn/**",lambda route:route.abort())
    page=context.new_page();errors=[];page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(BASE+"/exams");expect(page.locator(".official-exam-card")).to_contain_text("2020")
    expect(page.locator(".official-exam-card h2")).to_have_text("ЭЕШ 2020 · Математик")
    page.locator(".official-exam-card .button").click()
    expect(page).to_have_url(BASE+"/exams/eec-math-2020")
    expect(page.locator(".paper-variant-card")).to_have_count(4)
    for theme in ["light","dark"]:
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":1000})
            page.evaluate("theme=>document.documentElement.dataset.theme=theme",theme)
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
            page.screenshot(path=str(ART/f"official-variants-{theme}-{width}.png"),full_page=True)
    page.set_viewport_size({"width":1440,"height":1000})
    for variant in "ABCD":
        slug="eec-math-2020-"+variant.lower()
        page.goto(BASE+"/exams/"+slug)
        expect(page.locator(".page-intro h1")).to_contain_text(("А" if variant=="A" else variant)+" хувилбар")
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
    # The real bundled pages must render even when the external archive is unavailable.
    page.wait_for_function("document.querySelector('.official-page-image')?.naturalWidth>500",timeout=45000)
    for n in range(1,9):
        page.get_by_label("Албан материалын хуудас",exact=True).select_option(str(n))
        page.wait_for_function("document.querySelector('.official-page-image')?.naturalWidth>500",timeout=45000)
        assert image.get_attribute("src")==f"/exam-assets/eec-math-2020/A/{n}.jpg"
    page.get_by_label("Албан материалын хуудас",exact=True).select_option("2")
    page.screenshot(path=str(ART/"official-paper-desktop.png"),full_page=True)
    page.get_by_label("1 · B",exact=True).check();expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан",timeout=10000)
    deadline=context.request.get(endpoint).json()["deadline"];page.reload();expect(page.get_by_label("1 · B",exact=True)).to_be_checked()
    assert context.request.get(endpoint).json()["deadline"]==deadline
    other=browser.new_context()
    other.route("**://help.eec.mn/**",lambda route:route.abort())
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
    # An A-only purchase must never unlock other variants or an invalid category slug.
    for variant in "BCD":
        assert context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":"eec-math-2020-"+variant.lower()}).status==402
    for slug in ["eec-math-2020","eec-math-2020-e","eec-math-2021-a"]:
        assert context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":slug}).status==400
    assert context.request.post(BASE+"/api/paper-attempts",headers={"Origin":"https://untrusted.invalid"},data={"slug":SLUG}).status==403
    # New variants keep the existing simulated per-paper checkout contract.
    page.goto(BASE+"/checkout/eec-math-2020-b")
    expect(page.locator(".checkout-summary h2")).to_contain_text("B хувилбар")
    page.get_by_role("button",name="Туршилтаар төлөх",exact=False).click()
    expect(page.get_by_role("heading",name="Эрх нээгдсэн")).to_be_visible()
    page.get_by_role("link",name="Шалгалтаа нээх →",exact=True).click()
    expect(page).to_have_url(BASE+"/exams/eec-math-2020-b")
    page.get_by_role("button",name="Эхлэх / үргэлжлүүлэх →").click();page.wait_for_url("**/papers/attempts/*")
    expect(page.locator(".paper-toolbar h1")).to_contain_text("B хувилбар")
    for variant in "CD":
        assert context.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":"eec-math-2020-"+variant.lower()}).status==402
    page.goto(BASE+"/profile")
    expect(page.locator('.profile-access a[href="/exams/eec-math-2020-b"]')).to_contain_text("B хувилбар")
    # University Prep includes this paper without a standalone purchase.
    order=other.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"entrance"}).json()
    assert other.request.post(BASE+"/api/subscriptions/orders/"+order["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"}).ok
    included=other.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG});assert included.ok
    included_id=included.json()["id"];included_endpoint=BASE+"/api/paper-attempts/"+included_id
    variants_page=other.new_page();variant_ids=[]
    for variant in "BCD":
        slug="eec-math-2020-"+variant.lower();key=KEYS[variant]
        started=other.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":slug});assert started.ok,(variant,started.status,started.text())
        variant_id=started.json()["id"];variant_ids.append(variant_id);url=BASE+"/api/paper-attempts/"+variant_id
        state=other.request.get(url).json()
        assert state["paper"]["variant"]==variant and state["report"] is None and state["keySources"]==[]
        assert state["paper"]["slug"]==slug and "key" not in state
        assert 5990<=(datetime.fromisoformat(state["deadline"])-datetime.fromisoformat(state["serverNow"])).total_seconds()<=6000
        assert other.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":slug}).json()["id"]==variant_id
        assert context.request.get(url).status==404
        variants_page.goto(BASE+"/papers/attempts/"+variant_id)
        expect(variants_page.locator(".paper-toolbar .eyebrow")).to_contain_text(variant+" ХУВИЛБАР")
        assert '\"choices\":' not in variants_page.content() and '\"fills\":' not in variants_page.content()
        for n in range(1,9):
            variants_page.get_by_label("Албан материалын хуудас",exact=True).select_option(str(n))
            variants_page.wait_for_function("document.querySelector('.official-page-image')?.naturalWidth>500",timeout=45000)
            assert variants_page.locator(".official-page-image").get_attribute("src")==f"/exam-assets/eec-math-2020/{variant}/{n}.jpg"
        variants_page.get_by_label("1 · "+key["choices"][0],exact=True).check()
        expect(variants_page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан",timeout=10000)
        variants_page.reload();expect(variants_page.get_by_label("1 · "+key["choices"][0],exact=True)).to_be_checked()
        assert other.request.get(url).json()["deadline"]==state["deadline"]
        variants_page.screenshot(path=str(ART/f"official-paper-{variant}-desktop.png"),full_page=True)
        variant_answers={str(i+1):a for i,a in enumerate(key["choices"])};variant_answers.update({q["id"]:q["digits"] for q in key["fills"]})
        saved=other.request.get(url).json()
        result=other.request.put(url,headers=ORIGIN,data={"revision":saved["revision"],"responses":variant_answers,"submit":True}).json()
        assert result["status"]=="SUBMITTED" and result["report"]["score"]==100 and len(result["keySources"])==3
        assert other.request.put(url,headers=ORIGIN,data={"revision":0,"responses":{},"submit":True}).json()["report"]==result["report"]
        variants_page.reload();expect(variants_page.locator(".paper-result h2")).to_have_text("100 / 100")
    assert len(set(variant_ids+[included_id]))==4
    variants_page.goto(BASE+"/dashboard")
    for variant,variant_id in zip("BCD",variant_ids):
        expect(variants_page.locator('a[href="/papers/attempts/'+variant_id+'"] h3')).to_have_text("ЭЕШ 2020 · Математик · "+variant+" хувилбар")
    subprocess.check_output(["node","--import","tsx","tests/paper_fixture.mjs","expire-plan",included_id],cwd=ROOT)
    assert other.request.get(included_endpoint).ok
    assert other.request.put(included_endpoint,headers=ORIGIN,data={"revision":0,"responses":{},"submit":True}).ok
    assert other.request.post(BASE+"/api/paper-attempts",headers=ORIGIN,data={"slug":SLUG}).status==402
    assert not errors,errors
    browser.close()
print("PASS: 2020 mathematics category, all A/B/C/D bundled pages with archive blocked, variant keys/grades/history/access isolated, 100-minute clock, per-exam access, all 36 choices/28 digit cells, exact 100-mark scoring, autosave/resume, privacy, stale writes, immutable concurrent submit, expiry and responsive layouts")

