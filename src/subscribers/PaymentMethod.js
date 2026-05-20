// src/subscribers/PaymentMethodSubscriber.js
const PaymentMethod = require("../entities/PaymentMethod");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");
const { PaymentMethodStateTransitionService } = require("../StateTransitionServices/PaymentMethod");

console.log("[Subscriber] Loading PaymentMethodSubscriber");

class PaymentMethodSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new PaymentMethodStateTransitionService(AppDataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return PaymentMethod;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        isDefault: entity.isDefault,
      });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        isDefault: entity.isDefault,
      });
      const service = await this.getTransitionService();
      if (service.onCreated) {
        await service.onCreated(entity, "system");
      }
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[PaymentMethodSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onUpdate) {
        await service.onUpdate(databaseEntity, entity, "system");
      }
      if (entity.isDefault && !databaseEntity.isDefault) {
        await service.onSetDefault(entity, "system");
      }
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeRemove", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onDelete) {
        await service.onDelete(entity, "system");
      }
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[PaymentMethodSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterRemove error", err);
    }
  }
}

module.exports = PaymentMethodSubscriber;