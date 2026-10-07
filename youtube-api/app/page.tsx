
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
  const [error, setError] = useState("");

  async function searchYouTube() {
    if (!search.trim()) return;

    setLoading(true);
    setVideo(null);
    setError("");

    try {
      const response = await fetch(
        `/api/youtube?q=${encodeURIComponent(search)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setVideo(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Search failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (value: string) =>
    Number(value).toLocaleString();

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-5xl">

        {/* Page Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            YouTube Video Research
          </h1>

          <p className="mt-3 text-gray-600">
            Search YouTube videos and explore their statistics.
          </p>
        </header>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchYouTube();
          }}
          className="mx-auto mb-10 flex max-w-2xl gap-3"
        >
          <input
            type="text"
            placeholder="Search for a YouTube video..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-gray-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <p className="mb-6 text-center font-medium text-red-600">
            {error}
          </p>
        )}

        {/* Loading Message */}
        {loading && (
          <p className="text-center text-gray-500">
            Searching YouTube...
          </p>
        )}

        {/* Video Results */}
        {video && (
          <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">

            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="aspect-video w-full object-cover"
              />
            </a>

            <div className="p-6">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {video.title}
              </h2>

              <p className="mb-6 text-gray-500">
                {video.channel}
              </p>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-6 text-center">
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(video.views)}
                  </p>
                  <p className="text-sm text-gray-500">Views</p>
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(video.likes)}
                  </p>
                  <p className="text-sm text-gray-500">Likes</p>
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(video.comments)}
                  </p>
                  <p className="text-sm text-gray-500">Comments</p>
                </div>
              </div>

              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block rounded-xl bg-red-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-red-700"
              >
                Watch on YouTube
              </a>
            </div>
          </section>
        )}

        {!video && !loading && !error && (
          <p className="text-center text-gray-500">
            Enter a search term to get started.
          </p>
        )}

      </div>
    </main>
  );
}
