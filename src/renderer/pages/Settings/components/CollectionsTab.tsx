// src/renderer/pages/Settings/components/CollectionsTab.tsx
import React from "react";
import type { CollectionsSettings } from "../../../api/utils/system_config";

interface Props {
  settings: CollectionsSettings;
  onUpdate: (field: keyof CollectionsSettings, value: any) => void;
}

const CollectionsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Collections Settings
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.default_interest_rate ?? 10}
            onChange={(e) =>
              onUpdate("default_interest_rate", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Penalty Rate (% per day)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.default_penalty_rate ?? 2}
            onChange={(e) =>
              onUpdate("default_penalty_rate", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Penalty Calculation Method
          </label>
          <select
            value={settings.penalty_calculation_method ?? "percentage"}
            onChange={(e) =>
              onUpdate("penalty_calculation_method", e.target.value)
            }
            className="windows-input w-full"
          >
            <option value="percentage">Percentage of remaining balance</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Penalty Grace Days
          </label>
          <input
            type="number"
            value={settings.penalty_grace_days ?? 0}
            onChange={(e) =>
              onUpdate("penalty_grace_days", parseInt(e.target.value) || 0)
            }
            className="windows-input w-full"
            min="0"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enable_auto_penalty"
            checked={settings.enable_auto_penalty || false}
            onChange={(e) => onUpdate("enable_auto_penalty", e.target.checked)}
            className="windows-checkbox"
          />
          <label
            htmlFor="enable_auto_penalty"
            className="text-sm text-[var(--text-secondary)]"
          >
            Automatically apply penalty when overdue
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Overdue Reminder Days (comma separated)
          </label>
          <input
            type="text"
            value={
              Array.isArray(settings.overdue_reminder_days)
                ? settings.overdue_reminder_days.join(", ")
                : "7, 3, 1"
            }
            onChange={(e) => {
              const days = e.target.value
                .split(",")
                .map((d) => parseInt(d.trim()))
                .filter((d) => !isNaN(d));
              onUpdate("overdue_reminder_days", days);
            }}
            className="windows-input w-full"
            placeholder="e.g., 7, 3, 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Max Loan Amount (0 = unlimited)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.max_loan_amount ?? 0}
            onChange={(e) =>
              onUpdate("max_loan_amount", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Min Loan Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.min_loan_amount ?? 0}
            onChange={(e) =>
              onUpdate("min_loan_amount", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enforce_credit_check"
            checked={settings.enforce_credit_check || false}
            onChange={(e) => onUpdate("enforce_credit_check", e.target.checked)}
            className="windows-checkbox"
          />
          <label
            htmlFor="enforce_credit_check"
            className="text-sm text-[var(--text-secondary)]"
          >
            Require credit check before loan approval
          </label>
        </div>
      </div>
    </div>
  );
};

export default CollectionsTab;