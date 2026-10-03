"use client";

import { useState } from "react";

export default function Home() {
  const [video, setVideo] = useState<File | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      setVideo(file);
      setFrames([]);
    }
  }

  async function analyzeFrames(frameData: string[]) {
    try {
      setAnalyzing(true);
      setDescription("");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frames: frameData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
      throw new Error(data.error || "Analysis failed.");
      }

      setDescription(data.description);
    } catch (error) {
      console.error(error);
      setDescription("Something went wrong while analyzing the video.");
    } finally {
      setAnalyzing(false);
    }
  }

  function captureFrame(
    videoElement: HTMLVideoElement,
    time: number
  ): Promise<string> {
    return new Promise((resolve) => {
      videoElement.currentTime = time;

      videoElement.onseeked = () => {
        const canvas = document.createElement("canvas");

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const context = canvas.getContext("2d");

        if (!context) {
          resolve("");
          return;
        }

        context.drawImage(
          videoElement,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const image = canvas.toDataURL("image/jpeg", 0.8);

        resolve(image);
      };
    });
  }

  async function extractFrames() {
    if (!video) return;

    const videoElement = document.createElement("video");

    videoElement.src = URL.createObjectURL(video);
    videoElement.muted = true;

    videoElement.onloadedmetadata = async () => {
      const duration = videoElement.duration;

      const frameTimes = [
        duration * 0.1,
        duration * 0.3,
        duration * 0.5,
        duration * 0.7,
        duration * 0.9,
      ];

      const extractedFrames: string[] = [];

      for (const time of frameTimes) {
        const frame = await captureFrame(videoElement, time);

        if (frame) {
          extractedFrames.push(frame);
        }
      }

      setFrames(extractedFrames);
      await analyzeFrames(extractedFrames);
    };
  }

  return (
    <main>
      <h1>Video Analyzer</h1>

      <input
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
      />

      {video && (
        <div>
          <h2>Selected Video</h2>

          <p>{video.name}</p>

          <video
            src={URL.createObjectURL(video)}
            controls
            width="500"
          />

          <br />

          <button onClick={extractFrames}>
            Analyze Video
          </button>
        </div>
      )}

      {frames.length > 0 && (
        <div>
          <h2>Extracted Frames</h2>

          {frames.map((frame, index) => (
            <div key={index}>
              <p>Frame {index + 1}</p>

              <img
                src={frame}
                alt={`Frame ${index + 1}`}
                width="300"
              />
            </div>
          ))}
        </div>
      )}

      {analyzing && (
        <div>
          <h2>Analyzing Video...</h2>
          <p>The AI is looking at the frames.</p>
        </div>
      )}

      {description && (
        <div>
          <h2>Video Description</h2>
          <p>{description}</p>
        </div>
      )}
    </main>
  );
}