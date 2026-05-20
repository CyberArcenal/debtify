// src/renderer/pages/reports/collection/components/PaymentsTable.tsx
import React from "react";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface PaymentsTableProps {
  payments: Array<{
    debtorId: number;
    debtorName: string;
    totalPaid: number;
    transactionCount: number;
    lastPaymentDate: string;
  }>;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments }) => {
  return (
    <div className="rounded-lg border p-4 shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Payments by Debtor</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Debtor</th>
              <th className="px-4 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Total Paid</th>
              <th className="px-4 py-2 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Transactions</th>
              <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.debtorId} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{p.debtorName}</td>
                <td className="px-4 py-2 text-right font-medium" style={{ color: "var(--success-color)" }}>{formatCurrency(p.totalPaid)}</td>
                <td className="px-4 py-2 text-center" style={{ color: "var(--text-primary)" }}>{p.transactionCount}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{formatDate(p.lastPaymentDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTable;