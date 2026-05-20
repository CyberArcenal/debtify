// src/main/ipc/core/penaltytransaction/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class PenaltyTransactionHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getPenaltyById = this.importHandler("./get/by_id.ipc");
    this.getAllPenalties = this.importHandler("./get/all.ipc");
    this.getPenaltyStatistics = this.importHandler("./get/statistics.ipc");
    this.getTotalPenaltyForDebt = this.importHandler("./get/total_by_debt.ipc");
    this.searchPenalties = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createPenalty = this.importHandler("./create.ipc");
    this.updatePenalty = this.importHandler("./update.ipc");
    this.deletePenalty = this.importHandler("./delete.ipc");
    this.restorePenalty = this.importHandler("./restore.ipc");
    this.permanentlyDeletePenalty = this.importHandler("./permanent_delete.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreatePenalties = this.importHandler("./bulk_create.ipc");
    this.bulkUpdatePenalties = this.importHandler("./bulk_update.ipc");
    this.importPenaltiesCSV = this.importHandler("./import_csv.ipc");
    this.exportPenalties = this.importHandler("./export.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[PenaltyTransactionHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({ status: false, message: `Handler not implemented: ${path}`, data: null });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`PenaltyTransactionHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getPenaltyById":
          return await this.getPenaltyById(params);
        case "getAllPenalties":
          return await this.getAllPenalties(params);
        case "getPenaltyStatistics":
          return await this.getPenaltyStatistics(params);
        case "getTotalPenaltyForDebt":
          return await this.getTotalPenaltyForDebt(params);
        case "searchPenalties":
          return await this.searchPenalties(params);

        // ✏️ WRITE (with transaction)
        case "createPenalty":
          return await this.handleWithTransaction(this.createPenalty, params);
        case "updatePenalty":
          return await this.handleWithTransaction(this.updatePenalty, params);
        case "deletePenalty":
          return await this.handleWithTransaction(this.deletePenalty, params);
        case "restorePenalty":
          return await this.handleWithTransaction(this.restorePenalty, params);
        case "permanentlyDeletePenalty":
          return await this.handleWithTransaction(this.permanentlyDeletePenalty, params);

        // 🔄 BATCH (with transaction)
        case "bulkCreatePenalties":
          return await this.handleWithTransaction(this.bulkCreatePenalties, params);
        case "bulkUpdatePenalties":
          return await this.handleWithTransaction(this.bulkUpdatePenalties, params);
        case "importPenaltiesCSV":
          return await this.handleWithTransaction(this.importPenaltiesCSV, params);

        // 📄 EXPORT (read-only)
        case "exportPenalties":
          return await this.exportPenalties(params);

        default:
          return { status: false, message: `Unknown penalty method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("PenaltyTransactionHandler error:", error);
      logger?.error("PenaltyTransactionHandler error:", error);
      return { status: false, message: error.message || "Internal server error", data: null };
    }
  }

  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);
      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

const penaltyTransactionHandler = new PenaltyTransactionHandler();
ipcMain.handle(
  "penaltyTransaction",
  withErrorHandling(penaltyTransactionHandler.handleRequest.bind(penaltyTransactionHandler), "IPC:penaltyTransaction")
);

module.exports = { PenaltyTransactionHandler, penaltyTransactionHandler };