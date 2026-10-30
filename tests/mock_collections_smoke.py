"""Public collection navigation, original direct links and responsive layouts."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

BASE=os.environ.get("TEST_BASE_URL","http://localhost:3001").rstrip("/")
ART=Path(__file__).resolve().parent.parent/"artifacts/mock-collections"
ART.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={"width":1440,"height":1000},reduced_motion="reduce")
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.goto(BASE+"/exams")
    expect(page.locator(".exam-card")).to_have_count(4)
    for program,prefix,title in [("sat","sat-full","Digital SAT"),("ielts","ielts-academic","IELTS Academic")]:
        card=page.locator(".exam-card."+program)
        expect(card).to_have_count(1)
        expect(card.locator(".status")).to_have_text("6 бүтэн mock")
        card.get_by_role("link",name="Mock сонгох →").click()
        expect(page).to_have_url(BASE+"/exams/"+program)
        expect(page.get_by_role("heading",level=1)).to_have_text(title+" шалгалтууд")
        expect(page.locator(".mock-variant")).to_have_count(6)
        for n in range(1,7):
            link=page.get_by_role("link",name=f"{title} · Full Mock {n:02}",exact=True)
            expect(link).to_have_attribute("href",f"/exams/{prefix}-{n:02}")
        for theme in ["light","dark"]:
            page.evaluate("theme=>document.documentElement.dataset.theme=theme",theme)
            for width in [1440,760,390,320]:
                page.set_viewport_size({"width":width,"height":1000})
                assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),(program,theme,width)
                columns=page.locator(".english-variation-grid").evaluate("el=>getComputedStyle(el).gridTemplateColumns.split(' ').length")
                assert columns==(3 if width>900 else 2 if width>600 else 1),(width,columns)
                page.screenshot(path=str(ART/f"{program}-{theme}-{width}.png"),full_page=True)
        page.get_by_role("link",name=title+" · Full Mock 06",exact=True).click()
        expect(page).to_have_url(BASE+f"/exams/{prefix}-06")
        expect(page.get_by_role("heading",level=1)).to_have_text(title+" · Full Mock 06")
        page.locator(".briefing-breadcrumb").get_by_role("link",name=title,exact=True).click()
        expect(page).to_have_url(BASE+"/exams/"+program)
        page.goto(BASE+"/exams")
    page.goto(BASE)
    for program in ["sat","ielts"]:
        expect(page.locator(f'.launch-panel a[href="/exams/{program}"]')).to_be_visible()
        page.goto(BASE+"/programs/"+program)
        expect(page.locator(f'.program-mock-card a[href="/exams/{program}"]')).to_be_visible()
        page.goto(BASE)
    assert page.goto(BASE+"/exams/sat-full-01").status==200
    assert page.goto(BASE+"/exams/ielts-academic-01").status==200
    assert page.goto(BASE+"/exams/not-an-exam").status==404
    assert not errors,errors
    browser.close()
print("PASS: four catalog items, six mocks per collection, selection/back links, home/program discovery, original direct links and 1440/760/390/320px themes with 3/2/1-column grids.")
