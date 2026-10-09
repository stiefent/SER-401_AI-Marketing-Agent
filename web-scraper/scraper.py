from playwright.sync_api import sync_playwright

def scrape_website(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        page = browser.new_page()
        page.goto(url)

        input("Press enter once logged in...")
        
        browser.close()



if __name__ == "__main__":
    scrape_website("https://www.instagram.com")