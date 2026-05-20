// src/services/CreditCheckStateTransitionService.js
//@ts-check
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const notificationService = require("../services/Notification");

class CreditCheckStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.logRepo = dataSource.getRepository(require("../entities/CreditCheckLog"));
  }

  /**
   * When a credit check is performed
   * @param {Object} logEntry
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async onCheckPerformed(logEntry, user = "system", queryRunner = null) {
    // @ts-ignore
    logger.info(`[CreditCheck] Credit check for debtor #${logEntry.debtorId} performed by ${user} -> score ${logEntry.score} (${logEntry.riskLevel})`);

    // 1. Log to audit log (already saved in DB, but we can add an explicit audit entry)
    // @ts-ignore
    await auditLogger.logCreate("CreditCheckLog", logEntry.id, { score: logEntry.score, riskLevel: logEntry.riskLevel }, user);

    // 2. If score < threshold (e.g., 500), notify credit officer (internal)
    const POOR_SCORE_THRESHOLD = 500;
    // @ts-ignore
    if (logEntry.score < POOR_SCORE_THRESHOLD) {
      try {
        // Get debtor name for better message
        const Borrower = require("../entities/Borrower");
        const borrowerRepo = queryRunner
          ? queryRunner.manager.getRepository(Borrower)
          : this.dataSource.getRepository(Borrower);
        // @ts-ignore
        const debtor = await borrowerRepo.findOne({ where: { id: logEntry.debtorId } });
        // @ts-ignore
        const debtorName = debtor ? debtor.name : `ID ${logEntry.debtorId}`;

        await notificationService.create(
          {
            userId: 1, // system admin / credit officer (single user)
            title: "⚠️ Poor Credit Score Alert",
            // @ts-ignore
            message: `Debtor "${debtorName}" has a credit score of ${logEntry.score} (${logEntry.riskLevel}). Please review.`,
            type: "warning",
            // @ts-ignore
            metadata: { debtorId: logEntry.debtorId, score: logEntry.score },
          },
          user
        );
      } catch (err) {
        // @ts-ignore
        logger.error("Failed to send credit score alert notification:", err);
      }
    }

    // 3. Update debtor's credit_rating field (optional – requires migration to add column)
    // Uncomment if Borrower entity has a `credit_rating` column (string or integer)
    /*
    try {
      const Borrower = require("../entities/Borrower");
      const borrowerRepo = queryRunner
        ? queryRunner.manager.getRepository(Borrower)
        : this.dataSource.getRepository(Borrower);
      let rating = "Good";
      if (logEntry.score >= 700) rating = "Excellent";
      else if (logEntry.score >= 500) rating = "Fair";
      else rating = "Poor";
      await borrowerRepo.update({ id: logEntry.debtorId }, { credit_rating: rating });
    } catch (err) {
      logger.error("Failed to update debtor credit rating:", err);
    }
    */
  }

  /**
   * When a credit check log is deleted
   * @param {Object} logEntry
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async onLogDeleted(logEntry, user = "system", queryRunner = null) {
    // @ts-ignore
    logger.info(`[CreditCheck] Credit check log #${logEntry.id} for debtor #${logEntry.debtorId} deleted by ${user}`);

    // 1. Audit trail: record deletion
    // @ts-ignore
    await auditLogger.logDelete("CreditCheckLog", logEntry.id, logEntry, user);

    // 2. Re‑calculate risk assessment for the debtor (optional – could recompute using the latest remaining logs)
    // For offline single‑user, we skip recalculation; but can be added if needed.

    // 3. Notify compliance officer if required (internal)
    try {
      await notificationService.create(
        {
          userId: 1,
          title: "Credit Check Log Deleted",
          // @ts-ignore
          message: `Credit check log #${logEntry.id} for debtor #${logEntry.debtorId} has been deleted by ${user}.`,
          type: "info",
          // @ts-ignore
          metadata: { logId: logEntry.id, debtorId: logEntry.debtorId },
        },
        user
      );
    } catch (err) {
      // @ts-ignore
      logger.error("Failed to send deletion notification:", err);
    }
  }
}

module.exports = { CreditCheckStateTransitionService };