from playwright.sync_api import sync_playwright

def scrape_website(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        page = browser.new_page()
        page.goto(url)

        input("Press enter once logged in...")
        hashtag = input("Enter a hashtag: ")

        page.get_by_label("Search").click()
        page.get_by_label("Search input").fill(hashtag)
        page.get_by_label("Keyword").click()
        page.locator('a[href*="/p/"]').first.click()

        browser.close()



if __name__ == "__main__":
    scrape_website("https://www.instagram.com")