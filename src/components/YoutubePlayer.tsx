"use client";

import { useEffect, useRef } from "react";
import YT from "youtube";

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YouTubePlayerProps {
    videoId: string;
    onStateChange: (state: YT.OnStateChangeEvent) => void; // Optional callback for state changes
}

export default function YouTubePlayer({ videoId, onStateChange }: YouTubePlayerProps) {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    console.log(videoId)

    useEffect(() => {
        // 1. Load the IFrame Player API code asynchronously
        if (!window.YT) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // 2. Define the player creation logic
        const createPlayer = () => {
            // If player already exists, don't recreate it
            if (playerRef.current || !window.YT || !containerRef.current) return;

            playerRef.current = new window.YT.Player(containerRef.current, {
                height: "100%",
                width: "100%",
                videoId: videoId, // Default video if none provided (Kool & The Gang - Celebration)
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: () => console.log("Player Ready"),
                    onStateChange: (event: YT.OnStateChangeEvent) => onStateChange(event),
                },
            });
        };

        // 3. Handle the Global Callback safely
        // If the API is already loaded, just run it.
        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            // If not, wrap the existing callback to ensure we don't overwrite other listeners
            const previousCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (previousCallback) previousCallback();
                createPlayer();
            };
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null; // Clean up the ref
            }
        };
    }, [videoId]);

    //switch videos smoothly
    useEffect(() => {
        if (playerRef.current && videoId) {
            playerRef.current.loadVideoById(videoId);
        }
    }, [videoId]);

    return (
        <div className="w-full h-full aspect-video rounded-sm overflow-hidden bg-black shadow-2xl">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}
