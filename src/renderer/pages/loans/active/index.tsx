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
import type { Debt } from "../../../api/core/debt";
import debtsAPI from "../../../api/core/debt";
import { dialogs } from "../../../utils/dialogs";
import { ForgivenessDialog } from "./components/ForgivenessDialog";

const ActiveLoansPage: React.FC = () => {
  const {
    loans, // kasalukuyang page (may filter at sorting na sa server)
    loading,
    error,
    pagination,
    filters,
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

  const [forgivenessDialogOpen, setForgivenessDialogOpen] = useState(false);
  const [forgivenessLoan, setForgivenessLoan] = useState<Debt | null>(null);
  const [forgivenessLoading, setForgivenessLoading] = useState(false);

  const handleForgiveness = (loan: Debt) => {
    setForgivenessLoan(loan);
    setForgivenessDialogOpen(true);
  };

  const handleForgivenessConfirm = async (amount: number, reason?: string) => {
    if (!forgivenessLoan) return;
    setForgivenessLoading(true);
    try {
      await debtsAPI.applyForgiveness(
        forgivenessLoan.id,
        amount,
        "system",
        reason,
      );
      dialogs.success("Forgiveness applied successfully");
      reload();
      setForgivenessDialogOpen(false);
      setForgivenessLoan(null);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setForgivenessLoading(false);
    }
  };

  const openPaymentModal = (loan: any) => {
    setSelectedLoan(loan);
    setPaymentModalOpen(true);
  };
  const openViewModal = (loan: any) => {
    setSelectedLoan(loan);
    setViewModalOpen(true);
  };
  const openEditModal = (loan: any) => {
    setSelectedLoan(loan);
    setEditModalOpen(true);
  };
  const handleSchedule = (loan: any) => {
    console.log("View schedule for", loan);
  };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.totalItems);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div
        className="rounded-md shadow-md border p-4"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-[var(--primary-color)]" />
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--sidebar-text)" }}
            >
              Active Loans
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Filter className="w-4 h-4" /> Filters {showFilters ? "↑" : "↓"}
            </button>
            <button
              onClick={reload}
              disabled={loading}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div
            className="mb-4 p-3 rounded-md border"
            style={{
              backgroundColor: "var(--card-secondary-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Search by debt or borrower"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border-color)",
                }}
              />
              <input
                type="date"
                placeholder="Due date from"
                value={filters.dueDateFrom}
                onChange={(e) =>
                  handleFilterChange("dueDateFrom", e.target.value)
                }
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                placeholder="Due date to"
                value={filters.dueDateTo}
                onChange={(e) =>
                  handleFilterChange("dueDateTo", e.target.value)
                }
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Min remaining amount"
                value={filters.minRemainingAmount || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "minRemainingAmount",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={resetFilters}
                className="text-sm text-[var(--primary-color)] flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            {pagination.totalItems > 0
              ? `Showing ${start} to ${end} of ${pagination.totalItems} entries`
              : "No entries"}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
          </div>
        )}
        {error && (
          <div className="text-center py-4 text-red-500">Error: {error}</div>
        )}

        {!loading && !error && (
          <>
            <ActiveLoansTable
              loans={loans} // direktang array (kasalukuyang page)
              selectedLoans={selectedLoans}
              onToggleSelect={toggleLoanSelection}
              onToggleSelectAll={toggleSelectAll}
              onSort={handleSort}
              sortConfig={sortConfig}
              onView={openViewModal}
              onForgiveness={handleForgiveness}
              onRecordPayment={openPaymentModal}
              onViewSchedule={handleSchedule}
            />
            {loans.length === 0 && (
              <div
                className="text-center py-12 border rounded-md"
                style={{ borderColor: "var(--border-color)" }}
              >
                <HandCoins className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
                <p className="text-lg font-medium">No active loans found</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  All debts are either paid or overdue.
                </p>
              </div>
            )}
            {loans.length > 0 && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={pagination.totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                  showPageSize={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        loan={selectedLoan}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={reload}
      />
      <ViewDebtModal
        isOpen={viewModalOpen}
        debt={selectedLoan}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedLoan(null);
        }}
      />
      {forgivenessLoan && (
        <ForgivenessDialog
          isOpen={forgivenessDialogOpen}
          remainingBalance={forgivenessLoan.remainingAmount}
          onClose={() => {
            setForgivenessDialogOpen(false);
            setForgivenessLoan(null);
          }}
          onConfirm={handleForgivenessConfirm}
          isLoading={forgivenessLoading}
        />
      )}
    </div>
  );
};

export default ActiveLoansPage;
