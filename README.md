# YouTube Channel Analytics Demo

A Next.js demo of the YouTube Data API v3 for the AI Marketing Agent. Enter any public YouTube channel and the app pulls its most recent uploads, then shows:

- Channel stats (subscribers, total views, video count)
- Shorts vs. long-form performance (average views and engagement rate)
- Average views by the day of the week each video was posted
- Views, likes, comments, and engagement rate for each recent upload

This is a prototype of the **Posting Analytics** system, and complements the other YouTube demos:

| Demo | Branch | What it does |
| --- | --- | --- |
| `youtube-api-call` | `klikens-Demos` | Searches videos by channel, date range, keyword, and topic |
| `Youtube Demo for API` | `Dino-Demos` | Collects the top 50 videos per niche and their transcripts (Python) |
| `youtube-channel-analytics` | this demo | Analyzes one channel's recent uploads, Shorts vs. long-form |

## Getting Started

1. Get a YouTube Data API v3 key from the [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com) (enable the API, then create an API key under **Credentials**). No OAuth is needed because this demo only reads public data.

2. Create a `.env.local` file in the `youtube-channel-analytics` folder (you can copy `.env.example`):

   ```
   YOUTUBE_API_KEY=[YOUR_API_KEY_HERE]
   ```

3. Install dependencies and run the dev server:

   ```bash
   pnpm install
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and enter a channel. Any of these formats work:
   - Handle: `@mkbhd` or `mkbhd`
   - Channel ID: `UCBJycsmduvYEL83R_U4JriQ`
   - URL: `https://www.youtube.com/@mkbhd`

## How It Works

All API calls run on the server in `app/actions.ts` (a Next.js server action), so the API key is never sent to the browser. Each lookup makes three calls:

| Step | Endpoint | Purpose | Quota cost |
| --- | --- | --- | --- |
| 1 | `channels.list` | Channel info, stats, and the ID of its "uploads" playlist | 1 unit |
| 2 | `playlistItems.list` | IDs of the most recent uploads (up to 50) | 1 unit |
| 3 | `videos.list` | Views, likes, comments, and duration for each video | 1 unit |

That's **3 quota units per lookup**. By comparison, a single `search.list` call costs 100 units, and the default daily quota is 10,000 units, so this approach supports thousands of lookups per day.

## Notes and Limitations

- **Shorts detection is an estimate.** The API has no "is this a Short" field. Since Shorts can be up to 3 minutes long, any video of 180 seconds or less is counted as a Short, so a short regular video may be misclassified.
- **Engagement rate** is calculated as (likes + comments) ÷ views.
- Some channels hide their subscriber count, and some videos hide like counts; these show as "Hidden" or 0.
- Posting days use the time zone of the browser running the demo.
- The data here is public data only. Private metrics like watch time and audience retention require the YouTube Analytics API with OAuth from the channel owner, which would be the next step for analyzing a user's own channel.
