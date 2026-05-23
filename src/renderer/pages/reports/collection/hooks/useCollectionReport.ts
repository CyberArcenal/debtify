// src/renderer/pages/reports/collection/hooks/useCollectionReport.ts
import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import paymentsAPI from "../../../../api/core/payment_transaction";
import type { CollectionReport } from "../types";

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
      const response = await paymentsAPI.getCollectionReport(period.from, period.to, target);
      if (!response.status) throw new Error(response.message);
      setReport(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period.from, period.to, target]);

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