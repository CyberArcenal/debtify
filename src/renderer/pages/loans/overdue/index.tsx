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
import reminderLogAPI from "../../../api/core/reminder_log";

const OverdueLoansPage: React.FC = () => {
  const {
    loans,                     // now the current page data (after filtering)
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
  } = useOverdueLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const openPaymentModal = (loan: any) => { setSelectedLoan(loan); setPaymentModalOpen(true); };
  const openPenaltyModal = (loan: any) => { setSelectedLoan(loan); setPenaltyModalOpen(true); };
  const openReminderModal = (loan: any) => { setSelectedLoan(loan); setReminderModalOpen(true); };

const handleBulkSendReminders = async () => {
  if (selectedLoans.length === 0) return;
  const confirmed = await dialogs.confirm({
    title: "Bulk Reminders",
    message: `Send email reminders to ${selectedLoans.length} overdue debtors?`
  });
  if (!confirmed) return;

  let successCount = 0;
  let failCount = 0;
  setSubmitting(true);
  try {
    for (const id of selectedLoans) {
      const loan = loans.find(l => l.id === id);
      if (loan && loan.borrower?.email) {
        try {
          await reminderLogAPI.createReminder({
            to: loan.borrower.email,
            subject: `Overdue Reminder: ${loan.name}`,
            html: `Dear ${loan.borrower.name},<br/><br/>Your loan "${loan.name}" is overdue. Please make a payment immediately.<br/><br/>Thank you.`,
            text: `Dear ${loan.borrower.name},\n\nYour loan "${loan.name}" is overdue. Please make a payment immediately.\n\nThank you.`,
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to send to ${loan.borrower.email}`, err);
          failCount++;
        }
      } else if (loan && !loan.borrower?.email) {
        console.warn(`Debtor ${loan.borrower?.name} has no email`);
        failCount++;
      }
    }
    dialogs.success(`Reminders sent: ${successCount} succeeded, ${failCount} failed.`);
    reload();
  } catch (err: any) {
    dialogs.error(err.message);
  } finally {
    setSubmitting(false);
  }
};

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.totalItems);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" style={{ color: "var(--status-overdue-text)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Overdue Accounts</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}><Filter className="w-4 h-4" /> Filters</button>
            <button onClick={reload} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
            {selectedLoans.length > 0 && (
              <button onClick={handleBulkSendReminders} className="px-3 py-2 rounded-md text-white flex items-center gap-1" style={{ backgroundColor: "var(--primary-color)" }}><Bell className="w-4 h-4" /> Send Reminders ({selectedLoans.length})</button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Search by debtor name, contact, or debt name" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)} className="px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              <select value={filters.daysOverdue} onChange={(e) => handleFilterChange("daysOverdue", e.target.value)} className="px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                <option value="all">All Overdue</option>
                <option value="30">30+ days overdue</option>
                <option value="60">60+ days overdue</option>
                <option value="90">90+ days overdue</option>
              </select>
            </div>
            <div className="mt-2 flex justify-end"><button onClick={resetFilters} className="text-sm flex items-center gap-1" style={{ color: "var(--status-overdue-text)" }}><X className="w-3 h-3" /> Reset</button></div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2"><label className="text-sm" style={{ color: "var(--text-secondary)" }}>Show:</label><select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 border rounded text-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>{[10,25,50,100].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{pagination.totalItems > 0 ? `Showing ${start} to ${end} of ${pagination.totalItems} entries` : "No entries"}</div>
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>}
        {error && <div className="text-center py-4" style={{ color: "var(--danger-color)" }}>Error: {error}</div>}

        {!loading && !error && (
          <>
            <OverdueLoansTable
              loans={loans}
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
              <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No overdue accounts</p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>All debts are up to date.</p>
              </div>
            )}
            {loans.length > 0 && pagination.totalPages > 1 && <div className="mt-4"><Pagination currentPage={currentPage} totalItems={pagination.totalItems} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} pageSizeOptions={[10,25,50,100]} showPageSize={false} /></div>}
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