import { useState, useEffect, useCallback, useRef } from "react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import loanAgreementsAPI from "../../../../api/core/loan_agreement";

interface Filters {
  search: string;
  status: "all" | "draft" | "signed";
  debtId?: number;
  lenderName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useLoanAgreements = () => {
  const [agreements, setAgreements] = useState<LoanAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    debtId: undefined,
    lenderName: "",
    dateFrom: "",
    dateTo: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "agreementDate", direction: "desc" as "asc" | "desc" });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchAgreements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction.toUpperCase(),
        search: filters.search || undefined,
        lenderName: filters.lenderName || undefined,
        agreementDateFrom: filters.dateFrom || undefined,
        agreementDateTo: filters.dateTo || undefined,
        debtId: filters.debtId || undefined,
      };
      // status filter: API expects status query param
      if (filters.status !== "all") params.status = filters.status;
      const response = await loanAgreementsAPI.getAll(params);
      if (response.status && response.data) {
        setAgreements(response.data.data);
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.pages,
          totalItems: response.data.pagination.total,
          pageSize: response.data.pagination.limit,
        });
      } else {
        throw new Error(response.message || "Failed to fetch agreements");
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, sortConfig, filters]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const reload = useCallback(() => fetchAgreements(), [fetchAgreements]);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "all", debtId: undefined, lenderName: "", dateFrom: "", dateTo: "" });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  return {
    agreements,
    loading,
    error,
    pagination,
    filters,
    currentPage,
    pageSize,
    sortConfig,
    setCurrentPage,
    setPageSize,
    handleFilterChange,
    resetFilters,
    handleSort,
    reload,
  };
};