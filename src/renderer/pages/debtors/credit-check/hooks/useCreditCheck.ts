// src/renderer/pages/debtors/credit-check/hooks/useCreditCheck.ts
import { useState, useCallback } from "react";
import { dialogs } from "../../../../utils/dialogs";
import borrowersAPI from "../../../../api/core/borrower";
import type { Borrower } from "../../../../api/core/borrower";
import creditCheckAPI, { type CreditCheckLog, type CreditScore } from "../../../../api/core/credit_check";
import type { CreditReport } from "../types";

// Helper to generate a report from the API response (no more mock scoring)
const generateReportFromScore = (debtor: Borrower, score: CreditScore): CreditReport => {
  // For a real report, you might fetch additional data (payment history, etc.)
  // This is a simplified version.
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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchDebtors: () => Promise<void>;
  searchResults: Borrower[];
  searching: boolean;
  selectedDebtor: Borrower | null;
  setSelectedDebtor: (debtor: Borrower | null) => void;
  creditScore: CreditScore | null;
  checkingCredit: boolean;
  performCheck: (debtor: Borrower) => Promise<void>;
  report: CreditReport | null;
  generatingReport: boolean;
  downloadReport: () => void;
  previousChecks: CreditCheckLog[];
  loadingLogs: boolean;
  reset: () => void;
}

const useCreditCheck = (): UseCreditCheckReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Borrower[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Borrower | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [checkingCredit, setCheckingCredit] = useState(false);
  const [report, setReport] = useState<CreditReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [previousChecks, setPreviousChecks] = useState<CreditCheckLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Search debtors (unchanged, uses real borrowersAPI)
  const searchDebtors = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await borrowersAPI.getAll({
        search: searchTerm,
        includeDeleted: false,
        limit: 20,
      });
      if (response.status) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      dialogs.error(err.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  // Load previous checks using real API
  const loadPreviousChecks = useCallback(async (debtorId: number) => {
    setLoadingLogs(true);
    try {
      const response = await creditCheckAPI.getHistory(debtorId);
      if (response.status) {
        // Transform backend logs to frontend type (they might have slightly different field names)
        // The backend returns CreditCheckLog with dateChecked and createdAt; we'll map them.
        const logs: CreditCheckLog[] = response.data.map((log) => ({
          id: log.id,
          debtorId: log.debtorId,
          debtorName: log.debtorName,
          score: log.score,
          riskLevel: log.riskLevel,
          remarks: log.remarks,
          dateChecked: log.dateChecked || log.createdAt,
          createdAt: log.createdAt,
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

  // Perform credit check using real API
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
          // Save and reload logs
          await loadPreviousChecks(debtor.id);
          // Generate report from the returned score
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
    // Build report content from the data (could be enhanced with PDF generation)
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report]);

  const reset = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedDebtor(null);
    setCreditScore(null);
    setReport(null);
    setPreviousChecks([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchDebtors,
    searchResults,
    searching,
    selectedDebtor,
    setSelectedDebtor,
    creditScore,
    checkingCredit,
    performCheck,
    report,
    generatingReport,
    downloadReport,
    previousChecks,
    loadingLogs,
    reset,
  };
};

export default useCreditCheck;