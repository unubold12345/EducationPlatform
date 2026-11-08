"""Workspace flashcards: the real page and server guards, then the upload -> study loop with the
generation response MOCKED in the browser. No DeepSeek request and no provider credit is used.
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
API = BASE + "/api/workspace/flashcards"
TINY_PDF = ART / "flashcards-tiny.pdf"

CARDS = [
    {"id": f"c{i}", "front": f"Question {i}: what does the cell structure do?", "back": f"Answer {i}: it carries out a specific life process.", "hint": "Cell biology"}
    for i in range(1, 11)
]
DECK = {
    "title": "Biology quick cards", "language": "mn", "provider": "DeepSeek",
    "source": {"name": "notes.pdf", "kind": "pdf", "pages": 1, "truncated": False},
    "cards": CARDS,
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

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # A real PDF through Chromium: one visible line, less than the 40-character minimum.
    maker = browser.new_context().new_page()
    maker.set_content("<html><body><p>Dummy PDF file</p></body></html>")
    maker.pdf(path=str(TINY_PDF), format="A4")
    maker.context.close()

    # Guests are sent to sign-in before the page streams any chrome.
    guest = browser.new_context(viewport={"width": 1280, "height": 900})
    guest_page = guest.new_page()
    guest_page.goto(BASE + "/workspace/flashcards")
    expect(guest_page).to_have_url(re.compile(r"/login\?next=%2Fworkspace%2Fflashcards"))
    guest.close()

    context = browser.new_context(viewport={"width": 1440, "height": 1000}, color_scheme="dark")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    signup = context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": "Flashcard QA", "email": "qa-flash-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert signup.ok, signup.status

    # Server guards, before any provider is reachable.
    assert context.request.post(API, headers=ORIGIN, data={"file": "x"}).status == 415, "JSON body is not a file upload"
    assert context.request.post(API, headers={"Origin": "https://untrusted.invalid"}, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()},
    }).status == 403, "cross-origin upload"
    assert context.request.post(API, headers=ORIGIN, multipart={"count": "20", "language": "mn"}).status == 400, "no file"
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ not a document"},
    }).status == 415, "unsupported extension"
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "7", "language": "mn",
    }).status == 400, "card count"
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "20", "language": "ru",
    }).status == 400, "card language"
    tiny = context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "tiny.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "20", "language": "mn",
    })
    assert tiny.status == 422, tiny.status
    assert "хангалттай текст" in tiny.json()["error"], tiny.json()
    for kind in ("docx", "pptx"):
        # A failed extraction still releases its quota lease with the shared 3 s cooldown.
        page.wait_for_timeout(3200)
        empty = context.request.post(API, headers=ORIGIN, multipart={
            "file": {"name": "empty." + kind, "mimeType": "application/vnd.openxmlformats-officedocument", "buffer": office_zip(kind)}, "count": "20", "language": "mn",
        })
        assert empty.status == 422, (kind, empty.status, empty.text())
    huge = context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)}, "count": "20", "language": "mn",
    })
    assert huge.status == 413, huge.status
    assert context.request.post(API, headers=ORIGIN, multipart={
        "file": {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}, "count": "20", "language": "mn", "userId": "other",
    }).status == 400, "extra form field"

    page.goto(BASE + "/workspace/flashcards", wait_until="domcontentloaded")
    expect(page.locator("h1")).to_contain_text("Файлаа оруул")
    expect(page.locator(".wsp-nav a[href='/workspace/flashcards']")).to_have_attribute("aria-current", "page")
    expect(page.locator(".site-header")).to_be_hidden()
    expect(page.locator(".site-footer")).to_be_hidden()

    calls = []
    def mock(route):
        calls.append(route.request.post_data_buffer or b"")
        route.fulfill(status=200, content_type="application/json", body=json.dumps(DECK))
    page.route("**/api/workspace/flashcards", mock)
    page.set_input_files('input[type="file"]', {"name": "notes.pdf", "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()})
    expect(page.get_by_text("notes.pdf")).to_be_visible()
    page.get_by_role("button", name="10", exact=True).click()
    page.get_by_role("button", name="English", exact=True).click()
    page.get_by_role("button", name="Карт үүсгэх", exact=True).click()
    expect(page.get_by_role("heading", name="Biology quick cards")).to_be_visible(timeout=20000)
    assert calls and b'name="count"' in calls[0] and b'name="language"' in calls[0], calls[0][:300]
    assert b"\r\n10\r\n" in calls[0] and b"\r\nen\r\n" in calls[0], "selected card count and language are sent"
    expect(page.locator("[class*='studyBar']")).to_contain_text("1 / 10")
    expect(page.get_by_text("Question 1: what does the cell structure do?")).to_be_visible()
    page.screenshot(path=str(ART / "flashcards-study-desktop.png"), full_page=True)

    # Space flips; 2 marks known and advances. Card 2 goes back with 1.
    page.keyboard.press("Space")
    expect(page.get_by_text("Answer 1: it carries out a specific life process.")).to_be_visible()
    expect(page.get_by_text("Зөвлөмж · Cell biology")).to_be_visible()
    page.keyboard.press("2")
    expect(page.locator("[class*='studyBar']")).to_contain_text("2 / 10")
    expect(page.locator("[class*='studyBar']")).to_contain_text("1 мэдсэн")
    page.keyboard.press("Space")
    page.keyboard.press("1")
    expect(page.locator("[class*='studyBar']")).to_contain_text("3 / 10")
    expect(page.locator("[class*='studyBar']")).to_contain_text("1 мэдсэн")
    for _ in range(8):
        page.keyboard.press("Space")
        page.keyboard.press("2")
    expect(page.get_by_text("ДАВТАЛТ ДУУССАН")).to_be_visible()
    expect(page.locator("[class*='doneScore'] strong")).to_have_text("9")
    expect(page.get_by_text("Дахин давтах", exact=True)).to_be_visible()
    page.screenshot(path=str(ART / "flashcards-done-desktop.png"), full_page=True)
    page.get_by_role("button", name="Дахин давтах", exact=True).click()
    expect(page.locator("[class*='studyBar']")).to_contain_text("1 / 10")
    page.get_by_role("button", name="Багц руу буцах", exact=True).click()
    expect(page.get_by_role("heading", name="Миний багцууд")).to_be_visible()
    expect(page.get_by_text("9/10 мэдсэн")).to_be_visible()
    page.screenshot(path=str(ART / "flashcards-library-desktop.png"), full_page=True)

    # The deck and its study progress survive a reload; only this browser holds them.
    page.reload(wait_until="domcontentloaded")
    expect(page.get_by_role("heading", name="Миний багцууд")).to_be_visible()
    expect(page.get_by_text("9/10 мэдсэн")).to_be_visible()
    page.get_by_text("Biology quick cards").click()
    expect(page.locator("[class*='studyBar']")).to_contain_text("1 / 10")
    expect(page.locator("[class*='studyBar']")).to_contain_text("9 мэдсэн")

    # Mobile: the tab opens the drawer, nothing scrolls sideways, the deck still opens.
    mobile = browser.new_context(viewport={"width": 375, "height": 812}, color_scheme="light", storage_state=context.storage_state())
    m = mobile.new_page()
    m.on("pageerror", lambda error: errors.append(str(error)))
    m.goto(BASE + "/workspace/flashcards", wait_until="domcontentloaded")
    expect(m.get_by_role("heading", name="Миний багцууд")).to_be_visible()
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll on mobile"
    m.get_by_role("button", name="Цэс нээх").click()
    expect(m.locator(".wsp-nav a[href='/workspace/flashcards']")).to_be_visible()
    m.screenshot(path=str(ART / "flashcards-mobile.png"), full_page=True)
    # Tapping the tab you are already on still closes the phone drawer.
    m.locator(".wsp-nav a[href='/workspace/flashcards']").click()
    m.wait_for_timeout(300)
    assert m.locator(".wsp").get_attribute("data-open") is None, "current tab link closes the drawer"
    mobile.close()

    page.get_by_role("button", name="Багц руу буцах", exact=True).click()
    expect(page.get_by_role("heading", name="Миний багцууд")).to_be_visible()

    # Client-side file checks never reach the API.
    page.set_input_files('input[type="file"]', {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ"})
    expect(page.locator("p[role='alert']")).to_contain_text("PDF, Word")
    page.set_input_files('input[type="file"]', {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)})
    expect(page.locator("p[role='alert']")).to_contain_text("4 MB")

    # Deleting a deck asks first, then leaves the empty state.
    page.reload(wait_until="domcontentloaded")
    page.on("dialog", lambda dialog: dialog.accept())
    page.get_by_role("button", name="Biology quick cards багцыг устгах").click()
    expect(page.get_by_text("Одоогоор багц алга")).to_be_visible()
    assert not errors, errors
    browser.close()
print("PASS: flashcards guest redirect, signed-in/origin/multipart/file/count/language/page/Office/oversize API guards (no provider call), upload with mocked deck, flip, keyboard known/again, completion, reload persistence, mobile drawer and no horizontal scroll, client file checks, delete; no DeepSeek request made.")
