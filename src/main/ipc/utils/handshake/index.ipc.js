
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class HandshakeHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.handshakeToServer = this.importHandler("./handshake.ipc.js");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[handshakeHandler] Failed to load handler: ${path}`,
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

      logger?.info(`handshakeHandler: ${method}`, { params });

      switch (method) {
        case "handshake": // ✅ Changed from "handshakeToServer" to "handshake"
          return await this.handleWithTransaction(
            this.handshakeToServer,
            params,
          );
        default:
          return {
            status: false,
            message: `Unknown handshake method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("handshakeHandler error:", error);
      logger?.error("handshakeHandler error:", error);
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

const handshakeHandler = new HandshakeHandler();
ipcMain.handle(
  "handshake",
  withErrorHandling(
    handshakeHandler.handleRequest.bind(handshakeHandler),
    "IPC:handshake",
  ),
);

module.exports = { handshakeHandler, HandshakeHandler };
