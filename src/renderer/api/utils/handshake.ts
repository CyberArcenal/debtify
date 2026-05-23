// src/renderer/api/utils/handshake.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface HandshakeRequest {
  client_version: string;
  db_schema_version: string;
  platform: string;
  license_key?: string;
  timestamp: string;
}

export interface HandshakeResponse {
  status: "ok" | "outdated" | "error";
  server_version?: string;
  min_client_version?: string;
  expected_schema_version?: string;
  sync_enabled?: boolean;
  ping_ms?: number;
  features?: string[];
  required_version?: string;
  message?: string;
}

export interface HandshakeResult {
  status: boolean;
  message: string;
  data: HandshakeResponse;
}

// ----------------------------------------------------------------------
// 🧠 HandshakeAPI Class
// ----------------------------------------------------------------------

class HandshakeAPI {
  /**
   * Perform a handshake with the server to validate compatibility and get sync settings.
   * @param serverUrl - The server URL (e.g., https://api.example.com)
   * @param licenseKey - Optional license key for validation
   */
  async perform(serverUrl: string, licenseKey?: string): Promise<HandshakeResult> {
    if (!window.backendAPI?.handshake) {
      throw new Error("Electron API (utils) not available");
    }
    const response = await window.backendAPI.handshake({
      method: "handshake",
      params: { serverUrl, licenseKey },
    });
    if (response.status) return response;
    throw new Error(response.message || "Handshake failed");
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const handshakeAPI = new HandshakeAPI();
export default handshakeAPI;