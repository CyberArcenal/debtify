// src/renderer/pages/payments/schedule/index.tsx
import React, { useState } from "react";
import { Calendar, Download, RefreshCw } from "lucide-react";
import usePaymentSchedule from "./hooks/usePaymentSchedule";
import DateRangeFilter from "./components/DateRangeFilter";
import ViewModeToggle from "./components/ViewModeToggle";
import ListView from "./components/ListView";
import CalendarView from "./components/CalendarView";
import MarkPaidModal from "./components/MarkPaidModal";
import ExportModal from "./components/ExportModal";
import DateClickModal from "./components/DateClickModal";
import type { ScheduledPayment } from "./types";

const PaymentSchedulePage: React.FC = () => {
  const { payments, loading, error, filters, setFilters, refresh, markAsPaid } = usePaymentSchedule();
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ScheduledPayment | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [dateClickModalOpen, setDateClickModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState("");
  const [clickedPayments, setClickedPayments] = useState<ScheduledPayment[]>([]);

  const handleMarkPaid = (payment: ScheduledPayment) => {
    setSelectedPayment(payment);
    setMarkPaidModalOpen(true);
  };

  const handleConfirmMarkPaid = async (amount: number, paymentDate: string) => {
    if (selectedPayment) {
      await markAsPaid(selectedPayment.debtId, amount, paymentDate);
      refresh();
    }
  };

  const handleDateClick = (date: string, paymentsOnDate: ScheduledPayment[]) => {
    setClickedDate(date);
    setClickedPayments(paymentsOnDate);
    setDateClickModalOpen(true);
  };

  const handleMarkPaidFromModal = (payment: ScheduledPayment) => {
    setDateClickModalOpen(false);
    setSelectedPayment(payment);
    setMarkPaidModalOpen(true);
  };

  const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2"><Calendar className="w-6 h-6 text-[var(--primary-color)]" /><h1 className="text-xl font-bold">Payment Schedule</h1></div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
            <button onClick={() => setExportModalOpen(true)} className="px-3 py-2 rounded-md flex items-center gap-1 border"><Download className="w-4 h-4" /> Export</button>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-md bg-gray-50 flex flex-wrap justify-between items-center gap-3">
          <div><span className="font-semibold">Total Upcoming Payments:</span> {payments.length} debts</div>
          <div><span className="font-semibold">Total Amount Due:</span> {totalDue.toLocaleString()} PHP</div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <DateRangeFilter value={filters.dateRange} onChange={(val) => setFilters(prev => ({ ...prev, dateRange: val }))} />
          <ViewModeToggle mode={filters.viewMode} onChange={(mode) => setFilters(prev => ({ ...prev, viewMode: mode }))} />
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div></div>}
        {error && <div className="text-center py-4 text-red-500">Error: {error}</div>}

        {!loading && !error && payments.length === 0 && (
          <div className="text-center py-12 border rounded-md"><Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p className="text-lg font-medium">No upcoming payments</p><p className="text-sm text-gray-500">All active debts have due dates beyond your selected range.</p></div>
        )}

        {!loading && !error && payments.length > 0 && (
          filters.viewMode === "list" ? (
            <ListView payments={payments} onMarkPaid={handleMarkPaid} />
          ) : (
            <CalendarView payments={payments} onDateClick={handleDateClick} />
          )
        )}
      </div>

      <MarkPaidModal isOpen={markPaidModalOpen} payment={selectedPayment} onClose={() => { setMarkPaidModalOpen(false); setSelectedPayment(null); }} onConfirm={handleConfirmMarkPaid} />
      <ExportModal isOpen={exportModalOpen} payments={payments} onClose={() => setExportModalOpen(false)} />
      <DateClickModal isOpen={dateClickModalOpen} date={clickedDate} payments={clickedPayments} onClose={() => setDateClickModalOpen(false)} onMarkPaid={handleMarkPaidFromModal} />
    </div>
  );
};

export default PaymentSchedulePage;