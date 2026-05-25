// src/services/InterestAccrualService.js
const { AppDataSource } = require("../main/db/data-source");
const Debt = require("../entities/Debt");
const { updateDb } = require("../utils/dbUtils/dbActions");
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");

class InterestAccrualService {
  constructor() {
    this.debtRepo = AppDataSource.getRepository(Debt);
  }

  /**
   * Get the next accrual date (monthly anniversary)
   */
  getNextAccrualDate(fromDate) {
    let d = new Date(fromDate);
    let day = d.getDate();
    d.setMonth(d.getMonth() + 1);
    if (d.getDate() !== day) {
      d.setDate(0); // last day of previous month
    }
    return d;
  }

  /**
   * Apply interest accrual to a single debt
   */
  async applyAccrual(debt, asOfDate = new Date()) {
    if (debt.status !== "active" && debt.status !== "overdue") {
      logger.debug(`[InterestAccrual] Skipping debt #${debt.id} (status: ${debt.status})`);
      return debt;
    }
    if (!debt.interestRate || debt.interestRate <= 0) {
      logger.debug(`[InterestAccrual] Skipping debt #${debt.id} (no interest rate)`);
      return debt;
    }
    if (debt.remainingAmount <= 0) {
      logger.debug(`[InterestAccrual] Skipping debt #${debt.id} (fully paid)`);
      return debt;
    }

    let lastDate = debt.lastInterestAccrualDate ? new Date(debt.lastInterestAccrualDate) : new Date(debt.createdAt);
    if (isNaN(lastDate.getTime())) lastDate = new Date(debt.createdAt);
    const today = new Date(asOfDate);
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    // Compute number of full months that have passed
    let monthsDiff = (today.getFullYear() - lastDate.getFullYear()) * 12 + (today.getMonth() - lastDate.getMonth());
    // If today's day is before the anniversary day, subtract one month
    if (today.getDate() < lastDate.getDate()) {
      monthsDiff--;
    }
    if (monthsDiff <= 0) {
      logger.debug(`[InterestAccrual] Debt #${debt.id} not yet due (months since last: ${monthsDiff})`);
      return debt;
    }

    const monthlyRate = debt.interestRate / 100 / 12;
    const principal = debt.remainingAmount;
    const interestAmount = principal * monthlyRate * monthsDiff;
    if (interestAmount <= 0.01) return debt;

    const oldRemaining = debt.remainingAmount;
    debt.remainingAmount = principal + interestAmount;
    debt.remainingAmount = parseFloat(debt.remainingAmount.toFixed(2));
    // Update last accrual date by adding monthsDiff months
    let newLastDate = new Date(lastDate);
    newLastDate.setMonth(newLastDate.getMonth() + monthsDiff);
    if (newLastDate > today) newLastDate = today;
    debt.lastInterestAccrualDate = newLastDate;
    debt.updatedAt = today;

    await updateDb(this.debtRepo, debt, { skipSignal: true });
    logger.info(`[InterestAccrual] Applied ₱${interestAmount.toFixed(2)} interest for ${monthsDiff} month(s) to debt #${debt.id}. New remaining: ${debt.remainingAmount}`);

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { remainingAmount: oldRemaining, interestAccrued: interestAmount, months: monthsDiff },
      { remainingAmount: debt.remainingAmount, lastInterestAccrualDate: newLastDate },
      "system"
    );
    return debt;
  }

  /**
   * Find debts that need accrual (based on monthly anniversary)
   */
  async findDebtsForAccrual() {
    const debts = await this.debtRepo
      .createQueryBuilder("debt")
      .where("debt.status IN (:...statuses)", { statuses: ["active", "overdue"] })
      .andWhere("debt.remainingAmount > 0")
      .andWhere("debt.interestRate IS NOT NULL")
      .andWhere("debt.interestRate > 0")
      .getMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eligible = [];
    for (const debt of debts) {
      let lastDate = debt.lastInterestAccrualDate ? new Date(debt.lastInterestAccrualDate) : new Date(debt.createdAt);
      if (isNaN(lastDate.getTime())) lastDate = new Date(debt.createdAt);
      lastDate.setHours(0, 0, 0, 0);
      let monthsDiff = (today.getFullYear() - lastDate.getFullYear()) * 12 + (today.getMonth() - lastDate.getMonth());
      if (today.getDate() < lastDate.getDate()) monthsDiff--;
      if (monthsDiff >= 1) eligible.push(debt);
    }
    return eligible;
  }

  async runAccrual() {
    logger.info("[InterestAccrual] Starting monthly interest accrual check...");
    const debts = await this.findDebtsForAccrual();
    if (debts.length === 0) {
      logger.info("[InterestAccrual] No debts need accrual.");
      return { processed: 0, errors: 0 };
    }
    let processed = 0, errors = 0;
    for (const debt of debts) {
      try {
        await this.applyAccrual(debt);
        processed++;
      } catch (err) {
        logger.error(`[InterestAccrual] Failed for debt #${debt.id}:`, err);
        errors++;
      }
    }
    logger.info(`[InterestAccrual] Completed: processed ${processed}, errors ${errors}`);
    return { processed, errors };
  }
}

module.exports = new InterestAccrualService();