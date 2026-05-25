// src/renderer/pages/loans/overdue/hooks/useOverdueLoans.ts
import { useState, useEffect, useCallback, useRef } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";

export interface OverdueFilter {
  search: string;
  daysOverdue: string; // "all", "30", "60", "90"
}

// Extended type: ang stats ay palaging present para sa overdue page
export interface OverdueLoan extends Debt {
  stats: NonNullable<Debt["stats"]>; // siguraduhing may stats
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

  const fetchOverdueLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Gamitin ang `sortBy` na "dueDate" para sa daysOverdue sorting (dahil ang daysOverdue ay derived sa dueDate)
      let effectiveSortBy = sortConfig.key;
      if (sortConfig.key === "daysOverdue") effectiveSortBy = "dueDate";
      if (sortConfig.key === "borrower") effectiveSortBy = "borrowerName";

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

      // ✅ Direktang gamitin ang stats mula sa backend (kasama na ang totalPenalty at daysOverdue)
      let loansWithStats = debtsData
        .filter(debt => debt.stats) // i-filter kung walang stats (safety)
        .map(debt => ({
          ...debt,
          stats: debt.stats!,
        })) as OverdueLoan[];

      // I‑filter ayon sa `daysOverdue` (gamit ang stats.daysOverdue)
      if (filters.daysOverdue !== "all") {
        const minDays = parseInt(filters.daysOverdue);
        loansWithStats = loansWithStats.filter(loan => loan.stats.daysOverdue >= minDays);
      }

      // Kung ang sorting ay "daysOverdue", kailangan pang i‑sort ulit (dahil ang backend sort ay ayon sa dueDate)
      if (sortConfig.key === "daysOverdue") {
        loansWithStats.sort((a, b) => {
          const aVal = a.stats.daysOverdue;
          const bVal = b.stats.daysOverdue;
          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      if (mountedRef.current) {
        setLoans(loansWithStats);
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