"""Local free half-length mocks (owner request 2026-11-13): hub tiles (not on the library), the guest gate, then a
fresh free account sits them with no plan or purchase: practice with its own audio route, an IELTS sitting's audio
rule, a full HSK sitting scored on the 100-per-section scale, the ЭЕШ and JLPT sittings in the browser, and no
purchase or pick for a free mock. Only disposable qa-exam-* rows use the trusted deadline fixture.
"""
import json
import os
from pathlib import Path
import subprocess
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ORIGIN={"Origin":BASE}
ART=ROOT/"artifacts";ART.mkdir(exist_ok=True)
FREE=["eesh-math-free","eesh-physics-free","eesh-chemistry-free","eesh-biology-free","eesh-english-free","sat-free","ielts-academic-free","jlpt-n5-free","jlpt-n4-free","hsk1-free"]
HUBS={"/exams/sat":["sat-free"],"/exams/ielts":["ielts-academic-free"],"/exams/jlpt?level=N5":["jlpt-n5-free"],"/exams/jlpt?level=N4":["jlpt-n4-free"],"/exams/hsk":["hsk1-free"],
      **{f"/exams/eesh?subject={subject}":[f"eesh-{subject}-free"] for subject in ["math","physics","chemistry","biology","english"]}}

def fixture(action,attempt):
    return json.loads(subprocess.check_output(["node","tests/mock_fixture.mjs",action,attempt],cwd=ROOT,text=True,encoding="utf-8"))

def fits(page,label,widths=(1440,390,320)):
    for width in widths:
        page.set_viewport_size({"width":width,"height":950})
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(label,width)
        page.screenshot(path=str(ART/f"free-{label}-{width}.png"),full_page=True)
    page.set_viewport_size({"width":1440,"height":950})

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={"width":1440,"height":950},reduced_motion="reduce",color_scheme="dark")
    page=context.new_page();errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    # Free mocks are listed only at the top of their programme hub, never on the /exams library (owner rule 2026-11-14).
    page.goto(BASE+"/exams")
    expect(page.locator("#free")).to_have_count(0)
    expect(page.locator("a[data-free-mock]")).to_have_count(0)
    fits(page,"library")
    for hub,slugs in HUBS.items():
        page.goto(BASE+hub)
        tiles=page.locator("a[data-free-mock]")
        expect(tiles).to_have_count(len(slugs))
        expect(tiles.first).to_have_attribute("href","/exams/"+slugs[0])
        expect(tiles.first).to_contain_text("ҮНЭГҮЙ · ХАГАС MOCK")
    # A guest is asked to sign in, never to pay.
    page.goto(BASE+"/exams/sat-free")
    expect(page.locator(".exam-free-gate")).to_contain_text("Бүртгэлтэй бүх хүнд үнэгүй")
    expect(page.locator(".exam-purchase-gate")).to_have_count(0)
    expect(page.locator(".briefing-price")).to_have_text("Үнэгүй · бүртгэлтэй бүх хүнд")
    page.get_by_role("button",name="Нэвтэрч эхлэх",exact=False).click()
    expect(page).to_have_url(BASE+"/login?next=%2Fexams%2Fsat-free")
    page.goto(BASE+"/exams/eesh-math-free")
    expect(page.locator(".eesh-gate")).to_contain_text("ҮНЭГҮЙ ТУРШИЛТ")
    expect(page.locator(".eesh-rail-price")).to_have_text("Үнэгүй · бүртгэлтэй бүх хүнд")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-free"}).status==401
    assert context.request.get(BASE+"/api/exam-practice/hsk1-free").status==401

    # A fresh free account: no plan, no purchase.
    email="qa-exam-free-"+uuid4().hex[:12]+"@example.invalid"
    assert context.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Free mock QA","email":email,"password":"Local-Test-"+uuid4().hex}).ok
    # Free mocks are never sold, and need no pick.
    assert context.request.post(BASE+"/api/mock-payments",headers=ORIGIN,data={"slug":"sat-free"}).status==409
    assert context.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":"sat-free"}).json()["kind"]=="free"
    page.goto(BASE+"/checkout/sat-free")
    expect(page.get_by_role("heading",name="Үнэгүй шалгалт.")).to_be_visible()
    # A paid mock is still closed to this account.
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402

    # Practice first (practice closes while a timed sitting is open): HSK pictures and its own audio route.
    practice=BASE+"/api/exam-practice/hsk1-free"
    view=context.request.get(practice)
    assert view.status==200,view.text()
    questions=view.json()["form"]["questions"]
    assert len(questions)==20
    first=questions[0]
    checked=context.request.post(practice+"/check",headers=ORIGIN,data={"questionId":first["id"],"response":first["options"][0]})
    assert checked.status==200 and "answer" in checked.json()["reveal"],checked.text()
    track=context.request.get(practice+"/audio/free?part=1",headers={"Range":"bytes=0-127"})
    assert track.status==206 and len(track.body())==128,track.status
    assert context.request.get(practice+"/audio/free?part=5").status==404
    assert context.request.get(practice+"/audio/hsk?part=1").status==404,"each route serves only its own folder"
    ielts_practice=BASE+"/api/exam-practice/ielts-academic-free"
    assert context.request.get(ielts_practice+"/audio/free?part=2",headers={"Range":"bytes=0-63"}).status==206
    assert context.request.get(ielts_practice+"/audio/free?part=3").status==404
    page.goto(BASE+"/exams/hsk1-free/practice")
    expect(page.locator(".hsk-practice-audio audio")).to_have_attribute("src","/api/exam-practice/hsk1-free/audio/free?part=1")
    fits(page,"hsk-practice")
    page.goto(BASE+"/exams/eesh-math-free/practice")
    expect(page.locator("main")).to_contain_text("Математик")
    fits(page,"eesh-practice",(1440,390))

    # IELTS: only the part playing now is served during the sitting.
    ielts=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-free"})
    assert ielts.status==200,ielts.text()
    endpoint=BASE+"/api/mock-attempts/"+ielts.json()["id"]
    sitting=context.request.get(endpoint).json()
    assert sitting["stage"]["id"]=="ielts-listening" and len(sitting["stage"]["questions"])==20
    assert '"answers":' not in json.dumps(sitting["stage"]) and '"listening":' not in json.dumps(sitting["stage"])
    assert context.request.get(endpoint+"/audio/free?part=1",headers={"Range":"bytes=0-127"}).status==206
    assert context.request.get(endpoint+"/audio/free?part=2").status==403
    assert context.request.get(endpoint+"/audio?part=1").status==404
    assert context.request.get(practice).status==403,"practice closes while a timed sitting is open"
    page.goto(BASE+"/exams/attempts/"+ielts.json()["id"])
    expect(page.locator("[data-listening-player]")).to_contain_text("Part 1 / 2")
    fits(page,"ielts-sitting",(1440,390))

    # HSK: a whole sitting with one wrong answer, scored out of 100 per 10-item section (correct × 10).
    hsk=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"hsk1-free"})
    assert hsk.status==200,hsk.text()
    attempt=hsk.json()["id"];hsk_endpoint=BASE+"/api/mock-attempts/"+attempt
    for stage_id in ["hsk-l","hsk-r"]:
        data=context.request.get(hsk_endpoint).json()
        assert data["stage"]["id"]==stage_id and len(data["stage"]["questions"])==10
        answers=fixture("answers",attempt)
        if stage_id=="hsk-r":
            target=data["stage"]["questions"][0]
            answers["responses"][target["id"]]=next(value for value in target["options"] if value!=answers["responses"][target["id"]])
        saved=context.request.patch(hsk_endpoint,headers=ORIGIN,data={"revision":data["revision"],"stageId":stage_id,"responses":answers["responses"],"flags":[]})
        assert saved.ok,saved.text()
        fixture("deadline",attempt)
    done=context.request.get(hsk_endpoint).json()
    assert done["finishedAt"] and done["report"]["points"]=={"total":20,"earned":19}
    page.goto(BASE+"/exams/attempts/"+attempt)
    expect(page.locator(".hsk-score-line")).to_contain_text("190/200")
    expect(page.locator(".hsk-note")).to_contain_text("зөв хариулт × 10")
    fits(page,"hsk-results",(1440,390))

    # ЭЕШ and JLPT open in the browser like any other sitting.
    page.goto(BASE+"/exams/eesh-math-free")
    expect(page.locator(".eesh-brief-main h1")).to_have_text("Үнэгүй · хагас хэмжээ")
    page.get_by_role("button",name="Шалгалт эхлэх",exact=False).click()
    page.wait_for_url("**/exams/attempts/*")
    expect(page.locator(".eesh-sit")).to_be_visible()
    fits(page,"eesh-sitting",(1440,390))
    page.goto(BASE+"/exams/jlpt-n5-free")
    expect(page.locator(".jlpt-hub-head")).to_contain_text("ҮНЭГҮЙ ХАГАС MOCK")
    page.get_by_label("Дууг тод сонсож байна").check()
    page.locator(".exam-agreement input").check()
    page.get_by_role("button",name="Шалгалт эхлэх / үргэлжлүүлэх",exact=False).click()
    page.wait_for_url("**/exams/attempts/*")
    fits(page,"jlpt-sitting",(1440,390))
    # The library and the briefing stay readable on phones.
    page.goto(BASE+"/exams/ielts-academic-free")
    expect(page.locator(".exam-briefing-copy .eyebrow")).to_have_text("ҮНЭГҮЙ ХАГАС MOCK · IELTS ACADEMIC")
    fits(page,"ielts-briefing")
    other=browser.new_context()
    assert other.request.get(endpoint).status==401
    other.close()
    assert not errors,errors
    browser.close()
print("PASS: free mocks on every hub (none on the library), guest gate, free account sittings without a plan or purchase, own audio route, IELTS part rule, HSK ×10 scale, ЭЕШ and JLPT sittings, never sold or picked")
