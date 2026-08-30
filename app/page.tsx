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
    <main className="min-h-screen bg-black text-white p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-500">
            Argus: The web's silent sentinel
          </h1>
          
          <button 
            onClick={subscribeToNotifications}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            Arm Argus
          </button>
        </header>

        {/* Input Card */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 shadow-2xl">
          <h2 className="text-base font-semibold text-white mb-4">Assign Target</h2>
          <form onSubmit={addWebsite} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Entity Name"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 px-4 py-2.5 rounded-lg flex-1 focus:outline-none focus:border-blue-600 text-sm"
            />
            <input
              type="text"
              placeholder="Input Extraction Coordinates"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 px-4 py-2.5 rounded-lg flex-[2] focus:outline-none focus:border-blue-600 text-sm"
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-all text-sm whitespace-nowrap"
            >
              Deploy Sentinel
            </button>
          </form>
        </section>

        {/* Intercepted Intel Section */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Intercepted Intel ({competitions.length})
          </h2>
          
          {competitions.length === 0 ? (
            <p className="text-neutral-500 text-sm">No target data intercepted yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {competitions.map((item: any, idx: number) => (
                <div key={idx} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-1 text-sm">{item.title || item.name}</h3>
                  <p className="text-xs text-neutral-400 mb-3">{item.platform}</p>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                      Access Intelligence Link →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
} // <--- ADD THIS BRACKET RIGHT HERE!