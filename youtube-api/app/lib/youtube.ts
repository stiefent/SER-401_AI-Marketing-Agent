// ============================================================
// YouTube Data API helpers (server-side only)
//
// Used by /api/analyze to look up a video and decide whether
// it is a YouTube Short before sending it to the LLM.
// ============================================================

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

// Shorts can be up to 3 minutes long (since October 2024).
export const SHORTS_MAX_SECONDS = 180;

export type VideoInfo = {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail: string;
  durationSeconds: number;
  // Player size YouTube returns for this video. Because we ask for a
  // very large maxHeight, the size matches the video's real aspect
  // ratio. Null when YouTube doesn't know the aspect ratio.
  width: number | null;
  height: number | null;
};

export type ShortCheck = {
  isShort: boolean;
  reason: string;
};

// Accepts a bare video ID or any common YouTube URL:
//   dQw4w9WgXcQ
//   https://www.youtube.com/watch?v=dQw4w9WgXcQ
//   https://www.youtube.com/shorts/dQw4w9WgXcQ
//   https://youtu.be/dQw4w9WgXcQ
export function parseVideoId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;

  const match = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i
  );
  return match ? match[1] : null;
}

// Converts an ISO 8601 duration like "PT1M5S" into seconds.
export function parseIsoDuration(iso: string): number {
  const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  const [, d, h, min, s] = m.map((x) => Number(x) || 0);
  return d * 86400 + h * 3600 + min * 60 + s;
}

// The YouTube API has no "isShort" field, so we combine two signals
// the API does provide:
//   1. Duration: Shorts are 3 minutes or less.
//   2. Shape: Shorts are vertical or square (height >= width).
// A short *horizontal* video fails check 2, which a duration-only
// rule can't catch.
export function checkIfShort(
  durationSeconds: number,
  width: number | null,
  height: number | null
): ShortCheck {
  if (durationSeconds <= 0) {
    return { isShort: false, reason: "YouTube did not return a duration (it may be a live stream)." };
  }
  if (durationSeconds > SHORTS_MAX_SECONDS) {
    return {
      isShort: false,
      reason: `It is ${durationSeconds} seconds long, and Shorts are ${SHORTS_MAX_SECONDS} seconds or less.`,
    };
  }
  if (width === null || height === null) {
    return { isShort: false, reason: "YouTube did not report the video's aspect ratio." };
  }
  if (width > height) {
    return {
      isShort: false,
      reason: `It is horizontal (${width}×${height}), and Shorts are vertical or square.`,
    };
  }
  return {
    isShort: true,
    reason: `${durationSeconds} seconds long and ${width === height ? "square" : "vertical"} (${width}×${height}).`,
  };
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is missing. Add it to .env.local and restart the dev server.");
  }

  // videos.list costs 1 quota unit.
  const params = new URLSearchParams({
    part: "snippet,contentDetails,player",
    id: videoId,
    // Asking for a very tall player makes YouTube size the embed to
    // the video's true aspect ratio, which tells us its orientation.
    maxHeight: "8192",
    key: apiKey,
  });

  const res = await fetch(`${YOUTUBE_API}/videos?${params}`, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`YouTube API error: ${data?.error?.message ?? res.statusText}`);
  }

  const video = data.items?.[0];
  if (!video) return null;

  const thumbnails = video.snippet.thumbnails ?? {};

  return {
    id: video.id,
    title: video.snippet.title,
    channel: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    thumbnail: (thumbnails.high ?? thumbnails.medium ?? thumbnails.default)?.url ?? "",
    durationSeconds: parseIsoDuration(video.contentDetails?.duration ?? ""),
    width: video.player?.embedWidth ? Number(video.player.embedWidth) : null,
    height: video.player?.embedHeight ? Number(video.player.embedHeight) : null,
  };
}
