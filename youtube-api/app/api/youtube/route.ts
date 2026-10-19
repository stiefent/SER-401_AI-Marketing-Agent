import { NextRequest, NextResponse } from "next/server";
import type { Video, YouTubeResponse } from "@/types/video";
import { saveVideo } from "@/lib/saveVideo";

const apiKey = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const after = searchParams.get("publishedAfter");
    const before = searchParams.get("publishedBefore");
    const amountRequested = 50; //This can be changed later or changed dynamically later with the user request if needed.

    if (!query) {
        return NextResponse.json(
            { error: "Search query required"},
            { status: 400 }
        );
    }

    if (after && isNaN(Date.parse(after))) {
        return NextResponse.json(
            { error: "Invalid publishedAfter date"},
            { status: 400 }
        );
    }

    if (before && isNaN(Date.parse(before))) {
        return NextResponse.json(
            { error: "Invalid publishedBefore date"},
            { status: 400 }
        );
    }

    const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        videoDuration: "short",
        maxResults: String(amountRequested),
        key: apiKey ?? "",
    });

    if (after) params.set("publishedAfter", new Date(after).toISOString());
    if (before) params.set("publishedBefore", new Date(before).toISOString());

    try {
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?${params}`
        );

        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
            return NextResponse.json(
                { error: "No Videos Found"},
                { status : 404 }
            );
        }

        const allVideos: YouTubeResponse = { videos: []};

        for (const item of searchData.items) {
            const videoId = item.id.videoId;
            const currentVideo = await formatVideoData(videoId);
            allVideos.videos.push(currentVideo);


            
        }

        return NextResponse.json(allVideos);


    } catch(error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to Fetch Youtube Video"},
            { status: 500 }
        );
    }
}

async function formatVideoData(id: string) {
    const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${id}&key=${apiKey}`
    );
    const videoData = await videoResponse.json();
    const video = videoData.items[0];

    if (!video) {
        throw new Error("YouTube Search Request Failed")
    }

    const videoFormatted: Video = {
        id: video.id,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high?.url ?? "",
        views: video.statistics?.viewCount ?? null,
        likes: video.statistics?.likeCount ?? null,
        comments: video.statistics?.commentCount ?? null
    };

    return videoFormatted;
}