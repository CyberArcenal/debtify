// src/services/InterestAccrualService.js
//@ts-check
const { AppDataSource } = require("../main/db/data-source");
const Debt = require("../entities/Debt");

const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");

class InterestAccrualService {
  // Walang constructor na kumukuha ng repository – safe kahit hindi pa ready ang DB

  /**
   * Lazy getter para sa debt repository (safe kahit kailan tawagin)
   */
  get debtRepo() {
    if (!AppDataSource.isInitialized) {
      throw new Error("Database not initialized");
    }
    return AppDataSource.getRepository(Debt);
  }

  /**
   * Mag-accrue ng interes para sa isang utang hanggang sa isang target date.
   * Ginagamit ito bago mag-apply ng payment, o sa scheduler.
   *
   * @param {Object} debt - Debt entity
   * @param {Date} asOfDate - petsa kung hanggang kailan mag-aaccrue (default: ngayon)
   * @returns {Promise<Object>} updated debt
   */
  async applyAccrual(debt, asOfDate = new Date()) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    // Skip kung hindi active/overdue
    // @ts-ignore
    if (debt.status !== "active" && debt.status !== "overdue") {
      logger.debug(
        // @ts-ignore
        `[InterestAccrual] Skip debt #${debt.id}, status: ${debt.status}`,
      );
      return debt;
    }

    // Skip kung walang interest rate o zero
    // @ts-ignore
    if (!debt.interestRate || debt.interestRate <= 0) {
      logger.debug(
        // @ts-ignore
        `[InterestAccrual] Skip debt #${debt.id}, interestRate = ${debt.interestRate}`,
      );
      return debt;
    }

    // Skip kung fully paid na
    // @ts-ignore
    if (debt.remainingAmount <= 0.01) {
      logger.debug(
        // @ts-ignore
        `[InterestAccrual] Skip debt #${debt.id}, remaining = ${debt.remainingAmount}`,
      );
      return debt;
    }

    // Kunin ang huling accrual date (kung null, gamitin ang createdAt)
    // @ts-ignore
    let lastDate = debt.lastInterestAccrualDate
      // @ts-ignore
      ? new Date(debt.lastInterestAccrualDate)
      // @ts-ignore
      : new Date(debt.createdAt);
    if (isNaN(lastDate.getTime())) {
      // @ts-ignore
      lastDate = new Date(debt.createdAt);
    }
    lastDate.setHours(0, 0, 0, 0);

    const targetDate = new Date(asOfDate);
    targetDate.setHours(0, 0, 0, 0);

    // Kung ang target date ay hindi lalampas sa last accrual date, walang gagawin
    if (targetDate <= lastDate) {
      logger.debug(
        // @ts-ignore
        `[InterestAccrual] Debt #${debt.id} already accrued up to ${lastDate.toISOString()}`,
      );
      return debt;
    }

    // Bilang ng araw mula lastDate hanggang targetDate (exclusive ng lastDate, inclusive ng targetDate? standard: from lastDate+1 to targetDate)
    const daysDiff = Math.floor(
      // @ts-ignore
      (targetDate - lastDate) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff === 0) return debt;

    // Compute daily interest rate (simple interest)
    // @ts-ignore
    const annualRate = debt.interestRate / 100;
    const dailyRate = annualRate / 365;
    // @ts-ignore
    const principal = debt.remainingAmount;
    const interestAmount = principal * dailyRate * daysDiff;

    if (interestAmount <= 0.01) {
      logger.debug(
        // @ts-ignore
        `[InterestAccrual] Negligible interest for debt #${debt.id}: ${interestAmount}`,
      );
      return debt;
    }

    // @ts-ignore
    const oldRemaining = debt.remainingAmount;
    // @ts-ignore
    debt.remainingAmount = parseFloat((principal + interestAmount).toFixed(2));
    // @ts-ignore
    debt.lastInterestAccrualDate = targetDate;
    // @ts-ignore
    debt.updatedAt = new Date();

    // I-save gamit ang updateDb (skipSignal para hindi ma-trigger ang ibang hooks kung gusto)
    // @ts-ignore
    await updateDb(this.debtRepo, debt, { skipSignal: true });

    logger.info(
      // @ts-ignore
      `[InterestAccrual] Debt #${debt.id}: +₱${interestAmount.toFixed(2)} interest for ${daysDiff} day(s). New remaining: ₱${debt.remainingAmount}`,
    );

    // Audit log
    await auditLogger.logUpdate(
      "Debt",
      // @ts-ignore
      debt.id,
      {
        oldRemaining,
        interestAccrued: interestAmount,
        days: daysDiff,
        lastAccrualDate: lastDate,
        accrualUpTo: targetDate,
      },
      {
        // @ts-ignore
        newRemaining: debt.remainingAmount,
        newLastAccrualDate: targetDate,
      },
      "system",
    );

    return debt;
  }

  /**
   * Hanapin ang lahat ng utang na kailangang i-accrue (active/overdue, may interest, positive balance)
   * @returns {Promise<Debt[]>}
   */
  async findDebtsForAccrual() {
    // @ts-ignore
    return await this.debtRepo
      .createQueryBuilder("debt")
      .where("debt.status IN (:...statuses)", {
        statuses: ["active", "overdue"],
      })
      .andWhere("debt.remainingAmount > 0")
      .andWhere("debt.interestRate IS NOT NULL")
      .andWhere("debt.interestRate > 0")
      .andWhere("debt.deletedAt IS NULL")
      .getMany();
  }

  /**
   * I-accrue ang interes para sa LAHAT ng eligible debts, hanggang ngayong araw.
   * Ginagamit ito ng scheduler (araw-araw).
   * @returns {Promise<{processed: number, errors: number}>}
   */
  async runAccrual() {
    logger.info("[InterestAccrual] Starting daily interest accrual...");
    const debts = await this.findDebtsForAccrual();
    if (debts.length === 0) {
      logger.info("[InterestAccrual] No debts need accrual.");
      return { processed: 0, errors: 0 };
    }

    let processed = 0,
      errors = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const debt of debts) {
      try {
        await this.applyAccrual(debt, today);
        processed++;
      } catch (err) {
        // @ts-ignore
        logger.error(`[InterestAccrual] Failed for debt #${debt.id}:`, err);
        errors++;
      }
    }

    logger.info(
      `[InterestAccrual] Completed: processed ${processed}, errors ${errors}`,
    );
    return { processed, errors };
  }

  /**
   * I-accrue ang interes para sa isang specific na utang hanggang sa isang specific na petsa.
   * Ito ay dapat tawagin **BAGO** mag-apply ng payment, para accurate ang balance bago ang payment.
   * @param {number} debtId
   * @param {Date} asOfDate
   * @returns {Promise<Object>} updated debt
   */
  async accrueForPayment(debtId, asOfDate = new Date()) {
    const debt = await this.debtRepo.findOne({ where: { id: debtId } });
    if (!debt) throw new Error(`Debt #${debtId} not found`);
    return await this.applyAccrual(debt, asOfDate);
  }
}

// I-export bilang singleton instance
module.exports = new InterestAccrualService();
