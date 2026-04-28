import { Track } from "@/src/lib/types";
import { Play } from "lucide-react";

export default function Playlist({ playlist, onTrackClicked, currentVideoIdx }: { playlist: Track[], onTrackClicked: (idx: number) => void, currentVideoIdx: number }) {
    return (
        <div className="md:col-span-5 flex flex-col gap-0 max-h-[80vh]">

            <div className=" bg-slate-900/50 rounded-2xl flex-1 overflow-y-auto">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 p-4">Up Next</h3>
                {playlist.length === 0 ? (
                    <div className="text-center py-10 opacity-30 italic text-sm">The queue is empty</div>
                ) : (
                    <div className="space-y-2">
                        {playlist.map((track, index: number) => (
                            <button onClick={(e) => onTrackClicked(index)} key={track.id} className="w-full text-left cursor-pointer group">
                                <div className="relative text-white flex items-center gap-2.5 hover:bg-slate-700/50  ">
                                    <img src={track.thumbnail} alt={track.title} className="w-15 h-15 ml-1.5 rounded-md" />
                                    <span className="line-clamp-1 text-sm leading-4 max-w-[calc(100%-122px)]">{track.title}</span>
                                    <Play className="absolute right-5 opacity-0 group-hover:opacity-100 transition duration-200" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}