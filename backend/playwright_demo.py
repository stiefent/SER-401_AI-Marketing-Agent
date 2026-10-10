from playwright.sync_api import sync_playwright

CHANNEL_URL = "https://www.youtube.com/@AthleanX/videos"


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        print(f"Navigating to {CHANNEL_URL}")
        page.goto(CHANNEL_URL, wait_until="domcontentloaded")

        try:
            page.get_by_role("button", name="Accept all").click(timeout=5000)
            print("Dismissed consent dialog")
        except Exception:
            print("No consent dialog")

        page.wait_for_selector("ytd-rich-item-renderer", timeout=15000)

        for _ in range(3):
            page.keyboard.press("End")
            page.wait_for_timeout(1500)

        titles = page.locator("ytd-rich-item-renderer").get_by_role("link").all_inner_texts()
        titles = [t.strip() for t in titles if t.strip()]

        print(f"\nFound {len(titles)} video titles:\n")
        for i, title in enumerate(titles[:15], 1):
            print(f"{i:>3}. {title}")

        page.screenshot(path="channel_page.png")
        print("\nSaved screenshot to channel_page.png")

        page.wait_for_timeout(3000)
        browser.close()


if __name__ == "__main__":
    run()