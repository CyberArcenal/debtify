// src/renderer/api/core/creditCheck.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface CreditScore {
  score: number;          // 300-850
  riskLevel: "Low" | "Medium" | "High";
  remarks: string;
  dateChecked: string;    // ISO date string
}

export interface CreditCheckLog {
  id: number;
  debtorId: number;
  debtorName?: string;    // may be included for convenience
  score: number;
  riskLevel: string;
  remarks: string;
  dateChecked: string;    // ISO date string
  createdAt: string;
}

export interface PerformCreditCheckResponse {
  status: boolean;
  message: string;
  data: CreditScore;
}

export interface CreditCheckLogsResponse {
  status: boolean;
  message: string;
  data: CreditCheckLog[];
}

// ----------------------------------------------------------------------
// 🧠 CreditCheckAPI Class
// ----------------------------------------------------------------------

class CreditCheckAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get credit check history for a debtor
   * @param debtorId – debtor ID
   */
  async getHistory(debtorId: number): Promise<CreditCheckLogsResponse> {
    if (!window.backendAPI?.creditCheck) {
      throw new Error("Electron API (creditCheck) not available");
    }
    const response = await window.backendAPI.creditCheck({
      method: "getCreditCheckHistory",
      params: { debtorId },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch credit check history");
  }

  /**
   * Get the latest credit check for a debtor
   * @param debtorId – debtor ID
   */
  async getLatest(debtorId: number): Promise<CreditCheckLog | null> {
    try {
      const logs = await this.getHistory(debtorId);
      if (logs.data.length > 0) {
        // Assuming logs are returned sorted by date descending (newest first)
        return logs.data[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching latest credit check:", error);
      return null;
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Perform a credit check for a debtor (internal scoring or external API)
   * This will compute a score based on the debtor's debt history
   * and save the result to the logs.
   * 
   * @param debtorId – debtor ID
   * @param user – user performing the check (for audit)
   */
  async performCheck(debtorId: number, user = "system"): Promise<PerformCreditCheckResponse> {
    if (!window.backendAPI?.creditCheck) {
      throw new Error("Electron API (creditCheck) not available");
    }
    const response = await window.backendAPI.creditCheck({
      method: "performCreditCheck",
      params: { debtorId, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to perform credit check");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Delete a credit check log entry (if needed for corrections)
   * @param logId – credit check log ID
   * @param user – user performing deletion
   */
  async deleteLog(logId: number, user = "system"): Promise<{ status: boolean; message: string }> {
    if (!window.backendAPI?.creditCheck) {
      throw new Error("Electron API (creditCheck) not available");
    }
    const response = await window.backendAPI.creditCheck({
      method: "deleteCreditCheckLog",
      params: { logId, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete credit check log");
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.creditCheck);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const creditCheckAPI = new CreditCheckAPI();
export default creditCheckAPI;