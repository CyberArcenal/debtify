// src/renderer/pages/payments/schedule/types.ts
export interface ScheduledPayment {
  debtId: number;
  debtName: string;
  borrowerId: number;
  borrowerName: string;
  dueDate: string | Date;
  amountDue: number; // remaining balance as of today
  contact: string | null;
  email: string | null;
}

export interface PaymentScheduleFilters {
  dateRange: "30" | "60" | "90" | "all";
  viewMode: "calendar" | "list";
}