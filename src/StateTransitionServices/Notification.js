// src/services/NotificationStateTransitionService.js
const Notification = require("../entities/Notification");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const { BrowserWindow } = require("electron");

class NotificationStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.notificationRepo = dataSource.getRepository(Notification);
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner|null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository}
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    return this.dataSource.getRepository(entityClass);
  }

  /**
   * Send event to all renderer windows
   * @param {string} channel
   * @param {any} data
   */
  _sendToRenderers(channel, data) {
    try {
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, data);
        }
      });
    } catch (error) {
      // If running outside Electron (e.g., tests), ignore
      logger.warn(
        "Failed to send IPC event (maybe not in Electron):",
        error.message,
      );
    }
  }

  /**
   * Called after a notification is created
   * @param {Object} notification
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onCreate(notification, user = "system", queryRunner = null) {
    logger.info(
      `[Transition] Notification created #${notification.id} - ${notification.title} by ${user}`,
    );

    // Broadcast to UI for toast popup
    this._sendToRenderers("notification:created", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    // Optional: audit log creation (already logged by NotificationService, but could also log here)
    // await auditLogger.logCreate("Notification", notification.id, notification, user);

    return notification;
  }

  /**
   * Mark a notification as read (in‑app)
   * @param {Object} notification
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onRead(notification, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Marking notification #${notification.id} as read by ${user}`,
    );

    const repo = this._getRepo(queryRunner, Notification);
    const oldIsRead = notification.isRead;

    notification.isRead = true;
    notification.updatedAt = new Date();

    // Use updateDb instead of repo.save
    const saved = await updateDb(repo, notification, {
      queryRunner: queryRunner,
    });

    await auditLogger.logUpdate(
      "Notification",
      notification.id,
      { isRead: oldIsRead },
      { isRead: true },
      user,
    );

    return saved;
  }

  /**
   * Dismiss a notification without reading (e.g., swipe away)
   * @param {Object} notification
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onDismiss(notification, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Dismissing notification #${notification.id} by ${user}`,
    );

    const repo = this._getRepo(queryRunner, Notification);
    const oldIsRead = notification.isRead;

    notification.isRead = true;
    notification.updatedAt = new Date();

    const saved = await updateDb(repo, notification, {
      queryRunner: queryRunner,
    });

    await auditLogger.logUpdate(
      "Notification",
      notification.id,
      { isRead: oldIsRead },
      { isRead: true },
      user,
    );

    return saved;
  }
}

module.exports = { NotificationStateTransitionService };
