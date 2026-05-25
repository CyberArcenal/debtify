// src/subscribers/InterestRateChangeLogSubscriber.js
const { logger } = require("../utils/logger");
const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
const { InterestRateChangeLogStateTransitionService } = require("../StateTransitionServices/InterestRateChangeLog");

console.log("[Subscriber] Loading InterestRateChangeLogSubscriber");

class InterestRateChangeLogSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new InterestRateChangeLogStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return InterestRateChangeLog;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[InterestRateChangeLogSubscriber] beforeInsert", {
        id: entity.id,
        setting_key: entity.setting_key,
        old_value: entity.old_value,
        new_value: entity.new_value,
        changed_by: entity.changed_by,
      });
    } catch (err) {
      logger.error("[InterestRateChangeLogSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[InterestRateChangeLogSubscriber] afterInsert", {
        id: entity.id,
        setting_key: entity.setting_key,
        old_value: entity.old_value,
        new_value: entity.new_value,
        changed_by: entity.changed_by,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onInterestRateChanged) {
        await service.onInterestRateChanged(entity, entity.changed_by || "system", queryRunner);
      }
    } catch (err) {
      logger.error("[InterestRateChangeLogSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[InterestRateChangeLogSubscriber] beforeUpdate", {
        id: entity.id,
        setting_key: entity.setting_key,
      });
    } catch (err) {
      logger.error("[InterestRateChangeLogSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[InterestRateChangeLogSubscriber] afterUpdate", {
        id: entity.id,
        setting_key: entity.setting_key,
        old_value: databaseEntity.new_value,
        new_value: entity.new_value,
      });
    } catch (err) {
      logger.error("[InterestRateChangeLogSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[InterestRateChangeLogSubscriber] beforeRemove", {
        id: entity.id,
        setting_key: entity.setting_key,
      });
    } catch (err) {
      logger.error("[InterestRateChangeLogSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[InterestRateChangeLogSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[InterestRateChangeLogSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = InterestRateChangeLogSubscriber;