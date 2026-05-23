// src/renderer/pages/debtors/hooks/useDebtors.ts
import { useState, useEffect, useCallback, useRef } from "react";
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
  debtors: DebtorWithTotal[];           // current page data with total_debt
  loading: boolean;
  error: string | null;
  pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  filters: DebtorFilters;
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
  const [debtors, setDebtors] = useState<DebtorWithTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDebtors, setSelectedDebtors] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
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

  // Helper: map status filter to includeDeleted and any other params
  const getIncludeDeleted = (status: string) => {
    if (status === "deleted") return true;
    if (status === "active") return false;
    return true; // 'all' includes deleted
  };

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const includeDeleted = getIncludeDeleted(filters.status);
      const response = await borrowersAPI.getAll({
        page: currentPage,
        limit: pageSize,
        search: filters.search || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction.toUpperCase() as "ASC" | "DESC",
        includeDeleted,
      });

      if (!response.status) throw new Error(response.message || "Failed to fetch debtors");

      const borrowersData = response.data.data;       // Borrower[]
      const pagination = response.data.pagination;    // { page, limit, total, pages }

      // Fetch total debt for each borrower in the current page (efficiently)
      if (borrowersData.length > 0) {
        const borrowerIds = borrowersData.map(b => b.id);
        // Use debtsAPI.getAll with borrowerId filter (but we need multiple borrowerIds)
        // Option: backend endpoint to get total debt for multiple borrowers? For now, fetch debts per borrower individually (but in parallel)
        // To avoid N+1, we can fetch all debts for these borrowerIds with a single query if backend supports filter by list of borrowerIds.
        // Let's assume we have a way: we can call debtsAPI.getAll with borrowerId list (if supported) or do parallel requests.
        // Simpler: we can compute total_debt on backend and add to Borrower DTO. For now, we'll do parallel requests (acceptable for small page size).
        const debtPromises = borrowerIds.map(async (id) => {
          try {
            const debtsRes = await debtsAPI.getAll({ borrowerId: id, limit: 1000 });
            if (debtsRes.status) {
              const total = debtsRes.data.data.reduce((sum, debt) => sum + debt.remainingAmount, 0);
              return { id, total };
            }
            return { id, total: 0 };
          } catch {
            return { id, total: 0 };
          }
        });
        const totals = await Promise.all(debtPromises);
        const totalMap = new Map(totals.map(t => [t.id, t.total]));

        const debtorsWithTotal: DebtorWithTotal[] = borrowersData.map(d => ({
          ...d,
          total_debt: totalMap.get(d.id) || 0,
        }));
        if (mountedRef.current) {
          setDebtors(debtorsWithTotal);
          setPaginationMeta({
            page: pagination.page,
            totalPages: pagination.pages,
            totalItems: pagination.total,
            pageSize: pagination.limit,
          });
        }
      } else {
        if (mountedRef.current) {
          setDebtors([]);
          setPaginationMeta({
            page: pagination.page,
            totalPages: pagination.pages,
            totalItems: pagination.total,
            pageSize: pagination.limit,
          });
        }
      }
      setError(null);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to load debtors");
        console.error(err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, filters.search, filters.status, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

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
    if (selectedDebtors.length === debtors.length) {
      setSelectedDebtors([]);
    } else {
      setSelectedDebtors(debtors.map(d => d.id));
    }
  }, [debtors, selectedDebtors]);

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
    debtors,
    loading,
    error,
    pagination: {
      page: paginationMeta.page,
      totalPages: paginationMeta.totalPages,
      totalItems: paginationMeta.totalItems,
      pageSize: paginationMeta.pageSize,
    },
    filters,
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