// src/renderer/pages/loans/applications/hooks/useLoanApplications.ts
import { useState, useEffect, useCallback } from "react";
import type { LoanApplication } from "../../../../api/core/loan_application";
import loanApplicationsAPI from "../../../../api/core/loan_application";

interface UseLoanApplicationsReturn {
  applications: LoanApplication[];
  loading: boolean;
  pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  activeTab: "pending" | "approved" | "rejected";
  setActiveTab: (tab: "pending" | "approved" | "rejected") => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
  approve: (id: number) => Promise<void>;
  reject: (id: number, reason?: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const useLoanApplications = (initialPageSize = 9): UseLoanApplicationsReturn => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [paginationMeta, setPaginationMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: initialPageSize });

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await loanApplicationsAPI.getAll({
        status: activeTab,
        page: currentPage,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      if (response.status) {
        // response.data is PaginatedResult<LoanApplication>
        setApplications(response.data.data);
        setPaginationMeta({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.pages,
          totalItems: response.data.pagination.total,
          pageSize: response.data.pagination.limit,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Failed to load loan applications:", err);
      setApplications([]);
      setPaginationMeta({ page: 1, totalPages: 1, totalItems: 0, pageSize });
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, pageSize]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const approve = async (id: number) => {
    try {
      const response = await loanApplicationsAPI.approve(id);
      if (response.status) {
        // After approval, the application status changes; refresh current tab
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
    loading,
    pagination: {
      page: paginationMeta.page,
      totalPages: paginationMeta.totalPages,
      totalItems: paginationMeta.totalItems,
      pageSize: paginationMeta.pageSize,
    },
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    refresh,
    approve,
    reject,
    remove,
  };
};

export default useLoanApplications;