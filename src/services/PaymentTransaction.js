// services/PaymentTransactionService.js

const auditLogger = require("../utils/auditLogger");
const { validatePaymentData } = require("../utils/paymentUtils");
const {
  enableEarlyPaymentDiscount,
  earlyPaymentDiscountRate,
} = require("../utils/system");

// Time limit for editing payments (in hours)
const EDIT_TIME_LIMIT_HOURS = 24;

class PaymentTransactionService {
  constructor() {
    this.paymentRepository = null;
    this.debtRepository = null;
    this.methodRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const Debt = require("../entities/Debt");
    const PaymentMethod = require("../entities/PaymentMethod");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.paymentRepository = AppDataSource.getRepository(PaymentTransaction);
    this.debtRepository = AppDataSource.getRepository(Debt);
    this.methodRepository = AppDataSource.getRepository(PaymentMethod);
    console.log("PaymentTransactionService initialized");
  }

  async getRepositories() {
    if (!this.paymentRepository) {
      await this.initialize();
    }
    return {
      payment: this.paymentRepository,
      debt: this.debtRepository,
      method: this.methodRepository,
    };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository<any>}
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Create a new payment transaction (no side effects – debt not updated here)
   * @param {Object} paymentData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(paymentData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));
    const methodRepo = this._getRepo(qr, require("../entities/PaymentMethod"));

    try {
      const validation = validatePaymentData(paymentData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      let { amount, paymentDate, reference, notes, debtId, methodId } =
        paymentData;
      let originalAmount = amount;

      // Validate debt existence
      const debt = await debtRepo.findOne({ where: { id: debtId } });
      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      // Validate payment method if provided
      if (methodId) {
        const paymentMethod = await methodRepo.findOne({
          where: { id: methodId },
        });
        if (!paymentMethod) {
          throw new Error(`Payment method with ID ${methodId} not found`);
        }
      }

      // Early payment discount logic (only compute discounted amount, but do NOT update debt)
      const discountEnabled = await enableEarlyPaymentDiscount();
      let discountApplied = false;
      if (discountEnabled) {
        const dueDate = new Date(debt.dueDate);
        const paymentDateObj = new Date(paymentDate);
        const isEarly = paymentDateObj < dueDate;
        // We need current remaining balance to know if it's full payment, but we don't have it recalculated here.
        // Since we removed debt recalculation, we must rely on the frontend or calculate remaining on the fly.
        // For simplicity, we'll still fetch the latest remaining amount from debt (but we won't modify debt).
        // This is a read-only check.
        const currentRemaining = debt.totalAmount - debt.paidAmount;
        const isFullPayment =
          Math.abs(parseFloat(amount) - currentRemaining) < 0.01;

        if (isEarly && isFullPayment) {
          const discountRate = await earlyPaymentDiscountRate();
          if (discountRate > 0) {
            const discountedAmount =
              currentRemaining * (1 - discountRate / 100);
            amount = parseFloat(discountedAmount.toFixed(2));
            const discountNote = `[Early payment discount ${discountRate}% applied – original amount ${originalAmount}]`;
            notes = notes ? `${discountNote} ${notes}` : discountNote;
            discountApplied = true;
            console.log(
              `Early payment discount applied: original ${originalAmount} → discounted ${amount}`,
            );
          }
        }
      }

      // AUTO-GENERATE REFERENCE IF NULL OR EMPTY
      let finalReference = reference;
      if (!reference || reference.trim() === "") {
        finalReference = await this.generateUniqueReference(paymentRepo);
        console.log(`Auto-generated reference: ${finalReference}`);
      }

      // Create payment record (no debt update here)
      const payment = paymentRepo.create({
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        reference: finalReference,
        notes: notes || null,
        recordedAt: new Date(),
        methodId: methodId || null,
        debt,
      });

      const saved = await saveDb(paymentRepo, payment);
      await auditLogger.logCreate("PaymentTransaction", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create payment:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing payment transaction (no side effects)
   * @param {number} id
   * @param {Object} paymentData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {boolean} isAdmin - allows bypassing time limit
   */
  async update(id, paymentData, user = "system", qr = null, isAdmin = false) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const PaymentMethod = require("../entities/PaymentMethod");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);
    const methodRepo = this._getRepo(qr, PaymentMethod);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const existing = await paymentRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!existing) throw new Error(`Payment #${id} not found`);

      // Time limit check
      const createdAt = existing.recordedAt;
      const hoursSinceCreation =
        (Date.now() - new Date(createdAt)) / (1000 * 60 * 60);
      if (hoursSinceCreation > EDIT_TIME_LIMIT_HOURS && !isAdmin) {
        throw new Error(
          `Cannot edit payment after ${EDIT_TIME_LIMIT_HOURS} hours`,
        );
      }

      const oldData = { ...existing };
      const oldDebtId = existing.debt.id;
      let newDebtId = null;

      // Update debt if changed (but do NOT recalculate balances here)
      if (paymentData.debtId && paymentData.debtId !== oldDebtId) {
        const newDebt = await debtRepo.findOne({
          where: { id: paymentData.debtId },
        });
        if (!newDebt) throw new Error(`Debt ${paymentData.debtId} not found`);
        existing.debt = newDebt;
        newDebtId = paymentData.debtId;
        delete paymentData.debtId;
      }

      // Update payment method if provided
      if (paymentData.methodId !== undefined) {
        if (paymentData.methodId === null || paymentData.methodId === "") {
          existing.methodId = null;
        } else {
          const newMethod = await methodRepo.findOne({
            where: { id: paymentData.methodId },
          });
          if (!newMethod)
            throw new Error(`Payment method ${paymentData.methodId} not found`);
          existing.methodId = paymentData.methodId;
        }
        delete paymentData.methodId;
      }

      // Update other fields
      if (paymentData.amount !== undefined)
        paymentData.amount = parseFloat(paymentData.amount);
      if (paymentData.paymentDate)
        paymentData.paymentDate = new Date(paymentData.paymentDate);
      Object.assign(existing, paymentData);
      existing.updatedAt = new Date();

      // Note: No validation against remaining balance because side effects are handled elsewhere.
      // The state transition service will handle consistency when needed (e.g., on confirm/void/refund).

      const saved = await updateDb(paymentRepo, existing);
      await auditLogger.logUpdate(
        "PaymentTransaction",
        id,
        oldData,
        saved,
        user,
      );
      return saved;
    } catch (error) {
      console.error("Update payment failed:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a payment transaction (no side effects)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    try {
      const payment = await paymentRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!payment) throw new Error(`Payment #${id} not found`);
      if (payment.deletedAt)
        throw new Error(`Payment #${id} is already deleted`);

      const oldData = { ...payment };
      payment.deletedAt = new Date();
      payment.updatedAt = new Date();

      const saved = await updateDb(paymentRepo, payment);
      await auditLogger.logDelete("PaymentTransaction", id, oldData, user);
      console.log(`Payment #${id} soft deleted`);
      return saved;
    } catch (error) {
      console.error("Failed to delete payment:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted payment transaction (no side effects)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    try {
      const payment = await paymentRepo.findOne({
        where: { id },
        withDeleted: true,
        relations: ["debt"],
      });
      if (!payment) throw new Error(`Payment #${id} not found`);
      if (!payment.deletedAt) throw new Error(`Payment #${id} is not deleted`);

      // No validation against remaining balance here – state transition service will handle consistency
      payment.deletedAt = null;
      payment.updatedAt = new Date();

      const saved = await updateDb(paymentRepo, payment);
      await auditLogger.logUpdate(
        "PaymentTransaction",
        id,
        { deletedAt: true },
        { deletedAt: null },
        user,
      );
      console.log(`Payment #${id} restored`);
      return saved;
    } catch (error) {
      console.error("Failed to restore payment:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a payment transaction (no side effects)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    const payment = await paymentRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: ["debt"],
    });
    if (!payment) throw new Error(`Payment #${id} not found`);

    await removeDb(paymentRepo, payment);
    await auditLogger.logDelete("PaymentTransaction", id, payment, user);
    console.log(`Payment #${id} permanently deleted`);
  }

  /**
   * Find payment by ID
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const { payment: paymentRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["debt", "debt.borrower"] };
    if (!includeDeleted) {
      options.where.deletedAt = null;
    }
    const payment = await paymentRepo.findOne(options);
    if (!payment) throw new Error(`Payment #${id} not found`);
    await auditLogger.logView("PaymentTransaction", id, "system");
    return payment;
  }

  /**
   * Find all payment transactions with filters, pagination, sorting (read-only)
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { payment: paymentRepo } = await this.getRepositories();
    const qb = paymentRepo
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    if (!options.includeDeleted) {
      qb.andWhere("payment.deletedAt IS NULL");
    }

    // Filters
    if (options.debtId)
      qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
    if (options.borrowerId)
      qb.andWhere("borrower.id = :borrowerId", {
        borrowerId: options.borrowerId,
      });
    if (options.reference)
      qb.andWhere("payment.reference LIKE :reference", {
        reference: `%${options.reference}%`,
      });
    if (options.paymentDateFrom)
      qb.andWhere("payment.paymentDate >= :paymentDateFrom", {
        paymentDateFrom: new Date(options.paymentDateFrom),
      });
    if (options.paymentDateTo)
      qb.andWhere("payment.paymentDate <= :paymentDateTo", {
        paymentDateTo: new Date(options.paymentDateTo),
      });
    if (options.minAmount)
      qb.andWhere("payment.amount >= :minAmount", {
        minAmount: options.minAmount,
      });
    if (options.maxAmount)
      qb.andWhere("payment.amount <= :maxAmount", {
        maxAmount: options.maxAmount,
      });
    if (options.search) {
      qb.andWhere(
        "(payment.reference LIKE :search OR payment.notes LIKE :search OR debt.name LIKE :search OR borrower.name LIKE :search)",
        { search: `%${options.search}%` },
      );
    }

    // Sorting
    const sortBy = options.sortBy || "paymentDate";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`payment.${sortBy}`, sortOrder);

    // Pagination
    if (options.page && options.limit) {
      const offset = (options.page - 1) * options.limit;
      qb.skip(offset).take(options.limit);
    }

    const payments = await qb.getMany();
    await auditLogger.logView("PaymentTransaction", null, "system");
    return payments;
  }

  /**
   * Get payment statistics (read-only, no side effects)
   */
  async getStatistics() {
    const { payment: paymentRepo } = await this.getRepositories();
    const qb = paymentRepo
      .createQueryBuilder("payment")
      .where("payment.deletedAt IS NULL");

    const totalPayments = await qb.getCount();
    const totalAmount = await qb
      .clone()
      .select("SUM(payment.amount)", "sum")
      .getRawOne();
    const averageAmount = await qb
      .clone()
      .select("AVG(payment.amount)", "avg")
      .getRawOne();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayments = await qb
      .clone()
      .andWhere("payment.paymentDate >= :thirtyDaysAgo", { thirtyDaysAgo })
      .getCount();

    const uniqueDebts = await qb
      .clone()
      .select("COUNT(DISTINCT payment.debtId)", "count")
      .getRawOne();

    return {
      totalPayments,
      totalAmountCollected: parseFloat(totalAmount?.sum) || 0,
      averagePaymentAmount: parseFloat(averageAmount?.avg) || 0,
      paymentsLast30Days: recentPayments,
      debtsWithPayments: parseInt(uniqueDebts?.count) || 0,
    };
  }

  /**
   * Export payment transactions to CSV or JSON (read-only)
   */
  async exportPayments(format = "json", filters = {}, user = "system") {
    const payments = await this.findAll(filters);

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Amount",
        "Payment Date",
        "Reference",
        "Notes",
        "Recorded At",
        "Debt ID",
        "Debt Name",
        "Borrower Name",
      ];
      const rows = payments.map((p) => [
        p.id,
        p.amount,
        new Date(p.paymentDate).toLocaleDateString(),
        p.reference || "",
        (p.notes || "").replace(/,/g, " "),
        new Date(p.recordedAt).toLocaleString(),
        p.debt?.id ?? "",
        p.debt?.name ?? "",
        p.debt?.borrower?.name ?? "",
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `payments_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: payments,
        filename: `payments_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    await auditLogger.logExport("PaymentTransaction", format, filters, user);
    console.log(`Exported ${payments.length} payments in ${format} format`);
    return exportData;
  }

  /**
   * Bulk create payments (no side effects)
   */
  async bulkCreate(paymentsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of paymentsArray) {
      try {
        const saved = await this.create(data, user, qr);
        results.created.push(saved);
      } catch (err) {
        results.errors.push({ payment: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update payments (no side effects)
   */
  async bulkUpdate(updatesArray, user = "system", qr = null) {
    const results = { updated: [], errors: [] };
    for (const { id, updates } of updatesArray) {
      try {
        const saved = await this.update(id, updates, user, qr);
        results.updated.push(saved);
      } catch (err) {
        results.errors.push({ id, updates, error: err.message });
      }
    }
    return results;
  }

  /**
   * Import payments from CSV file (no side effects)
   */
  async importFromCSV(filePath, user = "system", qr = null) {
    const fs = require("fs").promises;
    const csv = require("csv-parse/sync");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = { imported: [], errors: [] };
    for (const record of records) {
      try {
        const paymentData = {
          amount: parseFloat(record.amount),
          paymentDate: record.paymentDate,
          reference: record.reference || null,
          notes: record.notes || null,
          debtId: parseInt(record.debtId, 10),
          methodId: record.methodId ? parseInt(record.methodId, 10) : null,
        };
        const validation = validatePaymentData(paymentData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(paymentData, user, qr);
        results.imported.push(saved);
      } catch (err) {
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }

  async generateUniqueReference(paymentRepo) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    let reference = `PAY-${datePart}-${randomPart}`;

    let existing = await paymentRepo.findOne({
      where: { reference },
      withDeleted: true,
    });
    let attempts = 0;
    while (existing && attempts < 5) {
      const newRandom = Math.floor(10000 + Math.random() * 90000);
      reference = `PAY-${datePart}-${newRandom}`;
      existing = await paymentRepo.findOne({
        where: { reference },
        withDeleted: true,
      });
      attempts++;
    }
    if (existing) {
      reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    return reference;
  }
}

// Singleton instance
const paymentTransactionService = new PaymentTransactionService();
module.exports = paymentTransactionService;
