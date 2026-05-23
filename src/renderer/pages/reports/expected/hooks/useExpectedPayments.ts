// src/renderer/pages/reports/expected/hooks/useExpectedPayments.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import debtsAPI from "../../../../api/core/debt";
import groupsAPI from "../../../../api/core/group";
import type { Debt } from "../../../../api/core/debt";
import type { ExpectedPayment, ExpectedReport } from "../types";
import { format, addDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const useExpectedPayments = () => {
  const [relevantDebts, setRelevantDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState<string>(() => format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("week");
  const [selectedGroupId, setSelectedGroupId] = useState<number | "all">("all");

  // Fetch debts for the selected period and group
  const fetchExpectedPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let borrowerId: number | undefined = undefined;
      if (selectedGroupId !== "all") {
        // Fetch group members to get debtor IDs
        const membersRes = await groupsAPI.getMembers(selectedGroupId);
        if (!membersRes.status) throw new Error(membersRes.message);
        const debtorIds = membersRes.data.data.map(m => m.debtorId);
        // Note: debtsAPI.getAll does not accept an array of borrowerIds, so we cannot filter multiple borrowers at once.
        // We would need a backend endpoint that accepts an array of borrowerIds. For now, we'll fetch all debts in date range and filter client-side by debtorIds.
        // But that defeats performance. Instead, we'll fetch debts for each borrower? That's many calls. Better to add a backend endpoint.
        // Let's keep it simple: if group is selected, we'll fetch all debts in date range, then filter by group member IDs client-side.
        // Since date range already limits data, and groups likely small, this is acceptable.
        // We'll still fetch all debts within date range without borrower filter, then filter.
        const debtsRes = await debtsAPI.getAll({
          status: "active",
          includeDeleted: false,
          dueDateFrom: fromDate,
          dueDateTo: toDate,
          limit: 1000, // assume reasonable limit
        });
        if (!debtsRes.status) throw new Error(debtsRes.message);
        let debts = debtsRes.data.data;
        // Filter by group debtor IDs
        debts = debts.filter(debt => debtorIds.includes(debt.borrower?.id as number));
        setRelevantDebts(debts);
      } else {
        // No group filter: fetch all debts in date range
        const debtsRes = await debtsAPI.getAll({
          status: "active",
          includeDeleted: false,
          dueDateFrom: fromDate,
          dueDateTo: toDate,
          limit: 1000,
        });
        if (!debtsRes.status) throw new Error(debtsRes.message);
        setRelevantDebts(debtsRes.data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedGroupId]);

  useEffect(() => {
    fetchExpectedPayments();
  }, [fetchExpectedPayments]);

  // Expected payments aggregation (unchanged, but uses relevantDebts)
  const expectedData = useMemo((): ExpectedReport | null => {
    if (!relevantDebts.length) return null;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    let intervals: Date[];
    if (groupBy === "day") intervals = eachDayOfInterval({ start, end });
    else if (groupBy === "week") intervals = eachWeekOfInterval({ start, end });
    else intervals = eachMonthOfInterval({ start, end });

    const data: ExpectedPayment[] = intervals.map(interval => {
      let intervalStart: Date, intervalEnd: Date;
      if (groupBy === "day") {
        intervalStart = interval;
        intervalEnd = interval;
      } else if (groupBy === "week") {
        intervalStart = startOfWeek(interval);
        intervalEnd = endOfWeek(interval);
      } else {
        intervalStart = startOfMonth(interval);
        intervalEnd = endOfMonth(interval);
      }
      const debtsInInterval = relevantDebts.filter(debt => {
        const due = new Date(debt.dueDate);
        return due >= intervalStart && due <= intervalEnd;
      });
      const amount = debtsInInterval.reduce((sum, d) => sum + d.remainingAmount, 0);
      const details = debtsInInterval.map(d => ({
        debtId: d.id,
        debtName: d.name,
        debtorName: d.borrower?.name || "Unknown",
        amount: d.remainingAmount,
      }));
      return {
        date: format(interval, groupBy === "day" ? "yyyy-MM-dd" : groupBy === "week" ? "'W'ww yyyy" : "yyyy-MM"),
        amount,
        debtorCount: new Set(debtsInInterval.map(d => d.borrower?.id)).size,
        debtCount: debtsInInterval.length,
        details,
      };
    });

    const totalExpected = data.reduce((sum, d) => sum + d.amount, 0);
    return { period: { from: fromDate, to: toDate }, groupBy, totalExpected, data };
  }, [relevantDebts, fromDate, toDate, groupBy]);

  const refresh = () => {
    fetchExpectedPayments();
  };

  return {
    loading,
    error,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    groupBy,
    setGroupBy,
    selectedGroupId,
    setSelectedGroupId,
    expectedData,
    refresh,
  };
};

export default useExpectedPayments;