// src/renderer/pages/loans/overdue/hooks/useOverdueLoans.ts
import { useState, useEffect, useCallback, useRef } from "react";
import debtsAPI from "../../../../api/core/debt";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";
import type { Debt } from "../../../../api/core/debt";

export interface OverdueFilter {
  search: string;
  daysOverdue: string; // "all", "30", "60", "90"
}

export interface OverdueLoan extends Debt {
  daysOverdue: number;
  penaltyAmount?: number;
}

interface UseOverdueLoansReturn {
  loans: OverdueLoan[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  filters: OverdueFilter;
  selectedLoans: number[];
  setSelectedLoans: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  handleFilterChange: (key: keyof OverdueFilter, value: string) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
}

const useOverdueLoans = (): UseOverdueLoansReturn => {
  const [loans, setLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "daysOverdue",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  const [filters, setFilters] = useState<OverdueFilter>({ search: "", daysOverdue: "all" });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const calculateDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = today.getTime() - due.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const fetchOverdueLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Map sort key to backend field
      let sortBy = sortConfig.key;
      if (sortBy === "borrower") sortBy = "borrowerName";
      if (sortBy === "daysOverdue") sortBy = "dueDate"; // server sorts by dueDate to get most overdue first? Actually we'll use dueDate for server sort, then client will sort by daysOverdue if requested.
      // For simplicity, if sorting by daysOverdue, we'll fetch unsorted from server and sort client-side.
      // Better: send sortBy = "dueDate" when daysOverdue is requested, because days overdue is derived from dueDate.
      const effectiveSortBy = sortConfig.key === "daysOverdue" ? "dueDate" : sortBy;
      const response = await debtsAPI.getAll({
        status: "overdue",
        includeDeleted: false,
        page: currentPage,
        limit: pageSize,
        search: filters.search || undefined,
        sortBy: effectiveSortBy,
        sortOrder: sortConfig.direction.toUpperCase() as "ASC" | "DESC",
      });
      if (!response.status) throw new Error(response.message || "Failed to fetch overdue loans");
      const debtsData = response.data.data;
      const pagination = response.data.pagination;

      // Compute daysOverdue for each debt
      let loansWithDays = debtsData.map(debt => ({
        ...debt,
        daysOverdue: calculateDaysOverdue(debt.dueDate),
      }));

      // Apply daysOverdue filter (client-side)
      if (filters.daysOverdue !== "all") {
        const minDays = parseInt(filters.daysOverdue);
        loansWithDays = loansWithDays.filter(loan => loan.daysOverdue >= minDays);
      }

      // If sorting by daysOverdue, re-sort client-side
      if (sortConfig.key === "daysOverdue") {
        loansWithDays.sort((a, b) => {
          const aVal = a.daysOverdue;
          const bVal = b.daysOverdue;
          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      // Fetch penalty amounts for these loans (only once per page)
      const loansWithPenalty = await Promise.all(
        loansWithDays.map(async (loan) => {
          let penaltyAmount = 0;
          try {
            const penaltyRes = await penaltiesAPI.getTotalPenaltyForDebt(loan.id);
            if (penaltyRes.status) penaltyAmount = penaltyRes.data.totalPenalty;
          } catch (e) {
            console.error(`Failed to fetch penalty for debt ${loan.id}`, e);
          }
          return { ...loan, penaltyAmount };
        })
      );

      if (mountedRef.current) {
        setLoans(loansWithPenalty);
        setPaginationMeta({
          page: pagination.page,
          totalPages: pagination.pages,
          totalItems: pagination.total,
          pageSize: pagination.limit,
        });
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message || "Failed to load overdue loans");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, filters.search, filters.daysOverdue, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    fetchOverdueLoans();
  }, [fetchOverdueLoans]);

  const handleFilterChange = (key: keyof OverdueFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", daysOverdue: "all" });
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
    fetchOverdueLoans();
  };

  const setPageSizeHandler = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    loans,
    loading,
    error,
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

export default useOverdueLoans;