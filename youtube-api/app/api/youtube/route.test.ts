
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
  },
  contentDetails: {
    duration: "PT1M30S"
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

// Creates a search result containing video IDs
function searchResults(...ids: string[]) {
  return {
    items: ids.map((videoId) => ({
      id: { videoId }
    }))
  };
}

// Creates a Next.js request
function createRequest(query = "rock climbing") {
  return new NextRequest(
    `http://localhost:3000/api/youtube?q=${encodeURIComponent(query)}`
  );
}

describe("GET /api/youtube", () => {

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  //Happy Case Test
  it("returns a correctly formatted video (happy case)", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [validVideo] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);

    expect(data).toEqual({
      videos: [{
        id: "abc123",
        title: "Rock Climbing Tips",
        channel: "Climbing Academy",
        thumbnail: "https://example.com/thumbnail.jpg",
        views: "15000",
        likes: "1200",
        comments: "100"
      }]
    });
  });

  //Test for handling missing likes and comments
  it("returns null for missing likes and comments", async () => {
    const video = {
      ...validVideo,
      statistics: {
        viewCount: "15000"
      }
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [video] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos[0].likes).toBeNull();
    expect(data.videos[0].comments).toBeNull();
  });

  //Test for handling when YouTube API response has no statistics
  it("returns null when all statistics are missing", async () => {
    const video = {
      ...validVideo,
      statistics: undefined
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [video] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos[0].views).toBeNull();
    expect(data.videos[0].likes).toBeNull();
    expect(data.videos[0].comments).toBeNull();
  });

  //Test for checking that 0s in the statistics are preserved
  it("preserves actual zero statistics", async () => {
    const video = {
      ...validVideo,
      statistics: {
        viewCount: "0",
        likeCount: "0",
        commentCount: "0"
      }
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [video] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos[0].views).toBe("0");
    expect(data.videos[0].likes).toBe("0");
    expect(data.videos[0].comments).toBe("0");
  });

  //Test for handling a deleted video in the search
  it("skips a deleted video without failing the search", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("deleted123", "abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [] })
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [validVideo] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos).toHaveLength(1);
    expect(data.videos[0].id).toBe("abc123");
  });

  //Test for handling when no videos are returned by the YouTube API
  it("returns an empty array when no videos are found", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ items: [] })
    );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ videos: [] });
  });

  //Test for handling a missing search query
  it("rejects a missing search query", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/youtube"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  //Test for handling a query with just whitespace
  it("rejects a whitespace-only search query", async () => {
    const response = await GET(createRequest("   "));

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  //Test for failure on the YouTube API end of things
  it("returns an error when YouTube search fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(
        { error: { message: "Quota exceeded" } },
        403
      )
    );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.error).toBeDefined();
    expect(data.videos).toBeUndefined();
  });

  //Test for video with invalid data returned by YouTube API
  it("does not return a video with invalid required metadata", async () => {
    const invalidVideo = {
      id: "abc123",
      snippet: {},
      statistics: {
        viewCount: "100"
      },
      contentDetails: {
        duration: "PT1M"
      }
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [invalidVideo] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos).toEqual([]);
  });

  //Test for ensuring that videos have the duration of shorts
  it("filters out videos longer than three minutes", async () => {
    const longVideo = {
      ...validVideo,
      contentDetails: {
        duration: "PT3M30S"
      }
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [longVideo] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos).toEqual([]);
  });

  //Test for handling malformed data the YouTube could send
  it("does not return malformed statistic values", async () => {
    const video = {
      ...validVideo,
      statistics: {
        viewCount: "unknown",
        likeCount: "NaN",
        commentCount: "-10"
      }
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(searchResults("abc123"))
      )
      .mockResolvedValueOnce(
        mockResponse({ items: [video] })
      );

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videos[0].views).toBeNull();
    expect(data.videos[0].likes).toBeNull();
    expect(data.videos[0].comments).toBeNull();
  });

  //Test to ensure it returns 50 videos
  it("returns exactly 50 videos when YouTube provides 50 valid results", async () => {
    const videoIds = Array.from(
        { length: 50 },
        (_, i) => `video${i + 1}`
    );

    vi.mocked(fetch).mockResolvedValueOnce(
        mockResponse(searchResults(...videoIds))
    );

    for (const id of videoIds) {
        vi.mocked(fetch).mockResolvedValueOnce(
        mockResponse({
            items: [{
            ...validVideo,
            id
            }]
        })
        );
    }

    const response = await GET(createRequest());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.videos).toHaveLength(50);
    expect(data.videos.map((video: { id: string }) => video.id))
        .toEqual(videoIds);

    for (const video of data.videos) {
        expect(video).toEqual({
        id: expect.any(String),
        title: "Rock Climbing Tips",
        channel: "Climbing Academy",
        thumbnail: "https://example.com/thumbnail.jpg",
        views: "15000",
        likes: "1200",
        comments: "100"
        });
    }
    expect(fetch).toHaveBeenCalledTimes(51);

    const searchUrl = vi.mocked(fetch).mock.calls[0][0].toString();
    expect(new URL(searchUrl).searchParams.get("maxResults")).toBe("50");
    });

});
