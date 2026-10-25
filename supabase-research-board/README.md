# Creator Research Board (Supabase Demo)

A Next.js + Supabase demo of the database behind the AI Marketing Agent. A creator picks their niche, sees which Short formats are working in it, browses top Shorts with their AI analysis (the feature data from US59), and saves Shorts to a personal research board with notes.

## What it demonstrates

| Agent feature | Database feature | Where |
| --- | --- | --- |
| Creator profiles with one of four niches | Table with a `check` constraint on `niche` | `creators` |
| Shorts collected by the YouTube API / scraper | YouTube video ID as primary key (no duplicates), 3-minute limit enforced by the database | `shorts` |
| AI feature data from US59 | Foreign key to `shorts`, key fields as columns, full result as `jsonb` | `short_analyses` |
| Market research: "what's working in my niche" | A view that groups analyses by niche and format | `niche_format_stats` |
| Saving Shorts to study later | Composite primary key, create / update (upsert) / delete | `research_board` |
| Security requirements SR-3 and SR-4 | Row Level Security on every table; only the server's secret key can read or write | `supabase/setup.sql` |

## Setup

1. **Create the tables.** In your Supabase project, open **SQL Editor**, paste in all of `supabase/setup.sql`, and click **Run**. It creates the four tables and the view, turns on Row Level Security, and loads 20 sample Shorts across the four niches. Re-running it resets the demo data. It only touches this demo's tables, so other tables like `videos` or `entries` are left alone.

2. **Add your keys.** Copy `.env.example` to `.env.local` and fill it in from **Project Settings > API Keys**:

   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

   Use the **secret** key, not the publishable one (see Security below). Never commit `.env.local`.

3. **Run it.**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Use the "Viewing as" buttons to switch between the four sample creators (this stands in for logging in).

## How it works

- `lib/supabase.ts` creates the Supabase client with the secret key. It imports `server-only`, so the build fails if this file is ever used in browser code.
- `lib/queries.ts` has the read queries:
  - **Niche stats:** reads the `niche_format_stats` view.
  - **Top Shorts:** a join that returns each Short with its analysis nested inside: `.select("..., short_analyses (hook, format, ...)")`.
  - **Research board:** a join from `research_board` to `shorts`.
- `app/actions.ts` has the writes as Server Actions: `upsert` to save or update a note, and `delete` to remove an item.
- `app/page.tsx` is a Server Component, so all queries run on the server and the browser only receives HTML.

## Security

Every table has Row Level Security turned on with no policies, and access is revoked from the `anon` and `authenticated` roles. The publishable (browser) key therefore can't read or write anything. Only server code holding the secret key, which bypasses RLS, can reach the data. When the app adds real logins (FR-1), policies like `creator_id = auth.uid()` can let each creator access only their own board (SR-4).

The `niche_format_stats` view is created with `security_invoker = true`, so it follows the same rules as its tables instead of bypassing them.

## Notes

- Sample data uses fictional channels and `demo...` video IDs, not real YouTube videos.
- `shorts.fetched_at` is recorded because YouTube's API policies only allow storing statistics for up to 30 days.
- The "What's working" view is built from our own AI analyses (format, cuts, pacing, length), not from new metrics calculated out of YouTube's like or view counts, which YouTube's developer policies restrict.
