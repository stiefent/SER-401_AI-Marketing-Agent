
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const hashtag = searchParams
    .get("hashtag")
    ?.trim()
    .replace(/^#/, "");

  if (!hashtag) {
    return NextResponse.json(
        { error: "Hashtag is required" },
        { status: 400 }
    );
  }

  return NextResponse.json({
    hashtag: hashtag,
    username: "example_user",
    caption: "Great day climbing!",
    likes: 1523,
    comments: 84,
    views: 18291,
  });
}