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

def fixture(action,attempt_id,*args):
    return json.loads(subprocess.check_output(["node","tests/mock_fixture.mjs",action,attempt_id,*args],cwd=ROOT,text=True,encoding="utf-8"))

# SAT 02–09 and IELTS 02–06 come from the site's revised authoring; IELTS 07–12 from the offline IELTS pack.
FORMS=[("sat","sat-full",n) for n in range(2,10)]+[("ielts","ielts-academic",n) for n in range(2,13)]
LAST={"sat":9,"ielts":12}
# Each audio route bundles only its own recordings (next.config.ts): Mocks 07–12 use /audio/forms.
def audio_path(program,n):
    return "/audio/forms" if program=="ielts" and n>6 else "/audio"
def other_audio_path(program,n):
    return "/audio" if audio_path(program,n)=="/audio/forms" else "/audio/forms"
def ielts_audio(n,part):
    return ROOT/(f"assets/exams/ielts-{n:02}-v2-part-{part}.mp3" if n<=6 else f"assets/ielts-forms/ielts-{n:02}-part-{part}.mp3")

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
    expect(page.locator(".library-list .exam-card")).to_have_count(5)
    for program,prefix in [("sat","sat-full"),("ielts","ielts-academic")]:
        page.goto(BASE+"/exams/"+program)
        expect(page.locator(".mock-variant")).to_have_count(LAST[program])
        for n in range(2,LAST[program]+1):
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
    for program,prefix,n in FORMS:
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
            if n<LAST[program]:
                assert context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":f"{prefix}-{n+1:02}"}).status==402
            started=context.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug})
            assert started.status==200,started.text()
            attempt_id=started.json()["id"]
            endpoint=BASE+"/api/mock-attempts/"+attempt_id
            initial=state(context,endpoint)
            assert initial["slug"]==slug and initial["report"] is None
            assert other.request.get(endpoint).status==404
            assert other.request.get(endpoint+audio_path(program,n)+"?part=1").status==404
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
                recording=context.request.get(endpoint+audio_path(program,n)+"?part=1")
                assert recording.status==200
                assert hashlib.sha256(recording.body()).digest()==hashlib.sha256(ielts_audio(n,1).read_bytes()).digest()
                partial=context.request.get(endpoint+audio_path(program,n)+"?part=1",headers={"Range":"bytes=2048-4095"})
                assert partial.status==206 and partial.body()==recording.body()[2048:4096]
                assert context.request.get(endpoint+audio_path(program,n)+"?part=2").status==403
                assert context.request.get(endpoint+audio_path(program,n)+"?part=../1").status==404
                # The other set's route never serves this form, even the part playing now.
                assert context.request.get(endpoint+other_audio_path(program,n)+"?part=1").status==404
            while not current["finishedAt"]:
                stage=current["stage"]
                answers=fixture("answers",attempt_id)
                response=context.request.patch(endpoint,headers=ORIGIN,data={"revision":current["revision"],"stageId":stage["id"],"responses":answers["responses"],"flags":[]})
                assert response.status==200,(slug,stage["id"],response.status,response.text())
                if (n==2 and stage["id"] in ["sat-math-1","ielts-reading","ielts-writing"]) or (program=="ielts" and n==5 and stage["id"]=="ielts-writing") or (n==7 and stage["id"] in ["ielts-listening","ielts-reading","ielts-writing"]):
                    page.goto(BASE+"/exams/attempts/"+attempt_id)
                    if stage["id"]=="ielts-writing" and n==2:
                        expect(page.get_by_role("table")).to_contain_text("Facility")
                        expect(page.locator("caption")).to_have_text("Academic Writing · Task 1 data")
                    if stage["id"]=="ielts-writing" and n==5:
                        diagram=page.locator('img[src="/ielts-mocks/bottle-recycling.svg"]')
                        expect(diagram).to_be_visible()
                        expect(page.get_by_role("link",name="View full-size diagram")).to_have_attribute("target","_blank")
                        # Lazy images start loading a frame after they appear: wait for the load, then require real pixels.
                        expect(diagram).to_have_js_property("complete",True)
                        assert diagram.evaluate("image=>image.naturalWidth>0")
                    if n==7 and stage["id"]=="ielts-listening":
                        page.locator('[data-part="2"]').click()
                        plan=page.locator('img[src="/ielts-mocks/mock-07-listening-plan.svg"]')
                        expect(plan).to_be_visible()
                        expect(plan).to_have_js_property("complete",True)
                        assert plan.evaluate("image=>image.naturalWidth>0")
                        expect(page.locator("#listening-part-title")).to_contain_text("riverside craft fair")
                    if n==7 and stage["id"]=="ielts-reading":
                        page.locator(".exam-question-map button, .question-strip button").filter(has_text="27").first.click()
                        expect(page.locator(".option-letter").first).to_have_text("i")
                    if n==7 and stage["id"]=="ielts-writing":
                        expect(page.get_by_role("table")).to_contain_text("65 and over")
                        expect(page.locator('img[src="/ielts-mocks/mock-07-writing-1.svg"]')).to_be_visible()
                    for theme in ["light","dark"]:
                        page.evaluate("theme=>document.documentElement.dataset.theme=theme",theme)
                        for width in [1440,390,320]:
                            page.set_viewport_size({"width":width,"height":1000})
                            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(slug,stage["id"],width,theme)
                            page.screenshot(path=str(ART/f"{slug}-{stage['id']}-{theme}-{width}.png"),full_page=True)
                    page.set_viewport_size({"width":1440,"height":1000})
                fixture("deadline",attempt_id)
                current=state(context,endpoint)
            report=current["report"]
            assert [(s["correct"],s["total"]) for s in report["sections"][:2]]==([(50,50),(40,40)] if program=="sat" else [(40,40),(40,40)])
            # Mocks 07–12 have nine Part 1 prompts, two rounding-off questions and six Part 3 prompts.
            speaking=12 if n<=6 else 18
            assert len(report["reviews"])==(98 if program=="sat" else 82+speaking)
            if program=="ielts":
                assert [s["pending"] for s in report["sections"]]==[0,0,2,speaking]
                for part in range(1,5):
                    audio=context.request.get(endpoint+audio_path(program,n)+f"?part={part}")
                    assert audio.status==200
                    assert hashlib.sha256(audio.body()).digest()==hashlib.sha256(ielts_audio(n,part).read_bytes()).digest()
            if program=="ielts":
                # Practice replays the same recording through its own route of the same set.
                practice=BASE+"/api/exam-practice/"+slug
                replay=context.request.get(practice+audio_path(program,n)+"?part=3")
                assert replay.status==200,(slug,replay.status,replay.text()[:200])
                assert hashlib.sha256(replay.body()).digest()==hashlib.sha256(ielts_audio(n,3).read_bytes()).digest()
                assert context.request.get(practice+other_audio_path(program,n)+"?part=3").status==404
            if program=="ielts" and n<=6:
                # Absence of a revision on an old snapshot must select legacy media,
                # even if its publishing/content version counter happens to be 2.
                fixture("audio-revision",attempt_id,"0")
                legacy=context.request.get(endpoint+"/audio?part=1")
                assert legacy.status==200
                assert hashlib.sha256(legacy.body()).digest()==hashlib.sha256((ROOT/f"assets/exams/ielts-{n:02}-part-1.mp3").read_bytes()).digest()
                fixture("audio-revision",attempt_id,"2")
                current=state(context,endpoint)
            assert context.request.patch(endpoint,headers=ORIGIN,data={"revision":current["revision"],"stageId":initial["stage"]["id"],"responses":{},"flags":[]}).status==409
            page.goto(BASE+"/exams/attempts/"+attempt_id)
            expect(page.locator(".exam-results")).to_be_visible()
            print(slug+": lifecycle, access, save/resume, exact report and media passed",flush=True)
    # The retired SAT and IELTS plans are not sold. The Гадаад хэл plan opens a mock once it is picked, 15 a plan month.
    for program in ["sat","ielts"]:
        assert other.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":program}).status==404
    order=other.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":"language"})
    assert order.status==200,order.text()
    assert other.request.post(BASE+"/api/subscriptions/orders/"+order.json()["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"}).status==200
    def pick(slug):
        return other.request.post(BASE+"/api/mock-picks",headers=ORIGIN,data={"slug":slug})
    assert other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"sat-full-02"}).status==402,"a plan mock opens only once picked"
    assert pick("eesh-math-2024-m1").status==402,"Гадаад хэл never opens ЭЕШ"
    picked=[f"sat-full-{n:02}" for n in range(2,LAST["sat"]+1)]+[f"ielts-academic-{n:02}" for n in range(2,9)]
    assert len(picked)==15
    for index,slug in enumerate(picked):
        chosen=pick(slug)
        assert chosen.status==200 and chosen.json()["kind"]=="picked" and chosen.json()["month"]["used"]==index+1,(slug,chosen.text())
        entitled=other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":slug})
        assert entitled.status==200,entitled.text()
        assert state(other,BASE+"/api/mock-attempts/"+entitled.json()["id"])["program"]==slug.split("-")[0]
    # Picking a picked mock again uses nothing; the sixteenth new mock this plan month is refused.
    again=pick("sat-full-02")
    assert again.status==200 and again.json()["month"]["used"]==15,again.text()
    full=pick("ielts-academic-12")
    assert full.status==409 and "15 mock-ийн сонголт дууссан" in full.json()["error"],full.text()
    assert other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"ielts-academic-12"}).status==402
    assert other.request.post(BASE+"/api/mock-attempts",headers=ORIGIN,data={"slug":"eesh-math-2024-m1"}).status==402
    page.goto(BASE+"/exams")
    for theme in ["light","dark"]:
        page.evaluate("theme=>document.documentElement.dataset.theme=theme",theme)
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":1000})
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
            page.screenshot(path=str(ART/f"catalog-{theme}-{width}.png"),full_page=True)
    assert not errors,errors
    browser.close()
print("Additional exams: all nineteen full lifecycles and all forty-four matching audio assets passed.")
