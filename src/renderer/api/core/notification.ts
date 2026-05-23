// src/renderer/api/notification.ts

import type { PaginatedResult } from "./common";

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "reminder" | "overdue" | "payment_confirmation";
  isRead: boolean;
  scheduledFor: string | null;   // ISO date string
  createdAt: string;
  deletedAt: string | null;
  debt?: {
    id: number;
    name: string;
    borrower?: {
      id: number;
      name: string;
    };
  };
}

export interface NotificationStatistics {
  total: number;
  read: number;
  unread: number;
  byType: Array<{ type: string; count: number }>;
  scheduledFuture: number;
  createdLast7Days: number;
}

export interface NotificationCreateData {
  title: string;
  message: string;
  type?: "reminder" | "overdue" | "payment_confirmation";
  scheduledFor?: string | null;
  debtId?: number | null;
  isRead?: boolean;
}

export interface NotificationUpdateData {
  title?: string;
  message?: string;
  type?: "reminder" | "overdue" | "payment_confirmation";
  scheduledFor?: string | null;
  debtId?: number | null;
  isRead?: boolean;
}

export interface BulkCreateNotificationResult {
  created: Notification[];
  errors: Array<{ notification: any; error: string }>;
}

export interface BulkUpdateNotificationResult {
  updated: Notification[];
  errors: Array<{ id: number; updates: any; error: string }>;
}

export interface ImportNotificationCsvResult {
  imported: Notification[];
  errors: Array<{ row: any; error: string }>;
}

export interface ExportNotificationData {
  format: "csv" | "json";
  data: string | Notification[];
  filename: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface NotificationResponse {
  status: boolean;
  message: string;
  data: Notification;
}

// ✅ Changed: now uses PaginatedResult for list endpoints
export interface NotificationsResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<Notification>;
}

export interface NotificationStatisticsResponse {
  status: boolean;
  message: string;
  data: NotificationStatistics;
}

export interface UnreadCountResponse {
  status: boolean;
  message: string;
  data: { count: number };
}

export interface BulkCreateNotificationResponse {
  status: boolean;
  message: string;
  data: BulkCreateNotificationResult;
}

export interface BulkUpdateNotificationResponse {
  status: boolean;
  message: string;
  data: BulkUpdateNotificationResult;
}

export interface ImportNotificationCsvResponse {
  status: boolean;
  message: string;
  data: ImportNotificationCsvResult;
}

export interface ExportNotificationResponse {
  status: boolean;
  message: string;
  data: ExportNotificationData;
}

export interface DeleteNotificationResponse {
  status: boolean;
  message: string;
  data: Notification;
}

export interface RestoreNotificationResponse {
  status: boolean;
  message: string;
  data: Notification;
}

export interface MarkReadResponse {
  status: boolean;
  message: string;
  data: Notification;
}

export interface MarkManyReadResponse {
  status: boolean;
  message: string;
  data: { updatedCount: number };
}

// ----------------------------------------------------------------------
// 🧠 NotificationsAPI Class
// ----------------------------------------------------------------------

class NotificationsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  async getById(id: number, includeDeleted = false): Promise<NotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "getNotificationById",
      params: { id, includeDeleted },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch notification");
  }

  /**
   * Get all notifications with optional filters and pagination
   * @returns NotificationsResponse where data.data is Notification[] and data.pagination contains metadata
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    includeDeleted?: boolean;
    debtId?: number;
    type?: "reminder" | "overdue" | "payment_confirmation";
    isRead?: boolean;
    scheduledForFrom?: string;
    scheduledForTo?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
  }): Promise<NotificationsResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "getAllNotifications",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch notifications");
  }

  async getStatistics(): Promise<NotificationStatisticsResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "getNotificationStatistics",
      params: {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch notification statistics");
  }

  async getUnreadCount(
    filters?: { debtId?: number; type?: string },
    includeDeleted?: boolean
  ): Promise<number> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "getUnreadCount",
      params: { ...filters, includeDeleted },
    });
    if (response.status) return response.data.count;
    throw new Error(response.message || "Failed to fetch unread count");
  }

  async search(
    searchTerm: string,
    page?: number,
    limit?: number,
    type?: string,
    isRead?: boolean,
    debtId?: number
  ): Promise<NotificationsResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "searchNotifications",
      params: { searchTerm, page, limit, type, isRead, debtId },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to search notifications");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async create(data: NotificationCreateData, user = "system"): Promise<NotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "createNotification",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create notification");
  }

  async update(id: number, data: NotificationUpdateData, user = "system"): Promise<NotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "updateNotification",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update notification");
  }

  async delete(id: number, user = "system"): Promise<DeleteNotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "deleteNotification",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete notification");
  }

  async restore(id: number, user = "system"): Promise<RestoreNotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "restoreNotification",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to restore notification");
  }

  async permanentlyDelete(id: number, user = "system"): Promise<{ status: boolean; message: string }> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "permanentlyDeleteNotification",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to permanently delete notification");
  }

  async markAsRead(id: number, user = "system"): Promise<MarkReadResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "markAsRead",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to mark notification as read");
  }

  async markAsUnread(id: number, user = "system"): Promise<MarkReadResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "markAsUnread",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to mark notification as unread");
  }

  async markManyAsRead(ids: number[], user = "system"): Promise<MarkManyReadResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "markManyAsRead",
      params: { ids, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to mark notifications as read");
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  async bulkCreate(notificationsArray: NotificationCreateData[], user = "system"): Promise<BulkCreateNotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "bulkCreateNotifications",
      params: { notificationsArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk create notifications");
  }

  async bulkUpdate(updatesArray: Array<{ id: number; updates: NotificationUpdateData }>, user = "system"): Promise<BulkUpdateNotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "bulkUpdateNotifications",
      params: { updatesArray, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk update notifications");
  }

  async importFromCSV(filePath: string, user = "system"): Promise<ImportNotificationCsvResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "importNotificationsCSV",
      params: { filePath, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to import notifications from CSV");
  }

  async export(format: "csv" | "json" = "json", filters: any = {}, user = "system"): Promise<ExportNotificationResponse> {
    if (!window.backendAPI?.notification) {
      throw new Error("Electron API (notification) not available");
    }
    const response = await window.backendAPI.notification({
      method: "exportNotifications",
      params: { format, filters, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to export notifications");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  async getUnreadCountForDebt(debtId: number): Promise<number> {
    return this.getUnreadCount({ debtId });
  }

  async markAllAsReadForDebt(debtId: number, user = "system"): Promise<MarkManyReadResponse> {
    // Fetch all unread notification ids for the debt
    const response = await this.getAll({ debtId, isRead: false, limit: 1000 });
    const ids = response.data.data.map(n => n.id);   // ✅ access nested data array
    if (ids.length === 0) {
      return { status: true, message: "No unread notifications", data: { updatedCount: 0 } };
    }
    return this.markManyAsRead(ids, user);
  }

  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.notification);
  }
}

const notificationsAPI = new NotificationsAPI();
export default notificationsAPI;