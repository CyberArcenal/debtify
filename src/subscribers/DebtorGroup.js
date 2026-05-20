// src/subscribers/DebtorGroupSubscriber.js
//@ts-check
const DebtorGroup = require("../entities/DebtorGroup");
const { logger } = require("../utils/logger");

const { AppDataSource } = require("../main/db/data-source");
const { DebtorGroupStateTransitionService } = require("../StateTransitionServices/DebtorGroup");

console.log("[Subscriber] Loading DebtorGroupSubscriber");

class DebtorGroupSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new DebtorGroupStateTransitionService(AppDataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return DebtorGroup;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
      });
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[DebtorGroupSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
      });
      const service = await this.getTransitionService();
      if (service.onCreated) {
        await service.onCreated(entity, "system");
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onBeforeUpdate) {
        // We need the old state; fetch from DB or use event later. Simpler to call in afterUpdate.
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[DebtorGroupSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onAfterUpdate) {
        await service.onAfterUpdate(databaseEntity, entity, "system");
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeRemove", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onBeforeDelete) {
        await service.onBeforeDelete(entity, "system");
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[DebtorGroupSubscriber] afterRemove", { id: event.entityId });
      const service = await this.getTransitionService();
      if (service.onAfterDelete) {
        await service.onAfterDelete({ id: event.entityId }, "system");
      }
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterRemove error", err);
    }
  }
}

module.exports = DebtorGroupSubscriber;