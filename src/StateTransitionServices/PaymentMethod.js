// src/services/PaymentMethodStateTransitionService.js
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");

class PaymentMethodStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.methodRepo = dataSource.getRepository(require("../entities/PaymentMethod"));
    this.statRepo = dataSource.getRepository(require("../entities/PaymentMethodStat"));
    this.paymentRepo = dataSource.getRepository(require("../entities/PaymentTransaction"));
  }

  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Ensure only one default method exists
   * @param {number?} excludeId
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async _ensureSingleDefault(excludeId = null, qr = null) {
    const PaymentMethod = require("../entities/PaymentMethod");
    const methodRepo = this._getRepo(qr, PaymentMethod);
    const defaultMethods = await methodRepo.find({ where: { isDefault: true } });
    for (const method of defaultMethods) {
      if (method.id !== excludeId) {
        method.isDefault = false;
        await methodRepo.save(method);
      }
    }
  }

  /**
   * When a new payment method is added (afterInsert)
   * - Creates the stats record
   * - Enforces single default if this method is default
   */
  async onCreated(method, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${method.name}" (ID: ${method.id}) created by ${user}`);

    const statRepo = this._getRepo(require("../entities/PaymentMethodStat"), queryRunner);
    // 1. Create stats record (initialized to zero) – only once
    const stats = statRepo.create({
      method: method,
      transactionCount: 0,
      totalAmount: 0,
    });
    await statRepo.save(stats);

    // 2. If this method is default, ensure others are not default
    if (method.isDefault) {
      await this._ensureSingleDefault(method.id, queryRunner);
    }

    // 3. Audit log creation (already logged by service, but we add a transition log)
    await auditLogger.logCreate("PaymentMethod", method.id, method, user);
  }

  /**
   * When a method is updated (afterUpdate)
   * - Enforce single default if isDefault changed to true
   * - Log changes (audit log already done by service, but we add detailed diff)
   */
  async onUpdate(oldMethod, newMethod, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${newMethod.name}" (ID: ${newMethod.id}) updated by ${user}`);

    // Enforce single default if this method is now default
    if (newMethod.isDefault && !oldMethod.isDefault) {
      await this._ensureSingleDefault(newMethod.id, queryRunner);
    }

    // Log changes (audit log – service already did basic log, this is extra detail)
    const changes = {};
    if (oldMethod.name !== newMethod.name) changes.name = { old: oldMethod.name, new: newMethod.name };
    if (oldMethod.description !== newMethod.description) changes.description = { old: oldMethod.description, new: newMethod.description };
    if (oldMethod.icon !== newMethod.icon) changes.icon = { old: oldMethod.icon, new: newMethod.icon };
    if (oldMethod.isDefault !== newMethod.isDefault) changes.isDefault = { old: oldMethod.isDefault, new: newMethod.isDefault };
    if (Object.keys(changes).length > 0) {
      await auditLogger.logUpdate("PaymentMethod", newMethod.id, oldMethod, newMethod, user);
    }
  }

  /**
   * When a method is explicitly set as default (optional, called from subscriber if needed)
   */
  async onSetDefault(method, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${method.name}" (ID: ${method.id}) set as default by ${user}`);

    // Unset previous default
    await this._ensureSingleDefault(method.id, queryRunner);
    // method.isDefault is already true; just log
    await auditLogger.logUpdate("PaymentMethod", method.id, { isDefault: false }, { isDefault: true }, user);
  }

  /**
   * When a method is deleted (beforeRemove)
   * - Prevent deletion if it has been used in any payment transaction
   */
  async onDelete(method, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${method.name}" (ID: ${method.id}) about to be deleted by ${user}`);

    // Check if method has been used
    const statRepo = this._getRepo(require("../entities/PaymentMethodStat"), queryRunner);
    const stats = await statRepo.findOne({ where: { method: { id: method.id } } });
    if (stats && stats.transactionCount > 0) {
      throw new Error(`Cannot delete payment method "${method.name}" because it has been used in ${stats.transactionCount} transaction(s).`);
    }

    // If this method is the default, set another method as default before deletion
    if (method.isDefault) {
      const methodRepo = this._getRepo(require("../entities/PaymentMethod"), queryRunner);
      const another = await methodRepo.findOne({ where: { id: method.id }, order: { id: "ASC" } });
      if (another) {
        another.isDefault = true;
        await methodRepo.save(another);
        logger.info(`[PaymentMethod] Set method #${another.id} as new default.`);
      }
    }

    // Stats will be deleted by cascade if foreign key is set, else deletion will happen in service.
    // We do not delete stats here because service already does it.
  }
}

module.exports = { PaymentMethodStateTransitionService };