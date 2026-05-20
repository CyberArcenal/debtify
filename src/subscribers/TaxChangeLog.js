// src/subscribers/TaxChangeLogSubscriber.js
const TaxChangeLog = require("../entities/TaxChangeLog");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading TaxChangeLogSubscriber");

class TaxChangeLogSubscriber {
  listenTo() {
    return TaxChangeLog;
  }

  /**
   * @param {{ id: any; setting_key: any; old_value: any; new_value: any; changed_by: any; }} entity
   */
  async beforeInsert(entity) {
    try {
      logger.info("[TaxChangeLogSubscriber] beforeInsert", {
        id: entity.id,
        setting_key: entity.setting_key,
        old_value: entity.old_value,
        new_value: entity.new_value,
        changed_by: entity.changed_by,
      });
    } catch (err) {
      logger.error("[TaxChangeLogSubscriber] beforeInsert error", err);
    }
  }

  /**
   * @param {{ id: any; setting_key: any; old_value: any; new_value: any; changed_by: any; }} entity
   */
  async afterInsert(entity) {
    try {
      logger.info("[TaxChangeLogSubscriber] afterInsert", {
        id: entity.id,
        setting_key: entity.setting_key,
        old_value: entity.old_value,
        new_value: entity.new_value,
        changed_by: entity.changed_by,
      });
    } catch (err) {
      logger.error("[TaxChangeLogSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ id: any; setting_key: any; }} entity
   */
  async beforeUpdate(entity) {
    try {
      logger.info("[TaxChangeLogSubscriber] beforeUpdate", {
        id: entity.id,
        setting_key: entity.setting_key,
      });
    } catch (err) {
      logger.error("[TaxChangeLogSubscriber] beforeUpdate error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[TaxChangeLogSubscriber] afterUpdate", {
        id: entity.id,
        setting_key: entity.setting_key,
        old_value: databaseEntity.new_value,
        new_value: entity.new_value,
      });
    } catch (err) {
      logger.error("[TaxChangeLogSubscriber] afterUpdate error", err);
    }
  }

  /**
   * @param {{ id: any; setting_key: any; }} entity
   */
  async beforeRemove(entity) {
    try {
      logger.info("[TaxChangeLogSubscriber] beforeRemove", {
        id: entity.id,
        setting_key: entity.setting_key,
      });
    } catch (err) {
      logger.error("[TaxChangeLogSubscriber] beforeRemove error", err);
    }
  }

  /**
   * @param {{ entityId: any; }} event
   */
  async afterRemove(event) {
    try {
      logger.info("[TaxChangeLogSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[TaxChangeLogSubscriber] afterRemove error", err);
    }
  }
}

module.exports = TaxChangeLogSubscriber;
