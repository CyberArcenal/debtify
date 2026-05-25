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
const notificationService = require("../services/Notification");
const { reminderLogService } = require("../services/ReminderLog");

class DebtStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.debtRepo = dataSource.getRepository(Debt);
  }

  _getRepo(qr, entityClass) {
    if (qr) return qr.manager.getRepository(entityClass);
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

  /**
   * Send email via ReminderLogService (queues and logs automatically)
   */
  async _sendEmail(recipient, subject, message, user, queryRunner) {
    try {
      await reminderLogService.createReminder(
        {
          to: recipient,
          subject,
          html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
          text: message,
        },
        user,
        queryRunner,
      );
      return true;
    } catch (err) {
      logger.error(`Failed to queue email to ${recipient}:`, err);
      throw err;
    }
  }

  async _sendSms(phoneNumber, message, user, queryRunner) {
    // Placeholder – actual SMS sending would go through a similar ReminderSmsService
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    return true;
  }

  async onPaid(debt, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Marking debt #${debt.id} as paid by ${user}`);

    // ✅ Reload debt with borrower
    const debtWithBorrower = await this._getDebtWithBorrower(debt.id, queryRunner);
    const debtRepo = this._getRepo(queryRunner, Debt);
    const notifRepo = this._getRepo(queryRunner, Notification);

    // Update debt status to paid (skipSignal to prevent recursion)
    debtWithBorrower.status = "paid";
    debtWithBorrower.updatedAt = new Date();
    const savedDebt = await updateDb(debtRepo, debtWithBorrower, {
      queryRunner: queryRunner,
      skipSignal: true,
    });

    // Mark all unread notifications for this debt as read
    const unreadNotifs = await notifRepo.find({
      where: { debt: { id: debt.id }, isRead: false },
    });
    for (const notif of unreadNotifs) {
      notif.isRead = true;
      notif.updatedAt = new Date();
      await updateDb(notifRepo, notif, { queryRunner, skipSignal: true });
    }

    // Print receipt (optional) – no afterCommit (SQLite), use setTimeout
    try {
      const printerService = require("../services/Printer");
      setTimeout(async () => {
        try {
          await printerService.printReceipt(debt.id, queryRunner);
        } catch (err) {
          logger.warn(`Failed to print receipt after commit:`, err);
        }
      }, 0);
    } catch (err) {
      logger.warn(`Failed to schedule receipt printing:`, err);
    }

    // Update credit score
    try {
      const creditCheckService = require("../services/CreditCheck");
      if (debtWithBorrower.borrower?.id) {
        await creditCheckService.performCreditCheck(
          debtWithBorrower.borrower.id,
          user,
          queryRunner,
        );
      } else {
        logger.warn(`Cannot update credit score: debtor ID missing for debt #${debt.id}`);
      }
    } catch (err) {
      logger.warn(
        `Failed to update credit score for borrower #${debtWithBorrower.borrower?.id}:`,
        err,
      );
    }

    // In-app notification
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Complete",
        message: `Debt "${debtWithBorrower.name}" has been fully paid. Thank you!`,
        type: "info",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS via ReminderLogService
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debtWithBorrower.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debtWithBorrower.borrower.email,
        "Payment Complete",
        `Dear ${debtWithBorrower.borrower.name},\n\nYour debt "${debtWithBorrower.name}" has been fully paid. Thank you!`,
        user,
        queryRunner,
      );
    }
    if (debtWithBorrower.borrower?.contact && canSendSms) {
      await this._sendSms(
        debtWithBorrower.borrower.contact,
        `Dear ${debtWithBorrower.borrower.name}, your debt "${debtWithBorrower.name}" is fully paid. Thank you!`,
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

    // ✅ Reload debt with borrower
    const debtWithBorrower = await this._getDebtWithBorrower(debt.id, queryRunner);
    const debtRepo = this._getRepo(queryRunner, Debt);
    const penaltyRepo = this._getRepo(queryRunner, PenaltyTransaction);

    debtWithBorrower.status = "overdue";
    debtWithBorrower.updatedAt = new Date();
    const savedDebt = await updateDb(debtRepo, debtWithBorrower, {
      queryRunner: queryRunner,
      skipSignal: true,
    });

    // Auto-penalty
    const autoPenalty = await enableAutoPenalty();
    if (autoPenalty) {
      const graceDays = await penaltyGraceDays();
      const dueDate = new Date(debtWithBorrower.dueDate);
      const today = new Date();
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      if (daysOverdue > graceDays) {
        const penaltyRate = await defaultPenaltyRate();
        let penaltyAmount = 0;
        const calcMethod = await penaltyCalculationMethod();
        if (calcMethod === "percentage") {
          penaltyAmount = debtWithBorrower.remainingAmount * (penaltyRate / 100);
        } else {
          penaltyAmount = penaltyRate;
        }
        if (penaltyAmount > 0) {
          const penalty = penaltyRepo.create({
            amount: penaltyAmount,
            penaltyDate: new Date(),
            reason: `Auto‑penalty for overdue (${daysOverdue} days)`,
            debt: debtWithBorrower,
          });
          await saveDb(penaltyRepo, penalty, { queryRunner, skipSignal: true });
          logger.info(`Applied penalty of ${penaltyAmount} to debt #${debt.id}`);
        }
      }
    }

    // In-app notification
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Overdue",
        message: `Debt "${debtWithBorrower.name}" is now overdue. Please settle immediately.`,
        type: "info",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debtWithBorrower.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debtWithBorrower.borrower.email,
        "Payment Overdue",
        `Dear ${debtWithBorrower.borrower.name},\n\nYour payment for debt "${debtWithBorrower.name}" is now overdue. Please settle immediately.`,
        user,
        queryRunner,
      );
    }
    if (debtWithBorrower.borrower?.contact && canSendSms) {
      await this._sendSms(
        debtWithBorrower.borrower.contact,
        `Dear ${debtWithBorrower.borrower.name}, your payment for debt "${debtWithBorrower.name}" is overdue.`,
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
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Marking debt #${debt.id} as defaulted by ${user}`);

    // ✅ Reload debt with borrower
    const debtWithBorrower = await this._getDebtWithBorrower(debt.id, queryRunner);
    const debtRepo = this._getRepo(queryRunner, Debt);

    debtWithBorrower.status = "defaulted";
    debtWithBorrower.updatedAt = new Date();
    const savedDebt = await updateDb(debtRepo, debtWithBorrower, {
      queryRunner: queryRunner,
      skipSignal: true,
    });

    // In-app notification for debtor
    await notificationService.create(
      {
        userId: 1,
        title: "Final Default Notice",
        message: `Debt "${debtWithBorrower.name}" has been declared in default. Legal action may follow.`,
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
        message: `Debt #${debt.id} (${debtWithBorrower.name}) for borrower ${debtWithBorrower.borrower?.name || "Unknown"} has been defaulted. Please review.`,
        type: "error",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debtWithBorrower.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debtWithBorrower.borrower.email,
        "Final Default Notice",
        `Dear ${debtWithBorrower.borrower.name},\n\nYour debt "${debtWithBorrower.name}" has been declared in default. Legal action may follow.`,
        user,
        queryRunner,
      );
    }
    if (debtWithBorrower.borrower?.contact && canSendSms) {
      await this._sendSms(
        debtWithBorrower.borrower.contact,
        `Dear ${debtWithBorrower.borrower.name}, your debt "${debtWithBorrower.name}" is now in default.`,
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
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Restoring debt #${debt.id} to active by ${user}`);

    // ✅ Reload debt with borrower
    const debtWithBorrower = await this._getDebtWithBorrower(debt.id, queryRunner);
    const debtRepo = this._getRepo(queryRunner, Debt);

    debtWithBorrower.status = "active";
    debtWithBorrower.updatedAt = new Date();
    let savedDebt = await updateDb(debtRepo, debtWithBorrower, {
      queryRunner: queryRunner,
      skipSignal: true,
    });

    // Recalculate remaining amount if needed
    const remaining = debtWithBorrower.totalAmount - debtWithBorrower.paidAmount;
    if (remaining !== debtWithBorrower.remainingAmount) {
      debtWithBorrower.remainingAmount = remaining;
      debtWithBorrower.updatedAt = new Date();
      savedDebt = await updateDb(debtRepo, debtWithBorrower, {
        queryRunner: queryRunner,
        skipSignal: true,
      });
    }

    await notificationService.create(
      {
        userId: 1,
        title: "Debt Restored",
        message: `Debt "${debtWithBorrower.name}" has been restored to active status.`,
        type: "info",
        metadata: { debtId: debt.id },
      },
      user,
      queryRunner,
    );

    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (debtWithBorrower.borrower?.email && canSendEmail) {
      await this._sendEmail(
        debtWithBorrower.borrower.email,
        "Debt Restored",
        `Dear ${debtWithBorrower.borrower.name},\n\nYour debt "${debtWithBorrower.name}" has been restored to active status.`,
        user,
        queryRunner,
      );
    }
    if (debtWithBorrower.borrower?.contact && canSendSms) {
      await this._sendSms(
        debtWithBorrower.borrower.contact,
        `Dear ${debtWithBorrower.borrower.name}, your debt "${debtWithBorrower.name}" is now active again.`,
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
    // No debt update here – already done by DebtService.applyForgiveness
    logger.info(`[Transition] Forgiving ${amountForgiven} from debt #${debt.id} by ${user}`);

    // ✅ Reload debt with borrower (para sa email at notification)
    const debtWithBorrower = await this._getDebtWithBorrower(debt.id, queryRunner);

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
        message: `An amount of ${amountForgiven} has been forgiven from debt "${debtWithBorrower.name}". Remaining balance: ${(debtWithBorrower.remainingAmount || 0).toFixed(2)}.`,
        type: "info",
        metadata: { debtId: debt.id, amountForgiven },
      },
      user,
      queryRunner,
    );

    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();

    logger.info(
      `[Forgiveness] Email enabled: ${canSendEmail}, Debtor email: ${debtWithBorrower.borrower?.email || "NONE"}, Debtor name: ${debtWithBorrower.borrower?.name || "Unknown"}`,
    );

    if (debtWithBorrower.borrower?.email && canSendEmail) {
      logger.info(`[Forgiveness] Attempting to send email to ${debtWithBorrower.borrower.email}`);
      await this._sendEmail(
        debtWithBorrower.borrower.email,
        "Debt Forgiveness Applied",
        `Dear ${debtWithBorrower.borrower.name},\n\nAn amount of ${amountForgiven} has been forgiven from your debt "${debtWithBorrower.name}". Remaining balance: ${(debtWithBorrower.remainingAmount || 0).toFixed(2)}.`,
        user,
        queryRunner,
      );
    } else {
      logger.warn(
        `[Forgiveness] Email not sent. Reason: ${!debtWithBorrower.borrower?.email ? "No debtor email" : "Email disabled"}`,
      );
    }

    if (debtWithBorrower.borrower?.contact && canSendSms) {
      await this._sendSms(
        debtWithBorrower.borrower.contact,
        `Dear ${debtWithBorrower.borrower.name}, ${amountForgiven} forgiven from debt "${debtWithBorrower.name}". New balance: ${(debtWithBorrower.remainingAmount || 0).toFixed(2)}.`,
        user,
        queryRunner,
      );
    }
  }
}

module.exports = { DebtStateTransitionService };