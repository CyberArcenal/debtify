// src/renderer/pages/debtors/credit-check/hooks/useCreditCheck.ts
import { useState, useCallback } from "react";
import { dialogs } from "../../../../utils/dialogs";
import type { Borrower } from "../../../../api/core/borrower";
import type { CreditScore, CreditReport } from "../types";
import creditCheckAPI, { type CreditCheckLog } from "../../../../api/core/credit_check";

// Helper to generate a simple report from the score
const generateReportFromScore = (debtor: Borrower, score: CreditScore): CreditReport => {
  return {
    debtorId: debtor.id,
    debtorName: debtor.name,
    score,
    paymentHistory: "Payment history retrieved from system",
    outstandingDebts: 0, // can be fetched separately if needed
    overdueDebts: 0,
    recommendations:
      score.score >= 700
        ? "Low risk – eligible for loan."
        : score.score >= 500
        ? "Medium risk – may require collateral."
        : "High risk – improve credit history before applying.",
  };
};

interface UseCreditCheckReturn {
  selectedDebtor: Borrower | null;
  setSelectedDebtor: (debtor: Borrower | null) => void;
  creditScore: CreditScore | null;
  checkingCredit: boolean;
  performCheck: (debtor: Borrower) => Promise<void>;
  report: CreditReport | null;
  downloadReport: () => void;
  previousChecks: CreditCheckLog[];
  loadingLogs: boolean;
}

const useCreditCheck = (): UseCreditCheckReturn => {
  const [selectedDebtor, setSelectedDebtor] = useState<Borrower | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [checkingCredit, setCheckingCredit] = useState(false);
  const [report, setReport] = useState<CreditReport | null>(null);
  const [previousChecks, setPreviousChecks] = useState<CreditCheckLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadPreviousChecks = useCallback(async (debtorId: number) => {
    setLoadingLogs(true);
    try {
      const response = await creditCheckAPI.getHistory(debtorId);
      if (response.status) {
        const logs: CreditCheckLog[] = response.data.map((log) => ({
          id: log.id,
          debtorId: log.debtorId,
          debtorName: log.debtorName as string,
          score: log.score as number,
          riskLevel: log.riskLevel,
          remarks: log.remarks,
          dateChecked: log.dateChecked || log.createdAt,
          createdAt: log.createdAt,
          timestamp: log.createdAt,
        }));
        setPreviousChecks(logs);
      } else {
        setPreviousChecks([]);
      }
    } catch (err) {
      console.error(err);
      setPreviousChecks([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const performCheck = useCallback(
    async (debtor: Borrower) => {
      setCheckingCredit(true);
      setCreditScore(null);
      setReport(null);
      try {
        const response = await creditCheckAPI.performCheck(debtor.id);
        if (response.status) {
          const score = response.data;
          setCreditScore(score);
          await loadPreviousChecks(debtor.id);
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
    },
    [loadPreviousChecks]
  );

  const downloadReport = useCallback(() => {
    if (!report) return;
    const content = `
      CREDIT REPORT
      =============
      Debtor: ${report.debtorName} (ID: ${report.debtorId})
      Date: ${new Date().toLocaleString()}
      
      Credit Score: ${report.score.score}
      Risk Level: ${report.score.riskLevel}
      Remarks: ${report.score.remarks}
      
      Payment History: ${report.paymentHistory || "N/A"}
      Outstanding Debts: ₱${report.outstandingDebts?.toLocaleString() || "0"}
      Overdue Debts: ${report.overdueDebts || 0}
      
      Recommendations: ${report.recommendations || "N/A"}
    `;
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
  };
};

export default useCreditCheck;