// src/renderer/api/paymenttransaction.ts

import type { PaginatedResult } from "./common";

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface PaymentTransaction {
  id: number;
  amount: number;
  paymentDate: string; // ISO date string
  reference: string | null;
  notes: string | null;
  recordedAt: string; // ISO date string
  deletedAt: string | null;
  methodId: number | null;
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

export interface PaymentStatistics {
  totalPayments: number;
  totalAmountCollected: number;
  averagePaymentAmount: number;
  paymentsLast30Days: number;
  debtsWithPayments: number;
}

export interface PaymentCreateData {
  amount: number;
  paymentDate: string; // YYYY-MM-DD or ISO string
  reference?: string | null;
  notes?: string | null;
  methodId: number;
  debtId: number;
}

export interface PaymentUpdateData {
  amount?: number;
  paymentDate?: string;
  reference?: string | null;
  notes?: string | null;
  methodId?: number;
  debtId?: number;
}

export interface BulkCreatePaymentResult {
  created: PaymentTransaction[];
  errors: Array<{ payment: any; error: string }>;
}

export interface BulkUpdatePaymentResult {
  updated: PaymentTransaction[];
  errors: Array<{ id: number; updates: any; error: string }>;
}

export interface ImportPaymentCsvResult {
  imported: PaymentTransaction[];
  errors: Array<{ row: any; error: string }>;
}

export interface ExportPaymentData {
  format: "csv" | "json";
  data: string | PaymentTransaction[];
  filename: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: PaymentTransaction;
}

// ✅ Changed: now uses PaginatedResult for list endpoints
export interface PaymentsResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<PaymentTransaction>;
}

export interface PaymentStatisticsResponse {
  status: boolean;
  message: string;
  data: PaymentStatistics;
}

export interface BulkCreatePaymentResponse {
  status: boolean;
  message: string;
  data: BulkCreatePaymentResult;
}

export interface BulkUpdatePaymentResponse {
  status: boolean;
  message: string;
  data: BulkUpdatePaymentResult;
}

export interface ImportPaymentCsvResponse {
  status: boolean;
  message: string;
  data: ImportPaymentCsvResult;
}

export interface ExportPaymentResponse {
  status: boolean;
  message: string;
  data: ExportPaymentData;
}

export interface DeletePaymentResponse {
  status: boolean;
  message: string;
  data: PaymentTransaction;
}

export interface RestorePaymentResponse {
  status: boolean;
  message: string;
  data: PaymentTransaction;
}

// ----------------------------------------------------------------------
// 🧠 PaymentsAPI Class
// ----------------------------------------------------------------------

class PaymentsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  async getById(id: number, includeDeleted = false): Promise<PaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "getPaymentById",
      params: { id, includeDeleted },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch payment");
  }

  /**
   * Get all payment transactions with optional filters and pagination
   * @returns PaymentsResponse where data.data is PaymentTransaction[] and data.pagination contains metadata
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
    reference?: string;
    paymentDateFrom?: string;
    paymentDateTo?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<PaymentsResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "getAllPayments",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch payments");
  }

  async getStatistics(): Promise<PaymentStatisticsResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "getPaymentStatistics",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch payment statistics");
  }

  async search(
    searchTerm: string,
    page?: number,
    limit?: number,
    debtId?: number,
    borrowerId?: number,
    minAmount?: number,
    maxAmount?: number,
  ): Promise<PaymentsResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "searchPayments",
      params: {
        searchTerm,
        page,
        limit,
        debtId,
        borrowerId,
        minAmount,
        maxAmount,
      },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to search payments");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async create(
    data: PaymentCreateData,
    user = "system",
  ): Promise<PaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "createPayment",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create payment");
  }

  async update(
    id: number,
    data: PaymentUpdateData,
    user = "system",
  ): Promise<PaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "updatePayment",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update payment");
  }

  async delete(id: number, user = "system"): Promise<DeletePaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "deletePayment",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete payment");
  }

  async restore(id: number, user = "system"): Promise<RestorePaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "restorePayment",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to restore payment");
  }

  async permanentlyDelete(
    id: number,
    user = "system",
  ): Promise<{ status: boolean; message: string }> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "permanentlyDeletePayment",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to permanently delete payment");
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  async bulkCreate(
    paymentsArray: PaymentCreateData[],
    user = "system",
  ): Promise<BulkCreatePaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "bulkCreatePayments",
      params: { paymentsArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk create payments");
  }

  async bulkUpdate(
    updatesArray: Array<{ id: number; updates: PaymentUpdateData }>,
    user = "system",
  ): Promise<BulkUpdatePaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "bulkUpdatePayments",
      params: { updatesArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk update payments");
  }

  async importFromCSV(
    filePath: string,
    user = "system",
  ): Promise<ImportPaymentCsvResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "importPaymentsCSV",
      params: { filePath, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to import payments from CSV");
  }

  async export(
    format: "csv" | "json" = "json",
    filters: any = {},
    user = "system",
  ): Promise<ExportPaymentResponse> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "exportPayments",
      params: { format, filters, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to export payments");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  async getByDebtId(
    debtId: number,
    includeDeleted = false,
  ): Promise<PaymentTransaction[]> {
    const response = await this.getAll({ debtId, includeDeleted, limit: 1000 });
    return response.data.data; // ✅ access nested data array
  }

  async getTotalPaidForDebt(debtId: number): Promise<number> {
    const payments = await this.getByDebtId(debtId, false);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.paymentTransaction;
  }

  /**
   * Get collection report for a date range and target
   * @param fromDate - YYYY-MM-DD
   * @param toDate - YYYY-MM-DD
   * @param target - expected total collection amount
   */
  async getCollectionReport(
    fromDate: string,
    toDate: string,
    target: number,
  ): Promise<{ status: boolean; message: string; data: any }> {
    if (!window.backendAPI?.paymentTransaction) {
      throw new Error("Electron API (paymentTransaction) not available");
    }
    const response = await window.backendAPI.paymentTransaction({
      method: "getCollectionReport",
      params: { fromDate, toDate, target },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to generate collection report");
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const paymentsAPI = new PaymentsAPI();
export default paymentsAPI;
