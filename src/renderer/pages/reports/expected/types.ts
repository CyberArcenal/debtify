// src/renderer/pages/reports/expected/types.ts
export interface ExpectedPayment {
  date: string;
  amount: number;
  debtorCount: number;
  debtCount: number;
  details: Array<{
    debtId: number;
    debtName: string;
    debtorName: string;
    amount: number;
  }>;
}

export interface ExpectedReport {
  period: { from: string; to: string };
  groupBy: "day" | "week" | "month";
  totalExpected: number;
  data: ExpectedPayment[];
}