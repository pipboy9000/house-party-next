import { searchYouTubeVideos } from "@/src/lib/actions";
import { YouTubeSearchResult } from "@/src/lib/types";
import { LoaderCircle, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Search({ addVideo }: { addVideo: (q: YouTubeSearchResult) => void }) {

    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Close search results when clicking outside or pressing Escape
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

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceSearchRef.current) {
                clearTimeout(debounceSearchRef.current);
            }
        };
    }, []);

    async function search(query: string) {
        setSearching(true);
        const result = await searchYouTubeVideos(query);
        console.log(result);
        setSearchResults(result);
        setSearching(false);
    }

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

    return (
        <div className="md:col-span-5 flex flex-col gap-4 max-h-[80vh]">

            <div ref={searchContainerRef} className="relative">
                <input
                    type="text"
                    placeholder="Search Youtube videos..."
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
                            <div
                                onClick={() => {
                                    setShowSearchResults(false);
                                    addVideo(result)
                                }}
                                key={result.id} className="group flex items-center border-b border-slate-700/50 gap-3 hover:bg-slate-700 cursor-pointer transition">
                                <img src={result.thumbnail} alt={result.title} className="w-12 h-12" />
                                <span className="line-clamp-1 text-sm leading-4 max-w-[calc(100%-100px)]">{result.title}</span>
                                <Plus className="w-8 h-8 opacity-0 group-hover:opacity-100 absolute right-2 bg-white/0 hover:bg-white/20 text-xs rounded-full p-1" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}