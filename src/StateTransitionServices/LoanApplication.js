// src/services/LoanApplicationStateTransitionService.js
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const {
  enforceCreditCheck,
  emailEnabled,
  smsEnabled,
} = require("../utils/system");
const { NotificationLogService } = require("../services/NotificationLog");
const notificationService = require("../services/Notification");
const debtService = require("../services/Debt");

class LoanApplicationStateTransitionService {
  /**
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; debtorId: unknown; debtorName: unknown; debtorContact: unknown; debtorEmail: unknown; debtorAddress: unknown; requestedAmount: unknown; purpose: unknown; proposedDueDate: unknown; interestRate: unknown; status: unknown; approvedAt: unknown; rejectedAt: unknown; approvedBy: unknown; rejectionReason: unknown; deletedAt: unknown; createdAt: unknown; updatedAt: unknown; }>) => any; }} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.appRepo = dataSource.getRepository(
      require("../entities/LoanApplication"),
    );
    this.notificationLogService = new NotificationLogService();
  }

  /**
   * @param {import("typeorm").EntitySchema<{ id: unknown; debtorId: unknown; debtorName: unknown; debtorContact: unknown; debtorEmail: unknown; debtorAddress: unknown; requestedAmount: unknown; purpose: unknown; proposedDueDate: unknown; interestRate: unknown; status: unknown; approvedAt: unknown; rejectedAt: unknown; approvedBy: unknown; rejectionReason: unknown; deletedAt: unknown; createdAt: unknown; updatedAt: unknown; }>} entity
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
        logger.error("Failed to trigger credit check on submission:", err);
      }
    }
  }

  /**
   * @param {{ id: any; purpose: any; requestedAmount: any; proposedDueDate: any; interestRate: any; debtorId: any; debtorEmail: any; debtorName: any; debtorContact: any; }} application
   */
  async onApprove(
    application,
    createdDebt = null,
    user = "system",
    queryRunner = null,
  ) {
    logger.info(
      `[LoanApplication] Application #${application.id} approved by ${user}`,
    );

    let debt = createdDebt;
    if (!debt) {
      const debtData = {
        name: `Loan: ${application.purpose}`,
        totalAmount: application.requestedAmount,
        paidAmount: 0,
        dueDate: application.proposedDueDate,
        status: "active",
        interestRate: application.interestRate,
        penaltyRate: null,
        borrowerId: application.debtorId,
      };
      debt = await debtService.create(debtData, user, queryRunner);
      logger.info(`Created active debt #${debt.id}`);
    }

    // In‑app notification to debtor
    await notificationService.create(
      {
        userId: 1,
        title: "Loan Approved",
        message: `Your loan application (${application.purpose}) has been approved. An active debt has been created.`,
        type: "success",
        metadata: { applicationId: application.id, debtId: debt.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS if enabled
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

    const {
      requireLoanAgreement,
      loanAgreementTemplate,
    } = require("../utils/system");
    if (await requireLoanAgreement()) {
      logger.info(
        `Loan agreement should be generated for application #${application.id} using template: ${await loanAgreementTemplate()}`,
      );
      // TODO: actual PDF generation
    }

    await auditLogger.logUpdate(
      "LoanApplication",
      application.id,
      { status: "pending" },
      { status: "approved" },
      user,
    );
  }

  /**
   * @param {{ id: any; rejectionReason: null; rejectedAt: Date; debtorEmail: any; debtorName: any; debtorContact: any; deletedAt: Date; }} application
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

    const appRepo = this._getRepo(
      require("../entities/LoanApplication"),
      queryRunner,
    );
    if (application.rejectionReason !== reason) {
      application.rejectionReason = reason;
      application.rejectedAt = new Date();
      await appRepo.save(application);
    }

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

    if (!application.deletedAt) {
      application.deletedAt = new Date();
      await appRepo.save(application);
    }

    await auditLogger.logUpdate(
      "LoanApplication",
      application.id,
      { status: "pending" },
      { status: "rejected", reason },
      user,
    );
  }

  /**
   * @param {{ id: any; status: string; rejectedAt: null; rejectionReason: null; deletedAt: null; updatedAt: Date; debtorName: any; }} application
   */
  async onReopen(application, user = "system", queryRunner = null) {
    logger.info(
      `[LoanApplication] Application #${application.id} reopened by ${user}`,
    );

    const appRepo = this._getRepo(
      require("../entities/LoanApplication"),
      queryRunner,
    );
    application.status = "pending";
    application.rejectedAt = null;
    application.rejectionReason = null;
    application.deletedAt = null;
    application.updatedAt = new Date();
    await appRepo.save(application);

    // In‑app notification to loan officer
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

    await auditLogger.logUpdate(
      "LoanApplication",
      application.id,
      { status: "rejected" },
      { status: "pending" },
      user,
    );
  }
}

module.exports = { LoanApplicationStateTransitionService };
