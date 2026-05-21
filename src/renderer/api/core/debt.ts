// src/renderer/api/debt.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface Debt {
  id: number;
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string; // ISO date string
  status: "active" | "paid" | "overdue" | "defaulted";
  interestRate: number | null;
  penaltyRate: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  borrower?: {
    id: number;
    name: string;
    contact: string | null;
    email: string | null;
  };
}

export interface BorrowerFilters {
  search?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
}

export interface DebtStatistics {
  totalDebts: number;
  totalActive: number;
  totalPaid: number;
  totalOverdue: number;
  totalDefaulted: number;
  totalAmountOwed: number;
  totalRemainingBalance: number;
}

export interface DebtCreateData {
  name: string;
  totalAmount: number;
  paidAmount?: number;
  dueDate: string; // YYYY-MM-DD or ISO string
  status?: "active" | "paid" | "overdue" | "defaulted";
  interestRate?: number | null;
  penaltyRate?: number | null;
  borrowerId: number;
}

export interface DebtUpdateData {
  name?: string;
  totalAmount?: number;
  paidAmount?: number;
  dueDate?: string;
  status?: "active" | "paid" | "overdue" | "defaulted";
  interestRate?: number | null;
  penaltyRate?: number | null;
  borrowerId?: number;
}

export interface BulkCreateDebtResult {
  created: Debt[];
  errors: Array<{ debt: any; error: string }>;
}

export interface BulkUpdateDebtResult {
  updated: Debt[];
  errors: Array<{ id: number; updates: any; error: string }>;
}

export interface ImportDebtCsvResult {
  imported: Debt[];
  errors: Array<{ row: any; error: string }>;
}

export interface ExportDebtData {
  format: "csv" | "json";
  data: string | Debt[];
  filename: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface DebtResponse {
  status: boolean;
  message: string;
  data: Debt;
}

// ✅ Changed: data is now an array of Debts (no pagination metadata)
export interface DebtsResponse {
  status: boolean;
  message: string;
  data: Debt[];
}

export interface DebtStatisticsResponse {
  status: boolean;
  message: string;
  data: DebtStatistics;
}

export interface BulkCreateDebtResponse {
  status: boolean;
  message: string;
  data: BulkCreateDebtResult;
}

export interface BulkUpdateDebtResponse {
  status: boolean;
  message: string;
  data: BulkUpdateDebtResult;
}

export interface ImportDebtCsvResponse {
  status: boolean;
  message: string;
  data: ImportDebtCsvResult;
}

export interface ExportDebtResponse {
  status: boolean;
  message: string;
  data: ExportDebtData;
}

export interface DeleteDebtResponse {
  status: boolean;
  message: string;
  data: Debt;
}

export interface RestoreDebtResponse {
  status: boolean;
  message: string;
  data: Debt;
}

export interface RecalculateRemainingResponse {
  status: boolean;
  message: string;
  data: Debt;
}

// ----------------------------------------------------------------------
// 🧠 DebtsAPI Class
// ----------------------------------------------------------------------

class DebtsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get a single debt by ID
   * @param id - Debt ID
   * @param includeDeleted - Whether to include soft-deleted debts
   */
  async getById(id: number, includeDeleted = false): Promise<DebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "getDebtById",
      params: { id, includeDeleted },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch debt");
  }

  /**
   * Get all debts with optional filters and pagination
   * @returns DebtsResponse where data is an array of Debts (no pagination metadata)
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    includeDeleted?: boolean;
    status?: "active" | "paid" | "overdue" | "defaulted";
    borrowerId?: number;
    dueDateFrom?: string;
    dueDateTo?: string;
    minTotalAmount?: number;
    maxTotalAmount?: number;
  }): Promise<DebtsResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "getAllDebts",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch debts");
  }

  /**
   * Get debt statistics
   */
  async getStatistics(): Promise<DebtStatisticsResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "getDebtStatistics",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch debt statistics");
  }

  /**
   * Search debts by name, borrower name, etc.
   * @returns DebtsResponse where data is an array of Debts
   */
  async search(
    searchTerm: string,
    page?: number,
    limit?: number,
    status?: string,
    borrowerId?: number,
  ): Promise<DebtsResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "searchDebts",
      params: { searchTerm, page, limit, status, borrowerId },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to search debts");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS (CRUD)
  // --------------------------------------------------------------------

  /**
   * Create a new debt
   */
  async create(data: DebtCreateData, user = "system"): Promise<DebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "createDebt",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create debt");
  }

  /**
   * Update an existing debt
   */
  async update(
    id: number,
    data: DebtUpdateData,
    user = "system",
  ): Promise<DebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "updateDebt",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update debt");
  }

  /**
   * Soft delete a debt (set deletedAt)
   */
  async delete(id: number, user = "system"): Promise<DeleteDebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "deleteDebt",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete debt");
  }

  /**
   * Restore a soft-deleted debt
   */
  async restore(id: number, user = "system"): Promise<RestoreDebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "restoreDebt",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to restore debt");
  }

  /**
   * Permanently delete a debt (hard delete)
   */
  async permanentlyDelete(
    id: number,
    user = "system",
  ): Promise<{ status: boolean; message: string }> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "permanentlyDeleteDebt",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to permanently delete debt");
  }

  /**
   * Recalculate remaining amount for a debt (based on paidAmount)
   */
  async recalculateRemainingAmount(
    id: number,
    user = "system",
  ): Promise<RecalculateRemainingResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "recalculateRemainingAmount",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(
      response.message || "Failed to recalculate remaining amount",
    );
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Bulk create multiple debts
   */
  async bulkCreate(
    debtsArray: DebtCreateData[],
    user = "system",
  ): Promise<BulkCreateDebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "bulkCreateDebts",
      params: { debtsArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk create debts");
  }

  /**
   * Bulk update multiple debts
   */
  async bulkUpdate(
    updatesArray: Array<{ id: number; updates: DebtUpdateData }>,
    user = "system",
  ): Promise<BulkUpdateDebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "bulkUpdateDebts",
      params: { updatesArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk update debts");
  }

  /**
   * Correct total amount (without triggering forgiveness flow)
   * Use this for data entry corrections only, not for actual forgiveness.
   */
  async correctTotalAmount(
    id: number,
    newTotalAmount: number,
    user = "system",
  ): Promise<DebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "correctTotalAmount",
      params: { id, newTotalAmount, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to correct total amount");
  }

  /**
   * Apply debt forgiveness (reduces total amount, triggers notifications)
   * @param id - Debt ID
   * @param amountForgiven - Amount to forgive
   * @param user - User performing the action
   * @param reason - Optional reason for forgiveness
   */
  async applyForgiveness(
    id: number,
    amountForgiven: number,
    user = "system",
    reason?: string,
  ): Promise<DebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "applyForgiveness",
      params: { id, amountForgiven, user, reason },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to apply forgiveness");
  }

  /**
   * Import debts from a CSV file
   */
  async importFromCSV(
    filePath: string,
    user = "system",
  ): Promise<ImportDebtCsvResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "importDebtsCSV",
      params: { filePath, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to import debts from CSV");
  }

  /**
   * Export debts to CSV or JSON
   */
  async export(
    format: "csv" | "json" = "json",
    filters: any = {},
    user = "system",
  ): Promise<ExportDebtResponse> {
    if (!window.backendAPI?.debt) {
      throw new Error("Electron API (debt) not available");
    }
    const response = await window.backendAPI.debt({
      method: "exportDebts",
      params: { format, filters, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to export debts");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a debt exists by name for a given borrower
   */
  async existsForBorrower(
    borrowerId: number,
    debtName: string,
  ): Promise<boolean> {
    try {
      const response = await this.getAll({
        borrowerId,
        search: debtName,
        limit: 1,
      });
      return response.data.length > 0; // ✅ changed: .data is array
    } catch (error) {
      console.error("Error checking debt existence:", error);
      return false;
    }
  }

  /**
   * Get all debts for a specific borrower
   */
  async getByBorrowerId(
    borrowerId: number,
    includeDeleted = false,
  ): Promise<Debt[]> {
    const response = await this.getAll({
      borrowerId,
      includeDeleted,
      limit: 1000,
    });
    return response.data; // ✅ changed: .data is array directly
  }

  /**
   * Get overdue debts (status = 'overdue')
   */
  async getOverdueDebts(page?: number, limit?: number): Promise<DebtsResponse> {
    return this.getAll({ status: "overdue", page, limit });
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.debt;
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const debtsAPI = new DebtsAPI();
export default debtsAPI;
