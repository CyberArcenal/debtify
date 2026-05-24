// src/renderer/pages/Settings/components/NotificationsTab.tsx
import React, { useState } from "react";
import type { NotificationsSettings } from "../../../api/utils/system_config";

interface Props {
  settings: NotificationsSettings;
  onUpdate: (field: keyof NotificationsSettings, value: any) => void;
}

const NotificationsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  // Modal state
  const [modal, setModal] = useState<{
    visible: boolean;
    type: "smtp" | "sms";
    loading: boolean;
    result: { success: boolean; message: string } | null;
  }>({
    visible: false,
    type: "smtp",
    loading: false,
    result: null,
  });

  const closeModal = () => {
    setModal({ visible: false, type: "smtp", loading: false, result: null });
  };

  const testSMTP = async () => {
    setModal({
      visible: true,
      type: "smtp",
      loading: true,
      result: null,
    });

    try {
      if (!window.backendAPI?.systemConfig)
        throw new Error("Electron API not available");

      const response = await window.backendAPI.systemConfig({
        method: "testSmtpConnection",
        params: { settings },
      });

      setModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          success: response.status,
          message: response.message || (response.status ? "SMTP connection successful" : "SMTP connection failed"),
        },
      }));
    } catch (err: any) {
      setModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: err.message || "Failed to test SMTP connection",
        },
      }));
    }
  };

  const testSMS = async () => {
    setModal({
      visible: true,
      type: "sms",
      loading: true,
      result: null,
    });

    try {
      if (!window.backendAPI?.systemConfig)
        throw new Error("Electron API not available");

      const response = await window.backendAPI.systemConfig({
        method: "testSmsConnection",
        params: { settings },
      });

      setModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          success: response.status,
          message: response.message || (response.status ? "SMS connection successful" : "SMS connection failed"),
        },
      }));
    } catch (err: any) {
      setModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: err.message || "Failed to test SMS connection",
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Notification Settings
      </h3>

      {/* General toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ... existing toggles (unchanged) ... */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="email_enabled"
            checked={settings.email_enabled || false}
            onChange={(e) => onUpdate("email_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label
            htmlFor="email_enabled"
            className="text-sm text-[var(--text-secondary)]"
          >
            Enable Email Notifications
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sms_enabled"
            checked={settings.sms_enabled || false}
            onChange={(e) => onUpdate("sms_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label
            htmlFor="sms_enabled"
            className="text-sm text-[var(--text-secondary)]"
          >
            Enable SMS Notifications
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="notify_on_payment"
            checked={settings.notify_on_payment || false}
            onChange={(e) => onUpdate("notify_on_payment", e.target.checked)}
            className="windows-checkbox"
          />
          <label
            htmlFor="notify_on_payment"
            className="text-sm text-[var(--text-secondary)]"
          >
            Notify debtor on payment received
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="notify_on_penalty"
            checked={settings.notify_on_penalty || false}
            onChange={(e) => onUpdate("notify_on_penalty", e.target.checked)}
            className="windows-checkbox"
          />
          <label
            htmlFor="notify_on_penalty"
            className="text-sm text-[var(--text-secondary)]"
          >
            Notify debtor when penalty is applied
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="send_reminders"
            checked={(settings.reminder_days_before_due?.length ?? 0) > 0}
            onChange={(e) => {
              if (e.target.checked) {
                onUpdate("reminder_days_before_due", [7, 3, 1]);
              } else {
                onUpdate("reminder_days_before_due", []);
              }
            }}
            className="windows-checkbox"
          />
          <label
            htmlFor="send_reminders"
            className="text-sm text-[var(--text-secondary)]"
          >
            Send overdue reminders
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Reminder Days Before Due (comma separated)
          </label>
          <input
            type="text"
            value={
              Array.isArray(settings.reminder_days_before_due)
                ? settings.reminder_days_before_due.join(", ")
                : ""
            }
            onChange={(e) => {
              const days = e.target.value
                .split(",")
                .map((d) => parseInt(d.trim(), 10))
                .filter((d) => !isNaN(d));
              onUpdate("reminder_days_before_due", days);
            }}
            className="windows-input w-full"
            placeholder="e.g., 7, 3, 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Overdue Notification Frequency
          </label>
          <select
            value={settings.overdue_notification_frequency || "daily"}
            onChange={(e) =>
              onUpdate("overdue_notification_frequency", e.target.value)
            }
            className="windows-input w-full"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      {/* Email SMTP Settings */}
      <div className="border-t border-[var(--border-color)] pt-4">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">
          Email (SMTP) Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ... existing SMTP fields (host, port, from, username, password) ... */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMTP Host
            </label>
            <input
              type="text"
              value={settings.email_smtp_host || ""}
              onChange={(e) => onUpdate("email_smtp_host", e.target.value)}
              className="windows-input w-full"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMTP Port
            </label>
            <input
              type="number"
              value={settings.email_smtp_port || 587}
              onChange={(e) =>
                onUpdate("email_smtp_port", parseInt(e.target.value, 10) || 0)
              }
              className="windows-input w-full"
              placeholder="587"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              From Address
            </label>
            <input
              type="email"
              value={settings.email_from_address || ""}
              onChange={(e) => onUpdate("email_from_address", e.target.value)}
              className="windows-input w-full"
              placeholder="noreply@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMTP Username
            </label>
            <input
              type="text"
              value={settings.email_smtp_username || ""}
              onChange={(e) => onUpdate("email_smtp_username", e.target.value)}
              className="windows-input w-full"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMTP Password
            </label>
            <input
              type="password"
              value={settings.email_smtp_password || ""}
              onChange={(e) => onUpdate("email_smtp_password", e.target.value)}
              className="windows-input w-full"
              placeholder="••••••••"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={testSMTP}
              className="windows-button windows-button-secondary text-sm"
            >
              Test SMTP Connection
            </button>
          </div>
        </div>
      </div>

      {/* SMS (Twilio) Settings */}
      <div className="border-t border-[var(--border-color)] pt-4">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">
          SMS (Twilio) Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ... existing SMS fields ... */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMS Provider
            </label>
            <input
              type="text"
              value={settings.sms_provider || "twilio"}
              onChange={(e) => onUpdate("sms_provider", e.target.value)}
              className="windows-input w-full"
              placeholder="twilio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Account SID
            </label>
            <input
              type="text"
              value={settings.twilio_account_sid || ""}
              onChange={(e) => onUpdate("twilio_account_sid", e.target.value)}
              className="windows-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Auth Token
            </label>
            <input
              type="password"
              value={settings.twilio_auth_token || ""}
              onChange={(e) => onUpdate("twilio_auth_token", e.target.value)}
              className="windows-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={settings.twilio_phone_number || ""}
              onChange={(e) => onUpdate("twilio_phone_number", e.target.value)}
              className="windows-input w-full"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Messaging Service SID
            </label>
            <input
              type="text"
              value={settings.twilio_messaging_service_sid || ""}
              onChange={(e) =>
                onUpdate("twilio_messaging_service_sid", e.target.value)
              }
              className="windows-input w-full"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={testSMS}
            className="windows-button windows-button-secondary text-sm"
          >
            Test SMS Connection
          </button>
        </div>
      </div>

      {/* ========== MODAL COMPONENT ========== */}
      {modal.visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300"
          onClick={closeModal}
        >
          <div
            className="bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Testing {modal.type === "smtp" ? "SMTP" : "SMS"} Connection
                </h3>
                <button
                  onClick={closeModal}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col items-center justify-center py-6">
                {modal.loading ? (
                  <>
                    <div className="w-12 h-12 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[var(--text-secondary)]">
                      Testing connection, please wait...
                    </p>
                  </>
                ) : modal.result ? (
                  <>
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                        modal.result.success
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {modal.result.success ? (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <p
                      className={`text-center ${
                        modal.result.success
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {modal.result.message}
                    </p>
                  </>
                ) : null}
              </div>

              {/* Footer */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={closeModal}
                  className="windows-button windows-button-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;