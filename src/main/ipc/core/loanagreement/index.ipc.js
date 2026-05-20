// src/main/ipc/core/loanagreement/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class LoanAgreementHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAgreementById = this.importHandler("./get/by_id.ipc");
    this.getAllAgreements = this.importHandler("./get/all.ipc");
    this.getAgreementStatistics = this.importHandler("./get/statistics.ipc");
    this.searchAgreements = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createAgreement = this.importHandler("./create.ipc");
    this.updateAgreement = this.importHandler("./update.ipc");
    this.deleteAgreement = this.importHandler("./delete.ipc");
    this.restoreAgreement = this.importHandler("./restore.ipc");
    this.permanentlyDeleteAgreement = this.importHandler("./permanent_delete.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateAgreements = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateAgreements = this.importHandler("./bulk_update.ipc");
    this.importAgreementsCSV = this.importHandler("./import_csv.ipc");
    this.exportAgreements = this.importHandler("./export.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[LoanAgreementHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({ status: false, message: `Handler not implemented: ${path}`, data: null });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`LoanAgreementHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAgreementById":
          return await this.getAgreementById(params);
        case "getAllAgreements":
          return await this.getAllAgreements(params);
        case "getAgreementStatistics":
          return await this.getAgreementStatistics(params);
        case "searchAgreements":
          return await this.searchAgreements(params);

        // ✏️ WRITE (with transaction)
        case "createAgreement":
          return await this.handleWithTransaction(this.createAgreement, params);
        case "updateAgreement":
          return await this.handleWithTransaction(this.updateAgreement, params);
        case "deleteAgreement":
          return await this.handleWithTransaction(this.deleteAgreement, params);
        case "restoreAgreement":
          return await this.handleWithTransaction(this.restoreAgreement, params);
        case "permanentlyDeleteAgreement":
          return await this.handleWithTransaction(this.permanentlyDeleteAgreement, params);

        // 🔄 BATCH (with transaction)
        case "bulkCreateAgreements":
          return await this.handleWithTransaction(this.bulkCreateAgreements, params);
        case "bulkUpdateAgreements":
          return await this.handleWithTransaction(this.bulkUpdateAgreements, params);
        case "importAgreementsCSV":
          return await this.handleWithTransaction(this.importAgreementsCSV, params);

        // 📄 EXPORT (read-only)
        case "exportAgreements":
          return await this.exportAgreements(params);

        default:
          return { status: false, message: `Unknown loan agreement method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("LoanAgreementHandler error:", error);
      logger?.error("LoanAgreementHandler error:", error);
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

const loanAgreementHandler = new LoanAgreementHandler();
ipcMain.handle(
  "loanAgreement",
  withErrorHandling(loanAgreementHandler.handleRequest.bind(loanAgreementHandler), "IPC:loanAgreement")
);

module.exports = { LoanAgreementHandler, loanAgreementHandler };