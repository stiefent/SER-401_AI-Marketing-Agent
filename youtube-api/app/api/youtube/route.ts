import { NextRequest, NextResponse } from "next/server";
import type { Video, YouTubeResponse } from "@/types/video";

const apiKey = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json(
            { error: "Search query required"},
            { status: 400 }
        );
    }

    try {
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
                query
            )}&type=video&videoDuration=short&maxResults=1&key=${apiKey}`
        );

        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
            return NextResponse.json(
                { error: "No Videos Found"},
                { status : 404 }
            );
        }

        const videoId = searchData.items[0].id.videoId;
        const allVideos: YouTubeResponse = { videos: []};

        const currentVideo = await formatVideoData(videoId);
        allVideos.videos.push(currentVideo);

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
        thumbnail: video.snippet.thumbnails.high.url,
        views: video.statistics.viewCount,
        likes: video.statistics.likeCount,
        comments: video.statistics.commentCount
    };

        return videoFormatted;
}