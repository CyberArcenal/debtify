// src/main/ipc/core/creditCheck/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class CreditCheckHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // READ-ONLY
    this.getCreditCheckHistory = this.importHandler("./get/history.ipc");

    // WRITE (with transaction)
    this.performCreditCheck = this.importHandler("./perform.ipc");
    this.deleteCreditCheckLog = this.importHandler("./delete_log.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[CreditCheckHandler] Failed to load handler: ${path}`,
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
      logger?.info(`CreditCheckHandler: ${method}`, { params });

      switch (method) {
        case "getCreditCheckHistory":
          return await this.getCreditCheckHistory(params);
        case "performCreditCheck":
          return await this.handleWithTransaction(
            this.performCreditCheck,
            params,
          );
        case "deleteCreditCheckLog":
          return await this.handleWithTransaction(
            this.deleteCreditCheckLog,
            params,
          );
        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("CreditCheckHandler error:", error);
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

const creditCheckHandler = new CreditCheckHandler();
ipcMain.handle(
  "creditCheck",
  withErrorHandling(
    creditCheckHandler.handleRequest.bind(creditCheckHandler),
    "IPC:creditCheck",
  ),
);

module.exports = { CreditCheckHandler, creditCheckHandler };
