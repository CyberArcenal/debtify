// src/subscribers/NotificationLogSubscriber.js
const NotificationLog = require("../entities/NotificationLog");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");
const {
  NotificationLogStateTransitionService,
} = require("../StateTransitionServices/NotificationLog");

console.log("[Subscriber] Loading NotificationLogSubscriber");

class NotificationLogSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new NotificationLogStateTransitionService(
        AppDataSource,
      );
    }
    return this.transitionService;
  }

  listenTo() {
    return NotificationLog;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[NotificationLogSubscriber] beforeInsert", {
        id: entity.id,
        notificationId: entity.notificationId,
        status: entity.status,
      });
    } catch (err) {
      logger.error("[NotificationLogSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[NotificationLogSubscriber] afterInsert", {
        id: entity.id,
        notificationId: entity.notificationId,
        status: entity.status,
      });

      const service = await this.getTransitionService();
      if (service.onCreate) {
        await service.onCreate(entity, "system");
      }
    } catch (err) {
      logger.error("[NotificationLogSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[NotificationLogSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[NotificationLogSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[NotificationLogSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      if (entity.status === "failed" && entity.retry_count < 3) {
        await service.onRetry(entity, "system");
      } else if (entity.status === "sent") {
        await service.onAcknowledge(entity, "system");
      }
    } catch (err) {
      logger.error("[NotificationLogSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[NotificationLogSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[NotificationLogSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[NotificationLogSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[NotificationLogSubscriber] afterRemove error", err);
    }
  }
}

module.exports = NotificationLogSubscriber;
