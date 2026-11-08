"""Record local product walkthroughs with disposable QA data; no provider calls.
Run against the existing preview: python scripts/record-homepage-demos.py
Requires Playwright, FFmpeg and the existing guarded mock_fixture.mjs.
"""
import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
if urlparse(BASE).hostname not in {"localhost", "127.0.0.1"}:
    raise RuntimeError("Record only the local site with disposable QA data")
ART = ROOT / "artifacts/home-recordings"
OUT = ROOT / "public/home"
ART.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
HEADERS = {"Origin": BASE}


def fixture(action, attempt):
    args = ["node", "tests/mock_fixture.mjs", action, attempt]
    if action == "deadline":
        args.append("-1500")
    return json.loads(subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf-8"))


def hold(page, milliseconds=1800):
    page.wait_for_timeout(milliseconds)


def click(page, locator):
    locator.scroll_into_view_if_needed()
    box = locator.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=16)
    hold(page, 400)
    locator.click()
    hold(page)


def finish(context, page, name):
    video = page.video
    context.close()
    source = video.path()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "0.6", "-i", str(source), "-vf", "fps=24", "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", str(OUT / (name + ".mp4"))], check=True)
    print("Recorded " + name, flush=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    setup = browser.new_context()
    signup = setup.request.post(BASE + "/api/auth/sign-up/email", headers=HEADERS, data={"name": "Demo Student", "email": "qa-exam-home-demo-" + uuid4().hex[:12] + "@example.invalid", "password": "Demo-" + uuid4().hex})
    assert signup.ok, "Local QA sign-up failed: " + str(signup.status)
    order = setup.request.post(BASE + "/api/mock-payments", headers=HEADERS, data={"slug": "sat-full-01"})
    assert order.ok, "Local simulated order failed"
    paid = setup.request.post(BASE + "/api/mock-payments/" + order.json()["id"] + "/confirm", headers=HEADERS, data={"decision": "success"})
    assert paid.ok, "Local simulated payment failed"
    state = setup.storage_state()

    def recording():
        context = browser.new_context(storage_state=state, viewport={"width": 1440, "height": 900}, color_scheme="light", reduced_motion="reduce", record_video_dir=str(ART), record_video_size={"width": 1440, "height": 900})
        context.add_init_script("""localStorage.setItem('education-theme','light');
          addEventListener('DOMContentLoaded',()=>{const cursor=document.createElement('i');cursor.style.cssText='position:fixed;left:-100px;top:-100px;width:22px;height:22px;border:2px solid #007aff;background:#007aff22;border-radius:50%;pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%)';document.body.append(cursor);addEventListener('pointermove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'});});""")
        context.route("**/api/labs/ielts-speaking/warm", lambda route: route.fulfill(status=200, body="{}"))
        return context, context.new_page()

    context, page = recording()
    page.goto(BASE + "/exams"); page.wait_for_load_state("networkidle"); hold(page)
    click(page, page.locator('.library-list a[href="/exams/sat"]').first)
    click(page, page.locator('a[href="/exams/sat-full-01"]').first)
    click(page, page.get_by_role("link", name="Дадлагын горим нээх", exact=False))
    expect(page.locator(".practice-session")).to_be_visible()
    page.screenshot(path=str(ART / "exam-practice-poster.png"))
    click(page, page.get_by_role("radio").nth(1))
    click(page, page.locator(".practice-actions .button").first)
    expect(page.locator(".practice-feedback")).to_be_visible()
    page.locator(".practice-feedback").scroll_into_view_if_needed(); hold(page, 3500)
    click(page, page.locator(".question-strip button").nth(1))
    hold(page, 2000)
    finish(context, page, "exam-practice")

    # Prepare a clearly labelled example review using the existing local-only QA fixture.
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

    context, page = recording()
    page.goto(BASE + "/workspace"); page.wait_for_load_state("networkidle"); hold(page, 2500)
    click(page, page.locator('.wsp-nav a[href="/workspace/review"]'))
    click(page, page.locator('.wsp-row[href="/workspace/review/' + attempt + '"]'))
    expect(page.locator(".wsp-score-card")).to_be_visible()
    page.screenshot(path=str(ART / "workspace-review-poster.png")); hold(page, 2300)
    click(page, page.locator(".wsp-filter button", has_text="Бүгд"))
    page.locator(".wsp-questions > li").first.scroll_into_view_if_needed(); hold(page, 3500)
    page.mouse.wheel(0, 400); hold(page, 2500)
    finish(context, page, "workspace-review")

    context, page = recording()
    page.goto(BASE + "/workspace/workshop"); page.wait_for_load_state("networkidle"); hold(page, 2200)
    click(page, page.locator('a[href="/labs/ielts-speaking"]').first)
    expect(page.get_by_role("radiogroup", name="Speaking partner")).to_be_visible()
    page.screenshot(path=str(ART / "workshop-poster.png")); hold(page, 2000)
    click(page, page.get_by_role("radiogroup", name="Speaking partner").get_by_role("radio").nth(2))
    click(page, page.get_by_role("radio", name="Practise one part", exact=True))
    click(page, page.get_by_role("button", name="2 · Long turn", exact=False))
    page.goto(BASE + "/labs/ielts-writing"); page.wait_for_load_state("networkidle"); hold(page, 1800)
    page.get_by_label("Автомат зөв бичиг", exact=True).select_option("off")
    editor = page.get_by_role("textbox", name="Таны бичвэр", exact=True)
    editor.scroll_into_view_if_needed()
    editor.press_sequentially("Online learning gives students the freedom to study at their own pace. A quiet place, a clear goal and a little practice every day can make a real difference.", delay=36)
    hold(page, 3000)
    finish(context, page, "workshop")
    setup.close(); browser.close()

for name in ["exam-practice", "workspace-review", "workshop"]:
    subprocess.run(["node", "--input-type=module", "-e", "import sharp from 'sharp';await sharp(process.argv[1]).webp({quality:86}).toFile(process.argv[2]);", str(ART / (name + "-poster.png")), str(OUT / (name + ".webp"))], cwd=ROOT, check=True)
print("Three local demos and posters saved to public/home", flush=True)
