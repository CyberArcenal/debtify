// src/renderer/api/dashboard.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface RevenueData {
  totalRevenue: number;
  transactionCount: number;
  period: string; // 'today', 'week', 'month', 'year', or custom
}

export interface OverviewData {
  todayRevenue: number;
  totalCustomers: number;
  activeDebts: number;
  overdueDebts: number;
}

export interface TopProduct {
  name: string;
  totalValue: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  dueDate: string; // ISO date string
}

export interface RecentActivity {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  user: string;
  timestamp: string;
  details?: string;
}

export interface DashboardStats {
  totalRemainingBalance: number;
  totalBorrowers: number;
  totalDebts: number;
  totalPaidDebts: number;
  totalOverdue: number;
  totalPaymentsCollected: number;
  totalPenaltiesCollected: number;
}

export interface SalesTrendPoint {
  date: string; // YYYY-MM-DD
  total: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  total: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface RevenueResponse {
  status: boolean;
  message: string;
  data: RevenueData;
}

export interface OverviewResponse {
  status: boolean;
  message: string;
  data: OverviewData;
}

export interface TopProductsResponse {
  status: boolean;
  message: string;
  data: TopProduct[];
}

export interface LowStockResponse {
  status: boolean;
  message: string;
  data: LowStockItem[];
}

export interface RecentActivitiesResponse {
  status: boolean;
  message: string;
  data: RecentActivity[];
}

export interface DashboardStatsResponse {
  status: boolean;
  message: string;
  data: DashboardStats;
}

export interface SalesTrendResponse {
  status: boolean;
  message: string;
  data: SalesTrendPoint[];
}

export interface PaymentMethodsResponse {
  status: boolean;
  message: string;
  data: PaymentMethodBreakdown[];
}

// ----------------------------------------------------------------------
// 🧠 DashboardAPI Class
// ----------------------------------------------------------------------

class DashboardAPI {
  /**
   * Get revenue data for a given period
   * @param period - 'today', 'week', 'month', 'year'
   * @param startDate - optional custom start date (ISO string)
   * @param endDate - optional custom end date (ISO string)
   */
  async getRevenue(
    period: string = "month",
    startDate?: string,
    endDate?: string
  ): Promise<RevenueResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getRevenue",
      params: { period, startDate, endDate },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch revenue data");
  }

  /**
   * Get dashboard overview (today's revenue, customer counts, etc.)
   */
  async getOverview(): Promise<OverviewResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getOverview",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch overview data");
  }

  /**
   * Get top products (by total value)
   * @param limit - number of top products to return (default 5)
   */
  async getTopProducts(limit: number = 5): Promise<TopProductsResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getTopProducts",
      params: { limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch top products");
  }

  /**
   * Get low stock items (or debts due soon)
   * @param threshold - threshold for low stock (default 5)
   */
  async getLowStock(threshold: number = 5): Promise<LowStockResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getLowStock",
      params: { threshold },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch low stock items");
  }

  /**
   * Get recent activities (e.g., latest payments, new borrowers)
   * @param limit - number of activities (default 10)
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivitiesResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getRecentActivities",
      params: { limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch recent activities");
  }

  /**
   * Get dashboard statistics (totals of borrowers, debts, payments, penalties)
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getDashboardStats",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch dashboard statistics");
  }

  /**
   * Get sales trend over a number of days
   * @param days - number of past days to include (default 7)
   */
  async getSalesTrend(days: number = 7): Promise<SalesTrendResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getSalesTrend",
      params: { days },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch sales trend");
  }

  /**
   * Get payment methods breakdown
   */
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    if (!window.backendAPI?.dashboard) {
      throw new Error("Electron API (dashboard) not available");
    }
    const response = await window.backendAPI.dashboard({
      method: "getPaymentMethods",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch payment methods");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the dashboard API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.dashboard);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const dashboardAPI = new DashboardAPI();
export default dashboardAPI;