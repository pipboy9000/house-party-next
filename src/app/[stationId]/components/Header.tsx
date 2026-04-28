import Live from "@/src/components/Live";
import { Station, UserProfile } from "@/src/lib/types";

export default function Header({ stationData, profile, isLive, hostName }: { stationData: Station | null, profile: UserProfile | null, isLive: boolean, hostName: string | null }) {

    return (
        <div className="md:col-span-12 flex flex-col gap-0 items-start">
            {stationData && (
                <>
                    <h1 className="text-4xl font-bold">Tuned in to: {stationData.stationId}</h1>
                    <div className="flex items-baseline gap-3">
                        <Live isLive={isLive} />
                        {stationData.hostId === profile?.uid ? (
                            <p className="text-slate-400">You are hosting this station</p>
                        ) : (
                            <p className="text-slate-400">Hosted by {hostName ?? stationData.hostId}</p>
                        )}
                    </div>
                    <div className="mt-2 text-slate-600">
                        {stationData.isPlaying ? (
                            <span className="font-medium">Now Playing: {stationData.videoTitle || "Nothing yet..."}</span>
                        ) : (
                            <span className="font-medium">Station is paused</span>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}