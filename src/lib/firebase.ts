import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCiGCSr6mLUDbLq6zf9ZrTirCfsRWinCmI",
  authDomain: "house-party-next.firebaseapp.com",
  projectId: "house-party-next",
  storageBucket: "house-party-next.firebasestorage.app",
  messagingSenderId: "501395315049",
  appId: "1:501395315049:web:c2f552dac0c2bfc1eb45f8",
  measurementId: "G-9P0EJKN8FL"
};

// Initialize Firebase (Singleton pattern to avoid re-init errors)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics check (only runs in the browser)
export const initAnalytics = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getAnalytics(app);
  }
};