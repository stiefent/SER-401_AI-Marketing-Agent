import fs from "node:fs/promises";
import path from "node:path";

type Video = {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    views: number | string | null;
    likes: number | string | null;
    comments: number | string | null;
};

type VideoData = {
    videos: Video[];
};

type SortMetric = "views" | "likes" | "comments" | "title";
type SortDirection = "asc" | "desc";

const inputPath = path.join(
    process.cwd(),
    "data",
    "youtubeVideos.json"
);

const outputPath = path.join(
    process.cwd(),
    "data",
    "youtubeVideosSorted.json"
);

function getNumber(value: number | string | null): number {
    if (value === null || value === undefined) return 0;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function sortVideos(
    metric: SortMetric = "views",
    direction: SortDirection = "desc"
): Promise<void> {
    try {
        const file = await fs.readFile(inputPath, "utf-8");
        const data = JSON.parse(file) as VideoData;

        if (!Array.isArray(data.videos)) {
            throw new Error('JSON must contain a "videos" array.');
        }

        const sortedVideos = [...data.videos].sort((a, b) => {
            let comparison: number;

            if (metric === "title") {
                comparison = a.title.localeCompare(b.title);
            } else {
                comparison =
                    getNumber(a[metric]) - getNumber(b[metric]);
            }

            return direction === "desc"
                ? -comparison
                : comparison;
        });

        const result: VideoData = {
            videos: sortedVideos,
        };

        await fs.writeFile(
            outputPath,
            JSON.stringify(result, null, 4),
            "utf-8"
        );

        console.log(`Sorted ${sortedVideos.length} videos.`);
        console.log(`Metric: ${metric}`);
        console.log(`Direction: ${direction}`);
        console.log(`Output: ${outputPath}`);
    } catch (error) {
        console.error(
            "Failed to sort videos:",
            error instanceof Error ? error.message : error
        );

        process.exitCode = 1;
    }
}

// Usage: sortVideos(metric, direction)
const metric = (process.argv[2] ?? "views") as SortMetric;
const direction = (process.argv[3] ?? "desc") as SortDirection;

const validMetrics: SortMetric[] = [
    "views",
    "likes",
    "comments",
    "title",
];

if (!validMetrics.includes(metric)) {
    console.error(
        "Invalid metric. Use views, likes, comments, or title."
    );
    process.exitCode = 1;
} else if (!["asc", "desc"].includes(direction)) {
    console.error("Invalid direction. Use asc or desc.");
    process.exitCode = 1;
} else {
    void sortVideos(metric, direction);
}