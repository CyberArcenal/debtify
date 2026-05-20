// src/renderer/pages/reports/collection/hooks/useCollectionReport.ts
import { useState, useEffect, useCallback } from "react";
import { format, eachDayOfInterval, subDays } from "date-fns";
import type { CollectionReport, CollectionDataPoint } from "../types";
import paymentsAPI from "../../../../api/core/payment_transaction";

// Helper to safely format a date to YYYY-MM-DD
const formatDateKey = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const useCollectionReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ from: string; to: string }>(() => {
    const to = new Date();
    const from = subDays(to, 30);
    return { from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") };
  });
  const [target, setTarget] = useState<number>(100000);
  const [report, setReport] = useState<CollectionReport | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const paymentsRes = await paymentsAPI.getAll({
        paymentDateFrom: period.from,
        paymentDateTo: period.to,
        limit: 10000,
      });
      if (!paymentsRes.status) throw new Error(paymentsRes.message);
      const payments = paymentsRes.data;

      const paymentsByDate: Record<string, number> = {};
      const debtorMap = new Map<number, { name: string; total: number; count: number; lastDate: string }>();

      for (const p of payments) {
        // Safely get date key
        const dateKey = formatDateKey(p.paymentDate);
        if (!dateKey) continue;
        paymentsByDate[dateKey] = (paymentsByDate[dateKey] || 0) + p.amount;

        const debtorId = p.debt?.borrower?.id;
        if (debtorId) {
          const existing = debtorMap.get(debtorId);
          const newTotal = (existing?.total || 0) + p.amount;
          const newCount = (existing?.count || 0) + 1;
          const paymentDateStr = formatDateKey(p.paymentDate);
          const lastDate = !existing?.lastDate || paymentDateStr > existing.lastDate ? paymentDateStr : existing.lastDate;
          debtorMap.set(debtorId, {
            name: p.debt?.borrower?.name || `Debtor ${debtorId}`,
            total: newTotal,
            count: newCount,
            lastDate,
          });
        }
      }

      const start = new Date(period.from);
      const end = new Date(period.to);
      const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const dailyExpected = target / daysInPeriod;

      const dateRange = eachDayOfInterval({ start, end });
      const dataPoints: CollectionDataPoint[] = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        return {
          date: dateStr,
          actualCollected: paymentsByDate[dateStr] || 0,
          expectedCollected: dailyExpected,
        };
      });

      const totalActual = Object.values(paymentsByDate).reduce((a, b) => a + b, 0);
      const totalExpected = target;
      const collectionRate = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
      const averagePerDay = totalActual / daysInPeriod;

      const paymentsByDebtor = Array.from(debtorMap.entries()).map(([debtorId, data]) => ({
        debtorId,
        debtorName: data.name,
        totalPaid: data.total,
        transactionCount: data.count,
        lastPaymentDate: data.lastDate,
      })).sort((a, b) => b.totalPaid - a.totalPaid);

      setReport({
        period,
        totalActual,
        totalExpected,
        collectionRate,
        averagePerDay,
        dataPoints,
        paymentsByDebtor,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, target]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const updatePeriod = (from: string, to: string) => setPeriod({ from, to });
  const updateTarget = (newTarget: number) => setTarget(newTarget);
  const refresh = () => fetchReport();

  return {
    loading,
    error,
    period,
    target,
    report,
    updatePeriod,
    updateTarget,
    refresh,
  };
};

export default useCollectionReport;