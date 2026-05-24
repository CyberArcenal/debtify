// src/subscribers/LoanAgreementSubscriber.js
const LoanAgreement = require("../entities/LoanAgreement");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading LoanAgreementSubscriber");

class LoanAgreementSubscriber {
  listenTo() {
    return LoanAgreement;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] beforeInsert", {
        id: entity.id,
        lenderName: entity.lenderName,
        debtId: entity.debt?.id,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] afterInsert", {
        id: entity.id,
        lenderName: entity.lenderName,
        debtId: entity.debt?.id,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity } = event;
      logger.info("[LoanAgreementSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = LoanAgreementSubscriber;