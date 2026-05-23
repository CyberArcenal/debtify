// src/renderer/api/core/printer.ts

import type { PaginatedResult } from "./common";

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface Printer {
  id: number;
  name: string;
  description: string | null;
  interface: "usb" | "network" | "bluetooth";
  connectionString: string;
  isDefault: boolean;
  status: "online" | "offline" | "error";
  lastTested: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterCreateData {
  name: string;
  description?: string | null;
  interface: Printer["interface"];
  connectionString: string;
  isDefault?: boolean;
}

export interface PrinterUpdateData {
  name?: string;
  description?: string | null;
  interface?: Printer["interface"];
  connectionString?: string;
  isDefault?: boolean;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PrinterResponse {
  status: boolean;
  message: string;
  data: Printer;
}

// ✅ Changed: now uses PaginatedResult
export interface PrintersResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<Printer>;
}

export interface TestPrintResponse {
  status: boolean;
  message: string;
  data?: {
    success: boolean;
    message?: string;
  };
}

export interface DeleteResponse {
  status: boolean;
  message: string;
}

// ----------------------------------------------------------------------
// 🧠 PrintersAPI Class
// ----------------------------------------------------------------------

class PrintersAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all configured printers with pagination
   * @param page - Page number (default 1)
   * @param limit - Items per page (default 10)
   */
  async getAll(page?: number, limit?: number): Promise<PrintersResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "getAllPrinters",
      params: { page, limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch printers");
  }

  /**
   * Get a single printer by ID
   */
  async getById(id: number): Promise<PrinterResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "getPrinterById",
      params: { id },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch printer");
  }

  /**
   * Get the default printer efficiently (without fetching all)
   */
  async getDefault(): Promise<Printer | null> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "getDefaultPrinter",
      params: {},
    });
    if (response.status) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch default printer");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async create(data: PrinterCreateData, user = "system"): Promise<PrinterResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "createPrinter",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create printer");
  }

  async update(id: number, data: PrinterUpdateData, user = "system"): Promise<PrinterResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "updatePrinter",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update printer");
  }

  async setDefault(id: number, user = "system"): Promise<PrinterResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "setDefaultPrinter",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to set default printer");
  }

  async delete(id: number, user = "system"): Promise<DeleteResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "deletePrinter",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete printer");
  }

  async testPrint(id: number): Promise<TestPrintResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "testPrinter",
      params: { id },
    });
    if (response.status) return response;
    throw new Error(response.message || "Test print failed");
  }

  async refreshStatus(id: number): Promise<PrinterResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "refreshPrinterStatus",
      params: { id },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to refresh printer status");
  }

  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.printer);
  }
}

const printerAPI = new PrintersAPI();
export default printerAPI;