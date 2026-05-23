// src/renderer/pages/debtors/credit-check/hooks/useCreditCheck.ts
import { useState, useCallback, useEffect, useRef } from "react";
import { dialogs } from "../../../../utils/dialogs";
import type { Borrower } from "../../../../api/core/borrower";
import type { CreditScore, CreditReport } from "../types";
import creditCheckAPI, { type CreditCheckLog } from "../../../../api/core/credit_check";

const generateReportFromScore = (debtor: Borrower, score: CreditScore): CreditReport => {
  return {
    debtorId: debtor.id,
    debtorName: debtor.name,
    score,
    paymentHistory: "Payment history retrieved from system",
    outstandingDebts: 0,
    overdueDebts: 0,
    recommendations:
      score.score >= 700
        ? "Low risk – eligible for loan."
        : score.score >= 500
        ? "Medium risk – may require collateral."
        : "High risk – improve credit history before applying.",
  };
};

const useCreditCheck = () => {
  const [selectedDebtor, setSelectedDebtor] = useState<Borrower | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [checkingCredit, setCheckingCredit] = useState(false);
  const [report, setReport] = useState<CreditReport | null>(null);
  const [previousChecks, setPreviousChecks] = useState<CreditCheckLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  
  const currentPageRef = useRef(1);
  const logsLimit = 10;

  // Helper to load logs for a specific page
  const loadLogsPage = useCallback(async (
    debtorId: number, 
    debtorName: string, 
    page: number, 
    resetList: boolean
  ) => {
    setLoadingLogs(true);
    try {
      const response = await creditCheckAPI.getHistory(debtorId, page, logsLimit);
      console.log("[CreditCheck] History response:", response);
      
      if (response.status && response.data) {
        // response.data is PaginatedResult<CreditCheckLog>
        const items = response.data.data || [];
        const pagination = response.data.pagination;
        console.log(`[CreditCheck] Got ${items.length} logs, total ${pagination?.total || 0}`);
        
        const mappedLogs: CreditCheckLog[] = items.map((log: any) => ({
          id: log.id,
          debtorId: log.debtorId,
          debtorName: debtorName,
          score: log.score ?? log.creditScore ?? 0,
          riskLevel: log.riskLevel ?? "Unknown",
          remarks: log.remarks ?? "",
          dateChecked: log.dateChecked || log.createdAt,
          createdAt: log.createdAt,
        }));

        if (resetList) {
          setPreviousChecks(mappedLogs);
        } else {
          setPreviousChecks(prev => [...prev, ...mappedLogs]);
        }
        setHasMoreLogs(page < (pagination?.total || 1));
        currentPageRef.current = page;
      } else {
        console.error("[CreditCheck] API error:", response.message);
        if (resetList) setPreviousChecks([]);
        setHasMoreLogs(false);
      }
    } catch (err) {
      console.error("[CreditCheck] Failed to load history:", err);
      if (resetList) setPreviousChecks([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Load first page when debtor changes
  useEffect(() => {
    if (!selectedDebtor) {
      setPreviousChecks([]);
      setHasMoreLogs(false);
      return;
    }
    loadLogsPage(selectedDebtor.id, selectedDebtor.name, 1, true);
  }, [selectedDebtor, loadLogsPage]);

  const loadMoreLogs = useCallback(() => {
    if (!selectedDebtor || loadingLogs || !hasMoreLogs) return;
    const nextPage = currentPageRef.current + 1;
    loadLogsPage(selectedDebtor.id, selectedDebtor.name, nextPage, false);
  }, [selectedDebtor, loadingLogs, hasMoreLogs, loadLogsPage]);

  const performCheck = useCallback(async (debtor: Borrower) => {
    setCheckingCredit(true);
    setCreditScore(null);
    setReport(null);
    try {
      const response = await creditCheckAPI.performCheck(debtor.id);
      if (response.status) {
        const score = response.data;
        setCreditScore(score);
        // Reload logs from first page to include the new check
        await loadLogsPage(debtor.id, debtor.name, 1, true);
        const newReport = generateReportFromScore(debtor, score);
        setReport(newReport);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message || "Credit check failed");
    } finally {
      setCheckingCredit(false);
    }
  }, [loadLogsPage]);

  const downloadReport = useCallback(() => {
    if (!report) return;
    const content = `...`; // unchanged
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit_report_${report.debtorName}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  return {
    selectedDebtor,
    setSelectedDebtor,
    creditScore,
    checkingCredit,
    performCheck,
    report,
    downloadReport,
    previousChecks,
    loadingLogs,
    hasMoreLogs,
    loadMoreLogs,
  };
};

export default useCreditCheck;