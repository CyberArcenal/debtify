// src/main/ipc/core/reminder/index.ipc.js
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class ReminderLogHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS (reminder-specific names)
    this.getAllReminders = this.importHandler("./get/all.ipc");
    this.getReminderById = this.importHandler("./get/by_id.ipc");
    this.getRemindersByRecipient = this.importHandler("./get/by_recipient.ipc");
    this.searchReminders = this.importHandler("./search.ipc");
    this.getReminderStats = this.importHandler("./get/stats.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createReminder = this.importHandler("./create.ipc");
    this.updateReminderStatus = this.importHandler("./update_status.ipc");
    this.deleteReminder = this.importHandler("./delete.ipc");
    this.retryReminder = this.importHandler("./retry.ipc");
    this.retryAllFailedReminders = this.importHandler("./retry_all.ipc");
    this.resendReminder = this.importHandler("./resend.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[ReminderLogHandler] Failed to load handler: ${path}`,
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

      logger?.info(`ReminderLogHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAllReminders":
          return await this.getAllReminders(params);
        case "getReminderById":
          return await this.getReminderById(params);
        case "getRemindersByRecipient":
          return await this.getRemindersByRecipient(params);
        case "searchReminders":
          return await this.searchReminders(params);
        case "getReminderStats":
          return await this.getReminderStats(params);

        // ✏️ WRITE (with transaction)
        case "createReminder":
          return await this.handleWithTransaction(this.createReminder, params);
        case "updateReminderStatus":
          return await this.handleWithTransaction(this.updateReminderStatus, params);
        case "deleteReminder":
          return await this.handleWithTransaction(this.deleteReminder, params);
        case "retryReminder":
          return await this.handleWithTransaction(this.retryReminder, params);
        case "retryAllFailedReminders":
          return await this.handleWithTransaction(this.retryAllFailedReminders, params);
        case "resendReminder":
          return await this.handleWithTransaction(this.resendReminder, params);

        // ⚠️ Legacy method names for backward compatibility (optional)
        case "getAllNotifications":
        case "getNotificationById":
        case "getNotificationsByRecipient":
        case "searchNotifications":
        case "getNotificationStats":
        case "createLog":
        case "updateNotificationStatus":
        case "deleteNotification":
        case "retryFailedNotification":
        case "retryAllFailed":
        case "resendNotification":
          console.warn(`⚠️ Using legacy method name: ${method}. Please update frontend to use reminder-specific names.`);
          // Map to new methods
          return await this._handleLegacy(method, params);

        default:
          return {
            status: false,
            message: `Unknown reminder log method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("ReminderLogHandler error:", error);
      logger?.error("ReminderLogHandler error:", error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  async _handleLegacy(method, params) {
    // Map legacy method names to new ones
    const mapping = {
      getAllNotifications: () => this.getAllReminders(params),
      getNotificationById: () => this.getReminderById(params),
      getNotificationsByRecipient: () => this.getRemindersByRecipient(params),
      searchNotifications: () => this.searchReminders(params),
      getNotificationStats: () => this.getReminderStats(params),
      createLog: () => this.handleWithTransaction(this.createReminder, params),
      updateNotificationStatus: () => this.handleWithTransaction(this.updateReminderStatus, params),
      deleteNotification: () => this.handleWithTransaction(this.deleteReminder, params),
      retryFailedNotification: () => this.handleWithTransaction(this.retryReminder, params),
      retryAllFailed: () => this.handleWithTransaction(this.retryAllFailedReminders, params),
      resendNotification: () => this.handleWithTransaction(this.resendReminder, params),
    };
    const handler = mapping[method];
    if (handler) return await handler();
    return { status: false, message: `Unsupported legacy method: ${method}`, data: null };
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

const reminderHandler = new ReminderLogHandler();
ipcMain.handle(
  "reminderLog",
  withErrorHandling(reminderHandler.handleRequest.bind(reminderHandler), "IPC:reminderLog")
);

module.exports = { ReminderLogHandler, reminderHandler };