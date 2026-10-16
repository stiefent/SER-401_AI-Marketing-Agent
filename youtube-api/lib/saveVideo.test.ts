import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { saveVideo } from "./saveVideo";
import type { Video } from "@/types/video";

// Replace the real file system so tests never touch the JSON file
vi.mock("fs", () => ({
    promises: {
        readFile: vi.fn(),
        writeFile: vi.fn()
    }
}));

const newVideo: Video = {
    id: "abc123",
    title: "Rock Climbing Tips",
    channel: "Climbing Academy",
    thumbnail: "https://example.com/thumbnail.jpg",
    views: "15000",
    likes: "1200",
    comments: "100"
};

const existingVideo: Video = {
    id: "xyz789",
    title: "Bouldering Basics",
    channel: "Climbing Academy",
    thumbnail: "https://example.com/old.jpg",
    views: "500",
    likes: "20",
    comments: "3"
};

// Makes readFile return a stored file with the given videos
function fileContains(...videos: Video[]) {
    vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({ videos })
    );
}

// Returns the object that was written back to disk
function writtenData() {
    const contents = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
    return JSON.parse(contents);
}

describe("saveVideo", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    //Happy Case Test
    it("saves a video to an empty file (happy case)", async () => {
        fileContains();

        await saveVideo(newVideo);

        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(writtenData()).toEqual({ videos: [newVideo] });
    });

    //Test that saving does not delete videos already stored
    it("keeps existing videos when adding a new one", async () => {
        fileContains(existingVideo);

        await saveVideo(newVideo);

        expect(writtenData().videos).toHaveLength(2);
        expect(writtenData().videos[0]).toEqual(existingVideo);
        expect(writtenData().videos[1]).toEqual(newVideo);
    });

    //Test that the new video is added at the end of the list
    it("appends to the end of the list", async () => {
        fileContains(existingVideo, existingVideo);

        await saveVideo(newVideo);

        const videos = writtenData().videos;
        expect(videos[videos.length - 1]).toEqual(newVideo);
    });

    //Test that it reads and writes the same storage file
    it("reads and writes data/youtubeVideos.json", async () => {
        fileContains();

        await saveVideo(newVideo);

        const expectedPath = path.join(
            process.cwd(),
            "data",
            "youtubeVideos.json"
        );

        expect(fs.readFile).toHaveBeenCalledWith(expectedPath, "utf-8");
        expect(vi.mocked(fs.writeFile).mock.calls[0][0]).toBe(expectedPath);
    });

    //Test that null statistics survive being saved and re-read
    it("preserves null statistics", async () => {
        fileContains();

        await saveVideo({
            ...newVideo,
            views: null,
            likes: null,
            comments: null
        });

        const saved = writtenData().videos[0];
        expect(saved.views).toBeNull();
        expect(saved.likes).toBeNull();
        expect(saved.comments).toBeNull();
    });

    //Test that the file stays readable instead of one long line
    it("writes formatted JSON", async () => {
        fileContains();

        await saveVideo(newVideo);

        const contents = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
        expect(contents).toContain("\n");
        expect(() => JSON.parse(contents)).not.toThrow();
    });

    //Test for handling a missing storage file
    it("fails when the storage file cannot be read", async () => {
        vi.mocked(fs.readFile).mockRejectedValue(
            new Error("ENOENT: no such file or directory")
        );

        await expect(saveVideo(newVideo)).rejects.toThrow();
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    //Test for handling a corrupted storage file
    it("fails when the storage file is not valid JSON", async () => {
        vi.mocked(fs.readFile).mockResolvedValue("not json at all");

        await expect(saveVideo(newVideo)).rejects.toThrow();
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

});