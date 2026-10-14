import { NextRequest, NextResponse } from "next/server";
import type { Video, YouTubeResponse } from "@/types/video";
import { saveVideo } from "@/lib/saveVideo";

const apiKey = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const amountRequested = 50; //This can be changed later or changed dynamically later with the user request if needed.
    const channelId = searchParams.get("channelId");

    if (channelId) {
        try {
            const result = await getCreator(channelId, amountRequested);
            return NextResponse.json(result);
        } catch (error) {
            console.error(error);

            return NextResponse.json(
                { error: "Failed to fetch creator videos" },
                { status: 500 }
            );
        }
    }


    if (!query) {
        return NextResponse.json(
            { error: "Search query required"},
            { status: 400 }
        );
    }
    
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
            )}&type=video&videoDuration=short&maxResults=${amountRequested}&key=${apiKey}`
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


            //I commented this out so it does not constantly save videos during testing.
            //Uncomment to save everytime there is a search request.
            //await saveVideo(currentVideo);
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

async function getCreator(
    channelId: string,
    amountRequested: number = 50
): Promise<YouTubeResponse> {
    if (!apiKey) {
        throw new Error("YOUTUBE_API_KEY is not configured");
    }

    // Get the channel's uploads playlist.
    const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${apiKey}`
    );

    if (!channelResponse.ok) {
        throw new Error("Failed to fetch YouTube channel");
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
        throw new Error("YouTube channel not found");
    }

    const uploadsPlaylistId =
        channel.contentDetails.relatedPlaylists.uploads;

    // Get the channel's uploaded videos.
    const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=${Math.min(Math.max(amountRequested, 1), 50)}&key=${apiKey}`
    );

    if (!playlistResponse.ok) {
        throw new Error("Failed to fetch creator videos");
    }

    const playlistData = await playlistResponse.json();
    const allVideos: YouTubeResponse = { videos: [] };

    for (const item of playlistData.items ?? []) {
        const videoId = item.snippet?.resourceId?.videoId;

        if (videoId) {
            const video = await formatVideoData(videoId);
            allVideos.videos.push(video);
        }
    }

    return allVideos;
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
