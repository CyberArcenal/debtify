// src/subscribers/DebtorGroupMemberSubscriber.js
const DebtorGroupMember = require("../entities/DebtorGroupMember");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading DebtorGroupMemberSubscriber");

class DebtorGroupMemberSubscriber {
  listenTo() {
    return DebtorGroupMember;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] beforeInsert", {
        id: entity.id,
        groupId: entity.groupId,
        debtorId: entity.debtorId,
      });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] afterInsert", {
        id: entity.id,
        groupId: entity.groupId,
        debtorId: entity.debtorId,
      });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity } = event;
      logger.info("[DebtorGroupMemberSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = DebtorGroupMemberSubscriber;