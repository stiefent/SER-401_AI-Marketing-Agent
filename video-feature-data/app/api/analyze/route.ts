import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const frames: string[] = body.frames;

    if (!frames || frames.length === 0) {
      return NextResponse.json(
        { error: "No frames were provided." },
        { status: 400 }
      );
    }

    const imageInputs = frames.map((frame) => ({
      type: "input_image" as const,
      image_url: frame,
      detail: "low" as const,
    }));

    const response = await openai.responses.create({
      model: "gpt-6-luna",

      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
These images are sequential frames taken from the same video.

Analyze them together and describe what is happening in the video.

Focus on:
- The main subject
- The setting
- Actions being performed
- Objects that appear important
- How the scene changes between frames

Do not describe each image separately unless necessary.
Give one concise description of the overall video.
              `,
            },
            ...imageInputs,
          ],
        },
      ],
    });

    return NextResponse.json({
      description: response.output_text,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      { error: "Failed to analyze video." },
      { status: 500 }
    );
  }
}