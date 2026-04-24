"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

export default function UserProfile() {
    const { user, profile } = useAuth();
    const [timeLeft, setTimeLeft] = useState(0);

    const COOLDOWN_SECONDS = 60;

    useEffect(() => {

        // If there's no profile or they've never added a video, don't run the timer
        if (!profile?.lastAddedAt?.seconds) return;

        const interval = setInterval(() => {
            // Convert Firestore timestamp to milliseconds
            const lastAddedMs = (profile.lastAddedAt?.seconds ?? 0) * 1000;
            const now = Date.now();

            const diffInSeconds = Math.floor((now - lastAddedMs) / 1000);
            const remaining = COOLDOWN_SECONDS - diffInSeconds;

            if (remaining > 0) {
                setTimeLeft(remaining);
            } else {
                setTimeLeft(0);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [profile?.lastAddedAt]);

    return (
        <div className="flex flex-col items-end gap-1">
            {user && profile ? (
                <>
                    {/* Status Row */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-200">
                            {profile.displayName}
                        </span>

                        {/* Cooldown Display */}
                        {timeLeft > 0 ? (
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-amber-500 tabular-nums">
                                    READY IN {timeLeft}S
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <span className="text-[10px] font-bold text-emerald-500">
                                    READY
                                </span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="animate-pulse flex flex-col items-end gap-2">
                    <div className="h-3 w-20 bg-slate-800 rounded" />
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                </div>
            )}
        </div>
    );
}