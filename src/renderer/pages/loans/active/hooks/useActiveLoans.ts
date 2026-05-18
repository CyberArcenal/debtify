// src/renderer/pages/loans/active/hooks/useActiveLoans.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";

export interface ActiveLoanFilters {
  search: string;
  dueDateFrom: string;
  dueDateTo: string;
  minRemainingAmount: number;
}

interface UseActiveLoansReturn {
  loans: Debt[];
  paginatedLoans: Debt[];
  filters: ActiveLoanFilters;
  loading: boolean;
  error: string | null;
  pagination: { current_page: number; total_pages: number; count: number; page_size: number };
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
  const [allLoans, setAllLoans] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "dueDate",
    direction: "asc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
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
      const response = await debtsAPI.getAll({
        status: "active",
        includeDeleted: false,
        limit: 10000, // fetch all for client-side filtering
      });
      if (!response.status) throw new Error(response.message || "Failed to fetch active loans");
      if (mountedRef.current) {
        setAllLoans(response.data);
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
  }, []);

  useEffect(() => {
    fetchActiveLoans();
  }, [fetchActiveLoans]);

  // Client-side filtering
  const filteredLoans = useMemo(() => {
    let filtered = [...allLoans];

    // Search (debt name or borrower name)
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.name.toLowerCase().includes(term) ||
        (loan.borrower?.name && loan.borrower.name.toLowerCase().includes(term))
      );
    }

    // Due date range
    if (filters.dueDateFrom) {
      filtered = filtered.filter(loan => loan.dueDate >= filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      filtered = filtered.filter(loan => loan.dueDate <= filters.dueDateTo);
    }

    // Minimum remaining amount
    if (filters.minRemainingAmount > 0) {
      filtered = filtered.filter(loan => loan.remainingAmount >= filters.minRemainingAmount);
    }

    return filtered;
  }, [allLoans, filters]);

  // Sorting
  const sortedLoans = useMemo(() => {
    const sorted = [...filteredLoans];
    const { key, direction } = sortConfig;
    if (key) {
      sorted.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        if (key === "dueDate") {
          aVal = new Date(a.dueDate).getTime();
          bVal = new Date(b.dueDate).getTime();
        } else if (key === "remainingAmount") {
          aVal = a.remainingAmount;
          bVal = b.remainingAmount;
        } else if (key === "totalAmount") {
          aVal = a.totalAmount;
          bVal = b.totalAmount;
        } else if (key === "borrower") {
          aVal = a.borrower?.name || "";
          bVal = b.borrower?.name || "";
        } else {
          aVal = a[key as keyof Debt];
          bVal = b[key as keyof Debt];
        }
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredLoans, sortConfig]);

  const totalItems = sortedLoans.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLoans = sortedLoans.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pagination = {
    current_page: currentPage,
    total_pages: totalPages,
    count: totalItems,
    page_size: pageSize,
  };

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
    setSelectedLoans(prev =>
      prev.length === paginatedLoans.length ? [] : paginatedLoans.map(l => l.id)
    );
  }, [paginatedLoans]);

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
    loans: sortedLoans,
    paginatedLoans,
    filters,
    loading,
    error,
    pagination,
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