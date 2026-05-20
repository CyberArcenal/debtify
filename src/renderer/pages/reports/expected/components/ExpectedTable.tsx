// src/renderer/pages/reports/expected/components/ExpectedTable.tsx
import React from "react";
import type { ExpectedReport, ExpectedPayment } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface ExpectedTableProps {
  report: ExpectedReport;
  onRowClick?: (details: ExpectedPayment["details"], period: string) => void;
}

const ExpectedTable: React.FC<ExpectedTableProps> = ({ report, onRowClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded-md" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {report.groupBy === "day" ? "Date" : report.groupBy === "week" ? "Week" : "Month"}
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Expected Amount</th>
            <th className="px-4 py-2 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Debtors</th>
            <th className="px-4 py-2 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Debts</th>
            <th className="px-4 py-2 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Details</th>
          </tr>
        </thead>
        <tbody>
          {report.data.map(item => (
            <tr key={item.date} className="border-t hover:bg-[var(--card-hover-bg)]" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{item.date}</td>
              <td className="px-4 py-2 text-right font-medium" style={{ color: "var(--success-color)" }}>{formatCurrency(item.amount)}</td>
              <td className="px-4 py-2 text-center" style={{ color: "var(--text-primary)" }}>{item.debtorCount}</td>
              <td className="px-4 py-2 text-center" style={{ color: "var(--text-primary)" }}>{item.debtCount}</td>
              <td className="px-4 py-2 text-center">
                <button onClick={() => onRowClick?.(item.details, item.date)} className="text-sm underline" style={{ color: "var(--accent-blue)" }}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot style={{ backgroundColor: "var(--card-secondary-bg)", fontWeight: "bold" }}>
          <tr>
            <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>Total</td>
            <td className="px-4 py-2 text-right" style={{ color: "var(--success-color)" }}>{formatCurrency(report.totalExpected)}</td>
            <td className="px-4 py-2 text-center">-</td>
            <td className="px-4 py-2 text-center">-</td>
            <td className="px-4 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ExpectedTable;