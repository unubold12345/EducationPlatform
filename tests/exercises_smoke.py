"""Complete every public set; check cross-program saved attempts and workshops."""
import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ORIGIN = {"Origin": BASE}
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)
# Read trusted local fixtures; keys must not appear in browser props before submission.
SETS = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    "import {exerciseSets} from './src/modules/exercises/content.ts'; console.log(JSON.stringify(exerciseSets));",
], cwd=ROOT, text=True, encoding="utf-8"))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    # Full sets now require a matching monthly plan; acquire real mock subscriptions.
    page.goto(BASE + "/exercises/ielts-reading-library")
    expect(page.locator(".program-gate")).to_be_visible()
    page.get_by_role("link",name="Сарын эрх нээх",exact=False).click()
    page.wait_for_url("**/login?next=**")
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    page.get_by_label("Нэр",exact=True).fill("Exercise QA")
    page.get_by_label("Имэйл",exact=True).fill("qa-exercises-"+uuid4().hex[:12]+"@example.invalid")
    page.get_by_label("Нууц үг",exact=True).fill("Local-Test-"+uuid4().hex)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click()
    expect(page).to_have_url(BASE+"/subscribe/ielts",timeout=20000)
    page.get_by_role("button",name="Сарын эрх нээх",exact=False).click()
    expect(page.locator(".subscription-receipt")).to_be_visible()
    for paid_program in ["sat","entrance"]:
        order=context.request.post(BASE+"/api/subscriptions/orders",headers=ORIGIN,data={"program":paid_program}).json()
        receipt=context.request.post(BASE+"/api/subscriptions/orders/"+order["id"]+"/confirm",headers=ORIGIN,data={"decision":"success"})
        assert receipt.status==200 and receipt.json()["status"]=="PAID"
    for program in ["sat", "ielts", "entrance"]:
        page.goto(BASE + "/programs/" + program)
        page.wait_for_load_state("networkidle")
        expect(page.locator(".exercise-row")).to_have_count(4 if program == "sat" else 3)
        page.screenshot(path=str(ARTIFACTS / (program + "-library-desktop.png")), full_page=True)

    for exercise in SETS:
        slug = exercise["slug"]
        page.goto(BASE + "/exercises/" + slug)
        page.wait_for_load_state("networkidle")
        for q in exercise["questions"]:
            # HTML may escape text, so also check the hydrated serialized prop keys.
            assert q["explanation"] not in page.locator("body").inner_text()
        assert '"correct":' not in page.content() and '\\"correct\\":' not in page.content()
        assert '"explanation":' not in page.content() and '\\"explanation\\":' not in page.content()
        endpoint = BASE + "/api/exercises/" + slug
        assert context.request.post(endpoint, headers=ORIGIN, data={"answers": []}).status == 400
        assert context.request.post(endpoint, headers=ORIGIN, data={"answers": [-1] * 8}).status == 400
        assert context.request.post(endpoint, headers={**ORIGIN,"Content-Type":"text/plain"}, data="bad").status == 415
        assert context.request.post(endpoint, headers={**ORIGIN,"Content-Type":"application/json"}, data="bad").status == 400
        assert context.request.post(endpoint, headers=ORIGIN, data={"padding": "x" * 9000}).status == 413
        # Fully answer all 80 questions in the UI and verify server explanations.
        for i, question in enumerate(exercise["questions"]):
            page.get_by_role("radio").nth(question["correct"]).check()
            if i < 7:
                page.get_by_role("button", name="Дараах", exact=False).click()
        if slug == "ielts-reading-library":
            page.screenshot(path=str(ARTIFACTS / "ielts-reading-desktop.png"), full_page=True)
        if slug == "sat-algebra":
            page.route("**/api/exercises/" + slug, lambda route: route.abort())
            page.get_by_role("button", name="Хариугаа шалгах", exact=False).click()
            expect(page.locator('.error-message[role="alert"]')).to_be_visible()
            expect(page.get_by_role("radio").nth(exercise["questions"][-1]["correct"])).to_be_checked()
            page.unroute("**/api/exercises/" + slug)
        page.get_by_role("button", name="Хариугаа шалгах", exact=False).click()
        expect(page.locator(".score")).to_have_text("8 / 8")
        expect(page.locator(".review")).to_have_count(8)
        expect(page.locator(".result-summary h2")).to_be_focused()
        page.get_by_role("button", name="Дахин бодох", exact=False).click()
        assert not page.get_by_role("radio").nth(0).is_checked()
        wrong = [(q["correct"] + 1) % len(q["options"]) for q in exercise["questions"]]
        graded = context.request.post(endpoint, headers=ORIGIN, data={"answers": wrong, "score": 999})
        assert graded.status == 200 and graded.json()["score"] == 0
        assert "no-store" in graded.headers["cache-control"]
    assert context.request.post(BASE + "/api/exercises/not-a-set", data={"answers": []}).status == 404
    assert page.goto(BASE + "/exercises/not-a-set").status == 404
    assert page.goto(BASE + "/workshops/not-a-task").status == 404

    # Subscribed account saves and resumes across all three independent programs.
    assert context.request.post(BASE + "/api/attempts", headers=ORIGIN, data={"examId": "not-real"}).status == 404
    assert context.request.post(BASE + "/api/attempts", headers=ORIGIN, data={"examId": 42}).status == 400
    assert context.request.post(BASE + "/api/attempts", headers=ORIGIN, data={"examId": "x" * 9000}).status == 413
    for slug in ["ielts-reading-library", "entrance-physics", "sat-geometry"]:
        exercise = next(s for s in SETS if s["slug"] == slug)
        page.goto(BASE + "/exercises/" + slug)
        page.get_by_role("button", name="Бүртгэлд хадгалж хийх", exact=False).click()
        page.wait_for_url("**/learn/attempts/*")
        endpoint = BASE + "/api/attempts/" + page.url.rsplit("/", 1)[1]
        initial = context.request.get(endpoint).json()
        assert initial["program"] == exercise["program"]
        assert len(initial["questions"]) == 8 and initial["result"] is None
        assert all("correct" not in q and "explanation" not in q for q in initial["questions"])
        first = exercise["questions"][0]["correct"]
        page.get_by_role("radio").nth(first).check()
        expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан")
        page.reload()
        page.get_by_role("button", name="Бодлого 1", exact=True).click()
        expect(page.get_by_role("radio").nth(first)).to_be_checked()
        # Another start of the same set resumes it; another program remains separate.
        reopened = context.request.post(BASE + "/api/attempts", headers=ORIGIN, data={"examId": exercise["examId"]}).json()
        assert reopened["id"] == initial["id"]
        for i in range(1, 8):
            page.get_by_role("button", name="Бодлого " + str(i + 1), exact=True).click()
            page.get_by_role("radio").nth(exercise["questions"][i]["correct"]).check()
            expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан")
        saved = context.request.get(endpoint).json()
        results = page.evaluate("""async ({endpoint,revision,answers}) => Promise.all([1,2].map(async () => {
          const r = await fetch(endpoint+'/submit', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,answers})});
          return {status:r.status,body:await r.json()};
        }))""", {"endpoint": endpoint, "revision": saved["revision"], "answers": [q["correct"] for q in exercise["questions"]]})
        assert all(r["status"] == 200 and r["body"]["result"]["score"] == 8 for r in results), results
        assert results[0]["body"] == results[1]["body"]
        page.reload()
        expect(page.locator(".score")).to_have_text("8 / 8")
    page.goto(BASE + "/dashboard")
    expect(page.locator(".attempt-row")).to_have_count(3)

    workshops = ["ielts-writing-data", "ielts-writing-opinion", "ielts-speaking-place", "ielts-speaking-discussion"]
    for slug in workshops:
        page.goto(BASE + "/workshops/" + slug)
        response = page.get_by_label("Өөрийн хариуг бичээрэй" if "writing" in slug else "Төлөвлөгөө / хариуны буулгалт")
        response.fill("This is my practice answer.")
        expect(page.get_by_role("status")).to_contain_text("5 үг")
        page.get_by_role("button", name="Өөрийгөө шалгах", exact=False).click()
        expect(page.get_by_role("checkbox")).to_have_count(5)
        page.get_by_role("checkbox").first.check()
        with page.expect_download() as download:
            page.get_by_role("button", name="Хариугаа татах", exact=False).click()
        assert "This is my practice answer." in Path(download.value.path()).read_text(encoding="utf-8")
        page.locator(".model-response summary").click()
        expect(page.locator(".model-response>p")).to_be_visible()
        if slug == "ielts-writing-data":
            expect(page.locator("table tbody tr")).to_have_count(4)
            page.screenshot(path=str(ARTIFACTS / "ielts-writing-desktop.png"), full_page=True)

    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        paths = ["/programs/" + p for p in ["sat", "ielts", "entrance"]]
        paths += ["/exercises/" + s["slug"] for s in SETS]
        paths += ["/workshops/" + s for s in workshops]
        for path in paths:
            page.goto(BASE + path)
            page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width, path)
            if width == 320 and path in ["/programs/ielts", "/exercises/ielts-reading-library", "/workshops/ielts-writing-data", "/exercises/entrance-physics"]:
                page.screenshot(path=str(ARTIFACTS / (path.rsplit("/",1)[1] + "-mobile.png")), full_page=True)
    # An external return URL must never be followed, even for an authenticated user.
    page.goto(BASE + "/login?next=https://untrusted.invalid")
    expect(page).to_have_url(BASE + "/dashboard")
    assert not errors, errors
    browser.close()
print("PASS: all 80 questions, 10 sets, 4 workshops, private multi-program save/resume/history, identical concurrent submits, grading validation, return-path safety, downloads, and 320/390px layouts.")
