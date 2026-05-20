// src/subscribers/SystemSettingSubscriber.js
const { SystemSetting } = require("../entities/systemSettings");
const TaxChangeLog = require("../entities/TaxChangeLog");
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
      const { entity, databaseEntity } = event;
      logger.info("[SystemSettingSubscriber] afterUpdate", { id: entity.id });

      // --- TAX CHANGE LOGGING ---
      // Only log if the setting key is tax‑related and the value changed
      const taxKeys = [
        "tax_rate",
        "tax_enabled",
        "tax_type",
        "vat_rate",
        "gst_rate",
      ];
      if (
        taxKeys.includes(entity.key) &&
        entity.value !== databaseEntity.value
      ) {
        const { AppDataSource } = require("../main/db/data-source");
        const logRepo = AppDataSource.getRepository(TaxChangeLog);
        const log = logRepo.create({
          setting_key: entity.key,
          old_value: databaseEntity.value,
          new_value: entity.value,
          changed_by: "system", // TODO: get current user from context (e.g., from global state)
          reason: "Auto‑logged on setting update",
          setting_id: entity.id,
        });
        await logRepo.save(log);
        logger.info("[SystemSettingSubscriber] Tax change logged", {
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
