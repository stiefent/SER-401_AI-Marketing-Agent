"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    const response = await fetch(
      `/api/reels?hashtag=${encodeURIComponent(input)}`
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.error);
      setSearchResult(null);
      return;
    }

    setSearchResult(data)
  }

  return (
    <main>
      <h1>Instagram Reel Analyzer</h1>

      <p>
        Enter a hashtag to discover and analyze an Instagram Reel.
      </p>

      <div>
        <input
          type="text"
          placeholder="Enter a hashtag..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />

        <button onClick={handleSearch}>
          Search
        </button>
      </div>

      {searchResult && (
        <div> 
          <p>Hashtag: {searchResult.hashtag}</p>
          <p>Username: {searchResult.username}</p>
          <p>Caption: {searchResult.caption}</p>
          <p>Likes: {searchResult.likes}</p>
          <p>Comments: {searchResult.comments}</p>
          <p>Views: {searchResult.views}</p>
        </div>
      )}

      {error && (
        <p>{error}</p>
      )}
    </main>
  );
}