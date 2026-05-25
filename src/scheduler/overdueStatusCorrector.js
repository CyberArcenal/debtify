// src/scheduler/overdueStatusCorrector.js
//@ts-check
const { AppDataSource } = require("../main/db/data-source");
const { logger } = require("../utils/logger");
const { updateDb } = require("../utils/dbUtils/dbActions");
const notificationService = require("../services/Notification");
const auditLogger = require("../utils/auditLogger");
const Debt = require("../entities/Debt");

class OverdueStatusCorrector {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.intervalId = null;
  }

  async start() {
    logger.info("🚀 Starting Overdue Status Corrector (Health Check)...");

    // Run once on startup
    await this.correctMisoverdueDebts();

    // Schedule daily
    this.intervalId = setInterval(async () => {
      await this.correctMisoverdueDebts();
    }, this.checkInterval);

    logger.info(`✅ Overdue Status Corrector started (interval: ${this.checkInterval / (1000 * 60 * 60)} hours)`);
    return this;
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Overdue Status Corrector stopped");
    }
  }

  async correctMisoverdueDebts() {
    try {
      if (!AppDataSource.isInitialized) {
        logger.warn("[OVERDUE CORRECTOR] Database not ready, skipping");
        return;
      }

      logger.info("[OVERDUE CORRECTOR] Scanning for incorrectly marked overdue debts...");

      const debtRepo = AppDataSource.getRepository(Debt);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Kunin ang lahat ng debts na status = 'overdue'
      const overdueDebts = await debtRepo
        .createQueryBuilder("debt")
        .leftJoinAndSelect("debt.borrower", "borrower")
        .where("debt.status = :status", { status: "overdue" })
        .andWhere("debt.deletedAt IS NULL")
        .getMany();

      if (overdueDebts.length === 0) {
        logger.debug("[OVERDUE CORRECTOR] No overdue debts to check");
        return;
      }

      let correctedCount = 0;

      for (const debt of overdueDebts) {
        // @ts-ignore
        const remainingBalance = debt.totalAmount - debt.paidAmount;
        // @ts-ignore
        const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
        let newStatus = null;
        let reason = "";

        // Case 1: Fully paid (remaining <= 0)
        if (remainingBalance <= 0.01) {
          newStatus = "paid";
          reason = "fully paid";
        }
        // Case 2: Due date is today or in the future (not overdue anymore)
        else if (dueDate && dueDate >= now) {
          newStatus = "active";
          reason = "due date extended or future";
        }
        // Case 3: Still overdue - no correction needed
        else {
          continue;
        }

        // I-update ang status
        debt.status = newStatus;
        debt.updatedAt = new Date();
        // @ts-ignore
        await updateDb(debtRepo, debt, { skipSignal: false }); // trigger subscriber para sa email/notification kung kinakailangan

        // In-app notification
        await notificationService.create(
          {
            userId: 1,
            title: "Overdue Status Corrected",
            message: `Debt "${debt.name}" (ID: ${debt.id}) was marked as overdue but is now ${reason}. Status changed to "${newStatus}".`,
            type: "info",
            metadata: { debtId: debt.id, oldStatus: "overdue", newStatus, reason },
          },
          "system"
        );

        // Audit log
        await auditLogger.logUpdate(
          "Debt",
          debt.id,
          { status: "overdue" },
          { status: newStatus, reason },
          "system"
        );

        correctedCount++;
        logger.info(`[OVERDUE CORRECTOR] Debt #${debt.id} status corrected: overdue → ${newStatus} (${reason})`);
      }

      if (correctedCount > 0) {
        logger.info(`[OVERDUE CORRECTOR] Corrected ${correctedCount} debts`);
      } else {
        logger.debug("[OVERDUE CORRECTOR] No corrections needed");
      }
    } catch (error) {
      // @ts-ignore
      logger.error("[OVERDUE CORRECTOR] Error during correction:", error);
    }
  }

  async forceRun() {
    logger.info("🔄 Force overdue status correction triggered");
    await this.correctMisoverdueDebts();
  }

  getStatus() {
    return {
      isRunning: !!this.intervalId,
      checkInterval: this.checkInterval,
      nextRun: this.intervalId ? new Date(Date.now() + this.checkInterval) : null,
    };
  }
}

module.exports = OverdueStatusCorrector;