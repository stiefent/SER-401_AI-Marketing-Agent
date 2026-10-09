
export type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: string | null;
  likes: string | null;
  comments: string | null;
};

type VideoCardProps = {
  video: Video;
};

export default function VideoCard({ video }: VideoCardProps) {
  function formatNumber(value: string | null) {
    if (value === null) return "N/A";
    return Number(value).toLocaleString();
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:shadow-lg">

      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full object-cover"
        />
      </a>

      <div className="p-5">
        <h2 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900">
          {video.title}
        </h2>

        <p className="mb-5 text-sm text-gray-500">
          {video.channel}
        </p>

        <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-4 text-center">
          <div>
            <p className="font-bold text-gray-900">
              {formatNumber(video.views)}
            </p>
            <p className="text-xs text-gray-500">Views</p>
          </div>

          <div>
            <p className="font-bold text-gray-900">
              {formatNumber(video.likes)}
            </p>
            <p className="text-xs text-gray-500">Likes</p>
          </div>

          <div>
            <p className="font-bold text-gray-900">
              {formatNumber(video.comments)}
            </p>
            <p className="text-xs text-gray-500">Comments</p>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block rounded-xl bg-red-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-red-700"
        >
          Watch on YouTube
        </a>
      </div>
    </article>
  );
}
