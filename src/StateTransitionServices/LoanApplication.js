// src/services/LoanApplicationStateTransitionService.js
//@ts-check
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const {
  enforceCreditCheck,
  emailEnabled,
  smsEnabled,
  requireLoanAgreement,
  loanAgreementTemplate,
  defaultPenaltyRate,
} = require("../utils/system");
const notificationService = require("../services/Notification");
const debtService = require("../services/Debt");
const { reminderLogService } = require("../services/ReminderLog");

class LoanApplicationStateTransitionService {
  /**
   * @param {{ getRepository: (arg0: any) => any; }} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.appRepo = dataSource.getRepository(
      require("../entities/LoanApplication"),
    );
  }

  /**
   * Helper: get repository (transactional)
   * @param {any} entity
   * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
   */
  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Send email via ReminderLogService (queues and logs automatically)
   * @param {any} recipient
   * @param {string} subject
   * @param {string} message
   * @param {string | undefined} user
   * @param {import("typeorm").QueryRunner | null | undefined} queryRunner
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
      // @ts-ignore
      logger.error(`Failed to queue email to ${recipient}:`, err);
     throw err;
    }
  }

  /**
   * @param {any} phoneNumber
   * @param {string} message
   * @param {string} user
   * @param {null} queryRunner
   */
  // @ts-ignore
  async _sendSms(phoneNumber, message, user, queryRunner) {
    // Placeholder – integrate with actual SMS channel via NotificationLogService
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    return true;
  }

  /**
   * Called when a loan application is submitted (afterInsert)
   * @param {{ id: any; debtorName: any; requestedAmount: any; debtorId: number; }} application
   */
  async onSubmit(application, user = "system", queryRunner = null) {
    logger.info(
      `[LoanApplication] Application #${application.id} (debtor: ${application.debtorName}) submitted by ${user}`,
    );

    // In‑app notification to loan officer
    await notificationService.create(
      {
        userId: 1,
        title: "New Loan Application",
        message: `New loan application (#${application.id}) from ${application.debtorName}. Amount: ${application.requestedAmount}.`,
        type: "info",
        metadata: { applicationId: application.id },
      },
      user,
      queryRunner,
    );

    const needCreditCheck = await enforceCreditCheck();
    if (needCreditCheck && application.debtorId) {
      try {
        const creditCheckService = require("../services/CreditCheck");
        await creditCheckService.performCreditCheck(
          application.debtorId,
          user,
          queryRunner,
        );
        logger.info(
          `Credit check triggered for debtor #${application.debtorId}`,
        );
      } catch (err) {
        // @ts-ignore
        logger.error("Failed to trigger credit check on submission:", err);
      }
    }
  }

  /**
   * Called when an application is approved (afterUpdate status → approved)
   * This is where the active debt is created (side effect).
   * @param {{ id: any; purpose: any; requestedAmount: any; proposedDueDate: { toISOString: () => string; }; interestRate: any; debtorId: any; debtorEmail: any; debtorName: any; debtorContact: any; }} application
   */
  async onApprove(application, user = "system", queryRunner = null) {
    logger.info(
      `[LoanApplication] Application #${application.id} approved by ${user}`,
    );

    // 1. Create active debt using debtService (within same transaction if queryRunner provided)
    const penaltyRate = await defaultPenaltyRate();
    const debtData = {
      name: `Loan: ${application.purpose}`,
      totalAmount: application.requestedAmount,
      paidAmount: 0,
      dueDate: application.proposedDueDate.toISOString().split("T")[0],
      status: "active",
      interestRate: application.interestRate, // already set during approval
      penaltyRate: penaltyRate,
      borrowerId: application.debtorId,
    };
    const createdDebt = await debtService.create(debtData, user, queryRunner);
    logger.info(
      `Created active debt #${createdDebt.id} for application #${application.id}`,
    );

    // 2. In‑app notification to debtor
    await notificationService.create(
      {
        userId: 1,
        title: "Loan Approved",
        message: `Your loan application (${application.purpose}) has been approved. An active debt has been created.`,
        type: "info",
        metadata: { applicationId: application.id, debtId: createdDebt.id },
      },
      user,
      queryRunner,
    );

    // 3. Email/SMS if enabled
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (application.debtorEmail && canSendEmail) {
      await this._sendEmail(
        application.debtorEmail,
        "Loan Approved",
        `Dear ${application.debtorName}, your loan application (${application.purpose}) has been approved.`,
        user,
        queryRunner,
      );
    }
    if (application.debtorContact && canSendSms) {
      await this._sendSms(
        application.debtorContact,
        `Dear ${application.debtorName}, your loan application has been approved.`,
        user,
        queryRunner,
      );
    }

    // 4. Generate loan agreement if required
    if (await requireLoanAgreement()) {
      logger.info(
        `Loan agreement should be generated for application #${application.id} using template: ${await loanAgreementTemplate()}`,
      );
      // TODO: actual PDF generation and storage (could call another service)
    }

    // 5. Audit log already recorded by subscriber, but we add an extra log for the created debt
    await auditLogger.logCreate("Debt", createdDebt.id, createdDebt, user);
  }

  /**
   * Called when an application is rejected (afterUpdate status → rejected)
   * @param {{ id: any; debtorEmail: any; debtorName: any; debtorContact: any; }} application
   */
  async onReject(
    application,
    reason = null,
    user = "system",
    queryRunner = null,
  ) {
    logger.info(
      `[LoanApplication] Application #${application.id} rejected by ${user} (reason: ${reason || "none"})`,
    );

    // The service already updated status, rejectionReason and rejectedAt.
    // Here we only send notifications and audit.

    // In‑app notification to debtor
    let message = `Your loan application has been rejected.`;
    if (reason) message += ` Reason: ${reason}`;
    await notificationService.create(
      {
        userId: 1,
        title: "Loan Rejected",
        message,
        type: "error",
        metadata: { applicationId: application.id, reason },
      },
      user,
      queryRunner,
    );

    // Email/SMS
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();
    if (application.debtorEmail && canSendEmail) {
      await this._sendEmail(
        application.debtorEmail,
        "Loan Rejected",
        `Dear ${application.debtorName}, your loan application has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
        user,
        queryRunner,
      );
    }
    if (application.debtorContact && canSendSms) {
      await this._sendSms(
        application.debtorContact,
        `Your loan application has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
        user,
        queryRunner,
      );
    }

    // If application was soft‑deleted as part of rejection, we don't need to delete again.
    // Audit log is already recorded by subscriber after update.
  }

  /**
   * Called when a rejected application is reopened (status back to pending)
   * @param {{ id: any; debtorName: any; }} application
   */
  async onReopen(application, user = "system", queryRunner = null) {
    logger.info(
      `[LoanApplication] Application #${application.id} reopened by ${user}`,
    );

    // The service already reset status, rejectionReason, deletedAt.
    // Here we notify loan officer.

    await notificationService.create(
      {
        userId: 1,
        title: "Loan Application Reopened",
        message: `Application #${application.id} for ${application.debtorName} has been reopened and is pending review.`,
        type: "info",
        metadata: { applicationId: application.id },
      },
      user,
      queryRunner,
    );

    // No email to debtor needed at this stage.
  }
}

module.exports = { LoanApplicationStateTransitionService };
