"""Exam from a file: guest redirect, real server guards, then exams kept on the ACCOUNT. An exam a browser
saved before the move is imported, sat, autosaved, resumed on a second device, graded and deleted through the
real routes and the real database. Only the DeepSeek generation reply is MOCKED in the browser; no DeepSeek
request is made.
"""
import io, json, os, re, subprocess, sys, zipfile
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)
BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ORIGIN = {"Origin": BASE}
ELSEWHERE = {"Origin": "https://untrusted.invalid"}
API = BASE + "/api/workspace/my-exams"
GRADE_API = API + "/grade"
IMPORT_API = API + "/import"
TINY_PDF = ART / "my-exams-tiny.pdf"
UNKNOWN_ID = "cm0000000000000000000000"

# The fixture's exams: ten questions keyed A, B, C, D in turn. Answering A everywhere scores 3 / 10.
KEY = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]
QUESTIONS = [
    {
        "id": f"q{i}",
        "prompt": f"Question {i}: what does the cell structure do in this chapter?",
        "options": ["It carries out one life process.", "It stores the text.", "It changes the author.", "It removes the unit."],
        "topic": "Cell biology",
    }
    for i in range(1, 11)
]

def tokens(user_id, count=1, age_days=0):
    """Sealed exams like the ones a browser kept before the move, made for one disposable account."""
    out = subprocess.check_output(["node", "tests/my_exams_fixture.mjs", user_id, str(count), str(age_days)], cwd=ROOT, text=True, encoding="utf-8")
    return json.loads(out)

def office_zip(kind):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as z:
        if kind == "docx":
            z.writestr("word/document.xml", "<w:document><w:body><w:p><w:r><w:t>  </w:t></w:r></w:p></w:body></w:document>")
        else:
            z.writestr("ppt/presentation.xml", "<p:presentation/>")
            z.writestr("ppt/slides/slide1.xml", "<p:sld><a:p><a:r><a:t>  </a:t></a:r></a:p></p:sld>")
    return stream.getvalue()

def upload(request, name="notes.pdf", **fields):
    return request.post(API, headers=ORIGIN, multipart={
        "file": {"name": name, "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "10", "language": "mn", **fields,
    })

def move(request, token, **extra):
    return request.post(IMPORT_API, headers=ORIGIN, data={"token": token, "draft": None, "last": None, "attempts": 0, **extra})

def new_account(context, label):
    signup = context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": label, "email": "qa-myexam-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert signup.ok, signup.status
    return context.request.get(BASE + "/api/auth/get-session").json()["user"]["id"]

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
    user_id = new_account(context, "My Exam QA")

    # Generation guards, before any provider is reachable.
    assert context.request.post(API, headers=ORIGIN, data={"file": "x"}).status == 415, "JSON body is not a file upload"
    assert context.request.post(API, headers=ELSEWHERE, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()},
    }).status == 403, "cross-origin upload"
    assert context.request.post(API, headers=ORIGIN, multipart={"count": "10", "language": "mn"}).status == 400, "no file"
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ not a document"},
    }).status == 415, "unsupported extension"
    for bad_count in ("4", "21", "7.5", "ten"):
        assert upload(context.request, count=bad_count).status == 400, "question count " + bad_count
    assert upload(context.request, structure="x" * 501).status == 400, "structure request too long"
    assert upload(context.request, language="ru").status == 400, "exam language"
    # A page loaded before exams moved to the account still sends its own count: it is told to reload, before any credits.
    stale = upload(context.request, saved="0")
    assert stale.status == 409 and "дахин ачаалаад" in stale.json()["error"], stale.text()
    # Any count from 5 to 20 with a structure request passes validation; the tiny file is refused after it.
    tiny = upload(context.request, name="tiny.pdf", count="7", structure="Эхний 3 нь тодорхойлолт, дараагийнх нь бодлого.")
    assert tiny.status == 422, tiny.status
    assert "хангалттай текст" in tiny.json()["error"], tiny.json()
    huge = context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)}, "count": "10", "language": "mn",
    })
    assert huge.status == 413, huge.status
    assert upload(context.request, userId="other").status == 400, "extra form field"
    for kind in ("docx", "pptx"):
        # A failed extraction still releases its quota lease with the shared 3 s cooldown.
        page.wait_for_timeout(3200)
        empty = context.request.post(API, headers=ORIGIN, multipart={
            "file": {"name": "empty." + kind, "mimeType": "application/vnd.openxmlformats-officedocument", "buffer": office_zip(kind)}, "count": "10", "language": "mn",
        })
        assert empty.status == 422, (kind, empty.status, empty.text())

    # Saved-exam guards: every route needs a session and this site's origin, and only reads the exact shape.
    anonymous = browser.new_context().request
    grade_body = {"id": UNKNOWN_ID, "answers": {}, "elapsedSeconds": 5, "timed": False}
    assert anonymous.post(GRADE_API, headers=ORIGIN, data=grade_body).status == 401, "grade needs a session"
    assert anonymous.post(IMPORT_API, headers=ORIGIN, data={"token": "x" * 100}).status == 401, "import needs a session"
    assert anonymous.patch(API + "/" + UNKNOWN_ID, headers=ORIGIN, data={"action": "start", "mode": "timed", "startedAt": 5}).status == 401, "a sitting needs a session"
    assert anonymous.delete(API + "/" + UNKNOWN_ID, headers=ORIGIN).status == 401, "delete needs a session"
    assert context.request.post(GRADE_API, headers=ELSEWHERE, data=grade_body).status == 403, "cross-origin grade"
    assert context.request.post(IMPORT_API, headers=ELSEWHERE, data={"token": "x" * 100}).status == 403, "cross-origin import"
    assert context.request.patch(API + "/" + UNKNOWN_ID, headers=ELSEWHERE, data={"action": "start", "mode": "timed", "startedAt": 5}).status == 403, "cross-origin sitting"
    assert context.request.delete(API + "/" + UNKNOWN_ID, headers=ELSEWHERE).status == 403, "cross-origin delete"
    assert context.request.post(GRADE_API, headers=ORIGIN, data="not json").status == 415, "JSON body"
    assert context.request.post(GRADE_API, headers=ORIGIN, data=grade_body).status == 404, "an exam that does not exist"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={**grade_body, "id": "../x"}).status == 400, "exam id"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={**grade_body, "userId": "other"}).status == 400, "extra grade field"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={**grade_body, "percent": 100}).status == 400, "a score is never accepted"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={"id": UNKNOWN_ID}).status == 400, "answers are required"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={"token": "x" * 100, "answers": {}}).status == 400, "the old token request"
    assert context.request.delete(API + "/" + UNKNOWN_ID, headers=ORIGIN).status == 404, "delete of an unknown exam"
    assert context.request.patch(API + "/" + UNKNOWN_ID, headers=ORIGIN, data={"action": "finish"}).status == 400, "unknown sitting action"
    assert context.request.post(IMPORT_API, headers=ORIGIN, data={"token": "x" * 100, "title": "Injected"}).status == 400, "extra import field"
    # A token that does not open is reported, not stored: garbage, and another student's token.
    garbage = move(context.request, "wxe1." + "x" * 200)
    assert garbage.status == 200 and garbage.json() == {"exam": None, "refused": "invalid"}, garbage.text()
    borrowed = move(context.request, tokens("some-other-student")[0])
    assert borrowed.status == 200 and borrowed.json()["exam"] is None, borrowed.text()

    page.goto(BASE + "/workspace/my-exams", wait_until="domcontentloaded")
    expect(page.locator("h1")).to_contain_text("Файлаа оруул")
    expect(page.locator(".wsp-nav a[href='/workspace/my-exams']")).to_have_attribute("aria-current", "page")
    expect(page.locator(".site-header")).to_be_hidden()
    expect(page.locator(".site-footer")).to_be_hidden()
    expect(page.get_by_text("Одоогоор шалгалт алга")).to_be_visible()
    expect(page.get_by_text("0 / 5 · бүртгэлд")).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-list-desktop.png"), full_page=True)

    # Question count: the slider and the number box move together, and a typed size settles into 5–20.
    slider, box = page.get_by_label("Асуултын тоо", exact=True), page.get_by_label("Асуултын тоог бичих")
    cost = page.locator("[data-credit-action='exam']")
    expect(slider).to_have_value("10")
    expect(cost).to_have_attribute("data-credit-cost", "25")
    box.fill("17")
    expect(slider).to_have_value("17")
    expect(cost).to_have_attribute("data-credit-cost", "34")
    box.fill("3")
    expect(slider).to_have_value("17")
    box.blur()
    expect(box).to_have_value("5")
    expect(slider).to_have_value("5")
    box.fill("99")
    box.blur()
    expect(box).to_have_value("20")
    expect(cost).to_have_attribute("data-credit-cost", "40")
    expect(cost).to_contain_text("хамгийн ихдээ 40 кредит")
    slider.focus()
    page.keyboard.press("ArrowLeft")
    expect(box).to_have_value("19")
    box.fill("10")
    expect(page.get_by_text("Асуулт бүр 4 сонголттой")).to_have_count(0)
    expect(page.get_by_text("Хариултын түлхүүр шалгалт дуустал шифрлэгдэнэ")).to_have_count(0)

    # An exam this browser saved before the move: the page sends it to the account and forgets it here. The
    # browser claims a perfect score; the account keeps what the server grades from the sealed key (3 / 10).
    first_token = tokens(user_id)[0]
    claimed = [{"id": f"q{i}", "chosen": 0, "answer": 0, "correct": True, "explanation": "Claimed by the browser."} for i in range(1, 11)]
    page.evaluate("""([key, exam]) => localStorage.setItem(key, JSON.stringify([exam, { id: "broken", title: "No token" }]))""", [
        "education-my-exams-v1:" + user_id,
        {
            "id": "browser-exam-1", "title": "Renamed in the browser", "sourceName": "notes.pdf", "sourceKind": "pdf", "language": "mn",
            "createdAt": 1760000000000, "updatedAt": 1760000000000, "questions": QUESTIONS, "token": first_token, "suggestedSeconds": 900,
            "draft": None, "attempts": 2, "best": {"correct": 10, "total": 10, "percent": 100, "at": 1760000000000},
            "last": {"total": 10, "correct": 10, "percent": 100, "finishedAt": 1760000000000, "elapsedSeconds": 300, "timed": True, "results": claimed},
        },
    ])
    with page.expect_response(lambda response: response.url.endswith("/api/workspace/my-exams/import")) as moved:
        page.reload(wait_until="domcontentloaded")
    assert moved.value.status == 200 and moved.value.json()["imported"] is True, moved.value.text()
    expect(page.get_by_text("1 / 5 · бүртгэлд")).to_be_visible()
    expect(page.get_by_text("Cell biology exam").first).to_be_visible()
    expect(page.get_by_text("Renamed in the browser")).to_have_count(0)
    expect(page.locator("[class*='examScore']")).to_contain_text("30%")
    expect(page.get_by_text("100%")).to_have_count(0)
    left = page.evaluate("key => JSON.parse(localStorage.getItem(key) ?? '[]').map(item => item.id)", "education-my-exams-v1:" + user_id)
    assert left == ["broken"], left
    exam_id = moved.value.json()["exam"]["id"]
    served = moved.value.json()["exam"]
    assert all("answer" not in question and "explanation" not in question for question in served["questions"]), "the key never travels with the questions"
    assert served["last"]["correct"] == 3 and served["best"]["percent"] == 30 and served["attempts"] == 2, served["last"]
    # Sending the same token again changes nothing: one browser exam is one account exam.
    again = move(context.request, first_token)
    assert again.status == 200 and again.json()["imported"] is False and again.json()["exam"]["id"] == exam_id, again.text()
    # An exam sealed more than 30 days ago could no longer be graded in the browser; on the account it can.
    old = move(context.request, tokens(user_id, 2, 40)[1])
    assert old.status == 200 and old.json()["imported"] is True, old.text()
    old_id = old.json()["exam"]["id"]

    # Sitting rules on the old exam, straight on the API: a start, a save that must name the open sitting,
    # server grading from the stored key, and no saving into a sitting that was graded.
    sitting = API + "/" + old_id
    started = context.request.patch(sitting, headers=ORIGIN, data={"action": "start", "mode": "untimed", "startedAt": 1})
    assert started.status == 200 and started.json()["draft"]["startedAt"] > 1_700_000_000_000, "an impossible start time is replaced by the server's"
    opened_at = started.json()["draft"]["startedAt"]
    save = {"action": "save", "startedAt": opened_at, "answers": {"q1": 0, "q2": 0}, "index": 1, "flagged": ["q2"]}
    assert context.request.patch(sitting, headers=ORIGIN, data=save).status == 200
    assert context.request.patch(sitting, headers=ORIGIN, data={**save, "startedAt": opened_at - 1}).status == 409, "a save for another sitting"
    assert context.request.patch(sitting, headers=ORIGIN, data={**save, "answers": {"q11": 0}}).status == 400, "an answer for a question the exam does not have"
    assert context.request.patch(sitting, headers=ORIGIN, data={**save, "answers": {"q1": 7}}).status == 400, "an option that does not exist"
    assert context.request.patch(sitting, headers=ORIGIN, data={**save, "draft": {}}).status == 400, "extra sitting field"
    assert context.request.post(GRADE_API, headers=ORIGIN, data={"id": old_id, "answers": {"q11": 0}, "elapsedSeconds": 5, "timed": False}).status == 400, "foreign answer"
    graded = context.request.post(GRADE_API, headers=ORIGIN, data={"id": old_id, "answers": {"q1": 0, "q2": 0}, "elapsedSeconds": 42, "timed": False})
    assert graded.status == 200, graded.text()
    result = graded.json()["exam"]
    assert result["draft"] is None and result["attempts"] == 1 and result["last"]["correct"] == 1 and result["last"]["percent"] == 10, result["last"]
    assert [row["answer"] for row in result["last"]["results"]] == KEY and result["last"]["elapsedSeconds"] == 42, "the key and explanations arrive with the grade"
    assert context.request.patch(sitting, headers=ORIGIN, data=save).status == 409, "a graded sitting takes no more saves"

    # Another student cannot see, sit, grade, move or delete this exam.
    other = browser.new_context()
    other_id = new_account(other, "Other student")
    assert other.request.patch(sitting, headers=ORIGIN, data={"action": "start", "mode": "timed", "startedAt": opened_at}).status == 404
    assert other.request.post(GRADE_API, headers=ORIGIN, data={"id": old_id, "answers": {}, "elapsedSeconds": 1, "timed": False}).status == 404
    assert other.request.delete(sitting, headers=ORIGIN).status == 404
    assert move(other.request, first_token).json()["exam"] is None, "a token sealed for someone else"
    other_page = other.new_page()
    other_page.goto(BASE + "/workspace/my-exams", wait_until="domcontentloaded")
    expect(other_page.get_by_text("0 / 5 · бүртгэлд")).to_be_visible()
    assert other_id != user_id
    other.close()
    assert context.request.delete(sitting, headers=ORIGIN).status == 200, "the owner deletes it"
    assert context.request.delete(sitting, headers=ORIGIN).status == 404

    # Generation through the page, with only the provider's part mocked: the reply is an exam that really is
    # on the account, exactly what the route returns after saving one.
    made = move(context.request, tokens(user_id, 2)[1]).json()["exam"]
    generation_calls = []
    def mock_generation(route):
        generation_calls.append(route.request.post_data_buffer or b"")
        route.fulfill(status=200, content_type="application/json", body=json.dumps({
            "exam": made, "limit": 5, "provider": "DeepSeek", "source": {"name": "notes.pdf", "kind": "pdf", "pages": 1, "truncated": False},
        }))
    generation_route = re.compile(r"/api/workspace/my-exams$")
    page.route(generation_route, mock_generation)
    page.set_input_files('input[type="file"]', {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()})
    expect(page.locator("[class*='fileText']")).to_contain_text("notes.pdf")
    page.get_by_role("button", name="English", exact=True).click()
    page.get_by_label(re.compile("Шалгалтын бүтэц")).fill("Definitions first, then problems.")
    expect(page.get_by_text("33/500")).to_be_visible()
    page.get_by_role("button", name="Шалгалт үүсгэх", exact=True).click()
    expect(page.get_by_role("heading", name="Cell biology exam 2")).to_be_visible(timeout=20000)
    assert generation_calls and b'name="count"' in generation_calls[0] and b'name="language"' in generation_calls[0], generation_calls[0][:300]
    assert b"\r\n10\r\n" in generation_calls[0] and b"\r\nen\r\n" in generation_calls[0], "selected count and language are sent"
    assert b'name="structure"\r\n\r\nDefinitions first, then problems.\r\n' in generation_calls[0], "the structure request is sent"
    assert b'name="saved"' not in generation_calls[0], "the browser no longer reports its own count"
    expect(page.get_by_text("10", exact=True).first).to_be_visible()
    expect(page.get_by_text("15 мин").first).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-briefing-desktop.png"), full_page=True)
    page.unroute(generation_route)

    # A timed sitting on the new exam. Every answer is saved on the account.
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
    with page.expect_response(lambda response: response.request.method == "PATCH" and response.status == 200 and '"flagged":["q2"]' in (response.request.post_data or "")):
        page.get_by_role("button", name="Тэмдэглэх").click()
    expect(page.locator("[class*='flagOn']")).to_be_visible()
    expect(page.locator("[class*='sheetCell']").nth(1)).to_have_attribute("aria-label", re.compile("тэмдэглэсэн"))
    expect(page.get_by_text("2 / 10 хариулсан")).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-runner-desktop.png"), full_page=True)

    # A reload returns to the library; the sitting is on the account and resumes at the same question.
    page.reload(wait_until="domcontentloaded")
    expect(page.get_by_role("heading", name="Миний шалгалтууд")).to_be_visible()
    expect(page.get_by_text("2 / 5 · бүртгэлд")).to_be_visible()
    expect(page.get_by_text("Үргэлжилж байна")).to_be_visible()
    page.get_by_text("Cell biology exam 2").first.click()
    expect(page.get_by_text("Хариултын хуудас")).to_be_visible()
    expect(page.get_by_text("2 / 10 хариулсан")).to_be_visible()
    expect(page.get_by_text("Асуулт 2 / 10")).to_be_visible()

    # A second device: the same account with a clean browser (cookies only, nothing in local storage) sees both
    # exams and resumes the same sitting. Phone width: no sideways scroll, and the drawer reaches the tab.
    mobile = browser.new_context(viewport={"width": 375, "height": 812}, color_scheme="light", storage_state={"cookies": context.cookies(), "origins": []})
    m = mobile.new_page()
    m.on("pageerror", lambda error: errors.append(str(error)))
    m.goto(BASE + "/workspace/my-exams", wait_until="domcontentloaded")
    expect(m.get_by_role("heading", name="Миний шалгалтууд")).to_be_visible()
    expect(m.get_by_text("2 / 5 · бүртгэлд")).to_be_visible()
    expect(m.locator("[class*='examScore']")).to_contain_text("30%")
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll on mobile"
    m.get_by_role("button", name="Цэс нээх").click()
    expect(m.locator(".wsp-nav a[href='/workspace/my-exams']")).to_be_visible()
    m.screenshot(path=str(ART / "my-exams-mobile-drawer.png"), full_page=True)
    m.keyboard.press("Escape")
    m.wait_for_timeout(300)
    m.screenshot(path=str(ART / "my-exams-mobile.png"), full_page=True)
    m.get_by_text("Cell biology exam 2").first.click()
    expect(m.get_by_text("Хариултын хуудас")).to_be_visible()
    # The phone layout hides the title bar's counter; the answer sheet shows the same saved progress.
    expect(m.locator("[class*='sheetHead']")).to_contain_text("2 / 10")
    expect(m.get_by_role("button", name="Асуулт 2, хариулсан, тэмдэглэсэн")).to_be_visible()
    expect(m.get_by_text("Асуулт 2 / 10")).to_be_visible()
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll in the runner"
    mobile.close()

    # Answer all ten with the first option, then finish through the answer sheet. The server grades from its key.
    for number in range(1, 11):
        page.locator("[class*='sheetCell']").nth(number - 1).click()
        expect(page.get_by_text(f"Асуулт {number} / 10")).to_be_visible()
        page.keyboard.press("1")
    expect(page.get_by_text("10 / 10 хариулсан")).to_be_visible()
    page.get_by_role("button", name="Шалгалт дуусгах").click()
    expect(page.get_by_text("Шалгалтыг дуусгах уу?")).to_be_visible()
    with page.expect_response(lambda response: response.url.endswith("/api/workspace/my-exams/grade")) as grading:
        page.get_by_role("button", name="Тийм, дуусгах").click()
    sent = grading.value.request.post_data_json
    assert sent["id"] == made["id"] and sent["answers"] == {f"q{i}": 0 for i in range(1, 11)} and sent["timed"] is True, sent
    assert "token" not in sent and "percent" not in sent and "correct" not in sent, sent
    expect(page.get_by_role("heading", name="Cell biology exam 2")).to_be_visible(timeout=15000)
    expect(page.get_by_text("30%").first).to_be_visible()
    expect(page.get_by_text("3 / 10 зөв")).to_be_visible()
    expect(page.get_by_text("Алдсан").first).to_be_visible()
    expect(page.get_by_text("Хариулаагүй").first).to_be_visible()
    assert page.locator("article[class*='review']").count() == 10, "one review card per question"
    expect(page.get_by_text("Тайлбар").first).to_be_visible()
    page.screenshot(path=str(ART / "my-exams-result-desktop.png"), full_page=True)

    page.get_by_role("button", name="Алдсан · 7").click()
    assert page.locator("article[class*='review']").count() == 7, "wrong filter"
    page.get_by_role("button", name="Хариулаагүй · 0").click()
    expect(page.get_by_text("Энэ шүүлтэд асуулт алга")).to_be_visible()
    page.get_by_role("button", name="Бүгд · 10").click()
    assert page.locator("article[class*='review']").count() == 10

    # The score is on the account: it survives a reload, and opening the exam shows the last result.
    page.reload(wait_until="domcontentloaded")
    expect(page.get_by_role("heading", name="Миний шалгалтууд")).to_be_visible()
    expect(page.get_by_text("Үргэлжилж байна")).to_have_count(0)
    page.get_by_text("Cell biology exam 2").first.click()
    expect(page.get_by_text("Өмнөх дүн · 30%")).to_be_visible()
    page.get_by_role("button", name="Үр дүн харах").click()
    expect(page.get_by_text("30%").first).to_be_visible()

    # A retake starts fresh and keeps its sitting when leaving.
    page.get_by_role("button", name=re.compile("Дахин өгөх")).click()
    page.get_by_role("button", name="Цаггүй эхлэх").click()
    expect(page.locator("[role='timer']")).to_be_visible()
    page.keyboard.press("1")
    page.locator("[class*='runnerBar']").get_by_role("button", name="Гарах").click()
    expect(page.get_by_text("Үргэлжилж байна").first).to_be_visible()
    expect(page.get_by_text("1 / 10 хариулсан")).to_be_visible()
    # Leaving sends the last answer without waiting; the account has it after a reload.
    page.wait_for_timeout(800)
    page.reload(wait_until="domcontentloaded")
    page.get_by_text("Cell biology exam 2").first.click()
    expect(page.get_by_text("1 / 10 хариулсан")).to_be_visible()
    page.locator("[class*='runnerBar']").get_by_role("button", name="Гарах").click()
    page.get_by_role("button", name="Миний шалгалтууд").click()

    # A timed sitting submits itself when the clock runs out. The browser clock is fake here; the start and the
    # grade are the real routes, and the blanks score nothing.
    clock_context = browser.new_context(viewport={"width": 1280, "height": 900})
    clock_page = clock_context.new_page()
    clock_page.on("pageerror", lambda error: errors.append(str(error)))
    clock_page.clock.install()
    clock_id = new_account(clock_context, "Clock QA")
    clock_tokens = tokens(clock_id, 21)
    assert move(clock_context.request, clock_tokens[0]).json()["imported"] is True
    clock_page.goto(BASE + "/workspace/my-exams", wait_until="domcontentloaded")
    clock_page.get_by_text("Cell biology exam").first.click()
    clock_page.get_by_role("button", name=re.compile("Цагтай эхлэх")).click()
    expect(clock_page.get_by_text("Хариултын хуудас")).to_be_visible()
    with clock_page.expect_response(lambda response: response.url.endswith("/api/workspace/my-exams/grade")) as expired:
        clock_page.clock.fast_forward(16 * 60 * 1000)
    assert expired.value.request.post_data_json["answers"] == {}, "an expired timed sitting submits its blanks"
    expect(clock_page.get_by_text("0%").first).to_be_visible(timeout=15000)
    expect(clock_page.get_by_text("0 / 10 зөв")).to_be_visible()

    # Five saved exams fill a free account. The count is the account's, so the page shows the limit, never
    # uploads a sixth, and the server refuses one whatever the browser sends.
    for token in clock_tokens[1:5]:
        assert move(clock_context.request, token).json()["imported"] is True
    clock_page.reload(wait_until="domcontentloaded")
    expect(clock_page.get_by_text("5 / 5 · бүртгэлд")).to_be_visible()
    clock_page.set_input_files('input[type="file"]', {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()})
    expect(clock_page.locator("[class*='fileText']")).to_contain_text("notes.pdf")
    expect(clock_page.get_by_role("button", name="Шалгалт үүсгэх", exact=True)).to_be_disabled()
    expect(clock_page.get_by_text("Хадгалах 5 шалгалтын хязгаарт хүрсэн")).to_be_visible()
    expect(clock_page.get_by_role("link", name="Багц харах")).to_have_attribute("href", "/workspace/plans")
    expect(clock_page.locator("[data-credit-action='exam']")).to_have_count(0)
    clock_page.screenshot(path=str(ART / "my-exams-limit-desktop.png"), full_page=True)
    full = upload(clock_context.request)
    assert full.status == 409, full.status
    assert "5 шалгалтын хязгаарт" in full.json()["error"] and "IELTS эсвэл SAT" in full.json()["error"], full.json()
    # Clearing the browser changes nothing: the exams and the limit are on the account.
    clock_page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    clock_page.reload(wait_until="domcontentloaded")
    expect(clock_page.get_by_text("5 / 5 · бүртгэлд")).to_be_visible()
    assert upload(clock_context.request).status == 409, "a cleared browser is still full"
    # An IELTS plan raises the limit to fifteen, on the page and on the server.
    order = clock_context.request.post(BASE + "/api/subscriptions/orders", headers=ORIGIN, data={"program": "ielts"}).json()
    assert clock_context.request.post(BASE + "/api/subscriptions/orders/" + order["id"] + "/confirm", headers=ORIGIN, data={"decision": "success"}).ok
    clock_page.reload(wait_until="domcontentloaded")
    expect(clock_page.get_by_text("5 / 15 · бүртгэлд")).to_be_visible()
    clock_page.set_input_files('input[type="file"]', {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()})
    expect(clock_page.get_by_role("button", name="Шалгалт үүсгэх", exact=True)).to_be_enabled()
    expect(clock_page.get_by_text("Хадгалах 5 шалгалтын хязгаарт хүрсэн")).to_have_count(0)
    # With five saved the plan lets the request through to the file check; fifteen is the new ceiling.
    assert upload(clock_context.request, name="tiny.pdf").status == 422, "an IELTS plan keeps more than five exams"
    for token in clock_tokens[5:15]:
        assert move(clock_context.request, token).json()["imported"] is True
    plan_full = upload(clock_context.request, name="tiny.pdf")
    assert plan_full.status == 409 and "15 шалгалтын хязгаарт" in plan_full.json()["error"] and "багцтай бол" not in plan_full.json()["error"], plan_full.text()
    # Exams still in a browser may pass the plan's size when they move, but an account never keeps more than twenty.
    for token in clock_tokens[15:20]:
        assert move(clock_context.request, token).json()["imported"] is True
    overflow = move(clock_context.request, clock_tokens[20])
    assert overflow.status == 409 and "20 шалгалт" in overflow.json()["error"], overflow.text()
    clock_page.reload(wait_until="domcontentloaded")
    expect(clock_page.get_by_text("20 / 15 · бүртгэлд")).to_be_visible()
    clock_context.close()

    # Client-side file checks never reach the API.
    page.set_input_files('input[type="file"]', {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ"})
    expect(page.locator("p[role='alert']")).to_contain_text("PDF, Word")
    page.set_input_files('input[type="file"]', {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)})
    expect(page.locator("p[role='alert']")).to_contain_text("4 MB")

    # Deleting asks first and removes the exam from the account: it is gone after a reload too.
    page.on("dialog", lambda dialog: dialog.accept())
    with page.expect_response(lambda response: response.request.method == "DELETE") as deleted:
        page.get_by_role("button", name=re.compile("Cell biology exam 2 шалгалтыг устгах")).click()
    assert deleted.value.status == 200, deleted.value.status
    expect(page.get_by_text("1 / 5 · бүртгэлд")).to_be_visible()
    page.get_by_role("button", name=re.compile("Cell biology exam шалгалтыг устгах")).click()
    expect(page.get_by_text("Одоогоор шалгалт алга")).to_be_visible()
    page.reload(wait_until="domcontentloaded")
    expect(page.get_by_text("0 / 5 · бүртгэлд")).to_be_visible()
    expect(page.get_by_text("Одоогоор шалгалт алга")).to_be_visible()
    assert not errors, errors
    browser.close()
print("PASS: my-exams guest redirect, signed-in/origin/multipart/file/count 5-20/structure/language/Office/oversize generation guards and the stale-page refusal (no provider call), session/origin/shape/ownership guards on grade, sitting, delete and import, a browser exam moved to the account once with its claimed score re-graded from the sealed key, an expired token moved, question-count slider and per-question price badge, generation UI with only the provider reply mocked, briefing, timed runner, keyboard answers, flag, answer sheet, autosave to the account, reload and second-device resume, server grading from the stored key, result stats/review filters, score persistence, untimed retake saved on leaving, timed auto-submit on a fake clock, free 5 and IELTS 15 saved-exam limits counted on the account (cleared browser still full), 20-exam account ceiling, mobile drawer and no horizontal scroll, client file checks, delete from the account; no DeepSeek request made.")
