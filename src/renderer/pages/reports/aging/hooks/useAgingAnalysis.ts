// src/renderer/pages/reports/aging/hooks/useAgingAnalysis.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";
import type { AgingBucket, AgingSummary } from "../types";

const useAgingAnalysis = () => {
  const [allActiveDebts, setAllActiveDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

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
      setAllActiveDebts(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveDebts();
  }, [fetchActiveDebts]);

  // Compute aging buckets based on asOfDate
  const agingSummary = useMemo((): AgingSummary | null => {
    if (!allActiveDebts.length) return null;

    const asOf = new Date(asOfDate);
    asOf.setHours(0, 0, 0, 0);

    // Calculate days overdue for each debt (only future due dates? Aging usually looks at past due)
    // Actually aging analysis: accounts receivable aging shows overdue amounts.
    // For debts not yet due (due date > asOf), they are current (0-30? but often placed in "Current" bucket)
    // Standard buckets: Current (0-30 days from due date? Actually based on invoice date)
    // For simplicity: We'll compute days past due = asOfDate - dueDate (positive if overdue).
    // If due date is after asOfDate, it's "Current" (0 days overdue).
    const debtsWithAging = allActiveDebts.map(debt => {
      const due = new Date(debt.dueDate);
      due.setHours(0, 0, 0, 0);
      let daysPastDue = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPastDue < 0) daysPastDue = 0; // not yet due -> Current
      return { ...debt, daysPastDue };
    });

    // Define buckets
    const buckets: AgingBucket[] = [
      { range: "0-30 days", minDays: 0, maxDays: 30, totalAmount: 0, count: 0, percentage: 0, debts: [] },
      { range: "31-60 days", minDays: 31, maxDays: 60, totalAmount: 0, count: 0, percentage: 0, debts: [] },
      { range: "61-90 days", minDays: 61, maxDays: 90, totalAmount: 0, count: 0, percentage: 0, debts: [] },
      { range: "90+ days", minDays: 91, maxDays: null, totalAmount: 0, count: 0, percentage: 0, debts: [] },
    ];

    for (const debt of debtsWithAging) {
      let bucketIndex = 0;
      if (debt.daysPastDue <= 30) bucketIndex = 0;
      else if (debt.daysPastDue <= 60) bucketIndex = 1;
      else if (debt.daysPastDue <= 90) bucketIndex = 2;
      else bucketIndex = 3;

      buckets[bucketIndex].totalAmount += debt.remainingAmount;
      buckets[bucketIndex].count += 1;
      buckets[bucketIndex].debts.push(debt);
    }

    const totalOutstanding = buckets.reduce((sum, b) => sum + b.totalAmount, 0);
    buckets.forEach(b => {
      b.percentage = totalOutstanding > 0 ? (b.totalAmount / totalOutstanding) * 100 : 0;
    });

    return { asOfDate, totalOutstanding, buckets };
  }, [allActiveDebts, asOfDate]);

  return {
    loading,
    error,
    asOfDate,
    setAsOfDate,
    agingSummary,
    refresh: fetchActiveDebts,
  };
};

export default useAgingAnalysis;