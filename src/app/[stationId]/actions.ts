"use server";

import { YouTubeSearchResult } from "@/src/lib/types";
import { adminDb } from "@/src/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserIdFromSession } from "@/src/lib/actions";
import { get } from "http";

const COOLDOWN_PERIOD_MS = 60 * 1000; // 1 minute cooldown

export async function addToPlaylist(stationId: string, video: YouTubeSearchResult): Promise<{ success: boolean; error?: string }> {

    try {

        debugger;

        const uid = await getUserIdFromSession();

        console.log("Adding to playlist for station:", stationId, "by user:", uid);

        if (!uid) {
            console.error("User not authenticated");
            return { success: false, error: "User not authenticated" };
        }

        const result = await adminDb.runTransaction(async (transaction) => {

            const stationRef = adminDb.collection("stations").doc(stationId).collection("playlist").doc();

            const id = stationRef.id;

            const userRef = adminDb.collection("users").doc(uid);

            const userSnap = await userRef.get();

            if (!userSnap.exists) {
                console.error("User document not found for UID:", uid);
                return { success: false, error: "User document not found" };
            }

            const lastAddedAt = userSnap.data()?.lastAddedAt?.toMillis() || 0;
            const now = Date.now();

            if (now - lastAddedAt < COOLDOWN_PERIOD_MS) {
                console.warn("User is on cooldown. Time remaining:", ((COOLDOWN_PERIOD_MS - (now - lastAddedAt)) / 1000).toFixed(1), "seconds");
                return { success: false, error: "You are adding videos too quickly. Please wait a moment." };
            }

            await userRef.update({ lastAddedAt: FieldValue.serverTimestamp() });

            transaction.set(stationRef, {
                id,
                videoId: video.id,
                title: video.title,
                thumbnail: video.thumbnail,
                addedAt: FieldValue.serverTimestamp(),
                addedBy: uid
            });

            transaction.update(userRef, { lastAddedAt: FieldValue.serverTimestamp() });
        });

        return { success: true };

    } catch (error) {
        console.error("Failed to add video to playlist:", error);
        return { success: false, error: "Database error" };
    }
}