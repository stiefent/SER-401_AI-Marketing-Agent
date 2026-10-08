import json
from datetime import datetime, timezone

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# Official YouTube video categories
VIDEO_CATEGORIES = {
    "Gaming": "20",
    "Education": "27",
}

# YouTube's curated topic IDs
TOPIC_IDS = {
    "Fitness": "/m/027x7n",
    "Food": "/m/02wbm",
}


def get_most_popular_category(youtube, region, category):
    """
    Get the top 50 videos from YouTube's official
    mostPopular chart for Gaming or Education.
    """

    response = youtube.videos().list(
        part="snippet,statistics,contentDetails",
        chart="mostPopular",
        regionCode=region,
        videoCategoryId=VIDEO_CATEGORIES[category],
        maxResults=50
    ).execute()

    videos = []

    for rank, video in enumerate(response.get("items", []), start=1):
        snippet = video.get("snippet", {})
        statistics = video.get("statistics", {})

        video_id = video["id"]

        videos.append({
            "rank": rank,
            "video_id": video_id,
            "title": snippet.get("title"),
            "channel": snippet.get("channelTitle"),
            "channel_id": snippet.get("channelId"),
            "published_at": snippet.get("publishedAt"),
            "category": category,
            "source": "YouTube mostPopular chart",
            "views": int(statistics.get("viewCount", 0)),
            "likes": int(statistics.get("likeCount", 0)),
            "comments": int(statistics.get("commentCount", 0)),
            "url": f"https://www.youtube.com/watch?v={video_id}"
        })

    return videos


def get_topic_videos(youtube, region, category):
    """
    Search for up to 50 videos associated with the
    Fitness or Food YouTube topic.

    The results are then sorted by current view count.
    """

    topic_id = TOPIC_IDS[category]

    search_response = youtube.search().list(
        part="snippet",
        topicId=topic_id,
        type="video",
        regionCode=region,
        maxResults=50,
        order="relevance",
        safeSearch="strict"
    ).execute()

    video_ids = [
        item["id"]["videoId"]
        for item in search_response.get("items", [])
        if item.get("id", {}).get("videoId")
    ]

    if not video_ids:
        return []

    # Get statistics for the videos returned by search
    videos_response = youtube.videos().list(
        part="snippet,statistics,contentDetails",
        id=",".join(video_ids)
    ).execute()

    videos = []

    for video in videos_response.get("items", []):
        snippet = video.get("snippet", {})
        statistics = video.get("statistics", {})

        video_id = video["id"]

        videos.append({
            "video_id": video_id,
            "title": snippet.get("title"),
            "channel": snippet.get("channelTitle"),
            "channel_id": snippet.get("channelId"),
            "published_at": snippet.get("publishedAt"),
            "category": category,
            "source": "YouTube topic search",
            "views": int(statistics.get("viewCount", 0)),
            "likes": int(statistics.get("likeCount", 0)),
            "comments": int(statistics.get("commentCount", 0)),
            "url": f"https://www.youtube.com/watch?v={video_id}"
        })

    # Sort by current view count
    videos.sort(
        key=lambda video: video["views"],
        reverse=True
    )

    # Add rankings after sorting
    for rank, video in enumerate(videos, start=1):
        video["rank"] = rank

    return videos


def get_videos(youtube, region, category):
    """
    Automatically chooses the correct API strategy
    based on the selected category.
    """

    if category in VIDEO_CATEGORIES:
        return get_most_popular_category(
            youtube,
            region,
            category
        )

    elif category in TOPIC_IDS:
        return get_topic_videos(
            youtube,
            region,
            category
        )

    else:
        raise ValueError("Invalid category")


def main():

    print("=" * 50)
    print("        YouTube Top 50 Video Finder")
    print("=" * 50)
    print()

    # --------------------------------------------------
    # API KEY
    # --------------------------------------------------

    api_key = input(
        "Enter your YouTube API key: "
    ).strip()

    if not api_key:
        print("Error: API key cannot be empty.")
        return

    # --------------------------------------------------
    # REGION
    # --------------------------------------------------

    region = input(
        "Enter the region code (example: US, GB, CA): "
    ).strip().upper()

    if len(region) != 2:
        print("Error: Region must be a 2-letter country code.")
        return

    # --------------------------------------------------
    # CATEGORY
    # --------------------------------------------------

    print()
    print("Choose a category:")
    print()
    print("1. Gaming")
    print("2. Fitness")
    print("3. Education")
    print("4. Food")
    print()

    category_choice = input(
        "Enter 1-4: "
    ).strip()

    categories = {
        "1": "Gaming",
        "2": "Fitness",
        "3": "Education",
        "4": "Food"
    }

    if category_choice not in categories:
        print("Error: Invalid category.")
        return

    category = categories[category_choice]

    # --------------------------------------------------
    # CONNECT TO YOUTUBE
    # --------------------------------------------------

    youtube = build(
        "youtube",
        "v3",
        developerKey=api_key
    )

    print()
    print(f"Searching for {category} videos in {region}...")
    print()

    try:

        videos = get_videos(
            youtube,
            region,
            category
        )

    except HttpError as error:

        print("YouTube API error:")
        print(error)
        return

    except Exception as error:

        print("Unexpected error:")
        print(error)
        return

    # --------------------------------------------------
    # TIMESTAMP
    # --------------------------------------------------

    requested_at = datetime.now(
        timezone.utc
    ).isoformat()

    # --------------------------------------------------
    # CREATE JSON DATA
    # --------------------------------------------------

    output = {
        "requested_at": requested_at,
        "requested_at_timezone": "UTC",

        "region": region,

        "category": category,

        "selection_method": (
            "mostPopular"
            if category in VIDEO_CATEGORIES
            else "topic_search_sorted_by_views"
        ),

        "video_count": len(videos),

        "videos": videos
    }

    # --------------------------------------------------
    # SAVE JSON
    # --------------------------------------------------

    filename = "youtube_top_50.json"

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            output,
            file,
            indent=4,
            ensure_ascii=False
        )

    # --------------------------------------------------
    # DISPLAY RESULTS
    # --------------------------------------------------

    print("=" * 50)
    print(f"Found {len(videos)} videos")
    print(f"Saved to: {filename}")
    print("=" * 50)
    print()

    for video in videos:

        print(
            f"{video['rank']:>2}. "
            f"{video['title']}"
        )

        print(
            f"    Channel: {video['channel']}"
        )

        print(
            f"    Views: {video['views']:,}"
        )

        print(
            f"    {video['url']}"
        )

        print()


if __name__ == "__main__":
    main()

