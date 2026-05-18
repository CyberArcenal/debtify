// src/renderer/pages/loans/applications/types.ts
export interface LoanApplication {
  id: number;
  debtorId: number | null; // can be null if new debtor is being created
  debtorName: string;
  debtorContact?: string | null;
  debtorEmail?: string | null;
  debtorAddress?: string | null;
  requestedAmount: number;
  purpose: string;
  proposedDueDate: string; // YYYY-MM-DD
  interestRate: number | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
}

export interface LoanApplicationCreateData {
  debtorId?: number | null;
  newDebtor?: {
    name: string;
    contact?: string;
    email?: string;
    address?: string;
    notes?: string;
  };
  requestedAmount: number;
  purpose: string;
  proposedDueDate: string;
  interestRate?: number | null;
}