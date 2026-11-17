"""Step 1 of the homepage loops: capture sharp stills of the real local product for the three films.

Run against the local preview (3001) with the local database up:
  python -X utf8 scripts/home-loops/capture.py
Uses a disposable QA account, the simulated SAT payment and the guarded local deadline fixture, exactly like
scripts/record-homepage-demos.py; no provider calls. Writes artifacts/home-loops/capture/<shot>.png (2880 x 1800)
and shots.json with the on-screen boxes the films point at. Step 2 is build.mjs.
"""
import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent.parent
BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
if urlparse(BASE).hostname not in {"localhost", "127.0.0.1"}:
    raise RuntimeError("Capture only the local site with disposable QA data")
OUT = ROOT / "artifacts/home-loops/capture"
OUT.mkdir(parents=True, exist_ok=True)
HEADERS = {"Origin": BASE}
SIZE = {"width": 1440, "height": 900}
boxes = {}


def fixture(action, attempt):
    args = ["node", "tests/mock_fixture.mjs", action, attempt]
    if action == "deadline":
        args.append("-1500")
    return json.loads(subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf-8"))


def shot(page, name, **targets):
    """Save the viewport and remember where each named element is."""
    page.wait_for_timeout(350)
    page.mouse.move(-50, -50)
    found = {}
    for key, locator in targets.items():
        box = locator.bounding_box()
        assert box and box["width"] > 0, name + ": " + key + " is not on screen"
        found[key] = [round(box["x"]), round(box["y"]), round(box["width"]), round(box["height"])]
    boxes[name] = found
    page.screenshot(path=str(OUT / (name + ".png")))
    print("captured " + name, found, flush=True)


def ready(page):
    page.wait_for_load_state("networkidle")
    page.evaluate("document.fonts.ready")
    page.evaluate("window.scrollTo(0, 0)")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    setup = browser.new_context()
    signup = setup.request.post(BASE + "/api/auth/sign-up/email", headers=HEADERS, data={"name": "Demo Student", "email": "qa-exam-home-demo-" + uuid4().hex[:12] + "@example.invalid", "password": "Demo-" + uuid4().hex})
    assert signup.ok, "Local QA sign-up failed: " + str(signup.status)
    order = setup.request.post(BASE + "/api/mock-payments", headers=HEADERS, data={"slug": "sat-full-01"})
    assert order.ok, "Local simulated order failed"
    paid = setup.request.post(BASE + "/api/mock-payments/" + order.json()["id"] + "/confirm", headers=HEADERS, data={"decision": "success"})
    assert paid.ok, "Local simulated payment failed"

    # A clearly labelled sample result for the review film, through the local-only QA fixture.
    started = setup.request.post(BASE + "/api/mock-attempts", headers=HEADERS, data={"slug": "sat-full-01"})
    assert started.ok, "Sample sitting could not start"
    attempt = started.json()["id"]
    endpoint = BASE + "/api/mock-attempts/" + attempt
    for _ in range(6):
        data = setup.request.get(endpoint).json()
        if data.get("finishedAt"):
            break
        answers = fixture("answers", attempt)["responses"]
        responses = {key: value for index, (key, value) in enumerate(answers.items()) if index % 3 != 0}
        saved = setup.request.patch(endpoint, headers=HEADERS, data={"revision": data["revision"], "stageId": data["stage"]["id"], "responses": responses, "flags": []})
        assert saved.ok, "Sample answers were not saved"
        fixture("deadline", attempt)
    assert setup.request.get(endpoint).json().get("finishedAt"), "Sample result was not submitted"

    context = browser.new_context(storage_state=setup.storage_state(), viewport=SIZE, device_scale_factor=2, color_scheme="light", reduced_motion="reduce")
    context.add_init_script("localStorage.setItem('education-theme','light')")
    context.route("**/api/labs/ielts-speaking/warm", lambda route: route.fulfill(status=200, body="{}"))
    page = context.new_page()

    # Film 1: library -> SAT -> mock -> practice mode -> checked answer.
    page.goto(BASE + "/exams"); ready(page)
    sat = page.locator('.library-list a[href="/exams/sat"]').first
    sat.scroll_into_view_if_needed(); shot(page, "exam-1", target=sat)
    sat.click(); ready(page)
    mock = page.locator('a[href="/exams/sat-full-01"]').first
    mock.scroll_into_view_if_needed(); shot(page, "exam-2", target=mock)
    mock.click(); ready(page)
    practice = page.get_by_role("link", name="Дадлагын горим нээх", exact=False)
    practice.scroll_into_view_if_needed(); shot(page, "exam-3", target=practice)
    practice.click(); expect(page.locator(".practice-session")).to_be_visible(); ready(page)
    choice = page.get_by_role("radio").nth(1)
    option = choice.locator("xpath=ancestor::label[1]")
    option = option if option.count() else choice
    check = page.locator(".practice-actions .button").first
    shot(page, "exam-4a", target=option, question=page.locator(".practice-session"))
    choice.check(force=True)
    shot(page, "exam-4b", target=check)
    check.click(); expect(page.locator(".practice-feedback")).to_be_visible()
    page.locator(".practice-feedback").scroll_into_view_if_needed()
    shot(page, "exam-5", target=page.locator(".practice-feedback"))

    # Film 2: Workspace -> Review -> a result -> explanations.
    page.goto(BASE + "/workspace"); ready(page)
    review = page.locator('.wsp-nav a[href="/workspace/review"]')
    shot(page, "review-1", target=review)
    review.click(); ready(page)
    row = page.locator('.wsp-row[href="/workspace/review/' + attempt + '"]')
    shot(page, "review-2", target=row)
    row.click(); expect(page.locator(".wsp-score-card")).to_be_visible(); ready(page)
    everything = page.locator(".wsp-filter button", has_text="Бүгд")
    shot(page, "review-3", target=page.locator(".wsp-score-card"), filter=everything)
    everything.click()
    first = page.locator(".wsp-questions > li").first
    first.scroll_into_view_if_needed()
    shot(page, "review-4", target=first)

    # Film 3: Workshop -> Speaking partner -> Essay Studio -> Listening Lab.
    page.goto(BASE + "/workspace/workshop"); ready(page)
    speaking = page.locator('a[href="/labs/ielts-speaking"]').first
    shot(page, "workshop-1", target=speaking)
    speaking.click(); ready(page)
    partners = page.get_by_role("radiogroup", name="Speaking partner")
    expect(partners).to_be_visible()
    partner = partners.get_by_role("radio").nth(2)
    shot(page, "workshop-2a", target=partner, group=partners)
    partner.click()
    shot(page, "workshop-2b", target=partner, group=partners)
    page.goto(BASE + "/labs/ielts-writing"); ready(page)
    page.get_by_label("Автомат зөв бичиг", exact=True).select_option("off")
    editor = page.get_by_role("textbox", name="Таны бичвэр", exact=True)
    editor.scroll_into_view_if_needed()
    text = "Online learning gives students the freedom to study at their own pace. A quiet place, a clear goal and a little practice every day can make a real difference."
    words = text.split(" ")
    steps = 9
    shot(page, "workshop-3-0", target=editor)
    for step in range(1, steps + 1):
        part = " ".join(words[(step - 1) * len(words) // steps: step * len(words) // steps])
        editor.press_sequentially(("" if step == 1 else " ") + part)
        shot(page, "workshop-3-" + str(step), target=editor)
    page.goto(BASE + "/labs/ielts-listening"); ready(page)
    page.locator("[data-listening-phase]").wait_for()
    page.locator("audio").evaluate("a=>{a.currentTime=71;a.dispatchEvent(new Event('timeupdate'))}")
    page.wait_for_timeout(500)
    shot(page, "workshop-4", target=page.locator("[data-listening-phase]").locator("xpath=ancestor::div[audio][1]"), picker=page.get_by_role("navigation", name="Сонсголын тестүүд"))

    (OUT / "shots.json").write_text(json.dumps(boxes, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    context.close(); setup.close(); browser.close()
print("Stills and shots.json saved to " + str(OUT), flush=True)
