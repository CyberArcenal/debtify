// src/renderer/pages/loans/closed/hooks/useClosedLoans.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";
import paymentsAPI from "../../../../api/core/payment_transaction";

export interface ClosedLoanFilters {
  search: string;
  closedDateFrom: string;
  closedDateTo: string;
}

export interface ClosedLoan extends Debt {
  lastPaymentDate: string | null;
  totalPaidAmount: number;
  closedAt: string; // when status became paid (use updatedAt if status changed)
}

interface UseClosedLoansReturn {
  loans: ClosedLoan[];
  paginatedLoans: ClosedLoan[];
  filters: ClosedLoanFilters;
  loading: boolean;
  error: string | null;
  summary: { totalCount: number; totalAmountPaid: number };
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
  handleFilterChange: (key: keyof ClosedLoanFilters, value: string) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
}

const useClosedLoans = (): UseClosedLoansReturn => {
  const [allLoans, setAllLoans] = useState<ClosedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "closedAt", direction: "desc" });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ClosedLoanFilters>({ search: "", closedDateFrom: "", closedDateTo: "" });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchClosedLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all paid debts
      const response = await debtsAPI.getAll({ status: "paid", includeDeleted: false, limit: 10000 });
      if (!response.status) throw new Error(response.message || "Failed to fetch closed loans");
      const debts = response.data;

      // For each debt, get last payment date and ensure closedAt
      const loansWithDetails: ClosedLoan[] = await Promise.all(debts.map(async (debt) => {
        // Get payments to compute last payment date
        let lastPaymentDate: string | null = null;
        try {
          const paymentsRes = await paymentsAPI.getByDebtId(debt.id);
          const payments = paymentsRes;
          if (payments.length > 0) {
            const lastPayment = payments.reduce((latest, p) =>
              new Date(p.paymentDate) > new Date(latest.paymentDate) ? p : latest
            );
            lastPaymentDate = lastPayment.paymentDate;
          }
        } catch (e) { console.error(e); }

        // Use updatedAt as closed date (assuming status change to paid updates updatedAt)
        // Alternatively, could fetch audit log, but updatedAt is sufficient.
        const closedAt = debt.updatedAt;

        return {
          ...debt,
          lastPaymentDate,
          totalPaidAmount: debt.paidAmount,
          closedAt,
        };
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

  useEffect(() => { fetchClosedLoans(); }, [fetchClosedLoans]);

  // Filtering
  const filteredLoans = useMemo(() => {
    let filtered = [...allLoans];
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.name.toLowerCase().includes(term) ||
        (loan.borrower?.name && loan.borrower.name.toLowerCase().includes(term))
      );
    }
    if (filters.closedDateFrom) {
      filtered = filtered.filter(loan => loan.closedAt >= filters.closedDateFrom);
    }
    if (filters.closedDateTo) {
      filtered = filtered.filter(loan => loan.closedAt <= filters.closedDateTo);
    }
    return filtered;
  }, [allLoans, filters]);

  // Sorting
  const sortedLoans = useMemo(() => {
    const sorted = [...filteredLoans];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      if (key === "totalAmount") { aVal = a.totalAmount; bVal = b.totalAmount; }
      else if (key === "paidAmount") { aVal = a.paidAmount; bVal = b.paidAmount; }
      else if (key === "closedAt") { aVal = new Date(a.closedAt).getTime(); bVal = new Date(b.closedAt).getTime(); }
      else if (key === "lastPaymentDate") {
        aVal = a.lastPaymentDate ? new Date(a.lastPaymentDate).getTime() : 0;
        bVal = b.lastPaymentDate ? new Date(b.lastPaymentDate).getTime() : 0;
      }
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
  const summary = {
    totalCount: totalItems,
    totalAmountPaid: sortedLoans.reduce((sum, loan) => sum + loan.paidAmount, 0),
  };

  const handleFilterChange = (key: keyof ClosedLoanFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  const resetFilters = () => { setFilters({ search: "", closedDateFrom: "", closedDateTo: "" }); setCurrentPage(1); };
  const toggleLoanSelection = (id: number) => setSelectedLoans(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedLoans(prev => prev.length === paginatedLoans.length ? [] : paginatedLoans.map(l => l.id));
  const handleSort = (key: string) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  const reload = () => fetchClosedLoans();
  const setPageSizeHandler = (size: number) => { setPageSize(size); setCurrentPage(1); };

  return {
    loans: sortedLoans,
    paginatedLoans,
    filters,
    loading,
    error,
    summary,
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

export default useClosedLoans;