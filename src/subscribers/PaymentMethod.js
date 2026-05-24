// src/subscribers/PaymentMethodSubscriber.js
const PaymentMethod = require("../entities/PaymentMethod");
const { logger } = require("../utils/logger");
const { PaymentMethodStateTransitionService } = require("../StateTransitionServices/PaymentMethod");

console.log("[Subscriber] Loading PaymentMethodSubscriber");

class PaymentMethodSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new PaymentMethodStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return PaymentMethod;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        isDefault: entity.isDefault,
      });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        isDefault: entity.isDefault,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onCreated) {
        await service.onCreated(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[PaymentMethodSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onUpdate) {
        await service.onUpdate(databaseEntity, entity, "system", queryRunner);
      }
      if (entity.isDefault && !databaseEntity.isDefault) {
        await service.onSetDefault(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeRemove", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onDelete) {
        await service.onDelete(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = PaymentMethodSubscriber;