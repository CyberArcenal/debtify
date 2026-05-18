// src/subscribers/NotificationSubscriber.js
//@ts-check
const Notification = require("../entities/Notification");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading NotificationSubscriber");

class NotificationSubscriber {
  constructor() {}

  listenTo() {
    return Notification;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[NotificationSubscriber] beforeInsert", {
        id: entity.id,
        title: entity.title,
        type: entity.type,
        debtId: entity.debt?.id,
      });
    } catch (err) {
      logger.error("[NotificationSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[NotificationSubscriber] afterInsert", {
        id: entity.id,
        title: entity.title,
        type: entity.type,
        debtId: entity.debt?.id,
      });
    } catch (err) {
      logger.error("[NotificationSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[NotificationSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[NotificationSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[NotificationSubscriber] afterUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[NotificationSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[NotificationSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[NotificationSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[NotificationSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[NotificationSubscriber] afterRemove error", err);
    }
  }
}

module.exports = NotificationSubscriber;