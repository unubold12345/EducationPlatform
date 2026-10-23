"""Full exam verification using isolated QA fixtures to advance real server deadlines.
No application timer override or test-only API is added. Real-duration sitting is not simulated.
"""
from scratchpad_checks import check_scratchpad
import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ORIGIN={"Origin":BASE}
ART=ROOT/"artifacts"
ART.mkdir(exist_ok=True)
def fixture(action,attempt_id,offset=None):
    args=["node","tests/mock_fixture.mjs",action,attempt_id]
    if offset is not None: args.append(str(offset))
    return json.loads(subprocess.check_output(args,cwd=ROOT,text=True,encoding="utf-8"))

def active_mobile(page,label):
    previous=page.viewport_size
    for width in [390,320]:
        page.set_viewport_size({"width":width,"height":844})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"),(label,width)
        page.screenshot(path=str(ART/(label+"-active-"+str(width)+".png")),full_page=True)
    page.set_viewport_size(previous)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"])
    context=browser.new_context(viewport={"width":1440,"height":1000},permissions=["microphone"],reduced_motion="reduce",color_scheme="dark")
    page=context.new_page()
    page.on("dialog",lambda dialog:dialog.accept() if dialog.type=="beforeunload" else dialog.dismiss())
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.goto(BASE+"/exams")
    page.wait_for_load_state("networkidle")
    expect(page.locator(".exam-card")).to_have_count(3)
    expect(page.locator(".official-exam-card")).to_contain_text("2020")
    page.screenshot(path=str(ART/"exams-grid-desktop.png"),full_page=True)
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==401
    assert page.goto(BASE+"/exams/not-an-exam").status==404
    # Registration returns to checkout; payment does not start a clock.
    page.goto(BASE+"/exams/sat-full-01")
    page.get_by_role("button",name="Эрх авах",exact=False).click()
    page.wait_for_url("**/login?next=**")
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    page.get_by_label("Нэр",exact=True).fill("Exam QA")
    page.get_by_label("Имэйл",exact=True).fill("qa-exam-"+uuid4().hex[:12]+"@example.invalid")
    password="Local-Test-"+uuid4().hex
    page.get_by_label("Нууц үг",exact=True).fill(password)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click()
    expect(page).to_have_url(BASE+"/checkout/sat-full-01",timeout=20000)
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-01"}).status==402
    page.get_by_role("button",name="Туршилтаар төлөх",exact=False).click()
    expect(page.locator(".checkout-success")).to_be_visible()
    page.get_by_role("link",name="Шалгалтаа нээх",exact=False).click()
    expect(page).to_have_url(BASE+"/exams/sat-full-01")
    assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"unknown"}).status==404
    assert context.request.post(BASE+"/api/mock-attempts",headers={"Origin":"https://untrusted.invalid"},data={"slug":"sat-full-01"}).status==403
    page.locator(".exam-agreement input").check()
    page.get_by_role("button",name="Шалгалт эхлэх / үргэлжлүүлэх",exact=False).click()
    page.wait_for_url("**/exams/attempts/*")
    sat_id=page.url.rsplit("/",1)[1]
    endpoint=BASE+"/api/mock-attempts/"+sat_id
    sat=context.request.get(endpoint).json()
    assert sat["stage"]["id"]=="sat-rw-1" and len(sat["stage"]["questions"])==27
    assert "report" in sat and sat["report"] is None
    assert all("answers" not in q and "explanation" not in q and "pretest" not in q for q in sat["stage"]["questions"])
    assert "variants" not in sat["stage"] and "definition" not in sat
    assert '\\"explanation\\":' not in page.content()
    repeats=page.evaluate("""async () => Promise.all([1,2].map(async()=>{const r=await fetch('/api/mock-attempts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:'sat-full-01'})});return r.json()}))""")
    assert all(r["id"]==sat_id for r in repeats)
    page.get_by_role("radio").first.check()
    expect(page.locator(".exam-session-meta [role=status]")).to_have_text("Хадгалсан")
    saved=context.request.get(endpoint).json()
    deadline=saved["deadline"]
    page.reload()
    expect(page.get_by_role("radio").first).to_be_checked()
    assert context.request.get(endpoint).json()["deadline"]==deadline
    # Changing the client clock does not change a server deadline.
    page.clock.install()
    page.clock.fast_forward(2000000)
    assert context.request.get(endpoint).json()["stage"]["id"]=="sat-rw-1"
    page.clock.resume()
    # Current data cannot be used to edit a future stage or overwrite a newer revision.
    assert context.request.patch(endpoint,headers=ORIGIN,data={"revision":saved["revision"],"stageId":"sat-math-1","responses":{},"flags":[]}).status==400
    assert context.request.patch(endpoint,headers=ORIGIN,data={"revision":0,"stageId":"sat-rw-1","responses":{},"flags":[]}).status==409
    for stage_id,count,seconds in [("sat-rw-1",27,1920),("sat-rw-2",27,1920),("sat-break",0,600),("sat-math-1",22,2100),("sat-math-2",22,2100)]:
        data=context.request.get(endpoint).json()
        assert data["stage"]["id"]==stage_id and len(data["stage"]["questions"])==count and data["stage"]["seconds"]==seconds
        answers=fixture("answers",sat_id)
        r=context.request.patch(endpoint,headers=ORIGIN,data={"revision":data["revision"],"stageId":stage_id,"responses":answers["responses"],"flags":[]})
        assert r.status==200, (stage_id,r.status)
        # A forged advance/deadline field does not move the stage or reset its deadline.
        current=r.json()
        forged=context.request.patch(endpoint,headers=ORIGIN,data={"revision":current["revision"],"stageId":stage_id,"responses":{},"flags":[],"action":"advance","deadline":"2099-01-01T00:00:00Z"})
        assert forged.status==200 and forged.json()["stage"]["id"]==stage_id and forged.json()["deadline"]==current["deadline"]
        page.goto(BASE+"/exams/attempts/"+sat_id)
        if stage_id=="sat-math-1":
            check_scratchpad(page,context,endpoint,ART,"sat-math")
            page.get_by_role("button",name="Тооны машин / томьёо",exact=True).click()
            expect(page.locator(".exam-tools iframe")).to_have_attribute("src","https://www.desmos.com/calculator?embed")
            page.screenshot(path=str(ART/"sat-math-tools-desktop.png"),full_page=True)
            page.get_by_role("button",name="Тооны машин / томьёо",exact=True).click()
        if stage_id=="sat-rw-1":
            page.screenshot(path=str(ART/"sat-module-desktop.png"),full_page=True)
        if stage_id=="sat-break":
            page.screenshot(path=str(ART/"sat-break-desktop.png"),full_page=True)
        if stage_id in ["sat-rw-1","sat-math-1"]:
            active_mobile(page,stage_id)
        fixture("deadline",sat_id,1500)
        page.reload()
        expect(page.locator(".exam-toolbar h1")).not_to_have_text(data["stage"]["title"],timeout=15000) if stage_id!="sat-math-2" else expect(page.locator(".exam-results")).to_be_visible(timeout=15000)
    report=context.request.get(endpoint).json()
    assert report["finishedAt"] and len(report["report"]["reviews"])==98
    assert [(s["correct"],s["total"]) for s in report["report"]["sections"]]==[(50,50),(40,40)]
    assert context.request.patch(endpoint,headers=ORIGIN,data={"revision":report["revision"],"stageId":"sat-rw-1","responses":{},"flags":[]}).status==409
    page.screenshot(path=str(ART/"sat-results-desktop.png"),full_page=True)
    # A different account cannot access the private mock, audio or recordings.
    other=browser.new_context()
    assert other.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Other Exam QA","email":"qa-exam-other-"+uuid4().hex[:12]+"@example.invalid","password":password}).ok
    assert other.request.get(endpoint).status==404
    assert other.request.patch(endpoint,headers=ORIGIN,data={}).status==404
    assert other.request.get(endpoint+"/audio?part=1").status==404

    page.goto(BASE+"/exams/ielts-academic-01")
    page.get_by_role("button",name="Эрх авах",exact=False).click()
    expect(page).to_have_url(BASE+"/checkout/ielts-academic-01")
    page.get_by_role("button",name="Туршилтаар төлөх",exact=False).click()
    expect(page.locator(".checkout-success")).to_be_visible()
    page.get_by_role("link",name="Шалгалтаа нээх",exact=False).click()
    page.locator(".equipment-check input").check()
    page.get_by_role("button",name="Микрофон шалгах",exact=True).click()
    expect(page.get_by_role("button",name="Микрофон бэлэн ✓",exact=True)).to_be_visible()
    page.locator(".exam-agreement input").check()
    page.get_by_role("button",name="Шалгалт эхлэх / үргэлжлүүлэх",exact=False).click()
    page.wait_for_url("**/exams/attempts/*")
    ielts_id=page.url.rsplit("/",1)[1]
    endpoint=BASE+"/api/mock-attempts/"+ielts_id
    listening=context.request.get(endpoint).json()
    assert listening["stage"]["seconds"]==1800 and len(listening["stage"]["questions"])==40
    audio=context.request.get(endpoint+"/audio?part=1",headers={"Range":"bytes=0-1023"})
    assert audio.status==206 and len(audio.body())==1024 and audio.headers["content-type"]=="audio/mpeg"
    assert context.request.get(endpoint+"/audio?part=2").status==403
    assert context.request.get(endpoint+"/audio?part=../1").status==404
    assert other.request.get(endpoint+"/audio?part=1").status==404
    page.locator(".listening-player audio").wait_for(state="attached")
    page.wait_for_function("document.querySelector('.listening-player audio').readyState >= 1")
    reconnect=page.get_by_role("button",name="Дууг одоогийн байрлалаас холбох",exact=False)
    if reconnect.is_visible():reconnect.click()
    page.wait_for_function("document.querySelector('.listening-player audio').currentTime > 0.2 && !document.querySelector('.listening-player audio').paused")
    assert page.locator(".listening-player audio").get_attribute("controls") is None
    page.screenshot(path=str(ART/"ielts-listening-desktop.png"),full_page=True)
    for stage_id in ["ielts-listening","ielts-listening-check","ielts-reading","ielts-writing","ielts-speaking-1","ielts-speaking-prep","ielts-speaking-2","ielts-speaking-3"]:
        data=context.request.get(endpoint).json()
        assert data["stage"]["id"]==stage_id,(stage_id,data["stage"]["id"])
        answers=fixture("answers",ielts_id)
        if stage_id=="ielts-writing":
            answers["responses"]={"iw1":"This is a response for human review. "*30,"iw2":"This discussion needs a qualified human assessment. "*50}
        r=context.request.patch(endpoint,headers=ORIGIN,data={"revision":data["revision"],"stageId":stage_id,"responses":answers["responses"],"flags":[]})
        assert r.status==200,(stage_id,r.status)
        page.goto(BASE+"/exams/attempts/"+ielts_id)
        if stage_id in ["ielts-reading","ielts-writing"]:
            page.screenshot(path=str(ART/(stage_id+"-exam-desktop.png")),full_page=True)
        if stage_id in ["ielts-listening","ielts-reading","ielts-writing"]:
            active_mobile(page,stage_id)
        if data["stage"]["kind"]=="speaking":
            fixture("deadline",ielts_id,4000)
            page.reload()
            expect(page.locator(".speaking-recorder")).to_contain_text("Яриа бичигдэж байна",timeout=10000)
            if stage_id=="ielts-speaking-2":page.screenshot(path=str(ART/"ielts-speaking-desktop.png"),full_page=True)
            if stage_id=="ielts-speaking-3":expect(page.locator(".exam-results")).to_be_visible(timeout=15000)
            else:expect(page.locator(".exam-toolbar h1")).not_to_have_text(data["stage"]["title"],timeout=15000)
            page.wait_for_timeout(1500)
        else:
            fixture("deadline",ielts_id)
            context.request.get(endpoint)
    final=context.request.get(endpoint).json()
    assert final["finishedAt"] and [(s["correct"],s["total"]) for s in final["report"]["sections"][:2]]==[(40,40),(40,40)]
    assert [s["pending"] for s in final["report"]["sections"][2:]]==[2,12]
    assert len(final["recordings"])==3,final["recordings"]
    for recording in final["recordings"]:
        recorded=context.request.get(endpoint+"/recordings/"+recording["stageId"])
        assert recorded.status==200 and len(recorded.body())>100
        assert other.request.get(endpoint+"/recordings/"+recording["stageId"]).status==404
        upload_headers={**ORIGIN,"Content-Type":recorded.headers["content-type"]}
        retry=context.request.put(endpoint+"/recordings/"+recording["stageId"],headers=upload_headers,data=recorded.body())
        assert retry.status==200
        changed=context.request.put(endpoint+"/recordings/"+recording["stageId"],headers=upload_headers,data=recorded.body()+b"changed")
        assert changed.status==409
    page.reload()
    expect(page.locator(".exam-recordings audio")).to_have_count(3)
    page.locator(".exam-recordings audio").first.evaluate("audio => audio.load()")
    page.wait_for_function("document.querySelector('.exam-recordings audio').readyState >= 2")
    page.screenshot(path=str(ART/"ielts-results-desktop.png"),full_page=True)
    page.goto(BASE+"/dashboard")
    expect(page.locator(".mock-attempt-row")).to_have_count(2)
    for width in [390,320]:
        page.set_viewport_size({"width":width,"height":844})
        for path in ["/exams","/exams/sat-full-01","/exams/ielts-academic-01","/exams/attempts/"+sat_id,"/exams/attempts/"+ielts_id,"/dashboard"]:
            page.goto(BASE+path);page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"),(width,path)
            if width==390 and path=="/exams":page.screenshot(path=str(ART/"exams-grid-mobile.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("PASS: exam grid; SAT 98 delivered questions and both response types; IELTS 40+40, both essays and three stored audio recordings; private ownership, server clocks, early-transition prevention, refresh/resume, standard deadlines via isolated QA fixtures, results/history and mobile layouts.")

