export interface AgingBucket {
  range: string;
  minDays: number;
  maxDays: number | null;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface AgingSummary {
  asOfDate: string;
  totalOutstanding: number;
  buckets: AgingBucket[];
}