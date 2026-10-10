import os
from dotenv import load_dotenv
from googleapiclient.discovery import build

load_dotenv()
youtube = build("youtube", "v3", developerKey=os.getenv("YOUTUBE_API_KEY"))

response = youtube.videos().list(
    part="snippet,statistics",
    id="dQw4w9WgXcQ"
).execute()

video = response["items"][0]
print(video["snippet"]["title"])
print(video["statistics"]["viewCount"], "views")