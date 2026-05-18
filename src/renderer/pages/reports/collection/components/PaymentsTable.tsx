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
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Payments by Debtor</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium">Debtor</th>
              <th className="px-4 py-2 text-right text-xs font-medium">Total Paid</th>
              <th className="px-4 py-2 text-center text-xs font-medium">Transactions</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.debtorId} className="border-t">
                <td className="px-4 py-2">{p.debtorName}</td>
                <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(p.totalPaid)}</td>
                <td className="px-4 py-2 text-center">{p.transactionCount}</td>
                <td className="px-4 py-2">{formatDate(p.lastPaymentDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTable;