// src/renderer/pages/reports/aging/hooks/useAgingAnalysis.ts
import { useState, useEffect, useCallback } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { AgingSummary } from "../types";

const useAgingAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [agingSummary, setAgingSummary] = useState<AgingSummary | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtsAPI.getAgingSummary(asOfDate);
      if (!response.status) throw new Error(response.message);
      setAgingSummary(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refresh = () => fetchSummary();

  return {
    loading,
    error,
    asOfDate,
    setAsOfDate,
    agingSummary,
    refresh,
  };
};

export default useAgingAnalysis;