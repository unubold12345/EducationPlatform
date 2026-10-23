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
    expect(page.get_by_role("link", name="lexlab.site-ийн эрх үзэх")).to_have_attribute("href", "https://lexlab.site/plan")
    expect(page.locator('#lawtest-title')).to_have_text('lexlab.site')
    original_theme = page.locator('html').get_attribute('data-theme')
    for theme in ['light', 'dark']:
        page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', theme)
        logo = page.locator('.lexlab-logo-'+theme)
        expect(logo).to_be_visible()
        page.wait_for_function('(theme)=>{const image=document.querySelector(".lexlab-logo-"+theme);return image.complete && image.naturalWidth>0}', arg=theme)
        page.locator('.lawtest').screenshot(path=str(artifacts/('lexlab-'+theme+'.png')))
    page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', original_theme)
    page.get_by_role("link", name="Хөтөлбөрүүд", exact=True).click()
    expect(page.locator(".program-card")).to_have_count(3)
    page.locator('a[href="/programs/sat"]').click()
    expect(page.get_by_role("heading", name="SAT", exact=True)).to_be_visible()
    page.get_by_role("link", name="Жишиг дасгал эхлэх").click()
    expect(page.get_by_role("heading", name="If 3x + 7 = 22")).to_be_visible()
    page.get_by_role("radio").nth(1).check()
    page.get_by_role("button", name="Дараах").click()
    page.get_by_role("radio").nth(2).check()
    page.get_by_role("button", name="Өмнөх").click()
    expect(page.get_by_role("radio").nth(1)).to_be_checked()
    page.get_by_role("button", name="Бодлого 3", exact=False).click()
    expect(page.get_by_role("button", name="Хариугаа шалгах")).to_be_disabled()
    page.get_by_role("radio").nth(3).check()
    # Check recoverable submission failure without losing answers.
    page.route("**/api/practice", lambda route: route.abort())
    page.get_by_role("button", name="Хариугаа шалгах").click()
    expect(page.locator('.error-message[role="alert"]')).to_be_visible()
    expect(page.get_by_role("radio").nth(3)).to_be_checked()
    page.unroute("**/api/practice")
    page.get_by_role("button", name="Хариугаа шалгах").click()
    expect(page.locator(".score")).to_have_text("3 / 3")
    expect(page.locator(".result-summary h2")).to_be_focused()
    expect(page.locator(".review")).to_have_count(3)
    page.screenshot(path=str(artifacts / "practice-results.png"), full_page=True)
    page.get_by_role("button", name="Дахин бодох").click()
    expect(page.get_by_role("radio").nth(1)).not_to_be_checked()
    page.goto(BASE + "/programs/ielts")
    expect(page.get_by_role("heading", name="Writing & Speaking workshop")).to_be_visible()
    response = page.goto(BASE + "/programs/not-a-program")
    assert response.status == 404
    expect(page.get_by_role("heading", name="Энэ хуудас олдсонгүй.")).to_be_visible()
    assert page.request.post(BASE + "/api/practice", data={"answers": [1, 2]}).status == 400
    assert page.request.post(BASE + "/api/practice", data={"answers": [1, 2, 3], "score": 999}).json()["score"] == 3
    assert page.request.post(BASE + "/api/practice", data="bad", headers={"Content-Type": "application/json"}).status == 400
    assert page.request.post(BASE + "/api/practice", data="bad", headers={"Content-Type": "text/plain"}).status == 415
    # Desktop keyboard entry includes an accessible skip link.
    page.goto(BASE)
    page.keyboard.press("Tab")
    expect(page.get_by_role("link", name="Үндсэн агуулга руу")).to_be_focused()
    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        for path in ["/", "/programs", "/programs/sat", "/programs/ielts", "/programs/entrance", "/practice"]:
            page.goto(BASE + path)
            page.wait_for_load_state("networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"Overflow: {width} {path}"
        if width == 390:
            page.goto(BASE)
            page.screenshot(path=str(artifacts / "homepage-mobile.png"), full_page=True)
            page.goto(BASE + "/practice")
            page.get_by_role("radio").nth(0).check()
            page.get_by_role("button", name="Дараах").click()
            page.get_by_role("radio").nth(0).check()
            page.get_by_role("button", name="Дараах").click()
            page.get_by_role("radio").nth(0).check()
            page.get_by_role("button", name="Хариугаа шалгах").click()
            expect(page.locator(".score")).to_have_text("0 / 3")
            page.screenshot(path=str(artifacts / "practice-mobile.png"), full_page=True)
    assert not errors, errors
    browser.close()
    print("PASS: navigation, grading, back navigation, retry, reset, API validation, 404, keyboard skip link, desktop and mobile layouts; no browser page errors.")



