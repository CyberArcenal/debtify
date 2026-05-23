// src/renderer/api/reminder_log.ts
export interface NotificationLogEntry {
  id: number;
  recipient_email: string;
  subject: string | null;
  payload: string | null;
  status: "queued" | "sent" | "failed" | "resend";
  error_message: string | null;
  retry_count: number;
  resend_count: number;
  sent_at: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedNotifications {
  items: NotificationLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  total: number;
  byStatus: Record<string, number>;
  avgRetryFailed: number;
  last24h: number;
}

export interface NotificationsResponse {
  status: boolean;
  message: string;
  data: PaginatedNotifications;
}

export interface NotificationResponse {
  status: boolean;
  message: string;
  data: NotificationLogEntry;
}

export interface NotificationStatsResponse {
  status: boolean;
  message: string;
  data: NotificationStats;
}

export interface NotificationActionResponse {
  status: boolean;
  message: string;
  data?: any;
}

class ReminderLogAPI {
  private async callRaw<T>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.reminderLog) {
      throw new Error("Electron API (reminderLog) not available");
    }
    const response = await window.backendAPI.reminderLog({ method, params });
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from backend");
    }
    return response as T;
  }

  private normalizeResponse<T extends { status: boolean; message?: string }>(
    response: T
  ): T & { message: string } {
    return { ...response, message: response.message ?? "" };
  }

  private toPaginatedResponse(raw: any): PaginatedNotifications {
    if (raw && raw.items && raw.total !== undefined) {
      return raw;
    }
    const items = Array.isArray(raw.data) ? raw.data : [];
    const pagination = raw.pagination || {};
    return {
      items,
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      total: pagination.total || 0,
      totalPages: pagination.pages || 0,
    };
  }

  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS (reminder-specific names)
  // --------------------------------------------------------------------

  async getAllReminders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<any>("getAllReminders", params || {});
    const normalized = this.normalizeResponse(raw);
    const paginatedData = this.toPaginatedResponse(normalized);
    return { ...normalized, data: paginatedData };
  }

  async getReminderById(id: number): Promise<NotificationResponse> {
    const raw = await this.callRaw<any>("getReminderById", { id });
    return this.normalizeResponse(raw);
  }

  async getRemindersByRecipient(params: {
    recipient_email: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<any>("getRemindersByRecipient", params);
    const normalized = this.normalizeResponse(raw);
    const paginatedData = this.toPaginatedResponse(normalized);
    return { ...normalized, data: paginatedData };
  }

  async searchReminders(params: {
    keyword: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<any>("searchReminders", params);
    const normalized = this.normalizeResponse(raw);
    const paginatedData = this.toPaginatedResponse(normalized);
    return { ...normalized, data: paginatedData };
  }

  async getReminderStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<NotificationStatsResponse> {
    const raw = await this.callRaw<any>("getReminderStats", params || {});
    return this.normalizeResponse(raw);
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async createReminder(data: { to: string; subject: string; html?: string; text?: string }, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("createReminder", { data, user });
    return this.normalizeResponse(raw);
  }

  async updateReminderStatus(params: {
    id: number;
    status: string;
    errorMessage?: string | null;
    user?: string;
  }): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("updateReminderStatus", params);
    return this.normalizeResponse(raw);
  }

  async deleteReminder(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("deleteReminder", { id, user });
    return this.normalizeResponse(raw);
  }

  async retryReminder(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("retryReminder", { id, user });
    return this.normalizeResponse(raw);
  }

  async retryAllFailedReminders(filters?: { recipient_email?: string; createdBefore?: string }, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("retryAllFailedReminders", { filters, user });
    return this.normalizeResponse(raw);
  }

  async resendReminder(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("resendReminder", { id, user });
    return this.normalizeResponse(raw);
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS (for backward compatibility, can be removed later)
  // --------------------------------------------------------------------

  async getAll(params?: any): Promise<NotificationsResponse> {
    return this.getAllReminders(params);
  }
  async getById(id: number): Promise<NotificationResponse> {
    return this.getReminderById(id);
  }
  async getByRecipient(params: any): Promise<NotificationsResponse> {
    return this.getRemindersByRecipient(params);
  }
  async search(params: any): Promise<NotificationsResponse> {
    return this.searchReminders(params);
  }
  async getStats(params?: any): Promise<NotificationStatsResponse> {
    return this.getReminderStats(params);
  }
  async delete(id: number): Promise<NotificationActionResponse> {
    return this.deleteReminder(id);
  }
  async updateStatus(params: any): Promise<NotificationActionResponse> {
    return this.updateReminderStatus(params);
  }
  async retryFailed(id: number): Promise<NotificationActionResponse> {
    return this.retryReminder(id);
  }
  async retryAllFailed(params?: any): Promise<NotificationActionResponse> {
    return this.retryAllFailedReminders(params?.filters, params?.user);
  }
  async resend(id: number): Promise<NotificationActionResponse> {
    return this.resendReminder(id);
  }

  isAvailable(): boolean {
    return !!window.backendAPI?.reminderLog;
  }
}

const reminderLogAPI = new ReminderLogAPI();
export default reminderLogAPI;