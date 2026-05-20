// src/main/ipc/core/loanApplication/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class LoanApplicationHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY
    this.getAllApplications = this.importHandler("./get/all.ipc");
    this.getApplicationById = this.importHandler("./get/by_id.ipc");

    // ✏️ WRITE (with transaction)
    this.createApplication = this.importHandler("./create.ipc");
    this.updateApplication = this.importHandler("./update.ipc");
    this.approveApplication = this.importHandler("./approve.ipc");
    this.rejectApplication = this.importHandler("./reject.ipc");
    this.deleteApplication = this.importHandler("./delete.ipc");
    this.restoreApplication = this.importHandler("./restore.ipc");
    this.permanentlyDeleteApplication = this.importHandler("./permanent_delete.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[LoanApplicationHandler] Failed to load handler: ${path}`, error.message);
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

      logger?.info(`LoanApplicationHandler: ${method}`, { params });

      switch (method) {
        case "getAllApplications":
          return await this.getAllApplications(params);
        case "getApplicationById":
          return await this.getApplicationById(params);
        case "createApplication":
          return await this.handleWithTransaction(this.createApplication, params);
        case "updateApplication":
          return await this.handleWithTransaction(this.updateApplication, params);
        case "approveApplication":
          return await this.handleWithTransaction(this.approveApplication, params);
        case "rejectApplication":
          return await this.handleWithTransaction(this.rejectApplication, params);
        case "deleteApplication":
          return await this.handleWithTransaction(this.deleteApplication, params);
        case "restoreApplication":
          return await this.handleWithTransaction(this.restoreApplication, params);
        case "permanentlyDeleteApplication":
          return await this.handleWithTransaction(this.permanentlyDeleteApplication, params);
        default:
          return { status: false, message: `Unknown method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("LoanApplicationHandler error:", error);
      logger?.error("LoanApplicationHandler error:", error);
      return { status: false, message: error.message || "Internal server error", data: null };
    }
  }

  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await handler(params, queryRunner);
      if (result.status) await queryRunner.commitTransaction();
      else await queryRunner.rollbackTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

const loanApplicationHandler = new LoanApplicationHandler();
ipcMain.handle(
  "loanApplication",
  withErrorHandling(loanApplicationHandler.handleRequest.bind(loanApplicationHandler), "IPC:loanApplication"),
);

module.exports = { LoanApplicationHandler, loanApplicationHandler };