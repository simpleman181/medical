from pathlib import Path
from playwright.sync_api import sync_playwright

DRUG_URL="https://www.cdscoonline.gov.in/CDSCO/cdscoDrugs"
SEC_URL="https://cdsco.gov.in/opencms/opencms/en/Committees/SEC/"

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"data"/"cdsco_probe"
OUT.mkdir(parents=True,exist_ok=True)

def dump_page(page,name):
    (OUT/f"{name}.html").write_text(page.content(),encoding="utf-8")
    print(f"{name}: title={page.title()!r}, url={page.url}")
    print(f"{name}: links={page.locator('a').count()}, inputs={page.locator('input').count()}, selects={page.locator('select').count()}, buttons={page.locator('button').count()}")
    text=" ".join(page.locator("body").inner_text().split())
    print(f"{name}: body chars={len(text)}")
    print(f"{name}: body preview={text[:1000]!r}")

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page()
    print("Opening CDSCO Drug Database...")
    page.goto(DRUG_URL,wait_until="networkidle",timeout=120000)
    dump_page(page,"drug_database")
    print("\nOpening CDSCO SEC...")
    page.goto(SEC_URL,wait_until="networkidle",timeout=120000)
    dump_page(page,"sec")
    pdf_links=page.locator("a").evaluate_all("""els => els.map(a => ({text:(a.innerText||'').trim(),href:a.href})).filter(x => x.href && x.href.toLowerCase().includes('.pdf'))""")
    print(f"SEC rendered PDF links: {len(pdf_links)}")
    for item in pdf_links[:20]:
        print(item)
    browser.close()
