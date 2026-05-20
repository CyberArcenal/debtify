// src/main/ipc/core/notification/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class NotificationHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getNotificationById = this.importHandler("./get/by_id.ipc");
    this.getAllNotifications = this.importHandler("./get/all.ipc");
    this.getNotificationStatistics = this.importHandler("./get/statistics.ipc");
    this.getUnreadCount = this.importHandler("./get/unread_count.ipc");
    this.searchNotifications = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createNotification = this.importHandler("./create.ipc");
    this.updateNotification = this.importHandler("./update.ipc");
    this.deleteNotification = this.importHandler("./delete.ipc");
    this.restoreNotification = this.importHandler("./restore.ipc");
    this.permanentlyDeleteNotification = this.importHandler("./permanent_delete.ipc");
    this.markAsRead = this.importHandler("./mark_read.ipc");
    this.markAsUnread = this.importHandler("./mark_unread.ipc");
    this.markManyAsRead = this.importHandler("./mark_many_read.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateNotifications = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateNotifications = this.importHandler("./bulk_update.ipc");
    this.importNotificationsCSV = this.importHandler("./import_csv.ipc");
    this.exportNotifications = this.importHandler("./export.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[NotificationHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({ status: false, message: `Handler not implemented: ${path}`, data: null });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`NotificationHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getNotificationById":
          return await this.getNotificationById(params);
        case "getAllNotifications":
          return await this.getAllNotifications(params);
        case "getNotificationStatistics":
          return await this.getNotificationStatistics(params);
        case "getUnreadCount":
          return await this.getUnreadCount(params);
        case "searchNotifications":
          return await this.searchNotifications(params);

        // ✏️ WRITE (with transaction)
        case "createNotification":
          return await this.handleWithTransaction(this.createNotification, params);
        case "updateNotification":
          return await this.handleWithTransaction(this.updateNotification, params);
        case "deleteNotification":
          return await this.handleWithTransaction(this.deleteNotification, params);
        case "restoreNotification":
          return await this.handleWithTransaction(this.restoreNotification, params);
        case "permanentlyDeleteNotification":
          return await this.handleWithTransaction(this.permanentlyDeleteNotification, params);
        case "markAsRead":
          return await this.handleWithTransaction(this.markAsRead, params);
        case "markAsUnread":
          return await this.handleWithTransaction(this.markAsUnread, params);
        case "markManyAsRead":
          return await this.handleWithTransaction(this.markManyAsRead, params);

        // 🔄 BATCH (with transaction)
        case "bulkCreateNotifications":
          return await this.handleWithTransaction(this.bulkCreateNotifications, params);
        case "bulkUpdateNotifications":
          return await this.handleWithTransaction(this.bulkUpdateNotifications, params);
        case "importNotificationsCSV":
          return await this.handleWithTransaction(this.importNotificationsCSV, params);

        // 📄 EXPORT (read-only)
        case "exportNotifications":
          return await this.exportNotifications(params);

        default:
          return { status: false, message: `Unknown notification method: ${method}`, data: null };
      }
    } catch (error) {
      console.error("NotificationHandler error:", error);
      logger?.error("NotificationHandler error:", error);
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

const notificationHandler = new NotificationHandler();
ipcMain.handle(
  "notification",
  withErrorHandling(notificationHandler.handleRequest.bind(notificationHandler), "IPC:notification")
);

module.exports = { NotificationHandler, notificationHandler };