// src/renderer/pages/payments/transactions/components/TransactionsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";

interface TransactionsTableProps {
  transactions: PaymentTransaction[];
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  isAdmin?: boolean;
  onEdit: (tx: PaymentTransaction) => void;
  onDelete: (tx: PaymentTransaction) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onSort, sortConfig, isAdmin = false, onEdit, onDelete }) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => onSort("paymentDate")}><div className="flex items-center gap-1">Date {getSortIcon("paymentDate")}</div></th>
            <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => onSort("borrower")}><div className="flex items-center gap-1">Borrower {getSortIcon("borrower")}</div></th>
            <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => onSort("debtName")}><div className="flex items-center gap-1">Debt {getSortIcon("debtName")}</div></th>
            <th className="px-4 py-2 text-right text-xs font-medium cursor-pointer" onClick={() => onSort("amount")}><div className="flex items-center gap-1 justify-end">Amount {getSortIcon("amount")}</div></th>
            <th className="px-4 py-2 text-left text-xs font-medium">Reference</th>
            <th className="px-4 py-2 text-left text-xs font-medium">Notes</th>
            {isAdmin && <th className="px-4 py-2 text-right text-xs font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{formatDate(tx.paymentDate)}</td>
              <td className="px-4 py-2">{tx.debt?.borrower?.name || "—"}</td>
              <td className="px-4 py-2">{tx.debt?.name || "—"}</td>
              <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(tx.amount)}</td>
              <td className="px-4 py-2">{tx.reference || "—"}</td>
              <td className="px-4 py-2">{tx.notes || "—"}</td>
              {isAdmin && (
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(tx)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(tx)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;