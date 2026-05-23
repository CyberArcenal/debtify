import { useState, useEffect, useCallback } from 'react';
import { format, subDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import dashboardAPI from '../../../api/analytics/analytics';
import paymentsAPI from '../../../api/core/payment_transaction';
import debtsAPI from '../../../api/core/debt';
import borrowersAPI from '../../../api/core/borrower';

export interface DebtDashboardData {
  totalOutstanding: number;
  overdueAmount: number;
  collectionRate: number;
  activeDebtors: number;
  currentPeriod: {
    collected: number;
    expected: number;
    newDebts: number;
    newDebtors: number;
  };
  collectionTrend: Array<{ date: string; amount: number }>;
  agingBuckets: {
    current: { amount: number; percentage: number };
    days30: { amount: number; percentage: number };
    days60: { amount: number; percentage: number };
    days90plus: { amount: number; percentage: number };
  };
  topDebtors: Array<{ id: number; name: string; outstanding: number; daysOverdue: number }>;
  recentActivities: Array<{
    id: number;
    action: string;
    entity: string;
    entityId: number;
    user: string;
    timestamp: string;
    details?: string;
  }>;
  stats: {
    totalBorrowers: number;
    totalDebts: number;
    totalPaidDebts: number;
    totalOverdue: number;
    totalPaymentsCollected: number;
    totalPenaltiesCollected: number;
  };
  metadata: {
    period: string;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
    formulaVersion: string;
  };
}

export const useDebtDashboardData = () => {
  const [data, setData] = useState<DebtDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Basic overview & stats
      const [overview, dashboardStats, paymentsStats, debtsStats, salesTrend, recentActs, allDebts, allBorrowers] =
        await Promise.all([
          dashboardAPI.getOverview(),
          dashboardAPI.getDashboardStats(),
          paymentsAPI.getStatistics(),
          debtsAPI.getStatistics(),
          dashboardAPI.getSalesTrend(7),
          dashboardAPI.getRecentActivities(10),
          debtsAPI.getAll({ limit: 1000 }),
          borrowersAPI.getAll({ limit: 1000 }),
        ]);

      if (!overview.status) throw new Error(overview.message);
      if (!dashboardStats.status) throw new Error(dashboardStats.message);
      if (!paymentsStats.status) throw new Error(paymentsStats.message);
      if (!debtsStats.status) throw new Error(debtsStats.message);
      if (!salesTrend.status) throw new Error(salesTrend.message);
      if (!recentActs.status) throw new Error(recentActs.message);
      if (!allDebts.status) throw new Error(allDebts.message);
      if (!allBorrowers.status) throw new Error(allBorrowers.message);

      // ✅ NEW: allDebts.data is directly Debt[]
      const debts = allDebts.data;
      // ✅ NEW: allBorrowers.data is directly Borrower[]
      const borrowers = allBorrowers.data;

      // 2. Compute aging buckets
      const today = new Date();
      const aging = {
        current: 0,
        days30: 0,
        days60: 0,
        days90plus: 0,
      };
      debts.data.forEach((debt) => {
        if (debt.status === 'paid') return;
        const dueDate = new Date(debt.dueDate);
        const diffDays = differenceInDays(today, dueDate);
        if (diffDays <= 0) aging.current += debt.remainingAmount;
        else if (diffDays <= 30) aging.days30 += debt.remainingAmount;
        else if (diffDays <= 60) aging.days60 += debt.remainingAmount;
        else aging.days90plus += debt.remainingAmount;
      });
      const totalAging = aging.current + aging.days30 + aging.days60 + aging.days90plus;
      const agingBuckets = {
        current: { amount: aging.current, percentage: totalAging ? (aging.current / totalAging) * 100 : 0 },
        days30: { amount: aging.days30, percentage: totalAging ? (aging.days30 / totalAging) * 100 : 0 },
        days60: { amount: aging.days60, percentage: totalAging ? (aging.days60 / totalAging) * 100 : 0 },
        days90plus: { amount: aging.days90plus, percentage: totalAging ? (aging.days90plus / totalAging) * 100 : 0 },
      };

      // 3. Top debtors (group by borrower)
      const debtorMap = new Map<number, { name: string; outstanding: number; oldestDueDate?: Date }>();
      debts.data.forEach((debt) => {
        if (debt.status === 'paid') return;
        const borrowerId = debt.borrower?.id;
        if (!borrowerId) return;
        const existing = debtorMap.get(borrowerId);
        const dueDate = new Date(debt.dueDate);
        if (existing) {
          existing.outstanding += debt.remainingAmount;
          if (!existing.oldestDueDate || dueDate < existing.oldestDueDate) {
            existing.oldestDueDate = dueDate;
          }
        } else {
          debtorMap.set(borrowerId, {
            name: debt.borrower?.name || `Borrower ${borrowerId}`,
            outstanding: debt.remainingAmount,
            oldestDueDate: dueDate,
          });
        }
      });
      const topDebtors = Array.from(debtorMap.entries())
        .map(([id, val]) => ({
          id,
          name: val.name,
          outstanding: val.outstanding,
          daysOverdue: val.oldestDueDate ? Math.max(0, differenceInDays(today, val.oldestDueDate)) : 0,
        }))
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 5);

      // 4. Collection trend
      const collectionTrend = salesTrend.data.map((point) => ({
        date: point.date,
        amount: point.total,
      }));

      // 5. Current period metrics
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const periodStart = format(firstOfMonth, 'yyyy-MM-dd');
      const periodEnd = format(today, 'yyyy-MM-dd');
      const periodPayments = await paymentsAPI.getAll({
        paymentDateFrom: periodStart,
        paymentDateTo: periodEnd,
        limit: 1000,
      });
      // ✅ NEW: periodPayments.data is directly PaymentTransaction[]
      const collectedThisPeriod = periodPayments.data.data.reduce((sum, p) => sum + p.amount, 0);
      const expectedThisPeriod = debtsStats.data.totalRemainingBalance; // total remaining of active debts
      const newDebts = debts.data.filter((d) => isAfter(new Date(d.createdAt), firstOfMonth)).length;
      const newDebtors = borrowers.data.filter((b) => isAfter(new Date(b.createdAt), firstOfMonth)).length;

      // 6. Build final object
      const result: DebtDashboardData = {
        totalOutstanding: dashboardStats.data.totalRemainingBalance ?? 0,
        overdueAmount: dashboardStats.data.totalOverdue > 0 ? dashboardStats.data.totalOverdue : aging.days30 + aging.days60 + aging.days90plus,
        collectionRate: dashboardStats.data.totalPaymentsCollected && dashboardStats.data.totalRemainingBalance
          ? (dashboardStats.data.totalPaymentsCollected / (dashboardStats.data.totalPaymentsCollected + dashboardStats.data.totalRemainingBalance)) * 100
          : 0,
        activeDebtors: overview.data.totalCustomers,
        currentPeriod: {
          collected: collectedThisPeriod,
          expected: expectedThisPeriod,
          newDebts,
          newDebtors,
        },
        collectionTrend,
        agingBuckets,
        topDebtors,
        recentActivities: recentActs.data.map((act) => ({
          id: act.id,
          action: act.action,
          entity: act.entity,
          entityId: act.entityId,
          user: act.user,
          timestamp: act.timestamp,
          details: act.details,
        })),
        stats: {
          totalBorrowers: dashboardStats.data.totalBorrowers,
          totalDebts: dashboardStats.data.totalDebts,
          totalPaidDebts: dashboardStats.data.totalPaidDebts,
          totalOverdue: dashboardStats.data.totalOverdue,
          totalPaymentsCollected: dashboardStats.data.totalPaymentsCollected,
          totalPenaltiesCollected: dashboardStats.data.totalPenaltiesCollected,
        },
        metadata: {
          period: 'month',
          periodStart,
          periodEnd,
          generatedAt: new Date().toISOString(),
          formulaVersion: '2.0',
        },
      };
      setData(result);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};