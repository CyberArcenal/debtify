// src/services/NotificationStateTransitionService.js
const Notification = require("../entities/Notification");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");

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
   * Mark a notification as read (in‑app)
   * @param {Object} notification
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onRead(notification, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Marking notification #${notification.id} as read by ${user}`);

    const repo = this._getRepo(queryRunner, Notification);
    const oldIsRead = notification.isRead;

    notification.isRead = true;
    notification.updatedAt = new Date();

    // Use updateDb instead of repo.save
    const saved = await updateDb(repo, notification, { queryRunner: queryRunner });

    await auditLogger.logUpdate(
      "Notification",
      notification.id,
      { isRead: oldIsRead },
      { isRead: true },
      user
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
    logger.info(`[Transition] Dismissing notification #${notification.id} by ${user}`);

    const repo = this._getRepo(queryRunner, Notification);
    const oldIsRead = notification.isRead;

    notification.isRead = true;
    notification.updatedAt = new Date();

    const saved = await updateDb(repo, notification, { queryRunner: queryRunner });

    await auditLogger.logUpdate(
      "Notification",
      notification.id,
      { isRead: oldIsRead },
      { isRead: true },
      user
    );

    return saved;
  }
}

module.exports = { NotificationStateTransitionService };