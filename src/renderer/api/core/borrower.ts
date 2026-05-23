// src/renderer/api/borrower.ts

import type { PaginatedResult } from "./common";


// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface Borrower {
  id: number;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
  deletedAt: string | null;
}

export interface BorrowerStatistics {
  total: number;
  totalWithEmail: number;
  totalWithContact: number;
  recentlyAdded: number;
}

export interface BorrowerCreateData {
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface BorrowerUpdateData {
  name?: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface BulkCreateResult {
  created: Borrower[];
  errors: Array<{ borrower: any; error: string }>;
}

export interface BulkUpdateResult {
  updated: Borrower[];
  errors: Array<{ id: number; updates: any; error: string }>;
}

export interface ImportCsvResult {
  imported: Borrower[];
  errors: Array<{ row: any; error: string }>;
}

export interface ExportData {
  format: "csv" | "json";
  data: string | Borrower[];
  filename: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface BorrowerResponse {
  status: boolean;
  message: string;
  data: Borrower;
}

// ✅ Changed: data now contains pagination metadata
export interface BorrowersResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<Borrower>;
}

export interface BorrowerStatisticsResponse {
  status: boolean;
  message: string;
  data: BorrowerStatistics;
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: BulkCreateResult;
}

export interface BulkUpdateResponse {
  status: boolean;
  message: string;
  data: BulkUpdateResult;
}

export interface ImportCsvResponse {
  status: boolean;
  message: string;
  data: ImportCsvResult;
}

export interface ExportResponse {
  status: boolean;
  message: string;
  data: ExportData;
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: Borrower; // the soft-deleted borrower
}

export interface RestoreResponse {
  status: boolean;
  message: string;
  data: Borrower;
}

// ----------------------------------------------------------------------
// 🧠 BorrowersAPI Class
// ----------------------------------------------------------------------

class BorrowersAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get a single borrower by ID
   * @param id - Borrower ID
   * @param includeDeleted - Whether to include soft-deleted borrowers
   */
  async getById(id: number, includeDeleted = false): Promise<BorrowerResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "getBorrowerById",
        params: { id, includeDeleted },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch borrower");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch borrower");
    }
  }

  /**
   * Get all borrowers with optional filters and pagination
   * @returns BorrowersResponse where data.data is Borrower[] and data.pagination contains metadata
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    includeDeleted?: boolean;
    name?: string;
    email?: string;
    contact?: string;
  }): Promise<BorrowersResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "getAllBorrowers",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch borrowers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch borrowers");
    }
  }

  /**
   * Get borrower statistics
   */
  async getStatistics(): Promise<BorrowerStatisticsResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "getBorrowerStatistics",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch borrower statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch borrower statistics");
    }
  }

  /**
   * Search borrowers by name, email, contact, or address
   * @param searchTerm - Search keyword
   * @param page - Page number
   * @param limit - Items per page
   * @returns BorrowersResponse with paginated results
   */
  async search(searchTerm: string, page?: number, limit?: number): Promise<BorrowersResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "searchBorrowers",
        params: { searchTerm, page, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search borrowers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search borrowers");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS (CRUD)
  // --------------------------------------------------------------------

  /**
   * Create a new borrower
   * @param data - Borrower data
   * @param user - User performing the action
   */
  async create(data: BorrowerCreateData, user = "system"): Promise<BorrowerResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "createBorrower",
        params: { data, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create borrower");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create borrower");
    }
  }

  /**
   * Update an existing borrower
   * @param id - Borrower ID
   * @param data - Fields to update
   * @param user - User performing the action
   */
  async update(id: number, data: BorrowerUpdateData, user = "system"): Promise<BorrowerResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "updateBorrower",
        params: { id, data, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update borrower");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update borrower");
    }
  }

  /**
   * Soft delete a borrower (set deletedAt)
   * @param id - Borrower ID
   * @param user - User performing the action
   */
  async delete(id: number, user = "system"): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "deleteBorrower",
        params: { id, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete borrower");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete borrower");
    }
  }

  /**
   * Restore a soft-deleted borrower
   * @param id - Borrower ID
   * @param user - User performing the action
   */
  async restore(id: number, user = "system"): Promise<RestoreResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "restoreBorrower",
        params: { id, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to restore borrower");
    } catch (error: any) {
      throw new Error(error.message || "Failed to restore borrower");
    }
  }

  /**
   * Permanently delete a borrower (hard delete)
   * @param id - Borrower ID
   * @param user - User performing the action
   */
  async permanentlyDelete(id: number, user = "system"): Promise<{ status: boolean; message: string }> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "permanentlyDeleteBorrower",
        params: { id, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to permanently delete borrower");
    } catch (error: any) {
      throw new Error(error.message || "Failed to permanently delete borrower");
    }
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Bulk create multiple borrowers
   * @param borrowersArray - Array of borrower data objects
   * @param user - User performing the action
   */
  async bulkCreate(borrowersArray: BorrowerCreateData[], user = "system"): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "bulkCreateBorrowers",
        params: { borrowersArray, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create borrowers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create borrowers");
    }
  }

  /**
   * Bulk update multiple borrowers
   * @param updatesArray - Array of objects containing id and updates
   * @param user - User performing the action
   */
  async bulkUpdate(updatesArray: Array<{ id: number; updates: BorrowerUpdateData }>, user = "system"): Promise<BulkUpdateResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "bulkUpdateBorrowers",
        params: { updatesArray, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update borrowers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update borrowers");
    }
  }

  /**
   * Import borrowers from a CSV file
   * @param filePath - Absolute path to CSV file
   * @param user - User performing the action
   */
  async importFromCSV(filePath: string, user = "system"): Promise<ImportCsvResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "importBorrowersCSV",
        params: { filePath, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import borrowers from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import borrowers from CSV");
    }
  }

  /**
   * Export borrowers to CSV or JSON
   * @param format - 'csv' or 'json'
   * @param filters - Optional filters (same as getAll)
   * @param user - User performing the action
   */
  async export(format: "csv" | "json" = "json", filters: any = {}, user = "system"): Promise<ExportResponse> {
    try {
      if (!window.backendAPI?.borrower) {
        throw new Error("Electron API (borrower) not available");
      }

      const response = await window.backendAPI.borrower({
        method: "exportBorrowers",
        params: { format, filters, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export borrowers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export borrowers");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a borrower exists by email
   * @param email - Email address
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const response = await this.getAll({ email, limit: 1 });
      return response.data.data.length > 0;   // ✅ access nested data array
    } catch (error) {
      console.error("Error checking borrower by email:", error);
      return false;
    }
  }

  /**
   * Check if a borrower exists by contact number
   * @param contact - Contact number
   */
  async existsByContact(contact: string): Promise<boolean> {
    try {
      const response = await this.getAll({ contact, limit: 1 });
      return response.data.data.length > 0;   // ✅ access nested data array
    } catch (error) {
      console.error("Error checking borrower by contact:", error);
      return false;
    }
  }

  /**
   * Get borrower by email (returns first match)
   * @param email - Email address
   */
  async getByEmail(email: string): Promise<Borrower | null> {
    try {
      const response = await this.getAll({ email, limit: 1 });
      return response.data.data[0] || null;   // ✅ access nested data array
    } catch (error) {
      console.error("Error fetching borrower by email:", error);
      return null;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.borrower);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const borrowersAPI = new BorrowersAPI();
export default borrowersAPI;