// src/subscribers/SystemSettingSubscriber.js
const { SystemSetting } = require("../entities/systemSettings");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");
const {
  SystemSettingStateTransitionService,
} = require("../StateTransitionServices/systemSettings");

console.log("[Subscriber] Loading SystemSettingSubscriber");

class SystemSettingSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new SystemSettingStateTransitionService(
        AppDataSource,
      );
    }
    return this.transitionService;
  }

  listenTo() {
    return SystemSetting;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[SystemSettingSubscriber] beforeInsert", {
        id: entity.id,
        key: entity.key,
        setting_type: entity.setting_type,
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
        setting_type: entity.setting_type,
      });
      const service = await this.getTransitionService();
      if (service.onApply) {
        await service.onApply(entity, null, entity.value, "system");
      }
    } catch (err) {
      logger.error("[SystemSettingSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[SystemSettingSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[SystemSettingSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[SystemSettingSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onApply) {
        await service.onApply(
          entity,
          databaseEntity.value,
          entity.value,
          "system",
        );
      }

      // Inside afterUpdate of SystemSettingSubscriber

      const interestRateKeys = ["default_interest_rate"];
      if (
        interestRateKeys.includes(entity.key) &&
        entity.value !== databaseEntity.value
      ) {
        const { AppDataSource } = require("../main/db/data-source");
        const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
        const logRepo = AppDataSource.getRepository(InterestRateChangeLog);
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
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[SystemSettingSubscriber] beforeRemove", { id: entity.id });
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
