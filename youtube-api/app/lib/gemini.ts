// ============================================================
// Gemini video analysis (server-side only)
//
// YouTube's developer policies don't allow apps to download YouTube
// videos or pull frames out of them (III.E.1.a, III.I.7). Instead we
// give Gemini the public YouTube URL, and Google's own servers sample
// the frames and audio. Nothing is downloaded or stored by our app.
// ============================================================

import { GoogleGenAI } from "@google/genai";
import { FrameSampling, VideoFeatures, videoFeaturesSchema } from "./videoFeatures";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// Gemini accepts between 0 and 24 frames per second.
const MAX_FPS = 24;

// Task #60: Break video into frames.
// Gemini samples 1 frame per second by default. Shorts are quick and
// heavily edited, so we sample short clips more densely to catch cuts,
// while keeping the total around 60 frames to limit token cost.
export function chooseFrameSampling(durationSeconds: number): FrameSampling {
  const seconds = Math.max(durationSeconds, 1);
  const fps = Math.min(MAX_FPS, Math.max(1, Math.round((60 / seconds) * 10) / 10));
  return { fps, framesSampled: Math.ceil(seconds * fps) };
}

const PROMPT = `You are a social media marketing analyst. Watch this YouTube Short
(the sampled frames and the audio) and extract its feature data for a creator who
wants to learn from it.

Rules:
- Describe only what is actually seen or heard. Do not guess at view counts,
  the creator's intent, or anything not in the video.
- Quote on-screen text exactly as written.
- Use MM:SS timestamps.
- Keep each field brief and specific.`;

// Task #61: Send frames to LLM for analysis.
export async function analyzeYouTubeVideo(
  videoId: string,
  sampling: FrameSampling
): Promise<VideoFeatures> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to .env.local and restart the dev server.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: { fileUri: `https://www.youtube.com/watch?v=${videoId}` },
            videoMetadata: { fps: sampling.fps },
          },
          { text: PROMPT },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: videoFeaturesSchema,
    },
  });

  const text = response.text;
  if (!text) {
    const reason = response.candidates?.[0]?.finishReason ?? response.promptFeedback?.blockReason;
    throw new Error(`Gemini returned no analysis${reason ? ` (reason: ${reason})` : ""}.`);
  }

  return JSON.parse(text) as VideoFeatures;
}
