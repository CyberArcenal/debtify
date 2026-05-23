// services/NotificationService.js
//@ts-check
const auditLogger = require("../utils/auditLogger");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
const { validateNotificationData } = require("../utils/notificationUtils");

class NotificationService {
  constructor() {
    this.notificationRepository = null;
    this.debtRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const Notification = require("../entities/Notification");
    const Debt = require("../entities/Debt");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.notificationRepository = AppDataSource.getRepository(Notification);
    this.debtRepository = AppDataSource.getRepository(Debt);
    console.log("NotificationService initialized");
  }

  async getRepositories() {
    if (!this.notificationRepository) {
      await this.initialize();
    }
    return {
      notification: this.notificationRepository,
      debt: this.debtRepository,
    };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository<any>}
   */
  _getRepo(qr, entityClass) {
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[Global._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[Global._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Create a new notification
   * @param {Object} notificationData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(notificationData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const validation = validateNotificationData(notificationData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const {
        title,
        message,
        type,
        scheduledFor,
        debtId,
        isRead = false,
      } = notificationData;

      let debt = null;
      if (debtId) {
        debt = await debtRepo.findOne({ where: { id: debtId } });
        if (!debt) {
          throw new Error(`Debt with ID ${debtId} not found`);
        }
      }

      const notification = notificationRepo.create({
        title,
        message,
        type: type || "reminder",
        isRead,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdAt: new Date(),
        debt,
      });

      const saved = await saveDb(notificationRepo, notification);
      await auditLogger.logCreate("Notification", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create notification:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing notification
   * @param {number} id
   * @param {Object} notificationData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async update(id, notificationData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const existing = await notificationRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!existing) {
        throw new Error(`Notification with ID ${id} not found`);
      }
      const oldData = { ...existing };

      // Handle debt relation update
      if (notificationData.debtId !== undefined) {
        if (notificationData.debtId === null) {
          existing.debt = null;
        } else {
          const newDebt = await debtRepo.findOne({
            where: { id: notificationData.debtId },
          });
          if (!newDebt) {
            throw new Error(
              `Debt with ID ${notificationData.debtId} not found`,
            );
          }
          existing.debt = newDebt;
        }
        delete notificationData.debtId;
      }

      // Apply updates
      if (notificationData.scheduledFor) {
        notificationData.scheduledFor = new Date(notificationData.scheduledFor);
      }
      Object.assign(existing, notificationData);

      const saved = await updateDb(notificationRepo, existing);
      await auditLogger.logUpdate("Notification", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update notification:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a notification (set deletedAt)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);

    try {
      const notification = await notificationRepo.findOne({ where: { id } });
      if (!notification) {
        throw new Error(`Notification with ID ${id} not found`);
      }
      if (notification.deletedAt) {
        throw new Error(`Notification #${id} is already deleted`);
      }

      const oldData = { ...notification };
      notification.deletedAt = new Date();

      const saved = await updateDb(notificationRepo, notification);
      await auditLogger.logDelete("Notification", id, oldData, user);
      console.log(`Notification soft deleted: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to delete notification:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted notification
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);

    try {
      const notification = await notificationRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!notification) {
        throw new Error(`Notification with ID ${id} not found`);
      }
      if (!notification.deletedAt) {
        throw new Error(`Notification #${id} is not deleted`);
      }

      notification.deletedAt = null;

      const saved = await updateDb(notificationRepo, notification);
      await auditLogger.logUpdate(
        "Notification",
        id,
        { deletedAt: true },
        { deletedAt: null },
        user,
      );
      console.log(`Notification restored: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to restore notification:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a notification
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);

    const notification = await notificationRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    await removeDb(notificationRepo, notification);
    await auditLogger.logDelete("Notification", id, notification, user);
    console.log(`Notification #${id} permanently deleted`);
  }

  /**
   * Mark a notification as read
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async markAsRead(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);

    const notification = await notificationRepo.findOne({ where: { id } });
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    if (notification.isRead) {
      return notification;
    }

    notification.isRead = true;
    const saved = await updateDb(notificationRepo, notification);
    await auditLogger.logUpdate(
      "Notification",
      id,
      { isRead: false },
      { isRead: true },
      user,
    );
    return saved;
  }

  /**
   * Mark a notification as unread
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async markAsUnread(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);

    const notification = await notificationRepo.findOne({ where: { id } });
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    if (!notification.isRead) {
      return notification;
    }

    notification.isRead = false;
    const saved = await updateDb(notificationRepo, notification);
    await auditLogger.logUpdate(
      "Notification",
      id,
      { isRead: true },
      { isRead: false },
      user,
    );
    return saved;
  }

  /**
   * Mark multiple notifications as read
   * @param {number[]} ids
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async markManyAsRead(ids, user = "system", qr = null) {
    const Notification = require("../entities/Notification");
    const notificationRepo = this._getRepo(qr, Notification);

    const result = await notificationRepo
      .createQueryBuilder(null, qr)
      .update(Notification)
      .set({ isRead: true })
      .whereInIds(ids)
      .execute();

    await auditLogger.logUpdate(
      "Notification",
      ids.join(","),
      { action: "markManyAsRead" },
      { count: result.affected },
      user,
    );
    return { updatedCount: result.affected };
  }

  /**
   * Get count of unread notifications
   * @param {Object} filters - Optional filters (debtId, type)
   * @param {boolean} includeDeleted
   */
  async getUnreadCount(filters = {}, includeDeleted = false) {
    const { notification: notificationRepo } = await this.getRepositories();
    const qb = notificationRepo
      .createQueryBuilder("notification")
      .where("notification.isRead = :isRead", { isRead: false });

    if (!includeDeleted) {
      qb.andWhere("notification.deletedAt IS NULL");
    }
    if (filters.debtId) {
      qb.andWhere("notification.debtId = :debtId", { debtId: filters.debtId });
    }
    if (filters.type) {
      qb.andWhere("notification.type = :type", { type: filters.type });
    }

    return await qb.getCount();
  }

  /**
   * Find notification by ID (excludes soft-deleted by default)
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const { notification: notificationRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["debt", "debt.borrower"] };
    if (!includeDeleted) {
      options.where.deletedAt = null;
    }
    const notification = await notificationRepo.findOne(options);
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    await auditLogger.logView("Notification", id, "system");
    return notification;
  }

  /**
   * Find all notifications with filters, pagination, sorting
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { notification: notificationRepo } = await this.getRepositories();
    const qb = notificationRepo
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // Exclude soft-deleted unless requested
    if (!options.includeDeleted) {
      qb.andWhere("notification.deletedAt IS NULL");
    }

    // Filters
    if (options.debtId) {
      qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
    }
    if (options.type) {
      qb.andWhere("notification.type = :type", { type: options.type });
    }
    if (options.isRead !== undefined) {
      qb.andWhere("notification.isRead = :isRead", { isRead: options.isRead });
    }
    if (options.scheduledForFrom) {
      qb.andWhere("notification.scheduledFor >= :scheduledForFrom", {
        scheduledForFrom: new Date(options.scheduledForFrom),
      });
    }
    if (options.scheduledForTo) {
      qb.andWhere("notification.scheduledFor <= :scheduledForTo", {
        scheduledForTo: new Date(options.scheduledForTo),
      });
    }
    if (options.createdAtFrom) {
      qb.andWhere("notification.createdAt >= :createdAtFrom", {
        createdAtFrom: new Date(options.createdAtFrom),
      });
    }
    if (options.createdAtTo) {
      qb.andWhere("notification.createdAt <= :createdAtTo", {
        createdAtTo: new Date(options.createdAtTo),
      });
    }
    if (options.search) {
      qb.andWhere(
        "(notification.title LIKE :search OR notification.message LIKE :search OR debt.name LIKE :search OR borrower.name LIKE :search)",
        { search: `%${options.search}%` },
      );
    }

    // Sorting
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`notification.${sortBy}`, sortOrder);

    const result = await paginateQueryBuilder(qb, {
      page: options.page,
      limit: options.limit,
    });

    await auditLogger.logView("Notification", null, "system");
    return result; // { data: [], pagination: {} }

    // Pagination
    // if (options.page && options.limit) {
    //   const offset = (options.page - 1) * options.limit;
    //   qb.skip(offset).take(options.limit);
    // }

    // const notifications = await qb.getMany();
    // await auditLogger.logView("Notification", null, "system");
    // return notifications;
  }

  /**
   * Get notification statistics
   */
  async getStatistics() {
    const { notification: notificationRepo } = await this.getRepositories();
    const qb = notificationRepo
      .createQueryBuilder("notification")
      .where("notification.deletedAt IS NULL");

    const total = await qb.getCount();
    const unread = await qb
      .clone()
      .andWhere("notification.isRead = :isRead", { isRead: false })
      .getCount();
    const read = total - unread;

    // By type
    const byType = await qb
      .clone()
      .select("notification.type", "type")
      .addSelect("COUNT(*)", "count")
      .groupBy("notification.type")
      .getRawMany();

    // Scheduled for future (scheduledFor > now)
    const now = new Date();
    const scheduledFuture = await qb
      .clone()
      .andWhere("notification.scheduledFor IS NOT NULL")
      .andWhere("notification.scheduledFor > :now", { now })
      .getCount();

    // Last 7 days created
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7Days = await qb
      .clone()
      .andWhere("notification.createdAt >= :sevenDaysAgo", { sevenDaysAgo })
      .getCount();

    return {
      total,
      read,
      unread,
      byType,
      scheduledFuture,
      createdLast7Days: last7Days,
    };
  }

  /**
   * Export notifications to CSV or JSON
   * @param {string} format
   * @param {Object} filters
   * @param {string} user
   */
  async exportNotifications(format = "json", filters = {}, user = "system") {
    const results = await this.findAll(filters);
    const notifications = results.data;

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Title",
        "Message",
        "Type",
        "Is Read",
        "Scheduled For",
        "Created At",
        "Debt ID",
        "Debt Name",
        "Borrower Name",
      ];
      const rows = notifications.map((n) => [
        n.id,
        n.title,
        (n.message || "").replace(/,/g, " "),
        n.type,
        n.isRead ? "Yes" : "No",
        n.scheduledFor ? new Date(n.scheduledFor).toLocaleDateString() : "",
        new Date(n.createdAt).toLocaleString(),
        n.debt?.id ?? "",
        n.debt?.name ?? "",
        n.debt?.borrower?.name ?? "",
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `notifications_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: notifications,
        filename: `notifications_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    await auditLogger.logExport("Notification", format, filters, user);
    console.log(
      `Exported ${notifications.length} notifications in ${format} format`,
    );
    return exportData;
  }

  /**
   * Bulk create notifications
   * @param {Array<Object>} notificationsArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkCreate(notificationsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of notificationsArray) {
      try {
        const saved = await this.create(data, user, qr);
        results.created.push(saved);
      } catch (err) {
        results.errors.push({ notification: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update notifications
   * @param {Array<{ id: number, updates: Object }>} updatesArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkUpdate(updatesArray, user = "system", qr = null) {
    const results = { updated: [], errors: [] };
    for (const { id, updates } of updatesArray) {
      try {
        const saved = await this.update(id, updates, user, qr);
        results.updated.push(saved);
      } catch (err) {
        results.errors.push({ id, updates, error: err.message });
      }
    }
    return results;
  }

  /**
   * Import notifications from CSV file
   * @param {string} filePath
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async importFromCSV(filePath, user = "system", qr = null) {
    const fs = require("fs").promises;
    const csv = require("csv-parse/sync");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = { imported: [], errors: [] };
    for (const record of records) {
      try {
        const notificationData = {
          title: record.title,
          message: record.message,
          type: record.type || "reminder",
          isRead: record.isRead === "Yes" || record.isRead === "true",
          scheduledFor: record.scheduledFor || null,
          debtId: record.debtId ? parseInt(record.debtId, 10) : null,
        };
        const validation = validateNotificationData(notificationData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(notificationData, user, qr);
        results.imported.push(saved);
      } catch (err) {
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }
}

// Singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;
