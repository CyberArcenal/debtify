// src/renderer/pages/payments/transactions/hooks/useTransactions.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import paymentsAPI from "../../../../api/core/payment_transaction";

export interface TransactionFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  debtorId: number | "";
  debtId: number | "";
  minAmount: number;
  maxAmount: number;
}

interface UseTransactionsReturn {
  transactions: PaymentTransaction[];
  paginatedTransactions: PaymentTransaction[];
  filters: TransactionFilters;
  loading: boolean;
  error: string | null;
  pagination: { current_page: number; total_pages: number; count: number; page_size: number };
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  handleFilterChange: (key: keyof TransactionFilters, value: string | number) => void;
  resetFilters: () => void;
  handleSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  totalAmount: number;
  // Admin actions
  updateTransaction: (id: number, data: any) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

const useTransactions = (): UseTransactionsReturn => {
  const [allTransactions, setAllTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "paymentDate", direction: "desc" });
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "", dateFrom: "", dateTo: "", debtorId: "", debtId: "", minAmount: 0, maxAmount: 0,
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsAPI.getAll({ limit: 10000, includeDeleted: false });
      if (!response.status) throw new Error(response.message);
      setAllTransactions(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Filtering
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.debt?.name && t.debt.name.toLowerCase().includes(term)) ||
        (t.debt?.borrower?.name && t.debt.borrower.name.toLowerCase().includes(term)) ||
        (t.reference && t.reference.toLowerCase().includes(term))
      );
    }
    if (filters.dateFrom) filtered = filtered.filter(t => t.paymentDate >= filters.dateFrom);
    if (filters.dateTo) filtered = filtered.filter(t => t.paymentDate <= filters.dateTo);
    if (filters.debtorId) filtered = filtered.filter(t => t.debt?.borrower?.id === filters.debtorId);
    if (filters.debtId) filtered = filtered.filter(t => t.debt?.id === filters.debtId);
    if (filters.minAmount > 0) filtered = filtered.filter(t => t.amount >= filters.minAmount);
    if (filters.maxAmount > 0) filtered = filtered.filter(t => t.amount <= filters.maxAmount);
    return filtered;
  }, [allTransactions, filters]);

  // Sorting
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      if (key === "paymentDate") { aVal = new Date(a.paymentDate).getTime(); bVal = new Date(b.paymentDate).getTime(); }
      else if (key === "amount") { aVal = a.amount; bVal = b.amount; }
      else if (key === "debtName") { aVal = a.debt?.name || ""; bVal = b.debt?.name || ""; }
      else if (key === "borrower") { aVal = a.debt?.borrower?.name || ""; bVal = b.debt?.borrower?.name || ""; }
      else { aVal = a[key as keyof PaymentTransaction]; bVal = b[key as keyof PaymentTransaction]; }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTransactions, sortConfig]);

  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedTransactions = sortedTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleFilterChange = (key: keyof TransactionFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  const resetFilters = () => setFilters({ search: "", dateFrom: "", dateTo: "", debtorId: "", debtId: "", minAmount: 0, maxAmount: 0 });
  const handleSort = (key: string) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  const reload = () => fetchTransactions();

  // Admin actions (wrap API calls)
  const updateTransaction = async (id: number, data: any) => {
    await paymentsAPI.update(id, data);
    await fetchTransactions();
  };
  const deleteTransaction = async (id: number) => {
    await paymentsAPI.delete(id);
    await fetchTransactions();
  };

  return {
    transactions: sortedTransactions,
    paginatedTransactions,
    filters,
    loading,
    error,
    pagination: { current_page: currentPage, total_pages: totalPages, count: totalItems, page_size: pageSize },
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    handleSort,
    sortConfig,
    totalAmount,
    updateTransaction,
    deleteTransaction,
  };
};

export default useTransactions;