// src/main/services/CreditCheckService.js
const auditLogger = require("../utils/auditLogger");
const { creditBureauApiEnabled, creditBureauApiKey, creditBureauEndpoint, enforceCreditCheck } = require("../utils/system");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
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
   * Call external credit bureau API if enabled
   * @param {number} debtorId
   * @param {Object} debtorInfo (name, contact, etc.)
   * @returns {Promise<Object|null>}
   */
  async _callExternalCreditBureau(debtorId, debtorInfo) {
    if (!(await creditBureauApiEnabled())) {
      return null;
    }
    const apiKey = await creditBureauApiKey();
    const endpoint = await creditBureauEndpoint();
    if (!apiKey || !endpoint) {
      console.warn("Credit bureau API enabled but key or endpoint missing.");
      return null;
    }

    // This is a placeholder – implement actual HTTP request using fetch or axios.
    // For now, we'll simulate an external call.
    console.log(`Calling external credit bureau at ${endpoint} for debtor ${debtorId}`);
    // const response = await fetch(endpoint, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ debtorId, name: debtorInfo.name }) });
    // const data = await response.json();
    // return { score: data.score, riskLevel: data.riskLevel, remarks: data.remarks };
    return null; // Not implemented
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

      const dueDate = new Date(debt.dueDate);
      if (dueDate < now && debt.status !== "paid" && debt.remainingAmount > 0) {
        overdueCount++;
      }

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

  async performCreditCheck(debtorId, user = "system", qr = null, debtorInfo = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const CreditCheckLog = require("../entities/CreditCheckLog");
    const logRepo = this._getRepo(qr, CreditCheckLog);

    let score, riskLevel, remarks;

    // 1. Try external credit bureau if enabled
    const externalResult = await this._callExternalCreditBureau(debtorId, debtorInfo);
    if (externalResult) {
      score = externalResult.score;
      riskLevel = externalResult.riskLevel;
      remarks = externalResult.remarks;
    } else {
      // 2. Fallback to internal scoring
      const stats = await this._getDebtorDebtStats(debtorId, qr);
      const computed = this._computeScore(stats);
      score = computed.score;
      riskLevel = computed.riskLevel;
      remarks = computed.remarks;
    }

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