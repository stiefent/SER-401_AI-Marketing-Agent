import os
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials


# ============================================================
# CONFIGURATION
# ============================================================

CLIENT_SECRET_FILE = "client_secret.json"
TOKEN_FILE = "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly"
]


# ============================================================
# TEST API KEY
# ============================================================

def test_api_key(api_key):
    """
    Test whether the YouTube Data API key is working.

    We use videos.list with a known public video.
    This does not require OAuth.
    """

    print("\n[1] Testing API key...")
    print("-" * 50)

    try:

        youtube = build(
            "youtube",
            "v3",
            developerKey=api_key
        )

        response = youtube.videos().list(
            part="snippet",
            id="dQw4w9WgXcQ"
        ).execute()

        if response.get("items"):

            video = response["items"][0]
            title = video["snippet"]["title"]

            print("✓ API key is working.")
            print(f"  Test video: {title}")

            return youtube

        print("✗ API key request succeeded, but no data was returned.")
        return None

    except HttpError as error:

        print("✗ API key failed.")

        print()
        print("YouTube API response:")
        print(error)

        return None

    except Exception as error:

        print("✗ Unexpected error:")
        print(error)

        return None


# ============================================================
# OAUTH AUTHENTICATION
# ============================================================

def authenticate_youtube():
    """
    Authenticate the user's YouTube account through OAuth.
    """

    credentials = None

    # --------------------------------------------------------
    # Existing token
    # --------------------------------------------------------

    if os.path.exists(TOKEN_FILE):

        credentials = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            SCOPES
        )

    # --------------------------------------------------------
    # Refresh expired token
    # --------------------------------------------------------

    if (
        credentials
        and credentials.expired
        and credentials.refresh_token
    ):

        print("\nRefreshing OAuth credentials...")

        credentials.refresh(Request())

    # --------------------------------------------------------
    # New OAuth login
    # --------------------------------------------------------

    if not credentials or not credentials.valid:

        if not os.path.exists(CLIENT_SECRET_FILE):

            print()
            print(
                f"✗ {CLIENT_SECRET_FILE} was not found."
            )

            print()
            print(
                "Download your OAuth client credentials "
                "from Google Cloud Console."
            )

            return None

        print()
        print("Opening Google authorization...")
        print(
            "Sign in with the YouTube account you want to check."
        )

        flow = InstalledAppFlow.from_client_secrets_file(
            CLIENT_SECRET_FILE,
            SCOPES
        )

        credentials = flow.run_local_server(
            port=0
        )

        # Save credentials
        with open(
            TOKEN_FILE,
            "w"
        ) as token:

            token.write(
                credentials.to_json()
            )

    return build(
        "youtube",
        "v3",
        credentials=credentials
    )


# ============================================================
# GET CONNECTED YOUTUBE ACCOUNT
# ============================================================

def get_account(youtube):
    """
    Retrieve the YouTube channel associated with
    the authenticated Google account.
    """

    print("\n[2] Checking connected YouTube account...")
    print("-" * 50)

    try:

        response = youtube.channels().list(
            part="snippet,statistics",
            mine=True
        ).execute()

        channels = response.get(
            "items",
            []
        )

        if not channels:

            print(
                "✗ This Google account does not appear "
                "to have a YouTube channel."
            )

            return

        for channel in channels:

            snippet = channel.get(
                "snippet",
                {}
            )

            statistics = channel.get(
                "statistics",
                {}
            )

            print("✓ YouTube account authenticated.")
            print()

            print(
                f"  Channel: "
                f"{snippet.get('title', 'Unknown')}"
            )

            print(
                f"  Channel ID: "
                f"{channel.get('id', 'Unknown')}"
            )

            print(
                f"  Subscribers: "
                f"{statistics.get('subscriberCount', 'Hidden')}"
            )

            print(
                f"  Total views: "
                f"{statistics.get('viewCount', 'Unknown')}"
            )

            print(
                f"  Videos: "
                f"{statistics.get('videoCount', 'Unknown')}"
            )

            print()

    except HttpError as error:

        print("✗ Could not access YouTube account.")
        print()
        print(error)


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("        YouTube API Diagnostic Tool")
    print("=" * 60)

    # --------------------------------------------------------
    # API KEY
    # --------------------------------------------------------

    print()
    api_key = input(
        "Enter your YouTube API key: "
    ).strip()

    if not api_key:

        print(
            "\n✗ No API key entered."
        )

        return

    # --------------------------------------------------------
    # TEST API KEY
    # --------------------------------------------------------

    youtube_public = test_api_key(
        api_key
    )

    # --------------------------------------------------------
    # OAUTH ACCOUNT
    # --------------------------------------------------------

    print()
    print(
        "The API key itself is not tied to a YouTube account."
    )

    print(
        "To identify the YouTube account, OAuth authorization "
        "is required."
    )

    choice = input(
        "\nCheck the connected YouTube account? (y/n): "
    ).strip().lower()

    if choice == "y":

        youtube_account = authenticate_youtube()

        if youtube_account:

            get_account(
                youtube_account
            )

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("                     SUMMARY")
    print("=" * 60)

    if youtube_public:

        print("API key:          ✓ Working")

    else:

        print("API key:          ✗ Not working")

    if choice == "y":

        print(
            "OAuth account:    Check results above"
        )

    else:

        print(
            "OAuth account:    Not checked"
        )

    print("=" * 60)


if __name__ == "__main__":
    main()
