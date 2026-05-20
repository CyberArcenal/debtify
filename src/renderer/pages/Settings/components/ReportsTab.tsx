// src/renderer/pages/Settings/components/ReportsTab.tsx
import React from "react";
import type { ReportsSettings } from "../../../api/utils/system_config";

interface Props {
  settings: ReportsSettings;
  onUpdate: (field: keyof ReportsSettings, value: any) => void;
}

const ReportsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const handleExportFormatsChange = (value: string) => {
    const formats = value
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    onUpdate("export_formats", formats);
  };

  const getExportFormatsDisplay = (): string => {
    const formats = settings.export_formats;
    if (Array.isArray(formats)) return formats.join(", ");
    if (typeof formats === "string") {
      try {
        const parsed = JSON.parse(formats);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch {}
      return formats;
    }
    return "CSV, Excel, PDF";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Reports Settings
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Export Formats (comma separated)
          </label>
          <input
            type="text"
            value={getExportFormatsDisplay()}
            onChange={(e) => handleExportFormatsChange(e.target.value)}
            className="windows-input w-full"
            placeholder="CSV, Excel, PDF"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Export Format
          </label>
          <select
            value={settings.default_export_format || "CSV"}
            onChange={(e) => onUpdate("default_export_format", e.target.value)}
            className="windows-input w-full"
          >
            <option value="CSV">CSV</option>
            <option value="Excel">Excel</option>
            <option value="PDF">PDF</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_backup_enabled"
            checked={settings.auto_backup_enabled || false}
            onChange={(e) => onUpdate("auto_backup_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label
            htmlFor="auto_backup_enabled"
            className="text-sm text-[var(--text-secondary)]"
          >
            Enable Automatic Backups
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Backup Schedule (cron expression)
          </label>
          <input
            type="text"
            value={settings.backup_schedule || "0 2 * * *"}
            onChange={(e) => onUpdate("backup_schedule", e.target.value)}
            className="windows-input w-full"
            placeholder="0 2 * * *"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Backup Location
          </label>
          <input
            type="text"
            value={settings.backup_location || "./backups"}
            onChange={(e) => onUpdate("backup_location", e.target.value)}
            className="windows-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Data Retention (days)
          </label>
          <input
            type="number"
            value={settings.data_retention_days ?? 365}
            onChange={(e) =>
              onUpdate("data_retention_days", parseInt(e.target.value) || 0)
            }
            className="windows-input w-full"
            min="0"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include_audit_in_backup"
            checked={settings.include_audit_in_backup || false}
            onChange={(e) =>
              onUpdate("include_audit_in_backup", e.target.checked)
            }
            className="windows-checkbox"
          />
          <label
            htmlFor="include_audit_in_backup"
            className="text-sm text-[var(--text-secondary)]"
          >
            Include audit logs in backup
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;