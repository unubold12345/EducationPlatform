"""Workspace vocabulary: the real page and server guards, manual words, decks and bulk changes,
server persistence across reloads and accounts, a MOCKED file scan with its review step, and quizzes
whose grades are stored as study progress.
No DeepSeek request is made: valid scans are answered by a browser route mock.
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
WORDS = API + "/words"
DECKS = API + "/decks"
REVIEW = API + "/review"
TINY_PDF = ART / "vocabulary-tiny.pdf"

SEED = [
    ("resilient", "тэсвэртэй"),
    ("scarce", "ховор"),
    ("meticulous", "нягт нямбай"),
    ("candid", "шударга"),
    ("deteriorate", "муудах"),
]
FOUND = [
    ("abundant", "элбэг"), ("brittle", "хэврэг"), ("coherent", "уялдаатай"), ("diligent", "хичээнгүй"),
    ("eloquent", "уран цэцэн"), ("frugal", "гүйлгээч"), ("genuine", "жинхэнэ"), ("humble", "даруу"),
    ("intricate", "нарийн төвөгтэй"), ("jubilant", "баяр хөөртэй"),
]
SCAN_REPLY = {
    "candidates": [{"term": term, "translation": translation} for term, translation in FOUND],
    "found": 10, "duplicates": 1, "limit": 100, "room": 95, "requested": 50,
    "source": {"name": "unit_3.pdf", "kind": "pdf", "pages": 2, "truncated": False},
    "language": "en", "provider": "DeepSeek",
    "credits": {"action": "vocabulary-import", "spent": 8, "balance": 92, "allowance": 100},
}


def sign_up(context, label):
    made = context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={
        "name": "Vocabulary " + label, "email": f"qa-vocab-{label.lower()}-" + uuid4().hex[:12] + "@example.invalid", "password": "Local-Test-" + uuid4().hex,
    })
    assert made.ok, made.status


def total(page):
    return page.locator("[data-stat='total'] strong")


def pdf(name="notes.pdf"):
    return {"name": name, "mimeType": "application/pdf", "buffer": TINY_PDF.read_bytes()}


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
    sign_up(context, "QA")

    # Anonymous calls and same-origin/body guards, before any provider is reachable.
    anonymous = browser.new_context()
    assert anonymous.request.post(API, headers=ORIGIN, data={"term": "x", "translation": "y"}).status == 401, "login is required"
    for url, body in ((WORDS, {"action": "delete", "ids": ["a" * 24]}), (DECKS, {"name": "x"}), (REVIEW, {"results": [{"id": "a" * 24, "grade": "good"}]})):
        assert anonymous.request.post(url, headers=ORIGIN, data=body).status == 401, "login is required: " + url
    anonymous.close()
    assert context.request.post(API, headers={"Origin": "https://untrusted.invalid"}, data={"term": "x", "translation": "y"}).status == 403, "cross-origin add"
    assert context.request.post(API, data={"term": "x", "translation": "y"}).status == 403, "missing origin add"
    assert context.request.post(API, headers=ORIGIN, data={"term": "x", "translation": "y", "userId": "other"}).status == 400, "extra field"
    assert context.request.post(API, headers=ORIGIN, data={"term": "   ", "translation": "y"}).status == 400, "blank term"
    assert context.request.post(API, headers=ORIGIN, data={"term": "x" * 161, "translation": "y"}).status == 400, "long term"
    assert context.request.post(API, headers=ORIGIN, data={"term": "x", "translation": "y", "deckId": "c" + "a" * 24}).status == 404, "a deck that is not the student's"
    assert context.request.delete(API + "/words/not-a-real-id", headers=ORIGIN).status == 400, "malformed word id"
    assert context.request.delete(API + "/words/" + "a" * 32, headers=ORIGIN).status == 404, "unknown word"
    assert context.request.patch(API + "/words/" + "a" * 32, data={"term": "x", "translation": "y"}).status == 403, "cross-origin edit"
    # Decks, bulk changes and quiz grades: same origin, exact shapes.
    for url, body in ((WORDS, {"action": "delete", "ids": ["a" * 24]}), (DECKS, {"name": "x"}), (REVIEW, {"results": [{"id": "a" * 24, "grade": "good"}]})):
        assert context.request.post(url, headers={"Origin": "https://untrusted.invalid"}, data=body).status == 403, "cross-origin: " + url
    for bad in ({"action": "delete"}, {"action": "delete", "ids": []}, {"action": "delete", "ids": ["x"]}, {"action": "grant", "ids": ["a" * 24]},
                {"action": "move", "ids": ["a" * 24]}, {"action": "star", "ids": ["a" * 24], "starred": "yes"}, {"action": "add", "words": []},
                {"action": "add", "words": [{"term": "a", "translation": "b"}], "deckId": "a" * 24, "deckName": "x"}):
        assert context.request.post(WORDS, headers=ORIGIN, data=bad).status == 400, ("bulk shape", bad)
    for bad in ({}, {"name": "   "}, {"name": "x" * 41}, {"name": "x", "color": "pink"}, {"name": "x", "userId": "other"}):
        assert context.request.post(DECKS, headers=ORIGIN, data=bad).status == 400, ("deck shape", bad)
    for bad in ({}, {"results": []}, {"results": [{"id": "a" * 24, "grade": "easy"}]}, {"results": [{"id": "a" * 24, "grade": "good", "box": 5}]}, {"results": [{"id": "a" * 24, "grade": "good"}], "score": 100}):
        assert context.request.post(REVIEW, headers=ORIGIN, data=bad).status == 400, ("review shape", bad)
    assert context.request.post(WORDS, headers=ORIGIN, data={"action": "move", "ids": ["a" * 24], "deckId": "c" + "a" * 24}).status == 404, "moving into a deck that is not the student's"

    # File import guards.
    assert context.request.post(IMPORT, headers=ORIGIN, data={"file": "x"}).status == 415, "JSON is not a file upload"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={"language": "mn"}).status == 400, "no file"
    assert context.request.post(IMPORT, headers={"Origin": "https://untrusted.invalid"}, multipart={"file": pdf()}).status == 403, "cross-origin import"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "notes.exe", "mimeType": "application/octet-stream", "buffer": b"MZ not a document"},
    }).status == 415, "unsupported extension"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={"file": pdf(), "language": "mn", "userId": "other"}).status == 400, "extra import field"
    assert context.request.post(IMPORT, headers=ORIGIN, multipart={"file": pdf(), "language": "mn", "prompt": "x" * 501}).status == 400, "prompt is bounded"
    for bad_count in ("0", "121", "abc", "2.5"):
        assert context.request.post(IMPORT, headers=ORIGIN, multipart={"file": pdf(), "language": "mn", "count": bad_count}).status == 400, "word count is bounded: " + bad_count
    for field, value in (("level", "expert"), ("kind", "pronouns")):
        assert context.request.post(IMPORT, headers=ORIGIN, multipart={"file": pdf(), "language": "mn", field: value}).status == 400, "filters are fixed choices: " + field
    huge = context.request.post(IMPORT, headers=ORIGIN, multipart={
        "file": {"name": "huge.txt", "mimeType": "text/plain", "buffer": b"x" * (4 * 1024 * 1024 + 1)}, "language": "mn",
    })
    assert huge.status == 413, huge.status
    tiny = context.request.post(IMPORT, headers=ORIGIN, multipart={"file": pdf("tiny.pdf"), "language": "mn", "count": "37", "level": "advanced", "kind": "verbs"})
    assert tiny.status == 422, (tiny.status, tiny.text())
    assert "хангалттай текст" in tiny.json()["error"], tiny.json()
    # The failed request still holds its 3-second lease, so one upload runs at a time.
    again = context.request.post(IMPORT, headers=ORIGIN, multipart={"file": pdf("tiny.pdf"), "language": "mn"})
    assert again.status == 429, (again.status, again.text())
    page.wait_for_timeout(3300)

    # Seed real server words through the public API (the bank is account storage, not localStorage).
    ids = {}
    for term, translation in SEED:
        created = context.request.post(API, headers=ORIGIN, data={"term": term, "translation": translation})
        assert created.status == 201, (term, created.status, created.text())
        word = created.json()["word"]
        ids[term] = word["id"]
        assert word["deckId"] is None and word["starred"] is False and word["box"] == 0 and word["dueAt"] is None, word
    duplicate = context.request.post(API, headers=ORIGIN, data={"term": "  RESILIENT ", "translation": "давхар"})
    assert duplicate.status == 409, duplicate.status
    # One deck by API: a name is one deck, and a word can be added straight into it.
    made_deck = context.request.post(DECKS, headers=ORIGIN, data={"name": "IELTS  Reading", "color": "violet"})
    assert made_deck.status == 201 and made_deck.json()["deck"]["name"] == "IELTS Reading", made_deck.text()
    deck_id = made_deck.json()["deck"]["id"]
    assert context.request.post(DECKS, headers=ORIGIN, data={"name": "ielts reading"}).status == 409, "a folded name is one deck"

    page.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(page.locator("h1")).to_contain_text("Үгээ цуглуул")
    expect(page.locator(".wsp-nav a[href='/workspace/vocabulary']")).to_have_attribute("aria-current", "page")
    expect(page.locator(".site-header")).to_be_hidden()
    expect(page.locator(".site-footer")).to_be_hidden()
    expect(page.locator("li[data-term='resilient']")).to_contain_text("тэсвэртэй")
    expect(total(page)).to_have_text("5")
    expect(page.locator("[data-stat='total']")).to_contain_text("100 хүртэл")
    expect(page.locator("[data-stat='due'] strong")).to_have_text("0")
    expect(page.locator("[data-stat='due']")).to_contain_text("5 шинэ үг")
    expect(page.locator("button[data-deck='all']")).to_contain_text("5")
    expect(page.locator(f"button[data-deck='{deck_id}']")).to_contain_text("IELTS Reading")

    # The import panel: any word count, level and word-type filters, and only a price badge.
    page.get_by_role("button", name="Файлаас оруулах", exact=True).click()
    panel = page.locator("[data-panel='import']")
    expect(panel).to_be_visible()
    cost = page.locator("[data-credit-action='vocabulary-import']")
    expect(cost).to_contain_text("хамгийн ихдээ 21 кредит")
    count = page.get_by_label("Үгийн дээд тоо", exact=True)
    expect(count).to_have_value("40")
    count.fill("10")
    expect(cost).to_have_attribute("data-credit-cost", "16")
    count.fill("60")
    expect(cost).to_have_attribute("data-credit-cost", "29")
    # More than the 95 words of room left in the free bank is lowered to that room.
    count.fill("120")
    expect(count).to_have_value("95")
    expect(cost).to_have_attribute("data-credit-cost", "40")
    expect(panel).to_contain_text("Санд 95 үгийн зай үлдсэн")
    expect(panel.locator("[class*='hint']")).to_contain_text("Файлд өөрийн орчуулга байвал түүнийг ашиглана")
    expect(panel.locator("[class*='hint']")).to_contain_text("хадгалахаасаа өмнө шалгаарай")
    expect(page.locator("[aria-label='Файлд орчуулга байхгүй үеийн орчуулгын хэл']")).to_contain_text("Файлд орчуулга байхгүй бол")
    # How the price is worked out is not explained on the page.
    body = page.locator("main").inner_text()
    for gone in ("текстийн урт", "түр барьж", "Давхар үгэнд кредит", "Зөвхөн шинээр хадгалсан үгэнд төлнө"):
        assert gone not in body, gone
    page.evaluate("document.documentElement.dataset.theme = 'light'")
    page.wait_for_timeout(350)
    page.screenshot(path=str(ART / "vocabulary-bank-desktop.png"), full_page=True)
    # Visual check of the dark palette; the shared theme toggle has its own suite.
    page.evaluate("document.documentElement.dataset.theme = 'dark'")
    page.wait_for_timeout(350)
    page.screenshot(path=str(ART / "vocabulary-bank-dark.png"), full_page=True)
    page.evaluate("document.documentElement.dataset.theme = 'light'")
    page.wait_for_timeout(350)

    # Manual add through the real page and real API, straight into a deck.
    page.get_by_role("button", name="Үг нэмэх", exact=True).click()
    add = page.locator("[data-panel='add']")
    expect(panel).to_have_count(0)
    add.get_by_label("Үг эсвэл хэллэг", exact=True).fill("take off")
    add.get_by_label("Орчуулга", exact=True).fill("хөөрөх")
    add.get_by_label(re.compile("Жишээ өгүүлбэр")).fill("The plane will take off on time.")
    add.get_by_label(re.compile("^Багц")).select_option(label="IELTS Reading")
    add.get_by_role("button", name="Сандаа нэмэх", exact=True).click()
    expect(page.locator("[class*='notice']")).to_contain_text("үг хадгалагдлаа")
    expect(page.locator("li[data-term='take off']")).to_contain_text("хөөрөх")
    expect(page.locator("li[data-term='take off']")).to_contain_text("IELTS Reading")
    expect(total(page)).to_have_text("6")
    expect(page.locator(f"button[data-deck='{deck_id}']")).to_contain_text("1")
    add.get_by_role("button", name="Хаах", exact=True).click()
    expect(add).to_have_count(0)

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
    expect(total(page)).to_have_text("5")

    page.reload(wait_until="domcontentloaded")
    expect(page.locator("li[data-term='take off']")).to_contain_text("хөөрөх")
    expect(page.locator("li[data-term='take off']")).to_contain_text("IELTS Reading")
    expect(page.locator("li[data-term='resilient']")).to_contain_text("тэсвэртэй, уян хатан")
    expect(page.locator("li[data-term='deteriorate']")).to_have_count(0)
    expect(total(page)).to_have_text("5")

    # Another account cannot read, edit, move, grade or delete the first account's words or decks.
    other = browser.new_context(viewport={"width": 1280, "height": 900})
    sign_up(other, "Other")
    stolen = other.request.patch(API + "/words/" + ids["resilient"], headers=ORIGIN, data={"term": "hijack", "translation": "булаах"})
    assert stolen.status == 404, (stolen.status, stolen.text())
    assert other.request.delete(API + "/words/" + ids["resilient"], headers=ORIGIN).status == 404
    for change in ({"action": "delete", "ids": [ids["resilient"]]}, {"action": "star", "ids": [ids["resilient"]], "starred": True}, {"action": "reset", "ids": [ids["resilient"]]}, {"action": "move", "ids": [ids["resilient"]], "deckId": None}):
        touched = other.request.post(WORDS, headers=ORIGIN, data=change)
        assert touched.status == 200 and touched.json() == {"changed": 0}, (change, touched.status, touched.text())
    graded = other.request.post(REVIEW, headers=ORIGIN, data={"results": [{"id": ids["resilient"], "grade": "good"}]})
    assert graded.status == 200 and graded.json() == {"words": []}, graded.text()
    assert other.request.patch(DECKS + "/" + deck_id, headers=ORIGIN, data={"name": "hijack"}).status == 404
    assert other.request.delete(DECKS + "/" + deck_id + "?words=delete", headers=ORIGIN).status == 404
    assert other.request.post(WORDS, headers=ORIGIN, data={"action": "add", "words": [{"term": "x", "translation": "y"}], "deckId": deck_id}).status == 404
    other_page = other.new_page()
    other_page.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(other_page.get_by_text("Үгсийн сан хоосон байна")).to_be_visible()
    expect(other_page.locator("li[data-term='take off']")).to_have_count(0)
    expect(other_page.locator(f"button[data-deck='{deck_id}']")).to_have_count(0)
    other.close()

    # A file scan is mocked in the browser; the real API guards were checked above. The words found come
    # back for review, survive a reload, and only the chosen ones are saved (through the real API).
    calls = []
    def mock(route):
        calls.append(route.request.post_data_buffer or b"")
        route.fulfill(status=200, content_type="application/json", body=json.dumps(SCAN_REPLY))
    page.route("**/api/workspace/vocabulary/import", mock)
    page.get_by_role("button", name="Файлаас оруулах", exact=True).click()
    page.set_input_files('input[type="file"]', pdf("unit_3.pdf"))
    expect(page.get_by_text("unit_3.pdf")).to_be_visible()
    panel.locator("textarea").fill("Зөвхөн 3-р бүлгийн шинэ үгсийг ав.")
    page.get_by_role("button", name="English орчуулга", exact=True).click()
    page.get_by_label("Үгийн түвшин").select_option("advanced")
    page.get_by_label("Үгийн төрөл").select_option("adjectives")
    count.fill("50")
    expect(cost).to_have_attribute("data-credit-cost", "25")
    page.get_by_role("button", name="Үгсийг олох", exact=True).click()
    review = page.locator("[data-panel='review']")
    expect(review.get_by_role("heading")).to_have_text("10 шинэ үг олдлоо")
    expect(review).to_contain_text("1 үг аль хэдийн санд байсан тул орхилоо")
    expect(review).to_contain_text("8 кредит зарцууллаа")
    expect(review.locator("li[data-candidate]")).to_have_count(10)
    assert calls and b'name="language"' in calls[0] and b"\r\nen\r\n" in calls[0], calls[0][:300] if calls else b""
    assert "Зөвхөн 3-р бүлгийн шинэ үгсийг ав.".encode("utf-8") in calls[0], "the optional instruction is sent"
    for name, value in (("count", b"50"), ("level", b"advanced"), ("kind", b"adjectives")):
        assert b'name="' + name.encode() + b'"\r\n\r\n' + value + b"\r\n" in calls[0], name
    expect(total(page)).to_have_text("5")
    page.screenshot(path=str(ART / "vocabulary-review-desktop.png"), full_page=True)
    # Nothing is saved yet, and a reload brings the list back.
    page.reload(wait_until="domcontentloaded")
    expect(review.get_by_role("heading")).to_have_text("10 шинэ үг олдлоо")
    expect(total(page)).to_have_text("5")
    review.locator("li[data-candidate='humble'] input[type='checkbox']").uncheck()
    review.get_by_label("frugal үгийн орчуулга", exact=True).fill("хэмнэлттэй")
    expect(review.get_by_label("Шинэ багцын нэр", exact=True)).to_have_value("unit 3")
    review.get_by_label("Шинэ багцын нэр", exact=True).fill("Unit 3")
    expect(review).to_contain_text("9 / 10 үг сонгосон")
    review.get_by_role("button", name="9 үг хадгалах", exact=True).click()
    expect(page.locator("[class*='notice']")).to_contain_text("9 үг “Unit 3” багцад нэмэгдлээ")
    expect(review).to_have_count(0)
    expect(total(page)).to_have_text("14")
    expect(page.locator("li[data-term='brittle']")).to_be_visible()
    expect(page.locator("li[data-term='frugal']")).to_contain_text("хэмнэлттэй")
    expect(page.locator("li[data-term='humble']")).to_have_count(0)
    assert len(calls) == 1, "one scan, one provider request"

    # Organize: decks, filters, sorting, selection and bulk changes.
    unit = page.locator("button[data-deck]").filter(has_text="Unit 3")
    expect(unit).to_contain_text("9")
    unit.click()
    expect(page.locator("li[data-term]")).to_have_count(9)
    expect(page.locator("[class*='deckHead']")).to_contain_text("9 үг")
    page.locator("li[data-term='abundant'] input[type='checkbox']").check()
    page.locator("li[data-term='brittle'] input[type='checkbox']").check()
    bulk = page.locator("[data-bulk]")
    expect(bulk).to_contain_text("2 үг сонгосон")
    bulk.get_by_role("button", name="Онцлох", exact=True).click()
    expect(page.locator("[class*='notice']")).to_contain_text("2 үгийг онцоллоо")
    expect(page.locator("button[data-deck='starred']")).to_contain_text("2")
    bulk.get_by_label("Багц руу зөөх", exact=True).select_option(label="IELTS Reading")
    expect(page.locator("[class*='notice']")).to_contain_text("2 үгийг “IELTS Reading” багц руу зөөлөө")
    expect(page.locator("li[data-term]")).to_have_count(7)
    expect(bulk).to_have_count(0)
    page.locator("button[data-deck='starred']").click()
    expect(page.locator("li[data-term]")).to_have_count(2)
    expect(page.locator("li[data-term='abundant']")).to_contain_text("IELTS Reading")
    # A new deck from the rail, renamed and recoloured.
    page.get_by_role("button", name="Шинэ багц", exact=True).click()
    page.get_by_label("Шинэ багцын нэр", exact=True).fill("SAT үгс")
    page.get_by_role("button", name="Үүсгэх", exact=True).click()
    sat = page.locator("button[data-deck]").filter(has_text="SAT үгс")
    expect(sat).to_contain_text("0")
    sat.click()
    expect(page.get_by_text("Энд үг алга")).to_be_visible()
    page.get_by_role("button", name="Багцын нэр солих", exact=True).click()
    page.get_by_label("Багцын нэр", exact=True).fill("SAT")
    page.locator("[class*='deckRename']").get_by_role("button", name="Хадгалах", exact=True).click()
    expect(page.locator("[class*='deckHead'] h3")).to_have_text("SAT")
    page.locator("[class*='swatches'] button[data-color='green']").click()
    expect(page.locator("[class*='deckHead']")).to_have_attribute("data-color", "green")
    # Deleting a deck keeps its words unless asked otherwise.
    page.get_by_role("button", name="Багцыг устгах", exact=True).click()
    page.get_by_role("button", name="Багцыг устгаад үгсийг үлдээх", exact=True).click()
    expect(page.locator("[class*='notice']")).to_contain_text("“SAT” багц устгагдлаа")
    expect(page.locator("button[data-deck]").filter(has_text="SAT")).to_have_count(0)
    expect(page.locator("li[data-term]")).to_have_count(14)
    # Search filters term, translation, example and source, then clears; sorting reorders the list.
    search = page.get_by_role("searchbox")
    search.fill("brittle")
    expect(page.locator("li[data-term]")).to_have_count(1)
    search.fill("unit_3")
    expect(page.locator("li[data-term]")).to_have_count(9)
    search.fill("")
    expect(page.locator("li[data-term]")).to_have_count(14)
    page.get_by_label("Эрэмбэ", exact=True).select_option("az")
    terms = page.locator("li[data-term]").evaluate_all("nodes => nodes.map(node => node.dataset.term)")
    assert terms == sorted(terms, key=str.lower) and terms[0] == "abundant", terms
    page.get_by_label("Эрэмбэ", exact=True).select_option("newest")
    page.get_by_role("button", name="Картаар харах", exact=True).click()
    expect(page.locator("ul[class*='cards'] li[data-term]")).to_have_count(14)
    page.screenshot(path=str(ART / "vocabulary-cards-desktop.png"), full_page=True)
    page.get_by_role("button", name="Жагсаалтаар харах", exact=True).click()
    expect(page.locator("ul[class*='rows'] li[data-term]")).to_have_count(14)
    pairs = dict(page.locator("li[data-term]").evaluate_all("nodes => nodes.map(node => [node.querySelector('[class*=\"translation\"]').innerText.trim(), node.dataset.term])"))
    assert len(pairs) == 14, pairs

    # A choice quiz with the keyboard: 10 questions, a result screen, grades saved as study progress.
    page.get_by_role("button", name="Quiz тохируулах", exact=True).click()
    expect(page.get_by_role("heading", name="Quiz тохируулах")).to_be_visible()
    expect(page.locator("button[data-scope='smart']")).to_have_attribute("aria-pressed", "true")
    expect(page.locator("button[data-scope='new']")).to_contain_text("14 үг")
    expect(page.locator("button[data-scope='due']")).to_be_disabled()
    for kind in ("typing", "truefalse"):
        page.locator(f"button[data-kind='{kind}']").click()
        expect(page.locator(f"button[data-kind='{kind}']")).to_have_attribute("aria-pressed", "false")
    expect(page.locator("button[data-kind='choice']")).to_have_attribute("aria-pressed", "true")
    page.get_by_role("button", name="Үг → орчуулга", exact=True).click()
    page.get_by_label("Алдсан үгийг төгсгөлд дахин асуух").uncheck()
    page.screenshot(path=str(ART / "vocabulary-quiz-setup.png"), full_page=True)
    page.get_by_role("button", name=re.compile(r"^Quiz эхлэх · 10 асуулт$")).click()
    expect(page.locator("[class*='questionPrompt']")).to_be_visible()
    expect(page.locator("[class*='quizTopTitle']")).to_contain_text("1 / 10")
    expect(page.locator("section[data-kind='choice']")).to_be_visible()
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
    # Every asked word left the "new" box: right answers went up a level, missed ones come back soon.
    expect(page.locator("[class*='missed'] li")).to_have_count(10)
    expect(page.locator("[class*='missed'] li[data-result='good']")).to_have_count(expected_hits)
    expect(page.locator("[class*='missed'] li em").filter(has_text=re.compile("Түвшин 0 → 1|Удахгүй дахин асууна"))).to_have_count(10)
    expect(page.get_by_role("button", name="Дахин авах", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Үгс рүү буцах", exact=True).first).to_be_visible()
    page.screenshot(path=str(ART / "vocabulary-done-desktop.png"), full_page=True)
    page.get_by_role("button", name="Дахин авах", exact=True).click()
    expect(page.locator("[class*='quizTopTitle']")).to_contain_text("1 / 10")
    page.locator("[class*='quizTop']").get_by_role("button", name="Гарах", exact=True).click()
    expect(page.get_by_role("heading", name="Миний үгс")).to_be_visible()
    expect(page.locator("[data-stat='today'] strong")).to_have_text("10")
    expect(page.locator("button[data-status='new']")).to_contain_text("4")
    expect(page.locator("button[data-status='learning']")).to_contain_text("10")
    # The progress is on the account, not in this browser.
    page.reload(wait_until="domcontentloaded")
    expect(page.locator("[data-stat='today'] strong")).to_have_text("10")
    expect(page.locator("button[data-status='learning']")).to_contain_text("10")
    page.locator("button[data-status='new']").click()
    expect(page.locator("li[data-term]")).to_have_count(4)
    page.locator("button[data-status='all']").click()

    # A typed quiz on chosen words: a right answer, a hint, and a miss that is shown with the answer.
    for term in ("scarce", "candid", "meticulous"):
        page.locator(f"li[data-term='{term}'] input[type='checkbox']").check()
    page.locator("[data-bulk]").get_by_role("button", name="Quiz", exact=True).click()
    expect(page.get_by_text("Сонгосон 3 үгээр асууна")).to_be_visible()
    page.locator("button[data-kind='typing']").click()
    page.locator("button[data-kind='choice']").click()
    expect(page.locator("button[data-kind='typing']")).to_have_attribute("aria-pressed", "true")
    page.get_by_role("button", name="Орчуулга → үг", exact=True).click()
    page.get_by_role("button", name=re.compile(r"^Quiz эхлэх · 3 асуулт$")).click()
    expect(page.locator("section[data-kind='typing']")).to_be_visible()
    answer = page.get_by_label("Хариулт", exact=True)
    expect(answer).to_be_focused()
    first = pairs[page.locator("[class*='questionPrompt']").inner_text().strip()]
    answer.fill(first.upper() + " ")
    answer.press("Enter")
    expect(page.locator("[class*='feedback'] strong")).to_have_text("Зөв!")
    page.keyboard.press("Enter")
    expect(page.locator("[class*='quizTopTitle']")).to_contain_text("2 / 3")
    second = pairs[page.locator("[class*='questionPrompt']").inner_text().strip()]
    page.get_by_role("button", name="Сануулга", exact=True).click()
    expect(page.locator("[class*='typingHint'] b")).to_have_text(second[0] + "•" * (len(second) - 1))
    answer.fill("zzzz")
    answer.press("Enter")
    expect(page.locator("[class*='feedback'] strong")).to_have_text("Алдлаа")
    expect(page.locator("div[class*='feedback']")).to_contain_text("Зөв хариулт: " + second)
    page.screenshot(path=str(ART / "vocabulary-quiz-typing.png"), full_page=True)
    # Leaving early keeps the two answered words' progress.
    page.keyboard.press("Escape")
    expect(page.get_by_role("heading", name="Миний үгс")).to_be_visible()
    expect(page.locator("button[data-status='weak'] span")).not_to_have_text("0")
    after = context.request.post(REVIEW, headers=ORIGIN, data={"results": [{"id": ids["scarce"], "grade": "good"}]})
    assert after.status == 200 and len(after.json()["words"]) == 1 and after.json()["words"][0]["box"] >= 1, after.text()

    # A free bank holds 100 words: the 101st word and any import are refused before credits are held.
    cap = browser.new_context(viewport={"width": 1280, "height": 900})
    sign_up(cap, "Cap")
    for index in range(100):
        made = cap.request.post(API, headers=ORIGIN, data={"term": f"capword{index}", "translation": f"үг {index}"})
        assert made.status == 201, (index, made.status, made.text())
    assert made.json()["total"] == 100 and made.json()["limit"] == 100, made.json()
    over = cap.request.post(API, headers=ORIGIN, data={"term": "one more", "translation": "дахин"})
    assert over.status == 409 and "100 үгийн хязгаартаа хүрсэн" in over.json()["error"], (over.status, over.text())
    assert "IELTS эсвэл SAT багцтай бол 3,000 үг" in over.json()["error"], over.json()
    many = cap.request.post(WORDS, headers=ORIGIN, data={"action": "add", "words": [{"term": "bulk word", "translation": "олон"}]})
    assert many.status == 409 and "100 үгийн хязгаартаа хүрсэн" in many.json()["error"], (many.status, many.text())
    # A 409, not the tiny file's 422: the full bank is refused before the file is read or credits are held.
    full_import = cap.request.post(IMPORT, headers=ORIGIN, multipart={"file": pdf("tiny.pdf"), "language": "mn", "count": "10"})
    assert full_import.status == 409, (full_import.status, full_import.text())
    cap_page = cap.new_page()
    cap_page.on("pageerror", lambda error: errors.append(str(error)))
    cap_page.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(total(cap_page)).to_have_text("100")
    expect(cap_page.get_by_role("status").filter(has_text="100 үгийн хязгаартаа хүрсэн")).to_be_visible()
    expect(cap_page.get_by_role("link", name="Багцууд үзэх")).to_have_attribute("href", "/workspace/plans")
    # The list is paged, 25 words at a time, instead of one long scroll.
    expect(cap_page.locator("li[data-term]")).to_have_count(25)
    pager = cap_page.get_by_role("navigation", name="Хуудаслалт")
    expect(pager).to_contain_text("1 / 4")
    pager.get_by_role("button", name="Дараах", exact=True).click()
    expect(pager).to_contain_text("2 / 4")
    expect(cap_page.get_by_text("26–50 / 100")).to_be_visible()
    cap_page.get_by_role("button", name="Үг нэмэх", exact=True).click()
    expect(cap_page.get_by_role("button", name="Сандаа нэмэх", exact=True)).to_be_disabled()
    cap_page.get_by_role("button", name="Файлаас оруулах", exact=True).click()
    expect(cap_page.get_by_role("button", name="Үгсийг олох", exact=True)).to_be_disabled()
    expect(cap_page.locator("[data-panel='import']")).to_contain_text("Үгсийн сан дүүрсэн")
    cap_page.screenshot(path=str(ART / "vocabulary-bank-full.png"), full_page=True)
    # Nothing was held or spent by the refused import.
    cap_page.goto(BASE + "/workspace/plans", wait_until="domcontentloaded")
    expect(cap_page.locator(".pricing-topup-balance strong")).to_have_text("100")
    cap.close()

    # Mobile: no sideways scroll on the list, a panel or the quiz; the drawer still opens on the vocabulary tab.
    mobile = browser.new_context(viewport={"width": 375, "height": 812}, color_scheme="light", storage_state=context.storage_state())
    m = mobile.new_page()
    m.on("pageerror", lambda error: errors.append(str(error)))
    m.goto(BASE + "/workspace/vocabulary", wait_until="domcontentloaded")
    expect(m.locator("h1")).to_contain_text("Үгээ цуглуул")
    expect(m.locator("li[data-term]")).to_have_count(14)
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll on mobile"
    m.screenshot(path=str(ART / "vocabulary-mobile.png"), full_page=True)
    m.get_by_role("button", name="Файлаас оруулах", exact=True).click()
    expect(m.locator("[data-panel='import']")).to_be_visible()
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll with the import panel"
    m.get_by_role("button", name="Quiz тохируулах", exact=True).click()
    expect(m.get_by_role("heading", name="Quiz тохируулах")).to_be_visible()
    assert m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "horizontal scroll on the quiz setup"
    m.screenshot(path=str(ART / "vocabulary-mobile-quiz.png"), full_page=True)
    m.get_by_role("button", name="Үгс рүү буцах", exact=True).click()
    m.get_by_role("button", name="Цэс нээх").click()
    expect(m.locator(".wsp-nav a[href='/workspace/vocabulary']")).to_be_visible()
    m.screenshot(path=str(ART / "vocabulary-mobile-drawer.png"), full_page=True)
    mobile.close()

    assert not errors, errors
    browser.close()
print("PASS: vocabulary guest redirects (new and old addresses), anonymous/origin/body/ownership guards for words, decks, bulk changes, quiz grades and file scans (no provider call), manual add into a deck, edit, delete, server persistence across reloads and accounts, the any-count/level/type import options with the price badge only, a mocked AI scan whose review list survives a reload and saves only the chosen words into a new deck, decks (create, rename, recolour, delete), star/move bulk changes, search, sort, list/card views and paging, a 10-question keyboard quiz and a typed quiz with a hint whose grades are stored as study progress, the 100-word free bank refusing adds and imports before any credit hold, and mobile with no horizontal scroll; no DeepSeek request made.")
