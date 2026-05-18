// src/renderer/pages/reports/collection/types.ts
export interface CollectionDataPoint {
  date: string;               // YYYY-MM-DD
  actualCollected: number;
  expectedCollected: number;
}

export interface CollectionReport {
  period: {
    from: string;
    to: string;
  };
  totalActual: number;
  totalExpected: number;
  collectionRate: number;
  averagePerDay: number;
  dataPoints: CollectionDataPoint[];
  paymentsByDebtor: Array<{
    debtorId: number;
    debtorName: string;
    totalPaid: number;
    transactionCount: number;
    lastPaymentDate: string;
  }>;
}