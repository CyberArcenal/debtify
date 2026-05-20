// src/renderer/pages/debtors/credit-check/types.ts
export interface CreditScore {
  score: number;          // 300-850
  riskLevel: "Low" | "Medium" | "High";
  remarks: string;
  dateChecked: string;    // ISO string
}

export interface CreditCheckLog {
  id: number;
  debtorId: number;
  debtorName: string;
  score: CreditScore;
  timestamp: string;
}

export interface CreditReport {
  debtorId: number;
  debtorName: string;
  score: CreditScore;
  paymentHistory?: string;
  outstandingDebts?: number;
  overdueDebts?: number;
  recommendations?: string;
}