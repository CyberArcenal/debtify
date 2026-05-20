// src/renderer/pages/loans/applications/hooks/useLoanApplications.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { LoanApplication } from "../../../../api/core/loan_application";
import loanApplicationsAPI from "../../../../api/core/loan_application";

interface UseLoanApplicationsReturn {
  applications: LoanApplication[];
  pendingApps: LoanApplication[];
  approvedApps: LoanApplication[];
  rejectedApps: LoanApplication[];
  loading: boolean;
  refresh: () => Promise<void>;
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

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all applications (no status filter yet)
      const response = await loanApplicationsAPI.getAll();
      if (response.status) {
        setApplications(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Failed to load loan applications:", err);
      // Optionally show error toast
      setApplications([]);
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
      const response = await loanApplicationsAPI.approve(id);
      if (response.status) {
        await loadApplications();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Approve failed:", err);
      throw err;
    }
  };

  const reject = async (id: number, reason?: string) => {
    try {
      const response = await loanApplicationsAPI.reject(id, reason);
      if (response.status) {
        await loadApplications();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Reject failed:", err);
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      const response = await loanApplicationsAPI.delete(id);
      if (response.status) {
        await loadApplications();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      throw err;
    }
  };

  const refresh = async () => {
    await loadApplications();
  };

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