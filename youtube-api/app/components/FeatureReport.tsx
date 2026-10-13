// Task #62: Display results.
import type { AnalyzeResponse } from "../lib/videoFeatures";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="text-gray-900">{children}</div>
    </section>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-gray-500">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
      <p className="text-lg font-bold capitalize text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default function FeatureReport({ result }: { result: AnalyzeResponse }) {
  const { video, shortCheck, sampling, features } = result;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
      {/* Left: the Short itself */}
      <aside className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl bg-black shadow-md">
          <iframe
            className="aspect-[9/16] w-full"
            src={`https://www.youtube.com/embed/${video.id}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{video.title}</h2>
          <p className="text-sm text-gray-500">{video.channel}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <p className="font-semibold">Detected as a Short</p>
          <p>{shortCheck.reason}</p>
        </div>
        <p className="text-xs text-gray-500">
          Analyzed {sampling.framesSampled} frames ({sampling.fps} per second) plus audio with{" "}
          {result.model}. AI output can be wrong, so double-check before relying on it.
        </p>
      </aside>

      {/* Right: extracted feature data */}
      <div className="flex flex-col gap-4">
        <Section title="Summary">
          <p>{features.summary}</p>
        </Section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Niche" value={features.niche} />
          <Stat label="Format" value={features.format} />
          <Stat label="Pacing" value={features.pacing} />
          <Stat label="Est. cuts" value={String(features.estimatedCuts)} />
        </div>

        <Section title="Hook (first 3 seconds)">
          <p>{features.hook}</p>
        </Section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="Setting">
            <p>{features.setting}</p>
          </Section>
          <Section title="Camera">
            <p>{features.cameraStyle}</p>
          </Section>
          <Section title="Audio">
            <p>{features.audio}</p>
          </Section>
          <Section title="Call to action">
            <p>{features.callToAction || <span className="text-gray-500">None</span>}</p>
          </Section>
          <Section title="Subjects">
            <List items={features.subjects} empty="None identified" />
          </Section>
          <Section title="On-screen text">
            <List items={features.onScreenText.map((t) => `“${t}”`)} empty="No on-screen text" />
          </Section>
        </div>

        <Section title="Key moments">
          <ol className="space-y-2">
            {features.keyMoments.map((moment, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 rounded-md bg-red-50 px-2 py-0.5 font-mono text-sm text-red-700">
                  {moment.timestamp}
                </span>
                <span>{moment.description}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Takeaways for creators">
          <List items={features.takeaways} empty="None" />
        </Section>
      </div>
    </div>
  );
}
