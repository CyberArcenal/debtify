// src/renderer/pages/debtors/hooks/useDebtors.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import borrowersAPI from "../../../api/core/borrower";
import debtsAPI from "../../../api/core/debt";
import type { Borrower } from "../../../api/core/borrower";

export interface DebtorFilters {
  search: string;
  status: "all" | "active" | "deleted";
}

export interface DebtorWithTotal extends Borrower {
  total_debt: number;
}

interface UseDebtorsReturn {
  debtors: DebtorWithTotal[];
  paginatedDebtors: DebtorWithTotal[];
  filters: DebtorFilters;
  loading: boolean;
  error: string | null;
  pagination: { current_page: number; total_pages: number; count: number; page_size: number };
  selectedDebtors: number[];
  setSelectedDebtors: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  handleFilterChange: (key: keyof DebtorFilters, value: string) => void;
  resetFilters: () => void;
  toggleDebtorSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
}

const useDebtors = (initialFilters?: Partial<DebtorFilters>): UseDebtorsReturn => {
  const [allDebtors, setAllDebtors] = useState<DebtorWithTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDebtors, setSelectedDebtors] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<DebtorFilters>({
    search: "",
    status: "active",
    ...initialFilters,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all debtors (include deleted for status filtering)
      const response = await borrowersAPI.getAll({ includeDeleted: true });
      if (!response.status) throw new Error(response.message || "Failed to fetch debtors");

      let debtorsList = response.data;

      // Fetch all debts to compute total debt per debtor
      const debtsRes = await debtsAPI.getAll({ limit: 10000 });
      if (!debtsRes.status) throw new Error(debtsRes.message || "Failed to fetch debts");
      const allDebts = debtsRes.data;

      // Compute total outstanding (remainingAmount) per borrower
      const debtMap = new Map<number, number>();
      allDebts.forEach(debt => {
        if (debt.remainingAmount > 0) {
          const current = debtMap.get(debt.borrower?.id as number | 0) || 0;
          debtMap.set(debt.borrower?.id as number, current + debt.remainingAmount);
        }
      });

      const debtorsWithTotal: DebtorWithTotal[] = debtorsList.map(d => ({
        ...d,
        total_debt: debtMap.get(d.id) || 0,
      }));

      if (mountedRef.current) {
        setAllDebtors(debtorsWithTotal);
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to load debtors");
        console.error(err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  // Client-side filtering
  const filteredDebtors = useMemo(() => {
    let filtered = [...allDebtors];

    // Status filter
    if (filters.status === "active") {
      filtered = filtered.filter(d => !d.deletedAt);
    } else if (filters.status === "deleted") {
      filtered = filtered.filter(d => d.deletedAt);
    }

    // Search (name, email, contact)
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(term) ||
        (d.email && d.email.toLowerCase().includes(term)) ||
        (d.contact && d.contact.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [allDebtors, filters]);

  // Client-side sorting
  const sortedDebtors = useMemo(() => {
    const sorted = [...filteredDebtors];
    const { key, direction } = sortConfig;
    if (key) {
      sorted.sort((a, b) => {
        let aVal: any = a[key as keyof DebtorWithTotal];
        let bVal: any = b[key as keyof DebtorWithTotal];
        if (key === "total_debt") {
          aVal = a.total_debt;
          bVal = b.total_debt;
        } else if (key === "createdAt") {
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredDebtors, sortConfig]);

  const totalItems = sortedDebtors.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedDebtors = sortedDebtors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pagination = {
    current_page: currentPage,
    total_pages: totalPages,
    count: totalItems,
    page_size: pageSize,
  };

  const handleFilterChange = useCallback((key: keyof DebtorFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: "", status: "active" });
    setCurrentPage(1);
  }, []);

  const toggleDebtorSelection = useCallback((id: number) => {
    setSelectedDebtors(prev =>
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedDebtors(prev =>
      prev.length === paginatedDebtors.length ? [] : paginatedDebtors.map(d => d.id)
    );
  }, [paginatedDebtors]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  const reload = useCallback(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    debtors: sortedDebtors,
    paginatedDebtors,
    filters,
    loading,
    error,
    pagination,
    selectedDebtors,
    setSelectedDebtors,
    sortConfig,
    setSortConfig,
    pageSize,
    setPageSize: setPageSizeHandler,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleDebtorSelection,
    toggleSelectAll,
    handleSort,
  };
};

export default useDebtors;