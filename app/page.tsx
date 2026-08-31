"use client";

import { useState } from "react";

export default function Home() {
  const [entityName, setEntityName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [intel, setIntel] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    // Prevent sending empty requests
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
        // Add the new intel to our list
        setIntel((prev) => [...prev, data.data.intel]);
      }
    } catch (error) {
      console.error("Mission failed:", error);
      setIntel((prev) => [...prev, "Error: Connection to Sentinel lost."]);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-500">Argus: The web's silent sentinel</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          Arm Argus
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Assign Target</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Entity Name"
            className="flex-1 bg-black border border-zinc-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Input Extraction Coordinates"
            className="flex-1 bg-black border border-zinc-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
          />
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {isDeploying ? "Deploying..." : "Deploy Sentinel"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">
          Intercepted Intel ({intel.length})
        </h2>
        {intel.length === 0 ? (
          <p className="text-zinc-400">No target data intercepted yet.</p>
        ) : (
          <ul className="space-y-3">
            {intel.map((item, index) => (
              <li key={index} className="bg-zinc-900 border border-zinc-800 p-4 rounded-md text-zinc-300">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}