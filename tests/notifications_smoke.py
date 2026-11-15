import os, re, json, subprocess
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)
ORIGIN = {"Origin": BASE}
API = BASE + "/api/notifications"
ANNOUNCE = BASE + "/api/admin/announcements"
demos = json.loads((ROOT / "src/data/demo-accounts.json").read_text(encoding="utf-8"))


def fixture(*args):
    return subprocess.check_output(["node", "tests/notifications_fixture.mjs", *args], cwd=ROOT)


def sign_up(context, label):
    email = "qa-notify-" + label + uuid4().hex[:10] + "@example.invalid"
    response = context.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={"name": "Notify QA", "email": email, "password": "Local-Test-" + uuid4().hex})
    assert response.ok, response.status
    return response.json()["user"]["id"], email


def inbox(context):
    response = context.request.get(API)
    assert response.ok, response.status
    assert "no-store" in response.headers["cache-control"]
    return response.json()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Guests have no inbox.
    guest = browser.new_context()
    assert guest.request.get(API).status == 401
    assert guest.request.post(API, headers=ORIGIN, data={"action": "read-all"}).status == 401
    assert guest.request.post(ANNOUNCE, headers=ORIGIN, data={"action": "send", "title": "Guest title", "body": "Guest body text"}).status == 401

    student = browser.new_context(viewport={"width": 1440, "height": 1000}, color_scheme="light")
    user_id, email = sign_up(student, "")
    page = student.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    # A new account: the rail row has no count and the inbox is empty.
    page.goto(BASE + "/workspace")
    bell = page.locator(".wsp-side .wsp-notify-row")
    panel = page.locator("#wsp-notify")
    expect(bell).to_be_visible()
    expect(bell).to_have_text("Мэдэгдэл")
    expect(bell.locator(".wsp-notify-count")).to_have_count(0)
    expect(panel).to_have_count(0)
    bell.click()
    expect(panel).to_be_visible()
    expect(bell).to_have_attribute("aria-expanded", "true")
    expect(panel.locator(".wsp-notify-empty")).to_have_text("Мэдэгдэл алга.")
    page.keyboard.press("Escape")
    expect(panel).to_have_count(0)
    expect(bell).to_be_focused()
    assert inbox(student) == {"items": [], "unread": 0}

    # Marking read is same-origin and takes only its own shape.
    assert student.request.post(API, headers={"Origin": "https://untrusted.invalid"}, data={"action": "read-all"}).status == 403
    for bad in [{}, {"action": "read"}, {"action": "read", "ids": []}, {"action": "read", "ids": "x"}, {"action": "read", "ids": [5]}, {"action": "read-all", "ids": ["x"]},
                {"action": "read", "ids": ["x"], "userId": "other"}, {"action": "delete", "ids": ["x"]}, {"action": "read", "ids": ["x"] * 51}]:
        assert student.request.post(API, headers=ORIGIN, data=bad).status == 400, bad

    # Three simulated purchases: a plan, a single mock and the credit pack. Each is reported once.
    order = student.request.post(BASE + "/api/subscriptions/orders", headers=ORIGIN, data={"program": "language"}).json()
    declined = student.request.post(BASE + "/api/subscriptions/orders/" + order["id"] + "/confirm", headers=ORIGIN, data={"decision": "decline"})
    assert declined.json()["status"] == "DECLINED"
    assert inbox(student)["items"] == [], "a declined payment reports nothing"
    for _ in range(2):
        assert student.request.post(BASE + "/api/subscriptions/orders/" + order["id"] + "/confirm", headers=ORIGIN, data={"decision": "success"}).json()["status"] == "PAID"
    mock = student.request.post(BASE + "/api/mock-payments", headers=ORIGIN, data={"slug": "sat-full-01"}).json()
    for _ in range(2):
        assert student.request.post(BASE + "/api/mock-payments/" + mock["id"] + "/confirm", headers=ORIGIN, data={"decision": "success"}).json()["status"] == "PAID"
    page.goto(BASE + "/workspace/plans")
    figures = [int(re.sub(r"[^0-9]", "", text)) for text in [page.locator(".pricing-yellow .pricing-single-price strong").inner_text(), page.locator(".pricing-yellow .pricing-single-price span").inner_text()]]
    credit = student.request.post(BASE + "/api/credits/orders", headers=ORIGIN, data={"credits": figures[1], "amountMnt": figures[0]}).json()
    for _ in range(2):
        assert student.request.post(BASE + "/api/credits/orders/" + credit["id"] + "/confirm", headers=ORIGIN, data={"decision": "success"}).json()["status"] == "PAID"

    state = inbox(student)
    assert state["unread"] == 3, state
    assert [item["kind"] for item in state["items"]] == ["credits-paid", "mock-paid", "plan-paid"], state
    plan_item, mock_item, credit_item = state["items"][2], state["items"][1], state["items"][0]
    assert plan_item["title"] == "Багц идэвхжлээ" and "Гадаад хэл багц" in plan_item["body"] and plan_item["href"] == "/workspace/plans"
    assert mock_item["href"] == "/exams/sat-full-01" and mock_item["title"] == "Шалгалтын эрх нээгдлээ"
    assert f"{figures[1]:,} кредит" in credit_item["body"] and credit_item["href"] == "/workspace/plans#credits"
    assert all(not item["read"] and set(item) == {"id", "kind", "title", "body", "href", "read", "createdAt"} for item in state["items"])

    # A second month bought before the first ends is a renewal.
    renewal = student.request.post(BASE + "/api/subscriptions/orders", headers=ORIGIN, data={"program": "language"}).json()
    assert renewal["id"] != order["id"]
    assert student.request.post(BASE + "/api/subscriptions/orders/" + renewal["id"] + "/confirm", headers=ORIGIN, data={"decision": "success"}).json()["status"] == "PAID"
    state = inbox(student)
    assert state["unread"] == 4 and state["items"][0]["kind"] == "plan-renewed" and state["items"][0]["title"] == "Багц сунгагдлаа", state

    # Another account can neither see nor mark these notices.
    other = browser.new_context()
    other_id, other_email = sign_up(other, "other-")
    assert inbox(other) == {"items": [], "unread": 0}
    assert other.request.post(API, headers=ORIGIN, data={"action": "read", "ids": [item["id"] for item in state["items"]]}).json() == {"unread": 0}
    assert other.request.post(API, headers=ORIGIN, data={"action": "read-all"}).json() == {"unread": 0}
    assert inbox(student)["unread"] == 4

    # The rail shows the count; the inbox lists the notices beside the rail.
    page.goto(BASE + "/workspace")
    expect(bell.locator(".wsp-notify-count")).to_have_text("4")
    bell.click()
    expect(panel.locator(".wsp-notify-list li")).to_have_count(4)
    expect(panel.locator(".wsp-notify-list li[data-unread]")).to_have_count(4)
    expect(panel.locator(".wsp-notify-list li").first).to_contain_text("Багц сунгагдлаа")
    box, rail = panel.bounding_box(), page.locator(".wsp-side").bounding_box()
    assert box["x"] >= rail["x"] + rail["width"], (box, rail)
    assert box["y"] >= 0 and box["y"] + box["height"] <= 1000, box
    page.screenshot(path=str(ART / "notifications-inbox-light.png"))

    # Opening a notice marks it read, closes the inbox and goes to its page.
    panel.locator(".wsp-notify-list a", has_text="Шалгалтын эрх нээгдлээ").click()
    expect(page).to_have_url(BASE + "/exams/sat-full-01")
    expect(panel).to_have_count(0)
    expect(bell.locator(".wsp-notify-count")).to_have_text("3")
    state = inbox(student)
    assert state["unread"] == 3 and [item["read"] for item in state["items"]] == [False, False, True, False], state

    # A click outside closes it; "mark all" clears the count.
    page.goto(BASE + "/workspace")
    bell.click()
    expect(panel).to_be_visible()
    page.locator(".wsp-content").click(position={"x": 700, "y": 40})
    expect(panel).to_have_count(0)
    bell.click()
    panel.get_by_role("button", name="Бүгдийг уншсан", exact=True).click()
    expect(bell.locator(".wsp-notify-count")).to_have_count(0)
    expect(panel.locator(".wsp-notify-list li[data-unread]")).to_have_count(0)
    expect(panel.get_by_role("button", name="Бүгдийг уншсан", exact=True)).to_have_count(0)
    assert inbox(student)["unread"] == 0
    panel.get_by_role("button", name="Хаах", exact=True).click()
    expect(panel).to_have_count(0)

    # A plan in its last three days gets one reminder, however often the inbox is read.
    fixture("ending", user_id, "language")
    for _ in range(2):
        state = inbox(student)
        assert [item["kind"] for item in state["items"]].count("plan-ending") == 1 and state["unread"] == 1, state
    ending = next(item for item in state["items"] if item["kind"] == "plan-ending")
    assert ending["title"] == "Багц дуусах гэж байна" and ending["href"] == "/subscribe/language", ending

    # Announcements: only an admin sends them.
    for body in [{"action": "send", "title": "Student title", "body": "Student body text"}, {"action": "withdraw", "id": "x"}]:
        assert student.request.post(ANNOUNCE, headers=ORIGIN, data=body).status == 403, body
    admin = browser.new_context(viewport={"width": 1440, "height": 1000}, color_scheme="light")
    assert admin.request.post(BASE + "/api/auth/sign-in/email", headers=ORIGIN, data={"email": demos[0]["email"], "password": demos[0]["password"]}).ok
    assert admin.request.post(ANNOUNCE, headers={"Origin": "https://untrusted.invalid"}, data={"action": "send", "title": "Origin title", "body": "Origin body text"}).status == 403
    for bad in [{}, {"action": "publish"}, {"action": "send", "title": "ab", "body": "Long enough text"}, {"action": "send", "title": "Valid title", "body": "abc"},
                {"action": "send", "title": "Valid title", "body": "Long enough text", "href": "https://evil.example"}, {"action": "send", "title": "Valid title", "body": "Long enough text", "href": "//evil.example"},
                {"action": "send", "title": "Valid title", "body": "Long enough text", "email": "nobody"}, {"action": "send", "title": "Valid title", "body": "Long enough text", "userId": user_id},
                {"action": "withdraw"}]:
        assert admin.request.post(ANNOUNCE, headers=ORIGIN, data=bad).status == 400, bad
    assert admin.request.post(ANNOUNCE, headers=ORIGIN, data={"action": "send", "title": "Valid title", "body": "Long enough text", "email": "qa-notify-missing@example.invalid"}).status == 404
    assert admin.request.post(ANNOUNCE, headers=ORIGIN, data={"action": "withdraw", "id": "missing"}).status == 404

    admin_page = admin.new_page()
    admin_page.on("pageerror", lambda error: errors.append(str(error)))
    admin_page.on("dialog", lambda dialog: dialog.accept())
    admin_page.goto(BASE + "/admin?tab=announcements")
    expect(admin_page.locator(".wsp-nav-item[aria-current='page']")).to_have_text("Мэдэгдэл")
    form = admin_page.locator("form.admin-announce")
    title = "QA мэдэгдэл " + uuid4().hex[:8]
    form.get_by_label("Гарчиг").fill(title)
    form.get_by_label("Текст").fill("Шинэ mock нэмэгдлээ.")
    form.get_by_label("Холбоос (заавал биш)").fill("/exams")
    form.get_by_role("button", name="Илгээх", exact=True).click()
    expect(form.locator("[role='status']")).to_have_text("Бүх хэрэглэгчид илгээлээ.")
    row = admin_page.locator(".admin-table-wrap tbody tr", has_text=title)
    expect(row).to_have_count(1)
    expect(row).to_contain_text("0 / 0")
    admin_page.screenshot(path=str(ART / "notifications-admin.png"), full_page=True)

    # It reaches each account when its inbox is next read, once.
    for _ in range(2):
        state = inbox(student)
        assert [item["title"] for item in state["items"]].count(title) == 1 and state["unread"] == 2, state
    sent = next(item for item in state["items"] if item["title"] == title)
    assert sent["kind"] == "announcement" and sent["href"] == "/exams" and sent["body"] == "Шинэ mock нэмэгдлээ."
    assert [item["title"] for item in inbox(other)["items"]] == [title]
    # An account created after the announcement does not receive it.
    late = browser.new_context()
    sign_up(late, "late-")
    assert inbox(late) == {"items": [], "unread": 0}
    admin_page.reload()
    expect(row).to_contain_text("2 / 0")

    # To one member by email: it lands at once, in that inbox only.
    personal = "QA хувийн " + uuid4().hex[:8]
    form.get_by_label("Гарчиг").fill(personal)
    form.get_by_label("Текст").fill("Зөвхөн танд.")
    form.get_by_label("Нэг хэрэглэгчийн имэйл (хоосон бол бүгдэд)").fill(email.upper())
    form.get_by_role("button", name="Илгээх", exact=True).click()
    expect(form.locator("[role='status']")).to_have_text("Илгээлээ.")
    state = inbox(student)
    assert state["items"][0]["title"] == personal and state["items"][0]["href"] is None and state["unread"] == 3, state
    assert personal not in [item["title"] for item in inbox(other)["items"]]
    expect(admin_page.locator(".admin-table-wrap tbody tr", has_text=personal)).to_have_count(0)

    # A notice without a link is marked read in place.
    page.goto(BASE + "/workspace")
    expect(bell.locator(".wsp-notify-count")).to_have_text("3")
    bell.click()
    panel.locator(".wsp-notify-list button", has_text=personal).click()
    expect(panel).to_be_visible()
    expect(panel.locator(".wsp-notify-list li", has_text=personal)).not_to_have_attribute("data-unread", "")
    expect(bell.locator(".wsp-notify-count")).to_have_text("2")
    page.keyboard.press("Escape")

    # Collapsed rail: the count stays on the icon.
    page.locator(".wsp-rail-toggle").click()
    expect(page.locator("html")).to_have_attribute("data-ws-rail", "collapsed")
    expect(bell.locator(".wsp-notify-count")).to_be_visible()
    bell.click()
    expect(panel).to_be_visible()
    box, rail = panel.bounding_box(), page.locator(".wsp-side").bounding_box()
    assert box["x"] >= rail["x"] + rail["width"], (box, rail)
    page.screenshot(path=str(ART / "notifications-inbox-collapsed.png"))
    page.keyboard.press("Escape")
    page.locator(".wsp-rail-toggle").click()

    # Phones: a bell in the top bar opens the inbox as a sheet; nothing scrolls sideways.
    for width in [390, 320]:
        phone = browser.new_context(viewport={"width": width, "height": 800}, color_scheme="dark", storage_state=student.storage_state())
        phone_page = phone.new_page()
        phone_page.on("pageerror", lambda error: errors.append(str(error)))
        phone_page.goto(BASE + "/workspace")
        top = phone_page.locator(".wsp-topbar .wsp-notify-top")
        expect(top).to_be_visible()
        expect(top.locator(".wsp-notify-count")).to_have_text("2")
        top.click()
        sheet = phone_page.locator("#wsp-notify")
        expect(sheet).to_be_visible()
        expect(sheet.locator(".wsp-notify-list li")).to_have_count(7)
        box = sheet.bounding_box()
        assert box["x"] >= 0 and box["x"] + box["width"] <= width and box["y"] >= 0 and box["y"] + box["height"] <= 800, (width, box)
        assert phone_page.evaluate("document.documentElement.scrollWidth") <= width, width
        phone_page.screenshot(path=str(ART / f"notifications-inbox-{width}-dark.png"))
        phone_page.keyboard.press("Escape")
        expect(sheet).to_have_count(0)
        # The menu's row opens the same inbox and closes the menu.
        phone_page.locator(".wsp-topbar button[aria-controls='wsp-side']").click()
        phone_page.locator(".wsp-side .wsp-notify-row").click()
        expect(sheet).to_be_visible()
        expect(phone_page.locator(".wsp")).not_to_have_attribute("data-open", "")
        phone.close()

    # Withdrawing an announcement removes it from every inbox and from the list.
    admin_page.reload()
    row.get_by_role("button", name="Буцаах", exact=True).click()
    expect(row).to_have_count(0)
    assert title not in [item["title"] for item in inbox(student)["items"]]
    assert inbox(other) == {"items": [], "unread": 0}
    admin_page.goto(BASE + "/admin?tab=audit&filter=withdraw-announcement")
    expect(admin_page.locator(".admin-table-wrap tbody tr").first).to_contain_text(title)
    admin_page.goto(BASE + "/admin?tab=audit&filter=announce")
    expect(admin_page.locator(".admin-table-wrap tbody tr").first).to_contain_text(personal)

    # A month granted by an admin is reported to the member.
    assert admin.request.post(BASE + "/api/admin", headers=ORIGIN, data={"action": "grant-month", "target": other_id, "program": "entrance", "reason": "Notification QA grant"}).ok
    state = inbox(other)
    assert state["unread"] == 1 and state["items"][0]["kind"] == "plan-granted" and "ЭЕШ багц" in state["items"][0]["body"], state

    assert not errors, errors
    browser.close()
print("notifications smoke passed")
