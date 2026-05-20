// src/main/ipc/core/audit/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");

class AuditHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllAuditLogs = this.importHandler("./get/all.ipc");
    this.getAuditLogById = this.importHandler("./get/by_id.ipc");
    this.getAuditLogsByEntity = this.importHandler("./get/by_entity.ipc");
    this.getAuditLogsByUser = this.importHandler("./get/by_user.ipc");
    this.getAuditLogsByAction = this.importHandler("./get/by_action.ipc");
    this.getAuditLogsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getAuditLogSummary = this.importHandler("./get/summary.ipc");
    this.getAuditLogStats = this.importHandler("./get/stats.ipc");
    this.searchAuditLogs = this.importHandler("./search.ipc");

    // 📊 AGGREGATION HANDLERS
    this.getAuditLogCounts = this.importHandler("./get_counts.ipc");
    this.getTopActivities = this.importHandler("./get_top_activities.ipc");
    this.getRecentActivity = this.importHandler("./get/recent.ipc");

    // 📈 REPORT HANDLERS
    this.exportAuditLogs = this.importHandler("./export_csv.ipc");
    this.generateAuditReport = this.importHandler("./generate_report.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[AuditHandler] Failed to load handler: ${path}`,
        error.message
      );
      // Return a fallback handler
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      // Enriched params (e.g., add user from session if needed)
      const enrichedParams = { ...params };

      if (logger) {
        logger.info(`AuditHandler: ${method}`, {
          params: this.sanitizeParams(params),
        });
      }

      switch (method) {
        // 📋 BASIC READ OPERATIONS
        case "getAllAuditLogs":
          return await this.getAllAuditLogs(enrichedParams);
        case "getAuditLogById":
          return await this.getAuditLogById(enrichedParams);
        case "getAuditLogsByEntity":
          return await this.getAuditLogsByEntity(enrichedParams);
        case "getAuditLogsByUser":
          return await this.getAuditLogsByUser(enrichedParams);
        case "getAuditLogsByAction":
          return await this.getAuditLogsByAction(enrichedParams);
        case "getAuditLogsByDateRange":
          return await this.getAuditLogsByDateRange(enrichedParams);
        case "getAuditLogSummary":
          return await this.getAuditLogSummary(enrichedParams);
        case "getAuditLogStats":
          return await this.getAuditLogStats(enrichedParams);
        case "searchAuditLogs":
          return await this.searchAuditLogs(enrichedParams);

        // 📊 AGGREGATION OPERATIONS
        case "getAuditLogCounts":
          return await this.getAuditLogCounts(enrichedParams);
        case "getTopActivities":
          return await this.getTopActivities(enrichedParams);
        case "getRecentActivity":
          return await this.getRecentActivity(enrichedParams);

        // 📈 REPORT OPERATIONS
        case "exportAuditLogs":
          return await this.exportAuditLogs(enrichedParams);
        case "generateAuditReport":
          return await this.generateAuditReport(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown audit log method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("AuditHandler error:", error);
      if (logger) {
        logger.error("AuditHandler error:", error);
      }
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Sanitize parameters for audit log queries (avoid logging sensitive search terms)
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    if (sanitized.searchTerm) sanitized.searchTerm = "[REDACTED]";
    if (sanitized.user) sanitized.user = "[REDACTED]";
    return sanitized;
  }
}

// Register IPC handler
const auditHandler = new AuditHandler();

ipcMain.handle(
  "auditLog",
  withErrorHandling(auditHandler.handleRequest.bind(auditHandler), "IPC:auditLog")
);

module.exports = { AuditHandler, auditHandler };