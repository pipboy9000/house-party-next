"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase"; // Adjust path if needed
import { collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { PlayerStatus, Station, Track, YouTubeSearchResult } from "@/src/lib/types";
import { addToPlaylist, updateStationStatus } from "./actions";
import { useAuth } from "@/src/components/AuthProvider";
import Live from "@/src/components/Live";
import YouTubePlayer, { YouTubePlayerRef } from "@/src/components/YoutubePlayer";
import Playlist from "./components/Playlist";
import Search from "./components/Search";
import Header from "./components/Header";


export default function StationPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const { profile } = useAuth();
  const [stationData, setStationData] = useState<Station | null>(null);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const currentVideoIdxRef = useRef(0);
  const [isLive, setIsLive] = useState(false);
  const [hostName, setHostName] = useState<string | null>(null);
  const playerRef = useRef<YouTubePlayerRef | null>(null);

  // Listen to station data in real-time
  useEffect(() => {
    if (!stationId) return;
    const unsubscribe = onSnapshot(
      doc(db, "stations", stationId as string),
      (doc) => {
        if (doc.exists()) setStationData(doc.data() as Station);
        setIsLive(true);
      },
      () => setIsLive(false)
    );
    return () => unsubscribe();
  }, [stationId]);

  // Fetch host display name once the hostId is known
  useEffect(() => {
    if (!stationData?.hostId) return;
    getDoc(doc(db, "users", stationData.hostId)).then((snap) => {
      if (snap.exists()) setHostName(snap.data().displayName ?? null);
    });
  }, [stationData?.hostId]);

  const [playlist, setPlaylist] = useState<Track[]>([]);

  // Listen to playlist changes in real-time
  useEffect(() => {
    if (!stationId) return;

    // Listen to the 'playlist' sub-collection
    const playlistRef = collection(db, "stations", stationId, "playlist");

    // Query: Order by likes (descending), then by time added (ascending)
    const q = query(playlistRef, orderBy("addedAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tracks = snapshot.docs.map(doc => ({
        ...(doc.data() as Track)
      }));
      setPlaylist(tracks);
    });

    return () => unsubscribe();
  }, [stationId]);

  async function addVideo(result: YouTubeSearchResult) {
    if (!stationId) return { success: false, error: "No station" };
    return await addToPlaylist(stationId, result);
  }

  function getStationStatus(event: YT.OnStateChangeEvent): PlayerStatus {
    const player = event.target;
    const videoData = player.getVideoData();
    const videoTime = player.getCurrentTime();
    const { PLAYING } = window.YT.PlayerState;

    // Finding the index of the currently playing song in your playlist state
    const currentIndex = playlist.findIndex(t => t.videoId === videoData.video_id);

    return {
      currentVideoIndex: currentIndex !== -1 ? currentIndex : 0,
      isPlaying: event.data === PLAYING,
      currentVideoTime: videoTime,
      videoId: videoData.video_id,
      videoTitle: videoData.title,
      updatedAt: serverTimestamp(),
    } as PlayerStatus;
  }


  function onPlayerStateChange(event: YT.OnStateChangeEvent) {

    if (!stationId) return;

    const { ENDED, PLAYING, PAUSED, BUFFERING } = window.YT.PlayerState;

    switch (event.data) {
      case PLAYING:
        console.log("Video is playing");
        break;
      case PAUSED:
        console.log("Video is paused");
        break;
      case BUFFERING:
        console.log("Video is buffering");
        break;
      case ENDED:
        console.log("Video has ended");
        if (currentVideoIdxRef.current < playlist.length - 1) {
          const next = currentVideoIdxRef.current + 1;
          currentVideoIdxRef.current = next;
          setCurrentVideoIdx(next);
        }
        break;
      default:
        console.log("Player state changed:", event.data);
    }

    // Important: Only the HOST should update the global status
    if (stationData?.hostId === profile?.uid)
      updateStationStatus(stationId, getStationStatus(event));

  }

  function onTrackClicked(index: number) {
    if (!stationId) return;
    currentVideoIdxRef.current = index;
    setCurrentVideoIdx(index);

    const player = playerRef.current?.getInternalPlayer();
    if (player) {
      player.loadVideoById(playlist[index].videoId);
    }
  }

  if (!stationData) return <div className="p-10 text-center animate-pulse">Tuning in...</div>;

  return (
    <div className="max-w-5xl mx-auto p-2 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
      
      {/* STATION HEADER */}
      <Header stationData={stationData} profile={profile} isLive={isLive} hostName={hostName} />

      {/* LEFT: Current Track & Controls (7 cols) */}
      <div className="md:col-span-7 aspect-video">
        <YouTubePlayer ref={playerRef} videoId={playlist[currentVideoIdx]?.videoId || "3GwjfUFyY6M"} onStateChange={onPlayerStateChange} /> {/* Fallback to a default video (Celebrate) if playlist is empty */}
      </div>


      {/* RIGHT: Search & Playlist (5 cols) */}
      <div className="md:col-span-5 flex flex-col gap-6">
        {/* search */}
        <Search addVideo={addVideo} />

        {/* playlist */}
        <Playlist playlist={playlist} onTrackClicked={onTrackClicked} currentVideoIdx={currentVideoIdx} />
      </div>
    </div>
  );
}