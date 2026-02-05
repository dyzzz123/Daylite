"use client";

import { useEffect } from "react";

/**
 * AppInitializer component
 * Runs one-time initialization tasks when the app starts.
 * Currently initializes default feed sources if they don't exist.
 */
export function AppInitializer() {
  useEffect(() => {
    async function init() {
      try {
        // Call the initialization API endpoint
        const response = await fetch("/api/init", { method: "POST" });
        if (response.ok) {
          console.log("App initialization completed");
        }
      } catch (error) {
        console.error("App initialization failed:", error);
      }
    }

    init();
  }, []);

  return null; // This component doesn't render anything
}
