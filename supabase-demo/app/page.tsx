"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entry = {
  id: number;
  name: string;
  description: string;
  created_at: string;
};

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // READ: Fetch entries from Supabase
  async function fetchEntries() {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setEntries(data ?? []);
  }

  // CREATE: Insert a new entry
  async function addEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !description.trim()) return;

    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("entries")
      .insert({
        name: name.trim(),
        description: description.trim(),
      });

    if (error) {
      setError(error.message);
    } else {
      setName("");
      setDescription("");
      await fetchEntries();
    }

    setLoading(false);
  }

  // DELETE: Remove an entry by ID
  async function deleteEntry(id: number) {
    setError("");

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      await fetchEntries();
    }
  }

  // Fetch entries when the homepage loads
  useEffect(() => {
    void fetchEntries();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">
          Supabase Entry Manager
        </h1>

        <p className="mb-8 text-gray-600">
          Add, view, and delete entries stored in Supabase.
        </p>

        {/* CREATE FORM */}
        <form
          onSubmit={addEntry}
          className="mb-8 space-y-4 rounded-lg bg-white p-6 shadow"
        >
          <h2 className="text-xl font-semibold">Add New Entry</h2>

          <input
            type="text"
            placeholder="Entry name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border p-3"
            required
          />

          <textarea
            placeholder="Entry description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border p-3"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Entry"}
          </button>
        </form>

        {/* ERROR MESSAGE */}
        {error && (
          <p className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {error}
          </p>
        )}

        {/* READ ENTRIES */}
        <h2 className="mb-4 text-xl font-semibold">
          Database Entries
        </h2>

        <div className="space-y-4">
          {entries.length === 0 && (
            <p className="text-gray-500">
              No entries found. Add one above!
            </p>
          )}

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-lg bg-white p-5 shadow"
            >
              <div>
                <h3 className="text-lg font-bold">{entry.name}</h3>
                <p className="text-gray-600">{entry.description}</p>
                <p className="mt-2 text-xs text-gray-400">
                  ID: {entry.id}
                </p>
              </div>

              <button
                onClick={() => deleteEntry(entry.id)}
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}