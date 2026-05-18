// src/subscribers/BorrowerSubscriber.js
//@ts-check
const Borrower = require("../entities/Borrower");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading BorrowerSubscriber");

class BorrowerSubscriber {
  constructor() {}

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
      const { entity } = event;
      logger.info("[BorrowerSubscriber] afterUpdate", {
        id: entity.id,
      });
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
    } catch (err) {
      logger.error("[BorrowerSubscriber] afterRemove error", err);
    }
  }
}

module.exports = BorrowerSubscriber;