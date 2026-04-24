"use client"; // This must be a Client Component because we use state and buttons

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createStation } from "../lib/actions"; // Import the server action to create a station
import { useAuth } from "../components/AuthProvider";
import { LoaderCircle } from "lucide-react";
// import UserProfile from "../components/UserProfile";

export default function Home() {
  const { user, loading, error } = useAuth();
  const [stationId, setStationId] = useState("");
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false); // Add this state

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleJoin = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (stationId.trim()) {
      router.push(`/${stationId.toUpperCase()}`);
    }
  };

  const handleCreate = async () => {

    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const response = await createStation(user.uid); // Pass the user ID to the server action
      if (response.success) {
        router.push(`/${response.stationId}`);
      }
    } catch (error) {
      console.error("Failed to create station:", error);
    }
  };

  if (!hasMounted) {
    return <main className="min-h-screen bg-slate-900" />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <h1 className="text-4xl font-bold mb-8">House Party 🏠</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <LoaderCircle className="animate-spin" />
          Loading...
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (

        <div className=" bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-md">

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Join a Station</label>
              <input
                type="text"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                placeholder="Enter Station ID"
                className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              disabled={!user}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold transition"
            >
              Join Party
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-2 text-slate-400">Or</span></div>
          </div>

          <button
            disabled={!user}
            onClick={handleCreate}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded font-bold transition"
          >
            Create New Station
          </button>
        </div>
      )}
    </main>
  );
}