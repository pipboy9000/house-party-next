"use client";

import { useEffect, useImperativeHandle, useRef } from "react";

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}

// Ref type for the parent to use
export interface YouTubePlayerRef {
  getInternalPlayer: () => YT.Player | null;
}

interface YouTubePlayerProps {
  videoId: string;
  onStateChange: (event: YT.OnStateChangeEvent) => void;
  ref?: React.Ref<YouTubePlayerRef>; // React 19: ref is a standard prop
}

export default function YouTubePlayer({ videoId, onStateChange, ref }: YouTubePlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onStateChangeRef = useRef(onStateChange);

  // Keep the callback fresh so the YouTube SDK event always sees latest props/state.
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Expose the player to the parent
  useImperativeHandle(ref, () => ({
    getInternalPlayer: () => playerRef.current
  }));

  // INITIALIZATION: Only runs once on mount
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const createPlayer = () => {
      if (playerRef.current || !window.YT || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        videoId: videoId, // Initial video
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => console.log("Player Ready"),
          onStateChange: (event: YT.OnStateChangeEvent) => onStateChangeRef.current(event),
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        createPlayer();
      };
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []); // Empty dependency array: init only once

  // SMOOTH SWITCH: Runs when videoId prop updates
  useEffect(() => {
    if (playerRef.current && videoId) {
      const currentId = playerRef.current.getVideoData()?.video_id;
      if (currentId !== videoId) {
        playerRef.current.loadVideoById(videoId);
      }
    }
  }, [videoId]);

  return (
    <div className="w-full h-full aspect-video rounded-sm overflow-hidden bg-black shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}