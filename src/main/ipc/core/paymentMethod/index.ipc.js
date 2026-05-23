// src/main/ipc/core/paymentMethod/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class PaymentMethodHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // READ-ONLY
    this.getAllPaymentMethods = this.importHandler("./get/all.ipc");
    this.getPaymentMethodById = this.importHandler("./get/by_id.ipc");
    this.getPaymentMethodStats = this.importHandler("./get/stats.ipc");
    this.getDefaultPaymentMethod = this.importHandler("./get/default.ipc");

    // WRITE
    this.createPaymentMethod = this.importHandler("./create.ipc");
    this.updatePaymentMethod = this.importHandler("./update.ipc");
    this.setDefaultPaymentMethod = this.importHandler("./set_default.ipc");
    this.deletePaymentMethod = this.importHandler("./delete.ipc");
    this.incrementPaymentMethodStats = this.importHandler(
      "./increment_stats.ipc",
    );
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[PaymentMethodHandler] Failed to load handler: ${path}`,
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
      logger?.info(`PaymentMethodHandler: ${method}`, { params });

      switch (method) {
        case "getAllPaymentMethods":
          return await this.getAllPaymentMethods(params);
        case "getPaymentMethodById":
          return await this.getPaymentMethodById(params);
        case "getPaymentMethodStats":
          return await this.getPaymentMethodStats(params);
        case "getDefaultPaymentMethod":
          return await this.getDefaultPaymentMethod(params);
        case "createPaymentMethod":
          return await this.handleWithTransaction(
            this.createPaymentMethod,
            params,
          );
        case "updatePaymentMethod":
          return await this.handleWithTransaction(
            this.updatePaymentMethod,
            params,
          );
        case "setDefaultPaymentMethod":
          return await this.handleWithTransaction(
            this.setDefaultPaymentMethod,
            params,
          );
        case "deletePaymentMethod":
          return await this.handleWithTransaction(
            this.deletePaymentMethod,
            params,
          );
        case "incrementPaymentMethodStats":
          return await this.handleWithTransaction(
            this.incrementPaymentMethodStats,
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
      console.error("PaymentMethodHandler error:", error);
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

const paymentMethodHandler = new PaymentMethodHandler();
ipcMain.handle(
  "paymentMethod",
  withErrorHandling(
    paymentMethodHandler.handleRequest.bind(paymentMethodHandler),
    "IPC:paymentMethod",
  ),
);

module.exports = { PaymentMethodHandler, paymentMethodHandler };
