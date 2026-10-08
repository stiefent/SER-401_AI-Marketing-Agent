from playwright.sync_api import sync_playwright
import random

def human_pause(page, minimum=0.3, maximum=1.2):
    page.wait_for_timeout(random.randint(
        int(minimum * 1000),
        int(maximum * 1000)
    ))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto("https://bsky.app")
    page.wait_for_load_state("domcontentloaded")

    human_pause(page, 2, 4)

    # Click "Explore the app"
    page.get_by_text("Explore the app", exact=True).click()

    human_pause(page, 1, 2)

    # Find and use the search box
    search_box = page.locator('input[placeholder*="Search" i]').first
    search_box.click()

    human_pause(page, 0.5, 1)

    # Type at a slightly varied pace
    search_box.press_sequentially(
        "gaming",
        delay=random.randint(70, 160)
    )

    human_pause(page, 0.5, 1.5)

    search_box.press("Enter")

    # Let the results remain visible
    page.wait_for_timeout(60000)

    browser.close()