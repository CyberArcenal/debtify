// src/main/services/PaymentMethodService.js
const auditLogger = require("../utils/auditLogger");

class PaymentMethodService {
  constructor() {
    this.methodRepository = null;
    this.statRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const PaymentMethod = require("../entities/PaymentMethod");
    const PaymentMethodStat = require("../entities/PaymentMethodStat");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.methodRepository = AppDataSource.getRepository(PaymentMethod);
    this.statRepository = AppDataSource.getRepository(PaymentMethodStat);
    console.log("PaymentMethodService initialized");
  }

  async getRepositories() {
    if (!this.methodRepository) {
      await this.initialize();
    }
    return {
      method: this.methodRepository,
      stat: this.statRepository,
    };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Validate method data
   */
  _validateMethodData(data, isUpdate = false) {
    const errors = [];
    if (!isUpdate || data.name !== undefined) {
      if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        errors.push("Method name is required");
      }
    }
    return { valid: errors.length === 0, errors };
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

  // ----------------------------------------------------------------------
  // 📋 READ OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Get all payment methods
   */
  async getAllPaymentMethods() {
    const { method: repo } = await this.getRepositories();
    const methods = await repo.find({
      order: { isDefault: "DESC", name: "ASC" },
    });
    await auditLogger.logView("PaymentMethod", null, "system");
    return methods;
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethodById(id) {
    const { method: repo } = await this.getRepositories();
    const method = await repo.findOne({ where: { id } });
    if (!method) {
      throw new Error(`Payment method with ID ${id} not found`);
    }
    await auditLogger.logView("PaymentMethod", id, "system");
    return method;
  }

  /**
   * Get usage statistics for a payment method
   */
  async getPaymentMethodStats(methodId) {
    const { stat: repo } = await this.getRepositories();
    let stats = await repo.findOne({ where: { method: { id: methodId } }, relations: ["method"] });
    if (!stats) {
      // Initialize if not exists
      const PaymentMethodStat = require("../entities/PaymentMethodStat");
      stats = repo.create({ method: { id: methodId }, transactionCount: 0, totalAmount: 0 });
      await repo.save(stats);
    }
    return stats;
  }

  // ----------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Create a new payment method
   * @param {Object} data
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async createPaymentMethod(data, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const PaymentMethod = require("../entities/PaymentMethod");
    const PaymentMethodStat = require("../entities/PaymentMethodStat");
    const methodRepo = this._getRepo(qr, PaymentMethod);
    const statRepo = this._getRepo(qr, PaymentMethodStat);

    const validation = this._validateMethodData(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const { name, description = null, icon = "CreditCard", isDefault = false } = data;

    const method = methodRepo.create({
      name: name.trim(),
      description,
      icon,
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await saveDb(methodRepo, method);

    // Initialize stats for this method
    const stats = statRepo.create({
      method: saved,
      transactionCount: 0,
      totalAmount: 0,
    });
    await saveDb(statRepo, stats);

    // If this method is default, ensure others are not default
    if (isDefault) {
      await this._ensureSingleDefault(saved.id, qr);
    }

    await auditLogger.logCreate("PaymentMethod", saved.id, saved, user);
    console.log(`Payment method created: ${saved.name}`);
    return saved;
  }

  /**
   * Update an existing payment method
   */
  async updatePaymentMethod(id, data, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentMethod = require("../entities/PaymentMethod");
    const methodRepo = this._getRepo(qr, PaymentMethod);

    const existing = await methodRepo.findOne({ where: { id } });
    if (!existing) {
      throw new Error(`Payment method with ID ${id} not found`);
    }
    const oldData = { ...existing };

    if (data.name !== undefined) existing.name = data.name.trim();
    if (data.description !== undefined) existing.description = data.description;
    if (data.icon !== undefined) existing.icon = data.icon;
    if (data.isDefault !== undefined) existing.isDefault = data.isDefault;
    existing.updatedAt = new Date();

    const saved = await updateDb(methodRepo, existing);

    // If this method is set as default, ensure others are not default
    if (saved.isDefault) {
      await this._ensureSingleDefault(saved.id, qr);
    }

    await auditLogger.logUpdate("PaymentMethod", id, oldData, saved, user);
    return saved;
  }

  /**
   * Set a payment method as default (unset all others)
   */
  async setDefaultPaymentMethod(id, user = "system", qr = null) {
    const PaymentMethod = require("../entities/PaymentMethod");
    const methodRepo = this._getRepo(qr, PaymentMethod);

    const method = await methodRepo.findOne({ where: { id } });
    if (!method) {
      throw new Error(`Payment method with ID ${id} not found`);
    }

    await this._ensureSingleDefault(id, qr);
    method.isDefault = true;
    method.updatedAt = new Date();
    const saved = await methodRepo.save(method);
    await auditLogger.logUpdate("PaymentMethod", id, { isDefault: false }, { isDefault: true }, user);
    return saved;
  }

  /**
   * Delete a payment method (prevents deletion if it's the default)
   */
  async deletePaymentMethod(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const PaymentMethod = require("../entities/PaymentMethod");
    const PaymentMethodStat = require("../entities/PaymentMethodStat");
    const methodRepo = this._getRepo(qr, PaymentMethod);
    const statRepo = this._getRepo(qr, PaymentMethodStat);

    const method = await methodRepo.findOne({ where: { id } });
    if (!method) {
      throw new Error(`Payment method with ID ${id} not found`);
    }
    if (method.isDefault) {
      throw new Error("Cannot delete the default payment method");
    }

    // Delete associated stats first (cascade not set on entity)
    const stats = await statRepo.findOne({ where: { method: { id } } });
    if (stats) {
      await removeDb(statRepo, stats);
    }

    await removeDb(methodRepo, method);
    await auditLogger.logDelete("PaymentMethod", id, method, user);
    console.log(`Payment method deleted: ${method.name}`);
  }

  /**
   * Increment usage statistics when a payment is recorded
   * @param {number} methodId
   * @param {number} amount
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async incrementPaymentMethodStats(methodId, amount, qr = null) {
    const PaymentMethodStat = require("../entities/PaymentMethodStat");
    const statRepo = this._getRepo(qr, PaymentMethodStat);

    let stats = await statRepo.findOne({ where: { method: { id: methodId } } });
    if (!stats) {
      stats = statRepo.create({ method: { id: methodId }, transactionCount: 0, totalAmount: 0 });
    }
    stats.transactionCount += 1;
    stats.totalAmount = parseFloat(stats.totalAmount) + amount;
    await statRepo.save(stats);
    console.log(`Stats updated for payment method ${methodId}: +1 transaction, +${amount}`);
  }
}

// Singleton instance
const paymentMethodService = new PaymentMethodService();
module.exports = paymentMethodService;