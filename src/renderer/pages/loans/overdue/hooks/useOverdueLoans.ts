// src/renderer/pages/loans/overdue/hooks/useOverdueLoans.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";

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
  paginatedLoans: OverdueLoan[];
  filters: OverdueFilter;
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
  handleFilterChange: (key: keyof OverdueFilter, value: string) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
}

const useOverdueLoans = (): UseOverdueLoansReturn => {
  const [allLoans, setAllLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "daysOverdue", direction: "desc" });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
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
      // Fetch all overdue debts
      const response = await debtsAPI.getAll({ status: "overdue", includeDeleted: false, limit: 10000 });
      if (!response.status) throw new Error(response.message || "Failed to fetch overdue loans");
      const debts = response.data;

      // Fetch penalty amounts for each debt (optional, for display)
      const loansWithDetails: OverdueLoan[] = await Promise.all(debts.map(async (debt) => {
        const daysOverdue = calculateDaysOverdue(debt.dueDate);
        let penaltyAmount = 0;
        try {
          const penaltyRes = await penaltiesAPI.getTotalPenaltyForDebt(debt.id);
          if (penaltyRes.status) penaltyAmount = penaltyRes.data.totalPenalty;
        } catch (e) { console.error(e); }
        return { ...debt, daysOverdue, penaltyAmount };
      }));

      if (mountedRef.current) {
        setAllLoans(loansWithDetails);
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverdueLoans(); }, [fetchOverdueLoans]);

  // Client-side filtering
  const filteredLoans = useMemo(() => {
    let filtered = [...allLoans];
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.name.toLowerCase().includes(term) ||
        (loan.borrower?.name && loan.borrower.name.toLowerCase().includes(term)) ||
        (loan.borrower?.contact && loan.borrower.contact.includes(term))
      );
    }
    if (filters.daysOverdue !== "all") {
      const minDays = parseInt(filters.daysOverdue);
      filtered = filtered.filter(loan => loan.daysOverdue >= minDays);
    }
    return filtered;
  }, [allLoans, filters]);

  // Sorting
  const sortedLoans = useMemo(() => {
    const sorted = [...filteredLoans];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      if (key === "daysOverdue") { aVal = a.daysOverdue; bVal = b.daysOverdue; }
      else if (key === "remainingAmount") { aVal = a.remainingAmount; bVal = b.remainingAmount; }
      else if (key === "dueDate") { aVal = new Date(a.dueDate).getTime(); bVal = new Date(b.dueDate).getTime(); }
      else if (key === "borrower") { aVal = a.borrower?.name || ""; bVal = b.borrower?.name || ""; }
      else { aVal = a[key as keyof Debt]; bVal = b[key as keyof Debt]; }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredLoans, sortConfig]);

  const totalItems = sortedLoans.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLoans = sortedLoans.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pagination = { current_page: currentPage, total_pages: totalPages, count: totalItems, page_size: pageSize };
  const handleFilterChange = (key: keyof OverdueFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  const resetFilters = () => { setFilters({ search: "", daysOverdue: "all" }); setCurrentPage(1); };
  const toggleLoanSelection = (id: number) => setSelectedLoans(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedLoans(prev => prev.length === paginatedLoans.length ? [] : paginatedLoans.map(l => l.id));
  const handleSort = (key: string) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  const reload = () => fetchOverdueLoans();
  const setPageSizeHandler = (size: number) => { setPageSize(size); setCurrentPage(1); };

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

// Helper
const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export default useOverdueLoans;