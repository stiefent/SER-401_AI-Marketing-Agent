import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { checkIfShort, getVideoInfo, parseVideoId } from "../../lib/youtube";
import { analyzeYouTubeVideo, chooseFrameSampling, GEMINI_MODEL } from "../../lib/gemini";
import type { AnalyzeResponse } from "../../lib/videoFeatures";

// POST /api/analyze  { "video": "<YouTube URL or video ID>" }
//
// 1. Looks the video up with the YouTube Data API (1 quota unit).
// 2. Confirms it is a Short (3 minutes or less, vertical or square).
// 3. Has Gemini watch it and return structured feature data.
export async function POST(request: NextRequest) {
  let body: { video?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const videoId = typeof body.video === "string" ? parseVideoId(body.video) : null;
  if (!videoId) {
    return NextResponse.json(
      { error: "Enter a YouTube Shorts link or an 11-character video ID." },
      { status: 400 }
    );
  }

  try {
    const video = await getVideoInfo(videoId);
    if (!video) {
      return NextResponse.json(
        { error: "No public video was found with that ID." },
        { status: 404 }
      );
    }

    const shortCheck = checkIfShort(video.durationSeconds, video.width, video.height);
    if (!shortCheck.isShort) {
      return NextResponse.json(
        { error: `This doesn't look like a Short. ${shortCheck.reason}`, video, shortCheck },
        { status: 422 }
      );
    }

    const sampling = chooseFrameSampling(video.durationSeconds);
    const features = await analyzeYouTubeVideo(videoId, sampling);

    const result: AnalyzeResponse = { video, shortCheck, sampling, features, model: GEMINI_MODEL };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Video analysis failed:", error);

    if (error instanceof ApiError) {
      const message =
        error.status === 429
          ? "Gemini's rate limit or daily free-tier limit was reached. Try again later."
          : `Gemini couldn't analyze this video (${error.status}). Private, unlisted, and age-restricted videos can't be analyzed.`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video analysis failed." },
      { status: 500 }
    );
  }
}
