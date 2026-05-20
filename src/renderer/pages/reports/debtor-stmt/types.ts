// src/renderer/pages/reports/debtor-stmt/types.ts
import type { Debt } from "../../../api/core/debt";
import type { PaymentTransaction } from "../../../api/core/payment_transaction";
import type { PenaltyTransaction } from "../../../api/core/pernalty_transaction";

export interface StatementData {
  debtor: {
    id: number;
    name: string;
    contact?: string | null;
    email?: string | null;
    address?: string | null;
  };
  summary: {
    totalBorrowed: number;
    totalPaid: number;
    totalPenalties: number;
    outstanding: number;
  };
  debts: Debt[];
  payments: PaymentTransaction[];
  penalties: PenaltyTransaction[];
}