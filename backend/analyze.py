import re
from datetime import datetime, timezone
from statistics import median
from youtube_client import search_videos, get_video_details


def parse_duration(iso_duration):
    """PT4M13S -> 253 seconds."""
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso_duration)
    hours, minutes, seconds = (int(g) if g else 0 for g in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def classify_format(seconds):
    if seconds <= 60:
        return "Short (under 1 min)"
    if seconds <= 180:
        return "Extended Short (1-3 min)"
    if seconds <= 600:
        return "Standard (3-10 min)"
    if seconds <= 1800:
        return "Long (10-30 min)"
    return "Extended (30+ min)"


def hours_since(published_at):
    published = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
    delta = datetime.now(timezone.utc) - published
    return max(delta.total_seconds() / 3600, 1)


def score_video(video):
    """Add derived metrics to a video dict."""
    seconds = parse_duration(video["duration"])
    views = max(video["views"], 1)

    video["seconds"] = seconds
    video["format"] = classify_format(seconds)
    video["engagement_rate"] = (video["likes"] + video["comments"]) / views
    video["views_per_hour"] = views / hours_since(video["published_at"])
    return video


def summarize_by_format(videos):
    """Group scored videos by format and compute medians."""
    groups = {}
    for v in videos:
        groups.setdefault(v["format"], []).append(v)

    summary = []
    for fmt, items in groups.items():
        summary.append({
            "format": fmt,
            "count": len(items),
            "median_views": int(median(v["views"] for v in items)),
            "median_engagement": median(v["engagement_rate"] for v in items),
            "median_velocity": int(median(v["views_per_hour"] for v in items)),
        })

    return sorted(summary, key=lambda s: s["median_velocity"], reverse=True)


if __name__ == "__main__":
    ids = search_videos("home gym workout")
    videos = [score_video(v) for v in get_video_details(ids)]

    print(f"{'Format':<26}{'n':>4}{'Med views':>12}{'Engage':>9}{'Views/hr':>11}")
    print("-" * 62)
    for row in summarize_by_format(videos):
        print(
            f"{row['format']:<26}{row['count']:>4}{row['median_views']:>12,}"
            f"{row['median_engagement']:>8.1%}{row['median_velocity']:>11,}"
        )