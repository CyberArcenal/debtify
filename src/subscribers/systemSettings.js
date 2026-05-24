// src/subscribers/SystemSettingSubscriber.js
const { SystemSetting } = require("../entities/systemSettings");
const { logger } = require("../utils/logger");
const {
  SystemSettingStateTransitionService,
} = require("../StateTransitionServices/systemSettings");

console.log("[Subscriber] Loading SystemSettingSubscriber");

class SystemSettingSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new SystemSettingStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return SystemSetting;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[SystemSettingSubscriber] beforeInsert", {
        id: entity.id,
        key: entity.key,
        setting_type: entity.setting_type,
      });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[SystemSettingSubscriber] afterInsert", {
        id: entity.id,
        key: entity.key,
        setting_type: entity.setting_type,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onApply) {
        await service.onApply(entity, null, entity.value, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[SystemSettingSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[SystemSettingSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[SystemSettingSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onApply) {
        await service.onApply(entity, databaseEntity.value, entity.value, "system", queryRunner);
      }

      // Interest rate change logging – but now using the transaction manager
      const interestRateKeys = ["default_interest_rate"];
      if (
        interestRateKeys.includes(entity.key) &&
        entity.value !== databaseEntity.value
      ) {
        const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
        const logRepo = manager.getRepository(InterestRateChangeLog);
        const log = logRepo.create({
          setting_key: entity.key,
          old_value: parseFloat(databaseEntity.value),
          new_value: parseFloat(entity.value),
          changed_by: "system", // TODO: get current user
          reason: "Auto‑logged on setting update",
        });
        await logRepo.save(log);
        logger.info("[SystemSettingSubscriber] Interest rate change logged", {
          key: entity.key,
          old: databaseEntity.value,
          new: entity.value,
        });
      }
    } catch (err) {
      logger.error("[SystemSettingSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[SystemSettingSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[SystemSettingSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = SystemSettingSubscriber;