/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import Home from "./page";
import type { Video } from "@/types/video";

function makeVideo(overrides: Partial<Video> = {}): Video {
    return {
        id: "abc123",
        title: "Rock Climbing Tips",
        channel: "Climbing Academy",
        thumbnail: "https://example.com/thumbnail.jpg",
        views: "15000",
        likes: "1200",
        comments: "100",
        ...overrides
    };
}

// Makes the API return the given videos
function apiReturns(...videos: Video[]) {
    vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ videos }), { status: 200 })
    );
}

// Makes the API return an error
function apiFails(message: string, status = 500) {
    vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ error: message }), { status })
    );
}

// Types a query and submits the search form
async function search(term: string) {
    const user = userEvent.setup();
    await user.type(
        screen.getByPlaceholderText("Search YouTube videos..."),
        term
    );
    await user.click(screen.getByRole("button", { name: /search/i }));
}

// Returns the titles currently shown, in display order
function shownTitles() {
    return screen
        .getAllByRole("article")
        .map((card) => card.querySelector("h2")?.textContent);
}

describe("Home page", () => {

    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    //Happy Case Test
    it("shows search results (happy case)", async () => {
        apiReturns(makeVideo());
        render(<Home />);

        await search("rock climbing");

        expect(
            await screen.findByText("Rock Climbing Tips")
        ).toBeInTheDocument();
        expect(screen.getByText("1 videos found")).toBeInTheDocument();
    });

    //Test for the first thing a user sees before searching
    it("prompts the user before any search", () => {
        render(<Home />);

        expect(
            screen.getByText("Enter a search term to get started.")
        ).toBeInTheDocument();
        expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });

    //Test that the search term reaches the API safely encoded
    it("sends the search term to the API", async () => {
        apiReturns(makeVideo());
        render(<Home />);

        await search("rock climbing");

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const url = vi.mocked(fetch).mock.calls[0][0] as string;
        expect(url).toBe("/api/youtube?q=rock%20climbing");
    });

    //Test that an empty box does not waste an API call
    it("does not search when the box is empty", async () => {
        render(<Home />);

        const user = userEvent.setup();
        await user.click(screen.getByRole("button", { name: /search/i }));

        expect(fetch).not.toHaveBeenCalled();
    });

    //Test that whitespace alone does not waste an API call
    it("does not search when the box holds only spaces", async () => {
        render(<Home />);

        await search("   ");

        expect(fetch).not.toHaveBeenCalled();
    });

    //Test for handling an error coming back from the API
    it("shows the error message when the search fails", async () => {
        apiFails("Quota exceeded", 403);
        render(<Home />);

        await search("rock climbing");

        expect(await screen.findByText("Quota exceeded")).toBeInTheDocument();
        expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });

    //Test for handling a search that matches nothing
    it("reports when a search returns no videos", async () => {
        apiReturns();
        render(<Home />);

        await search("asdfghjkl");

        expect(
            await screen.findByText("No videos found.")
        ).toBeInTheDocument();
    });

    //Test that results are sorted by views when asked
    it("sorts results by most views", async () => {
        apiReturns(
            makeVideo({ id: "low", title: "Low Views", views: "100" }),
            makeVideo({ id: "high", title: "High Views", views: "900000" }),
            makeVideo({ id: "mid", title: "Mid Views", views: "5000" })
        );
        render(<Home />);

        await search("climbing");
        await screen.findByText("Low Views");

        const user = userEvent.setup();
        await user.selectOptions(
            screen.getByLabelText("Sort By:"),
            "views-desc"
        );

        expect(shownTitles()).toEqual([
            "High Views",
            "Mid Views",
            "Low Views"
        ]);
    });

    //Test that sorting handles videos with hidden statistics
    it("sorts videos with missing statistics last", async () => {
        apiReturns(
            makeVideo({ id: "none", title: "No Likes", likes: null }),
            makeVideo({ id: "some", title: "Has Likes", likes: "50" })
        );
        render(<Home />);

        await search("climbing");
        await screen.findByText("No Likes");

        const user = userEvent.setup();
        await user.selectOptions(
            screen.getByLabelText("Sort By:"),
            "likes-desc"
        );

        expect(shownTitles()).toEqual(["Has Likes", "No Likes"]);
    });

    //Test that engagement ranks response rate, not raw view count
    it("sorts by engagement rate rather than views", async () => {
        apiReturns(
            makeVideo({
                id: "big",
                title: "Big Reach",
                views: "1000000",
                likes: "1000",
                comments: "0"
            }),
            makeVideo({
                id: "engaged",
                title: "Highly Engaged",
                views: "1000",
                likes: "500",
                comments: "100"
            })
        );
        render(<Home />);

        await search("climbing");
        await screen.findByText("Big Reach");

        const user = userEvent.setup();
        await user.selectOptions(
            screen.getByLabelText("Sort By:"),
            "engagement"
        );

        expect(shownTitles()).toEqual(["Highly Engaged", "Big Reach"]);
    });

});