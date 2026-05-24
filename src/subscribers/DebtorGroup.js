// src/subscribers/DebtorGroupSubscriber.js
const DebtorGroup = require("../entities/DebtorGroup");
const { logger } = require("../utils/logger");
const { DebtorGroupStateTransitionService } = require("../StateTransitionServices/DebtorGroup");

console.log("[Subscriber] Loading DebtorGroupSubscriber");

class DebtorGroupSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new DebtorGroupStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return DebtorGroup;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
      });
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onCreated) {
        await service.onCreated(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[DebtorGroupSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onAfterUpdate) {
        await service.onAfterUpdate(databaseEntity, entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeRemove", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onBeforeDelete) {
        await service.onBeforeDelete(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupSubscriber] afterRemove", { id: event.entityId });
      const service = await this.getTransitionService(manager.connection);
      if (service.onAfterDelete) {
        await service.onAfterDelete({ id: event.entityId }, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = DebtorGroupSubscriber;