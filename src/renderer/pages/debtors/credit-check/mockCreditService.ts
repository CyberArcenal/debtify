// src/renderer/pages/debtors/credit-check/mockCreditService.ts
import type { CreditScore, CreditCheckLog, CreditReport } from "./types";

// Mock scoring based on debtor's total debt and overdue status
// In real implementation, call external API
export const performCreditCheck = async (debtor: {
  id: number;
  name: string;
  total_debt: number;
  hasOverdueDebts?: boolean;
}): Promise<CreditScore> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let score = 700; // base
  let remarks = "";

  // Reduce score based on debt amount
  if (debtor.total_debt > 50000) score -= 50;
  else if (debtor.total_debt > 20000) score -= 30;
  else if (debtor.total_debt > 5000) score -= 15;

  // Penalty for overdue debts
  if (debtor.hasOverdueDebts) {
    score -= 60;
    remarks = "Has overdue debts.";
  } else {
    remarks = "No overdue debts.";
  }

  // Ensure score within 300-850
  score = Math.min(850, Math.max(300, score));

  let riskLevel: "Low" | "Medium" | "High" = "Medium";
  if (score >= 700) riskLevel = "Low";
  else if (score >= 500) riskLevel = "Medium";
  else riskLevel = "High";

  return {
    score,
    riskLevel,
    remarks,
    dateChecked: new Date().toISOString(),
  };
};

// Local storage key for logs
const STORAGE_KEY = "credit_check_logs";

export const saveCreditCheckLog = (log: CreditCheckLog): void => {
  const logs = getCreditCheckLogs();
  logs.unshift(log); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};

export const getCreditCheckLogs = (): CreditCheckLog[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getLogsForDebtor = (debtorId: number): CreditCheckLog[] => {
  return getCreditCheckLogs().filter(log => log.debtorId === debtorId);
};

export const generateMockReport = (debtor: any, score: CreditScore): CreditReport => {
  return {
    debtorId: debtor.id,
    debtorName: debtor.name,
    score,
    paymentHistory: "On-time payments: 85%",
    outstandingDebts: debtor.total_debt,
    overdueDebts: debtor.hasOverdueDebts ? 1 : 0,
    recommendations:
      score.score >= 700
        ? "Low risk – eligible for loan."
        : score.score >= 500
        ? "Medium risk – may require collateral."
        : "High risk – improve credit history before applying.",
  };
};