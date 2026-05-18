// src/renderer/pages/debtors/credit-check/hooks/useCreditCheck.ts
import { useState, useCallback } from "react";
import { dialogs } from "../../../../utils/dialogs";
import borrowersAPI from "../../../../api/core/borrower";
import debtsAPI from "../../../../api/core/debt";
import type { Borrower } from "../../../../api/core/borrower";
import type { CreditScore, CreditCheckLog, CreditReport } from "../types";
import {
  performCreditCheck,
  saveCreditCheckLog,
  getLogsForDebtor,
  generateMockReport,
} from "../mockCreditService";

interface UseCreditCheckReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchDebtors: () => void;
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

  // Search debtors
  const handleSearch = useCallback(async () => {
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

  // Load previous checks when debtor selected
  const loadPreviousChecks = useCallback(async (debtorId: number) => {
    setLoadingLogs(true);
    try {
      // In a real API, you'd fetch from backend; here we use localStorage
      const logs = getLogsForDebtor(debtorId);
      setPreviousChecks(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Perform credit check
  const performCheck = useCallback(
    async (debtor: Borrower) => {
      setCheckingCredit(true);
      setCreditScore(null);
      setReport(null);
      try {
        // Fetch debts to know if debtor has overdue
        const debtsRes = await debtsAPI.getAll({
          borrowerId: debtor.id,
          limit: 1000,
        });
        const debts = debtsRes.data;
        const hasOverdue = debts.some((d) => d.status === "overdue");
        const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

        const score = await performCreditCheck({
          id: debtor.id,
          name: debtor.name,
          total_debt: totalDebt,
          hasOverdueDebts: hasOverdue,
        });

        setCreditScore(score);

        // Save log
        const log: CreditCheckLog = {
          id: `${Date.now()}-${debtor.id}`,
          debtorId: debtor.id,
          debtorName: debtor.name,
          score,
          timestamp: new Date().toISOString(),
        };
        saveCreditCheckLog(log);
        await loadPreviousChecks(debtor.id);

        // Generate report (but not auto-download)
        const newReport = generateMockReport(
          { ...debtor, total_debt: totalDebt, hasOverdueDebts: hasOverdue },
          score,
        );
        setReport(newReport);
      } catch (err: any) {
        dialogs.error(err.message || "Credit check failed");
      } finally {
        setCheckingCredit(false);
      }
    },
    [loadPreviousChecks],
  );

  const downloadReport = useCallback(() => {
    if (!report) return;
    // Create a simple text/HTML report and trigger download
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
