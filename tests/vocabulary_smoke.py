"""Workspace vocabulary: the real page and server guards, a manual word, edits, deletes,
server persistence across reloads and accounts, a MOCKED file import, and a full quiz.
No DeepSeek request is made: valid imports are answered by a browser route mock.
"""
import json, os, re, sys
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)
BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ORIGIN = {"Origin": BASE}
API = BASE + "/api/workspace/vocabulary"
IMPORT = API + "/import"
TINY_PDF = ART / "vocabulary-tiny.pdf"

SEED = [
    ("resilient", "тэсвэртэй"),
    ("scarce", "ховор"),
    ("meticulous", "нягт нямбай"),
    ("candid", "шударга"),
    ("deteriorate", "муудах"),
]
MOCK_WORDS = [
    {"id": f"m{i}", "term": term, "translation": translation, "example": None, "sourceName": "unit-3.pdf", "createdAt": "2026-11-09T08:00:00.000Z"}
    for i, (term, translation) in enumerate([
        ("abundant", "элбэг"), ("brittle", "хэврэг"), ("coherent", "уялдаатай"), ("diligent", "хичээнгүй"),
        ("eloquent", "уран цэцэн"), ("frugal", "гүйлгээч"), ("genuine", "жинхэнэ"), ("humble", "даруу"),
        ("intricate", "нарийн төвөгтэй"), ("jubilant", "баяр хөөртэй"),
    ], start=1)
]
IMPORT_REPLY = {
    "words": MOCK_WORDS, "added": 10, "duplicates": 1, "skipped": 0, "total": 15, "limit": 100, "requested": 50,
    "source": {"name": "unit-3.pdf", "kind": "pdf", "pages": 2, "truncated": False},
    "language": "en", "provider": "DeepSeek",
    "credits": {"action": "vocabulary-import", "spent": 3, "balance": 97, "allowance": 100},
}


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # A real PDF through Chromium with less than the server's 40-character minimum.
    maker = browser.new_context().new_page()
    maker.set_content("<html><body><p>Dummy PDF file</p></body></html>")
    maker.pdf(path=str(TINY_PDF), format="A4")
    maker.context.close()

    # Guests are sent to sign-in before the page streams any chrome; the old address follows.
    for address in ("/workspace/vocabulary", "/workspace/flashcards"):
        guest = browser.new_context(viewport={"width": 1280, "height": 900})
        guest_page = guest.new_page()
        guest_page.goto(BASE + address)
        expect(guest_page).to_have_url(re.compile(r"/login\?next=%2Fworkspace%2Fvocabulary"), timeout=15000)
        guest.close()

    context = browser.new_context(viewport={"width": 1440, "height": 1000}, color_scheme="dark")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    signup = context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": "Vocabulary QA", "email": "qa-vocab-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert signup.ok, signup.status

    # Anonymous calls and same-origin/body guards, before any provider is reachable.
    anonymous = browser.new_context()
    assert anonymous.request.post(API, headers=ORIGIN, data={"term": "x", "translation": "y"}).status == 401, "login is required"
    anonymous.close()
    assert context.request.post(API, headers={"Origin": "https://untrusted.invalid"}, data={"term": "x", "translation": "y"}).status == 403, "cross-origin add"
    assert context.request.post(API, data={"term": "x", "translation": "y"}).status == 403, "missing origin add"
    assert context.request.post(API, headers=ORIGIN, data={"term": "x", "translation": "y", "userId": "other"}).status == 400, "extra field"
    assert context.request.post(API, headers=ORIGIN, data={"term": "   ", "translation": "y"}).status == 400, "blank term"
    assert context.request.post(API, headers=ORIGIN, data={"term": "x" * 161, "translation": "y"}).status == 400, "long term"
    assert context.request.delete(API + "/words/not-a-real-id", headers=ORIGIN).status == 400, "malformed word id"
    assert context.request.delete(API + "/words/" + "a" * 32, headers=ORIGIN).status == 404, "unknown word"
    assert context.request.patch(API + "/words/" + "a" * 32, data={"term": "x", "translation": "y"}).status == 403, "cross-origin edit"

    # File import guards.
    assert context.request.post(IMPORT, headers=ORIGIN, data={"file": "x"}).status == 415, "JSON is not a file upload"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={"language": "mn"}).status == 400, "no file"
    assert context.request.post(IMPORT, headers={"Origin": "https://untrusted.invalid"}, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()},
    }).status == 403, "cross-origin import"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ not a document"},
    }).status == 415, "unsupported extension"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()},
        "language": "mn", "userId": "other",
    }).status == 400, "extra import field"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "language": "mn", "prompt": "x" * 501,
    }).status == 400, "prompt is bounded"
    for bad_count in ("0", "121", "abc", "2.5"):
        assert context.request.post(IMPORT, headers=ORIGIN, multipart={
            "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "language": "mn", "count": bad_count,
        }).status == 400, "word count is bounded: " + bad_count
    huge = context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)}, "language": "mn",
    })
    assert huge.status == 413, huge.status
    tiny = context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "tiny.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "language": "mn", "count": "10",
    })
    assert tiny.status == 422, (tiny.status, tiny.text())
    assert "хангалттай текст" in tiny.json()["error"], tiny.json()
    # The failed request still holds its 3-second lease, so one upload runs at a time.
    again = context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "tiny.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "language": "mn",
    })
    assert again.status == 429, (again.status, again.text())
    page.wait_for_timeout(3300)

    # Seed real server words through the public API (the bank is account storage, not localStorage).
    ids = {}
    for term, translation in SEED:
        created = context.request.post(API, headers=ORIGIN, data={"term": term, "translation": translation})
        assert created.status == 201, (term, created.status, created.text())
        ids[term] = created.json()["word"]["id"]
    duplicate = context.request.post(API, headers=ORIGIN, data={"term": "  RESILIENT ", "translation": "давхар"})
    assert duplicate.status == 409, duplicate.status

    page.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(page.locator("h1")).to_contain_text("Үгээ цуглуул")
    expect(page.locator(".wsp-nav a[href='/workspace/vocabulary']")).to_have_attribute("aria-current", "page")
    expect(page.locator(".site-header")).to_be_hidden()
    expect(page.locator(".site-footer")).to_be_hidden()
    expect(page.locator("li[data-term='resilient']")).to_contain_text("тэсвэртэй")
    expect(page.locator("[class*='countCard'] strong")).to_have_text("5")
    expect(page.locator("[class*='countCard']")).to_contain_text("100 хүртэл")
    # The import is priced by words saved: the badge shows the most the chosen count can cost.
    cost = page.locator("[data-credit-action='vocabulary-import']")
    expect(cost).to_contain_text("хамгийн ихдээ 9 кредит")
    page.get_by_role("button", name="10", exact=True).click()
    expect(cost).to_have_attribute("data-credit-cost", "8")
    # "All" asks for at most the 95 words of room left in the free bank, so it holds less than 120 would.
    page.get_by_role("button", name="Бүгд", exact=True).click()
    expect(cost).to_have_attribute("data-credit-cost", "15")
    expect(page.locator("[aria-label='Нэг файлаас нэмэх үгийн тоо']")).to_contain_text("Санд 95 үгийн зай үлдсэн")
    expect(page.locator("[class*='hint']")).to_contain_text("Файлд өөрийн орчуулга байвал түүнийг ашиглана")
    expect(page.locator("[class*='hint']")).to_contain_text("AI-ийн орчуулга үргэлж зөв биш")
    expect(page.locator("[aria-label='Файлд орчуулга байхгүй үеийн орчуулгын хэл']")).to_contain_text("Файлд орчуулга байхгүй үед")
    page.evaluate("document.documentElement.dataset.theme = 'light'")
    page.wait_for_timeout(350)
    page.screenshot(path=str(ART / "vocabulary-bank-desktop.png"), full_page=True)
    # Visual check of the dark palette; the shared theme toggle has its own suite.
    page.evaluate("document.documentElement.dataset.theme = 'dark'")
    page.wait_for_timeout(350)
    page.screenshot(path=str(ART / "vocabulary-bank-dark.png"), full_page=True)
    page.evaluate("document.documentElement.dataset.theme = 'light'")
    page.wait_for_timeout(350)

    # Manual add through the real page and real API.
    page.get_by_label("Үг эсвэл хэллэг", exact=True).fill("take off")
    page.get_by_label("Орчуулга", exact=True).fill("хөөрөх")
    page.get_by_label(re.compile("Жишээ өгүүлбэр")).fill("The plane took off on time.")
    page.get_by_role("button", name="Сандаа нэмэх", exact=True).click()
    expect(page.locator("[class*='notice']")).to_contain_text("үг хадгалагдлаа")
    expect(page.locator("li[data-term='take off']")).to_contain_text("хөөрөх")
    expect(page.locator("[class*='countCard'] strong")).to_have_text("6")

    # Edit and delete are server writes, not browser-only state.
    row = page.locator("li[data-term='resilient']")
    row.get_by_role("button", name="resilient үгийг засах").click()
    editor = page.locator("li[data-term='resilient']")
    editor.locator("input").nth(1).fill("тэсвэртэй, уян хатан")
    editor.get_by_role("button", name="Хадгалах", exact=True).click()
    expect(page.locator("li[data-term='resilient']")).to_contain_text("тэсвэртэй, уян хатан")

    page.on("dialog", lambda dialog: dialog.accept())
    page.locator("li[data-term='deteriorate']").get_by_role("button", name="deteriorate үгийг устгах").click()
    expect(page.locator("[class*='notice']")).to_contain_text("устгагдлаа")
    expect(page.locator("li[data-term='deteriorate']")).to_have_count(0)
    expect(page.locator("[class*='countCard'] strong")).to_have_text("5")

    page.reload(wait_until="domcontentloaded")
    expect(page.locator("li[data-term='take off']")).to_contain_text("хөөрөх")
    expect(page.locator("li[data-term='resilient']")).to_contain_text("тэсвэртэй, уян хатан")
    expect(page.locator("li[data-term='deteriorate']")).to_have_count(0)
    expect(page.locator("[class*='countCard'] strong")).to_have_text("5")

    # Another account cannot read, edit or delete the first account's word.
    other = browser.new_context(viewport={"width": 1280, "height": 900})
    other_signup = other.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": "Vocabulary Other", "email": "qa-vocab-other-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert other_signup.ok, other_signup.status
    stolen = other.request.patch(API + "/words/" + ids["resilient"], headers=ORIGIN, data={"term": "hijack", "translation": "булаах"})
    assert stolen.status == 404, (stolen.status, stolen.text())
    stolen_delete = other.request.delete(API + "/words/" + ids["resilient"], headers=ORIGIN)
    assert stolen_delete.status == 404, (stolen_delete.status, stolen_delete.text())
    other_page = other.new_page()
    other_page.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(other_page.get_by_text("Үгсийн сан хоосон байна")).to_be_visible()
    expect(other_page.locator("li[data-term='take off']")).to_have_count(0)
    other.close()

    # File import is mocked in the browser; the real API guards were checked above.
    calls = []
    def mock(route):
        calls.append(route.request.post_data_buffer or b"")
        route.fulfill(status=200, content_type="application/json", body=json.dumps(IMPORT_REPLY))
    page.route("**/api/workspace/vocabulary/import", mock)
    page.set_input_files('input[type="file"]', {"name": "unit-3.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()})
    expect(page.get_by_text("unit-3.pdf")).to_be_visible()
    page.locator("textarea").fill("Энэ эссэгээс 20 чухал үг сонгоод орчуул.")
    page.get_by_role("button", name="English", exact=True).click()
    page.get_by_role("button", name="50", exact=True).click()
    expect(page.locator("[data-credit-action='vocabulary-import']")).to_have_attribute("data-credit-cost", "12")
    page.get_by_role("button", name="Үг оруулах", exact=True).click()
    expect(page.locator("[class*='notice']")).to_contain_text("10 үг таны санд нэмэгдлээ")
    expect(page.locator("[class*='notice']")).to_contain_text("3 кредит зарцууллаа")
    expect(page.locator("li[data-term='brittle']")).to_be_visible()
    assert calls and b'name="language"' in calls[0] and b"\r\nen\r\n" in calls[0], calls[0][:300] if calls else b""
    assert b'name="prompt"' in calls[0], "the optional selection prompt is sent"
    assert "Энэ эссэгээс 20 чухал үг сонгоод орчуул.".encode("utf-8") in calls[0], "the prompt text is sent"
    assert b'name="count"\r\n\r\n50\r\n' in calls[0], "the chosen word count is sent"
    expect(page.locator("[class*='countCard'] strong")).to_have_text("15")

    # Search filters term, translation and example, then clears.
    search = page.get_by_role("searchbox")
    search.fill("brittle")
    expect(page.locator("li[data-term]")).to_have_count(1)
    search.fill("")
    expect(page.locator("li[data-term]")).to_have_count(15)

    # Full quiz with the keyboard: 10 questions, mixed choices, a result screen and a retake.
    page.get_by_role("button", name="Quiz эхлэх", exact=True).click()
    expect(page.get_by_role("heading", name="Quiz тохируулах")).to_be_visible()
    page.get_by_role("button", name="Үг → орчуулга", exact=True).click()
    page.get_by_role("button", name="Quiz эхлэх", exact=True).click()
    expect(page.locator("[class*='questionPrompt']")).to_be_visible()
    expect(page.locator("[class*='quizTopTitle']")).to_contain_text("1 / 10")
    page.screenshot(path=str(ART / "vocabulary-quiz-desktop.png"), full_page=True)

    expected_hits = 0
    for number in range(10):
        page.keyboard.press("1")
        next_button = page.get_by_role("button", name=re.compile(r"^(Дараах|Дуусгах)$"))
        expect(next_button).to_be_enabled()
        # The correct option is revealed after answering; "1" always chooses the first option.
        classes = page.locator("[class*='optionButton']").evaluate_all("nodes => nodes.map(node => node.className)")
        assert sum("optionCorrect" in value for value in classes) == 1, classes
        if "optionCorrect" in classes[0]:
            expected_hits += 1
        page.keyboard.press("Enter")
        if number < 9:
            expect(page.locator("[class*='quizTopTitle']")).to_contain_text(f"{number + 2} / 10")
    expect(page.get_by_text("QUIZ ДУУССАН")).to_be_visible()
    shown_hits = int(page.locator("[class*='quizScore'] strong").inner_text())
    assert shown_hits == expected_hits, (shown_hits, expected_hits)
    expect(page.get_by_role("button", name="Дахин авах", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Үгс рүү буцах", exact=True).first).to_be_visible()
    page.screenshot(path=str(ART / "vocabulary-done-desktop.png"), full_page=True)
    page.get_by_role("button", name="Дахин авах", exact=True).click()
    expect(page.locator("[class*='quizTopTitle']")).to_contain_text("1 / 10")
    page.locator("[class*='quizTop']").get_by_role("button", name="Гарах", exact=True).click()
    expect(page.get_by_role("heading", name="Миний үгс")).to_be_visible()

    # A free bank holds 100 words: the 101st word and any import are refused before credits are held.
    cap = browser.new_context(viewport={"width": 1280, "height": 900})
    cap_signup = cap.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": "Vocabulary Cap", "email": "qa-vocab-cap-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert cap_signup.ok, cap_signup.status
    for index in range(100):
        made = cap.request.post(API, headers=ORIGIN, data={"term": f"capword{index}", "translation": f"үг {index}"})
        assert made.status == 201, (index, made.status, made.text())
    assert made.json()["total"] == 100 and made.json()["limit"] == 100, made.json()
    over = cap.request.post(API, headers=ORIGIN, data={"term": "one more", "translation": "дахин"})
    assert over.status == 409 and "100 үгийн хязгаартаа хүрсэн" in over.json()["error"], (over.status, over.text())
    assert "IELTS эсвэл SAT багцтай бол 3,000 үг" in over.json()["error"], over.json()
    # A 409, not the tiny file's 422: the full bank is refused before the file is read or credits are held.
    full_import = cap.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "tiny.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "language": "mn", "count": "10",
    })
    assert full_import.status == 409, (full_import.status, full_import.text())
    cap_page = cap.new_page()
    cap_page.on("pageerror", lambda error: errors.append(str(error)))
    cap_page.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(cap_page.locator("[class*='countCard'] strong")).to_have_text("100")
    expect(cap_page.get_by_role("status").filter(has_text="100 үгийн хязгаартаа хүрсэн")).to_be_visible()
    expect(cap_page.get_by_role("link", name="Багцууд үзэх")).to_have_attribute("href", "/workspace/plans")
    expect(cap_page.get_by_role("button", name="Сандаа нэмэх", exact=True)).to_be_disabled()
    expect(cap_page.get_by_role("button", name="Үг оруулах", exact=True)).to_be_disabled()
    cap_page.screenshot(path=str(ART / "vocabulary-bank-full.png"), full_page=True)
    # Nothing was held or spent by the refused import.
    cap_page.goto(BASE + "/workspace/plans", wait_until="domcontentloaded")
    expect(cap_page.locator(".pricing-ai-balance strong")).to_have_text(re.compile(r"^100\s*/\s*100$"))
    expect(cap_page.locator(".pricing-ai-costs")).to_contain_text("1–17 кредит")
    cap.close()

    # Mobile: no sideways scroll, the drawer still opens on the vocabulary tab.
    mobile = browser.new_context(viewport={"width": 375, "height": 812}, color_scheme="light", storage_state=context.storage_state())
    m = mobile.new_page()
    m.on("pageerror", lambda error: errors.append(str(error)))
    m.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(m.locator("h1")).to_contain_text("Үгээ цуглуул")
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll on mobile"
    m.screenshot(path=str(ART / "vocabulary-mobile.png"), full_page=True)
    m.get_by_role("button", name="Цэс нээх").click()
    expect(m.locator(".wsp-nav a[href='/workspace/vocabulary']")).to_be_visible()
    m.screenshot(path=str(ART / "vocabulary-mobile-drawer.png"), full_page=True)
    mobile.close()

    assert not errors, errors
    browser.close()
print("PASS: vocabulary guest redirects (new and old addresses), anonymous/origin/body/ownership/file/prompt guards (no provider call), manual add/edit/delete, server persistence across reloads and accounts, word-count/price badge and mocked AI import with an optional selection prompt and a per-word receipt, the 100-word free bank refusing adds and imports before any credit hold, search, a 10-question keyboard quiz with retake, and mobile drawer/no horizontal scroll; no DeepSeek request made.")
