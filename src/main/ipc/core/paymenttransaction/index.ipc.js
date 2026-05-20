// src/main/ipc/core/paymenttransaction/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class PaymentTransactionHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getPaymentById = this.importHandler("./get/by_id.ipc");
    this.getAllPayments = this.importHandler("./get/all.ipc");
    this.getPaymentStatistics = this.importHandler("./get/statistics.ipc");
    this.searchPayments = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createPayment = this.importHandler("./create.ipc");
    this.updatePayment = this.importHandler("./update.ipc");
    this.deletePayment = this.importHandler("./delete.ipc");
    this.restorePayment = this.importHandler("./restore.ipc");
    this.permanentlyDeletePayment = this.importHandler("./permanent_delete.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreatePayments = this.importHandler("./bulk_create.ipc");
    this.bulkUpdatePayments = this.importHandler("./bulk_update.ipc");
    this.importPaymentsCSV = this.importHandler("./import_csv.ipc");
    this.exportPayments = this.importHandler("./export.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[PaymentTransactionHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({ status: false, message: `Handler not implemented: ${path}`, data: null });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`PaymentTransactionHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getPaymentById":
          return await this.getPaymentById(params);
        case "getAllPayments":
          return await this.getAllPayments(params);
        case "getPaymentStatistics":
          return await this.getPaymentStatistics(params);
        case "searchPayments":
          return await this.searchPayments(params);

        // ✏️ WRITE (with transaction)
        case "createPayment":
          return await this.handleWithTransaction(this.createPayment, params);
        case "updatePayment":
          return await this.handleWithTransaction(this.updatePayment, params);
        case "deletePayment":
          return await this.handleWithTransaction(this.deletePayment, params);
        case "restorePayment":
          return await this.handleWithTransaction(this.restorePayment, params);
        case "permanentlyDeletePayment":
          return await this.handleWithTransaction(this.permanentlyDeletePayment, params);

        // 🔄 BATCH (with transaction)
        case "bulkCreatePayments":
          return await this.handleWithTransaction(this.bulkCreatePayments, params);
        case "bulkUpdatePayments":
          return await this.handleWithTransaction(this.bulkUpdatePayments, params);
        case "importPaymentsCSV":
          return await this.handleWithTransaction(this.importPaymentsCSV, params);

        // 📄 EXPORT (read-only)
        case "exportPayments":
          return await this.exportPayments(params);

        default:
          return { status: false, message: `Unknown payment method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("PaymentTransactionHandler error:", error);
      logger?.error("PaymentTransactionHandler error:", error);
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

const paymentTransactionHandler = new PaymentTransactionHandler();
ipcMain.handle(
  "paymentTransaction",
  withErrorHandling(paymentTransactionHandler.handleRequest.bind(paymentTransactionHandler), "IPC:paymentTransaction")
);

module.exports = { PaymentTransactionHandler, paymentTransactionHandler };