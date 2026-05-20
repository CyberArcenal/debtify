import type { PaginatedResult } from "./common";

export interface InterestRateChangeLog {
  id: number;
  setting_key: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  reason: string | null;
  loan_id: number | null;
  changed_at: string;
}

class InterestRateChangeLogAPI {
  async getAll(filters?: any, page = 1, limit = 50) {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "getAllLogs",
      params: { filters, page, limit },
    });
    if (!response.status) throw new Error(response.message);
    return response.data as PaginatedResult<InterestRateChangeLog>;
  }

  async getById(id: number) {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "getLogById",
      params: { id },
    });
    if (!response.status) throw new Error(response.message);
    return response.data as InterestRateChangeLog;
  }

  async getForLoan(loanId: number, page = 1, limit = 50) {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "getLogsForLoan",
      params: { loanId, page, limit },
    });
    if (!response.status) throw new Error(response.message);
    return response.data as PaginatedResult<InterestRateChangeLog>;
  }

  async create(data: { settingKey: string; oldValue: number | string; newValue: number | string; loanId?: number; reason?: string }) {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "createLog",
      params: data,
    });
    if (!response.status) throw new Error(response.message);
    return response.data as InterestRateChangeLog;
  }

  async delete(id: number) {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "deleteLog",
      params: { id },
    });
    if (!response.status) throw new Error(response.message);
    return true;
  }
}

export default new InterestRateChangeLogAPI();