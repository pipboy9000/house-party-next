"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase"; // Adjust path if needed
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { searchYouTubeVideos } from "@/src/lib/actions";
import { Station, Track, YouTubeSearchResult } from "@/src/lib/types";
import { ChevronFirst, ChevronLast, LoaderCircle, Play, Plus } from "lucide-react";
import { addToPlaylist } from "./actions";
import { useAuth } from "@/src/components/AuthProvider";
import Live from "@/src/components/Live";


export default function StationPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const { profile } = useAuth();
  const [stationData, setStationData] = useState<Station | null>(null);
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    if (!stationId) return;
    const unsubscribe = onSnapshot(doc(db, "stations", stationId as string), (doc) => {
      if (doc.exists()) setStationData(doc.data() as Station);
    });
    return () => unsubscribe();
  }, [stationId]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSearchResults(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);


    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const [playlist, setPlaylist] = useState<Track[]>([]);

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
      console.log(tracks);
    });

    return () => unsubscribe();
  }, [stationId]);

  useEffect(() => {
    return () => {
      if (debounceSearchRef.current) {
        clearTimeout(debounceSearchRef.current);
      }
    };
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {

    if (debounceSearchRef.current) {
      clearTimeout(debounceSearchRef.current);
    }


    const query = e.target.value;

    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (e.target.value.trim().length < 3) return;

    debounceSearchRef.current = setTimeout(() => search(query), 500);
  }

  async function addVideo(result: YouTubeSearchResult) {
    if (!stationId) return;
    await addToPlaylist(stationId, result);
    setShowSearchResults(false);
  }

  async function search(query: string) {
    setSearching(true);
    const result = await searchYouTubeVideos(query);
    console.log(result);
    setSearchResults(result);
    setSearching(false);
  }

  if (!stationData) return <div className="p-10 text-center animate-pulse">Tuning in...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">

      {/* STATION HEADER */}
      <div className="md:col-span-12 flex flex-col gap-0 items-start">
        {stationData && (
          <>
            <h1 className="text-4xl font-bold">Tuned in to: {stationData.stationId}</h1>
            {stationData.hostId === profile?.uid ? (
              <div className="flex items-baseline gap-3">
                <Live isLive={true} />
                <p className="text-slate-400">You are hosting this station</p>
              </div>
            ) : (
              <p className="text-slate-400">Hosted by {stationData.hostId}</p>
            )}
          </>
        )}
      </div>

      {/* LEFT: Current Track & Controls (7 cols) */}
      <div className="md:col-span-7 flex flex-col gap-6">
        <div className="aspect-square bg-linear-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden relative">
          {/* Track Artwork would go here */}
          <div className="text-center p-8">
            <div className="w-48 h-48 bg-slate-800 rounded-lg mx-auto mb-6 shadow-lg flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
            <h2 className="text-2xl font-bold truncate">No Track Playing</h2>
            <p className="text-slate-400">Add a song to the queue to get started</p>
          </div>
        </div>

        {/* Player Controls Placeholder */}
        <div className="bg-slate-900/50 p-6 rounded-2xl backdrop-blur-sm">
          <div className="text-slate-200 flex items-center justify-center gap-8">
            <button className=" hover:text-white transition"><ChevronFirst /></button>
            <button className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center hover:scale-105 hover:text-white transition">
              <Play />
            </button>
            <button className=" hover:text-white transition"><ChevronLast /></button>
          </div>
        </div>
      </div>

      {/* RIGHT: Search & Queue (5 cols) */}
      <div className="md:col-span-5 flex flex-col gap-4 max-h-[80vh]">
        <div ref={searchContainerRef} className="relative">
          <input
            type="text"
            placeholder="Search Youtube tracks..."
            onChange={handleSearchChange}
            onFocus={() => setShowSearchResults(true)}
            onInput={() => setShowSearchResults(true)}
            onClick={() => setShowSearchResults(true)}
            onKeyDown={() => setShowSearchResults(true)}
            className="text-white w-full bg-slate-900 border border-slate-700 p-4 pl-12 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
          />
          <span className="absolute left-4 top-4 opacity-50 text-white">
            {searching ? (<LoaderCircle className="animate-spin" />) : "🔍"}
          </span>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="shadow-[0px_20px_30px_-20px_rgba(0,0,0,1)] absolute z-10 w-full mt-1 rounded-xl overflow-y-auto bg-[#34343488] text-[#f5f5f5] backdrop-blur-xs">
              {searchResults.map((result) => (
                <div key={result.id} className="group flex items-center border-b border-slate-700/50 gap-3 hover:bg-slate-700 cursor-pointer transition">
                  <img src={result.thumbnail} alt={result.title} className="w-12 h-12" />
                  <span className="line-clamp-1 text-sm leading-4 max-w-[calc(100%-100px)]">{result.title}</span>
                  <Plus className="w-8 h-8 opacity-0 group-hover:opacity-100 absolute right-2 bg-white/0 hover:bg-white/20 text-xs rounded-full p-1" onClick={async () => await addVideo(result)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 rounded-2xl flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Up Next</h3>
          {playlist.length === 0 ? (
            <div className="text-center py-10 opacity-30 italic text-sm">The queue is empty</div>
          ) : (
            <div className="space-y-3">
              {playlist.map((track: any, index: number) => (
                <div key={track.id} className="flex items-center gap-3">
                  <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded" />
                  <span className="line-clamp-1 text-sm leading-4 max-w-[calc(100%-100px)]">{track.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}