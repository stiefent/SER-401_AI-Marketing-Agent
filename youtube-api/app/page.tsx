"use client";

import { useState } from "react";

type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchYouTube() {
    if (!search.trim()) return;

    setLoading(true);
    setVideo(null);

    try {
      const response = await fetch(
        `/api/youtube?q=${encodeURIComponent(search)}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.error);
        return;
      }

      setVideo(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>YouTube Video Search</h1>

      <input
        type="text"
        placeholder="Search YouTube..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={searchYouTube}>
        Search
      </button>

      {loading && <p>Searching...</p>}

      {video && (
        <div>
          <h2>{video.title}</h2>

          <img
            src={video.thumbnail}
            alt={video.title}
            width="480"
          />

          <p>Channel: {video.channel}</p>

          <p>Views: {video.views}</p>

          <p>Likes: {video.likes}</p>

          <p>Comments: {video.comments}</p>
        </div>
      )}
    </main>
  );
}