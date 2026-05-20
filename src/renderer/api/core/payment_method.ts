// src/renderer/api/core/paymentMethod.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
  icon: string;           // lucide icon name (e.g., "DollarSign", "Landmark")
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodStats {
  methodId: number;
  transactionCount: number;
  totalAmount: number;
}

export interface PaymentMethodCreateData {
  name: string;
  description?: string | null;
  icon?: string;          // default "CreditCard"
  isDefault?: boolean;    // if true, unset other defaults
}

export interface PaymentMethodUpdateData {
  name?: string;
  description?: string | null;
  icon?: string;
  isDefault?: boolean;    // if true, unset other defaults
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PaymentMethodResponse {
  status: boolean;
  message: string;
  data: PaymentMethod;
}

export interface PaymentMethodsResponse {
  status: boolean;
  message: string;
  data: PaymentMethod[];
}

export interface PaymentMethodStatsResponse {
  status: boolean;
  message: string;
  data: PaymentMethodStats;
}

export interface DeleteResponse {
  status: boolean;
  message: string;
}

// ----------------------------------------------------------------------
// 🧠 PaymentMethodsAPI Class
// ----------------------------------------------------------------------

class PaymentMethodsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all payment methods
   */
  async getAll(): Promise<PaymentMethodsResponse> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    const response = await window.backendAPI.paymentMethod({
      method: "getAllPaymentMethods",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch payment methods");
  }

  /**
   * Get a single payment method by ID
   */
  async getById(id: number): Promise<PaymentMethodResponse> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    const response = await window.backendAPI.paymentMethod({
      method: "getPaymentMethodById",
      params: { id },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch payment method");
  }

  /**
   * Get usage statistics for a payment method
   */
  async getStats(methodId: number): Promise<PaymentMethodStatsResponse> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    const response = await window.backendAPI.paymentMethod({
      method: "getPaymentMethodStats",
      params: { methodId },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch payment method stats");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Create a new payment method
   * @param data – payment method data
   * @param user – user performing the action
   */
  async create(data: PaymentMethodCreateData, user = "system"): Promise<PaymentMethodResponse> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    const response = await window.backendAPI.paymentMethod({
      method: "createPaymentMethod",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create payment method");
  }

  /**
   * Update an existing payment method
   */
  async update(id: number, data: PaymentMethodUpdateData, user = "system"): Promise<PaymentMethodResponse> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    const response = await window.backendAPI.paymentMethod({
      method: "updatePaymentMethod",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update payment method");
  }

  /**
   * Set a payment method as default (unset all others)
   */
  async setDefault(id: number, user = "system"): Promise<PaymentMethodResponse> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    const response = await window.backendAPI.paymentMethod({
      method: "setDefaultPaymentMethod",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to set default payment method");
  }

  /**
   * Delete a payment method (prevents deletion if it's the default)
   */
  async delete(id: number, user = "system"): Promise<DeleteResponse> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    const response = await window.backendAPI.paymentMethod({
      method: "deletePaymentMethod",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete payment method");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Get the default payment method
   */
  async getDefault(): Promise<PaymentMethod | null> {
    try {
      const response = await this.getAll();
      const defaultMethod = response.data.find(m => m.isDefault);
      return defaultMethod || null;
    } catch (error) {
      console.error("Error fetching default payment method:", error);
      return null;
    }
  }

  /**
   * Increment stats when a payment is recorded using this method
   * This is typically called by the backend automatically, but provided here for manual use if needed
   */
  async incrementStats(methodId: number, amount: number): Promise<void> {
    if (!window.backendAPI?.paymentMethod) {
      throw new Error("Electron API (paymentMethod) not available");
    }
    await window.backendAPI.paymentMethod({
      method: "incrementPaymentMethodStats",
      params: { methodId, amount },
    });
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.paymentMethod);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const paymentMethodsAPI = new PaymentMethodsAPI();
export default paymentMethodsAPI;