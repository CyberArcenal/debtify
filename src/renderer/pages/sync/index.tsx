import React, { useState, useEffect } from "react";
import { RefreshCw, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";

const SyncPage: React.FC = () => {
  const { getSetting } = useSettings();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSync, setLastSync] = useState<string | null>(null);

  const syncMode = getSetting("general", "sync_mode", "offline");
  const serverUrl = getSetting("general", "server_url", "");

  const handleSync = async () => {
    if (syncMode !== "online" as "offline" | "online" || !serverUrl) {
      return;
    }
    setSyncStatus("syncing");
    // TODO: implement actual sync logic (fetch unsynced queue, send batch)
    // For now, simulate
    setTimeout(() => {
      setSyncStatus("success");
      setLastSync(new Date().toLocaleString());
      setTimeout(() => setSyncStatus("idle"), 3000);
    }, 2000);
  };

  if (syncMode !== "online" as "offline" | "online") {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)]">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Sync is only available in Online Mode.</p>
        <p className="text-sm">Please enable Online Mode in Settings.</p>
      </div>
    );
  }

  return (
    <div className="m-1">
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" /> Data Sync
        </h1>
        <div className="mb-4 p-3 rounded-md bg-[var(--card-secondary-bg)]">
          <p>Server: <span className="font-mono">{serverUrl}</span></p>
          {lastSync && <p className="text-sm text-[var(--text-tertiary)]">Last sync: {lastSync}</p>}
        </div>
        <button
          onClick={handleSync}
          disabled={syncStatus === "syncing"}
          className="windows-button windows-button-primary flex items-center gap-2"
        >
          {syncStatus === "syncing" ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
        </button>
        {syncStatus === "success" && (
          <div className="mt-4 p-2 bg-green-500/20 text-green-500 rounded flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Sync completed successfully.
          </div>
        )}
        {syncStatus === "error" && (
          <div className="mt-4 p-2 bg-red-500/20 text-red-500 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Sync failed.
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncPage;