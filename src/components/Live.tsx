export default function Live({ isLive }: { isLive: boolean }) {

    return (
        <div>
            {isLive ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-500 text-sm">Live</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/20 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                    <span className="text-gray-500 text-sm">Live</span>
                </div>
            )}
        </div>
    )
}