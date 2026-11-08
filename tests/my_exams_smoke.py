"""Exam from a file: guest redirect, real server guards, then the upload -> sit -> grade loop with
the generation and grading responses MOCKED in the browser. No DeepSeek request is made.
"""
import io, json, os, re, sys, zipfile
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)
BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ORIGIN = {"Origin": BASE}
API = BASE + "/api/workspace/my-exams"
GRADE_API = API + "/grade"
TINY_PDF = ART / "my-exams-tiny.pdf"

QUESTIONS = [
    {
        "id": f"q{i}",
        "prompt": f"Question {i}: what does the cell structure do in this chapter?",
        "options": ["It carries out one life process.", "It stores the text.", "It changes the author.", "It removes the unit."],
        "topic": "Cell biology",
    }
    for i in range(1, 11)
]
KEY = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]
EXAM = {
    "title": "Cell biology exam", "language": "mn", "provider": "DeepSeek", "token": "wxe1." + "x" * 200,
    "suggestedSeconds": 900,
    "source": {"name": "notes.pdf", "kind": "pdf", "pages": 1, "truncated": False},
    "questions": QUESTIONS,
}

def office_zip(kind):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as z:
        if kind == "docx":
            z.writestr("word/document.xml", "<w:document><w:body><w:p><w:r><w:t>  </w:t></w:r></w:p></w:body></w:document>")
        else:
            z.writestr("ppt/presentation.xml", "<p:presentation/>")
            z.writestr("ppt/slides/slide1.xml", "<p:sld><a:p><a:r><a:t>  </a:t></a:r></a:p></p:sld>")
    return stream.getvalue()

def grade(key, answers):
    rows, correct = [], 0
    for i in range(1, 11):
        chosen = answers.get(f"q{i}")
        right = chosen == key[i - 1]
        correct += 1 if right else 0
        rows.append({
            "id": f"q{i}", "chosen": chosen, "answer": key[i - 1], "correct": right,
            "explanation": f"Explanation {i}: the first option matches the chapter.", "topic": "Cell biology",
        })
    return {"title": EXAM["title"], "gradedAt": 1760000000000, "total": 10, "correct": correct,
            "percent": round(correct / 10 * 100), "results": rows}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # A real PDF through Chromium: one visible line, less than the 80-character minimum.
    maker = browser.new_context().new_page()
    maker.set_content("<html><body><p>Dummy PDF file</p></body></html>")
    maker.pdf(path=str(TINY_PDF), format="A4")
    maker.context.close()

    # Guests are sent to sign-in before the page streams any chrome.
    guest = browser.new_context(viewport={"width": 1280, "height": 900})
    guest_page = guest.new_page()
    guest_page.goto(BASE + "/workspace/my-exams")
    expect(guest_page).to_have_url(re.compile(r"/login\?next=%2Fworkspace%2Fmy-exams"))
    guest.close()

    context = browser.new_context(viewport={"width": 1440, "height": 1000}, color_scheme="dark")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    signup = context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": "My Exam QA", "email": "qa-myexam-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert signup.ok, signup.status

    # Server guards, before any provider is reachable.
    assert context.request.post(API, headers=ORIGIN, data={"file": "x"}).status == 415, "JSON body is not a file upload"
    assert context.request.post(API, headers={"Origin": "https://untrusted.invalid"}, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()},
    }).status == 403, "cross-origin upload"
    assert context.request.post(API, headers=ORIGIN, multipart={"count": "10", "language": "mn"}).status == 400, "no file"
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ not a document"},
    }).status == 415, "unsupported extension"
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "7", "language": "mn",
    }).status == 400, "question count"
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "10", "language": "ru",
    }).status == 400, "exam language"
    tiny = context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "tiny.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "10", "language": "mn",
    })
    assert tiny.status == 422, tiny.status
    assert "хангалттай текст" in tiny.json()["error"], tiny.json()
    huge = context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)}, "count": "10", "language": "mn",
    })
    assert huge.status == 413, huge.status
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "10", "language": "mn", "userId": "other",
    }).status == 400, "extra form field"
    for kind in ("docx", "pptx"):
        # A failed extraction still releases its quota lease with the shared 3 s cooldown.
        page.wait_for_timeout(3200)
        empty = context.request.post(API, headers=ORIGIN, multipart={
            "file": {"name": "empty." + kind, "mimeType": "application/vnd.openxmlformats-officedocument", "buffer": office_zip(kind)}, "count": "10", "language": "mn",
        })
        assert empty.status == 422, (kind, empty.status, empty.text())

    # Grading guards: unauthenticated, cross-origin, malformed body and an unreadable token.
    anonymous = browser.new_context().request
    assert anonymous.post(GRADE_API, headers=ORIGIN, data={"token": "x" * 100, "answers": {}}).status == 401, "grade needs a session"
    assert context.request.post(GRADE_API, headers=ORIGIN, data="not json").status == 415, "JSON body"
    assert context.request.post(GRADE_API, headers={"Origin": "https://untrusted.invalid"}, data={"token": "x" * 100, "answers": {}}).status == 403, "cross-origin grade"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={"token": "x" * 100, "answers": {}}).status == 400, "bad token"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={"token": "x" * 100, "answers": {}, "userId": "other"}).status == 400, "extra grade field"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={"token": "x" * 100}).status == 400, "answers are required"

    page.goto(BASE + "/workspace/my-exams", wait_until="domcontentloaded")
    expect(page.locator("h1")).to_contain_text("Файлаа оруул")
    expect(page.locator(".wsp-nav a[href='/workspace/my-exams']")).to_have_attribute("aria-current", "page")
    expect(page.locator(".site-header")).to_be_hidden()
    expect(page.locator(".site-footer")).to_be_hidden()
    expect(page.get_by_text("Одоогоор шалгалт алга")).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-list-desktop.png"), full_page=True)

    generation_calls, grade_calls = [], []
    def mock_generation(route):
        generation_calls.append(route.request.post_data_buffer or b"")
        route.fulfill(status=200, content_type="application/json", body=json.dumps(EXAM))
    def mock_grade(route):
        body = route.request.post_data_json
        grade_calls.append(body)
        route.fulfill(status=200, content_type="application/json", body=json.dumps(grade(KEY, body.get("answers", {}))))
    page.route(re.compile(r"/api/workspace/my-exams$"), mock_generation)
    page.route(re.compile(r"/api/workspace/my-exams/grade$"), mock_grade)

    page.set_input_files('input[type="file"]', {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()})
    expect(page.get_by_text("notes.pdf")).to_be_visible()
    page.get_by_role("button", name="10", exact=True).click()
    page.get_by_role("button", name="English", exact=True).click()
    page.get_by_role("button", name="Шалгалт үүсгэх", exact=True).click()
    expect(page.get_by_role("heading", name="Cell biology exam")).to_be_visible(timeout=20000)
    assert generation_calls and b'name="count"' in generation_calls[0] and b'name="language"' in generation_calls[0], generation_calls[0][:300]
    assert b"\r\n10\r\n" in generation_calls[0] and b"\r\nen\r\n" in generation_calls[0], "selected count and language are sent"
    expect(page.get_by_text("10", exact=True).first).to_be_visible()
    expect(page.get_by_text("15 мин").first).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-briefing-desktop.png"), full_page=True)

    page.get_by_role("button", name=re.compile("Цагтай эхлэх")).click()
    expect(page.get_by_text("Хариултын хуудас")).to_be_visible()
    expect(page.locator("[role='timer']")).to_contain_text(re.compile(r"1[45]:\d\d"))
    expect(page.get_by_text("Асуулт 1 / 10")).to_be_visible()
    page.keyboard.press("1")
    expect(page.locator("input[type=radio]:checked")).to_have_count(1)
    page.get_by_role("button", name="Дараах").click()
    expect(page.get_by_text("Асуулт 2 / 10")).to_be_visible()
    page.keyboard.press("2")
    expect(page.locator("input[type=radio]:checked")).to_have_count(1)
    page.get_by_role("button", name="Тэмдэглэх").click()
    expect(page.locator("[class*='flagOn']")).to_be_visible()
    expect(page.locator("[class*='sheetCell']").nth(1)).to_have_attribute("aria-label", re.compile("тэмдэглэсэн"))
    expect(page.get_by_text("2 / 10 хариулсан")).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-runner-desktop.png"), full_page=True)

    # A reload returns to the library; the draft survives and resumes at the same question.
    page.reload(wait_until="domcontentloaded")
    expect(page.get_by_role("heading", name="Миний шалгалтууд")).to_be_visible()
    expect(page.get_by_text("Үргэлжилж байна")).to_be_visible()
    page.get_by_text("Cell biology exam").first.click()
    expect(page.get_by_text("Хариултын хуудас")).to_be_visible()
    expect(page.get_by_text("2 / 10 хариулсан")).to_be_visible()
    expect(page.get_by_text("Асуулт 2 / 10")).to_be_visible()

    # Answer all ten with the first option, then finish through the answer sheet.
    for number in range(1, 11):
        page.locator("[class*='sheetCell']").nth(number - 1).click()
        expect(page.get_by_text(f"Асуулт {number} / 10")).to_be_visible()
        page.keyboard.press("1")
    expect(page.get_by_text("10 / 10 хариулсан")).to_be_visible()
    page.get_by_role("button", name="Шалгалт дуусгах").click()
    expect(page.get_by_text("Шалгалтыг дуусгах уу?")).to_be_visible()
    page.get_by_role("button", name="Тийм, дуусгах").click()
    expect(page.get_by_role("heading", name="Cell biology exam")).to_be_visible(timeout=15000)
    expect(page.get_by_text("30%").first).to_be_visible()
    expect(page.get_by_text("3 / 10 зөв")).to_be_visible()
    expect(page.get_by_text("Алдсан").first).to_be_visible()
    expect(page.get_by_text("Хариулаагүй").first).to_be_visible()
    assert grade_calls and set(grade_calls[-1]["answers"].values()) == {0}, grade_calls[-1]
    assert grade_calls[-1]["answers"] == {f"q{i}": 0 for i in range(1, 11)}
    assert page.locator("article[class*='review']").count() == 10, "one review card per question"
    expect(page.get_by_text("Тайлбар").first).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-result-desktop.png"), full_page=True)

    page.get_by_role("button", name="Алдсан · 7").click()
    assert page.locator("article[class*='review']").count() == 7, "wrong filter"
    page.get_by_role("button", name="Хариулаагүй · 0").click()
    expect(page.get_by_text("Энэ шүүлтэд асуулт алга")).to_be_visible()
    page.get_by_role("button", name="Бүгд · 10").click()
    assert page.locator("article[class*='review']").count() == 10

    # The score survives a reload; opening the exam shows the last result.
    page.reload(wait_until="domcontentloaded")
    expect(page.get_by_role("heading", name="Миний шалгалтууд")).to_be_visible()
    expect(page.get_by_text("30%").first).to_be_visible()
    page.get_by_text("Cell biology exam").first.click()
    expect(page.get_by_text("Өмнөх дүн · 30%")).to_be_visible()
    page.get_by_role("button", name="Үр дүн харах").click()
    expect(page.get_by_text("30%").first).to_be_visible()

    # A retake starts fresh and keeps a draft when leaving.
    page.get_by_role("button", name=re.compile("Дахин өгөх")).click()
    page.get_by_role("button", name="Цаггүй эхлэх").click()
    expect(page.locator("[role='timer']")).to_be_visible()
    page.keyboard.press("1")
    page.locator("[class*='runnerBar']").get_by_role("button", name="Гарах").click()
    expect(page.get_by_text("Үргэлжилж байна").first).to_be_visible()

    # Mobile: no sideways scroll, the drawer reaches the tab, and the exam opens.
    mobile = browser.new_context(viewport={"width": 375, "height": 812}, color_scheme="light", storage_state=context.storage_state())
    m = mobile.new_page()
    m.on("pageerror", lambda error: errors.append(str(error)))
    m.goto(BASE + "/workspace/my-exams", wait_until="domcontentloaded")
    expect(m.get_by_role("heading", name="Миний шалгалтууд")).to_be_visible()
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll on mobile"
    m.get_by_role("button", name="Цэс нээх").click()
    expect(m.locator(".wsp-nav a[href='/workspace/my-exams']")).to_be_visible()
    m.screenshot(path=str(ART / "my-exams-mobile-drawer.png"), full_page=True)
    m.keyboard.press("Escape")
    m.wait_for_timeout(300)
    m.screenshot(path=str(ART / "my-exams-mobile.png"), full_page=True)
    m.get_by_text("Cell biology exam").first.click()
    expect(m.get_by_text("Хариултын хуудас")).to_be_visible()
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll in the runner"
    mobile.close()

    # A timed sitting submits itself when the clock runs out. The browser clock is fake here;
    # the grade route is still the real app route, with only its response mocked.
    clock_context = browser.new_context(viewport={"width": 1280, "height": 900})
    clock_page = clock_context.new_page()
    clock_page.on("pageerror", lambda error: errors.append(str(error)))
    clock_page.clock.install()
    clock_signup = clock_context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": "Clock QA", "email": "qa-clock-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert clock_signup.ok, clock_signup.status
    clock_calls = []
    def clock_generation(route):
        route.fulfill(status=200, content_type="application/json", body=json.dumps(EXAM))
    def clock_grade(route):
        body = route.request.post_data_json
        clock_calls.append(body)
        rows = [{"id": f"q{i}", "chosen": None, "answer": 0, "correct": False, "explanation": "Explanation.", "topic": "Cell biology"} for i in range(1, 11)]
        route.fulfill(status=200, content_type="application/json", body=json.dumps({
            "title": EXAM["title"], "gradedAt": 1760000000000, "total": 10, "correct": 0, "percent": 0, "results": rows,
        }))
    clock_page.route(re.compile(r"/api/workspace/my-exams$"), clock_generation)
    clock_page.route(re.compile(r"/api/workspace/my-exams/grade$"), clock_grade)
    clock_page.goto(BASE + "/workspace/my-exams", wait_until="domcontentloaded")
    clock_page.set_input_files('input[type="file"]', {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()})
    clock_page.get_by_role("button", name="Шалгалт үүсгэх", exact=True).click()
    expect(clock_page.get_by_role("heading", name="Cell biology exam")).to_be_visible(timeout=20000)
    clock_page.get_by_role("button", name=re.compile("Цагтай эхлэх")).click()
    clock_page.clock.fast_forward(16 * 60 * 1000)
    expect(clock_page.get_by_text("0%").first).to_be_visible(timeout=15000)
    assert clock_calls and clock_calls[0]["answers"] == {}, "an expired timed sitting submits its blanks"
    clock_context.close()

    # Client-side file checks never reach the API.
    page.get_by_role("button", name="Миний шалгалтууд").click()
    page.set_input_files('input[type="file"]', {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ"})
    expect(page.locator("p[role='alert']")).to_contain_text("PDF, Word")
    page.set_input_files('input[type="file"]', {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)})
    expect(page.locator("p[role='alert']")).to_contain_text("4 MB")

    # Deleting asks first, then leaves the empty state.
    page.on("dialog", lambda dialog: dialog.accept())
    page.get_by_role("button", name=re.compile("Cell biology exam шалгалтыг устгах")).click()
    expect(page.get_by_text("Одоогоор шалгалт алга")).to_be_visible()
    assert not errors, errors
    browser.close()
print("PASS: my-exams guest redirect, signed-in/origin/multipart/file/count/language/Office/oversize API guards, grade guards (no provider call), upload with mocked exam, briefing, timed runner, keyboard answers, flag, answer sheet, draft reload/resume, server-shaped grading with mocked grade, result stats/review filters, score persistence, untimed retake, timed auto-submit on a fake clock, mobile drawer and no horizontal scroll, client file checks, delete; no DeepSeek request made.")
