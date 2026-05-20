// src/renderer/api/core/system_config.ts
// Debt Management System Configuration

export interface PublicSystemSettings {
  general: {
    [key: string]: {
      value: string | number | boolean;
      description: string;
    };
  };
  system: {
    site_name: string;
    currency: string;
    cache_timestamp: string;
  };
}

export interface FrontendSystemInfo {
  site_name: string;
  logo: string;
  currency: string;
  admin_email: string;
  tax_enabled: boolean;       // for loan interest tax?
  tax_rate: number;
  system_version: string;
}

// Debt Management Setting Types
export const SettingType = {
  GENERAL: "general",
  COLLECTIONS: "collections",
  LOANS: "loans",
  NOTIFICATIONS: "notifications",
  REPORTS: "reports",
  AUDIT_SECURITY: "audit_security",
  INTEGRATIONS: "integrations",
} as const;

export type SettingType = (typeof SettingType)[keyof typeof SettingType];

export interface SystemSettingData {
  id: number;
  key: string;
  value: any;
  setting_type: SettingType;
  description?: string;
  isPublic: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedSettingsData {
  settings: SystemSettingData[];
  grouped_settings: {
    general: GeneralSettings;
    collections: CollectionsSettings;
    loans: LoanSettings;
    notifications: NotificationsSettings;
    reports: ReportsSettings;
    audit_security: AuditSecuritySettings;
    integrations: IntegrationsSettings;
  };
  system_info: SystemInfoData;
}

// 1. GENERAL SETTINGS
export interface GeneralSettings {
  company_name?: string;
  branch_location?: string;
  default_timezone?: string;
  currency?: string;
  language?: string;
  receipt_footer_message?: string;
  auto_logout_minutes?: number;
  date_format?: string;
}

// 2. COLLECTIONS SETTINGS
export interface CollectionsSettings {
  default_interest_rate?: number;       // default interest rate for new loans
  default_penalty_rate?: number;        // default penalty rate (% per overdue day or fixed)
  penalty_calculation_method?: "percentage" | "fixed"; // how penalty is applied
  enable_auto_penalty?: boolean;        // auto apply penalty when overdue
  penalty_grace_days?: number;          // days after due before penalty starts
  overdue_reminder_days?: number[];     // array of days to send reminders (e.g., [7,3,1])
  max_loan_amount?: number;             // global max loan amount (optional)
  min_loan_amount?: number;             // global min loan amount
  enforce_credit_check?: boolean;       // require credit check before loan approval
}

// 3. LOANS SETTINGS
export interface LoanSettings {
  allowed_loan_statuses?: string[];     // custom statuses: active, paid, overdue, defaulted
  enable_partial_payment?: boolean;
  enable_early_payment_discount?: boolean;
  early_payment_discount_rate?: number;
  require_loan_agreement?: boolean;
  loan_agreement_template?: string;     // path to template file
  amortization_type?: "flat" | "declining"; // how interest is computed
  default_loan_term_months?: number;
}

// 4. NOTIFICATIONS SETTINGS
export interface NotificationsSettings {
  email_enabled?: boolean;
  email_smtp_host?: string;
  email_smtp_port?: number;
  email_from_address?: string;
  sms_enabled?: boolean;
  sms_provider?: string;                // e.g., "twilio"
  reminder_days_before_due?: number[];  // days before due to send reminders
  overdue_notification_frequency?: "daily" | "weekly";
  notify_on_payment?: boolean;          // notify debtor when payment is recorded
  notify_on_penalty?: boolean;          // notify when penalty is applied

  // Twilio settings
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  twilio_messaging_service_sid?: string;
}

// 5. REPORTS SETTINGS
export interface ReportsSettings {
  export_formats?: string[];            // CSV, Excel, PDF
  default_export_format?: string;
  auto_backup_enabled?: boolean;
  backup_schedule?: string;             // e.g., "daily", "weekly"
  backup_location?: string;
  data_retention_days?: number;
  include_audit_in_backup?: boolean;
}

// 6. AUDIT & SECURITY SETTINGS
export interface AuditSecuritySettings {
  audit_log_enabled?: boolean;
  log_retention_days?: number;
  log_events?: string[];                // e.g., "CREATE", "UPDATE", "DELETE", "LOGIN"
  force_https?: boolean;
  session_encryption_enabled?: boolean;
  gdpr_compliance_enabled?: boolean;
  require_mfa_for_admin?: boolean;
}

// 7. INTEGRATIONS SETTINGS
export interface IntegrationsSettings {
  accounting_integration_enabled?: boolean;
  accounting_api_url?: string;
  accounting_api_key?: string;
  credit_bureau_api_enabled?: boolean;
  credit_bureau_api_key?: string;
  credit_bureau_endpoint?: string;
  webhooks_enabled?: boolean;
  webhooks?: WebhookSetting[];
}

export interface WebhookSetting {
  url: string;
  events: string[];
  enabled: boolean;
  secret?: string;
}

export interface SystemInfoData {
  version: string;
  name: string;
  environment: string;
  debug_mode: boolean;
  timezone: string;
  current_time: string;
  setting_types: string[];
}

// API Responses (unchanged)
export interface SystemConfigResponse {
  status: boolean;
  message: string;
  data: GroupedSettingsData | null;
}

export interface SystemInfoResponse {
  status: boolean;
  message: string;
  data: SystemInfoData | null;
}

export interface SettingsListResponse {
  status: boolean;
  message: string;
  data: SystemSettingData[];
}

export interface SettingResponse {
  status: boolean;
  message: string;
  data: SystemSettingData | null;
}

export interface OperationResponse {
  status: boolean;
  message: string;
  data: {
    id?: number;
    key?: string;
    count?: number;
    [key: string]: any;
  } | null;
}

export interface SettingsStatsResponse {
  status: boolean;
  message: string;
  data: {
    total: number;
    by_type: Record<string, number>;
    public_count: number;
    private_count: number;
    timestamp: string;
  };
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: Array<{
    success: boolean;
    id?: number;
    key?: string;
    error?: string;
    action?: string;
  }>;
}

// Request Payloads
export interface CreateSettingData {
  key: string;
  value: any;
  setting_type: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingData {
  id: number;
  key?: string;
  value?: any;
  setting_type?: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface SetValueByKeyData {
  key: string;
  value: any;
  setting_type?: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface BulkUpdateData {
  settingsData: Array<{
    id?: number;
    key: string;
    value: any;
    setting_type: SettingType;
    description?: string;
    isPublic?: boolean;
  }>;
}

export interface UpdateCategorySettingsData {
  [category: string]: Record<string, any>;
}

// API Class (same structure, but updated default settings)
class SystemConfigAPI {
  async getGroupedConfig(): Promise<SystemConfigResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getGroupedConfig", params: {} });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch system configuration");
  }

  async updateGroupedConfig(configData: UpdateCategorySettingsData): Promise<SystemConfigResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "updateGroupedConfig", params: { configData } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update system configuration");
  }

  async getSystemInfo(): Promise<SystemInfoResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getSystemInfo", params: {} });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch system information");
  }

  async getAllSettings(): Promise<SettingsListResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getAllSettings", params: {} });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch all settings");
  }

  async getPublicSettings(): Promise<SettingsListResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getPublicSettings", params: {} });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch public settings");
  }

  async getSettingByKey(key: string, settingType?: SettingType): Promise<SettingResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getSettingByKey", params: { key, settingType } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch setting");
  }

  async createSetting(settingData: CreateSettingData): Promise<SettingResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "createSetting", params: { settingData } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create setting");
  }

  async updateSetting(id: number, settingData: UpdateSettingData): Promise<SettingResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "updateSetting", params: { id, settingData } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update setting");
  }

  async deleteSetting(id: number): Promise<OperationResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "deleteSetting", params: { id } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete setting");
  }

  async getByType(settingType: SettingType): Promise<SettingsListResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getByType", params: { settingType } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch settings by type");
  }

  async getValueByKey(key: string, defaultValue?: any): Promise<SettingResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getValueByKey", params: { key, defaultValue } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to get value by key");
  }

  async setValueByKey(key: string, value: any, options?: Partial<SetValueByKeyData>): Promise<SettingResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "setValueByKey", params: { key, value, options } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to set value by key");
  }

  async bulkUpdate(settingsData: BulkUpdateData["settingsData"]): Promise<BulkOperationResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "bulkUpdate", params: { settingsData } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk update settings");
  }

  async bulkDelete(ids: number[]): Promise<BulkOperationResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "bulkDelete", params: { ids } });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk delete settings");
  }

  async getSettingsStats(): Promise<SettingsStatsResponse> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getSettingsStats", params: {} });
    if (response.status) return response;
    throw new Error(response.message || "Failed to get settings statistics");
  }

  // Category-specific convenience methods
  async getGeneralSettings(): Promise<GeneralSettings> {
    try {
      const config = await this.getGroupedConfig();
      return config.data?.grouped_settings?.general || {};
    } catch { return {}; }
  }

  async getCollectionsSettings(): Promise<CollectionsSettings> {
    try {
      const config = await this.getGroupedConfig();
      return config.data?.grouped_settings?.collections || {};
    } catch { return {}; }
  }

  async getLoanSettings(): Promise<LoanSettings> {
    try {
      const config = await this.getGroupedConfig();
      return config.data?.grouped_settings?.loans || {};
    } catch { return {}; }
  }

  async getNotificationsSettings(): Promise<NotificationsSettings> {
    try {
      const config = await this.getGroupedConfig();
      return config.data?.grouped_settings?.notifications || {};
    } catch { return {}; }
  }

  async getReportsSettings(): Promise<ReportsSettings> {
    try {
      const config = await this.getGroupedConfig();
      return config.data?.grouped_settings?.reports || {};
    } catch { return {}; }
  }

  async getAuditSecuritySettings(): Promise<AuditSecuritySettings> {
    try {
      const config = await this.getGroupedConfig();
      return config.data?.grouped_settings?.audit_security || {};
    } catch { return {}; }
  }

  async getIntegrationsSettings(): Promise<IntegrationsSettings> {
    try {
      const config = await this.getGroupedConfig();
      return config.data?.grouped_settings?.integrations || {};
    } catch { return {}; }
  }

  async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("general", settings);
  }

  async updateCollectionsSettings(settings: Partial<CollectionsSettings>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("collections", settings);
  }

  async updateLoanSettings(settings: Partial<LoanSettings>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("loans", settings);
  }

  async updateNotificationsSettings(settings: Partial<NotificationsSettings>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("notifications", settings);
  }

  async updateReportsSettings(settings: Partial<ReportsSettings>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("reports", settings);
  }

  async updateAuditSecuritySettings(settings: Partial<AuditSecuritySettings>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("audit_security", settings);
  }

  async updateIntegrationsSettings(settings: Partial<IntegrationsSettings>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("integrations", settings);
  }

  async updateCategorySettings(category: string, settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateGroupedConfig({ [category]: settings });
  }

  async getAllSettingsAsObject(): Promise<Record<string, any>> {
    try {
      const response = await this.getAllSettings();
      const result: Record<string, any> = {};
      if (response.data) {
        response.data.forEach(setting => {
          result[`${setting.setting_type}.${setting.key}`] = setting.value;
        });
      }
      return result;
    } catch { return {}; }
  }

  async getSetting(category: string, key: string, defaultValue?: any): Promise<any> {
    try {
      const fullKey = `${category}.${key}`;
      const settings = await this.getAllSettingsAsObject();
      return settings[fullKey] ?? defaultValue;
    } catch { return defaultValue; }
  }

  async setSetting(category: string, key: string, value: any, description?: string): Promise<SettingResponse> {
    return this.setValueByKey(key, value, {
      setting_type: category as SettingType,
      description: description || `Setting for ${category}.${key}`,
      isPublic: false,
    });
  }

  async settingExists(key: string, settingType?: SettingType): Promise<boolean> {
    try {
      const response = await this.getSettingByKey(key, settingType);
      return response.status && response.data !== null;
    } catch { return false; }
  }

  async getBooleanSetting(category: string, key: string, defaultValue = false): Promise<boolean> {
    const value = await this.getSetting(category, key, defaultValue);
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
    if (typeof value === "number") return value === 1;
    return defaultValue;
  }

  async getNumberSetting(category: string, key: string, defaultValue = 0): Promise<number> {
    const value = await this.getSetting(category, key, defaultValue);
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  async getStringSetting(category: string, key: string, defaultValue = ""): Promise<string> {
    const value = await this.getSetting(category, key, defaultValue);
    return String(value);
  }

  async getArraySetting(category: string, key: string, defaultValue: any[] = []): Promise<any[]> {
    const value = await this.getSetting(category, key, defaultValue);
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try { return JSON.parse(value); } catch { return defaultValue; }
    }
    return defaultValue;
  }

  async getObjectSetting(category: string, key: string, defaultValue: object = {}): Promise<object> {
    const value = await this.getSetting(category, key, defaultValue);
    if (typeof value === "object" && value !== null && !Array.isArray(value)) return value;
    if (typeof value === "string") {
      try { const parsed = JSON.parse(value); if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed; } catch {}
    }
    return defaultValue;
  }

  async initializeDefaultSettings(): Promise<void> {
    const defaults: CreateSettingData[] = [
      { key: "company_name", value: "Debtify", setting_type: SettingType.GENERAL, description: "Company name", isPublic: false },
      { key: "default_timezone", value: "Asia/Manila", setting_type: SettingType.GENERAL, description: "Default timezone", isPublic: false },
      { key: "currency", value: "PHP", setting_type: SettingType.GENERAL, description: "Currency", isPublic: true },
      { key: "default_interest_rate", value: 10, setting_type: SettingType.COLLECTIONS, description: "Default interest rate (%)", isPublic: false },
      { key: "default_penalty_rate", value: 2, setting_type: SettingType.COLLECTIONS, description: "Default penalty rate (%) per day", isPublic: false },
      { key: "overdue_reminder_days", value: [7,3,1], setting_type: SettingType.COLLECTIONS, description: "Days before due to send reminders", isPublic: false },
      { key: "enable_auto_penalty", value: true, setting_type: SettingType.COLLECTIONS, description: "Automatically apply penalty on overdue", isPublic: false },
      { key: "email_enabled", value: false, setting_type: SettingType.NOTIFICATIONS, description: "Enable email notifications", isPublic: false },
      { key: "sms_enabled", value: false, setting_type: SettingType.NOTIFICATIONS, description: "Enable SMS notifications", isPublic: false },
      { key: "audit_log_enabled", value: true, setting_type: SettingType.AUDIT_SECURITY, description: "Enable audit logging", isPublic: false },
    ];
    for (const def of defaults) {
      const exists = await this.settingExists(def.key, def.setting_type);
      if (!exists) await this.createSetting(def);
    }
  }

  async exportSettingsToFile(): Promise<string> {
    const config = await this.getGroupedConfig();
    return JSON.stringify(config.data, null, 2);
  }

  async importSettingsFromFile(jsonData: string): Promise<SystemConfigResponse> {
    const configData = JSON.parse(jsonData);
    return this.updateGroupedConfig(configData);
  }

  async resetToDefaults(): Promise<SystemConfigResponse> {
    const all = await this.getAllSettings();
    const ids = all.data?.map(s => s.id) || [];
    if (ids.length) await this.bulkDelete(ids);
    await this.initializeDefaultSettings();
    return this.getGroupedConfig();
  }

  async getSystemHealth(): Promise<{ settings_count: number; last_updated: string; has_errors: boolean; categories: string[] }> {
    try {
      const stats = await this.getSettingsStats();
      const config = await this.getGroupedConfig();
      return {
        settings_count: stats.data?.total || 0,
        last_updated: config.data?.system_info?.current_time || new Date().toISOString(),
        has_errors: false,
        categories: config.data?.system_info?.setting_types || [],
      };
    } catch {
      return { settings_count: 0, last_updated: new Date().toISOString(), has_errors: true, categories: [] };
    }
  }

  async validateSettings(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    try {
      const config = await this.getGroupedConfig();
      if (!config.data) errors.push("No configuration data found");
      const general = config.data?.grouped_settings?.general;
      if (general && !general.company_name) warnings.push("Company name not set");
      const emailEnabled = await this.getBooleanSetting("notifications", "email_enabled");
      if (emailEnabled) {
        const host = await this.getStringSetting("notifications", "email_smtp_host");
        if (!host) warnings.push("Email enabled but SMTP host not configured");
      }
      return { valid: errors.length === 0, errors, warnings };
    } catch (e: any) {
      errors.push(e.message);
      return { valid: false, errors, warnings };
    }
  }

  async getPublicSystemSettings(): Promise<PublicSystemSettings> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getPublicSystemSettings", params: {} });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to fetch public settings");
  }

  async getSystemInfoForFrontend(): Promise<{ system_info: FrontendSystemInfo; public_settings: any; cache_timestamp: string }> {
    if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
    const response = await window.backendAPI.systemConfig({ method: "getSystemInfoForFrontend", params: {} });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to fetch system info");
  }
}

const systemConfigAPI = new SystemConfigAPI();
export default systemConfigAPI;