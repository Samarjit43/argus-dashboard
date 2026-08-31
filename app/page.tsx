"use client";

import { useState } from "react";

export default function Home() {
  const [entityName, setEntityName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [intelList, setIntelList] = useState<string[]>([]);

  const handleDeploy = async () => {
    if (!entityName || !coordinates) return;

    setIsDeploying(true);

    try {
      const response = await fetch("https://argus-dashboard-86zk.onrender.com/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_name: entityName,
          coordinates: coordinates,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setIntelList((prev) => [data.data.intel, ...prev]);
      } else {
        setIntelList((prev) => [`Error: ${data.detail || "Connection to Sentinel lost."}`, ...prev]);
      }
    } catch (error) {
      console.error("Deploy error:", error);
      setIntelList((prev) => ["Error: Connection to Sentinel lost.", ...prev]);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-500">
          Argus: The web&apos;s silent sentinel
        </h1>
        <button className="bg-blue-600 px-4 py-2 rounded-lg text-white font-semibold hover:bg-blue-700 transition">
          Arm Argus
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Assign Target</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Entity Name (e.g. VSSUT)"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            className="bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white flex-1 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Target URL (e.g. https://www.vssut.ac.in/)"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            className="bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white flex-1 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {isDeploying ? "Deploying..." : "Deploy Sentinel"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">
          Intercepted Intel ({intelList.length})
        </h2>
        <div className="space-y-4">
          {intelList.length === 0 ? (
            <p className="text-zinc-500 text-sm">No intel intercepted yet.</p>
          ) : (
            intelList.map((intel, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-300 font-mono text-sm"
              >
                {intel}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}