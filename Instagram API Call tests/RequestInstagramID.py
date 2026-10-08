import requests

#Works
ACCESS_TOKEN = "EAAOhyltO1f0BSm3OZAsxySmmmF9guzwT8YDjjrf6Gc9VTqBx91FWSZBu5pOI9hBxZASW6sdLmkZC4XfvZBBBVcnaEgZCPp5ELZAimNwmegpFSS2y0IrgubVZBL1XU0X0ibyWW35YYaEXG54fW6f9CahScuXNrymGGZA9bfxP3pAAPlS2431IMqdCC3g8IWxoXA6hc9sYrxNTqYJlGH3BPT6weN9j4ZAfoC53kZBKrZC7"

url = "https://graph.instagram.com/v23.0/me"

params = {
    "fields": "id,name",
    "access_token": ACCESS_TOKEN
}

response = requests.get(url, params=params)

print(response.status_code)
print(response.text)