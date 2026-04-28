"use server";

import { adminDb, adminAuth } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { generateStationId } from "./utils";
import { YouTubeSearchResult } from "./types";
import { cookies } from "next/headers";


export async function createSession(idToken: string) : Promise<{ success: boolean; error?: string }> {
    // Set session expiration to 14 days
    const expiresIn = 60 * 60 * 24 * 14 * 1000;

    try {
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const cookiesStore = await cookies();

        cookiesStore.set("session", sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true, // Prevents JS from reading the cookie (Secure!)
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to create session:", error);
        return { success: false, error: "Session creation failed" };
    }
}

export async function getUserIdFromSession() : Promise<string | null> {
  try {
    // 1. Get the cookie store (async in Next.js 15+)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return null;
    }

    // 2. Verify the cookie with Firebase Admin
    // The second parameter 'true' checks if the cookie has been revoked
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // 3. Return the verified UID
    return decodedClaims.uid;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export async function createStation() : Promise<{ success: boolean; stationId?: string; error?: string }> {

    const hostId = await getUserIdFromSession();
    if (!hostId) return { success: false, error: "Not authenticated" };

    try {
        let stationId = generateStationId();
        let attempts = 0;
        const maxAttempts = 5;

        // We use a loop and a transaction to handle potential collisions
        const finalId = await adminDb.runTransaction(async (transaction) => {
            while (attempts < maxAttempts) {
                const stationRef = adminDb.collection("stations").doc(stationId);
                const stationSnap = await transaction.get(stationRef);

                if (!stationSnap.exists) {
                    // ID is available! Create it.
                    transaction.set(stationRef, {
                        stationId,
                        hostId,
                        createdAt: FieldValue.serverTimestamp(),
                        playlist: [],
                        currentVideoIndex: 0,
                        isPlaying: false
                    });
                    return stationId;
                }

                // Collision! Generate a new one and try again
                stationId = generateStationId();
                attempts++;
            }
            throw new Error("Could not find a unique Station ID");
        });

        return { success: true, stationId: finalId };
    } catch (error) {
        console.error("Failed to create station:", error);
        return { success: false, error: "Database error" };
    }
}

export async function syncUserDocument(uid: string) : Promise<{ success: boolean; userData?: any; error?: string }> {
    try {
        const userRef = adminDb.collection("users").doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            const newUser = {
                uid,
                createdAt: FieldValue.serverTimestamp(),
                lastLogin: FieldValue.serverTimestamp(),
                displayName: `Guest_${uid.slice(0, 4)}`, 
            };
            await userRef.set(newUser);

            // We must convert the Firestore data to a plain object for Next.js
            return { success: true, userData: JSON.parse(JSON.stringify(newUser)) };
        } else {
            const data = userSnap.data();
            await userRef.update({ lastLogin: FieldValue.serverTimestamp() });
            return { success: true, userData: JSON.parse(JSON.stringify(data)) };
        }
    } catch (error) {
        console.error("Error syncing user doc:", error);
        return { success: false, error: "Database sync failed" };
    }
}

export async function searchYouTubeVideos(query: string): Promise<YouTubeSearchResult[]> {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
            publishedAt: item.snippet.publishedAt
        }));

    } catch (error) {
        console.error("YouTube API search failed:", error);
        return [];
    }
}