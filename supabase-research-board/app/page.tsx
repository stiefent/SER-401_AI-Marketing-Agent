import Link from "next/link";
import { Suspense } from "react";
import { getBoard, getCreators, getNicheStats, getTopShorts } from "@/lib/queries";
import { removeFromBoard } from "./actions";
import SaveForm from "./SaveForm";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

// "day in the life" -> "Day in the life"
function sentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatViews(views: number | null) {
  return views === null ? "Views hidden" : `${compact.format(views)} views`;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

// Everything that reads the database or the URL lives in here, inside
// <Suspense>, because it can only run at request time.
async function Dashboard({ searchParams }: { searchParams: Promise<{ creator?: string }> }) {
  const { creator: creatorParam } = await searchParams;
  const creators = await getCreators();

  if (creators.length === 0) {
    return (
      <p className="rounded-xl bg-yellow-50 p-4 text-yellow-800">
        No creators found. Run <code>supabase/setup.sql</code> in the Supabase SQL Editor first.
      </p>
    );
  }

  const creator = creators.find((c) => String(c.id) === creatorParam) ?? creators[0];

  // These three queries don't depend on each other, so run them in parallel.
  const [stats, shorts, board] = await Promise.all([
    getNicheStats(creator.niche),
    getTopShorts(creator.niche),
    getBoard(creator.id),
  ]);

  const savedNotes = new Map(board.map((item) => [item.shorts?.id, item.note]));
  const firstName = creator.display_name.split(" ")[0];

  return (
    <>
      {/* Creator switcher: stands in for logging in as different users */}
      <nav aria-label="Creator" className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-sm text-gray-500">Viewing as:</span>
        {creators.map((c) => (
          <Link
            key={c.id}
            href={`/?creator=${c.id}`}
            aria-current={c.id === creator.id ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              c.id === creator.id
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
            }`}
          >
            {c.handle} <span className="opacity-60">· {c.niche}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* 1. Aggregated view: market research for the creator's niche */}
          <Card title={`What's working in ${creator.niche}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium">Format</th>
                    <th className="py-2 pr-4 font-medium">Top Shorts</th>
                    <th className="py-2 pr-4 font-medium">Avg. length</th>
                    <th className="py-2 pr-4 font-medium">Avg. cuts</th>
                    <th className="py-2 font-medium">Typical pacing</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.format} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-4 font-medium text-gray-900">{sentenceCase(s.format)}</td>
                      <td className="py-2 pr-4">{s.shorts_analyzed}</td>
                      <td className="py-2 pr-4">{s.avg_seconds}s</td>
                      <td className="py-2 pr-4">{s.avg_cuts}</td>
                      <td className="py-2">{sentenceCase(s.typical_pacing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Calculated by the <code>niche_format_stats</code> database view from the AI analyses below.
            </p>
          </Card>

          {/* 2. Joined data: each Short with its AI analysis */}
          <Card title={`Top analyzed Shorts in ${creator.niche}`}>
            <ul className="flex flex-col divide-y divide-gray-100">
              {shorts.map((short) => {
                const analysis = short.short_analyses;
                const takeaway = analysis?.features.takeaways?.[0];
                return (
                  <li key={short.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <h3 className="font-semibold text-gray-900">{short.title}</h3>
                      <span className="text-sm text-gray-500">{formatViews(short.views)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {short.channel} · {short.duration_seconds}s
                    </p>
                    {analysis ? (
                      <>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Chip>{sentenceCase(analysis.format)}</Chip>
                          <Chip>{sentenceCase(analysis.pacing)} pacing</Chip>
                          <Chip>{analysis.estimated_cuts} cuts</Chip>
                        </div>
                        <p className="mt-2 text-sm text-gray-800">
                          <span className="font-medium">Hook:</span> {analysis.hook}
                        </p>
                        {takeaway && (
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">Takeaway:</span> {takeaway}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">Not analyzed yet.</p>
                    )}
                    <SaveForm
                      creatorId={creator.id}
                      shortId={short.id}
                      savedNote={savedNotes.has(short.id) ? savedNotes.get(short.id) ?? "" : null}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* 3. The creator's own rows: create, update, delete */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card title={`${firstName}'s research board`}>
            {board.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing saved yet. Save a Short to start a board.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {board.map((item) =>
                  item.shorts ? (
                    <li key={item.shorts.id} className="rounded-xl bg-gray-50 p-3">
                      <p className="font-medium text-gray-900">{item.shorts.title}</p>
                      <p className="text-xs text-gray-500">{item.shorts.channel}</p>
                      {item.note && <p className="mt-1 text-sm text-gray-700">“{item.note}”</p>}
                      <form action={removeFromBoard} className="mt-2">
                        <input type="hidden" name="creatorId" value={creator.id} />
                        <input type="hidden" name="shortId" value={item.shorts.id} />
                        <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-700">
                          Remove
                        </button>
                      </form>
                    </li>
                  ) : null
                )}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Creator Research Board</h1>
          <p className="mt-3 text-gray-600">
            Supabase demo for the AI Marketing Agent: niche research, AI-analyzed Shorts, and a saved
            board per creator.
          </p>
        </header>

        <Suspense fallback={<p className="text-center text-gray-500">Loading from Supabase...</p>}>
          <Dashboard searchParams={searchParams as Promise<{ creator?: string }>} />
        </Suspense>
      </div>
    </main>
  );
}
