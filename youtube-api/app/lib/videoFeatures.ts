// ============================================================
// Video feature data: the structured result the LLM returns.
// Shared by the API route (server) and the results UI (client).
// ============================================================

export type KeyMoment = {
  timestamp: string; // "MM:SS"
  description: string;
};

export type VideoFeatures = {
  summary: string;
  hook: string;
  niche: "gaming" | "fitness" | "education" | "food" | "other";
  format: string;
  setting: string;
  subjects: string[];
  onScreenText: string[];
  audio: string;
  cameraStyle: string;
  pacing: "slow" | "medium" | "fast";
  estimatedCuts: number;
  callToAction: string;
  keyMoments: KeyMoment[];
  takeaways: string[];
};

export type FrameSampling = {
  fps: number;
  framesSampled: number;
};

export type AnalyzeResponse = {
  video: {
    id: string;
    title: string;
    channel: string;
    publishedAt: string;
    thumbnail: string;
    durationSeconds: number;
    width: number | null;
    height: number | null;
  };
  shortCheck: { isShort: boolean; reason: string };
  sampling: FrameSampling;
  features: VideoFeatures;
  model: string;
};

// JSON Schema sent to Gemini so it always returns this exact shape.
export const videoFeaturesSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Two or three sentences describing what happens in the video overall.",
    },
    hook: {
      type: "string",
      description: "What happens in the first 3 seconds to grab the viewer's attention.",
    },
    niche: {
      type: "string",
      enum: ["gaming", "fitness", "education", "food", "other"],
      description: "Which content niche the video best fits.",
    },
    format: {
      type: "string",
      description: "The content format, e.g. tutorial, talking head, recipe, workout demo, gameplay clip, skit, review, montage.",
    },
    setting: { type: "string", description: "Where the video takes place." },
    subjects: {
      type: "array",
      items: { type: "string" },
      description: "Main people, characters, or objects in the video.",
    },
    onScreenText: {
      type: "array",
      items: { type: "string" },
      description: "Text overlays or captions shown on screen, quoted as written. Empty if none.",
    },
    audio: {
      type: "string",
      description: "What the audio is: voiceover, talking to camera, music, sound effects, or a mix.",
    },
    cameraStyle: {
      type: "string",
      description: "Camera framing and movement, e.g. handheld selfie, static tripod, screen recording, close-ups.",
    },
    pacing: { type: "string", enum: ["slow", "medium", "fast"] },
    estimatedCuts: {
      type: "integer",
      minimum: 0,
      description: "Approximate number of scene cuts or edits.",
    },
    callToAction: {
      type: "string",
      description: "Any call to action (follow, comment, link in bio, etc.). Empty string if none.",
    },
    keyMoments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          timestamp: { type: "string", description: "MM:SS" },
          description: { type: "string" },
        },
        required: ["timestamp", "description"],
      },
      description: "Three to six notable moments in order.",
    },
    takeaways: {
      type: "array",
      items: { type: "string" },
      description: "Two to four specific techniques in this video that another creator could reuse.",
    },
  },
  required: [
    "summary",
    "hook",
    "niche",
    "format",
    "setting",
    "subjects",
    "onScreenText",
    "audio",
    "cameraStyle",
    "pacing",
    "estimatedCuts",
    "callToAction",
    "keyMoments",
    "takeaways",
  ],
};
