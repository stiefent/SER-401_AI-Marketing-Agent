from playwright.sync_api import sync_playwright
import json
import os

filename = "search_data.json"

def scrape_website(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        search_id = len(search_data) + 1

        page = browser.new_page()
        page.goto(url)

        input("Press enter once logged in...")
        choice = input("Finding Reels or a creator? ")
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
                
                #TODO: collect reel data for json input
                #reel_data= {}
                search_data.append({"id": search_id, "search_type": "reel", "data": "Example"}) #replace example with reel_data
                search_id += 1
                page.go_back()

        elif choice == "creator" or choice == "a creator":
            creator = input("Enter a creator: ")
            page.get_by_label("Search input").fill(creator)
            container = page.locator("main")
            links = container.locator("a")
            links.nth(1).click()
            page.pause()
            
            #TODO: collect creator data for json input
            #creator_data = {}
            search_data.append({"id": search_id, "search_type": "creator", "data": "Example"}) #replace example with creator_data
            search_id += 1

        else:
            print("Sorry, I didn't understand that.")

        # Store collected data in search_data.json file
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(search_data, f, indent=4)
        
        print(f"{len(search_data)} data entries saved to search_data.json")
        
        browser.close()


# Load existing data if the search_data file exists
if os.path.exists(filename):
    with open(filename, "r", encoding="utf-8") as f:
        try:
            search_data = json.load(f)
        except json.JSONDecodeError:
            search_data = []
else:
    search_data = []


if __name__ == "__main__":
    scrape_website("https://www.instagram.com")