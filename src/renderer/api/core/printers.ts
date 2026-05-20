// src/renderer/api/core/printer.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface Printer {
  id: number;
  name: string;
  description: string | null;
  interface: "usb" | "network" | "bluetooth";
  connectionString: string;     // e.g., "USB001", "192.168.1.100:9100", "00:11:22:33:44:55"
  isDefault: boolean;
  status: "online" | "offline" | "error";
  lastTested: string | null;    // ISO date string
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

export interface PrintersResponse {
  status: boolean;
  message: string;
  data: Printer[];
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
   * Get all configured printers
   */
  async getAll(): Promise<PrintersResponse> {
    if (!window.backendAPI?.printer) {
      throw new Error("Electron API (printer) not available");
    }
    const response = await window.backendAPI.printer({
      method: "getAllPrinters",
      params: {},
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

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Add a new printer
   */
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

  /**
   * Update an existing printer
   */
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

  /**
   * Set a printer as default (unset others)
   */
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

  /**
   * Delete a printer (prevents deletion if it's the default)
   */
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

  /**
   * Send a test print to the printer
   */
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

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Get the default printer
   */
  async getDefault(): Promise<Printer | null> {
    try {
      const response = await this.getAll();
      const defaultPrinter = response.data.find(p => p.isDefault);
      return defaultPrinter || null;
    } catch (error) {
      console.error("Error fetching default printer:", error);
      return null;
    }
  }

  /**
   * Refresh printer status (poll for online/offline)
   */
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

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.printer);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const printerAPI = new PrintersAPI();
export default printerAPI;