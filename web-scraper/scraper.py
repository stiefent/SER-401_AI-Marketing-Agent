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

        ## YOUTUBE
        if url == "https://www.youtube.com":
            choice = input("Searching Videos or Shorts? ")
            if choice.lower() == "videos":
                search_input = input("What would you like to search? ")
                page.get_by_role("combobox", name="Search").click()
                page.get_by_role("combobox", name="Search").fill(search_input)
                page.get_by_role("combobox", name="Search").press('Enter')
                first_video = page.locator("ytd-video-renderer #video-title").first
                first_video.wait_for(state="visible")
                first_video.click()

                page.wait_for_selector("h1.ytd-watch-metadata yt-formatted-string", timeout=10000)
                title = page.locator("h1.ytd-watch-metadata yt-formatted-string").first.text_content()
                try:
                    page.wait_for_selector("#description-inline-expander #expand", timeout=5000)
                    page.locator("#description-inline-expander #expand").click()
                    page.wait_for_timeout(500)
                except Exception:
                    print("Could not click expand button or description already expanded.")
                metrics = page.locator("#info-container yt-formatted-string span").all_text_contents()
                views = metrics[0] if len(metrics) > 0 else "N/A"
                upload_date = metrics[2] if len(metrics) > 2 else "N/A"
                channel = page.locator("#upload-info #channel-name a").inner_text() 
                desc = page.locator("#description-inline-expander").text_content()
                likes = desc[desc.rfind("Likes")+5 : desc.find('\n', desc.rfind("Likes")+5)]

                yt_data = {
                    "title": title, 
                    "channel": channel,
                    "views": views, 
                    "likes": likes,
                    "upload_date": upload_date,
                    "description": desc
                }
                search_data.append({
                    "id": search_id, 
                    "media": "YouTube", 
                    "search_type": "video", 
                    "data": yt_data
                })

            elif choice.lower() == "shorts":
                print("TBD")
            
            input("Press enter to continue")
        
        ## INSTAGRAM
        elif url == "https://instagram.com":
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
                    search_data.append({"id": search_id, "media": "Instagram", "search_type": "reel", "data": "Example"}) #replace example with reel_data
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
                search_data.append({"id": search_id, "media": "Instagram", "search_type": "creator", "data": "Example"}) #replace example with creator_data
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
    site = input("Would you like to search YouTube or Instagram? ")
    if site.lower() == "youtube":
        scrape_website("https://www.youtube.com")
    elif site.lower() == "instagram":
        scrape_website("https://instagram.com")
    else:
        print("Website not recognized")