// src/renderer/pages/loans/closed/hooks/useClosedLoans.ts
import { useState, useEffect, useCallback, useRef } from "react";
import debtsAPI from "../../../../api/core/debt";
import paymentsAPI from "../../../../api/core/payment_transaction";
import type { Debt } from "../../../../api/core/debt";

export interface ClosedLoanFilters {
  search: string;
  // closedDateFrom and closedDateTo removed – not supported by backend
}

export interface ClosedLoan extends Debt {
  lastPaymentDate: string | null;
  totalPaidAmount: number;
  closedAt: string;
}

interface UseClosedLoansReturn {
  loans: ClosedLoan[];
  loading: boolean;
  error: string | null;
  summary: { totalCount: number; totalAmountPaid: number };
  pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  filters: ClosedLoanFilters;
  selectedLoans: number[];
  setSelectedLoans: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  handleFilterChange: (key: keyof ClosedLoanFilters, value: string) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
}

const useClosedLoans = (): UseClosedLoansReturn => {
  const [loans, setLoans] = useState<ClosedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "closedAt",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  const [filters, setFilters] = useState<ClosedLoanFilters>({
    search: "",
  });
  const [summary, setSummary] = useState({ totalCount: 0, totalAmountPaid: 0 });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchClosedLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let sortBy = sortConfig.key;
      if (sortBy === "borrower") sortBy = "borrowerName";
      if (sortBy === "closedAt") sortBy = "updatedAt";      // backend sorts by updatedAt for closure date
      if (sortBy === "lastPaymentDate") sortBy = "updatedAt";
      if (sortBy === "paidAmount") sortBy = "paidAmount";
      if (sortBy === "totalAmount") sortBy = "totalAmount";

      const response = await debtsAPI.getAll({
        status: "paid",
        includeDeleted: false,
        page: currentPage,
        limit: pageSize,
        search: filters.search || undefined,
        sortBy,
        sortOrder: sortConfig.direction.toUpperCase() as "ASC" | "DESC",
        // no closedDate filters – backend doesn't support them
      });
      if (!response.status) throw new Error(response.message || "Failed to fetch closed loans");
      const debtsData = response.data.data;
      const pagination = response.data.pagination;

      // Add last payment date for each loan in current page
      const loansWithDetails: ClosedLoan[] = await Promise.all(
        debtsData.map(async (debt) => {
          let lastPaymentDate: string | null = null;
          try {
            const paymentsRes = await paymentsAPI.getByDebtId(debt.id);
            if (paymentsRes.length > 0) {
              const lastPayment = paymentsRes.reduce((latest, p) =>
                new Date(p.paymentDate) > new Date(latest.paymentDate) ? p : latest
              );
              lastPaymentDate = lastPayment.paymentDate;
            }
          } catch (e) {
            console.error(`Failed to fetch payments for debt ${debt.id}`, e);
          }
          return {
            ...debt,
            lastPaymentDate,
            totalPaidAmount: debt.paidAmount,
            closedAt: debt.updatedAt,
          };
        })
      );

      if (mountedRef.current) {
        setLoans(loansWithDetails);
        setPaginationMeta({
          page: pagination.page,
          totalPages: pagination.pages,
          totalItems: pagination.total,
          pageSize: pagination.limit,
        });
        setSummary({
          totalCount: pagination.total,
          totalAmountPaid: debtsData.reduce((sum, d) => sum + d.paidAmount, 0), // only current page
        });
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message || "Failed to load closed loans");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, filters.search, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    fetchClosedLoans();
  }, [fetchClosedLoans]);

  const handleFilterChange = (key: keyof ClosedLoanFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "" });
    setCurrentPage(1);
  };

  const toggleLoanSelection = (id: number) => {
    setSelectedLoans(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedLoans(prev =>
      prev.length === loans.length ? [] : loans.map(l => l.id)
    );
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const reload = () => {
    fetchClosedLoans();
  };

  const setPageSizeHandler = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    loans,
    loading,
    error,
    summary,
    pagination: {
      page: paginationMeta.page,
      totalPages: paginationMeta.totalPages,
      totalItems: paginationMeta.totalItems,
      pageSize: paginationMeta.pageSize,
    },
    filters,
    selectedLoans,
    setSelectedLoans,
    sortConfig,
    setSortConfig,
    pageSize,
    setPageSize: setPageSizeHandler,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleLoanSelection,
    toggleSelectAll,
    handleSort,
  };
};

export default useClosedLoans;