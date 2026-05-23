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
  transactions: PaymentTransaction[];      // current page data
  loading: boolean;
  error: string | null;
  pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  filters: TransactionFilters;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  handleFilterChange: (key: keyof TransactionFilters, value: string | number) => void;
  resetFilters: () => void;
  handleSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  totalAmount: number;   // sum of amounts in current page
  // Admin actions
  updateTransaction: (id: number, data: any) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

const useTransactions = (): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  const [sortConfig, setSortConfig] = useState({ key: "paymentDate", direction: "desc" });
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "", dateFrom: "", dateTo: "", debtorId: "", debtId: "", minAmount: 0, maxAmount: 0,
  });

  // Helper to convert client filters to backend parameters
  const buildApiParams = useCallback(() => {
    const params: any = {
      page: currentPage,
      limit: pageSize,
      sortBy: sortConfig.key === "borrower" ? "borrowerName" : sortConfig.key,
      sortOrder: sortConfig.direction.toUpperCase(),
    };
    if (filters.search) params.search = filters.search;
    if (filters.dateFrom) params.paymentDateFrom = filters.dateFrom;
    if (filters.dateTo) params.paymentDateTo = filters.dateTo;
    if (filters.debtorId) params.borrowerId = filters.debtorId;
    if (filters.debtId) params.debtId = filters.debtId;
    if (filters.minAmount > 0) params.minAmount = filters.minAmount;
    if (filters.maxAmount > 0) params.maxAmount = filters.maxAmount;
    return params;
  }, [currentPage, pageSize, sortConfig, filters]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildApiParams();
      const response = await paymentsAPI.getAll(params);
      if (!response.status) throw new Error(response.message);
      const paginated = response.data; // PaginatedResult<PaymentTransaction>
      setTransactions(paginated.data);
      setPaginationMeta({
        page: paginated.pagination.page,
        totalPages: paginated.pagination.pages,
        totalItems: paginated.pagination.total,
        pageSize: paginated.pagination.limit,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const handleFilterChange = (key: keyof TransactionFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", dateFrom: "", dateTo: "", debtorId: "", debtId: "", minAmount: 0, maxAmount: 0 });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const reload = () => fetchTransactions();

  // Admin actions
  const updateTransaction = async (id: number, data: any) => {
    await paymentsAPI.update(id, data);
    await fetchTransactions();
  };

  const deleteTransaction = async (id: number) => {
    await paymentsAPI.delete(id);
    await fetchTransactions();
  };

  return {
    transactions,
    loading,
    error,
    pagination: {
      page: paginationMeta.page,
      totalPages: paginationMeta.totalPages,
      totalItems: paginationMeta.totalItems,
      pageSize: paginationMeta.pageSize,
    },
    filters,
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