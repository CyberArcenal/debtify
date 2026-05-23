// src/renderer/api/core/creditCheck.ts
import type { PaginatedResult } from "./common";

export interface CreditScore {
  score: number;
  riskLevel: "Low" | "Medium" | "High";
  remarks: string;
  dateChecked: string;
}

export interface CreditCheckLog {
  id: number;
  debtorId: number;
  debtorName?: string;
  score: number;
  riskLevel: string;
  remarks: string;
  dateChecked: string;
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
  data: PaginatedResult<CreditCheckLog>;
}

class CreditCheckAPI {
  async getHistory(
    debtorId: number,
    page = 1,
    limit = 20,
  ): Promise<CreditCheckLogsResponse> {
    if (!window.backendAPI?.creditCheck) {
      throw new Error("Electron API (creditCheck) not available");
    }
    const response = await window.backendAPI.creditCheck({
      method: "getCreditCheckHistory",
      params: { debtorId, page, limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch credit check history");
  }

  async getLatest(debtorId: number): Promise<CreditCheckLog | null> {
    try {
      const response = await this.getHistory(debtorId, 1, 1);
      if (response.status && response.data.data.length > 0) {
        return response.data.data[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching latest credit check:", error);
      return null;
    }
  }

  async performCheck(
    debtorId: number,
    user = "system",
  ): Promise<PerformCreditCheckResponse> {
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

  async deleteLog(
    logId: number,
    user = "system",
  ): Promise<{ status: boolean; message: string }> {
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

  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.creditCheck;
  }
}

const creditCheckAPI = new CreditCheckAPI();
export default creditCheckAPI;
