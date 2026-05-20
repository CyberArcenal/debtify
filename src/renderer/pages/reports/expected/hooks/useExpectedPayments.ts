// src/renderer/pages/reports/expected/hooks/useExpectedPayments.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import debtsAPI from "../../../../api/core/debt";
import groupsAPI from "../../../../api/core/group";
import type { Debt } from "../../../../api/core/debt";
import type { ExpectedPayment, ExpectedReport } from "../types";
import { format, addDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const useExpectedPayments = () => {
  const [activeDebts, setActiveDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState<string>(() => format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("week");
  const [selectedGroupId, setSelectedGroupId] = useState<number | "all">("all");
  const [groupDebtorIds, setGroupDebtorIds] = useState<number[]>([]);

  const fetchActiveDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtsAPI.getAll({ status: "active", includeDeleted: false, limit: 10000 });
      if (!response.status) throw new Error(response.message);
      setActiveDebts(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch debtor IDs for the selected group
  const fetchGroupDebtorIds = useCallback(async () => {
    if (selectedGroupId === "all") {
      setGroupDebtorIds([]);
      return;
    }
    try {
      const membersRes = await groupsAPI.getMembers(selectedGroupId);
      if (membersRes.status) {
        const debtorIds = membersRes.data.map(m => m.debtorId);
        setGroupDebtorIds(debtorIds);
      } else {
        setGroupDebtorIds([]);
      }
    } catch (err) {
      console.error("Failed to fetch group members:", err);
      setGroupDebtorIds([]);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchActiveDebts();
  }, [fetchActiveDebts]);

  useEffect(() => {
    fetchGroupDebtorIds();
  }, [fetchGroupDebtorIds]);

  // Filter debts by group if selected
  const filteredDebts = useMemo(() => {
    if (selectedGroupId === "all") return activeDebts;
    return activeDebts.filter(debt => groupDebtorIds.includes(debt.borrower?.id as number));
  }, [activeDebts, selectedGroupId, groupDebtorIds]);

  // Expected payments within date range (unchanged logic)
  const expectedData = useMemo((): ExpectedReport | null => {
    if (!filteredDebts.length) return null;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    const relevantDebts = filteredDebts.filter(debt => {
      const due = new Date(debt.dueDate);
      due.setHours(0,0,0,0);
      return due >= start && due <= end;
    });

    if (relevantDebts.length === 0) return null;

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
  }, [filteredDebts, fromDate, toDate, groupBy]);

  const refresh = () => {
    fetchActiveDebts();
    if (selectedGroupId !== "all") fetchGroupDebtorIds();
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