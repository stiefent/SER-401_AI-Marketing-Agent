from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # Navigate to youtube main site
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto('https://youtube.com')

    # Navigate to 'YouTube API Tutorial' search results page
    page.get_by_role("combobox", name="Search").click()
    page.get_by_role("combobox", name="Search").fill('YouTube API Tutorial')
    page.get_by_role("combobox", name="Search").press('Enter')

    # Check info of first non-ad video
    page.wait_for_selector("ytd-video-renderer")
    video1 = page.locator("ytd-video-renderer:not(:has-text('Sponsored'))").first
    video1_title = video1.locator("#video-title")
    video1_title.click()

    input("Press enter to close")
    page.close()
    browser.close()
