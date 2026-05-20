// src/services/NotificationStateTransitionService.js
const Notification = require("../entities/Notification");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");

class NotificationStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.notificationRepo = dataSource.getRepository(Notification);
  }

  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Mark a notification as read (in‑app)
   * @param {Object} notification
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onRead(notification, user = "system", queryRunner = null) {
    logger.info(`[Transition] Marking notification #${notification.id} as read by ${user}`);

    const repo = this._getRepo(Notification, queryRunner);
    notification.isRead = true;
    notification.updatedAt = new Date();
    await repo.save(notification);
  }

  /**
   * Dismiss a notification without reading (e.g., swipe away)
   * @param {Object} notification
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onDismiss(notification, user = "system", queryRunner = null) {
    logger.info(`[Transition] Dismissing notification #${notification.id} by ${user}`);

    const repo = this._getRepo(Notification, queryRunner);
    // For simplicity, we mark it as read. Optionally, you could soft‑delete or set a `dismissed` flag.
    notification.isRead = true;
    notification.updatedAt = new Date();
    await repo.save(notification);

    await auditLogger.logUpdate("Notification", notification.id, { isRead: false }, { isRead: true }, user);
  }
}

module.exports = { NotificationStateTransitionService };