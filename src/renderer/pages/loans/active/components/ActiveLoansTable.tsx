// src/renderer/pages/loans/active/components/ActiveLoansTable.tsx
import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Debt } from "../../../../api/core/debt";
import { formatCurrency, formatDate, daysUntil } from "../../../../utils/formatters";
import ActiveLoanActionsDropdown from "./ActiveLoanActionsDropdown";

interface ActiveLoansTableProps {
  loans: Debt[];
  selectedLoans: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (loan: Debt) => void;
  onRecordPayment: (loan: Debt) => void;
  onViewSchedule: (loan: Debt) => void;
  onForgiveness: (loan: Debt) => void;
}

const ActiveLoansTable: React.FC<ActiveLoansTableProps> = ({
  loans,
  selectedLoans,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onRecordPayment,
  onViewSchedule,
  onForgiveness,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getDaysLeftClass = (days: number) => {
    if (days < 0) return "text-red-600 font-bold";
    if (days <= 7) return "text-orange-500 font-semibold";
    return "text-green-600";
  };

  return (
    <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--border-color)" }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="w-10 px-2 py-3 text-left">
              <input
                type="checkbox"
                checked={loans.length > 0 && selectedLoans.length === loans.length}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded"
                style={{ accentColor: "var(--primary-color)" }}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("name")}>
              <div className="flex items-center gap-1">Debt Name {getSortIcon("name")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("borrower")}>
              <div className="flex items-center gap-1">Borrower {getSortIcon("borrower")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("totalAmount")}>
              <div className="flex items-center gap-1">Total Amount {getSortIcon("totalAmount")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("remainingAmount")}>
              <div className="flex items-center gap-1">Remaining {getSortIcon("remainingAmount")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("dueDate")}>
              <div className="flex items-center gap-1">Due Date {getSortIcon("dueDate")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Days Left</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => {
            const daysLeft = daysUntil(loan.dueDate);
            return (
              <tr key={loan.id} className="hover:bg-[var(--card-hover-bg)] transition-colors border-b" style={{ borderColor: "var(--border-color)" }}>
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLoans.includes(loan.id)}
                    onChange={() => onToggleSelect(loan.id)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "var(--primary-color)" }}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{loan.name}</td>
                <td className="px-4 py-3">{loan.borrower?.name || "—"}</td>
                <td className="px-4 py-3">{formatCurrency(loan.totalAmount)}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: "var(--debt-high)" }}>{formatCurrency(loan.remainingAmount)}</td>
                <td className="px-4 py-3">{formatDate(loan.dueDate)}</td>
                <td className={`px-4 py-3 ${getDaysLeftClass(daysLeft)}`}>{daysLeft < 0 ? `Overdue by ${-daysLeft} days` : `${daysLeft} days`}</td>
                <td className="px-4 py-3 text-right">
                  <ActiveLoanActionsDropdown
                    loan={loan}
                    onView={onView}
                    onRecordPayment={onRecordPayment}
                    onViewSchedule={onViewSchedule}
                    onForgiveness={onForgiveness}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveLoansTable;