// src/main/services/PaymentMethodService.js
const auditLogger = require("../utils/auditLogger");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
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
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[Global._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[Global._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Validate method data
   */
  _validateMethodData(data, isUpdate = false) {
    const errors = [];
    if (!isUpdate || data.name !== undefined) {
      if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.push("Method name is required");
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // ----------------------------------------------------------------------
  // 📋 READ OPERATIONS
  // ----------------------------------------------------------------------
  async getAllPaymentMethods(page = 1, limit = 10) {
    const { method: repo } = await this.getRepositories();
    const qb = repo
      .createQueryBuilder("method")
      .orderBy("method.isDefault", "DESC")
      .addOrderBy("method.name", "ASC");
    const result = await paginateQueryBuilder(qb, { page, limit });
    await auditLogger.logView("PaymentMethod", null, "system");
    return result;
  }

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
   * Get the default payment method
   * @returns {Promise<PaymentMethod|null>}
   */
  async getDefaultPaymentMethod() {
    const { method: repo } = await this.getRepositories();
    const defaultMethod = await repo.findOne({ where: { isDefault: true } });
    return defaultMethod || null;
  }

  async getPaymentMethodStats(methodId) {
    const { stat: repo } = await this.getRepositories();
    let stats = await repo.findOne({
      where: { method: { id: methodId } },
      relations: ["method"],
    });
    if (!stats) {
      // Initialize if not exists (read-only fallback)
      const PaymentMethodStat = require("../entities/PaymentMethodStat");
      stats = repo.create({
        method: { id: methodId },
        transactionCount: 0,
        totalAmount: 0,
      });
      await repo.save(stats);
    }
    return stats;
  }

  // ----------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS (CRUD only – no side effects)
  // ----------------------------------------------------------------------

  async createPaymentMethod(data, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const PaymentMethod = require("../entities/PaymentMethod");
    const methodRepo = this._getRepo(qr, PaymentMethod);

    const validation = this._validateMethodData(data);
    if (!validation.valid) throw new Error(validation.errors.join(", "));

    const {
      name,
      description = null,
      icon = "CreditCard",
      isDefault = false,
    } = data;

    // 🔧 Kung ito ay default, siguraduhing walang ibang default bago i-save
    if (isDefault) {
      await this._ensureSingleDefaultExclude(null, qr);
    }

    const method = methodRepo.create({
      name: name.trim(),
      description,
      icon,
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await saveDb(methodRepo, method);
    await auditLogger.logCreate("PaymentMethod", saved.id, saved, user);
    console.log(`Payment method created: ${saved.name}`);
    return saved;
  }

  async updatePaymentMethod(id, data, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentMethod = require("../entities/PaymentMethod");
    const methodRepo = this._getRepo(qr, PaymentMethod);

    const existing = await methodRepo.findOne({ where: { id } });
    if (!existing) throw new Error(`Payment method with ID ${id} not found`);
    const oldData = { ...existing };

    // 🔧 Kung ang update ay nagtatakda ng isDefault = true, siguraduhing walang ibang default
    const newIsDefault =
      data.isDefault !== undefined ? data.isDefault : existing.isDefault;
    if (newIsDefault && !existing.isDefault) {
      await this._ensureSingleDefaultExclude(id, qr);
    }

    if (data.name !== undefined) existing.name = data.name.trim();
    if (data.description !== undefined) existing.description = data.description;
    if (data.icon !== undefined) existing.icon = data.icon;
    if (data.isDefault !== undefined) existing.isDefault = data.isDefault;
    existing.updatedAt = new Date();

    const saved = await updateDb(methodRepo, existing);
    await auditLogger.logUpdate("PaymentMethod", id, oldData, saved, user);
    return saved;
  }

  async setDefaultPaymentMethod(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentMethod = require("../entities/PaymentMethod");
    const methodRepo = this._getRepo(qr, PaymentMethod);

    const method = await methodRepo.findOne({ where: { id } });
    if (!method) throw new Error(`Payment method with ID ${id} not found`);

    // 🔧 Alisin muna ang default sa lahat ng iba
    await this._ensureSingleDefaultExclude(id, qr);

    // Ngayon i-set ang method na ito bilang default
    method.isDefault = true;
    method.updatedAt = new Date();
    const saved = await updateDb(methodRepo, method);
    await auditLogger.logUpdate(
      "PaymentMethod",
      id,
      { isDefault: false },
      { isDefault: true },
      user,
    );
    return saved;
  }

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

    // Delete associated stats (cascade is not set on entity)
    const stats = await statRepo.findOne({ where: { method: { id } } });
    if (stats) {
      await removeDb(statRepo, stats);
    }

    await removeDb(methodRepo, method);
    await auditLogger.logDelete("PaymentMethod", id, method, user);
    console.log(`Payment method deleted: ${method.name}`);
  }

  // Utility method to increment stats – called from payment creation (not part of CRUD)
  async incrementPaymentMethodStats(methodId, amount, qr = null) {
    const PaymentMethodStat = require("../entities/PaymentMethodStat");
    const statRepo = this._getRepo(qr, PaymentMethodStat);

    let stats = await statRepo.findOne({ where: { method: { id: methodId } } });
    if (!stats) {
      stats = statRepo.create({
        method: { id: methodId },
        transactionCount: 0,
        totalAmount: 0,
      });
    }
    stats.transactionCount += 1;
    stats.totalAmount = parseFloat(stats.totalAmount) + amount;
    await statRepo.save(stats);
    console.log(
      `Stats updated for payment method ${methodId}: +1 transaction, +${amount}`,
    );
  }

  /**
   * Helper: Siguraduhing walang ibang default method maliban sa optional excludeId
   * @param {number|null} excludeId
   * @param {import("typeorm").QueryRunner|null} qr
   */
  async _ensureSingleDefaultExclude(excludeId = null, qr = null) {
    const PaymentMethod = require("../entities/PaymentMethod");
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const methodRepo = this._getRepo(qr, PaymentMethod);
    const defaultMethods = await methodRepo.find({
      where: { isDefault: true },
    });
    for (const method of defaultMethods) {
      if (method.id !== excludeId) {
        method.isDefault = false;
        method.updatedAt = new Date();
        await updateDb(methodRepo, method);
      }
    }
  }
}

const paymentMethodService = new PaymentMethodService();
module.exports = paymentMethodService;
