// src/main/ipc/core/debt/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class DebtHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getDebtById = this.importHandler("./get/by_id.ipc");
    this.getAllDebts = this.importHandler("./get/all.ipc");
    this.getDebtStatistics = this.importHandler("./get/statistics.ipc");
    this.searchDebts = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createDebt = this.importHandler("./create.ipc");
    this.updateDebt = this.importHandler("./update.ipc");
    this.deleteDebt = this.importHandler("./delete.ipc");
    this.restoreDebt = this.importHandler("./restore.ipc");
    this.permanentlyDeleteDebt = this.importHandler("./permanent_delete.ipc");
    this.recalculateRemainingAmount = this.importHandler(
      "./recalculate_remaining.ipc",
    );
    this.correctTotalAmount = this.importHandler("./correct_total_amount.ipc");
    this.applyForgiveness = this.importHandler("./apply_forgiveness.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateDebts = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateDebts = this.importHandler("./bulk_update.ipc");
    this.importDebtsCSV = this.importHandler("./import_csv.ipc");
    this.exportDebts = this.importHandler("./export.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[DebtHandler] Failed to load handler: ${path}`,
        error.message,
      );
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

      logger?.info(`DebtHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getDebtById":
          return await this.getDebtById(params);
        case "getAllDebts":
          return await this.getAllDebts(params);
        case "getDebtStatistics":
          return await this.getDebtStatistics(params);
        case "searchDebts":
          return await this.searchDebts(params);

        // ✏️ WRITE (with transaction)
        case "createDebt":
          return await this.handleWithTransaction(this.createDebt, params);
        case "updateDebt":
          return await this.handleWithTransaction(this.updateDebt, params);
        case "deleteDebt":
          return await this.handleWithTransaction(this.deleteDebt, params);
        case "restoreDebt":
          return await this.handleWithTransaction(this.restoreDebt, params);
        case "permanentlyDeleteDebt":
          return await this.handleWithTransaction(
            this.permanentlyDeleteDebt,
            params,
          );
        case "recalculateRemainingAmount":
          return await this.handleWithTransaction(
            this.recalculateRemainingAmount,
            params,
          );

        // 🔄 BATCH (with transaction)
        case "bulkCreateDebts":
          return await this.handleWithTransaction(this.bulkCreateDebts, params);
        case "bulkUpdateDebts":
          return await this.handleWithTransaction(this.bulkUpdateDebts, params);
        case "importDebtsCSV":
          return await this.handleWithTransaction(this.importDebtsCSV, params);

        case "correctTotalAmount":
          return await this.handleWithTransaction(
            this.correctTotalAmount,
            params,
          );
        case "applyForgiveness":
          return await this.handleWithTransaction(
            this.applyForgiveness,
            params,
          );

        // 📄 EXPORT (read-only)
        case "exportDebts":
          return await this.exportDebts(params);

        default:
          return {
            status: false,
            message: `Unknown debt method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("DebtHandler error:", error);
      logger?.error("DebtHandler error:", error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
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

const debtHandler = new DebtHandler();
ipcMain.handle(
  "debt",
  withErrorHandling(debtHandler.handleRequest.bind(debtHandler), "IPC:debt"),
);

module.exports = { DebtHandler, debtHandler };
