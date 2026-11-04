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
    assert context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "sat-full-01"}).status == 401
    assert context.request.post(BASE + "/api/mock-attempts", headers={"Origin": "https://untrusted.invalid"}, data={"slug": "sat-full-01"}).status == 403
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
    # A new account has an empty history that points at the exams, and no paid access.
    expect(page.locator(".db-next")).to_contain_text("Түүх хоосон байна")
    expect(page.locator('.db-next a[href="/exams"]')).to_be_visible()
    expect(page.locator(".learning-stats strong")).to_have_text(["0", "0"])
    assert context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "sat-full-01"}).status == 402
    page.screenshot(path=str(artifacts / "dashboard-desktop.png"), full_page=True)
    session = context.request.get(BASE + "/api/auth/get-session")
    assert session.json()["user"]["email"] == email and "no-store" in session.headers.get("cache-control", "no-store")
    page.get_by_role("button", name="Гарах", exact=True).click()
    expect(page).to_have_url(BASE + "/login")
    assert context.request.get(BASE + "/api/auth/get-session").json() is None
    assert context.request.post(BASE + "/api/mock-attempts", headers=ORIGIN, data={"slug": "sat-full-01"}).status == 401
    page.get_by_label("Имэйл", exact=True).fill(email)
    page.get_by_label("Нууц үг", exact=True).fill("incorrect-password")
    page.get_by_role("button", name="Нэвтрэх", exact=True).click()
    expect(page.locator('.error-message[role="alert"]')).to_be_visible()
    page.get_by_label("Нууц үг", exact=True).fill(password)
    page.get_by_role("button", name="Нэвтрэх", exact=True).click()
    expect(page).to_have_url(BASE + "/dashboard")
    expect(page.get_by_role("heading", name="Сайн уу, Туршилтын сурагч.")).to_be_visible()
    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        for path in ["/", "/dashboard", "/profile"]:
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
print("PASS: registration, login/logout, wrong password, signed-out and foreign-origin denial, empty dashboard, 320/390px layouts. Attempt ownership and autosave are covered by the exam suites.")
print("Test accounts use qa- prefixes and example.invalid addresses; no email was sent.")

