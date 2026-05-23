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
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.debtRepo = dataSource.getRepository(Debt);
    this.notificationLogService = new NotificationLogService();
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner|null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository}
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    return this.dataSource.getRepository(entityClass);
  }

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

  async _sendSms(phoneNumber, message, user, queryRunner) {
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    return true;
  }

  async onPaid(debt, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Marking debt #${debt.id} as paid by ${user}`);

    const debtRepo = this._getRepo(queryRunner, Debt);
    const notifRepo = this._getRepo(queryRunner, Notification);

    // Update debt status to paid
    debt.status = "paid";
    debt.updatedAt = new Date();
    const savedDebt = await updateDb(debtRepo, debt); // no extra args

    // Mark all unread notifications for this debt as read
    const unreadNotifs = await notifRepo.find({
      where: { debt: { id: debt.id }, isRead: false },
    });
    for (const notif of unreadNotifs) {
      notif.isRead = true;
      notif.updatedAt = new Date();
      await updateDb(notifRepo, notif);
    }

    // Print receipt (optional)
    try {
      const printerService = require("../services/Printer");
      await printerService.printReceipt(debt.id);
    } catch (err) {
      logger.warn(`Failed to print receipt for debt #${debt.id}:`, err);
    }

    // Update credit score
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

    // In-app notification
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

    // Email/SMS
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

    return savedDebt;
  }

  async onOverdue(debt, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Marking debt #${debt.id} as overdue by ${user}`);

    const debtRepo = this._getRepo(queryRunner, Debt);
    const penaltyRepo = this._getRepo(queryRunner, PenaltyTransaction);

    debt.status = "overdue";
    debt.updatedAt = new Date();
    const savedDebt = await updateDb(debtRepo, debt);

    // Auto-penalty
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
          await saveDb(penaltyRepo, penalty);
          logger.info(
            `Applied penalty of ${penaltyAmount} to debt #${debt.id}`,
          );
        }
      }
    }

    // In-app notification
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

    return savedDebt;
  }

  async onDefaulted(debt, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Marking debt #${debt.id} as defaulted by ${user}`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);

    debt.status = "defaulted";
    debt.updatedAt = new Date();
    const savedDebt = await updateDb(debtRepo, debt);

    // In-app notification for debtor
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

    return savedDebt;
  }

  async onRestoreToActive(debt, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Restoring debt #${debt.id} to active by ${user}`);

    const debtRepo = this._getRepo(queryRunner, Debt);

    debt.status = "active";
    debt.updatedAt = new Date();
    let savedDebt = await updateDb(debtRepo, debt);

    // Recalculate remaining amount if needed
    const remaining = debt.totalAmount - debt.paidAmount;
    if (remaining !== debt.remainingAmount) {
      debt.remainingAmount = remaining;
      debt.updatedAt = new Date();
      savedDebt = await updateDb(debtRepo, debt);
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

    return savedDebt;
  }

  async onForgiveness(
    debt,
    amountForgiven,
    user = "system",
    queryRunner = null,
    reason = null,
  ) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Forgiving ${amountForgiven} from debt #${debt.id} by ${user}`,
    );

    // ❌ DO NOT UPDATE THE DEBT HERE – it's already updated by DebtService.applyForgiveness

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

    return debt;
  }
}

module.exports = { DebtStateTransitionService };
