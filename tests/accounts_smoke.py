import os
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ORIGIN = {"Origin": BASE}
run = uuid4().hex[:12]
email = "qa-" + run + "@example.invalid"
password = "Local-Test-" + uuid4().hex
artifacts = Path(__file__).resolve().parent.parent / "artifacts"
artifacts.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    assert context.request.post(BASE + "/api/attempts", headers=ORIGIN).status == 401
    assert context.request.post(BASE + "/api/attempts", headers={"Origin": "https://untrusted.invalid"}).status == 403
    page.goto(BASE + "/dashboard")
    expect(page).to_have_url(BASE + "/login")
    page.get_by_role("link", name="Бүртгүүлэх", exact=True).click()
    page.mouse.move(0, 0)
    page.get_by_label("Нэр", exact=True).fill("Туршилтын сурагч")
    page.get_by_label("Имэйл", exact=True).fill(email)
    page.get_by_label("Нууц үг", exact=True).fill(password)
    page.get_by_role("button", name="Бүртгүүлэх", exact=True).click()
    expect(page).to_have_url(BASE + "/dashboard", timeout=20000)
    expect(page.get_by_role("heading", name="Сайн уу, Туршилтын сурагч.")).to_be_visible()
    page.get_by_role("button", name="Дасгал эхлэх / үргэлжлүүлэх").click()
    page.wait_for_url("**/learn/attempts/*")
    attempt_url = page.url
    attempt_id = attempt_url.rsplit("/", 1)[1]
    endpoint = BASE + "/api/attempts/" + attempt_id
    initial = context.request.get(endpoint).json()
    assert initial["result"] is None
    assert "correct" not in str(initial) and "explanation" not in str(initial)
    assert "no-store" in context.request.get(endpoint).headers["cache-control"]
    # Concurrent/retried starts return the same open attempt.
    starts = page.evaluate("""async () => Promise.all([1,2].map(async () => {
      const response = await fetch('/api/attempts', {method:'POST'});
      return await response.json();
    }))""")
    assert all(item["id"] == attempt_id for item in starts)
    page.get_by_role("radio").nth(1).check()
    expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан")
    page.reload()
    page.get_by_role("button", name="Бодлого 1", exact=True).click()
    expect(page.get_by_role("radio").nth(1)).to_be_checked()
    saved = context.request.get(endpoint).json()
    assert saved["answers"] == [1, None, None]
    stale = context.request.patch(endpoint, headers=ORIGIN, data={"revision": 0, "answers": [0, None, None]})
    assert stale.status == 409
    assert context.request.get(endpoint).json()["answers"] == [1, None, None]
    assert context.request.post(endpoint + "/submit", headers=ORIGIN, data={"revision": saved["revision"], "answers": [1, None, None]}).status == 400
    assert context.request.patch(endpoint, headers=ORIGIN, data={"revision": saved["revision"], "answers": [99, None, None]}).status == 400
    assert context.request.patch(endpoint, headers=ORIGIN, data={"revision": saved["revision"], "answers": [1, None, None], "padding": "x" * 9000}).status == 413
    assert context.request.patch(endpoint, headers={"Origin": "https://untrusted.invalid"}, data={"revision": saved["revision"], "answers": [0, 0, 0]}).status == 403
    # Another student cannot read, overwrite, or submit the first student's work.
    other = browser.new_context()
    other_user = other.request.post(BASE + "/api/auth/sign-up/email", headers=ORIGIN, data={"name": "Other QA", "email": "qa-other-" + run + "@example.invalid", "password": password})
    assert other_user.ok, other_user.status
    assert other.request.get(endpoint).status == 404
    assert other.request.patch(endpoint, headers=ORIGIN, data={"revision": saved["revision"], "answers": [0, 0, 0]}).status == 404
    assert other.request.post(endpoint + "/submit", headers=ORIGIN, data={"revision": saved["revision"], "answers": [0, 0, 0]}).status == 404
    # Simulate another tab saving and show the conflict recovery UI.
    remote = context.request.patch(endpoint, headers=ORIGIN, data={"revision": saved["revision"], "answers": [1, 2, None]})
    assert remote.status == 200
    page.get_by_role("button", name="Бодлого 3", exact=True).click()
    page.get_by_role("radio").nth(3).check()
    expect(page.locator('.error-message[role="alert"]')).to_contain_text("Өөр цонхонд")
    page.get_by_role("button", name="Шинэ хувилбарыг ачаалах").click()
    expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан")
    page.get_by_role("button", name="Бодлого 2", exact=True).click()
    expect(page.get_by_role("radio").nth(2)).to_be_checked()
    page.get_by_role("button", name="Бодлого 3", exact=True).click()
    page.get_by_role("radio").nth(3).check()
    expect(page.get_by_role("status")).to_have_text("Бүх өөрчлөлт хадгалагдсан")
    saved = context.request.get(endpoint).json()
    # Two concurrent submits must produce one immutable result.
    results = page.evaluate("""async ({id,revision}) => Promise.all([1,2].map(async () => {
      const response = await fetch('/api/attempts/' + id + '/submit', {
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({revision,answers:[1,2,3],score:999})
      });
      return {status:response.status,body:await response.json()};
    }))""", {"id": attempt_id, "revision": saved["revision"]})
    assert all(item["status"] == 200 and item["body"]["result"]["score"] == 3 for item in results), results
    assert results[0]["body"] == results[1]["body"], results
    retry = context.request.post(endpoint + "/submit", headers=ORIGIN, data={"revision": 0, "answers": [0, 0, 0]})
    assert retry.status == 200 and retry.json()["result"]["score"] == 3
    assert context.request.patch(endpoint, headers=ORIGIN, data={"revision": 0, "answers": [0, 0, 0]}).status == 409
    page.reload()
    expect(page.locator(".score")).to_have_text("3 / 3")
    page.get_by_role("link", name="Миний бэлтгэл рүү").click()
    expect(page.locator(".attempt-row")).to_have_count(1)
    expect(page.locator(".attempt-row")).to_contain_text("3 / 3 зөв")
    page.screenshot(path=str(artifacts / "dashboard-desktop.png"), full_page=True)
    page.get_by_role("button", name="Гарах", exact=True).click()
    expect(page).to_have_url(BASE + "/login")
    assert context.request.get(endpoint).status == 401
    page.get_by_label("Имэйл", exact=True).fill(email)
    page.get_by_label("Нууц үг", exact=True).fill("incorrect-password")
    page.get_by_role("button", name="Нэвтрэх", exact=True).click()
    expect(page.locator('.error-message[role="alert"]')).to_be_visible()
    page.get_by_label("Нууц үг", exact=True).fill(password)
    page.get_by_role("button", name="Нэвтрэх", exact=True).click()
    expect(page).to_have_url(BASE + "/dashboard")
    page.locator(".attempt-row").click()
    expect(page.locator(".score")).to_have_text("3 / 3")
    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        for path in ["/", "/dashboard", "/learn/attempts/" + attempt_id]:
            page.goto(BASE + path)
            page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), (width,path)
        if width == 390:
            page.goto(BASE + "/dashboard")
            page.screenshot(path=str(artifacts / "dashboard-mobile.png"), full_page=True)
    # Fresh logged-out form screenshots and layout checks.
    mobile = browser.new_context(viewport={"width":320,"height":844}, reduced_motion="reduce")
    form_page = mobile.new_page()
    for path in ["/login", "/register"]:
        form_page.goto(BASE + path)
        form_page.wait_for_load_state("networkidle")
        assert form_page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), path
        form_page.screenshot(path=str(artifacts / (path.strip("/") + "-mobile.png")), full_page=True)
    assert not errors, errors
    browser.close()
print("PASS: registration, login/logout, autosave/resume, private ownership, CAS conflicts, duplicate submission, score integrity, result history, 320/390px layouts.")
print("Test accounts use qa- prefixes and example.invalid addresses; no email was sent.")

