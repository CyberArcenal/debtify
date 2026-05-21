// src/services/PenaltyTransactionStateTransitionService.js
const PenaltyTransaction = require("../entities/PenaltyTransaction");
const Debt = require("../entities/Debt");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const notificationService = require("../services/Notification");

class PenaltyTransactionStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.penaltyRepo = dataSource.getRepository(PenaltyTransaction);
    this.debtRepo = dataSource.getRepository(Debt);
  }

  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Waive a penalty (remove it)
   */
  async onWaive(penalty, reason = "", user = "system", queryRunner = null) {
    logger.info(`[Transition] Waiving penalty #${penalty.id} by ${user}. Reason: ${reason}`);

    const penaltyRepo = this._getRepo(PenaltyTransaction, queryRunner);
    const debtRepo = this._getRepo(Debt, queryRunner);
    const debt = penalty.debt;

    if (!debt) throw new Error("Penalty has no associated debt");

    // 1. Mark penalty as waived (status)
    penalty.status = "waived";
    penalty.updatedAt = new Date();
    await penaltyRepo.save(penalty);

    // 2. Optionally remove the penalty amount from debt total (if it was previously added)
    // Usually when a penalty is created, it may not have been applied to the debt yet.
    // If the penalty was already collected, we need to reverse it.
    // We'll assume that waived penalties are not collected, so no debt adjustment needed.
    // If you need to reverse an already collected penalty, call onReverse instead.

    // 3. Create a waiver log (audit)
    await auditLogger.logUpdate("PenaltyTransaction", penalty.id, { status: "pending" }, { status: "waived", reason }, user);

    // 4. Notify debtor (in‑app)
    if (debt.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Penalty Waived",
          message: `The penalty of ${penalty.amount} on debt "${debt.name}" has been waived. Reason: ${reason || "N/A"}.`,
          type: "info",
          metadata: { penaltyId: penalty.id, debtId: debt.id },
        },
        user,
        queryRunner
      );
    }
  }

  /**
   * Collect penalty (apply to debt)
   */
  async onCollect(penalty, user = "system", queryRunner = null) {
    logger.info(`[Transition] Collecting penalty #${penalty.id} by ${user}`);

    const penaltyRepo = this._getRepo(PenaltyTransaction, queryRunner);
    const debtRepo = this._getRepo(Debt, queryRunner);
    const debt = penalty.debt;

    if (!debt) throw new Error("Penalty has no associated debt");

    // 1. Add penalty amount to debt remainingAmount
    debt.remainingAmount += penalty.amount;
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    // 2. Mark penalty as collected
    penalty.status = "collected";
    penalty.updatedAt = new Date();
    await penaltyRepo.save(penalty);

    // 3. Generate a penalty receipt (optional – use PrinterService)
    try {
      const printerService = require("../services/Printer");
      // You could create a receipt method specifically for penalties, or reuse printReceipt.
      await printerService.printReceipt(debt.id); // or a custom penalty receipt
    } catch (err) {
      logger.warn(`Failed to print penalty receipt:`, err);
    }

    // 4. Notify debtor (in‑app)
    if (debt.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Penalty Applied",
          message: `A penalty of ${penalty.amount} has been added to your debt "${debt.name}". New balance: ${debt.remainingAmount}.`,
          type: "info",
          metadata: { penaltyId: penalty.id, debtId: debt.id },
        },
        user,
        queryRunner
      );
    }

    // 5. Audit log
    await auditLogger.logUpdate("PenaltyTransaction", penalty.id, { status: "pending" }, { status: "collected" }, user);
    await auditLogger.logUpdate("Debt", debt.id, { remainingAmount: debt.remainingAmount - penalty.amount }, { remainingAmount: debt.remainingAmount }, user);
  }

  /**
   * Reverse a penalty (if applied by mistake)
   */
  async onReverse(penalty, user = "system", queryRunner = null) {
    logger.info(`[Transition] Reversing penalty #${penalty.id} by ${user}`);

    const penaltyRepo = this._getRepo(PenaltyTransaction, queryRunner);
    const debtRepo = this._getRepo(Debt, queryRunner);
    const debt = penalty.debt;

    if (!debt) throw new Error("Penalty has no associated debt");

    // 1. Subtract penalty amount from debt remainingAmount (if it was collected)
    if (penalty.status === "collected") {
      debt.remainingAmount -= penalty.amount;
      if (debt.remainingAmount < 0) debt.remainingAmount = 0;
      debt.updatedAt = new Date();
      await debtRepo.save(debt);
    }

    // 2. Mark penalty as reversed
    penalty.status = "reversed";
    penalty.updatedAt = new Date();
    await penaltyRepo.save(penalty);

    // 3. Create a reversal note (audit log)
    await auditLogger.logUpdate("PenaltyTransaction", penalty.id, { status: penalty.status === "collected" ? "collected" : "pending" }, { status: "reversed" }, user);
    if (penalty.status === "collected") {
      await auditLogger.logUpdate("Debt", debt.id, { remainingAmount: debt.remainingAmount + penalty.amount }, { remainingAmount: debt.remainingAmount }, user);
    }

    // 4. Notify debtor
    if (debt.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Penalty Reversed",
          message: `The penalty of ${penalty.amount} on debt "${debt.name}" has been reversed.`,
          type: "info",
          metadata: { penaltyId: penalty.id, debtId: debt.id },
        },
        user,
        queryRunner
      );
    }
  }
}

module.exports = { PenaltyTransactionStateTransitionService };