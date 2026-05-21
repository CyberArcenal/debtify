// src/services/BorrowerStateTransitionService.js
//@ts-check
const Borrower = require("../entities/Borrower");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const { emailEnabled, smsEnabled } = require("../utils/system");
const { NotificationLogService } = require("../services/NotificationLog");
const notificationService = require("../services/Notification");

class BorrowerStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.borrowerRepo = dataSource.getRepository(Borrower);
    this.notificationLogService = new NotificationLogService();
  }

  /**
   * Helper to send an email via NotificationLogService
   */
  async _sendEmail(recipient, subject, message, user, queryRunner) {
    const logService = this.notificationLogService;
    // Create a queued log entry
    const logResult = await logService.createLog(
      { to: recipient, subject, html: message },
      user,
      queryRunner
    );
    if (!logResult.status) {
      logger.error(`Failed to create email log: ${logResult.message}`);
      return false;
    }
    // Trigger actual sending (retry function attempts delivery)
    const sendResult = await logService.retryFailedNotification(
      { id: logResult.data.id },
      user,
      queryRunner
    );
    return sendResult.status;
  }

  /**
   * Helper to send an SMS (placeholder – integrate with real SMS provider)
   */
  async _sendSms(phoneNumber, message, user, queryRunner) {
    // For now, just log; implement using NotificationLogService with an SMS channel later
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    // You could create a NotificationLog with a different channel.
    // For simplicity, we return true.
    return true;
  }

  /**
   * Activate a borrower (set deletedAt = null)
   */
  async onActivate(borrower, user = "system", queryRunner = null) {
    logger.info(`[Transition] Activating borrower #${borrower.id} by ${user}`);

    const repo = queryRunner
      ? queryRunner.manager.getRepository(Borrower)
      : this.borrowerRepo;

    // 1. Set deletedAt = null
    borrower.deletedAt = null;
    await repo.save(borrower);

    // 2. Audit log
    await auditLogger.logUpdate(
      "Borrower", borrower.id,
      { deletedAt: true }, { deletedAt: null }, user
    );

    // 3. Send in‑app notification (always)
    await notificationService.create(
      {
        userId: 1,
        title: "Account Reactivated",
        message: `Borrower "${borrower.name}" has been reactivated.`,
        type: "info",
        metadata: { borrowerId: borrower.id },
      },
      user,
      queryRunner
    );

    // 4. Send email/SMS if enabled and contact exists
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();

    if (canSendEmail && borrower.email) {
      const subject = "Account Reactivated";
      const msg = `Dear ${borrower.name}, your account has been reactivated. You may now apply for new loans.`;
      await this._sendEmail(borrower.email, subject, msg, user, queryRunner);
    }

    if (canSendSms && borrower.contact) {
      const msg = `Dear ${borrower.name}, your account has been reactivated.`;
      await this._sendSms(borrower.contact, msg, user, queryRunner);
    }
  }

  /**
   * Deactivate (soft delete) a borrower
   */
  async onDeactivate(borrower, user = "system", queryRunner = null) {
    logger.info(`[Transition] Deactivating borrower #${borrower.id} by ${user}`);

    const repo = queryRunner
      ? queryRunner.manager.getRepository(Borrower)
      : this.borrowerRepo;

    // 1. Set deletedAt = now
    borrower.deletedAt = new Date();
    await repo.save(borrower);

    // 2. Audit log
    await auditLogger.logDelete("Borrower", borrower.id, { deletedAt: true }, user);

    // 3. Mark all active debts as defaulted
    const Debt = require("../entities/Debt");
    const debtRepo = queryRunner
      ? queryRunner.manager.getRepository(Debt)
      : this.dataSource.getRepository(Debt);
    await debtRepo.update(
      { borrower: { id: borrower.id }, status: "active" },
      { status: "defaulted", updatedAt: new Date() }
    );

    // 4. Log warning for internal collection team
    logger.warn(`[Collections] Borrower #${borrower.id} deactivated. All active debts set to defaulted.`);

    // 5. In‑app notification (for admin / internal)
    await notificationService.create(
      {
        userId: 1,
        title: "Borrower Deactivated",
        message: `Borrower "${borrower.name}" (ID: ${borrower.id}) has been deactivated. All active debts have been marked as defaulted.`,
        type: "info",
        metadata: { borrowerId: borrower.id },
      },
      user,
      queryRunner
    );
  }

  /**
   * Merge duplicate borrower into another
   */
  async onMerge(sourceBorrower, targetBorrower, user = "system", queryRunner = null) {
    logger.info(`[Transition] Merging borrower #${sourceBorrower.id} into #${targetBorrower.id} by ${user}`);

    if (!queryRunner) {
      throw new Error("Merge must be performed within a transaction. Provide queryRunner.");
    }

    const { manager } = queryRunner;

    // 1. Reassign related entities
    const Debt = require("../entities/Debt");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const LoanAgreement = require("../entities/LoanAgreement");
    const Notification = require("../entities/Notification");

    await manager.update(Debt, { borrower: { id: sourceBorrower.id } }, { borrower: targetBorrower });
    await manager.update(PaymentTransaction, { debt: { borrower: { id: sourceBorrower.id } } }, { debt: { borrower: targetBorrower } });
    await manager.update(PenaltyTransaction, { debt: { borrower: { id: sourceBorrower.id } } }, { debt: { borrower: targetBorrower } });
    await manager.update(LoanAgreement, { debt: { borrower: { id: sourceBorrower.id } } }, { debt: { borrower: targetBorrower } });
    await manager.update(Notification, { debt: { borrower: { id: sourceBorrower.id } } }, { debt: { borrower: targetBorrower } });

    // 2. Audit logs
    await auditLogger.logUpdate("Borrower", sourceBorrower.id, { mergedInto: targetBorrower.id }, { message: "Merged into target" }, user);
    await auditLogger.logUpdate("Borrower", targetBorrower.id, { sourceMerged: sourceBorrower.id }, { message: "Received merged data" }, user);

    // 3. Keep source borrower as inactive with a note
    sourceBorrower.deletedAt = new Date();
    sourceBorrower.notes = sourceBorrower.notes
      ? `${sourceBorrower.notes}\n[Merged into borrower #${targetBorrower.id} on ${new Date().toISOString()}]`
      : `[Merged into borrower #${targetBorrower.id} on ${new Date().toISOString()}]`;
    await manager.save(sourceBorrower);

    // 4. In‑app notifications (always)
    await notificationService.create(
      {
        userId: 1,
        title: "Account Merged",
        message: `Borrower #${sourceBorrower.id} has been merged into #${targetBorrower.id}.`,
        type: "info",
        metadata: { sourceId: sourceBorrower.id, targetId: targetBorrower.id },
      },
      user,
      queryRunner
    );

    // 5. Email notifications if enabled and emails exist
    const canSendEmail = await emailEnabled();
    if (canSendEmail) {
      if (sourceBorrower.email) {
        await this._sendEmail(
          sourceBorrower.email,
          "Account Merged",
          `Your account has been merged into borrower #${targetBorrower.id} (${targetBorrower.name}). Please use that account for future transactions.`,
          user,
          queryRunner
        );
      }
      if (targetBorrower.email) {
        await this._sendEmail(
          targetBorrower.email,
          "Account Merged",
          `Borrower #${sourceBorrower.id} (${sourceBorrower.name}) has been merged into your account. All debts and transactions have been transferred.`,
          user,
          queryRunner
        );
      }
    }
  }
}

module.exports = { BorrowerStateTransitionService };