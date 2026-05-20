// src/main/ipc/core/dashboard/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { logger } = require("../../../../utils/logger");

class DashboardHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📊 READ-ONLY ANALYTICS HANDLERS
    this.getRevenue = this.importHandler("./get/revenue.ipc");
    this.getOverview = this.importHandler("./get/overview.ipc");
    this.getTopProducts = this.importHandler("./get/top_products.ipc");
    this.getLowStock = this.importHandler("./get/low_stock.ipc");
    this.getRecentActivities = this.importHandler("./get/recent_activities.ipc");
    this.getDashboardStats = this.importHandler("./get/statistics.ipc");
    this.getSalesTrend = this.importHandler("./get/sales_trend.ipc");
    this.getPaymentMethods = this.importHandler("./get/payment_methods.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[DashboardHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`DashboardHandler: ${method}`, { params });

      switch (method) {
        case "getRevenue":
          return await this.getRevenue(params);
        case "getOverview":
          return await this.getOverview(params);
        case "getTopProducts":
          return await this.getTopProducts(params);
        case "getLowStock":
          return await this.getLowStock(params);
        case "getRecentActivities":
          return await this.getRecentActivities(params);
        case "getDashboardStats":
          return await this.getDashboardStats(params);
        case "getSalesTrend":
          return await this.getSalesTrend(params);
        case "getPaymentMethods":
          return await this.getPaymentMethods(params);
        default:
          return { status: false, message: `Unknown dashboard method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("DashboardHandler error:", error);
      logger?.error("DashboardHandler error:", error);
      return { status: false, message: error.message || "Internal server error", data: null };
    }
  }
}

const dashboardHandler = new DashboardHandler();

ipcMain.handle(
  "dashboard",
  withErrorHandling(dashboardHandler.handleRequest.bind(dashboardHandler), "IPC:dashboard")
);

module.exports = { DashboardHandler, dashboardHandler };