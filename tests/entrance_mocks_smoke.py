"""ЭЕШ library, briefing and sitting for the imported Mathematics, Physics and English mocks.
Covers the hub and subject tabs, access, a bought Mathematics paper marked out of 100, University Prep
access to Physics and English, the reading/part layout, and the retired old route and booklet."""
import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ORIGIN = {"Origin": BASE}
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)


def fixture(action, attempt_id, offset=None):
    args = ["node", "tests/mock_fixture.mjs", action, attempt_id]
    if offset is not None:
        args.append(str(offset))
    return json.loads(subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf-8"))


def buy(context, slug):
    order = context.request.post(BASE + "/api/mock-payments", headers=ORIGIN, data={"slug": slug})
    assert order.ok, (slug, order.status, order.text())
    paid = context.request.post(BASE + "/api/mock-payments/" + order.json()["id"] + "/confirm", headers=ORIGIN, data={"decision": "success"})
    assert paid.ok, (slug, paid.status, paid.text())


def fits(page, label):
    previous = page.viewport_size
    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"), (label, width)
        if label == "sit-english-reading":
            assert page.locator(".eesh-passage").bounding_box()["height"] <= 844 * .35, (label, width, "passage should leave room for the question")
        page.screenshot(path=str(ART / ("eesh-" + label + "-" + str(width) + ".png")), full_page=True)
    page.set_viewport_size(previous)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce", color_scheme="dark")
    page = context.new_page()
    page.on("dialog", lambda dialog: dialog.accept())
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    # The library and the ЭЕШ hub: five subjects, dense year cards, subject tabs.
    page.goto(BASE + "/exams")
    expect(page.locator(".library-list .exam-card")).to_have_count(5)
    expect(page.locator(".library-list .exam-card.entrance")).to_contain_text("194")
    page.screenshot(path=str(ART / "eesh-library-desktop.png"), full_page=True)
    page.goto(BASE + "/exams/eesh")
    expect(page.get_by_role("heading", name="ЭЕШ-ийн бүтэн mock", exact=True)).to_be_visible()
    expect(page.locator(".eesh-form")).to_have_count(55)
    expect(page.locator(".eesh-year")).to_have_count(11)
    page.screenshot(path=str(ART / "eesh-hub-math-desktop.png"), full_page=True)
    page.get_by_role("link", name="Физик", exact=False).first.click()
    expect(page).to_have_url(BASE + "/exams/eesh?subject=physics")
    expect(page.locator(".eesh-form")).to_have_count(60)
    page.get_by_role("link", name="Англи хэл", exact=False).first.click()
    expect(page.locator(".eesh-form")).to_have_count(40)
    fits(page, "hub-english")
    # Chemistry (no 2024 reference, so six years) and Biology have three forms a year.
    page.locator('.eesh-subject[href="/exams/eesh?subject=chemistry"]').click()
    expect(page).to_have_url(BASE + "/exams/eesh?subject=chemistry")
    expect(page.locator(".eesh-form")).to_have_count(18)
    expect(page.locator(".eesh-year")).to_have_count(6)
    page.locator('.eesh-subject[href="/exams/eesh?subject=biology"]').click()
    expect(page.locator(".eesh-form")).to_have_count(21)
    expect(page.locator(".eesh-year")).to_have_count(7)
    page.screenshot(path=str(ART / "eesh-hub-biology-desktop.png"), full_page=True)
    fits(page, "hub-biology")

    # A compact briefing keeps the facts and starts the paper; the old booklet route and mock are gone.
    page.goto(BASE + "/exams/eesh-math-2024-m1")
    expect(page.locator(".eesh-brief-main h1")).to_contain_text("2024")
    expect(page.locator(".eesh-facts")).to_contain_text("100")
    expect(page.locator(".eesh-brief-main")).to_contain_text("55")
    page.screenshot(path=str(ART / "eesh-briefing-desktop.png"), full_page=True)
    fits(page, "briefing")
    for path in ["/exams/eesh-math", "/exams/eesh-math-01", "/exams/eesh-english", "/exams/eesh-english-01",
                 "/exams/eec-english", "/exams/eec-math-2020", "/papers/attempts/anything"]:
        assert page.goto(BASE + path).status == 404, path
    assert context.request.post(BASE + "/api/paper-attempts", headers=ORIGIN, data={"slug": "eec-math-2020-a"}).status == 404

    # A learner without access is refused on the server.
    password = "Local-Test-" + uuid4().hex
    email = "qa-exam-entrance-" + uuid4().hex[:12] + "@example.invalid"
    assert context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={"name": "Entrance QA", "email": email, "password": password}).ok
    assert context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "eesh-math-2024-m1"}).status == 402

    # One bought Mathematics paper: 55 answers, one page at a time, answer sheet, marked out of 100.
    buy(context, "eesh-math-2024-m1")
    start = context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "eesh-math-2024-m1"})
    assert start.ok, (start.status, start.text())
    attempt = start.json()["id"]
    endpoint = BASE + "/api/mock-attempts/" + attempt
    page.goto(BASE + "/exams/attempts/" + attempt)
    expect(page.locator(".eesh-sit")).to_be_visible()
    expect(page.locator(".eesh-sit-timer")).to_be_visible()
    expect(page.locator(".eesh-question h2")).to_be_visible()
    expect(page.locator(".eesh-choices label")).to_have_count(5)
    page.screenshot(path=str(ART / "eesh-sit-math-desktop.png"), full_page=True)
    fits(page, "sit-math")
    page.get_by_role("button", name="Хариултын хуудас", exact=False).click()
    expect(page.locator(".eesh-sheet")).to_be_visible()
    expect(page.locator(".eesh-sheet-group")).to_have_count(2)
    page.screenshot(path=str(ART / "eesh-sheet-math-desktop.png"), full_page=False)
    page.get_by_role("button", name="2.1a", exact=True).click()
    expect(page.locator(".eesh-group h2")).to_contain_text("2.1")
    expect(page.locator(".eesh-part")).to_have_count(5)
    expect(page.locator(".eesh-figure img, .eesh-group img").first).to_be_visible()
    page.screenshot(path=str(ART / "eesh-task-math-desktop.png"), full_page=True)
    fits(page, "sit-math-task")

    data = context.request.get(endpoint).json()
    answers = fixture("answers", attempt)
    saved = context.request.patch(endpoint, headers=ORIGIN, data={"revision": data["revision"], "stageId": answers["stageId"], "responses": answers["responses"], "flags": []})
    assert saved.ok, (saved.status, saved.text())
    fixture("deadline", attempt, -1000)
    page.goto(BASE + "/exams/attempts/" + attempt)
    expect(page.locator(".eesh-results")).to_be_visible()
    expect(page.locator(".eesh-score")).to_contain_text("100")
    expect(page.locator(".eesh-review")).to_have_count(len(answers["responses"]))
    page.screenshot(path=str(ART / "eesh-result-math-desktop.png"), full_page=True)
    fits(page, "result-math")

    # University Prep opens Physics and English without per-paper purchases.
    order = context.request.post(BASE + "/api/subscriptions/orders", headers=ORIGIN, data={"program": "entrance"}).json()
    assert context.request.post(BASE + "/api/subscriptions/orders/" + order["id"] + "/confirm", headers=ORIGIN, data={"decision": "success"}).ok
    physics = context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "eesh-physics-2024-p1"})
    assert physics.ok, (physics.status, physics.text())
    page.goto(BASE + "/exams/attempts/" + physics.json()["id"])
    expect(page.locator(".eesh-question h2")).to_be_visible()
    expect(page.locator(".eesh-question .exam-figure img, .eesh-question img").first).to_be_visible()
    expect(page.locator(".scratchpad, .math-scratchpad").first).to_be_visible()
    page.screenshot(path=str(ART / "eesh-sit-physics-desktop.png"), full_page=True)
    fits(page, "sit-physics")

    english = context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "eesh-english-2024-e1"})
    assert english.ok, (english.status, english.text())
    page.goto(BASE + "/exams/attempts/" + english.json()["id"])
    expect(page.locator(".eesh-question h2")).to_contain_text("advice")
    page.get_by_role("button", name="Хариултын хуудас", exact=False).click()
    page.get_by_role("button", name="39", exact=True).click()
    expect(page.locator(".eesh-passage h2")).to_contain_text("Lost Wallet")
    expect(page.locator(".eesh-choices label")).to_have_count(5)
    page.screenshot(path=str(ART / "eesh-sit-english-reading-desktop.png"), full_page=True)
    fits(page, "sit-english-reading")
    page.get_by_role("button", name="Хариултын хуудас", exact=False).click()
    page.get_by_role("button", name="2.1a", exact=True).click()
    expect(page.locator(".eesh-group")).to_be_visible()
    expect(page.locator(".eesh-context")).to_contain_text("sea level")
    expect(page.locator(".eesh-part")).to_have_count(6)
    page.screenshot(path=str(ART / "eesh-sit-english-part2-desktop.png"), full_page=True)
    fits(page, "sit-english-part2")

    # Chemistry: Mongolian prompts, the scratchpad, and a Part II task of eight one-digit cells.
    chemistry = context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "eesh-chemistry-2026-c1"})
    assert chemistry.ok, (chemistry.status, chemistry.text())
    page.goto(BASE + "/exams/attempts/" + chemistry.json()["id"])
    expect(page.locator(".eesh-question h2")).to_have_attribute("lang", "mn")
    expect(page.locator(".scratchpad, .math-scratchpad").first).to_be_visible()
    page.get_by_role("button", name="Хариултын хуудас", exact=False).click()
    page.get_by_role("button", name="2.1a", exact=True).click()
    expect(page.locator(".eesh-part")).to_have_count(8)
    page.screenshot(path=str(ART / "eesh-sit-chemistry-part2-desktop.png"), full_page=True)
    fits(page, "sit-chemistry-part2")
    biology = context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "eesh-biology-2026-b1"})
    assert biology.ok, (biology.status, biology.text())
    page.goto(BASE + "/exams/attempts/" + biology.json()["id"])
    page.get_by_role("button", name="Хариултын хуудас", exact=False).click()
    page.get_by_role("button", name="4", exact=True).click()
    expect(page.locator(".eesh-question .exam-figure img, .eesh-question img").first).to_be_visible()
    fits(page, "sit-biology")

    # The Workspace home and the program page use the new hub.
    page.goto(BASE + "/workspace")
    expect(page.locator('.wsp-card[href="/exams/eesh"]')).to_be_visible()
    page.goto(BASE + "/programs/entrance")
    expect(page.locator(".program-official-card")).to_have_count(5)
    # A Next dev-only performance measure can report a negative timestamp; it is not an app error.
    errors = [error for error in errors if "negative time stamp" not in error]
    assert not errors, errors
    browser.close()

print("PASS: ЭЕШ catalogue and subject hub; compact briefing; access checks; Mathematics paper marked 100; Physics and English layouts.")
