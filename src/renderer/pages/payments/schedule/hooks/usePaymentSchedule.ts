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
  markAsPaid: (debtId: number, amount: number, paymentDate: string) => Promise<void>;
}

const usePaymentSchedule = (): UsePaymentScheduleReturn => {
  const [allDebts, setAllDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentScheduleFilters>({
    dateRange: "30",
    viewMode: "list",
  });

  const fetchActiveDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtsAPI.getAll({
        status: "active",
        includeDeleted: false,
        limit: 10000,
      });
      if (!response.status) throw new Error(response.message);
      setAllDebts(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveDebts();
  }, [fetchActiveDebts]);

  // Generate scheduled payments from active debts
  const payments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffDays = filters.dateRange === "all" ? Infinity : parseInt(filters.dateRange);
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() + cutoffDays);

    return allDebts
      .filter(debt => {
        const dueDate = new Date(debt.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) return false; // ignore overdue? But we want to show overdue as well? Keep all active debts with due date >= today? Actually schedule should show future payments. We'll show only future due dates.
        return dueDate <= cutoffDate;
      })
      .map(debt => ({
        debtId: debt.id,
        debtName: debt.name,
        borrowerId: debt.borrower?.id,
        borrowerName: debt.borrower?.name || "Unknown",
        dueDate: debt.dueDate,
        amountDue: debt.remainingAmount,
        contact: debt.borrower?.contact || null,
        email: debt.borrower?.email || null,
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [allDebts, filters.dateRange]);

  const markAsPaid = async (debtId: number, amount: number, paymentDate: string) => {
    try {
      await paymentsAPI.create({
        amount,
        paymentDate,
        reference: `Scheduled payment on ${paymentDate}`,
        notes: null,
        debtId,
      });
      // Refresh debts list to get updated remaining amounts
      await fetchActiveDebts();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const refresh = () => fetchActiveDebts();

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