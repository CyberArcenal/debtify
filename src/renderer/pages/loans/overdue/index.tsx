// src/renderer/pages/loans/overdue/index.tsx
import React, { useState } from "react";
import { AlertTriangle, RefreshCw, Filter, X, Bell } from "lucide-react";
import Button from "../../../components/UI/Button";
import Pagination from "../../../components/Shared/Pagination";
import useOverdueLoans from "./hooks/useOverdueLoans";
import OverdueLoansTable from "./components/OverdueLoansTable";
import RecordPartialPaymentModal from "./components/RecordPartialPaymentModal";
import ApplyPenaltyModal from "./components/ApplyPenaltyModal";
import SendReminderModal from "./components/SendReminderModal";
import { dialogs } from "../../../utils/dialogs";
import notificationAPI from "../../../api/core/notification";

const OverdueLoansPage: React.FC = () => {
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
  } = useOverdueLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const openPaymentModal = (loan: any) => { setSelectedLoan(loan); setPaymentModalOpen(true); };
  const openPenaltyModal = (loan: any) => { setSelectedLoan(loan); setPenaltyModalOpen(true); };
  const openReminderModal = (loan: any) => { setSelectedLoan(loan); setReminderModalOpen(true); };

  const handleBulkSendReminders = async () => {
    if (selectedLoans.length === 0) return;
    const confirmed = await dialogs.confirm({ title: "Bulk Reminders", message: `Send reminders to ${selectedLoans.length} overdue debtors?` });
    if (!confirmed) return;
    try {
      for (const id of selectedLoans) {
        const loan = loans.find(l => l.id === id);
        if (loan) {
          await notificationAPI.create({
            title: `Overdue Reminder: ${loan.name}`,
            message: `Dear ${loan.borrower?.name}, your loan "${loan.name}" is overdue. Please make a payment.`,
            type: "overdue",
            debtId: loan.id,
          });
        }
      }
      dialogs.success(`Reminders sent to ${selectedLoans.length} debtors`);
      reload();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.count);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border border-red-200 p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold text-red-600">Overdue Accounts</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-md flex items-center gap-1 border"><Filter className="w-4 h-4" /> Filters</button>
            <button onClick={reload} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
            {selectedLoans.length > 0 && (
              <button onClick={handleBulkSendReminders} className="px-3 py-2 rounded-md bg-blue-500 text-white flex items-center gap-1"><Bell className="w-4 h-4" /> Send Reminders ({selectedLoans.length})</button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Search by debtor name, contact, or debt name" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)} className="px-3 py-2 border rounded-md" />
              <select value={filters.daysOverdue} onChange={(e) => handleFilterChange("daysOverdue", e.target.value)} className="px-3 py-2 border rounded-md">
                <option value="all">All Overdue</option>
                <option value="30">30+ days overdue</option>
                <option value="60">60+ days overdue</option>
                <option value="90">90+ days overdue</option>
              </select>
            </div>
            <div className="mt-2 flex justify-end"><button onClick={resetFilters} className="text-sm text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Reset</button></div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2"><label className="text-sm">Show:</label><select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 border rounded text-sm">{ [10,25,50,100].map(s => <option key={s} value={s}>{s}</option>) }</select></div>
          <div className="text-sm text-[var(--text-secondary)]">{pagination.count > 0 ? `Showing ${start} to ${end} of ${pagination.count} entries` : "No entries"}</div>
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>}
        {error && <div className="text-center py-4 text-red-500">Error: {error}</div>}

        {!loading && !error && (
          <>
            <OverdueLoansTable
              loans={paginatedLoans}
              selectedLoans={selectedLoans}
              onToggleSelect={toggleLoanSelection}
              onToggleSelectAll={toggleSelectAll}
              onSort={handleSort}
              sortConfig={sortConfig}
              onSendReminder={openReminderModal}
              onRecordPayment={openPaymentModal}
              onApplyPenalty={openPenaltyModal}
            />
            {loans.length === 0 && (
              <div className="text-center py-12 border rounded-md"><AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p className="text-lg font-medium">No overdue accounts</p><p className="text-sm text-gray-500">All debts are up to date.</p></div>
            )}
            {loans.length > 0 && pagination.total_pages > 1 && <div className="mt-4"><Pagination currentPage={currentPage} totalItems={pagination.count} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} pageSizeOptions={[10,25,50,100]} showPageSize={false} /></div>}
          </>
        )}
      </div>

      <RecordPartialPaymentModal isOpen={paymentModalOpen} loan={selectedLoan} onClose={() => { setPaymentModalOpen(false); setSelectedLoan(null); }} onSuccess={reload} />
      <ApplyPenaltyModal isOpen={penaltyModalOpen} loan={selectedLoan} onClose={() => { setPenaltyModalOpen(false); setSelectedLoan(null); }} onSuccess={reload} />
      <SendReminderModal isOpen={reminderModalOpen} loan={selectedLoan} onClose={() => { setReminderModalOpen(false); setSelectedLoan(null); }} onSuccess={reload} />
    </div>
  );
};

export default OverdueLoansPage;