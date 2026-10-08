'use server'

export async function searchYouTube(channelId: string,  publishedAfter: string, publishedBefore: string, queryTerm: string, topicId: string) {

    const apiKey = process.env.YOUTUBE_API_KEY
    let url = `https://youtube.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&order=viewCount&maxResults=10`

    if (channelId) { url += `&channelId=${channelId.trim()}`; }
    if (publishedAfter) { url += `&publishedAfter=${publishedAfter}T00:00:00Z`; }
    if (publishedAfter) { url += `&publishedBefore=${publishedBefore}T00:00:00Z`; }
    if (queryTerm) { url += `&q=${queryTerm}`; }
    if (topicId) { url += `&topicId=${topicId.trim()}`; }
    
    const res = await fetch(url)
    const data = await res.json()

    return data.items || []
}