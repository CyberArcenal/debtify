// src/renderer/api/penaltytransaction.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface PenaltyTransaction {
  id: number;
  amount: number;
  penaltyDate: string;        // ISO date string
  reason: string | null;
  createdAt: string;          // ISO date string
  deletedAt: string | null;
  debt?: {
    id: number;
    name: string;
    totalAmount: number;
    remainingAmount: number;
    borrower?: {
      id: number;
      name: string;
    };
  };
}

export interface PenaltyStatistics {
  totalPenalties: number;
  totalPenaltyAmount: number;
  averagePenaltyAmount: number;
  penaltiesLast30Days: number;
  topDebtsByPenalty: Array<{
    debtId: number;
    debtName: string;
    totalPenalty: number;
  }>;
}

export interface PenaltyCreateData {
  amount: number;
  penaltyDate: string;        // YYYY-MM-DD or ISO string
  reason?: string | null;
  debtId: number;
}

export interface PenaltyUpdateData {
  amount?: number;
  penaltyDate?: string;
  reason?: string | null;
  debtId?: number;
}

export interface BulkCreatePenaltyResult {
  created: PenaltyTransaction[];
  errors: Array<{ penalty: any; error: string }>;
}

export interface BulkUpdatePenaltyResult {
  updated: PenaltyTransaction[];
  errors: Array<{ id: number; updates: any; error: string }>;
}

export interface ImportPenaltyCsvResult {
  imported: PenaltyTransaction[];
  errors: Array<{ row: any; error: string }>;
}

export interface ExportPenaltyData {
  format: "csv" | "json";
  data: string | PenaltyTransaction[];
  filename: string;
}

export interface TotalPenaltyForDebt {
  debtId: number;
  totalPenalty: number;
  penaltyCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PenaltyResponse {
  status: boolean;
  message: string;
  data: PenaltyTransaction;
}

// ✅ Changed: data is now an array of PenaltyTransactions (no pagination metadata)
export interface PenaltiesResponse {
  status: boolean;
  message: string;
  data: PenaltyTransaction[];
}

export interface PenaltyStatisticsResponse {
  status: boolean;
  message: string;
  data: PenaltyStatistics;
}

export interface TotalPenaltyForDebtResponse {
  status: boolean;
  message: string;
  data: TotalPenaltyForDebt;
}

export interface BulkCreatePenaltyResponse {
  status: boolean;
  message: string;
  data: BulkCreatePenaltyResult;
}

export interface BulkUpdatePenaltyResponse {
  status: boolean;
  message: string;
  data: BulkUpdatePenaltyResult;
}

export interface ImportPenaltyCsvResponse {
  status: boolean;
  message: string;
  data: ImportPenaltyCsvResult;
}

export interface ExportPenaltyResponse {
  status: boolean;
  message: string;
  data: ExportPenaltyData;
}

export interface DeletePenaltyResponse {
  status: boolean;
  message: string;
  data: PenaltyTransaction;
}

export interface RestorePenaltyResponse {
  status: boolean;
  message: string;
  data: PenaltyTransaction;
}

// ----------------------------------------------------------------------
// 🧠 PenaltiesAPI Class
// ----------------------------------------------------------------------

class PenaltiesAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  async getById(id: number, includeDeleted = false): Promise<PenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "getPenaltyById",
      params: { id, includeDeleted },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch penalty");
  }

  /**
   * Get all penalty transactions with optional filters and pagination
   * @returns PenaltiesResponse where data is an array of PenaltyTransactions (no pagination metadata)
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    includeDeleted?: boolean;
    debtId?: number;
    borrowerId?: number;
    penaltyDateFrom?: string;
    penaltyDateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    reason?: string;
  }): Promise<PenaltiesResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "getAllPenalties",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch penalties");
  }

  async getStatistics(): Promise<PenaltyStatisticsResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "getPenaltyStatistics",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch penalty statistics");
  }

  async getTotalPenaltyForDebt(debtId: number, includeDeleted = false): Promise<TotalPenaltyForDebtResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "getTotalPenaltyForDebt",
      params: { debtId, includeDeleted },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch total penalty for debt");
  }

  async search(
    searchTerm: string,
    page?: number,
    limit?: number,
    debtId?: number,
    borrowerId?: number,
    minAmount?: number,
    maxAmount?: number
  ): Promise<PenaltiesResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "searchPenalties",
      params: { searchTerm, page, limit, debtId, borrowerId, minAmount, maxAmount },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to search penalties");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async create(data: PenaltyCreateData, user = "system"): Promise<PenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "createPenalty",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create penalty");
  }

  async update(id: number, data: PenaltyUpdateData, user = "system"): Promise<PenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "updatePenalty",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update penalty");
  }

  async delete(id: number, user = "system"): Promise<DeletePenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "deletePenalty",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete penalty");
  }

  async restore(id: number, user = "system"): Promise<RestorePenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "restorePenalty",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to restore penalty");
  }

  async permanentlyDelete(id: number, user = "system"): Promise<{ status: boolean; message: string }> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "permanentlyDeletePenalty",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to permanently delete penalty");
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  async bulkCreate(penaltiesArray: PenaltyCreateData[], user = "system"): Promise<BulkCreatePenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "bulkCreatePenalties",
      params: { penaltiesArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk create penalties");
  }

  async bulkUpdate(updatesArray: Array<{ id: number; updates: PenaltyUpdateData }>, user = "system"): Promise<BulkUpdatePenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "bulkUpdatePenalties",
      params: { updatesArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk update penalties");
  }

  async importFromCSV(filePath: string, user = "system"): Promise<ImportPenaltyCsvResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "importPenaltiesCSV",
      params: { filePath, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to import penalties from CSV");
  }

  async export(format: "csv" | "json" = "json", filters: any = {}, user = "system"): Promise<ExportPenaltyResponse> {
    if (!window.backendAPI?.penaltyTransaction) {
      throw new Error("Electron API (penaltyTransaction) not available");
    }
    const response = await window.backendAPI.penaltyTransaction({
      method: "exportPenalties",
      params: { format, filters, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to export penalties");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  async getByDebtId(debtId: number, includeDeleted = false): Promise<PenaltyTransaction[]> {
    const response = await this.getAll({ debtId, includeDeleted, limit: 1000 });
    return response.data;   // ✅ changed: .data is array directly
  }

  async getTotalAmountForDebt(debtId: number, includeDeleted = false): Promise<number> {
    const response = await this.getTotalPenaltyForDebt(debtId, includeDeleted);
    return response.data.totalPenalty;
  }

  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.penaltyTransaction);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const penaltiesAPI = new PenaltiesAPI();
export default penaltiesAPI;