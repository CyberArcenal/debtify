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
   * When a new payment method is added
   */
  async onCreated(method, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${method.name}" (ID: ${method.id}) created by ${user}`);

    const statRepo = this._getRepo(require("../entities/PaymentMethodStat"), queryRunner);
    // 1. Create stats record (initialized to zero)
    const stats = statRepo.create({
      method: method,
      transactionCount: 0,
      totalAmount: 0,
    });
    await statRepo.save(stats);

    // 2. Audit log creation
    await auditLogger.logCreate("PaymentMethod", method.id, method, user);
  }

  /**
   * When a method is updated
   */
  async onUpdate(oldMethod, newMethod, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${newMethod.name}" (ID: ${newMethod.id}) updated by ${user}`);

    // Detect if isDefault changed
    if (oldMethod.isDefault !== newMethod.isDefault && newMethod.isDefault) {
      // Ensure only one default (the service should have already done this, but we double-check)
      const methodRepo = this._getRepo(require("../entities/PaymentMethod"), queryRunner);
      await methodRepo.update({ isDefault: true }, { isDefault: false });
      newMethod.isDefault = true;
      await methodRepo.save(newMethod);
      logger.info(`[PaymentMethod] Enforced single default for method #${newMethod.id}`);
    }

    // Log changes (audit log)
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
   * When a method is deleted
   */
  async onDelete(method, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${method.name}" (ID: ${method.id}) deleted by ${user}`);

    // 1. Prevent deletion if used in any payment transaction
    const paymentRepo = this._getRepo(require("../entities/PaymentTransaction"), queryRunner);
    // We need to check if any payment uses this method. However, PaymentTransaction may not have a direct methodId.
    // In our schema, PaymentMethod is not directly linked to PaymentTransaction. For now, we assume no foreign key constraint.
    // If there is a relation, adjust accordingly. We'll add a placeholder check.
    // For safety, we can query the stats table: if transactionCount > 0, prevent deletion.
    const statRepo = this._getRepo(require("../entities/PaymentMethodStat"), queryRunner);
    const stats = await statRepo.findOne({ where: { method: { id: method.id } } });
    if (stats && stats.transactionCount > 0) {
      throw new Error(`Cannot delete payment method "${method.name}" because it has been used in ${stats.transactionCount} transaction(s).`);
    }

    // 2. If this method is the default, set another method as default before deletion
    if (method.isDefault) {
      const methodRepo = this._getRepo(require("../entities/PaymentMethod"), queryRunner);
      const another = await methodRepo.findOne({ where: { id: method.id }, order: { id: "ASC" } });
      if (another) {
        another.isDefault = true;
        await methodRepo.save(another);
        logger.info(`[PaymentMethod] Set method #${another.id} as new default.`);
      }
    }

    // 3. Stats are deleted automatically by ON DELETE CASCADE (if foreign key defined). If not, delete manually.
    if (stats) {
      await statRepo.remove(stats);
    }

    // 4. Audit log deletion
    await auditLogger.logDelete("PaymentMethod", method.id, method, user);
  }

  /**
   * When a method is set as default (explicit action)
   */
  async onSetDefault(method, user = "system", queryRunner = null) {
    logger.info(`[PaymentMethod] Method "${method.name}" (ID: ${method.id}) set as default by ${user}`);

    const methodRepo = this._getRepo(require("../entities/PaymentMethod"), queryRunner);
    // Unset previous default
    await methodRepo.update({ isDefault: true }, { isDefault: false });
    // Set new default
    method.isDefault = true;
    await methodRepo.save(method);

    await auditLogger.logUpdate("PaymentMethod", method.id, { isDefault: false }, { isDefault: true }, user);
  }
}

module.exports = { PaymentMethodStateTransitionService };