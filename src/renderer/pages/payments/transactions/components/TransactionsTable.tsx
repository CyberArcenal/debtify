// src/renderer/pages/payments/transactions/components/TransactionsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Edit, Trash2, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";

interface TransactionsTableProps {
  transactions: PaymentTransaction[];
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  isAdmin?: boolean;
  onView: (tx: PaymentTransaction) => void;
  onEdit: (tx: PaymentTransaction) => void;
  onDelete: (tx: PaymentTransaction) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onSort,
  sortConfig,
  isAdmin = false,
  onView,
  onEdit,
  onDelete,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };
  return (
    <div
      className="overflow-x-auto rounded-md border"
      style={{ borderColor: "var(--border-color)" }}
    >
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th
              className="px-4 py-2 text-left text-xs font-medium cursor-pointer"
              onClick={() => onSort("paymentDate")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Date {getSortIcon("paymentDate")}
              </div>
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium cursor-pointer"
              onClick={() => onSort("borrower")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Borrower {getSortIcon("borrower")}
              </div>
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium cursor-pointer"
              onClick={() => onSort("debtName")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Debt {getSortIcon("debtName")}
              </div>
            </th>
            <th
              className="px-4 py-2 text-right text-xs font-medium cursor-pointer"
              onClick={() => onSort("amount")}
            >
              <div
                className="flex items-center gap-1 justify-end"
                style={{ color: "var(--text-secondary)" }}
              >
                Amount {getSortIcon("amount")}
              </div>
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Reference
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Notes
            </th>
            {isAdmin && (
              <th
                className="px-4 py-2 text-right text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              onClick={() => onView(tx)}
              className="border-t hover:bg-[var(--card-hover-bg)]"
              style={{ borderColor: "var(--border-color)" }}
            >
              <td
                className="px-4 py-2"
                style={{ color: "var(--text-primary)" }}
              >
                {formatDate(tx.paymentDate)}
              </td>
              <td
                className="px-4 py-2"
                style={{ color: "var(--text-primary)" }}
              >
                {tx.debt?.borrower?.name || "—"}
              </td>
              <td
                className="px-4 py-2"
                style={{ color: "var(--text-primary)" }}
              >
                {tx.debt?.name || "—"}
              </td>
              <td
                className="px-4 py-2 text-right font-medium"
                style={{ color: "var(--success-color)" }}
              >
                {formatCurrency(tx.amount)}
              </td>
              <td
                className="px-4 py-2"
                style={{ color: "var(--text-primary)" }}
              >
                {tx.reference || "—"}
              </td>
              <td
                className="px-4 py-2"
                style={{ color: "var(--text-primary)" }}
              >
                {tx.notes || "—"}
              </td>
              {isAdmin && (
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onView(tx)}
                      className="p-1 rounded hover:bg-[var(--card-hover-bg)]"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1 rounded hover:bg-[var(--card-hover-bg)] hidden"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(tx)}
                      className="p-1 rounded hover:bg-[var(--card-hover-bg)] hidden"
                      style={{ color: "var(--danger-color)" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
