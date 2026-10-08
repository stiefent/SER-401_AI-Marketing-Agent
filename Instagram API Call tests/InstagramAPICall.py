import requests

#Failed
ACCESS_TOKEN = "EAAOhyltO1f0BSv0110YFjSykTJszIAq5AuTvxyiwrcSxgUZC990Y7zPtuhl3VZCMehUfmbxRdSJtLNd86OZBjIIdzwZA3buSNZCahrF0mrGZAWbimlV8dFbIECVCmzCZCpFM0WVtTerM3wTfvpXFRPF3RFZCtF6oPMQdoWMfcoNTMGUAgTaSgwmvZAQR9osWU5MUpJTZBZARc5oGkCM4AmjzVUz4jroAZC3m54UgiNAw6bVpHKTG7tlP5CyZAKnfDV9db5b2mOiPDq5CoPXyG0DscNzIoxXHC"
API_VERSION = "v23.0"
HASHTAG = "gaming"

BASE_URL = f"https://graph.facebook.com/{API_VERSION}"


def get_hashtag_id(hashtag):
    """Find the Instagram hashtag ID."""
    url = f"{BASE_URL}/ig_hashtag_search"

    params = {
        "user_id": "122095444605505332",
        "q": hashtag,
        "access_token": ACCESS_TOKEN,
    }

    response = requests.get(url, params=params)
    if not response.ok:
        print("HTTP Status:", response.status_code)
        print("Meta response:", response.text)
        raise SystemExit

    data = response.json()

    if not data.get("data"):
        raise ValueError(f"Hashtag not found: #{hashtag}")

    return data["data"][0]["id"]


def get_top_media(hashtag_id, limit=25):
    """Retrieve media associated with an Instagram hashtag."""
    url = f"{BASE_URL}/{hashtag_id}/top_media"

    params = {
        "user_id": "122095444605505332",
        "fields": (
            "id,"
            "caption,"
            "media_type,"
            "media_url,"
            "permalink,"
            "timestamp,"
            "like_count,"
            "comments_count"
        ),
        "limit": limit,
        "access_token": ACCESS_TOKEN,
    }

    response = requests.get(url, params=params)
    if not response.ok:
        print("HTTP Status:", response.status_code)
        print("Meta error:",)
        print(response.text)
        return None

    return response.json()


def main():
    print(f"Searching for #{HASHTAG}...")

    hashtag_id = get_hashtag_id(HASHTAG)

    if hashtag_id is None:
        print("Could not get hashtag ID.")
        return

    print(f"Hashtag ID: {hashtag_id}")

if __name__ == "__main__":
    main()