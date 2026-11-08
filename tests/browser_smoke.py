import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("TEST_BASE_URL", "http://localhost:3001").rstrip("/")
artifacts = Path(__file__).resolve().parent.parent / "artifacts"
artifacts.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    response = page.goto(BASE)
    assert response.status == 200
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("heading", name="Том зорилго.")).to_be_visible()
    assert page.locator("html").get_attribute("lang") == "mn"
    page.screenshot(path=str(artifacts / "homepage-desktop.png"), full_page=True)
    expect(page.get_by_role("link", name="Lexlab-ийн эрх үзэх")).to_have_attribute("href", "https://lexlab.site/plan")
    expect(page.locator('#lawtest-title')).to_have_text('Lexlab')
    original_theme = page.locator('html').get_attribute('data-theme')
    for theme in ['light', 'dark']:
        page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', theme)
        logo = page.locator('.lexlab-logo-'+theme)
        expect(logo).to_be_visible()
        # The complete homepage puts this retained artwork farther down; trigger its lazy image load.
        logo.scroll_into_view_if_needed()
        page.wait_for_function('(theme)=>{const image=document.querySelector(".lexlab-logo-"+theme);return image.complete && image.naturalWidth>0}', arg=theme)
        page.locator('.lawtest').screenshot(path=str(artifacts/('lexlab-'+theme+'.png')))
    page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', original_theme)
    page.get_by_role("link", name="Хөтөлбөрүүд", exact=True).click()
    expect(page).to_have_url(BASE + "/#programs")
    expect(page.locator(".program-card")).to_have_count(4)
    page.locator('a[href="#program-sat"]').click()
    expect(page).to_have_url(BASE + "/#program-sat")
    expect(page.locator('#program-sat a')).to_have_attribute("href", "/exams/sat")
    # Existing public programme addresses remain available for saved links.
    page.goto(BASE + "/programs/sat")
    expect(page.get_by_role("heading", name="SAT", exact=True)).to_be_visible()
    expect(page.locator(".program-mock-card a")).to_have_attribute("href", "/exams/sat")
    # Practice exercises were removed: their pages and APIs are gone and nothing links to them.
    for path in ["/practice", "/exercises/sat-algebra", "/learn/attempts/missing"]:
        assert page.goto(BASE + path).status == 404, path
    for path in ["/api/practice", "/api/exercises/sat-algebra", "/api/attempts"]:
        assert page.request.post(BASE + path, data={}).status == 404, path
    # The site header links to programmes and the Workspace only; exams, plans and the profile live in the Workspace.
    page.goto(BASE)
    expect(page.locator(".site-header nav a")).to_have_text(["Хөтөлбөрүүд", "Workspace"])
    expect(page.locator('.site-footer a[href="/plans"]')).to_have_count(0)
    for path in ["/", "/programs", "/programs/sat", "/programs/ielts", "/programs/entrance", "/workspace/plans", "/exams"]:
        page.goto(BASE + path)
        assert page.locator('a[href*="/practice"], a[href*="/exercises"], a[href*="/learn/"]').count() == 0, path
    page.goto(BASE + "/programs/ielts")
    expect(page.get_by_role("heading", name="Writing & Speaking workshop")).to_be_visible()
    # The library lists four categories; SAT and IELTS each collect six mocks.
    page.goto(BASE + "/exams")
    expect(page.locator(".library-list .exam-card")).to_have_count(4)
    for program, prefix in [("sat", "sat-full"), ("ielts", "ielts-academic")]:
        page.goto(BASE + "/exams/" + program)
        expect(page.locator(".mock-variant")).to_have_count(6)
        expect(page.locator(f'a[href="/exams/{prefix}-06"]')).to_have_count(1)
    response = page.goto(BASE + "/programs/not-a-program")
    assert response.status == 404
    expect(page.get_by_role("heading", name="Энэ хуудас олдсонгүй.")).to_be_visible()
    # Desktop keyboard entry includes an accessible skip link.
    page.goto(BASE)
    page.keyboard.press("Tab")
    expect(page.get_by_role("link", name="Үндсэн агуулга руу")).to_be_focused()
    # Every Workshop activity, including guest lab entry, lives inside the same Workspace.
    for width in [1440, 390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        for theme in ["light", "dark"]:
            for activity in ["/labs/ielts-writing", "/labs/ielts-speaking", "/labs/ielts-listening", "/workshops/ielts-writing-data"]:
                page.goto(BASE + activity)
                page.evaluate("theme => document.documentElement.dataset.theme = theme", theme)
                expect(page.locator('.wsp-nav a[href="/workspace/workshop"]')).to_have_attribute("aria-current", "page")
                expect(page.locator(".site-header")).to_be_hidden()
                expect(page.locator(".site-footer")).to_be_hidden()
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width, theme, activity)
                page.screenshot(path=str(artifacts / ("workspace-" + activity.rsplit("/", 1)[1] + "-" + theme + "-" + str(width) + ".png")), full_page=True)
        if width < 961:
            page.get_by_role("button", name="Цэс нээх", exact=True).click()
            expect(page.locator(".wsp-side")).to_be_visible()
            page.get_by_role("link", name="Workshop", exact=True).click()
            expect(page).to_have_url(BASE + "/workspace/workshop")
            expect(page.locator(".wsp-side")).to_be_hidden()
    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        for path in ["/", "/programs", "/programs/sat", "/programs/ielts", "/programs/entrance", "/workspace/plans"]:
            page.goto(BASE + path)
            page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"Overflow: {width} {path}"
        if width == 390:
            page.goto(BASE)
            page.screenshot(path=str(artifacts / "homepage-mobile.png"), full_page=True)
    assert not errors, errors
    browser.close()
    print("PASS: navigation, removed exercise routes and links, 404, keyboard skip link, desktop and mobile layouts; no browser page errors.")



