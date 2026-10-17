"use client";

import { useState } from "react";
import VideoCard from "./components/VideoCard";
import type { Video } from "@/types/video";

type SortOption =
  | "default"
  | "views-desc"
  | "views-asc"
  | "likes-desc"
  | "likes-asc"
  | "comments-desc"
  | "comments-asc"
  | "engagement";

export default function Home() {
  const [search, setSearch] = useState("");
  const [creator, setCreator] = useState("");
  const [publishedAfter, setPublishedAfter] = useState("");
  const [publishedBefore, setPublishedBefore] = useState("");
  const [maxResults, setMaxResults] = useState("25");

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  async function searchYouTube() {
    if (
      !search.trim() &&
      !creator.trim()
    ) {
      setError("Enter a search term or a creator name.");
      return;
    }

    if (
      publishedAfter &&
      publishedBefore &&
      publishedAfter > publishedBefore
    ) {
      setError("The start date must be before the end date.");
      return;
    }

    setLoading(true);
    setError("");
    setVideos([]);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("q", search.trim());
      }

      if (creator.trim()) {
        params.set("creator", creator.trim());
      }

      if (publishedAfter) {
        params.set(
          "publishedAfter",
          new Date(
            `${publishedAfter}T00:00:00.000Z`
          ).toISOString()
        );
      }

      if (publishedBefore) {
        params.set(
          "publishedBefore",
          new Date(
            `${publishedBefore}T23:59:59.999Z`
          ).toISOString()
        );
      }

      params.set("maxResults", maxResults);

      const response = await fetch(
        `/api/youtube?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setVideos(data.videos ?? []);
      setSortBy("default");
    } catch (err) {
      setVideos([]);
      setError(
        err instanceof Error
          ? err.message
          : "Search failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const sortedVideos = [...videos].sort((a, b) => {
    const viewsA = getStatistic(a.views);
    const viewsB = getStatistic(b.views);

    const likesA = getStatistic(a.likes);
    const likesB = getStatistic(b.likes);

    const commentsA = getStatistic(a.comments);
    const commentsB = getStatistic(b.comments);

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

      case "engagement": {
        const engagementA =
          viewsA > 0
            ? ((likesA + commentsA) / viewsA) * 100
            : 0;

        const engagementB =
          viewsB > 0
            ? ((likesB + commentsB) / viewsB) * 100
            : 0;

        return engagementB - engagementA;
      }

      default:
        return 0;
    }
  });

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            YouTube Video Research
          </h1>

          <p className="mt-3 text-gray-600">
            Search videos, explore creators, and compare statistics.
          </p>
        </header>

        {/* Search and filters */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void searchYouTube();
          }}
          className="mx-auto mb-10 max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Search filters
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Keywords
              </label>

              <input
                id="search"
                type="text"
                placeholder="e.g. gaming, cooking, technology"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label
                htmlFor="creator"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Creator name
              </label>

              <input
                id="creator"
                type="text"
                placeholder="Optional creator or channel name"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label
                htmlFor="publishedAfter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Published after
              </label>

              <input
                id="publishedAfter"
                type="date"
                value={publishedAfter}
                max={publishedBefore || undefined}
                onChange={(e) => setPublishedAfter(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label
                htmlFor="publishedBefore"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Published before
              </label>

              <input
                id="publishedBefore"
                type="date"
                value={publishedBefore}
                min={publishedAfter || undefined}
                onChange={(e) => setPublishedBefore(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label
                htmlFor="maxResults"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Maximum results
              </label>

              <select
                id="maxResults"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500"
              >
                <option value="10">10 videos</option>
                <option value="25">25 videos</option>
                <option value="50">50 videos</option>
              </select>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            You can search using keywords, a creator name, or both.
            Dates are optional.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Searching..." : "Search YouTube"}
          </button>
        </form>

        {/* Error and loading messages */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700"
          >
            {error}
          </div>
        )}

        {loading && (
          <p className="py-8 text-center text-gray-500">
            Searching YouTube and loading video statistics...
          </p>
        )}

        {/* Video results */}
        {!loading && videos.length > 0 && (
          <section>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Search Results
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {videos.length} videos returned
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="sort"
                  className="font-medium text-gray-700"
                >
                  Sort by:
                </label>

                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as SortOption)
                  }
                  className="max-w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-red-500"
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && hasSearched && videos.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
            No videos found. Try changing your keywords or filters.
          </p>
        )}

        {!hasSearched && !loading && (
          <p className="text-center text-gray-500">
            Enter keywords or a creator name to get started.
          </p>
        )}
      </div>
    </main>
  );
}

function getStatistic(
  value: string | number | null | undefined
): number {
  if (value == null || String(value).trim() === "") {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}
