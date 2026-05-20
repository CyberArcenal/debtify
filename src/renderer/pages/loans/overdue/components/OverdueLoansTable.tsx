// src/renderer/pages/loans/overdue/components/OverdueLoansTable.tsx
import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Bell,
  CreditCard,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";
import type { OverdueLoan } from "../hooks/useOverdueLoans";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

const getDaysOverdueClass = (days: number): string => {
  if (days >= 90) return "bg-red-700 text-white";
  if (days >= 60) return "bg-red-600 text-white";
  if (days >= 30) return "bg-orange-600 text-white";
  return "bg-yellow-600 text-white";
};

interface OverdueLoansTableProps {
  loans: OverdueLoan[];
  selectedLoans: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onSendReminder: (loan: OverdueLoan) => void;
  onRecordPayment: (loan: OverdueLoan) => void;
  onApplyPenalty: (loan: OverdueLoan) => void;
}

const OverdueLoansTable: React.FC<OverdueLoansTableProps> = ({
  loans,
  selectedLoans,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onSendReminder,
  onRecordPayment,
  onApplyPenalty,
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
            <th className="w-10 px-2 py-3">
              <input
                type="checkbox"
                checked={
                  loans.length > 0 && selectedLoans.length === loans.length
                }
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded"
                style={{ accentColor: "var(--primary-color)" }}
              />
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("name")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Debt Name {getSortIcon("name")}
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("borrower")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Borrower / Contact {getSortIcon("borrower")}
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("remainingAmount")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Remaining {getSortIcon("remainingAmount")}
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("dueDate")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Due Date {getSortIcon("dueDate")}
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("daysOverdue")}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Days Overdue {getSortIcon("daysOverdue")}
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Penalty
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr
              key={loan.id}
              className="hover:bg-[var(--card-hover-bg)] transition-colors border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <td className="px-2 py-3">
                <input
                  type="checkbox"
                  checked={selectedLoans.includes(loan.id)}
                  onChange={() => onToggleSelect(loan.id)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--primary-color)" }}
                />
              </td>
              <td
                className="px-4 py-3 font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {loan.name}
              </td>
              <td className="px-4 py-3">
                <div style={{ color: "var(--text-primary)" }}>
                  {loan.borrower?.name || "—"}
                </div>
                {loan.borrower?.contact && (
                  <div
                    className="text-xs flex items-center gap-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Phone className="w-3 h-3" /> {loan.borrower.contact}
                  </div>
                )}
                {loan.borrower?.email && (
                  <div
                    className="text-xs flex items-center gap-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Mail className="w-3 h-3" /> {loan.borrower.email}
                  </div>
                )}
              </td>
              <td
                className="px-4 py-3 font-semibold"
                style={{ color: "var(--debt-high)" }}
              >
                {formatCurrency(loan.remainingAmount)}
              </td>
              <td
                className="px-4 py-3"
                style={{ color: "var(--text-primary)" }}
              >
                {formatDate(loan.dueDate)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${getDaysOverdueClass(loan.daysOverdue)}`}
                >
                  {loan.daysOverdue} days
                </span>
              </td>
              <td
                className="px-4 py-3"
                style={{ color: "var(--text-primary)" }}
              >
                {loan.penaltyAmount ? formatCurrency(loan.penaltyAmount) : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onSendReminder(loan)}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]"
                    style={{ color: "var(--accent-blue)" }}
                    title="Send Reminder"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRecordPayment(loan)}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]"
                    style={{ color: "var(--success-color)" }}
                    title="Record Payment"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onApplyPenalty(loan)}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]"
                    style={{ color: "var(--warning-color)" }}
                    title="Apply Penalty"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OverdueLoansTable;
