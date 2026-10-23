import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(color_scheme="dark", viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    expect(page.locator("html")).to_have_attribute("data-theme", "dark")
    assert page.evaluate("getComputedStyle(document.body).backgroundColor") == "rgb(7, 7, 13)"
    page.evaluate("document.fonts.ready")
    assert "manrope" in page.evaluate("getComputedStyle(document.body).fontFamily").lower()
    expect(page.locator('.launch-panel a[href="/exams/sat-full-01"]')).to_be_visible()
    expect(page.locator('.launch-panel a[href="/exams/ielts-academic-01"]')).to_be_visible()
    expect(page.locator('.launch-panel a[href="/practice"]')).to_be_visible()
    page.screenshot(path=str(ARTIFACTS / "theme-home-dark.png"), full_page=True)
    page.set_viewport_size({"width": 320, "height": 844})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.screenshot(path=str(ARTIFACTS / "theme-home-dark-mobile.png"), full_page=True)
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.locator(".theme-toggle").click()
    expect(page.locator("html")).to_have_attribute("data-theme", "light")
    page.reload()
    expect(page.locator("html")).to_have_attribute("data-theme", "light")
    page.locator(".theme-toggle").focus()
    page.keyboard.press("Enter")
    expect(page.locator("html")).to_have_attribute("data-theme", "dark")
    for route in ["/exams", "/exams/ielts-academic-01", "/practice", "/login", "/programs/entrance", "/workshops/ielts-writing-data"]:
        page.goto(BASE + route)
        page.wait_for_load_state("networkidle")
        expect(page.locator("html")).to_have_attribute("data-theme", "dark")
        if route.startswith("/exams"):
            expect(page.locator('nav a[href="/exams"]')).to_have_attribute("aria-current", "page")
        for width in [1440, 320]:
            page.set_viewport_size({"width": width, "height": 1000})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (route, width)
            if route == "/exams" and width == 1440:
                page.screenshot(path=str(ARTIFACTS / "theme-exams-desktop.png"), full_page=True)
        page.screenshot(path=str(ARTIFACTS / ("theme" + route.replace("/", "-") + "-mobile.png")), full_page=True)
    context.close()
    light = browser.new_context(color_scheme="light")
    page = light.new_page()
    page.goto(BASE)
    expect(page.locator("html")).to_have_attribute("data-theme", "light")
    light.close()
    assert not errors, errors
    browser.close()
print("Theme: indigo, Manrope, system default, saved overrides, keyboard toggle, routes and mobile passed")
