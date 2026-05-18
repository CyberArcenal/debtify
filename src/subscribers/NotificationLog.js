// src/subscribers/NotificationLogSubscriber.js
//@ts-check
const NotificationLog = require("../entities/NotificationLog");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading NotificationLogSubscriber");

class NotificationLogSubscriber {
  constructor() {}

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
      logger.info("[NotificationLogSubscriber] afterUpdate", {
        id: entity.id,
      });
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