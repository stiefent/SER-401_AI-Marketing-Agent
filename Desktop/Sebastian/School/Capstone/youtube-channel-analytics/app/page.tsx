'use client';

import { useState, FormEvent } from 'react';
import { getChannelReport, ChannelReport, GroupSummary } from './actions';

const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (n: number) => `${n.toFixed(2)}%`;

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function GroupCard({ title, group }: { title: string; group: GroupSummary }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="font-semibold">{title}</p>
      {group.count === 0 ? (
        <p className="text-sm text-zinc-500">None in this sample</p>
      ) : (
        <ul className="text-sm">
          <li>Videos: {group.count}</li>
          <li>Avg views: {fmt(group.avgViews)}</li>
          <li>Avg engagement: {pct(group.avgEngagementRate)}</li>
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  const [channelInput, setChannelInput] = useState('');
  const [maxVideos, setMaxVideos] = useState('25');
  const [report, setReport] = useState<ChannelReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const result = await getChannelReport(channelInput, Number(maxVideos), timeZone);

    if (result.ok) {
      setReport(result.report);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 py-16 px-6 bg-white dark:bg-black sm:px-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            YouTube Channel Analytics
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Pulls a channel&apos;s recent uploads and compares how Shorts perform against long-form
            videos. Uses 3 API quota units per lookup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="channel">Channel (handle, ID, or URL)</label>
            <input
              id="channel"
              type="text"
              placeholder="@mkbhd"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="maxVideos">Recent videos (1–50)</label>
            <input
              id="maxVideos"
              type="number"
              min={1}
              max={50}
              value={maxVideos}
              onChange={(e) => setMaxVideos(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </form>

        {error && <p className="rounded-lg bg-red-100 p-4 text-red-800">{error}</p>}

        {report && (
          <>
            {/* Channel header */}
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.channel.thumbnail} alt="" className="h-16 w-16 rounded-full" />
              <div>
                <h2 className="text-2xl font-semibold">{report.channel.title}</h2>
                <p className="text-zinc-500">{report.channel.handle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Subscribers"
                value={report.channel.subscribers === null ? 'Hidden' : fmt(report.channel.subscribers)}
              />
              <StatCard label="Total views" value={fmt(report.channel.totalViews)} />
              <StatCard label="Videos" value={fmt(report.channel.videoCount)} />
            </div>

            {/* Shorts vs long-form */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">
                Shorts vs. long-form (last {report.videos.length} uploads)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GroupCard title="Shorts (3 min or less)" group={report.shorts} />
                <GroupCard title="Long-form" group={report.longForm} />
              </div>
            </section>

            {/* Posting days */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">Average views by posting day</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2">Day</th>
                    <th className="py-2">Uploads</th>
                    <th className="py-2">Avg views</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bestDays.map((d) => (
                    <tr key={d.day} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="py-2">{d.day}</td>
                      <td className="py-2">{d.count}</td>
                      <td className="py-2">{fmt(d.avgViews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Video list */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">Recent uploads</h3>
              <ul className="flex flex-col gap-4">
                {report.videos.map((video) => (
                  <li key={video.videoId} className="flex gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.thumbnail} alt="" className="h-20 w-36 rounded object-cover" />
                    <div className="flex flex-col text-sm">
                      <a href={video.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                        {video.title}
                      </a>
                      <span className="text-zinc-500">
                        {video.isShort ? 'Short' : 'Long-form'} · {formatDuration(video.durationSeconds)} ·{' '}
                        {new Date(video.publishedAt).toLocaleDateString()}
                      </span>
                      <span>
                        {fmt(video.views)} views · {fmt(video.likes)} likes · {fmt(video.comments)} comments ·{' '}
                        {pct(video.engagementRate)} engagement
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
