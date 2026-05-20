// src/scheduler/auditTrailCleanupScheduler.js
//@ts-check

const { AuditLog } = require("../entities/AuditLog");
const { AppDataSource } = require("../main/db/data-source");
const { logger } = require("../utils/logger");
const { auditLogEnabled, logRetentionDays } = require("../utils/system");

class AuditTrailCleanupScheduler {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isEnabled = true;
    this.intervalId = null;
  }

  async start() {
    try {
      this.isEnabled = await auditLogEnabled();

      if (!this.isEnabled) {
        logger.info("⏸️ Audit Trail Cleanup Scheduler is disabled (audit log disabled)");
        return this;
      }

      logger.info("🚀 Starting Audit Trail Cleanup Scheduler...");
      await this.cleanupOldAuditTrails();
      this.intervalId = setInterval(async () => {
        await this.cleanupOldAuditTrails();
      }, this.checkInterval);

      logger.info("✅ Audit Trail Cleanup Scheduler Started", {
        checkInterval: `${this.checkInterval / (1000 * 60 * 60)} hours`,
      });
      return this;
    } catch (error) {
      logger.error("❌ Failed to start Audit Trail Cleanup Scheduler:", error);
      throw error;
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Audit Trail Cleanup Scheduler Stopped");
    }
  }

  async cleanupOldAuditTrails() {
    try {
      this.isEnabled = await auditLogEnabled();
      if (!this.isEnabled) {
        logger.debug("[AUDIT CLEANUP] Audit log disabled, skipping cleanup");
        return;
      }

      const retentionDays = await logRetentionDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      logger.info(`[AUDIT CLEANUP] Cleaning up audit trails older than ${retentionDays} days (before ${cutoffDate.toISOString()})`);

      const auditLogRepo = AppDataSource.getRepository(AuditLog);

      const count = await auditLogRepo
        .createQueryBuilder("audit_log")
        .where("audit_log.timestamp < :cutoffDate", { cutoffDate })
        .getCount();

      if (count === 0) {
        logger.debug("[AUDIT CLEANUP] No old audit trail records to delete");
        return;
      }

      const result = await auditLogRepo
        .createQueryBuilder("audit_log")
        .where("audit_log.timestamp < :cutoffDate", { cutoffDate })
        .delete()
        .execute();

      logger.info(`✅ Deleted ${result.affected || 0} audit trail records older than ${retentionDays} days`);

      await this.logCleanupAction(retentionDays, result.affected || 0);
    } catch (error) {
      logger.error("❌ Error during audit trail cleanup:", error);
    }
  }

  async logCleanupAction(retentionDays, deletedCount) {
    try {
      const auditLogRepo = AppDataSource.getRepository(AuditLog);
      const auditEntry = auditLogRepo.create({
        action: "AUDIT_CLEANUP",
        entity: "AuditTrail",
        entityId: null,
        oldData: null,
        newData: JSON.stringify({
          retention_days: retentionDays,
          deleted_count: deletedCount,
          cutoff_date: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString(),
        }),
        user: "system",
        timestamp: new Date(),
      });
      await auditLogRepo.save(auditEntry);
    } catch (error) {
      logger.warn("Could not log audit cleanup action:", error);
    }
  }

  async forceCleanup() {
    logger.info("🔄 Force audit trail cleanup triggered");
    await this.cleanupOldAuditTrails();
  }

  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isRunning: !!this.intervalId,
      checkInterval: this.checkInterval,
      lastRun: new Date(),
      nextRun: this.intervalId ? new Date(Date.now() + this.checkInterval) : null,
    };
  }

  async updateConfig() {
    this.isEnabled = await auditLogEnabled();
    logger.info("🔄 Updated audit cleanup configuration from system settings");
  }

  async getCleanupStats() {
    try {
      const auditLogRepo = AppDataSource.getRepository(AuditLog);
      const retentionDays = await logRetentionDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldRecordsCount = await auditLogRepo
        .createQueryBuilder("audit_log")
        .where("audit_log.timestamp < :cutoffDate", { cutoffDate })
        .getCount();

      const totalCount = await auditLogRepo.count();

      const oldestRecord = await auditLogRepo
        .createQueryBuilder("audit_log")
        .select("MIN(audit_log.timestamp)", "oldest")
        .getRawOne();

      return {
        total_records: totalCount,
        old_records_to_delete: oldRecordsCount,
        retention_days: retentionDays,
        cutoff_date: cutoffDate.toISOString(),
        oldest_record_date: oldestRecord?.oldest || null,
        cleanup_enabled: this.isEnabled,
      };
    } catch (error) {
      logger.error("Error getting cleanup stats:", error);
      return null;
    }
  }
}

module.exports = AuditTrailCleanupScheduler;