// src/components/Shared/StatusIndicators.tsx
import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type IndicatorType = "audit" | "email" | "sms";

interface StatusState {
  active: boolean;
  status?: string;
  deletedCount?: number;
  message?: string;
  lastTarget?: string;
  lastStatus?: string;
}

const StatusIndicators: React.FC = () => {
  const [auditStatus, setAuditStatus] = useState<StatusState>({ active: false });
  const [emailStatus, setEmailStatus] = useState<StatusState>({ active: false });
  const [smsStatus, setSmsStatus] = useState<StatusState>({ active: false });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const auditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const smsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (auditTimeoutRef.current) clearTimeout(auditTimeoutRef.current);
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
      if (smsTimeoutRef.current) clearTimeout(smsTimeoutRef.current);
    };
  }, []);

  // AUDIT CLEANUP LISTENER (FIXED: clears message after timeout)
  useEffect(() => {
    const cleanupListener = (event: any, data: any) => {
      if (!mountedRef.current) return;

      // Clear any pending timeout for audit
      if (auditTimeoutRef.current) clearTimeout(auditTimeoutRef.current);

      if (data.status === "started") {
        setAuditStatus({ active: true, status: "started" });
        auditTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setAuditStatus({ active: false });
        }, 5000);
      } else if (data.status === "completed") {
        setAuditStatus({
          active: false,
          status: "completed",
          deletedCount: data.deletedCount,
          message: `${data.deletedCount} old audit records deleted`,
        });
        auditTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setAuditStatus({ active: false });
        }, 5000);
      } else if (data.status === "failed") {
        setAuditStatus({
          active: false,
          status: "failed",
          message: `Cleanup failed: ${data.error}`,
        });
        auditTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setAuditStatus({ active: false });
        }, 5000);
      }
    };
    window.backendAPI?.on?.("audit:cleanup", cleanupListener);
    return () => window.backendAPI?.off?.("audit:cleanup", cleanupListener);
  }, []);

  // EMAIL STATUS LISTENER (unchanged)
  useEffect(() => {
    const emailListener = (event: any, data: any) => {
      if (!mountedRef.current) return;
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
      if (data.status === "sending") {
        setEmailStatus({ active: true, lastStatus: "sending", lastTarget: data.to });
      } else if (data.status === "sent") {
        setEmailStatus({ active: false, lastStatus: "sent", lastTarget: data.to });
        emailTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setEmailStatus((prev) => ({ ...prev, active: false, lastStatus: undefined, lastTarget: undefined }));
        }, 3000);
      } else if (data.status === "failed") {
        setEmailStatus({ active: false, lastStatus: "failed", lastTarget: data.to });
        emailTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setEmailStatus((prev) => ({ ...prev, active: false, lastStatus: undefined, lastTarget: undefined }));
        }, 5000);
      }
    };
    window.backendAPI?.on?.("email:status", emailListener);
    return () => window.backendAPI?.off?.("email:status", emailListener);
  }, []);

  // SMS STATUS LISTENER (unchanged)
  useEffect(() => {
    const smsListener = (event: any, data: any) => {
      if (!mountedRef.current) return;
      if (smsTimeoutRef.current) clearTimeout(smsTimeoutRef.current);
      if (data.status === "sending") {
        setSmsStatus({ active: true, lastStatus: "sending", lastTarget: data.to });
      } else if (data.status === "sent") {
        setSmsStatus({ active: false, lastStatus: "sent", lastTarget: data.to });
        smsTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setSmsStatus((prev) => ({ ...prev, active: false, lastStatus: undefined, lastTarget: undefined }));
        }, 3000);
      } else if (data.status === "failed") {
        setSmsStatus({ active: false, lastStatus: "failed", lastTarget: data.to });
        smsTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setSmsStatus((prev) => ({ ...prev, active: false, lastStatus: undefined, lastTarget: undefined }));
        }, 5000);
      }
    };
    window.backendAPI?.on?.("sms:status", smsListener);
    return () => window.backendAPI?.off?.("sms:status", smsListener);
  }, []);

  const renderIndicator = (type: IndicatorType, status: StatusState) => {
    if (type === "audit") {
      if (status.active && status.status === "started") {
        return (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> Cleaning audit logs...
          </div>
        );
      }
      if (!status.active && status.status === "completed") {
        return (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs">
            <CheckCircle className="w-3 h-3" /> {status.message}
          </div>
        );
      }
      if (!status.active && status.status === "failed") {
        return (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs">
            <XCircle className="w-3 h-3" /> {status.message}
          </div>
        );
      }
    } else {
      // email or sms
      if (status.lastStatus === "sending") {
        return (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> Sending {type}...
          </div>
        );
      }
      if (status.lastStatus === "sent") {
        return (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs">
            <CheckCircle className="w-3 h-3" /> {type.toUpperCase()} sent to {status.lastTarget}
          </div>
        );
      }
      if (status.lastStatus === "failed") {
        return (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs">
            <XCircle className="w-3 h-3" /> {type.toUpperCase()} failed
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="flex items-center gap-2">
      {renderIndicator("audit", auditStatus)}
      {renderIndicator("email", emailStatus)}
      {renderIndicator("sms", smsStatus)}
    </div>
  );
};

export default StatusIndicators;