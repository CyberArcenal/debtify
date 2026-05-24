// src/subscribers/NotificationLogSubscriber.js
const NotificationLog = require("../entities/NotificationLog");
const { logger } = require("../utils/logger");
const {
  NotificationLogStateTransitionService,
} = require("../StateTransitionServices/ReminderLog");

console.log("[Subscriber] Loading ReminderLogSubscriber");

class NotificationLogSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new NotificationLogStateTransitionService(
        dataSource,
      );
    }
    return this.transitionService;
  }

  listenTo() {
    return NotificationLog;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[ReminderLogSubscriber] beforeInsert", {
        id: entity.id,
        notificationId: entity.notificationId,
        status: entity.status,
      });
    } catch (err) {
      logger.error("[ReminderLogSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[ReminderLogSubscriber] afterInsert", {
        id: entity.id,
        notificationId: entity.notificationId,
        status: entity.status,
      });

      // 🔍 I-log ang queryRunner details
      logger.info(`[ReminderLogSubscriber] queryRunner details:`, {
        constructorName: queryRunner?.constructor?.name,
        hasAfterCommit: typeof queryRunner?.afterCommit,
        hasManager: !!queryRunner?.manager,
        isQueryRunner: queryRunner?.constructor?.name === "QueryRunner",
      });

      const service = await this.getTransitionService(manager.connection);
      if (service.onCreate) {
        await service.onCreate(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[ReminderLogSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[ReminderLogSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[ReminderLogSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity } = event;
      logger.info("[ReminderLogSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (entity.status === "failed" && entity.retry_count < 3) {
        await service.onRetry(entity, "system", queryRunner);
      } else if (entity.status === "sent") {
        await service.onAcknowledge(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[ReminderLogSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[ReminderLogSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[ReminderLogSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[ReminderLogSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[ReminderLogSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = NotificationLogSubscriber;
