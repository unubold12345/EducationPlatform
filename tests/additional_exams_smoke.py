"""New mock lifecycles. Only existing trusted fixtures advance reserved local QA deadlines."""
import hashlib
import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ORIGIN={"Origin":BASE}
ART=ROOT/"artifacts/additional-exams"
ART.mkdir(parents=True,exist_ok=True)

def fixture(action,attempt_id):
    return json.loads(subprocess.check_output(["node","tests/mock_fixture.mjs",action,attempt_id],cwd=ROOT,text=True,encoding="utf-8"))

def state(context,endpoint):
    r=context.request.get(endpoint)
    assert r.status==200,(r.status,r.text())
    return r.json()

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"])
    context=browser.new_context(viewport={"width":1440,"height":1000},color_scheme="dark",reduced_motion="reduce",permissions=["microphone"])
    page=context.new_page()
    page.on("dialog",lambda dialog:dialog.accept() if dialog.type=="beforeunload" else dialog.dismiss())
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.goto(BASE+"/exams")
    expect(page.locator(".exam-card")).to_have_count(4)
    for program,prefix in [("sat","sat-full"),("ielts","ielts-academic")]:
        page.goto(BASE+"/exams/"+program)
        expect(page.locator(".mock-variant")).to_have_count(6)
        for n in range(2,7):
            slug=f"{prefix}-{n:02}"
            expect(page.locator(f'.mock-variant[href="/exams/{slug}"] strong')).to_have_text(f"Full Mock {n:02}")
            assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug}).status==401
    password="Local-Test-"+uuid4().hex
    created=context.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Additional Exam QA","email":"qa-exam-more-"+uuid4().hex[:12]+"@example.invalid","password":password})
    assert created.status==200,(created.status,"primary QA registration failed")
    other=browser.new_context()
    created=other.request.post(BASE+"/api/auth/sign-up/email",headers=ORIGIN,data={"name":"Other Additional Exam QA","email":"qa-exam-other-more-"+uuid4().hex[:12]+"@example.invalid","password":password})
    assert created.status==200,(created.status,"secondary QA registration failed")
    for category in ["sat","ielts"]:
        assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":category}).status==404
        assert context.request.post(BASE+"/api/mock-payments",headers=ORIGIN,data={"slug":category}).status==404
    for n in range(2,7):
        for program,prefix in [("sat","sat-full"),("ielts","ielts-academic")]:
            slug=f"{prefix}-{n:02}"
            page.goto(BASE+"/exams/"+slug)
            expect(page.get_by_role("heading",level=1)).to_contain_text(f"Full Mock {n:02}")
            assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug}).status==402
            order=context.request.post(BASE+"/api/mock-payments",headers=ORIGIN,data={"slug":slug})
            assert order.status==200,order.text()
            purchase=order.json()
            assert purchase["amountMnt"]==10000 and purchase["examSlug"]==slug
            assert context.request.post(BASE+"/api/mock-payments/"+purchase["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"}).status==200
            # Paying for this form never grants the other student's access, or a later form.
            assert other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug}).status==402
            if n<6:
                assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":f"{prefix}-{n+1:02}"}).status==402
            started=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug})
            assert started.status==200,started.text()
            attempt_id=started.json()["id"]
            endpoint=BASE+"/api/mock-attempts/"+attempt_id
            initial=state(context,endpoint)
            assert initial["slug"]==slug and initial["report"] is None
            assert other.request.get(endpoint).status==404
            assert other.request.get(endpoint+"/audio?part=1").status==404
            assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug}).json()["id"]==attempt_id
            for q in initial["stage"]["questions"]:
                assert all(key not in q for key in ["answers","explanation","pretest"])
            assert "variants" not in initial["stage"] and "definition" not in initial
            first=initial["stage"]["questions"][0]
            selected=first["options"][0] if "options" in first else "Sample answer"
            edit={"revision":initial["revision"],"stageId":initial["stage"]["id"],"responses":{first["id"]:selected},"flags":[first["id"]]}
            saved=context.request.patch(endpoint,headers=ORIGIN,data=edit)
            assert saved.status==200,saved.text()
            assert context.request.patch(endpoint,headers=ORIGIN,data=edit).status==409
            page.goto(BASE+"/exams/attempts/"+attempt_id)
            page.reload()
            expect(page.locator(".exam-toolbar .eyebrow")).to_contain_text(f"Full Mock {n:02}")
            current=state(context,endpoint)
            assert current["responses"][first["id"]]==selected and current["deadline"]==initial["deadline"]
            if program=="ielts":
                recording=context.request.get(endpoint+"/audio?part=1")
                assert recording.status==200
                assert hashlib.sha256(recording.body()).digest()==hashlib.sha256((ROOT/f"assets/exams/ielts-{n:02}-part-1.mp3").read_bytes()).digest()
                partial=context.request.get(endpoint+"/audio?part=1",headers={"Range":"bytes=2048-4095"})
                assert partial.status==206 and partial.body()==recording.body()[2048:4096]
                assert context.request.get(endpoint+"/audio?part=2").status==403
                assert context.request.get(endpoint+"/audio?part=../1").status==404
            while not current["finishedAt"]:
                stage=current["stage"]
                answers=fixture("answers",attempt_id)
                response=context.request.patch(endpoint,headers=ORIGIN,data={"revision":current["revision"],"stageId":stage["id"],"responses":answers["responses"],"flags":[]})
                assert response.status==200,(slug,stage["id"],response.status,response.text())
                if n==2 and stage["id"] in ["sat-math-1","ielts-reading","ielts-writing"]:
                    page.goto(BASE+"/exams/attempts/"+attempt_id)
                    if stage["id"]=="ielts-writing":
                        expect(page.get_by_role("table")).to_contain_text("Facility")
                        expect(page.locator("caption")).to_have_text("Academic Writing · Task 1 data")
                    for theme in ["light","dark"]:
                        page.evaluate("theme=>document.documentElement.dataset.theme=theme",theme)
                        for width in [1440,390,320]:
                            page.set_viewport_size({"width":width,"height":1000})
                            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(slug,stage["id"],width,theme)
                            page.screenshot(path=str(ART/f"{stage['id']}-{theme}-{width}.png"),full_page=True)
                    page.set_viewport_size({"width":1440,"height":1000})
                fixture("deadline",attempt_id)
                current=state(context,endpoint)
            report=current["report"]
            assert [(s["correct"],s["total"]) for s in report["sections"][:2]]==([(50,50),(40,40)] if program=="sat" else [(40,40),(40,40)])
            assert len(report["reviews"])==(98 if program=="sat" else 94)
            if program=="ielts":
                assert [s["pending"] for s in report["sections"]]==[0,0,2,12]
                for part in range(1,5):
                    audio=context.request.get(endpoint+f"/audio?part={part}")
                    assert audio.status==200
                    assert hashlib.sha256(audio.body()).digest()==hashlib.sha256((ROOT/f"assets/exams/ielts-{n:02}-part-{part}.mp3").read_bytes()).digest()
            assert context.request.patch(endpoint,headers=ORIGIN,data={"revision":current["revision"],"stageId":initial["stage"]["id"],"responses":{},"flags":[]}).status==409
            page.goto(BASE+"/exams/attempts/"+attempt_id)
            expect(page.locator(".exam-results")).to_be_visible()
            print(slug+": lifecycle, access, save/resume, exact report and media passed",flush=True)
    # A matching monthly plan covers each new form; a SAT plan does not grant IELTS.
    for program,prefix in [("sat","sat-full"),("ielts","ielts-academic")]:
        order=other.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":program})
        assert order.status==200,order.text()
        assert other.request.post(BASE+"/api/subscriptions/orders/"+order.json()["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"}).status==200
        for n in range(2,7):
            entitled=other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":f"{prefix}-{n:02}"})
            assert entitled.status==200,entitled.text()
            assert state(other,BASE+"/api/mock-attempts/"+entitled.json()["id"])["program"]==program
            if program=="sat":
                assert other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":f"ielts-academic-{n:02}"}).status==402
    page.goto(BASE+"/exams")
    for theme in ["light","dark"]:
        page.evaluate("theme=>document.documentElement.dataset.theme=theme",theme)
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":1000})
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
            page.screenshot(path=str(ART/f"catalog-{theme}-{width}.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("Additional exams: all ten full lifecycles and all twenty matching audio assets passed.")
