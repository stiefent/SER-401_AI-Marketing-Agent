from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto("https://www.youtube.com")
    page.wait_for_load_state("domcontentloaded")

    print("YouTube is open!")

    input("Press Enter to close the browser...")

    browser.close()