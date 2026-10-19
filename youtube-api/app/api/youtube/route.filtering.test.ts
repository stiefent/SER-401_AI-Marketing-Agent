import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Prevent tests from writing to the real JSON file
vi.mock("@/lib/saveVideo", () => ({
    saveVideo: vi.fn()
}));

const validVideo = {
    id: "abc123",
    snippet: {
        title: "Rock Climbing Tips",
        channelTitle: "Climbing Academy",
        thumbnails: {
            high: {
                url: "https://example.com/thumbnail.jpg"
            }
        }
    },
    statistics: {
        viewCount: "15000",
        likeCount: "1200",
        commentCount: "100"
    }
};

// Creates a mock HTTP response
function mockResponse(
    data: unknown,
    status = 200
): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json"
        }
    });
}

// Makes the YouTube API return one valid video
function youTubeReturnsOneVideo() {
    vi.mocked(fetch)
        .mockResolvedValueOnce(
            mockResponse({ items: [{ id: { videoId: "abc123" } }] })
        )
        .mockResolvedValueOnce(
            mockResponse({ items: [validVideo] })
        );
}

// Creates a request with an optional date range
function createRequest(
    dates: { after?: string; before?: string } = {}
) {
    const params = new URLSearchParams({ q: "rock climbing" });

    if (dates.after) params.set("publishedAfter", dates.after);
    if (dates.before) params.set("publishedBefore", dates.before);

    return new NextRequest(
        `http://localhost:3000/api/youtube?${params}`
    );
}

// Returns the search parameters sent to the YouTube API
function searchParamsSent() {
    const url = vi.mocked(fetch).mock.calls[0][0].toString();
    return new URL(url).searchParams;
}

describe("GET /api/youtube date range filtering", () => {

    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    //Happy Case Test
    it("sends both dates to YouTube (happy case)", async () => {
        youTubeReturnsOneVideo();

        const response = await GET(
            createRequest({
                after: "2026-09-29",
                before: "2026-10-13"
            })
        );

        expect(response.status).toBe(200);

        const params = searchParamsSent();
        expect(params.get("publishedAfter")).toBe("2026-09-29T00:00:00.000Z");
        expect(params.get("publishedBefore")).toBe("2026-10-13T00:00:00.000Z");
    });

    //Test that a plain date is converted to the format YouTube requires
    it("converts a plain date to an RFC 3339 timestamp", async () => {
        youTubeReturnsOneVideo();

        await GET(createRequest({ after: "2026-09-29" }));

        const sent = searchParamsSent().get("publishedAfter");

        expect(sent).toBe("2026-09-29T00:00:00.000Z");
        expect(sent).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    //Test that a full timestamp is passed through unchanged in meaning
    it("accepts a full timestamp", async () => {
        youTubeReturnsOneVideo();

        await GET(createRequest({ after: "2026-09-29T14:30:00Z" }));

        expect(searchParamsSent().get("publishedAfter"))
            .toBe("2026-09-29T14:30:00.000Z");
    });

    //Test that a start date works on its own
    it("accepts a start date without an end date", async () => {
        youTubeReturnsOneVideo();

        const response = await GET(createRequest({ after: "2026-09-29" }));

        expect(response.status).toBe(200);

        const params = searchParamsSent();
        expect(params.get("publishedAfter")).toBe("2026-09-29T00:00:00.000Z");
        expect(params.has("publishedBefore")).toBe(false);
    });

    //Test that an end date works on its own
    it("accepts an end date without a start date", async () => {
        youTubeReturnsOneVideo();

        const response = await GET(createRequest({ before: "2026-10-13" }));

        expect(response.status).toBe(200);

        const params = searchParamsSent();
        expect(params.get("publishedBefore")).toBe("2026-10-13T00:00:00.000Z");
        expect(params.has("publishedAfter")).toBe(false);
    });

    //Test that an unfiltered search is not silently given a date range
    it("sends no date parameters when none are given", async () => {
        youTubeReturnsOneVideo();

        const response = await GET(createRequest());

        expect(response.status).toBe(200);

        const params = searchParamsSent();
        expect(params.has("publishedAfter")).toBe(false);
        expect(params.has("publishedBefore")).toBe(false);
    });

    //Test for handling a start date that is not a date
    it("rejects an invalid start date without calling YouTube", async () => {
        const response = await GET(createRequest({ after: "banana" }));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid publishedAfter date");
        expect(fetch).not.toHaveBeenCalled();
    });

    //Test for handling an end date that is not a date
    it("rejects an invalid end date without calling YouTube", async () => {
        const response = await GET(createRequest({ before: "soon" }));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid publishedBefore date");
        expect(fetch).not.toHaveBeenCalled();
    });

    //Test for handling a date that looks real but is not
    it("rejects a date that does not exist on the calendar", async () => {
        const response = await GET(createRequest({ after: "2026-13-45" }));

        expect(response.status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    //Test that a missing query is still caught before the dates are checked
    it("rejects a missing query even with valid dates", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/youtube?publishedAfter=2026-09-29"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Search query required");
        expect(fetch).not.toHaveBeenCalled();
    });

    //Test that filtering by date does not change the rest of the search
    it("keeps the existing search settings when filtering by date", async () => {
        youTubeReturnsOneVideo();

        await GET(
            createRequest({
                after: "2026-09-29",
                before: "2026-10-13"
            })
        );

        const params = searchParamsSent();
        expect(params.get("q")).toBe("rock climbing");
        expect(params.get("type")).toBe("video");
        expect(params.get("maxResults")).toBe("50");
        expect(params.get("videoDuration")).toBe("short");
        expect(params.get("part")).toBe("snippet");
    });

    //Test that the search term is still encoded safely alongside the dates
    it("encodes a search term containing spaces and symbols", async () => {
        youTubeReturnsOneVideo();

        const request = new NextRequest(
            "http://localhost:3000/api/youtube?" +
            new URLSearchParams({
                q: "home gym & workout",
                publishedAfter: "2026-09-29"
            })
        );

        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(searchParamsSent().get("q")).toBe("home gym & workout");
    });

    //Test that videos still come back correctly when a date range is used
    it("still returns formatted videos when filtering by date", async () => {
        youTubeReturnsOneVideo();

        const response = await GET(
            createRequest({ after: "2026-09-29" })
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.videos).toHaveLength(1);
        expect(data.videos[0].id).toBe("abc123");
        expect(data.videos[0].title).toBe("Rock Climbing Tips");
    });

});