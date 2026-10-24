import os
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ART = Path(__file__).resolve().parent.parent / "artifacts"
ART.mkdir(exist_ok=True)
ORIGIN = {"Origin": BASE}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(color_scheme="dark", viewport={"width":1440,"height":1000})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE)
    expect(page.locator(".education-backdrop svg")).to_have_count(2)
    expect(page.locator(".education-backdrop svg:visible")).to_have_count(1)
    expect(page.locator(".education-backdrop img")).to_have_count(0)
    page.locator(".profile-link").click()
    expect(page).to_have_url(BASE + "/login")
    expect(page.locator(".account-entry")).to_have_text("Нэвтрэх")
    page.goto(BASE+"/profile")
    expect(page).to_have_url(BASE + "/login?next=%2Fprofile")
    page.get_by_role("link",name="Бүртгүүлэх",exact=True).click()
    page.mouse.move(0, 0)
    email = "qa-profile-" + uuid4().hex[:12] + "@example.invalid"
    password = "Local-Test-" + uuid4().hex
    page.get_by_label("Нэр",exact=True).fill("Profile QA")
    page.get_by_label("Имэйл",exact=True).fill(email)
    page.get_by_label("Нууц үг",exact=True).fill(password)
    page.get_by_role("button",name="Бүртгүүлэх",exact=True).click()
    expect(page).to_have_url(BASE + "/profile",timeout=20000)
    expect(page.locator(".profile-counts dd")).to_have_text(["0","0"])
    page.get_by_label("Харагдах нэр").fill("Өүлэн Суралцагч")
    page.get_by_role("button",name="Өөрчлөлт хадгалах").click()
    expect(page.get_by_role("status")).to_have_text("Профайл хадгалагдлаа.")
    expect(page.locator(".identity-body h2")).to_have_text("Өүлэн Суралцагч")
    page.reload()
    expect(page.get_by_label("Харагдах нэр")).to_have_value("Өүлэн Суралцагч")
    page.screenshot(path=str(ART / "profile-desktop-dark.png"),full_page=True)
    # Current-password validation and confirmation prevent accidental changes.
    new_password = "Changed-Local-" + uuid4().hex
    page.get_by_label("Одоогийн нууц үг",exact=True).fill("wrong-password-123")
    page.get_by_label("Шинэ нууц үг",exact=True).fill(new_password)
    page.get_by_label("Шинэ нууц үг давтах",exact=True).fill(new_password + "x")
    page.get_by_role("button",name="Нууц үг шинэчлэх",exact=True).click()
    expect(page.locator(".profile-form .error-message")).to_contain_text("таарахгүй")
    page.get_by_label("Шинэ нууц үг давтах",exact=True).fill(new_password)
    page.get_by_role("button",name="Нууц үг шинэчлэх",exact=True).click()
    expect(page.locator(".profile-form .error-message")).to_contain_text("Одоогийн нууц үгээ")
    other = browser.new_context()
    assert other.request.post(BASE+"/api/auth/sign-in/email",headers=ORIGIN,data={"email":email,"password":password}).status == 200
    page.get_by_label("Одоогийн нууц үг",exact=True).fill(password)
    page.get_by_role("button",name="Нууц үг шинэчлэх",exact=True).click()
    expect(page.get_by_role("status")).to_have_text("Нууц үг шинэчлэгдлээ. Бусад төхөөрөмжөөс гаргалаа.")
    assert other.request.get(BASE+"/api/auth/get-session").json() is None
    other.close()
    assert context.request.get(BASE+"/api/auth/get-session").json()["user"]["email"] == email
    attempt = context.request.post(BASE+"/api/attempts",headers=ORIGIN).json()
    assert "id" in attempt
    page.goto(BASE+"/dashboard")
    expect(page.locator(".learning-stats strong")).to_have_text(["0","0","1"])
    expect(page.locator(".resume-card a")).to_have_attribute("href","/learn/attempts/"+attempt["id"])
    page.screenshot(path=str(ART / "dashboard-polished-dark.png"),full_page=True)
    for scheme in ["dark","light"]:
        page.emulate_media(color_scheme=scheme)
        for route in ["/profile","/dashboard"]:
            page.goto(BASE+route);page.wait_for_load_state("networkidle")
            for width in [1440,390,320]:
                page.set_viewport_size({"width":width,"height":844})
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"),(route,scheme,width)
                expect(page.locator(".profile-link")).to_be_visible()
                if width == 390:
                    page.screenshot(path=str(ART / (route.strip("/")+"-"+scheme+"-mobile.png")),full_page=True)
    page.goto(BASE+"/profile")
    page.get_by_role("button",name="Гарах",exact=True).click()
    expect(page).to_have_url(BASE+"/login")
    page.get_by_label("Имэйл",exact=True).fill(email)
    page.get_by_label("Нууц үг",exact=True).fill(new_password)
    page.get_by_role("button",name="Нэвтрэх",exact=True).click()
    expect(page).to_have_url(BASE+"/dashboard",timeout=20000)
    expect(page.locator(".profile-link")).to_have_attribute("href","/profile")
    page.locator(".profile-link").click()
    expect(page.locator(".identity-body h2")).to_have_text("Өүлэн Суралцагч")
    assert not errors,errors
    browser.close()
print("PASS: private profile, registration return, saved name, password confirmation/current-password checks, credential change, other-session revocation, dashboard totals/resume, inline sketches and light/dark mobile layouts")
