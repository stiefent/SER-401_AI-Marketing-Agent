
"use client";

import { useState } from "react";
import VideoCard, { type Video } from "./components/VideoCard";

export default function Home() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  async function searchYouTube() {
    if (!search.trim()) return;

    setLoading(true);
    setError("");
    setVideos([]);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/youtube?q=${encodeURIComponent(search)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setVideos(data.videos);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Search failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-6xl">

        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            YouTube Video Research
          </h1>

          <p className="mt-3 text-gray-600">
            Search YouTube videos and explore their statistics.
          </p>
        </header>

        {/* Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchYouTube();
          }}
          className="mx-auto mb-10 flex max-w-2xl gap-3"
        >
          <input
            type="text"
            placeholder="Search YouTube videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-gray-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <p className="mb-6 text-center text-red-600">
            {error}
          </p>
        )}

        {loading && (
          <p className="text-center text-gray-500">
            Searching YouTube...
          </p>
        )}

        {/* Video Grid */}
        {!loading && videos.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results
              </h2>

              <p className="text-gray-500">
                {videos.length} videos found
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && hasSearched && videos.length === 0 && (
          <p className="text-center text-gray-500">
            No videos found.
          </p>
        )}

        {!hasSearched && (
          <p className="text-center text-gray-500">
            Enter a search term to get started.
          </p>
        )}

      </div>
    </main>
  );
}
