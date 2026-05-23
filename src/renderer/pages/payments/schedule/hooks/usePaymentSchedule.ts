// src/renderer/pages/payments/schedule/hooks/usePaymentSchedule.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { ScheduledPayment, PaymentScheduleFilters } from "../types";
import paymentsAPI from "../../../../api/core/payment_transaction";

interface UsePaymentScheduleReturn {
  payments: ScheduledPayment[];
  loading: boolean;
  error: string | null;
  filters: PaymentScheduleFilters;
  setFilters: React.Dispatch<React.SetStateAction<PaymentScheduleFilters>>;
  refresh: () => void;
  markAsPaid: (debtId: number, amount: number, paymentDate: string, methodId: number) => Promise<void>;
}

const usePaymentSchedule = (): UsePaymentScheduleReturn => {
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentScheduleFilters>({
    dateRange: "30",
    viewMode: "list",
  });

  const fetchUpcomingPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoffDays = filters.dateRange === "all" ? 365 : parseInt(filters.dateRange);
      const cutoffDate = new Date(today);
      cutoffDate.setDate(today.getDate() + cutoffDays);

      const response = await debtsAPI.getAll({
        status: "active",
        includeDeleted: false,
        dueDateFrom: today.toISOString().split('T')[0],
        dueDateTo: cutoffDate.toISOString().split('T')[0],
        limit: 500, // sufficient for upcoming payments
        sortBy: "dueDate",
        sortOrder: "ASC",
      });
      if (!response.status) throw new Error(response.message);

      const debts = response.data.data; // array of debts
      const scheduled: ScheduledPayment[] = debts.map(debt => ({
        debtId: debt.id,
        debtName: debt.name,
        borrowerId: debt.borrower?.id ?? 0, // fallback to 0 if borrower missing (should not happen for active debts)
        borrowerName: debt.borrower?.name || "Unknown",
        dueDate: debt.dueDate,
        amountDue: debt.remainingAmount,
        contact: debt.borrower?.contact || null,
        email: debt.borrower?.email || null,
      }));
      setPayments(scheduled);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange]);

  useEffect(() => {
    fetchUpcomingPayments();
  }, [fetchUpcomingPayments]);

  const markAsPaid = async (debtId: number, amount: number, paymentDate: string, methodId: number) => {
    try {
      await paymentsAPI.create({
        amount,
        paymentDate,
        reference: `Scheduled payment on ${paymentDate}`,
        notes: null,
        debtId,
        methodId,
      });
      await fetchUpcomingPayments();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const refresh = () => fetchUpcomingPayments();

  return {
    payments,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    markAsPaid,
  };
};

export default usePaymentSchedule;