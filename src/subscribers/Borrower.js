// src/subscribers/BorrowerSubscriber.js
//@ts-check
const Borrower = require("../entities/Borrower");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");
const { BorrowerStateTransitionService } = require("../StateTransitionServices/Borrower");

console.log("[Subscriber] Loading BorrowerSubscriber");

class BorrowerSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new BorrowerStateTransitionService(AppDataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return Borrower;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[BorrowerSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        email: entity.email,
      });
    } catch (err) {
      logger.error("[BorrowerSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[BorrowerSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        email: entity.email,
      });
      const service = await this.getTransitionService();
      if (service.onActivate) {
        await service.onActivate(entity, "system");
      }
    } catch (err) {
      logger.error("[BorrowerSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[BorrowerSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[BorrowerSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[BorrowerSubscriber] afterUpdate", {
        id: entity.id,
      });
      const service = await this.getTransitionService();
      if (service.onAfterUpdate) {
        await service.onAfterUpdate(databaseEntity, entity, "system");
      }
    } catch (err) {
      logger.error("[BorrowerSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[BorrowerSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[BorrowerSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[BorrowerSubscriber] afterRemove", {
        id: event.entityId,
      });
      const service = await this.getTransitionService();
      if (service.onDeactivate) {
        await service.onDeactivate({ id: event.entityId }, "system");
      }
    } catch (err) {
      logger.error("[BorrowerSubscriber] afterRemove error", err);
    }
  }
}

module.exports = BorrowerSubscriber;