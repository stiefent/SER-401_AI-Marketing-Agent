"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import FeatureReport from "../components/FeatureReport";
import type { AnalyzeResponse } from "../lib/videoFeatures";

export default function AnalyzeView() {
  // Pre-fill the input when opened from a search result (/analyze?v=VIDEO_ID).
  const searchParams = useSearchParams();
  const [input, setInput] = useState(() => searchParams.get("v") ?? "");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Task #63: Button to initiate the workflow.
  async function analyze() {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video: input }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Back to search
        </Link>

        <header className="mb-10 mt-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Analyze a YouTube Short</h1>
          <p className="mt-3 text-gray-600">
            Paste a Short&apos;s link to break it into frames and extract its feature data with AI.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            analyze();
          }}
          className="mx-auto mb-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            placeholder="https://www.youtube.com/shorts/..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-gray-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-xl bg-red-600 px-8 py-3 font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Short"}
          </button>
        </form>

        {loading && (
          <p className="text-center text-gray-500">
            Checking the video and sending its frames to the AI. This can take up to a minute...
          </p>
        )}

        {error && (
          <p className="mx-auto max-w-2xl rounded-xl bg-red-50 p-4 text-center text-red-700">{error}</p>
        )}

        {result && <FeatureReport result={result} />}
      </div>
    </main>
  );
}
