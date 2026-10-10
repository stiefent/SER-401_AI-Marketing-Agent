import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from googleapiclient.discovery import build

load_dotenv()
youtube = build("youtube", "v3", developerKey=os.getenv("YOUTUBE_API_KEY"))


def search_videos(query, days_back=14, max_results=50):
    """Find video IDs matching a query, published in the last N days.
    Costs 1 of your 100 daily search calls."""
    published_after = (
            datetime.now(timezone.utc) - timedelta(days=days_back)
    ).isoformat().replace("+00:00", "Z")

    response = youtube.search().list(
        part="id",
        q=query,
        type="video",
        order="viewCount",
        maxResults=max_results,
        publishedAfter=published_after,
    ).execute()

    return [item["id"]["videoId"] for item in response["items"]]


def get_video_details(video_ids):
    """Fetch stats for up to 50 videos. Costs 1 quota unit per call."""
    results = []

    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]

        response = youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=",".join(batch),
        ).execute()

        for item in response["items"]:
            stats = item["statistics"]
            results.append({
                "id": item["id"],
                "title": item["snippet"]["title"],
                "channel": item["snippet"]["channelTitle"],
                "published_at": item["snippet"]["publishedAt"],
                "duration": item["contentDetails"]["duration"],
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
            })

    return results


if __name__ == "__main__":
    ids = search_videos("home gym workout")
    print(f"Found {len(ids)} videos")

    videos = get_video_details(ids)
    for v in videos[:5]:
        print(f"{v['views']:>12,}  {v['duration']:>10}  {v['title'][:60]}")