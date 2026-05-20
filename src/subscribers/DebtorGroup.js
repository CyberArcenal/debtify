// src/subscribers/DebtorGroupSubscriber.js
//@ts-check
const DebtorGroup = require("../entities/DebtorGroup");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading DebtorGroupSubscriber");

class DebtorGroupSubscriber {
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
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[DebtorGroupSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[DebtorGroupSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[DebtorGroupSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[DebtorGroupSubscriber] afterRemove error", err);
    }
  }
}

module.exports = DebtorGroupSubscriber;