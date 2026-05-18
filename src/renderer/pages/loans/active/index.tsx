// src/renderer/pages/loans/active/index.tsx
import React, { useState } from "react";
import { HandCoins, RefreshCw, Filter, X } from "lucide-react";
import Button from "../../../components/UI/Button";
import Pagination from "../../../components/Shared/Pagination";
import useActiveLoans from "./hooks/useActiveLoans";
import ActiveLoansTable from "./components/ActiveLoansTable";
import RecordPaymentModal from "./components/RecordPaymentModal";
import ViewDebtModal from "./components/ViewDebtModal";
import EditDebtModal from "./components/EditDebtModal";

const ActiveLoansPage: React.FC = () => {
  const {
    paginatedLoans,
    loans,
    filters,
    loading,
    error,
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
  } = useActiveLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const openPaymentModal = (loan: any) => { setSelectedLoan(loan); setPaymentModalOpen(true); };
  const openViewModal = (loan: any) => { setSelectedLoan(loan); setViewModalOpen(true); };
  const openEditModal = (loan: any) => { setSelectedLoan(loan); setEditModalOpen(true); };
  const handleSchedule = (loan: any) => {
    // Navigate to payment schedule page (to be implemented)
    console.log("View schedule for", loan);
  };

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
            <HandCoins className="w-6 h-6 text-[var(--primary-color)]" />
            <h1 className="text-xl font-bold" style={{ color: "var(--sidebar-text)" }}>Active Loans</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}>
              <Filter className="w-4 h-4" /> Filters {showFilters ? "↑" : "↓"}
            </button>
            <button onClick={reload} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input type="text" placeholder="Search by debt or borrower" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)} className="px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }} />
              <input type="date" placeholder="Due date from" value={filters.dueDateFrom} onChange={(e) => handleFilterChange("dueDateFrom", e.target.value)} className="px-3 py-2 border rounded-md" />
              <input type="date" placeholder="Due date to" value={filters.dueDateTo} onChange={(e) => handleFilterChange("dueDateTo", e.target.value)} className="px-3 py-2 border rounded-md" />
              <input type="number" placeholder="Min remaining amount" value={filters.minRemainingAmount || ""} onChange={(e) => handleFilterChange("minRemainingAmount", parseFloat(e.target.value) || 0)} className="px-3 py-2 border rounded-md" />
            </div>
            <div className="mt-2 flex justify-end">
              <button onClick={resetFilters} className="text-sm text-[var(--primary-color)] flex items-center gap-1"><X className="w-3 h-3" /> Reset</button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Show:</label>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 border rounded text-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
              {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">{pagination.count > 0 ? `Showing ${start} to ${end} of ${pagination.count} entries` : "No entries"}</div>
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div></div>}
        {error && <div className="text-center py-4 text-red-500">Error: {error}</div>}

        {!loading && !error && (
          <>
            <ActiveLoansTable
              loans={paginatedLoans}
              selectedLoans={selectedLoans}
              onToggleSelect={toggleLoanSelection}
              onToggleSelectAll={toggleSelectAll}
              onSort={handleSort}
              sortConfig={sortConfig}
              onView={openViewModal}
              onEdit={openEditModal}
              onRecordPayment={openPaymentModal}
              onViewSchedule={handleSchedule}
            />
            {loans.length === 0 && (
              <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
                <HandCoins className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
                <p className="text-lg font-medium">No active loans found</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">All debts are either paid or overdue.</p>
              </div>
            )}
            {loans.length > 0 && pagination.total_pages > 1 && (
              <div className="mt-4"><Pagination currentPage={currentPage} totalItems={pagination.count} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} pageSizeOptions={[10,25,50,100]} showPageSize={false} /></div>
            )}
          </>
        )}
      </div>

      <RecordPaymentModal isOpen={paymentModalOpen} loan={selectedLoan} onClose={() => { setPaymentModalOpen(false); setSelectedLoan(null); }} onSuccess={reload} />
      <ViewDebtModal isOpen={viewModalOpen} debt={selectedLoan} onClose={() => { setViewModalOpen(false); setSelectedLoan(null); }} />
      <EditDebtModal isOpen={editModalOpen} debt={selectedLoan} onClose={() => { setEditModalOpen(false); setSelectedLoan(null); }} onSuccess={reload} />
    </div>
  );
};

export default ActiveLoansPage;