import { NextRequest, NextResponse } from "next/server";
import type { Video, YouTubeResponse } from "@/types/video";
//import { saveVideo } from "@/lib/saveVideo";

const API_KEY = process.env.YOUTUBE_API_KEY;

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

const allowedFilters = {
    order: ["relevance", "date", "viewCount", "rating", "title"],
    videoDuration: ["short", "medium", "long"],
    videoDefinition: ["high", "standard"],
    videoCaption: ["closedCaption", "none"],
    videoLicense: ["creativeCommon", "youtube"],
    videoEmbeddable: ["true"],
    eventType: ["live", "upcoming", "completed"],
} as const;

const optionalFilters = [
    "regionCode",
    "relevanceLanguage",
    "videoCategoryId",
] as const;

type YouTubeApiError = {
    error?: {
        message?: string;
        code?: number;
        errors?: Array<{ reason?: string }>;
    };
};

type YouTubeChannelItem = {
    id?: { channelId?: string };
    snippet?: { title?: string };
};

type YouTubeSearchItem = {
    id?: { videoId?: string };
};

type YouTubeVideoItem = {
    id: string;
    snippet?: {
        title?: string;
        channelTitle?: string;
        thumbnails?: {
            high?: { url?: string };
            medium?: { url?: string };
            default?: { url?: string };
        };
    };
    statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
    };
};

function errorResponse(
    message: string,
    status: number
) {
    return NextResponse.json({ error: message }, { status });
}

function isValidDate(value: string): boolean {
    // Require a full RFC 3339 timestamp with a timezone.
    const rfc3339 =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

    if (!rfc3339.test(value)) {
        return false;
    }

    return Number.isFinite(Date.parse(value));
}

async function readApiError(response: Response): Promise<string> {
    try {
        const data = (await response.json()) as YouTubeApiError;
        return data.error?.message ?? `HTTP ${response.status}`;
    } catch {
        return `HTTP ${response.status}`;
    }
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const query = params.get("q")?.trim();
    const creator = params.get("creator")?.trim();
    const requestedChannelId = params.get("channelId")?.trim();

    if (!query) {
        return errorResponse(
            "Search query required. Provide q=your-search.",
            400
        );
    }

    if (!API_KEY) {
        console.error("YOUTUBE_API_KEY is not configured");
        return errorResponse(
            "YouTube API is not configured.",
            500
        );
    }

    const rawMaxResults = params.get("maxResults");
    const parsedMaxResults =
        rawMaxResults === null ? 50 : Number(rawMaxResults);

    if (
        !Number.isInteger(parsedMaxResults) ||
        parsedMaxResults < 1 ||
        parsedMaxResults > 50
    ) {
        return errorResponse(
            "maxResults must be an integer between 1 and 50.",
            400
        );
    }

    // Validate enum filters rather than silently ignoring invalid values.
    for (const [filter, allowedValues] of Object.entries(allowedFilters)) {
        const value = params.get(filter);

        if (
            value !== null &&
            !(allowedValues as readonly string[]).includes(value)
        ) {
            return errorResponse(
                `Invalid ${filter}. Allowed values: ${allowedValues.join(", ")}.`,
                400
            );
        }
    }

    // Validate date filters.
    const publishedAfter = params.get("publishedAfter")?.trim();
    const publishedBefore = params.get("publishedBefore")?.trim();

    if (publishedAfter && !isValidDate(publishedAfter)) {
        return errorResponse(
            "publishedAfter must be a valid RFC 3339 timestamp, such as 2026-01-01T00:00:00Z.",
            400
        );
    }

    if (publishedBefore && !isValidDate(publishedBefore)) {
        return errorResponse(
            "publishedBefore must be a valid RFC 3339 timestamp, such as 2026-12-31T23:59:59Z.",
            400
        );
    }

    if (
        publishedAfter &&
        publishedBefore &&
        Date.parse(publishedAfter) > Date.parse(publishedBefore)
    ) {
        return errorResponse(
            "publishedAfter must be earlier than or equal to publishedBefore.",
            400
        );
    }

    // YouTube requires type=video when eventType is specified.
    // This route always searches for videos, so that requirement is met.
    // eventType and channelId can be used together.

    try {
        let channelId: string | null | undefined = params.get("channelId")?.trim();

        if (creator) {
            channelId = await getChannelIdByName(creator);

            if (!channelId) {
                return errorResponse(
                    `No exact YouTube channel-name match found for "${creator}". Try supplying channelId instead.`,
                    404
                );
            }
        }

        const apiParams = new URLSearchParams({
            part: "snippet",
            q: query,
            type: "video",
            maxResults: String(parsedMaxResults),
            key: API_KEY,
        });

        for (const [filter, allowedValues] of Object.entries(allowedFilters)) {
            const value = params.get(filter);

            if (
                value &&
                (allowedValues as readonly string[]).includes(value)
            ) {
                apiParams.set(filter, value);
            }
        }

        for (const filter of optionalFilters) {
            const value = params.get(filter)?.trim();

            if (value) {
                apiParams.set(filter, value);
            }
        }

        if (publishedAfter) {
            apiParams.set("publishedAfter", publishedAfter);
        }

        if (publishedBefore) {
            apiParams.set("publishedBefore", publishedBefore);
        }

        if (channelId) {
            apiParams.set("channelId", channelId);
        }

        const searchResponse = await fetch(
            `${YOUTUBE_API}/search?${apiParams}`,
            { cache: "no-store" }
        );

        if (!searchResponse.ok) {
            const details = await readApiError(searchResponse);

            console.error("YouTube search API error:", {
                status: searchResponse.status,
                details,
            });

            // Keep client-facing errors consistent and safe.
            return errorResponse(
                "YouTube search request failed. Please check your filters and try again.",
                searchResponse.status === 400 ? 400 : 502
            );
        }

        const searchData = (await searchResponse.json()) as {
            items?: YouTubeSearchItem[];
        };

        const videoIds = [
            ...new Set(
                (searchData.items ?? [])
                    .map((item) => item.id?.videoId)
                    .filter((id): id is string => Boolean(id))
            ),
        ];

        if (videoIds.length === 0) {
            return NextResponse.json(
                { videos: [] } satisfies YouTubeResponse
            );
        }

        // Fetch details and statistics for every result in ONE request.
        const videos = await getVideosByIds(videoIds);

        return NextResponse.json({
            videos,
        } satisfies YouTubeResponse);
    } catch (error) {
        console.error("YouTube search failed:", error);

        return errorResponse(
            "Failed to fetch YouTube videos. Please try again later.",
            500
        );
    }

    /*
    // Save the fetched videos to the database.
    try {
        await Promise.all(
            videos.map((video) => saveVideo(video))
        );
    } catch (error) {
        console.error("Failed to save videos to database:", error);
    }

    return NextResponse.json({
        videos,
    } satisfies YouTubeResponse);
        */
}

// Only accept an exact channel-name match.
// No fallback to an unrelated first search result.
async function getChannelIdByName(
    creatorName: string
): Promise<string | null> {
    const searchParams = new URLSearchParams({
        part: "snippet",
        q: creatorName,
        type: "channel",
        maxResults: "50",
        key: API_KEY!,
    });

    const response = await fetch(
        `${YOUTUBE_API}/search?${searchParams}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        const details = await readApiError(response);

        console.error("YouTube channel search API error:", {
            status: response.status,
            details,
        });

        throw new Error("YouTube channel search failed");
    }

    const data = (await response.json()) as {
        items?: YouTubeChannelItem[];
    };

    const normalizedName = creatorName.trim().toLocaleLowerCase();

    const exactMatch = (data.items ?? []).find(
        (item) =>
            item.snippet?.title?.trim().toLocaleLowerCase() ===
            normalizedName
    );

    return exactMatch?.id?.channelId ?? null;
}

// Fetch up to 50 video records in one videos.list API call.
async function getVideosByIds(ids: string[]): Promise<Video[]> {
    if (ids.length === 0) {
        return [];
    }

    const params = new URLSearchParams({
        part: "snippet,statistics",
        id: ids.join(","),
        key: API_KEY!,
    });

    const response = await fetch(
        `${YOUTUBE_API}/videos?${params}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        const details = await readApiError(response);

        console.error("YouTube video details API error:", {
            status: response.status,
            details,
        });

        throw new Error("YouTube video details request failed");
    }

    const data = (await response.json()) as {
        items?: YouTubeVideoItem[];
    };

    const videosById = new Map<string, Video>();

    for (const video of data.items ?? []) {
        videosById.set(video.id, {
            id: video.id,
            title: video.snippet?.title ?? "",
            channel: video.snippet?.channelTitle ?? "",
            thumbnail:
                video.snippet?.thumbnails?.high?.url ??
                video.snippet?.thumbnails?.medium?.url ??
                video.snippet?.thumbnails?.default?.url ??
                "",
            views: video.statistics?.viewCount ?? null,
            likes: video.statistics?.likeCount ?? null,
            comments: video.statistics?.commentCount ?? null,
        });
    }

    // Preserve the original search ranking.
    return ids
        .map((id) => videosById.get(id))
        .filter((video): video is Video => video !== undefined);
}
