// src/subscribers/NotificationSubscriber.js
const Notification = require("../entities/Notification");
const { logger } = require("../utils/logger");
const { NotificationStateTransitionService } = require("../StateTransitionServices/Notification");

console.log("[Subscriber] Loading NotificationSubscriber");

class NotificationSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new NotificationStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return Notification;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[NotificationSubscriber] beforeInsert", {
        id: entity.id,
        title: entity.title,
        type: entity.type,
        debtId: entity.debt?.id,
      });
    } catch (err) {
      logger.error("[NotificationSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
   try {
      logger.info("[NotificationSubscriber] afterInsert", {
        id: entity.id,
        title: entity.title,
        type: entity.type,
        debtId: entity.debt?.id,
      });
      // Call onCreate transition
      const service = await this.getTransitionService(manager.connection);
      await service.onCreate(entity, "system", queryRunner);
    } catch (err) {
      logger.error("[NotificationSubscriber] afterInsert error", err);
      // Don't throw to avoid breaking the transaction
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[NotificationSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[NotificationSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[NotificationSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (entity.isRead && !databaseEntity.isRead) {
        await service.onRead(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[NotificationSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[NotificationSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[NotificationSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[NotificationSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[NotificationSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = NotificationSubscriber;