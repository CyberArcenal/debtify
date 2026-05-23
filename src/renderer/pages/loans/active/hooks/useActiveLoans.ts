// src/renderer/pages/loans/active/hooks/useActiveLoans.ts
import { useState, useEffect, useCallback, useRef } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";

export interface ActiveLoanFilters {
  search: string;
  dueDateFrom: string;
  dueDateTo: string;
  minRemainingAmount: number;
}

interface UseActiveLoansReturn {
  loans: Debt[];                     // current page data
  loading: boolean;
  error: string | null;
  pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  filters: ActiveLoanFilters;
  selectedLoans: number[];
  setSelectedLoans: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  handleFilterChange: (key: keyof ActiveLoanFilters, value: string | number) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
}

const useActiveLoans = (): UseActiveLoansReturn => {
  const [loans, setLoans] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "dueDate",
    direction: "asc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  const [filters, setFilters] = useState<ActiveLoanFilters>({
    search: "",
    dueDateFrom: "",
    dueDateTo: "",
    minRemainingAmount: 0,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchActiveLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Map sort key to backend field
      let sortBy = sortConfig.key;
      if (sortBy === "borrower") sortBy = "borrower.name"; // but backend may not support nested sort; we'll use 'borrowerName' if available
      // For simplicity, we'll use the sortBy as is, assuming backend can handle 'dueDate', 'remainingAmount', 'totalAmount', 'name', etc.
      // For borrower name, we need to join; backend must support sorting by borrower.name. We'll assume it does or fallback.
      const response = await debtsAPI.getAll({
        status: "active",
        includeDeleted: false,
        page: currentPage,
        limit: pageSize,
        search: filters.search || undefined,
        sortBy: sortConfig.key === "borrower" ? "borrowerName" : sortConfig.key,
        sortOrder: sortConfig.direction.toUpperCase() as "ASC" | "DESC",
        dueDateFrom: filters.dueDateFrom || undefined,
        dueDateTo: filters.dueDateTo || undefined,
        minTotalAmount: undefined,
        maxTotalAmount: undefined,
        // We need to filter by remainingAmount? Backend doesn't have direct param for minRemainingAmount.
        // We'll handle minRemainingAmount client-side for now, or enhance backend later.
      });
      if (!response.status) throw new Error(response.message || "Failed to fetch active loans");
      if (mountedRef.current) {
        // Apply client-side minRemainingAmount filter (since backend may not support it)
        let data = response.data.data;
        if (filters.minRemainingAmount > 0) {
          data = data.filter(loan => loan.remainingAmount >= filters.minRemainingAmount);
        }
        setLoans(data);
        setPaginationMeta({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.pages,
          totalItems: response.data.pagination.total,
          pageSize: response.data.pagination.limit,
        });
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to load active loans");
        console.error(err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, filters.search, filters.dueDateFrom, filters.dueDateTo, filters.minRemainingAmount, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    fetchActiveLoans();
  }, [fetchActiveLoans]);

  const handleFilterChange = useCallback((key: keyof ActiveLoanFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: "", dueDateFrom: "", dueDateTo: "", minRemainingAmount: 0 });
    setCurrentPage(1);
  }, []);

  const toggleLoanSelection = useCallback((id: number) => {
    setSelectedLoans(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedLoans.length === loans.length) {
      setSelectedLoans([]);
    } else {
      setSelectedLoans(loans.map(l => l.id));
    }
  }, [loans, selectedLoans]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  const reload = useCallback(() => {
    fetchActiveLoans();
  }, [fetchActiveLoans]);

  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

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

export default useActiveLoans;