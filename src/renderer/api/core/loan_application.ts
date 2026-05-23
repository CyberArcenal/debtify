// src/renderer/api/core/loanApplication.ts

import type { PaginatedResult } from "./common";

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface LoanApplication {
  id: number;
  debtorId: number | null;
  debtorName: string;
  debtorContact: string | null;
  debtorEmail: string | null;
  debtorAddress: string | null;
  requestedAmount: number;
  purpose: string;
  proposedDueDate: string;
  interestRate: number | null;
  status: "pending" | "approved" | "rejected";
  approvedAt: string | null;
  rejectedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LoanApplicationCreateData {
  debtorId?: number | null;
  newDebtor?: {
    name: string;
    contact?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  };
  requestedAmount: number;
  purpose: string;
  proposedDueDate: string;
  interestRate?: number | null;
}

export interface LoanApplicationUpdateData {
  requestedAmount?: number;
  purpose?: string;
  proposedDueDate?: string;
  interestRate?: number | null;
}

export interface LoanApplicationFilters {
  status?: "pending" | "approved" | "rejected";
  fromDate?: string;
  toDate?: string;
  debtorId?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface LoanApplicationResponse {
  status: boolean;
  message: string;
  data: LoanApplication;
}

// ✅ Changed: now uses PaginatedResult
export interface LoanApplicationsResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<LoanApplication>;
}

export interface ApproveRejectResponse {
  status: boolean;
  message: string;
  data: {
    application: LoanApplication;
    createdDebt?: {
      id: number;
      name: string;
    };
  };
}

export interface DeleteResponse {
  status: boolean;
  message: string;
}

// ----------------------------------------------------------------------
// 🧠 LoanApplicationsAPI Class
// ----------------------------------------------------------------------

class LoanApplicationsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all loan applications with optional filters and pagination
   */
  async getAll(
    filters?: LoanApplicationFilters,
  ): Promise<LoanApplicationsResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "getAllApplications",
      params: filters || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch loan applications");
  }

  /**
   * Get a single application by ID
   */
  async getById(id: number): Promise<LoanApplicationResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "getApplicationById",
      params: { id },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch loan application");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS (unchanged)
  // --------------------------------------------------------------------

  async create(
    data: LoanApplicationCreateData,
    user = "system",
  ): Promise<LoanApplicationResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "createApplication",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create loan application");
  }

  async update(
    id: number,
    data: LoanApplicationUpdateData,
    user = "system",
  ): Promise<LoanApplicationResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "updateApplication",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update loan application");
  }

  async approve(id: number, user = "system"): Promise<ApproveRejectResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "approveApplication",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to approve application");
  }

  async reject(
    id: number,
    reason?: string,
    user = "system",
  ): Promise<ApproveRejectResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "rejectApplication",
      params: { id, reason, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to reject application");
  }

  async delete(id: number, user = "system"): Promise<DeleteResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "deleteApplication",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete loan application");
  }

  async restore(id: number, user = "system"): Promise<LoanApplicationResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "restoreApplication",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to restore loan application");
  }

  async permanentlyDelete(
    id: number,
    user = "system",
  ): Promise<DeleteResponse> {
    if (!window.backendAPI?.loanApplication) {
      throw new Error("Electron API (loanApplication) not available");
    }
    const response = await window.backendAPI.loanApplication({
      method: "permanentlyDeleteApplication",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(
      response.message || "Failed to permanently delete loan application",
    );
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  async hasPendingApplication(debtorId: number): Promise<boolean> {
    try {
      const response = await this.getAll({
        debtorId,
        status: "pending",
        limit: 1,
      });
      return response.data.data.length > 0; // ✅ access nested array
    } catch (error) {
      console.error("Error checking pending application:", error);
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.loanApplication;
  }
}

const loanApplicationsAPI = new LoanApplicationsAPI();
export default loanApplicationsAPI;
