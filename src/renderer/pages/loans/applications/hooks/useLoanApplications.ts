// src/renderer/pages/loans/applications/hooks/useLoanApplications.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { getApplications, approveApplication, rejectApplication, deleteApplication } from "../services/mockApplicationService";
import type { LoanApplication } from "../types";

interface UseLoanApplicationsReturn {
  applications: LoanApplication[];
  pendingApps: LoanApplication[];
  approvedApps: LoanApplication[];
  rejectedApps: LoanApplication[];
  loading: boolean;
  refresh: () => void;
  approve: (id: number) => Promise<void>;
  reject: (id: number, reason?: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
  activeTab: "pending" | "approved" | "rejected";
  setActiveTab: (tab: "pending" | "approved" | "rejected") => void;
}

const useLoanApplications = (): UseLoanApplicationsReturn => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  const loadApplications = useCallback(() => {
    setLoading(true);
    try {
      const apps = getApplications();
      setApplications(apps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const pendingApps = useMemo(() => applications.filter(a => a.status === "pending"), [applications]);
  const approvedApps = useMemo(() => applications.filter(a => a.status === "approved"), [applications]);
  const rejectedApps = useMemo(() => applications.filter(a => a.status === "rejected"), [applications]);

  const approve = async (id: number) => {
    try {
      await approveApplication(id);
      loadApplications();
    } catch (err: any) {
      throw err;
    }
  };

  const reject = async (id: number, reason?: string) => {
    try {
      await rejectApplication(id, reason);
      loadApplications();
    } catch (err: any) {
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      deleteApplication(id);
      loadApplications();
    } catch (err: any) {
      throw err;
    }
  };

  const refresh = () => loadApplications();

  return {
    applications,
    pendingApps,
    approvedApps,
    rejectedApps,
    loading,
    refresh,
    approve,
    reject,
    remove,
    activeTab,
    setActiveTab,
  };
};

export default useLoanApplications;