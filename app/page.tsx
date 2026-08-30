 "use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 1. PUT YOUR REAL VAPID KEY HERE
const VAPID_PUBLIC_KEY = "BCAV_QSJOps3KQ9JGPcpYKDIu4rWuzceAyTYTo6ScEg3P2rx7ozhoeBiA9AVSjOIvUKM0X7aVNChbcTXAadcick"; 

// 2. PUT YOUR REAL SUPABASE ANON KEY HERE
const supabase = createClient(
  "https://pjpjelguamyzzwldiuhl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcGplbGd1YW15enp3bGRpdWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTgzNTMsImV4cCI6MjEwMzAzNDM1M30.8iJVwfvbdNLS0wStint5lMBaBvkILgtzsBiAn9GQqKw");

// Helper to convert VAPID key for the browser
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function DashboardComponent() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // Wake up Argus Service Worker and fetch data on load
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(() => console.log("✅ Argus Service Worker is active."))
        .catch(err => console.error("❌ Service Worker failed:", err));
    }
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    const { data, error } = await supabase.from("competitions").select("*");
    if (!error && data) {
      setCompetitions(data);
    }
  };

  const addWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (platform && url) {
      setWatchlist([...watchlist, { id: Date.now(), name: platform, url }]);
      setPlatform("");
      setUrl("");
    }
  };

  const subscribeToNotifications = async () => {
    console.log("Argus Button Clicked!");
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const subData = subscription.toJSON();
        const { error: insertError } = await supabase
          .from("push_subscriptions")
          .insert([{ subscription: subData }]);

        if (insertError) {
          console.error("❌ SUPABASE INSERT ERROR:", insertError);
          alert("Failed to save to database. Check F12 Console!");
        } else {
          setIsSubscribed(true);
          alert("🎉 Argus is now armed! Push notifications active.");
        }
      } else {
        alert("Permission denied for push notifications.");
      }
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-blue-400">Argus: The web's silent sentinel</h1>
          <button
            onClick={subscribeToNotifications}
            disabled={isSubscribed}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isSubscribed
                ? "bg-green-900/40 text-green-400 border border-green-800 cursor-default"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isSubscribed ? "Argus Active" : " Arm Argus"}
          </button>
        </header>

        <section className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 mb-8">
          <h2 className="text-xl font-semibold mb-4">Assign Target</h2>
          <form onSubmit={addWebsite} className="mb-6 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Entity Name"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 px-4 py-2 rounded flex-1 min-w-[200px] text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Input extraction coordinates"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 px-4 py-2 rounded flex-2 min-w-[300px] text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors">
              Watch URL
            </button>
          </form>

          {watchlist.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {watchlist.map((site) => (
                <span key={site.id} className="bg-green-900/30 text-green-400 border border-green-800/50 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {site.name}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Intercepted Intel ({competitions.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.map((comp, idx) => (
              <div key={idx} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                <h3 className="font-bold text-lg text-white mb-2">{comp.title}</h3>
                <p className="text-neutral-400 text-sm mb-4">Prize: {comp.prize_pool || "TBA"}</p>
                <a href={comp.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  View Application →
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}