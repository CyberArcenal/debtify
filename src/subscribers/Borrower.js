// src/subscribers/BorrowerSubscriber.js
const Borrower = require("../entities/Borrower");
const { logger } = require("../utils/logger");
const {
  BorrowerStateTransitionService,
} = require("../StateTransitionServices/Borrower");

console.log("[Subscriber] Loading BorrowerSubscriber");

class BorrowerSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new BorrowerStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return Borrower;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[BorrowerSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        email: entity.email,
      });
    } catch (err) {
      logger.error("[BorrowerSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[BorrowerSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        email: entity.email,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onActivate) {
        await service.onActivate(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[BorrowerSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[BorrowerSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[BorrowerSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[BorrowerSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onAfterUpdate) {
        await service.onAfterUpdate(
          databaseEntity,
          entity,
          "system",
          queryRunner,
        );
      }
    } catch (err) {
      logger.error("[BorrowerSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[BorrowerSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[BorrowerSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[BorrowerSubscriber] afterRemove", { id: event.entityId });
      const service = await this.getTransitionService(manager.connection);
      if (service.onDeactivate) {
        await service.onDeactivate(
          { id: event.entityId },
          "system",
          queryRunner,
        );
      }
    } catch (err) {
      logger.error("[BorrowerSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = BorrowerSubscriber;
