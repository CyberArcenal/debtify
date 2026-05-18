// src/renderer/api/loanagreement.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface LoanAgreement {
  id: number;
  agreementDate: string | null;   // ISO date string
  lenderName: string | null;
  termsText: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  debt?: {
    id: number;
    name: string;
    totalAmount: number;
    status: string;
    borrower?: {
      id: number;
      name: string;
    };
  };
}

export interface LoanAgreementStatistics {
  totalAgreements: number;
  withFiles: number;
  uniqueLenders: number;
  averageAgreementsPerDebt: number;
}

export interface LoanAgreementCreateData {
  agreementDate?: string;         // YYYY-MM-DD or ISO string
  lenderName?: string | null;
  termsText?: string | null;
  debtId: number;
  // File upload (optional)
  fileBuffer?: Uint8Array;
  fileName?: string;
}

export interface LoanAgreementUpdateData {
  agreementDate?: string;
  lenderName?: string | null;
  termsText?: string | null;
  debtId?: number;
  // File handling
  fileBuffer?: Uint8Array;
  fileName?: string;
  removeFile?: boolean;
}

export interface BulkCreateAgreementResult {
  created: LoanAgreement[];
  errors: Array<{ agreement: any; error: string }>;
}

export interface BulkUpdateAgreementResult {
  updated: LoanAgreement[];
  errors: Array<{ id: number; updates: any; error: string }>;
}

export interface ImportAgreementCsvResult {
  imported: LoanAgreement[];
  errors: Array<{ row: any; error: string }>;
}

export interface ExportAgreementData {
  format: "csv" | "json";
  data: string | LoanAgreement[];
  filename: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface LoanAgreementResponse {
  status: boolean;
  message: string;
  data: LoanAgreement;
}

// ✅ Changed: data is now an array of LoanAgreements (no pagination metadata)
export interface LoanAgreementsResponse {
  status: boolean;
  message: string;
  data: LoanAgreement[];
}

export interface LoanAgreementStatisticsResponse {
  status: boolean;
  message: string;
  data: LoanAgreementStatistics;
}

export interface BulkCreateAgreementResponse {
  status: boolean;
  message: string;
  data: BulkCreateAgreementResult;
}

export interface BulkUpdateAgreementResponse {
  status: boolean;
  message: string;
  data: BulkUpdateAgreementResult;
}

export interface ImportAgreementCsvResponse {
  status: boolean;
  message: string;
  data: ImportAgreementCsvResult;
}

export interface ExportAgreementResponse {
  status: boolean;
  message: string;
  data: ExportAgreementData;
}

export interface DeleteAgreementResponse {
  status: boolean;
  message: string;
  data: LoanAgreement;
}

export interface RestoreAgreementResponse {
  status: boolean;
  message: string;
  data: LoanAgreement;
}

// ----------------------------------------------------------------------
// 🧠 LoanAgreementsAPI Class
// ----------------------------------------------------------------------

class LoanAgreementsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get a single loan agreement by ID
   */
  async getById(id: number, includeDeleted = false): Promise<LoanAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "getAgreementById",
      params: { id, includeDeleted },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch loan agreement");
  }

  /**
   * Get all loan agreements with optional filters and pagination
   * @returns LoanAgreementsResponse where data is an array of LoanAgreements (no pagination metadata)
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
    lenderName?: string;
    agreementDateFrom?: string;
    agreementDateTo?: string;
  }): Promise<LoanAgreementsResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "getAllAgreements",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch loan agreements");
  }

  /**
   * Get loan agreement statistics
   */
  async getStatistics(): Promise<LoanAgreementStatisticsResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "getAgreementStatistics",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch loan agreement statistics");
  }

  /**
   * Search loan agreements by lender name, terms, borrower, etc.
   * @returns LoanAgreementsResponse where data is an array of LoanAgreements
   */
  async search(
    searchTerm: string,
    page?: number,
    limit?: number,
    debtId?: number,
    lenderName?: string
  ): Promise<LoanAgreementsResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "searchAgreements",
      params: { searchTerm, page, limit, debtId, lenderName },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to search loan agreements");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS (CRUD)
  // --------------------------------------------------------------------

  /**
   * Create a new loan agreement
   * @param data - Agreement data (may include fileBuffer/fileName)
   */
  async create(data: LoanAgreementCreateData, user = "system"): Promise<LoanAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "createAgreement",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create loan agreement");
  }

  /**
   * Update an existing loan agreement
   * @param id - Agreement ID
   * @param data - Fields to update (may include fileBuffer/fileName/removeFile)
   */
  async update(id: number, data: LoanAgreementUpdateData, user = "system"): Promise<LoanAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "updateAgreement",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update loan agreement");
  }

  /**
   * Soft delete a loan agreement (set deletedAt)
   */
  async delete(id: number, user = "system"): Promise<DeleteAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "deleteAgreement",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete loan agreement");
  }

  /**
   * Restore a soft-deleted loan agreement
   */
  async restore(id: number, user = "system"): Promise<RestoreAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "restoreAgreement",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to restore loan agreement");
  }

  /**
   * Permanently delete a loan agreement (hard delete)
   */
  async permanentlyDelete(id: number, user = "system"): Promise<{ status: boolean; message: string }> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "permanentlyDeleteAgreement",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to permanently delete loan agreement");
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Bulk create multiple loan agreements
   */
  async bulkCreate(agreementsArray: LoanAgreementCreateData[], user = "system"): Promise<BulkCreateAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "bulkCreateAgreements",
      params: { agreementsArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk create loan agreements");
  }

  /**
   * Bulk update multiple loan agreements
   */
  async bulkUpdate(updatesArray: Array<{ id: number; updates: LoanAgreementUpdateData }>, user = "system"): Promise<BulkUpdateAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "bulkUpdateAgreements",
      params: { updatesArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk update loan agreements");
  }

  /**
   * Import loan agreements from a CSV file
   */
  async importFromCSV(filePath: string, user = "system"): Promise<ImportAgreementCsvResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "importAgreementsCSV",
      params: { filePath, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to import loan agreements from CSV");
  }

  /**
   * Export loan agreements to CSV or JSON
   */
  async export(format: "csv" | "json" = "json", filters: any = {}, user = "system"): Promise<ExportAgreementResponse> {
    if (!window.backendAPI?.loanAgreement) {
      throw new Error("Electron API (loanAgreement) not available");
    }
    const response = await window.backendAPI.loanAgreement({
      method: "exportAgreements",
      params: { format, filters, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to export loan agreements");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all agreements for a specific debt
   */
  async getByDebtId(debtId: number, includeDeleted = false): Promise<LoanAgreement[]> {
    const response = await this.getAll({ debtId, includeDeleted, limit: 1000 });
    return response.data;   // ✅ changed: .data is array directly
  }

  /**
   * Check if a debt has any agreements
   */
  async hasAgreements(debtId: number): Promise<boolean> {
    try {
      const response = await this.getAll({ debtId, limit: 1 });
      return response.data.length > 0;   // ✅ changed: .data is array
    } catch (error) {
      console.error("Error checking agreements:", error);
      return false;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.loanAgreement);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const loanAgreementsAPI = new LoanAgreementsAPI();
export default loanAgreementsAPI;