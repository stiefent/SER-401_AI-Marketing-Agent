'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { searchYouTube } from './actions';

export default function Home() {
  const [formData, setFormData] = useState({
    channelId: '',
    publishedAfter: '',
    publishedBefore: '',
    queryTerm: '',
    topicID: '',
  });
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value, 
    }));
  };
  
  async function handleSubmit (e: FormEvent<HTMLFormElements>) {
    e.preventDefault();
    console.log('Submitted Data:', formData);
    setLoading(true);
    const results = await searchYouTube(formData.channelId, formData.publishedAfter, formData.publishedBefore, formData.queryTerm, formData.topicID);
    setVideos(results);
    setLoading(false);
  };
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            YouTube API Search Call
          </h1>
          <div>
            <label>Channel ID: </label>
            <input
              type="text"
              name="channelId"
              value={formData.channelId}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Published After: </label>
            <input
              type="date"
              name="publishedAfter"
              value={formData.publishedAfter}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Published Before: </label>
            <input
              type="date"
              name="publishedBefore"
              value={formData.publishedBefore}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Query Term: </label>
            <input
              type="text"
              name="queryTerm"
              value={formData.queryTerm}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Topic ID: </label>
            <input
              type="text"
              name="topicID"
              value={formData.topicID}
              onChange={handleChange}
            />
          </div>
          <button type="submit" onClick={handleSubmit}>Submit</button>
          {loading && <p>Loading...</p>}
          <ul>
            {videos.map((video: any) => (
              <li key={video.id.videoId} style={{ margin: '1rem 0' }}>
                <p>{video.snippet.title}</p>
                <iframe
                  width="300"
                  height="170"
                  src={`https://youtube.com/embed/${video.id.videoId}`}
                  allowFullScreen
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          
        </div>
      </main>
    </div>
  );
}