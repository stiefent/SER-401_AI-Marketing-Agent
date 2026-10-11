'use server'

// ============================================================
// YouTube Channel Analytics demo
//
// Given a channel (handle, ID, or URL), this makes three YouTube
// Data API v3 calls, each costing 1 quota unit:
//
//   1. channels.list      -> channel info, stats, uploads playlist ID
//   2. playlistItems.list -> the channel's most recent uploads
//   3. videos.list        -> stats and duration for each upload
//
// This is much cheaper than search.list (100 units per call),
// and it only needs an API key, not OAuth.
// ============================================================

const API_BASE = 'https://www.googleapis.com/youtube/v3'

// YouTube Shorts can be up to 3 minutes long. The API has no
// "isShort" field, so we treat any video of 180 seconds or less
// as a Short. This is an estimate, not an official label.
const SHORTS_MAX_SECONDS = 180

export type VideoStats = {
  videoId: string
  title: string
  publishedAt: string
  thumbnail: string
  durationSeconds: number
  isShort: boolean
  views: number
  likes: number
  comments: number
  engagementRate: number // (likes + comments) / views, as a percent
  url: string
}

export type GroupSummary = {
  count: number
  avgViews: number
  avgEngagementRate: number
}

export type ChannelReport = {
  channel: {
    id: string
    title: string
    handle: string
    thumbnail: string
    subscribers: number | null // null when the channel hides it
    totalViews: number
    videoCount: number
  }
  videos: VideoStats[]
  shorts: GroupSummary
  longForm: GroupSummary
  bestDays: { day: string; count: number; avgViews: number }[]
  quotaUsed: number
}

export type ReportResult =
  | { ok: true; report: ChannelReport }
  | { ok: false; error: string }

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function callYouTube(endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is missing. Add it to .env.local and restart the dev server.')
  }

  const query = new URLSearchParams({ ...params, key: apiKey })
  const res = await fetch(`${API_BASE}/${endpoint}?${query}`, { cache: 'no-store' })
  const data = await res.json()

  if (!res.ok) {
    const message = data?.error?.message ?? res.statusText
    throw new Error(`YouTube API error (${endpoint}): ${message}`)
  }
  return data
}

// Accepts "@mkbhd", "mkbhd", "UCBJycsmduvYEL83R_U4JriQ",
// or URLs like youtube.com/@mkbhd and youtube.com/channel/UC...
function parseChannelInput(input: string): { forHandle?: string; id?: string } {
  let value = input.trim()

  const urlMatch = value.match(/youtube\.com\/(channel\/|@)?([^/?#]+)/i)
  if (urlMatch) {
    value = urlMatch[1] === 'channel/' ? urlMatch[2] : `@${urlMatch[2].replace(/^@/, '')}`
  }

  if (/^UC[\w-]{22}$/.test(value)) return { id: value }
  return { forHandle: value.startsWith('@') ? value : `@${value}` }
}

// Converts an ISO 8601 duration like "PT1M5S" into seconds.
function durationToSeconds(iso: string): number {
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  const [, d, h, min, s] = m.map((x) => Number(x) || 0)
  return d * 86400 + h * 3600 + min * 60 + s
}

function summarize(videos: VideoStats[]): GroupSummary {
  if (videos.length === 0) return { count: 0, avgViews: 0, avgEngagementRate: 0 }
  const total = (pick: (v: VideoStats) => number) => videos.reduce((sum, v) => sum + pick(v), 0)
  return {
    count: videos.length,
    avgViews: Math.round(total((v) => v.views) / videos.length),
    avgEngagementRate: total((v) => v.engagementRate) / videos.length,
  }
}

// ------------------------------------------------------------
// Main server action
// ------------------------------------------------------------

export async function getChannelReport(
  channelInput: string,
  maxVideos: number,
  timeZone: string,
): Promise<ReportResult> {
  if (!channelInput.trim()) {
    return { ok: false, error: 'Enter a channel handle, channel ID, or channel URL.' }
  }

  const limit = Math.min(Math.max(Math.floor(maxVideos) || 25, 1), 50)

  try {
    // ---- Call 1: channels.list ------------------------------
    const channelData = await callYouTube('channels', {
      part: 'snippet,statistics,contentDetails',
      ...parseChannelInput(channelInput),
    })

    const channel = channelData.items?.[0]
    if (!channel) {
      return { ok: false, error: `No channel found for "${channelInput}".` }
    }

    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads

    // ---- Call 2: playlistItems.list -------------------------
    const playlistData = await callYouTube('playlistItems', {
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: String(limit),
    })

    const videoIds: string[] = (playlistData.items ?? []).map(
      (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId,
    )

    // ---- Call 3: videos.list --------------------------------
    let videos: VideoStats[] = []
    if (videoIds.length > 0) {
      const videoData = await callYouTube('videos', {
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videos = (videoData.items ?? []).map((v: any): VideoStats => {
        const views = Number(v.statistics.viewCount ?? 0)
        const likes = Number(v.statistics.likeCount ?? 0)
        const comments = Number(v.statistics.commentCount ?? 0)
        const durationSeconds = durationToSeconds(v.contentDetails.duration ?? '')
        return {
          videoId: v.id,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt,
          thumbnail: v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? '',
          durationSeconds,
          isShort: durationSeconds > 0 && durationSeconds <= SHORTS_MAX_SECONDS,
          views,
          likes,
          comments,
          engagementRate: views > 0 ? ((likes + comments) / views) * 100 : 0,
          url: `https://www.youtube.com/watch?v=${v.id}`,
        }
      })
    }

    // ---- Posting-day breakdown (in the viewer's time zone) --
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone })
    const byDay = new Map<string, VideoStats[]>()
    for (const v of videos) {
      const day = dayFormatter.format(new Date(v.publishedAt))
      byDay.set(day, [...(byDay.get(day) ?? []), v])
    }
    const bestDays = [...byDay.entries()]
      .map(([day, list]) => ({ day, count: list.length, avgViews: summarize(list).avgViews }))
      .sort((a, b) => b.avgViews - a.avgViews)

    return {
      ok: true,
      report: {
        channel: {
          id: channel.id,
          title: channel.snippet.title,
          handle: channel.snippet.customUrl ?? '',
          thumbnail: channel.snippet.thumbnails?.default?.url ?? '',
          subscribers: channel.statistics.hiddenSubscriberCount
            ? null
            : Number(channel.statistics.subscriberCount ?? 0),
          totalViews: Number(channel.statistics.viewCount ?? 0),
          videoCount: Number(channel.statistics.videoCount ?? 0),
        },
        videos,
        shorts: summarize(videos.filter((v) => v.isShort)),
        longForm: summarize(videos.filter((v) => !v.isShort)),
        bestDays,
        quotaUsed: videoIds.length > 0 ? 3 : 2,
      },
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
