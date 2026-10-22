export interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: string | null;
  likes: string | null;
  comments: string | null;
}

export interface YouTubeResponse {
  videos: Video[];
}