// src/components/Shared/SyncStatusIndicator.tsx
import React, { useState, useEffect } from "react";
import { useSettings } from "../../contexts/SettingsContext";

const SyncStatusIndicator: React.FC = () => {
  const { getSetting } = useSettings();
  const [syncMode, setSyncMode] = useState<"offline_first" | "online_only" | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const loadSyncMode = async () => {
    const mode = await getSetting("general", "sync_mode", "offline_first");
    setSyncMode(mode === "online_only" as "online_only" | "offline_first" ? "online_only" : "offline_first");
  };

  useEffect(() => {
    loadSyncMode();

    // Listen for settings changes from backend
    const handleSettingsChanged = () => {
      loadSyncMode();
    };
    window.backendAPI?.on?.("settings:changed", handleSettingsChanged);
    return () => {
      window.backendAPI?.off?.("settings:changed", handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getStatus = () => {
    if (syncMode === "online_only") {
      return {
        label: isOnline ? "Online" : "Offline (No Internet)",
        color: isOnline ? "bg-green-500" : "bg-red-500",
        tooltip: isOnline
          ? "Data is synced with server. All changes are sent immediately."
          : "Cannot reach the server. Check your network.",
      };
    }
    return {
      label: "Offline Mode",
      color: "bg-yellow-500",
      tooltip: "Data is stored locally only. No server sync is active.",
    };
  };

  const status = getStatus();

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]">
        <div className={`w-2 h-2 rounded-full ${status.color} ${status.label === "Online" ? "animate-pulse" : ""}`} />
        <span className="text-xs text-[var(--text-primary)]">{status.label}</span>
      </div>
      <div className="absolute top-full right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg p-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="text-xs text-[var(--text-secondary)]">
          <strong>Sync Mode:</strong> {syncMode === "online_only" ? "Online" : "Offline"}<br />
          {status.tooltip}
        </div>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;