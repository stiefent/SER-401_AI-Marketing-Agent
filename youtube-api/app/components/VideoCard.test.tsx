/** @vitest-environment jsdom */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import VideoCard from "./VideoCard";
import type { Video } from "@/types/video";

const video: Video = {
    id: "abc123",
    title: "Rock Climbing Tips",
    channel: "Climbing Academy",
    thumbnail: "https://example.com/thumbnail.jpg",
    views: "15000",
    likes: "1200",
    comments: "100"
};

describe("VideoCard", () => {

    afterEach(() => {
        cleanup();
    });

    //Happy Case Test
    it("shows the title and channel (happy case)", () => {
        render(<VideoCard video={video} />);

        expect(screen.getByText("Rock Climbing Tips")).toBeInTheDocument();
        expect(screen.getByText("Climbing Academy")).toBeInTheDocument();
    });

    //Test that large numbers are readable instead of raw digits
    it("formats statistics with thousands separators", () => {
        render(<VideoCard video={video} />);

        expect(screen.getByText("15,000")).toBeInTheDocument();
        expect(screen.getByText("1,200")).toBeInTheDocument();
        expect(screen.getByText("100")).toBeInTheDocument();
    });

    //Test for handling statistics the creator has hidden
    it("shows N/A for missing statistics", () => {
        render(
            <VideoCard
                video={{ ...video, likes: null, comments: null }}
            />
        );

        expect(screen.getAllByText("N/A")).toHaveLength(2);
        expect(screen.getByText("15,000")).toBeInTheDocument();
    });

    //Test that a real zero is shown instead of being treated as missing
    it("shows zero statistics as 0", () => {
        render(
            <VideoCard
                video={{ ...video, views: "0", likes: "0", comments: "0" }}
            />
        );

        expect(screen.getAllByText("0")).toHaveLength(3);
        expect(screen.queryByText("N/A")).not.toBeInTheDocument();
    });

    //Test that the card links to the correct video on YouTube
    it("links to the video on YouTube", () => {
        render(<VideoCard video={video} />);

        const links = screen.getAllByRole("link");

        for (const link of links) {
            expect(link).toHaveAttribute(
                "href",
                "https://www.youtube.com/watch?v=abc123"
            );
            expect(link).toHaveAttribute("target", "_blank");
        }
    });

    //Test that the thumbnail is shown and labelled for screen readers
    it("shows the thumbnail with the title as alt text", () => {
        render(<VideoCard video={video} />);

        const image = screen.getByAltText("Rock Climbing Tips");
        expect(image).toHaveAttribute(
            "src",
            "https://example.com/thumbnail.jpg"
        );
    });

    //Test for handling a video with no thumbnail returned
    it("renders without a thumbnail URL", () => {
        render(<VideoCard video={{ ...video, thumbnail: "" }} />);

        expect(screen.getByText("Rock Climbing Tips")).toBeInTheDocument();
    });

});