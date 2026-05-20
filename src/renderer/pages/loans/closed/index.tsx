// src/renderer/pages/loans/closed/index.tsx
import React, { useState } from "react";
import { CheckCircle, RefreshCw, Filter, X, DollarSign } from "lucide-react";
import Button from "../../../components/UI/Button";
import Pagination from "../../../components/Shared/Pagination";
import useClosedLoans from "./hooks/useClosedLoans";
import ClosedLoansTable from "./components/ClosedLoansTable";
import ReopenConfirmationModal from "./components/ReopenConfirmationModal";
import ViewDebtModal from "../active/components/ViewDebtModal";
import { formatCurrency } from "../../../utils/formatters";

const ClosedLoansPage: React.FC = () => {
  const {
    paginatedLoans,
    loans,
    filters,
    loading,
    error,
    summary,
    pagination,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleLoanSelection,
    toggleSelectAll,
    handleSort,
    sortConfig,
    selectedLoans,
  } = useClosedLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const openViewModal = (loan: any) => { setSelectedLoan(loan); setViewModalOpen(true); };
  const openReopenModal = (loan: any) => { setSelectedLoan(loan); setReopenModalOpen(true); };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.count);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" style={{ color: "var(--success-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Closed / Paid Loans</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}><Filter className="w-4 h-4" /> Filters</button>
            <button onClick={reload} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
          </div>
        </div>

        {/* Summary Stats - neutral theme */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5" style={{ color: "var(--success-color)" }} /><span className="font-medium" style={{ color: "var(--text-primary)" }}>Total Closed Loans:</span> <span style={{ color: "var(--text-primary)" }}>{summary.totalCount}</span></div>
          <div className="flex items-center gap-2"><DollarSign className="w-5 h-5" style={{ color: "var(--success-color)" }} /><span className="font-medium" style={{ color: "var(--text-primary)" }}>Total Amount Paid:</span> <span className="font-bold" style={{ color: "var(--success-color)" }}>{formatCurrency(summary.totalAmountPaid)}</span></div>
        </div>

        {showFilters && (
          <div className="mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Search by debt or borrower" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)} className="px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              <input type="date" placeholder="Closed from" value={filters.closedDateFrom} onChange={(e) => handleFilterChange("closedDateFrom", e.target.value)} className="px-3 py-2 border rounded-md" />
              <input type="date" placeholder="Closed to" value={filters.closedDateTo} onChange={(e) => handleFilterChange("closedDateTo", e.target.value)} className="px-3 py-2 border rounded-md" />
            </div>
            <div className="mt-2 flex justify-end"><button onClick={resetFilters} className="text-sm flex items-center gap-1" style={{ color: "var(--success-color)" }}><X className="w-3 h-3" /> Reset</button></div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2"><label className="text-sm" style={{ color: "var(--text-secondary)" }}>Show:</label><select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 border rounded text-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>{[10,25,50,100].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{pagination.count > 0 ? `Showing ${start} to ${end} of ${pagination.count} entries` : "No entries"}</div>
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>}
        {error && <div className="text-center py-4" style={{ color: "var(--danger-color)" }}>Error: {error}</div>}

        {!loading && !error && (
          <>
            <ClosedLoansTable
              loans={paginatedLoans}
              selectedLoans={selectedLoans}
              onToggleSelect={toggleLoanSelection}
              onToggleSelectAll={toggleSelectAll}
              onSort={handleSort}
              sortConfig={sortConfig}
              onView={openViewModal}
              onReopen={openReopenModal}
            />
            {loans.length === 0 && (
              <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No closed loans found</p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>All active loans will appear here when paid.</p>
              </div>
            )}
            {loans.length > 0 && pagination.total_pages > 1 && <div className="mt-4"><Pagination currentPage={currentPage} totalItems={pagination.count} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} pageSizeOptions={[10,25,50,100]} showPageSize={false} /></div>}
          </>
        )}
      </div>

      <ViewDebtModal isOpen={viewModalOpen} debt={selectedLoan} onClose={() => { setViewModalOpen(false); setSelectedLoan(null); }} />
      <ReopenConfirmationModal isOpen={reopenModalOpen} loan={selectedLoan} onClose={() => { setReopenModalOpen(false); setSelectedLoan(null); }} onSuccess={reload} />
    </div>
  );
};

export default ClosedLoansPage;