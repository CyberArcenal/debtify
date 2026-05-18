// src/renderer/pages/reports/aging/types.ts
import type { Debt } from "../../../api/core/debt";

export interface AgingBucket {
  range: string;        // "0-30 days", "31-60 days", "61-90 days", "90+ days"
  minDays: number;
  maxDays: number | null;
  totalAmount: number;
  count: number;
  percentage: number;
  debts: Debt[];
}

export interface AgingSummary {
  asOfDate: string;
  totalOutstanding: number;
  buckets: AgingBucket[];
}