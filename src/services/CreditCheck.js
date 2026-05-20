// src/main/services/CreditCheckService.js
const auditLogger = require("../utils/auditLogger");

class CreditCheckService {
  constructor() {
    this.logRepository = null;
    this.debtRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const CreditCheckLog = require("../entities/CreditCheckLog");
    const Debt = require("../entities/Debt");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.logRepository = AppDataSource.getRepository(CreditCheckLog);
    this.debtRepository = AppDataSource.getRepository(Debt);
    console.log("CreditCheckService initialized");
  }

  async getRepositories() {
    if (!this.logRepository) {
      await this.initialize();
    }
    return {
      log: this.logRepository,
      debt: this.debtRepository,
    };
  }

  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Internal scoring algorithm (300-850 range)
   * @param {Object} debtorDebtStats
   * @returns {Object} score, riskLevel, remarks
   */
  _computeScore(debtorDebtStats) {
    let score = 700; // base score
    const { totalDebt, overdueCount, totalPaid, totalTransactions, averagePaymentDelay } = debtorDebtStats;

    // Reduce score based on total debt amount
    if (totalDebt > 100000) score -= 50;
    else if (totalDebt > 50000) score -= 30;
    else if (totalDebt > 10000) score -= 15;

    // Penalize overdue debts
    if (overdueCount > 0) {
      score -= Math.min(100, overdueCount * 20);
    }

    // Positive factor: payment history (high paid ratio improves score)
    const paidRatio = totalDebt > 0 ? totalPaid / totalDebt : 1;
    if (paidRatio > 0.8) score += 20;
    else if (paidRatio > 0.5) score += 10;

    // Factor for consistent payments (more transactions = better)
    if (totalTransactions > 5) score += 10;

    // Penalize late payments if average delay > 0
    if (averagePaymentDelay > 30) score -= 25;
    else if (averagePaymentDelay > 15) score -= 10;

    // Clamp score between 300 and 850
    score = Math.min(850, Math.max(300, score));

    let riskLevel = "Medium";
    let remarks = "";
    if (score >= 700) {
      riskLevel = "Low";
      remarks = "Good credit history. Low risk.";
    } else if (score >= 500) {
      riskLevel = "Medium";
      remarks = "Moderate risk. Monitor payments.";
    } else {
      riskLevel = "High";
      remarks = "High risk. Overdue debts detected.";
    }

    if (overdueCount > 0) {
      remarks += ` Has ${overdueCount} overdue debt(s).`;
    }

    return { score, riskLevel, remarks };
  }

  /**
   * Collect debt statistics for a debtor
   * @param {number} debtorId
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async _getDebtorDebtStats(debtorId, qr = null) {
    const Debt = require("../entities/Debt");
    const debtRepo = this._getRepo(qr, Debt);
    const debts = await debtRepo.find({
      where: { borrower: { id: debtorId }, deletedAt: null },
      relations: ["payments"],
    });

    let totalDebt = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let totalTransactions = 0;
    let totalPaymentDelay = 0;
    let paymentDelaysCount = 0;

    const now = new Date();
    for (const debt of debts) {
      totalDebt += parseFloat(debt.totalAmount);
      totalPaid += parseFloat(debt.paidAmount);
      totalTransactions += debt.payments ? debt.payments.length : 0;

      // Check if debt is overdue and not paid
      const dueDate = new Date(debt.dueDate);
      if (dueDate < now && debt.status !== "paid" && debt.remainingAmount > 0) {
        overdueCount++;
      }

      // Calculate payment delays (assuming payments after due date)
      if (debt.payments && debt.payments.length > 0) {
        for (const payment of debt.payments) {
          const paymentDate = new Date(payment.paymentDate);
          if (paymentDate > dueDate) {
            const delay = Math.floor((paymentDate - dueDate) / (1000 * 60 * 60 * 24));
            totalPaymentDelay += delay;
            paymentDelaysCount++;
          }
        }
      }
    }

    const averagePaymentDelay = paymentDelaysCount > 0 ? totalPaymentDelay / paymentDelaysCount : 0;

    return {
      totalDebt,
      totalPaid,
      overdueCount,
      totalTransactions,
      averagePaymentDelay,
    };
  }

  // ----------------------------------------------------------------------
  // 📋 READ OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Get credit check history for a debtor
   * @param {number} debtorId
   */
  async getCreditCheckHistory(debtorId) {
    const { log: repo } = await this.getRepositories();
    const logs = await repo.find({
      where: { debtorId },
      order: { dateChecked: "DESC" },
    });
    await auditLogger.logView("CreditCheckLog", null, "system");
    return logs;
  }

  // ----------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Perform a credit check for a debtor (internal scoring)
   * @param {number} debtorId
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async performCreditCheck(debtorId, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const CreditCheckLog = require("../entities/CreditCheckLog");
    const logRepo = this._getRepo(qr, CreditCheckLog);

    // Fetch debtor's debt statistics
    const stats = await this._getDebtorDebtStats(debtorId, qr);
    const { score, riskLevel, remarks } = this._computeScore(stats);

    const logEntry = logRepo.create({
      debtorId,
      score,
      riskLevel,
      remarks,
      dateChecked: new Date(),
      createdAt: new Date(),
    });

    const saved = await saveDb(logRepo, logEntry);
    await auditLogger.logCreate("CreditCheckLog", saved.id, saved, user);
    console.log(`Credit check performed for debtor ${debtorId}: score=${score}, risk=${riskLevel}`);
    return { score, riskLevel, remarks, dateChecked: saved.dateChecked };
  }

  /**
   * Delete a credit check log entry
   * @param {number} logId
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async deleteCreditCheckLog(logId, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const CreditCheckLog = require("../entities/CreditCheckLog");
    const logRepo = this._getRepo(qr, CreditCheckLog);

    const log = await logRepo.findOne({ where: { id: logId } });
    if (!log) {
      throw new Error(`Credit check log with ID ${logId} not found`);
    }

    await removeDb(logRepo, log);
    await auditLogger.logDelete("CreditCheckLog", logId, log, user);
    console.log(`Credit check log ${logId} deleted`);
  }
}

const creditCheckService = new CreditCheckService();
module.exports = creditCheckService;