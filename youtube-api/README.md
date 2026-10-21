This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## US #59: Display Feature Data from a YouTube Short

The **Analyze Short** page (`/analyze`) takes a YouTube Short's link, has an AI model watch it, and displays its feature data: hook, niche, format, setting, camera style, audio, pacing, on-screen text, call to action, key moments, and takeaways for creators. Every search result also has an **Analyze Short** button that opens this page with the video filled in.

### Setup

Create a `.env.local` file in the `youtube-api` folder (see `.env.example`):

```
YOUTUBE_API_KEY=[YOUR_YOUTUBE_DATA_API_KEY]
GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]
```

Get a Gemini key from [Google AI Studio](https://aistudio.google.com/apikey). Then run `npm install` and `npm run dev`, and open [http://localhost:3000/analyze](http://localhost:3000/analyze).

### How it works

| Step | File | What happens |
| --- | --- | --- |
| Look up the video | `app/lib/youtube.ts` | `videos.list` (1 quota unit) returns the duration and the player size. |
| Check it's a Short | `app/lib/youtube.ts` | A Short must be **180 seconds or less** and **vertical or square**. Non-Shorts are rejected before the AI is called. |
| #60 Break into frames | `app/lib/gemini.ts` | Picks a frame rate that samples about 60 frames (at least 1 per second). |
| #61 Send to LLM | `app/lib/gemini.ts` | Sends the public YouTube URL to Gemini, which samples the frames and audio itself, and returns JSON matching `app/lib/videoFeatures.ts`. |
| #62 Display results | `app/components/FeatureReport.tsx` | Shows the embedded Short beside the extracted feature data. |
| #63 Start button | `app/analyze/AnalyzeView.tsx` | The **Analyze Short** button calls `POST /api/analyze`. |

### Why Gemini reads the URL instead of us extracting frames

YouTube's API policies don't allow apps to download YouTube videos or separate their video components ([Developer Policies](https://developers.google.com/youtube/terms/developer-policies) III.E.1.a and III.I.7). Gemini's [YouTube URL support](https://ai.google.dev/gemini-api/docs/generate-content/video-understanding) lets Google's own servers process the video, so our app never downloads or stores it.

### Detecting Shorts

The YouTube API has no "is this a Short" field. Duration alone doesn't work, because regular videos can also be short. Requesting `part=player` with a large `maxHeight` makes YouTube return `player.embedWidth` and `player.embedHeight` scaled to the video's real aspect ratio, so horizontal clips can be ruled out. A short vertical video uploaded as a regular video could still pass this check.

### Limits

- Only public videos work. Private, unlisted, and age-restricted videos fail.
- Gemini's YouTube URL feature is in preview. The free tier allows 8 hours of YouTube video per day.
- AI output can be wrong, so the page reminds users to double-check it.
