// src/main/ipc/utils/printer/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class PrinterHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // READ-ONLY
    this.getAllPrinters = this.importHandler("./get/all.ipc");
    this.getPrinterById = this.importHandler("./get/by_id.ipc");

    // WRITE
    this.createPrinter = this.importHandler("./create.ipc");
    this.updatePrinter = this.importHandler("./update.ipc");
    this.setDefaultPrinter = this.importHandler("./set_default.ipc");
    this.deletePrinter = this.importHandler("./delete.ipc");
    this.testPrinter = this.importHandler("./test.ipc");
    this.refreshPrinterStatus = this.importHandler("./refresh_status.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[PrinterHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({ status: false, message: `Handler not implemented: ${path}`, data: null });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      logger?.info(`PrinterHandler: ${method}`, { params });

      switch (method) {
        case "getAllPrinters":
          return await this.getAllPrinters(params);
        case "getPrinterById":
          return await this.getPrinterById(params);
        case "createPrinter":
          return await this.handleWithTransaction(this.createPrinter, params);
        case "updatePrinter":
          return await this.handleWithTransaction(this.updatePrinter, params);
        case "setDefaultPrinter":
          return await this.handleWithTransaction(this.setDefaultPrinter, params);
        case "deletePrinter":
          return await this.handleWithTransaction(this.deletePrinter, params);
        case "testPrinter":
          return await this.handleWithTransaction(this.testPrinter, params);
        case "refreshPrinterStatus":
          return await this.handleWithTransaction(this.refreshPrinterStatus, params);
        default:
          return { status: false, message: `Unknown method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("PrinterHandler error:", error);
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

const printerHandler = new PrinterHandler();
ipcMain.handle(
  "printer",
  withErrorHandling(printerHandler.handleRequest.bind(printerHandler), "IPC:printer"),
);

module.exports = { PrinterHandler, printerHandler };