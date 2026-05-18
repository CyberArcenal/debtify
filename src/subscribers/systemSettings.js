// src/subscribers/SystemSettingSubscriber.js
//@ts-check
const { SystemSetting } = require("../entities/systemSettings");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading SystemSettingSubscriber");

class SystemSettingSubscriber {
  constructor() {}

  listenTo() {
    return SystemSetting;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[SystemSettingSubscriber] beforeInsert", {
        id: entity.id,
        key: entity.key,
        category: entity.category,
      });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[SystemSettingSubscriber] afterInsert", {
        id: entity.id,
        key: entity.key,
        category: entity.category,
      });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[SystemSettingSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[SystemSettingSubscriber] afterUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[SystemSettingSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[SystemSettingSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] afterRemove error", err);
    }
  }
}

module.exports = SystemSettingSubscriber;