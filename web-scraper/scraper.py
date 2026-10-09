from playwright.sync_api import sync_playwright

def scrape_website(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        page = browser.new_page()
        page.goto(url)

        input("Press enter once logged in...")
        choice = input("Finding Reels or a creator?")
        choice = choice.lower()

        page.get_by_label("Search").click()
        if choice == "reels":
            hashtag = input("Enter a hashtag: ")
            amount = int(input("Enter amount of Reels: "))
            page.get_by_label("Search input").fill(hashtag)
            page.get_by_label("Keyword").click()
            for i in range(amount):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.locator('a[href*="/p/"]').nth(i).click()
                page.get_by_label("More Options").click()
                page.get_by_role("button", name="Go to Post").click()
                #TODO: Insert data collection Code
                page.go_back()

        elif choice == "creator" or choice == "a creator":
            creator = input("Enter a creator: ")
            page.get_by_label("Search input").fill(creator)
            container = page.locator("main")
            links = container.locator("a")
            links.nth(1).click()
            page.pause()

        else:
            print("Sorry, I didn't understand that.")

        browser.close()



if __name__ == "__main__":
    scrape_website("https://www.instagram.com")