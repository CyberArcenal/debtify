// src/main/ipc/core/borrower/index.ipc.js
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class BorrowerHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getBorrowerById = this.importHandler("./get/by_id.ipc");
    this.getAllBorrowers = this.importHandler("./get/all.ipc");
    this.getBorrowerStatistics = this.importHandler("./get/statistics.ipc");
    this.searchBorrowers = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createBorrower = this.importHandler("./create.ipc");
    this.updateBorrower = this.importHandler("./update.ipc");
    this.deleteBorrower = this.importHandler("./delete.ipc");
    this.restoreBorrower = this.importHandler("./restore.ipc");
    this.permanentlyDeleteBorrower = this.importHandler("./permanent_delete.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateBorrowers = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateBorrowers = this.importHandler("./bulk_update.ipc");
    this.importBorrowersCSV = this.importHandler("./import_csv.ipc");
    this.exportBorrowers = this.importHandler("./export.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[BorrowerHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({ status: false, message: `Handler not implemented: ${path}`, data: null });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`BorrowerHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getBorrowerById":
          return await this.getBorrowerById(params);
        case "getAllBorrowers":
          return await this.getAllBorrowers(params);
        case "getBorrowerStatistics":
          return await this.getBorrowerStatistics(params);
        case "searchBorrowers":
          return await this.searchBorrowers(params);

        // ✏️ WRITE (with transaction)
        case "createBorrower":
          return await this.handleWithTransaction(this.createBorrower, params);
        case "updateBorrower":
          return await this.handleWithTransaction(this.updateBorrower, params);
        case "deleteBorrower":
          return await this.handleWithTransaction(this.deleteBorrower, params);
        case "restoreBorrower":
          return await this.handleWithTransaction(this.restoreBorrower, params);
        case "permanentlyDeleteBorrower":
          return await this.handleWithTransaction(this.permanentlyDeleteBorrower, params);

        // 🔄 BATCH (with transaction)
        case "bulkCreateBorrowers":
          return await this.handleWithTransaction(this.bulkCreateBorrowers, params);
        case "bulkUpdateBorrowers":
          return await this.handleWithTransaction(this.bulkUpdateBorrowers, params);
        case "importBorrowersCSV":
          return await this.handleWithTransaction(this.importBorrowersCSV, params);

        // 📄 EXPORT (read-only)
        case "exportBorrowers":
          return await this.exportBorrowers(params);

        default:
          return { status: false, message: `Unknown borrower method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("BorrowerHandler error:", error);
      logger?.error("BorrowerHandler error:", error);
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

const borrowerHandler = new BorrowerHandler();
ipcMain.handle(
  "borrower",
  withErrorHandling(borrowerHandler.handleRequest.bind(borrowerHandler), "IPC:borrower")
);

module.exports = { BorrowerHandler, borrowerHandler };