// src/services/DebtStateTransitionService.js
const Debt = require("../entities/Debt");
const PenaltyTransaction = require("../entities/PenaltyTransaction");
const Notification = require("../entities/Notification");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const {
  enableAutoPenalty,
  defaultPenaltyRate,
  penaltyCalculationMethod,
  penaltyGraceDays,
  emailEnabled,
  smsEnabled,
} = require("../utils/system");
const { NotificationLogService } = require("../services/NotificationLog");
const notificationService = require("../services/Notification");

class DebtStateTransitionService {
  /**
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; name: unknown; totalAmount: unknown; paidAmount: unknown; remainingAmount: unknown; dueDate: unknown; status: unknown; interestRate: unknown; penaltyRate: unknown; deletedAt: unknown; createdAt: unknown; updatedAt: unknown; }>) => any; }} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.debtRepo = dataSource.getRepository(Debt);
    this.notificationLogService = new NotificationLogService();
  }

  /**
   * @param {import("typeorm").EntitySchema<{ id: unknown; name: unknown; totalAmount: unknown; paidAmount: unknown; remainingAmount: unknown; dueDate: unknown; status: unknown; interestRate: unknown; penaltyRate: unknown; deletedAt: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; title: unknown; message: unknown; type: unknown; isRead: unknown; scheduledFor: unknown; deletedAt: unknown; createdAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; amount: unknown; penaltyDate: unknown; reason: unknown; deletedAt: unknown; createdAt: unknown; }>} entity
   * @param {{ manager: { getRepository: (arg0: any) => any; }; } | null} queryRunner
   */
  _getRepo(entity, queryRunner) {
    return queryRunner
      ? queryRunner.manager.getRepository(entity)
      : this.dataSource.getRepository(entity);
  }

  /**
   * @param {any} recipient
   * @param {string} subject
   * @param {string} message
   * @param {string | undefined} user
   * @param {import("typeorm").QueryRunner | null | undefined} queryRunner
   */
  async _sendEmail(recipient, subject, message, user, queryRunner) {
    const logService = this.notificationLogService;
    const logResult = await logService.createLog(
      { to: recipient, subject, html: message },
      user,
      queryRunner,
    );
    if (!logResult.status) {
      logger.error(`Failed to create email log: ${logResult.message}`);
      return false;
    }
    const sendResult = await logService.retryFailedNotification(
      { id: logResult.data.id },
      user,
      queryRunner,
    );
    return sendResult.status;
  }

  /**
   * @param {any} phoneNumber
   * @param {string} message
   * @param {string} user
   * @param {null} queryRunner
   */
  async _sendSms(phoneNumber, message, user, queryRunner) {
    // Placeholder – integrate with actual SMS channel via NotificationLogService
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    return true;
  }

  /**
   * @param {{ id: any; status: string; updatedAt: Date; borrower: { id: number; email: any; name: any; contact: any; }; name: any; }} debt
   */
  async onPaid(debt, user = "system", queryRunner = null) {
    logger.info(`[Transition] Marking debt #${debt.id} as paid by ${user}`);

    const debtRepo = this._getRepo(Debt, queryRunner);
    const notifRepo = this._getRepo(Notification, queryRunner);

    debt.status = "paid";
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    await notifRepo.update(
      { debt: { id: debt.id }, isRead: false },
      { isRead: true, updatedAt: new Date() },
    );

    try {
      const printerService = require("../services/Printer");
      await printerService.printReceipt(debt.id);
    } catch (err) {
      logger.warn(`Failed to print receipt for debt #${debt.id}:`, err);
    }

    try {
      const creditCheckService = require("../services/CreditCheck");
      await creditCheckService.performCreditCheck(
        debt.borrower?.id,
        user,
        queryRunner,
      );
    } catch (err) {
      logger.warn(
        `Failed to update credit score for borrower #${debt.borrower?.id}:`,
        err,
      );
    }

    // In‑app notification
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Complete",
        message: `Debt "${debt.name}" has been fully paid. Thank you!`,
        type: "info",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS if enabled
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debt.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debt.borrower.email,
        "Payment Complete",
        `Dear ${debt.borrower.name}, your debt "${debt.name}" has been fully paid. Thank you!`,
        user,
        queryRunner,
      );
    }
    if (debt.borrower?.contact && canSendSms) {
      await this._sendSms(
        debt.borrower.contact,
        `Dear ${debt.borrower.name}, your debt "${debt.name}" is fully paid. Thank you!`,
        user,
        queryRunner,
      );
    }

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { status: "active" },
      { status: "paid" },
      user,
    );
  }

  /**
   * @param {{ id: any; status: string; updatedAt: Date; dueDate: string | number | Date; remainingAmount: number; name: any; borrower: { email: any; name: any; contact: any; }; }} debt
   */
  async onOverdue(debt, user = "system", queryRunner = null) {
    logger.info(`[Transition] Marking debt #${debt.id} as overdue by ${user}`);

    const debtRepo = this._getRepo(Debt, queryRunner);
    const penaltyRepo = this._getRepo(PenaltyTransaction, queryRunner);

    debt.status = "overdue";
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    // Auto‑penalty
    const autoPenalty = await enableAutoPenalty();
    if (autoPenalty) {
      const graceDays = await penaltyGraceDays();
      const dueDate = new Date(debt.dueDate);
      const today = new Date();
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      if (daysOverdue > graceDays) {
        const penaltyRate = await defaultPenaltyRate();
        let penaltyAmount = 0;
        const calcMethod = await penaltyCalculationMethod();
        if (calcMethod === "percentage") {
          penaltyAmount = debt.remainingAmount * (penaltyRate / 100);
        } else {
          penaltyAmount = penaltyRate;
        }
        if (penaltyAmount > 0) {
          const penalty = penaltyRepo.create({
            amount: penaltyAmount,
            penaltyDate: new Date(),
            reason: `Auto‑penalty for overdue (${daysOverdue} days)`,
            debt,
          });
          await penaltyRepo.save(penalty);
          logger.info(
            `Applied penalty of ${penaltyAmount} to debt #${debt.id}`,
          );
        }
      }
    }

    // In‑app notification
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Overdue",
        message: `Debt "${debt.name}" is now overdue. Please settle immediately.`,
        type: "info",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debt.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debt.borrower.email,
        "Payment Overdue",
        `Dear ${debt.borrower.name}, your payment for debt "${debt.name}" is now overdue. Please settle immediately.`,
        user,
        queryRunner,
      );
    }
    if (debt.borrower?.contact && canSendSms) {
      await this._sendSms(
        debt.borrower.contact,
        `Dear ${debt.borrower.name}, your payment for debt "${debt.name}" is overdue.`,
        user,
        queryRunner,
      );
    }

    logger.info(`[Collections] Debt #${debt.id} added to overdue list.`);
    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { status: "active" },
      { status: "overdue" },
      user,
    );
  }

  /**
   * @param {{ id: any; status: string; updatedAt: Date; name: any; borrower: { name: any; email: any; contact: any; }; }} debt
   */
  async onDefaulted(debt, user = "system", queryRunner = null) {
    logger.info(
      `[Transition] Marking debt #${debt.id} as defaulted by ${user}`,
    );

    const debtRepo = this._getRepo(Debt, queryRunner);

    debt.status = "defaulted";
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    // In‑app notification for debtor
    await notificationService.create(
      {
        userId: 1,
        title: "Final Default Notice",
        message: `Debt "${debt.name}" has been declared in default. Legal action may follow.`,
        type: "error",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Internal admin notification
    await notificationService.create(
      {
        userId: 1,
        title: "Debt Defaulted – Legal Action Required",
        message: `Debt #${debt.id} (${debt.name}) for borrower ${debt.borrower?.name} has been defaulted. Please review.`,
        type: "error",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS to debtor
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debt.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debt.borrower.email,
        "Final Default Notice",
        `Dear ${debt.borrower.name}, your debt "${debt.name}" has been declared in default. Legal action may follow.`,
        user,
        queryRunner,
      );
    }
    if (debt.borrower?.contact && canSendSms) {
      await this._sendSms(
        debt.borrower.contact,
        `Dear ${debt.borrower.name}, your debt "${debt.name}" is now in default.`,
        user,
        queryRunner,
      );
    }

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { status: "overdue" },
      { status: "defaulted" },
      user,
    );
  }

  /**
   * @param {{ id: any; status: string; updatedAt: Date; totalAmount: number; paidAmount: number; remainingAmount: number; name: any; borrower: { email: any; name: any; contact: any; }; }} debt
   */
  async onRestoreToActive(debt, user = "system", queryRunner = null) {
    logger.info(`[Transition] Restoring debt #${debt.id} to active by ${user}`);

    const debtRepo = this._getRepo(Debt, queryRunner);

    debt.status = "active";
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    const remaining = debt.totalAmount - debt.paidAmount;
    if (remaining !== debt.remainingAmount) {
      debt.remainingAmount = remaining;
      await debtRepo.save(debt);
    }

    await notificationService.create(
      {
        userId: 1,
        title: "Debt Restored",
        message: `Debt "${debt.name}" has been restored to active status.`,
        type: "info",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debt.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debt.borrower.email,
        "Debt Restored",
        `Dear ${debt.borrower.name}, your debt "${debt.name}" has been restored to active status.`,
        user,
        queryRunner,
      );
    }
    if (debt.borrower?.contact && canSendSms) {
      await this._sendSms(
        debt.borrower.contact,
        `Dear ${debt.borrower.name}, your debt "${debt.name}" is now active again.`,
        user,
        queryRunner,
      );
    }

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { status: "inactive" },
      { status: "active" },
      user,
    );
  }

  /**
   * @param {{ id: any; totalAmount: number; remainingAmount: number; paidAmount: number; updatedAt: Date; name: any; borrower: { email: any; name: any; contact: any; }; }} debt
   * @param {number} amountForgiven
   */
  async onForgiveness(
    debt,
    amountForgiven,
    user = "system",
    queryRunner = null,
    reason = null,
  ) {
    logger.info(
      `[Transition] Forgiving ${amountForgiven} from debt #${debt.id} by ${user}`,
    );

    const debtRepo = this._getRepo(Debt, queryRunner);

    debt.totalAmount -= amountForgiven;
    if (debt.totalAmount < 0) debt.totalAmount = 0;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    const note = reason || "Debt forgiveness applied";
    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { forgivenessAmount: amountForgiven },
      { note },
      user,
    );

    await notificationService.create(
      {
        userId: 1,
        title: "Debt Forgiveness Applied",
        message: `An amount of ${amountForgiven} has been forgiven from debt "${debt.name}". Remaining balance: ${debt.remainingAmount}.`,
        type: "info",
        metadata: { debtId: debt.id, amountForgiven },
      },
      user,
      queryRunner,
    );

    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debt.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debt.borrower.email,
        "Debt Forgiveness Applied",
        `Dear ${debt.borrower.name}, an amount of ${amountForgiven} has been forgiven from your debt "${debt.name}". Remaining balance: ${debt.remainingAmount}.`,
        user,
        queryRunner,
      );
    }
    if (debt.borrower?.contact && canSendSms) {
      await this._sendSms(
        debt.borrower.contact,
        `Dear ${debt.borrower.name}, ${amountForgiven} forgiven from debt "${debt.name}". New balance: ${debt.remainingAmount}.`,
        user,
        queryRunner,
      );
    }
  }
}

module.exports = { DebtStateTransitionService };
