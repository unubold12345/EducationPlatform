import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ACCOUNTS=json.loads((ROOT/"src/data/demo-accounts.json").read_text(encoding="utf-8"))
ART=ROOT/"artifacts"
ART.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    errors=[]
    for index,account in enumerate(ACCOUNTS):
        context=browser.new_context(color_scheme="dark",viewport={"width":1440,"height":1000})
        page=context.new_page()
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.goto(BASE+"/login?next=%2Fprofile")
        page.wait_for_load_state("networkidle")
        expect(page.locator(".demo-account-button")).to_have_count(5)
        for button_index,item in enumerate(ACCOUNTS):
            page.locator(".demo-account-button").nth(button_index).click()
            expect(page.get_by_label("Имэйл",exact=True)).to_have_value(item["email"])
            expect(page.get_by_label("Нууц үг",exact=True)).to_have_value(item["password"])
            expect(page.locator(".demo-account-button").nth(button_index)).to_have_attribute("aria-pressed","true")
            expect(page.get_by_role("button",name="Нэвтрэх",exact=True)).to_be_focused()
        page.locator(".demo-account-button").nth(index).click()
        if index==0:
            page.screenshot(path=str(ART/"login-demo-desktop.png"),full_page=True)
            for width in [390,320]:
                page.set_viewport_size({"width":width,"height":844})
                assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
                page.screenshot(path=str(ART/("login-demo-"+str(width)+".png")),full_page=True)
            page.get_by_label("Имэйл",exact=True).fill("manual@example.invalid")
            expect(page.locator('.demo-account-button[aria-pressed="true"]')).to_have_count(0)
            page.locator(".demo-account-button").first.click()
        page.keyboard.press("Enter")
        expect(page).to_have_url(BASE+"/profile",timeout=20000)
        expect(page.locator(".identity-body h2")).to_have_text(account["name"])
        expect(page.locator(".identity-email")).to_have_text(account["email"])
        expect(page.locator(".account-entry")).to_have_attribute("href","/profile")
        page.get_by_role("button",name="Гарах",exact=True).click()
        expect(page).to_have_url(BASE+"/login")
        context.close()
    context=browser.new_context(color_scheme="light",viewport={"width":390,"height":844})
    page=context.new_page();page.goto(BASE+"/login");page.wait_for_load_state("networkidle")
    page.screenshot(path=str(ART/"login-demo-light-mobile.png"),full_page=True)
    page.goto(BASE+"/register")
    expect(page.locator(".demo-account-button")).to_have_count(0)
    assert not errors,errors
    browser.close()
print("PASS: five real demo accounts, every fill button, selection/manual edits, submit focus/Enter login, profile return routing, correct identities, logout and light/dark mobile layouts")
