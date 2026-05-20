// src/main/ipc/core/interestRateChangeLog/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class InterestRateChangeLogHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // READ-ONLY (no transaction needed)
    this.getAllLogs = this.importHandler("./get/all.ipc");
    this.getLogById = this.importHandler("./get/by_id.ipc");
    this.getLogsForLoan = this.importHandler("./get/by_loan.ipc");

    // WRITE (with transaction)
    this.createLog = this.importHandler("./create.ipc");
    this.deleteLog = this.importHandler("./delete.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[InterestRateChangeLogHandler] Failed to load handler: ${path}`, error.message);
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
      const userId = payload.userId || "system";

      logger?.info(`InterestRateChangeLogHandler: ${method}`, params);

      switch (method) {
        case "getAllLogs":
          return await this.getAllLogs(params);
        case "getLogById":
          return await this.getLogById(params);
        case "getLogsForLoan":
          return await this.getLogsForLoan(params);
        case "createLog":
          return await this.handleWithTransaction(this.createLog, { ...params, userId });
        case "deleteLog":
          return await this.handleWithTransaction(this.deleteLog, { ...params, userId });
        default:
          return { status: false, message: `Unknown method: ${method}`, data: null };
      }
    } catch (error) {
      logger?.error("InterestRateChangeLogHandler error:", error);
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

const handler = new InterestRateChangeLogHandler();
ipcMain.handle(
  "interestRateChangeLog",
  withErrorHandling(handler.handleRequest.bind(handler), "IPC:interestRateChangeLog")
);

module.exports = { InterestRateChangeLogHandler, handler };