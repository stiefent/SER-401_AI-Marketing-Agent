import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Builds a date a given number of days before now
function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const sampleVideos = [
  {
    id: "demo001",
    title: "15 Minute Full Body Home Workout",
    channel: "Climbing Academy",
    thumbnail: "https://example.com/1.jpg",
    views: 1250000,
    likes: 48000,
    comments: 1200,
    published_at: daysAgo(3)
  },
  {
    id: "demo002",
    title: "Beginner Dumbbell Routine",
    channel: "Home Fit Power",
    thumbnail: "https://example.com/2.jpg",
    views: 89000,
    likes: 5400,
    comments: 310,
    published_at: daysAgo(9)
  },
  {
    id: "demo003",
    title: "Why Your Pull Ups Are Not Improving",
    channel: "Climbing Academy",
    thumbnail: "https://example.com/3.jpg",
    views: 2400000,
    likes: 120000,
    comments: 8900,
    published_at: daysAgo(20)
  },
  {
    id: "demo004",
    title: "Garage Gym Tour 2026",
    channel: "Legally Swole",
    thumbnail: "https://example.com/4.jpg",
    views: 15000,
    likes: null,
    comments: 42,
    published_at: daysAgo(45)
  }
];

function line(label) {
  console.log("\n" + "=".repeat(60));
  console.log(label);
  console.log("=".repeat(60));
}

function show(videos) {
  for (const v of videos) {
    const views = v.views === null ? "n/a" : Number(v.views).toLocaleString();
    const published = v.published_at
      ? v.published_at.slice(0, 10)
      : "unknown";
    console.log(
      `  ${published}  ${views.padStart(10)} views  ${v.title}`
    );
  }
}

async function main() {
  // Start from a clean table so the demo repeats identically
  line("1. Clearing previous demo rows");
  const { error: clearError } = await supabase
    .from("videos")
    .delete()
    .like("id", "demo%");

  if (clearError) throw clearError;
  console.log("  Cleared.");

  // Insert — upsert means re-running will not fail on duplicate ids
  line("2. Saving videos to Supabase");
  const { data: inserted, error: insertError } = await supabase
    .from("videos")
    .upsert(sampleVideos)
    .select();

  if (insertError) throw insertError;
  console.log(`  Saved ${inserted.length} videos.`);

  // Read everything back
  line("3. Reading all videos back");
  const { data: all, error: readError } = await supabase
    .from("videos")
    .select("*");

  if (readError) throw readError;
  show(all);

  // Sorting happens in the database, not in JavaScript
  line("4. Top 3 by views (sorted by Postgres)");
  const { data: top, error: topError } = await supabase
    .from("videos")
    .select("*")
    .order("views", { ascending: false, nullsFirst: false })
    .limit(3);

  if (topError) throw topError;
  show(top);

  // The same two week window the project's research question uses
  line("5. Published in the last 14 days");
  const { data: recent, error: recentError } = await supabase
    .from("videos")
    .select("*")
    .gte("published_at", daysAgo(14))
    .order("published_at", { ascending: false });

  if (recentError) throw recentError;
  show(recent);

  // Filtering on a column a JSON file could not index
  line("6. Videos from one channel with over 100k views");
  const { data: filtered, error: filterError } = await supabase
    .from("videos")
    .select("*")
    .eq("channel", "Climbing Academy")
    .gt("views", 100000);

  if (filterError) throw filterError;
  show(filtered);

  // YouTube's developer policies require stored stats to be
  // deleted or refreshed within 30 days
  line("7. Retention check: rows older than 30 days");
  const { data: stale, error: staleError } = await supabase
    .from("videos")
    .select("id, title, fetched_at")
    .lt("fetched_at", daysAgo(30));

  if (staleError) throw staleError;
  console.log(`  ${stale.length} rows past the 30 day limit.`);

  console.log("\nDemo complete.\n");
}

main().catch((error) => {
  console.error("\nDemo failed:", error.message ?? error);
  process.exit(1);
});
