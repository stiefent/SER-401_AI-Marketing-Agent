import { promises as fs } from "fs";
import path from "path";
import type { Video, YouTubeResponse } from "@/types/video";

const filePath = path.join(
  process.cwd(),
  "data",
  "youtubeVideos.json"
);

export async function saveVideo(video: Video): Promise<void> {
  const fileContents = await fs.readFile(filePath, "utf-8");
  const data: YouTubeResponse = JSON.parse(fileContents);
  data.videos.push(video);
  
  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}
