
"use client";

import { useState } from "react";
import VideoCard, { type Video } from "./components/VideoCard";

export default function Home() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState("default");

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

      
  const sortedVideos = [...videos].sort((a, b) => {
    const viewsA = Number(a.views ?? 0);
    const viewsB = Number(b.views ?? 0);

    const likesA = Number(a.likes ?? 0);
    const likesB = Number(b.likes ?? 0);

    const commentsA = Number(a.comments ?? 0);
    const commentsB = Number(b.comments ?? 0);

    switch (sortBy) {
      case "views-desc":
        return viewsB - viewsA;

      case "views-asc":
        return viewsA - viewsB;

      case "likes-desc":
        return likesB - likesA;

      case "likes-asc":
        return likesA - likesB;

      case "comments-desc":
        return commentsB - commentsA;

      case "comments-asc":
        return commentsA - commentsB;

      case "engagement":
        //Engagement Rate = (Like + Comments) / Views * 100
        //I literally just pulled this off a google search
        const engagementA =
          viewsA > 0
            ? ((likesA + commentsA) / viewsA) * 100
            : 0;

        const engagementB =
          viewsB > 0
            ? ((likesB + commentsB) / viewsB) * 100
            : 0;

        return engagementB - engagementA;

      default:
        return 0;
    }
  });

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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Search Results
                </h2>

                <p className="text-sm text-gray-500">
                  {videos.length} videos found
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="sort"
                  className="font-medium text-gray-700"
                >
                  Sort By:
                </label>

                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm outline-none focus:border-red-500"
                >
                  <option value="default">Search Order</option>
                  <option value="views-desc">Most Views</option>
                  <option value="views-asc">Least Views</option>
                  <option value="likes-desc">Most Likes</option>
                  <option value="likes-asc">Least Likes</option>
                  <option value="comments-desc">Most Comments</option>
                  <option value="comments-asc">Least Comments</option>
                  <option value="engagement">Highest Engagement</option>
                </select>
              </div>

            </div>


            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedVideos.map((video) => (
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
