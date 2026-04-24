"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase"; // Adjust path if needed
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createSession, syncUserDocument } from "../lib/actions";
import { UserProfile } from "../lib/types";

const AuthContext = createContext<{ user: User | null, profile: UserProfile | null, loading: boolean, error: string | null }>({ user: null, profile: null, loading: true, error: null });

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const startUserProfileListener = (uid: string) => {
      const userDocRef = doc(db, "users", uid);

      unsubscribeUserDoc = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            setProfile(null);
          }
        },
        (snapshotError) => {
          console.error("User profile listener error:", snapshotError);
          setError("Could not subscribe to profile updates.");
        }
      );
    };

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (!currentUser) {
        // If no user, sign in anonymously
        try {
          const result = await signInAnonymously(auth);
          setUser(result.user);
          console.log("Logged in anonymously with ID:", result.user.uid);
          const token = await result.user.getIdToken(); // Force token refresh to ensure it's valid
          await createSession(token); // Create session on server
          await syncUserDocument(result.user.uid);
          startUserProfileListener(result.user.uid);
          setLoading(false);
        } catch (error) {
          console.error("Auth failed:", error);
          setError("Authentication failed. Please try again.");
          setLoading(false);
        }
      } else {
        try {
          setUser(currentUser);
          const token = await currentUser.getIdToken(); // Force token refresh to ensure it's valid
          await createSession(token); // Create session on server
          await syncUserDocument(currentUser.uid);
          startUserProfileListener(currentUser.uid);
          console.log("Existing user found:", currentUser.uid);
          setLoading(false);
        } catch (existingUserError) {
          console.error("Failed to sync existing user:", existingUserError);
          setError("Failed to load your profile.");
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);