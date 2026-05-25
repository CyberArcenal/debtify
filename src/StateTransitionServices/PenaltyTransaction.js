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

  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    return this.dataSource.getRepository(entityClass);
  }

  /**
   * Helper: reload debt with borrower relation (transactional)
   */
  async _getDebtWithBorrower(debtId, queryRunner) {
    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({
      where: { id: debtId },
      relations: ["borrower"],
    });
    if (!debt) throw new Error(`Debt #${debtId} not found`);
    return debt;
  }

  async onWaive(penalty, reason = "", user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Waiving penalty #${penalty.id} by ${user}. Reason: ${reason}`,
    );

    const penaltyRepo = this._getRepo(queryRunner, PenaltyTransaction);
    // Reload debt with borrower for notification
    const debtWithBorrower = await this._getDebtWithBorrower(
      penalty.debt.id,
      queryRunner,
    );
    const debtRepo = this._getRepo(queryRunner, Debt);

    // Mark penalty as waived
    penalty.status = "waived";
    penalty.updatedAt = new Date();
    await updateDb(penaltyRepo, penalty, { queryRunner, skipSignal: true });

    // Audit log
    await auditLogger.logUpdate(
      "PenaltyTransaction",
      penalty.id,
      { status: "pending" },
      { status: "waived", reason },
      user,
    );

    // Notify debtor (in‑app)
    if (debtWithBorrower.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Penalty Waived",
          message: `The penalty of ${penalty.amount} on debt "${debtWithBorrower.name}" has been waived. Reason: ${reason || "N/A"}.`,
          type: "info",
          metadata: { penaltyId: penalty.id, debtId: debtWithBorrower.id },
        },
        user,
        queryRunner,
      );
    }
  }

  async onCollect(penalty, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Collecting penalty #${penalty.id} by ${user}`);

    const penaltyRepo = this._getRepo(queryRunner, PenaltyTransaction);
    const debtRepo = this._getRepo(queryRunner, Debt);
    const debtWithBorrower = await this._getDebtWithBorrower(
      penalty.debt.id,
      queryRunner,
    );

    // Add penalty amount to debt remainingAmount
    debtWithBorrower.remainingAmount += penalty.amount;
    debtWithBorrower.updatedAt = new Date();
    await updateDb(debtRepo, debtWithBorrower, {
      queryRunner,
      skipSignal: true,
    });

    // Mark penalty as collected
    penalty.status = "collected";
    penalty.updatedAt = new Date();
    await updateDb(penaltyRepo, penalty, { queryRunner, skipSignal: true });

    // Print receipt (non-critical, use setTimeout)
    try {
      const printerService = require("../services/Printer");
      setTimeout(async () => {
        try {
          await printerService.printReceipt(debtWithBorrower.id, queryRunner);
        } catch (err) {
          logger.warn(`Failed to print penalty receipt:`, err);
        }
      }, 0);
    } catch (err) {
      logger.warn(`Failed to schedule penalty receipt printing:`, err);
    }

    // Notify debtor (in‑app)
    if (debtWithBorrower.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Penalty Applied",
          message: `A penalty of ${penalty.amount} has been added to your debt "${debtWithBorrower.name}". New balance: ${debtWithBorrower.remainingAmount}.`,
          type: "info",
          metadata: { penaltyId: penalty.id, debtId: debtWithBorrower.id },
        },
        user,
        queryRunner,
      );
    }

    // Audit logs
    await auditLogger.logUpdate(
      "PenaltyTransaction",
      penalty.id,
      { status: "pending" },
      { status: "collected" },
      user,
    );
    await auditLogger.logUpdate(
      "Debt",
      debtWithBorrower.id,
      { remainingAmount: debtWithBorrower.remainingAmount - penalty.amount },
      { remainingAmount: debtWithBorrower.remainingAmount },
      user,
    );
  }

  async onReverse(penalty, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Reversing penalty #${penalty.id} by ${user}`);

    const penaltyRepo = this._getRepo(queryRunner, PenaltyTransaction);
    const debtRepo = this._getRepo(queryRunner, Debt);
    const debtWithBorrower = await this._getDebtWithBorrower(
      penalty.debt.id,
      queryRunner,
    );
    const oldStatus = penalty.status;

    // If penalty was collected, reverse its effect on debt
    if (oldStatus === "collected") {
      debtWithBorrower.remainingAmount -= penalty.amount;
      if (debtWithBorrower.remainingAmount < 0)
        debtWithBorrower.remainingAmount = 0;
      debtWithBorrower.updatedAt = new Date();
      await updateDb(debtRepo, debtWithBorrower, {
        queryRunner,
        skipSignal: true,
      });
    }

    // Mark penalty as reversed
    penalty.status = "reversed";
    penalty.updatedAt = new Date();
    await updateDb(penaltyRepo, penalty, { queryRunner, skipSignal: true });

    // Audit logs
    await auditLogger.logUpdate(
      "PenaltyTransaction",
      penalty.id,
      { status: oldStatus === "collected" ? "collected" : "pending" },
      { status: "reversed" },
      user,
    );
    if (oldStatus === "collected") {
      await auditLogger.logUpdate(
        "Debt",
        debtWithBorrower.id,
        { remainingAmount: debtWithBorrower.remainingAmount + penalty.amount },
        { remainingAmount: debtWithBorrower.remainingAmount },
        user,
      );
    }

    // Notify debtor
    if (debtWithBorrower.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Penalty Reversed",
          message: `The penalty of ${penalty.amount} on debt "${debtWithBorrower.name}" has been reversed.`,
          type: "info",
          metadata: { penaltyId: penalty.id, debtId: debtWithBorrower.id },
        },
        user,
        queryRunner,
      );
    }
  }
}

module.exports = { PenaltyTransactionStateTransitionService };
